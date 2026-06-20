import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Dict, Any

from app.core.database import get_db, DatabaseManager
from app.models.schemas import CarbonRecordInput, CarbonRecordResponse, DashboardSummary
from app.api.deps import get_current_user
from app.services.calculator import calculate_emissions
from app.services.recommendations import generate_recommendations
from app.services.pdf_generator import generate_carbon_pdf
from app.services.excel_exporter import export_history_to_excel
from app.services.chatbot import get_chatbot_reply
from app.services.ml_prediction import predict_future_emissions

logger = logging.getLogger("ecotrack.api.carbon")
router = APIRouter(prefix="/api/carbon", tags=["Carbon & Analytics"])

def serialize_record(doc: dict) -> Dict[str, Any]:
    """Serialize MongoDB document keys to match CarbonRecordResponse"""
    return {
        "id": str(doc.get("_id") or doc.get("id")),
        "user_id": str(doc.get("user_id")),
        "date": doc.get("date") if isinstance(doc.get("date"), str) else doc.get("date", datetime.now()).isoformat(),
        "transportation": doc.get("transportation", {}),
        "energy": doc.get("energy", {}),
        "food": doc.get("food", {}),
        "lifestyle": doc.get("lifestyle", {}),
        "total_emission": float(doc.get("total_emission", 0.0)),
        "created_at": doc.get("created_at") if isinstance(doc.get("created_at"), str) else doc.get("created_at", datetime.now()).isoformat()
    }

@router.post("/calculate", response_model=CarbonRecordResponse)
async def create_carbon_calculation(
    record_in: CarbonRecordInput,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    users_col = db_manager.get_collection("users")
    
    # Run calculation logic
    calc_results = await calculate_emissions(record_in.model_dump(), db_manager)
    
    # Save calculation record
    new_record = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "transportation": calc_results["transportation"],
        "energy": calc_results["energy"],
        "food": calc_results["food"],
        "lifestyle": calc_results["lifestyle"],
        "total_emission": calc_results["total_emission"],
        "sustainability_score": calc_results["sustainability_score"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await carbon_col.insert_one(new_record)
    
    # Gamification and Points Allocation
    points_gained = 0
    badges_earned = []
    user_badges = list(current_user.get("badges", []))
    
    # Badge 1: Green Beginner for first calculation
    calc_count = await carbon_col.count_documents({"user_id": current_user["_id"]})
    if calc_count == 1 and "Green Beginner" not in user_badges:
        user_badges.append("Green Beginner")
        badges_earned.append("Green Beginner")
        points_gained += 100
        
    # Badge 2: Carbon Reducer for total footprint < 250 kg CO2/month
    if calc_results["total_emission"] < 250.0 and "Carbon Reducer" not in user_badges:
        user_badges.append("Carbon Reducer")
        badges_earned.append("Carbon Reducer")
        points_gained += 200
        
    # Badge 3: Eco Warrior for total footprint < 120 kg CO2/month
    if calc_results["total_emission"] < 120.0 and "Eco Warrior" not in user_badges:
        user_badges.append("Eco Warrior")
        badges_earned.append("Eco Warrior")
        points_gained += 300

    # Add points for calculations (50 pts per calculation log)
    points_gained += 50
    
    new_points_total = current_user.get("points", 0) + points_gained
    
    # Badge 4: Sustainability Champion if points exceed 1000
    if new_points_total >= 1000 and "Sustainability Champion" not in user_badges:
        user_badges.append("Sustainability Champion")
        badges_earned.append("Sustainability Champion")
        points_gained += 500 # bonus
        new_points_total += 500
        
    # Update user score, badges, and points
    await users_col.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "points": new_points_total,
                "badges": user_badges,
                "sustainability_score": calc_results["sustainability_score"]
            }
        }
    )
    
    # Check/Update Goals Progress based on calculations
    goals_col = db_manager.get_collection("goals")
    active_goals = await goals_col.find({"user_id": current_user["_id"], "status": "active"}).to_list(length=100)
    for goal in active_goals:
        category = goal.get("category")
        target_val = float(goal.get("target_value", 0))
        if category in calc_results:
            current_em = calc_results[category]["emission_co2"]
            # A goal to reduce emissions is successful if current emissions is less than target
            # e.g., target: 80kg, current: 70kg -> progress 100%
            # If current: 100kg -> progress depends.
            # Let's say: progress = min(100.0, max(0.0, (1 - (current_em - target_val)/target_val) * 100))
            if current_em <= target_val:
                progress = 100.0
                status_str = "completed"
                # Award 150 points for completed goal
                await users_col.update_one(
                    {"_id": current_user["_id"]},
                    {"$inc": {"points": 150}}
                )
            else:
                progress = min(99.0, max(0.0, (target_val / current_em) * 100)) if current_em > 0 else 0
                status_str = "active"
                
            await goals_col.update_one(
                {"_id": goal["_id"]},
                {"$set": {"progress": round(progress, 1), "status": status_str}}
            )

    return serialize_record(new_record)

@router.get("/history", response_model=List[CarbonRecordResponse])
async def get_carbon_history(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=100)
    return [serialize_record(r) for r in records]

@router.get("/recommendations")
async def get_carbon_recommendations(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=1)
    latest = records[0] if records else None
    
    if not latest:
        return []
        
    return generate_recommendations(latest)

@router.get("/dashboard-summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=1)
    latest = records[0] if records else None
    
    if latest:
        monthly = latest.get("total_emission", 0.0)
        yearly = monthly * 12.0
        score = latest.get("sustainability_score", 50)
    else:
        monthly = 0.0
        yearly = 0.0
        score = 0
        
    return DashboardSummary(
        monthly_emissions=round(monthly, 2),
        yearly_emissions=round(yearly, 2),
        sustainability_score=score,
        points=current_user.get("points", 0),
        badges=current_user.get("badges", [])
    )

@router.get("/report/pdf")
async def download_pdf_report(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=1)
    latest = records[0] if records else None
    
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No carbon records found. Calculate your footprint first to download a report."
        )
        
    recs = generate_recommendations(latest)
    pdf_buffer = generate_carbon_pdf(current_user, latest, recs)
    
    headers = {
        'Content-Disposition': f'attachment; filename="EcoTrack_Carbon_Report_{datetime.now().strftime("%Y%m%d")}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get("/report/excel")
async def download_excel_report(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=100)
    
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No carbon records found. Calculate your footprint first to export data."
        )
        
    excel_buffer = export_history_to_excel(records)
    
    headers = {
        'Content-Disposition': f'attachment; filename="EcoTrack_Emissions_History_{datetime.now().strftime("%Y%m%d")}.xlsx"'
    }
    return StreamingResponse(
        excel_buffer, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers=headers
    )

@router.post("/chatbot")
async def chat_with_bot(
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    user_msg = payload.get("message", "")
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message field is empty.")
        
    carbon_col = db_manager.get_collection("carbon_records")
    cursor = carbon_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    records = await cursor.to_list(length=1)
    latest = records[0] if records else None
    
    reply = await get_chatbot_reply(user_msg, current_user, latest)
    return {"reply": reply}

@router.post("/predict")
def predict_emissions_endpoint(payload: Dict[str, float]):
    car_km = payload.get("car_km", 0.0)
    electricity = payload.get("electricity", 0.0)
    meat_servings = payload.get("meat_servings", 0.0)
    online_purchases = payload.get("online_purchases", 0.0)
    
    prediction = predict_future_emissions(car_km, electricity, meat_servings, online_purchases)
    
    # Formulate hypothetical reductions (e.g., standard model vs improved scenario model)
    reduced_prediction = predict_future_emissions(
        car_km * 0.7,        # 30% reduction in driving
        electricity * 0.8,   # 20% reduction in electricity
        meat_servings * 0.5, # 50% reduction in meat servings
        online_purchases * 0.8 # 20% reduction in online shopping
    )
    
    return {
        "predicted_emissions": prediction,
        "reduced_predicted_emissions": reduced_prediction,
        "potential_monthly_saving": round(max(0.0, prediction - reduced_prediction), 2)
    }
