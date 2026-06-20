import os
import json
import logging
import asyncio
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger("ecotrack.database")
logging.basicConfig(level=logging.INFO)

# Directory for file database fallback
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

class FileCollection:
    def __init__(self, name: str):
        self.name = name
        self.file_path = os.path.join(DATA_DIR, f"{name}.json")
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w") as f:
                json.dump([], f)

    def _read_data(self):
        try:
            with open(self.file_path, "r") as f:
                data = json.load(f)
                return data
        except Exception:
            return []

    def _write_data(self, data):
        with open(self.file_path, "w") as f:
            json.dump(data, f, default=str)

    def _match_query(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            if key == "_id":
                if str(doc.get("_id")) != str(val):
                    return False
            elif isinstance(val, dict):
                # Simple operator checks e.g. {"$in": [...]} or {"$gt": ...}
                doc_val = doc.get(key)
                for op, op_val in val.items():
                    if op == "$in" and doc_val not in op_val:
                        return False
                    elif op == "$nin" and doc_val in op_val:
                        return False
                    elif op == "$gt" and not (doc_val > op_val):
                        return False
                    elif op == "$lt" and not (doc_val < op_val):
                        return False
                    elif op == "$gte" and not (doc_val >= op_val):
                        return False
                    elif op == "$lte" and not (doc_val <= op_val):
                        return False
            else:
                if doc.get(key) != val:
                    return False
        return True

    async def insert_one(self, document):
        data = self._read_data()
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(ObjectId())
        else:
            doc["_id"] = str(doc["_id"])
        
        # Serialize datetimes
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
            elif isinstance(v, dict):
                for sub_k, sub_v in v.items():
                    if isinstance(sub_v, datetime):
                        v[sub_k] = sub_v.isoformat()
        
        data.append(doc)
        self._write_data(data)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def find_one(self, query=None):
        data = self._read_data()
        for doc in data:
            if self._match_query(doc, query):
                return doc
        return None

    def find(self, query=None):
        class FileCursor:
            def __init__(self, data, query, matcher, sort_key=None, sort_dir=-1):
                self.data = data
                self.query = query
                self.matcher = matcher
                self.sort_key = sort_key
                self.sort_dir = sort_dir
                self._limit = None

            def sort(self, key, direction=-1):
                self.sort_key = key
                self.sort_dir = direction
                return self

            def limit(self, limit_val):
                self._limit = limit_val
                return self

            async def to_list(self, length=None):
                results = []
                for doc in self.data:
                    if self.matcher(doc, self.query):
                        results.append(doc)
                if self.sort_key:
                    results.sort(
                        key=lambda x: x.get(self.sort_key) if x.get(self.sort_key) is not None else "",
                        reverse=(self.sort_dir == -1)
                    )
                if self._limit is not None:
                    results = results[:self._limit]
                elif length is not None:
                    results = results[:length]
                return results

        return FileCursor(self._read_data(), query, self._match_query)

    async def update_one(self, query, update):
        data = self._read_data()
        matched = 0
        modified = 0
        for doc in data:
            if self._match_query(doc, query):
                matched += 1
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if isinstance(v, datetime):
                            v = v.isoformat()
                        elif isinstance(v, dict):
                            for sub_k, sub_v in v.items():
                                if isinstance(sub_v, datetime):
                                    v[sub_k] = sub_v.isoformat()
                        
                        # Handle nested sets like "profile.age"
                        if "." in k:
                            parts = k.split(".")
                            curr = doc
                            for part in parts[:-1]:
                                if part not in curr or not isinstance(curr[part], dict):
                                    curr[part] = {}
                                curr = curr[part]
                            curr[parts[-1]] = v
                        else:
                            doc[k] = v
                
                if "$push" in update:
                    for k, v in update["$push"].items():
                        # Handle nested lists
                        parts = k.split(".")
                        curr = doc
                        for part in parts[:-1]:
                            if part not in curr or not isinstance(curr[part], dict):
                                curr[part] = {}
                            curr = curr[part]
                        
                        lst_name = parts[-1]
                        if lst_name not in curr or not isinstance(curr[lst_name], list):
                            curr[lst_name] = []
                        
                        # Convert datetime if present
                        if isinstance(v, datetime):
                            v = v.isoformat()
                        elif isinstance(v, dict):
                            for sub_k, sub_v in v.items():
                                if isinstance(sub_v, datetime):
                                    v[sub_k] = sub_v.isoformat()
                        curr[lst_name].append(v)
                
                modified += 1
                break # Only update first match
        
        if modified > 0:
            self._write_data(data)
            
        class UpdateResult:
            def __init__(self, matched, modified):
                self.matched_count = matched
                self.modified_count = modified
        return UpdateResult(matched, modified)

    async def delete_one(self, query):
        data = self._read_data()
        initial_len = len(data)
        data = [doc for doc in data if not self._match_query(doc, query)]
        deleted = initial_len - len(data)
        if deleted > 0:
            self._write_data(data)
            
        class DeleteResult:
            def __init__(self, deleted):
                self.deleted_count = deleted
        return DeleteResult(deleted)

    async def count_documents(self, query=None):
        data = self._read_data()
        count = 0
        for doc in data:
            if self._match_query(doc, query):
                count += 1
        return count


class FileDatabase:
    def __init__(self):
        self._collections = {}

    def get_collection(self, name: str):
        if name not in self._collections:
            self._collections[name] = FileCollection(name)
        return self._collections[name]


# Database Connection Manager
class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_fallback = False

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
            # Try to connect with a short timeout so it fails quickly if down
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            # Try to ping the database to ensure connection is actually open
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_fallback = False
            logger.info("Successfully connected to MongoDB!")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Falling back to File Database system.")
            self.db = FileDatabase()
            self.is_fallback = True

    def get_collection(self, name: str):
        if self.is_fallback:
            return self.db.get_collection(name)
        else:
            return self.db[name]

db_manager = DatabaseManager()

# Dependency to get db
def get_db():
    return db_manager
