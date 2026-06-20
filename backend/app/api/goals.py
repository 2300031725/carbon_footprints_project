from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from typing import List, Dict, Any

from app.core.database import get_db, DatabaseManager
from app.models.schemas import GoalCreate, GoalUpdate, GoalResponse, ChallengeCreate, ChallengeResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals & Challenges"])

def serialize_goal(doc: dict) -> Dict[str, Any]:
    return {
        "id": str(doc.get("_id") or doc.get("id")),
        "user_id": str(doc.get("user_id")),
        "category": doc.get("category", ""),
        "title": doc.get("title", ""),
        "target_value": float(doc.get("target_value", 0.0)),
        "progress": float(doc.get("progress", 0.0)),
        "status": doc.get("status", "active"),
        "deadline": doc.get("deadline") if isinstance(doc.get("deadline"), str) else doc.get("deadline", datetime.now()).isoformat(),
        "created_at": doc.get("created_at") if isinstance(doc.get("created_at"), str) else doc.get("created_at", datetime.now()).isoformat()
    }

def serialize_challenge(doc: dict) -> Dict[str, Any]:
    return {
        "id": str(doc.get("_id") or doc.get("id")),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "points": int(doc.get("points", 0)),
        "duration_days": int(doc.get("duration_days", 7)),
        "category": doc.get("category", ""),
        "active": bool(doc.get("active", True))
    }

# --- GOALS ENDPOINTS ---

@router.get("", response_model=List[GoalResponse])
async def list_goals(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    goals_col = db_manager.get_collection("goals")
    cursor = goals_col.find({"user_id": current_user["_id"]})
    goals = await cursor.to_list(length=100)
    return [serialize_goal(g) for g in goals]

@router.post("", response_model=GoalResponse)
async def create_goal(
    goal_in: GoalCreate,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    goals_col = db_manager.get_collection("goals")
    
    new_goal = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "category": goal_in.category,
        "title": goal_in.title,
        "target_value": goal_in.target_value,
        "progress": 0.0,
        "status": "active",
        "deadline": goal_in.deadline,
        "created_at": datetime.now(timezone.utc)
    }
    
    await goals_col.insert_one(new_goal)
    return serialize_goal(new_goal)

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    goal_up: GoalUpdate,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    goals_col = db_manager.get_collection("goals")
    goal = await goals_col.find_one({"_id": goal_id, "user_id": current_user["_id"]})
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
        
    update_fields = {"progress": goal_up.progress}
    if goal_up.status:
        update_fields["status"] = goal_up.status
        
        # If user marked goal as completed and status changed from active, award points
        if goal_up.status == "completed" and goal.get("status") != "completed":
            users_col = db_manager.get_collection("users")
            await users_col.update_one(
                {"_id": current_user["_id"]},
                {"$inc": {"points": 150}}
            )
            
    await goals_col.update_one({"_id": goal_id}, {"$set": update_fields})
    
    updated_goal = await goals_col.find_one({"_id": goal_id})
    return serialize_goal(updated_goal)

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    goals_col = db_manager.get_collection("goals")
    res = await goals_col.delete_one({"_id": goal_id, "user_id": current_user["_id"]})
    
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found.")
        
    return {"message": "Goal deleted successfully."}

# --- CHALLENGES ENDPOINTS ---

@router.get("/challenges", response_model=List[ChallengeResponse])
async def list_challenges(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    challenges_col = db_manager.get_collection("challenges")
    
    # Seed default challenges if none exist
    count = await challenges_col.count_documents({})
    if count == 0:
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
            
    cursor = challenges_col.find({"active": True})
    challenges = await cursor.to_list(length=100)
    return [serialize_challenge(c) for c in challenges]

@router.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: str,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    challenges_col = db_manager.get_collection("challenges")
    participations_col = db_manager.get_collection("challenge_participations")
    
    challenge = await challenges_col.find_one({"_id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
        
    # Check if already joined
    existing = await participations_col.find_one({
        "user_id": current_user["_id"],
        "challenge_id": challenge_id,
        "status": "joined"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already joined this challenge.")
        
    new_participation = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "challenge_id": challenge_id,
        "status": "joined",
        "joined_at": datetime.now(timezone.utc)
    }
    
    await participations_col.insert_one(new_participation)
    return {"message": "You successfully joined the challenge!", "participation_id": new_participation["_id"]}

@router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: str,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    challenges_col = db_manager.get_collection("challenges")
    participations_col = db_manager.get_collection("challenge_participations")
    users_col = db_manager.get_collection("users")
    
    challenge = await challenges_col.find_one({"_id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
        
    participation = await participations_col.find_one({
        "user_id": current_user["_id"],
        "challenge_id": challenge_id,
        "status": "joined"
    })
    
    if not participation:
        raise HTTPException(status_code=400, detail="You have not joined this challenge or have already completed it.")
        
    # Update participation status
    await participations_col.update_one(
        {"_id": participation["_id"]},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Award points
    points_to_add = challenge.get("points", 50)
    user_badges = list(current_user.get("badges", []))
    
    # Check if they should get the "Sustainability Champion" or custom challenge badge
    # Let's say completing 3 challenges earns the "Eco Warrior" badge or a new badge "Challenge Master"
    completed_count = await participations_col.count_documents({
        "user_id": current_user["_id"],
        "status": "completed"
    })
    
    badges_earned = []
    if completed_count >= 3 and "Eco Warrior" not in user_badges:
        user_badges.append("Eco Warrior")
        badges_earned.append("Eco Warrior")
        points_to_add += 300 # bonus
        
    await users_col.update_one(
        {"_id": current_user["_id"]},
        {
            "$inc": {"points": points_to_add},
            "$set": {"badges": user_badges}
        }
    )
    
    return {
        "message": f"Congratulations! You completed the challenge and earned {points_to_add} Eco Points!",
        "badges_earned": badges_earned
    }

@router.get("/participations")
async def get_user_participations(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    participations_col = db_manager.get_collection("challenge_participations")
    cursor = participations_col.find({"user_id": current_user["_id"]})
    parts = await cursor.to_list(length=100)
    
    # Serialize ObjectId fields
    serialized_parts = []
    for p in parts:
        serialized_parts.append({
            "id": str(p["_id"]),
            "user_id": str(p["user_id"]),
            "challenge_id": str(p["challenge_id"]),
            "status": p.get("status"),
            "joined_at": p.get("joined_at") if isinstance(p.get("joined_at"), str) else p.get("joined_at", datetime.now()).isoformat(),
            "completed_at": p.get("completed_at") if isinstance(p.get("completed_at"), str) else (p.get("completed_at").isoformat() if p.get("completed_at") else None)
        })
    return serialized_parts
