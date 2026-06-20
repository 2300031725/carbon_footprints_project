from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_db, DatabaseManager
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.schemas import UserRegister, UserLogin, ForgotPassword, ResetPassword, ChangePassword, ProfileUpdate, ProfileResponse, TokenResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def format_user_profile(user: dict) -> ProfileResponse:
    """
    Utility to format a database user document into a ProfileResponse schema.
    """
    return ProfileResponse(
        name=user.get("name", ""),
        email=user.get("email", ""),
        role=user.get("role", "user"),
        points=user.get("points", 0),
        badges=user.get("badges", []),
        profile=user.get("profile", {})
    )

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister, db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    
    # Check if user already exists
    existing = await users_col.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    hashed_pwd = get_password_hash(user_in.password)
    
    # Default profile skeleton
    new_user = {
        "_id": str(ObjectId()),
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": hashed_pwd,
        "role": user_in.role if user_in.role in ["user", "admin"] else "user",
        "points": 0,
        "badges": [],
        "profile": {
            "age": 0,
            "country": "",
            "city": "",
            "occupation": "",
            "household_size": 1,
            "transportation_preference": "Public Transit",
            "sustainability_interests": []
        },
        "created_at": datetime.now(timezone.utc),
        "blocked": False
    }
    
    await users_col.insert_one(new_user)
    
    # Generate access token
    access_token = create_access_token(subject=new_user["_id"])
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=format_user_profile(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin, db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"email": user_in.email})
    
    if not user or not verify_password(user_in.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
        
    if user.get("blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked by the administrator."
        )
        
    access_token = create_access_token(subject=user["_id"])
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=format_user_profile(user)
    )

@router.post("/forgot-password")
async def forgot_password(forgot_in: ForgotPassword, db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"email": forgot_in.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email."
        )
        
    # Generate a simple mock reset token (e.g. hex uuid or email-based token)
    reset_token = f"reset-{hash(forgot_in.email)}-{int(datetime.now().timestamp())}"
    
    # Save the token to the user document
    await users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": reset_token}}
    )
    
    # In a real app, send email. Here, we return the token in response for test ease
    return {
        "message": "Password reset token generated successfully. In production, this goes to your email.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
async def reset_password(reset_in: ResetPassword, db_manager: DatabaseManager = Depends(get_db)):
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"reset_token": reset_in.token})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    new_hashed_pwd = get_password_hash(reset_in.new_password)
    
    await users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password_hash": new_hashed_pwd},
            "$unset": {"reset_token": ""}
        }
    )
    
    return {"message": "Password has been reset successfully."}

@router.get("/me", response_model=ProfileResponse)
async def read_current_user(current_user: dict = Depends(get_current_user)):
    return format_user_profile(current_user)

@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_in: ProfileUpdate, 
    current_user: dict = Depends(get_current_user), 
    db_manager: DatabaseManager = Depends(get_db)
):
    users_col = db_manager.get_collection("users")
    
    # Construct set payload
    update_data = {}
    for field, val in profile_in.model_dump(exclude_unset=True).items():
        update_data[f"profile.{field}"] = val
        
    if update_data:
        await users_col.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        
    # Re-fetch user
    updated_user = await users_col.find_one({"_id": current_user["_id"]})
    return format_user_profile(updated_user)

@router.put("/change-password")
async def change_password(
    pwd_in: ChangePassword,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db)
):
    users_col = db_manager.get_collection("users")
    
    if not verify_password(pwd_in.old_password, current_user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password."
        )
        
    new_hashed_pwd = get_password_hash(pwd_in.new_password)
    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hashed_pwd}}
    )
    
    return {"message": "Password updated successfully."}
