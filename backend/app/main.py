import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import db_manager
from app.api import auth, carbon, goals, community, admin
from app.services.ml_prediction import train_prediction_model

logger = logging.getLogger("ecotrack.main")
logging.basicConfig(level=logging.INFO)

async def seed_default_users():
    users_col = db_manager.get_collection("users")
    # Check if admin exists
    admin_exists = await users_col.find_one({"email": "admin@ecotrack.com"})
    if not admin_exists:
        from app.core.security import get_password_hash
        from datetime import datetime, timezone
        admin_user = {
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
            "created_at": datetime.now(timezone.utc),
            "blocked": False
        }
        await users_col.insert_one(admin_user)
        logger.info("Seeded default admin user: admin@ecotrack.com / admin123")

    # Check if user exists
    user_exists = await users_col.find_one({"email": "jane@gmail.com"})
    if not user_exists:
        from app.core.security import get_password_hash
        from datetime import datetime, timezone
        jane_user = {
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
            "created_at": datetime.now(timezone.utc),
            "blocked": False
        }
        await users_col.insert_one(jane_user)
        logger.info("Seeded default user: jane@gmail.com / jane123")

async def seed_default_challenges():
    challenges_col = db_manager.get_collection("challenges")
    count = await challenges_col.count_documents({})
    if count == 0:
        from bson import ObjectId
        default_challenges = [
            {
                "_id": str(ObjectId()),
                "title": "No Plastic Week",
                "description": "Avoid all single-use plastics like straws, water bottles, and bags for 7 days.",
                "points": 100,
                "duration_days": 7,
                "category": "lifestyle",
                "active": True
            },
            {
                "_id": str(ObjectId()),
                "title": "Walk Instead of Drive Challenge",
                "description": "Walk, cycle, or scooter for all trips under 3 kilometers this week.",
                "points": 150,
                "duration_days": 7,
                "category": "transportation",
                "active": True
            },
            {
                "_id": str(ObjectId()),
                "title": "Save Energy Challenge",
                "description": "Unplug standby vampire devices and lower your air-con heating levels for 7 days.",
                "points": 120,
                "duration_days": 7,
                "category": "energy",
                "active": True
            },
            {
                "_id": str(ObjectId()),
                "title": "Meatless Week",
                "description": "Eat a 100% vegetarian or vegan diet for one full week.",
                "points": 200,
                "duration_days": 7,
                "category": "food",
                "active": True
            }
        ]
        for dc in default_challenges:
            await challenges_col.insert_one(dc)
        logger.info("Seeded default sustainability challenges.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database
    logger.info("Initializing EcoTrack Services...")
    await db_manager.connect()
    
    # Seed default users
    try:
        await seed_default_users()
    except Exception as e:
        logger.error(f"Failed to seed default users: {e}")

    # Seed default challenges
    try:
        await seed_default_challenges()
    except Exception as e:
        logger.error(f"Failed to seed default challenges: {e}")
        
    # Train/Verify ML prediction model
    try:
        train_prediction_model()
    except Exception as e:
        logger.error(f"Failed to train ML prediction model: {e}")
        
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down EcoTrack Services...")

app = FastAPI(
    title="EcoTrack - Carbon Footprint Tracker API",
    description="Backend service for tracking, predicting, and reducing carbon emissions.",
    version="1.0.0",
    lifespan=lifespan
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": jsonable_encoder(exc.errors())}
    )

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins. Can be restricted to client URL in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(carbon.router)
app.include_router(goals.router)
app.include_router(community.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "EcoTrack API",
        "version": "1.0.0",
        "database_fallback_active": db_manager.is_fallback
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
