from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.core.database import get_db, DatabaseManager
from app.api.deps import get_current_admin
from app.models.schemas import ChallengeCreate, ChallengeResponse, EmissionFactorUpdate

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"], dependencies=[Depends(get_current_admin)])

# --- USER MANAGEMENT ---

@router.get("/users")
async def list_users(db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    cursor = users_col.find({})
    users = await cursor.to_list(length=200)
    
    serialized_users = []
    for u in users:
        serialized_users.append({
            "id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role", "user"),
            "points": u.get("points", 0),
            "blocked": u.get("blocked", False),
            "created_at": u.get("created_at") if isinstance(u.get("created_at"), str) else u.get("created_at", datetime.now()).isoformat()
        })
    return serialized_users

@router.put("/users/{user_id}/block")
async def toggle_block_user(user_id: str, payload: Dict[str, bool], db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    block_status = payload.get("blocked", False)
    
    res = await users_col.update_one(
        {"_id": user_id},
        {"$set": {"blocked": block_status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
        
    action = "blocked" if block_status else "unblocked"
    return {"message": f"User account has been successfully {action}."}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    carbon_col = db_manager.get_collection("carbon_records")
    goals_col = db_manager.get_collection("goals")
    participations_col = db_manager.get_collection("challenge_participations")
    
    # Check existence
    user = await users_col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Delete all associated records
    await users_col.delete_one({"_id": user_id})
    await carbon_col.delete_one({"user_id": user_id})
    await goals_col.delete_one({"user_id": user_id})
    await participations_col.delete_one({"user_id": user_id})
    
    return {"message": "User account and all related carbon, goal, and participation records have been deleted."}

# --- PLATFORM ANALYTICS ---

@router.get("/analytics")
async def get_platform_analytics(db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    carbon_col = db_manager.get_collection("carbon_records")
    participations_col = db_manager.get_collection("challenge_participations")
    goals_col = db_manager.get_collection("goals")
    
    # 1. Total users
    total_users = await users_col.count_documents({})
    active_users = await users_col.count_documents({"blocked": {"$ne": True}})
    
    # 2. Total Carbon Calculations logged
    total_logs = await carbon_col.count_documents({})
    
    # 3. Carbon Saved aggregation
    # Count how many goals have been completed
    completed_goals_count = await goals_col.count_documents({"status": "completed"})
    # Estimated carbon saved: say 100kg CO2 per completed goal
    carbon_saved = completed_goals_count * 100.0
    
    # 4. Challenge stats
    total_joins = await participations_col.count_documents({})
    total_completes = await participations_col.count_documents({"status": "completed"})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_emissions_calculations": total_logs,
        "estimated_carbon_saved_kg": carbon_saved,
        "challenges": {
            "total_participants": total_joins,
            "total_completions": total_completes,
            "completion_rate_pct": round((total_completes / total_joins * 100.0) if total_joins > 0 else 0, 1)
        }
    }

# --- EMISSION FACTORS MANAGEMENT ---

@router.get("/emission-factors")
async def list_emission_factors(db_manager: DatabaseManager = Depends(get_db)):
    factors_col = db_manager.get_collection("emission_factors")
    cursor = factors_col.find({})
    factors = await cursor.to_list(length=100)
    
    serialized = []
    for f in factors:
        serialized.append({
            "id": str(f["_id"]),
            "key": f.get("key"),
            "value": f.get("value"),
            "unit": f.get("unit", "kg CO2"),
            "category": f.get("category", "default")
        })
    return serialized

@router.put("/emission-factors")
async def update_emission_factor(factor_in: EmissionFactorUpdate, db_manager: DatabaseManager = Depends(get_db)):
    factors_col = db_manager.get_collection("emission_factors")
    
    # Check if exists
    existing = await factors_col.find_one({"key": factor_in.key})
    if not existing:
        # Create new
        new_factor = {
            "_id": str(ObjectId()),
            "key": factor_in.key,
            "value": factor_in.value,
            "unit": factor_in.unit,
            "category": factor_in.category
        }
        await factors_col.insert_one(new_factor)
        return {"message": "Emission factor created successfully."}
    else:
        await factors_col.update_one(
            {"key": factor_in.key},
            {"$set": {"value": factor_in.value, "unit": factor_in.unit, "category": factor_in.category}}
        )
        return {"message": "Emission factor updated successfully."}

# --- CHALLENGES MANAGEMENT ---

@router.post("/challenges", response_model=ChallengeResponse)
async def admin_create_challenge(challenge_in: ChallengeCreate, db_manager: DatabaseManager = Depends(get_db)):
    challenges_col = db_manager.get_collection("challenges")
    
    new_challenge = {
        "_id": str(ObjectId()),
        "title": challenge_in.title,
        "description": challenge_in.description,
        "points": challenge_in.points,
        "duration_days": challenge_in.duration_days,
        "category": challenge_in.category,
        "active": True
    }
    
    await challenges_col.insert_one(new_challenge)
    
    # Create community post announcing the challenge automatically!
    posts_col = db_manager.get_collection("community_posts")
    announcement = {
        "_id": str(ObjectId()),
        "user_id": "admin-system",
        "user_name": "EcoTrack System",
        "content": f"📢 NEW WEEKLY CHALLENGE: '{challenge_in.title}'! Join now and earn {challenge_in.points} Eco Points by completing it! Description: {challenge_in.description}",
        "likes": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc)
    }
    await posts_col.insert_one(announcement)
    
    return {
        "id": new_challenge["_id"],
        "title": new_challenge["title"],
        "description": new_challenge["description"],
        "points": new_challenge["points"],
        "duration_days": new_challenge["duration_days"],
        "category": new_challenge["category"],
        "active": new_challenge["active"]
    }

@router.put("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def admin_update_challenge(challenge_id: str, payload: Dict[str, Any], db_manager: DatabaseManager = Depends(get_db)):
    challenges_col = db_manager.get_collection("challenges")
    
    challenge = await challenges_col.find_one({"_id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
        
    update_data = {}
    for field in ["title", "description", "points", "duration_days", "category", "active"]:
        if field in payload:
            update_data[field] = payload[field]
            
    if update_data:
        await challenges_col.update_one({"_id": challenge_id}, {"$set": update_data})
        
    updated = await challenges_col.find_one({"_id": challenge_id})
    return {
        "id": str(updated["_id"]),
        "title": updated.get("title"),
        "description": updated.get("description"),
        "points": updated.get("points"),
        "duration_days": updated.get("duration_days"),
        "category": updated.get("category"),
        "active": updated.get("active")
    }
