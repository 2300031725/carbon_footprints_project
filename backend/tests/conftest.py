import os
import shutil
import pytest
from fastapi.testclient import TestClient

# Force local database sandboxing for tests
import app.core.database as db_mod
TEST_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_data_sandbox")
db_mod.DATA_DIR = TEST_DATA_DIR

from app.main import app
from app.core.database import db_manager, FileDatabase

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Setup clean sandbox directory
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)
    os.makedirs(TEST_DATA_DIR, exist_ok=True)
    
    # Configure database manager to use isolated FileDatabase for all tests
    db_manager.is_fallback = True
    db_manager.db = FileDatabase()
    
    # Seed default user and admin for API tests
    from app.core.security import get_password_hash
    users_col = db_manager.get_collection("users")
    
    users_col._write_data([
        {
            "_id": "user-456",
            "name": "Jane Doe",
            "email": "jane@gmail.com",
            "password_hash": get_password_hash("jane123"),
            "role": "user",
            "points": 150,
            "badges": ["Green Beginner"],
            "profile": {
                "age": 27,
                "country": "United States",
                "city": "Austin",
                "occupation": "UX Designer",
                "household_size": 1,
                "transportation_preference": "Bicycle",
                "sustainability_interests": ["Zero Waste", "Plant-Based Diet"]
            },
            "blocked": False
        },
        {
            "_id": "admin-123",
            "name": "Eco Admin",
            "email": "admin@ecotrack.com",
            "password_hash": get_password_hash("admin123"),
            "role": "admin",
            "points": 450,
            "badges": ["Green Beginner"],
            "profile": {
                "age": 32,
                "country": "Canada",
                "city": "Toronto",
                "occupation": "Sustainability Director",
                "household_size": 2,
                "transportation_preference": "Electric Vehicle",
                "sustainability_interests": ["Solar Energy", "Recycling"]
            },
            "blocked": False
        }
    ])
    
    yield
    
    # Teardown clean sandbox directory
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
