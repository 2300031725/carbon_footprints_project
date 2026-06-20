from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Dict, Any

from app.core.database import get_db, DatabaseManager
from app.models.schemas import PostCreate, CommentCreate, PostResponse, CommentResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/community", tags=["Community & Leaderboard"])

def serialize_post(doc: dict) -> Dict[str, Any]:
    # format comments
    comments_list = []
    for c in doc.get("comments", []):
        comments_list.append(CommentResponse(
            user_id=str(c.get("user_id")),
            user_name=c.get("user_name", "Anonymous"),
            content=c.get("content", ""),
            created_at=c.get("created_at") if isinstance(c.get("created_at"), str) else c.get("created_at", datetime.now()).isoformat()
        ))
        
    likes_list = [str(l) for l in doc.get("likes", [])]
    
    return {
        "id": str(doc.get("_id") or doc.get("id")),
        "user_id": str(doc.get("user_id")),
        "user_name": doc.get("user_name", "Anonymous"),
        "content": doc.get("content", ""),
        "likes": likes_list,
        "comments": comments_list,
        "created_at": doc.get("created_at") if isinstance(doc.get("created_at"), str) else doc.get("created_at", datetime.now()).isoformat()
    }

@router.get("/posts", response_model=List[PostResponse])
async def list_posts(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    posts_col = db_manager.get_collection("community_posts")
    
    # Seed default community posts if empty
    count = await posts_col.count_documents({})
    if count == 0:
        default_posts = [
            {
                "_id": str(ObjectId()),
                "user_id": str(ObjectId()),
                "user_name": "Greta Ecoist",
                "content": "Just completed my first calculation on EcoTrack! My carbon footprint is 240kg CO2/month, but I'm setting a goal to reduce my electricity usage by 15%. Join me!",
                "likes": [],
                "comments": [],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "_id": str(ObjectId()),
                "user_id": str(ObjectId()),
                "user_name": "SolarSteve",
                "content": "Installing solar panels this weekend! Super excited to cut down my grid power reliance. That should drop my monthly emissions by almost 60kg!",
                "likes": [],
                "comments": [
                    {
                        "user_id": str(ObjectId()),
                        "user_name": "EcoWarrior88",
                        "content": "That's awesome, Steve! Let us know how the installation goes.",
                        "created_at": datetime.now(timezone.utc)
                    }
                ],
                "created_at": datetime.now(timezone.utc)
            }
        ]
        for dp in default_posts:
            await posts_col.insert_one(dp)
            
    cursor = posts_col.find({}).sort("created_at", -1)
    posts = await cursor.to_list(length=100)
    return [serialize_post(p) for p in posts]

@router.post("/posts", response_model=PostResponse)
async def create_post(
    post_in: PostCreate,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    posts_col = db_manager.get_collection("community_posts")
    users_col = db_manager.get_collection("users")
    
    new_post = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "content": post_in.content,
        "likes": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await posts_col.insert_one(new_post)
    
    # Award 10 points for sharing/posting in the community!
    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"points": 10}}
    )
    
    return serialize_post(new_post)

@router.post("/posts/{post_id}/like", response_model=PostResponse)
async def toggle_like(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    posts_col = db_manager.get_collection("community_posts")
    post = await posts_col.find_one({"_id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
        
    likes = list(post.get("likes", []))
    user_id_str = str(current_user["_id"])
    
    if user_id_str in likes:
        likes.remove(user_id_str)
    else:
        likes.append(user_id_str)
        
    await posts_col.update_one({"_id": post_id}, {"$set": {"likes": likes}})
    
    updated_post = await posts_col.find_one({"_id": post_id})
    return serialize_post(updated_post)

@router.post("/posts/{post_id}/comment", response_model=PostResponse)
async def add_comment(
    post_id: str,
    comment_in: CommentCreate,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    posts_col = db_manager.get_collection("community_posts")
    post = await posts_col.find_one({"_id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
        
    new_comment = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "content": comment_in.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    await posts_col.update_one(
        {"_id": post_id},
        {"$push": {"comments": new_comment}}
    )
    
    updated_post = await posts_col.find_one({"_id": post_id})
    return serialize_post(updated_post)

# --- LEADERBOARD ENDPOINTS ---

@router.get("/leaderboard")
async def get_leaderboard(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    users_col = db_manager.get_collection("users")
    
    # Find all active users, sort by points descending
    cursor = users_col.find({"blocked": {"$ne": True}}).sort("points", -1).limit(50)
    users = await cursor.to_list(length=50)
    
    leaderboard = []
    for rank, u in enumerate(users, 1):
        leaderboard.append({
            "rank": rank,
            "user_id": str(u["_id"]),
            "name": u.get("name", "Eco User"),
            "points": u.get("points", 0),
            "sustainability_score": u.get("sustainability_score", 0),
            "badges_count": len(u.get("badges", [])),
            "is_self": str(u["_id"]) == str(current_user["_id"])
        })
        
    return leaderboard
