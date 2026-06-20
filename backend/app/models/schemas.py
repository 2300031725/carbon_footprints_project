from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# Profile Schemas
class ProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=120)
    country: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    household_size: Optional[int] = Field(None, ge=1, le=50)
    transportation_preference: Optional[str] = None
    sustainability_interests: Optional[List[str]] = None

class ProfileResponse(BaseModel):
    name: str
    email: EmailStr
    role: str
    points: int
    badges: List[str]
    profile: Dict[str, Any]

# User Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "user" # Can be admin if explicitly requested

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class ChangePassword(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: ProfileResponse

# Carbon Footprint Calculator Schemas
class TransportationInput(BaseModel):
    car_km: float = Field(..., ge=0, le=100000, description="Car usage per week (km)")
    bike_km: float = Field(..., ge=0, le=10000, description="Bike usage per week (km)")
    public_transit_km: float = Field(..., ge=0, le=100000, description="Public transport usage per week (km)")
    flights_per_year: float = Field(..., ge=0, le=500, description="Flight travel per year (number of short/long flights)")

class EnergyInput(BaseModel):
    electricity_kwh: float = Field(..., ge=0, le=1000000, description="Electricity usage (kWh/month)")
    gas_lpg: float = Field(..., ge=0, le=100000, description="LPG/Gas consumption (kg or units/month)")
    renewable_pct: float = Field(..., ge=0, le=100, description="Renewable energy usage %")

class FoodInput(BaseModel):
    diet_type: str = Field(..., description="Vegetarian, Vegan, Non-Vegetarian")
    meat_servings: float = Field(..., ge=0, le=1000, description="Weekly meat servings")
    food_waste_level: str = Field(..., description="Low, Medium, High")

class LifestyleInput(BaseModel):
    online_purchases: float = Field(..., ge=0, le=10000, description="Online purchases/month")
    clothing_purchases: float = Field(..., ge=0, le=10000, description="Clothing purchases/month")
    electronics_purchases: float = Field(..., ge=0, le=1000, description="Electronics purchases/year")
    waste_generation: float = Field(..., ge=0, le=1000, description="Waste bags generated per week")

class CarbonRecordInput(BaseModel):
    transportation: TransportationInput
    energy: EnergyInput
    food: FoodInput
    lifestyle: LifestyleInput

class CarbonRecordResponse(BaseModel):
    id: str
    user_id: str
    date: str
    transportation: Dict[str, Any]
    energy: Dict[str, Any]
    food: Dict[str, Any]
    lifestyle: Dict[str, Any]
    total_emission: float
    created_at: str

# Goals Schemas
class GoalCreate(BaseModel):
    category: str # "transportation", "energy", "food", "lifestyle"
    title: str = Field(..., min_length=1)
    target_value: float = Field(..., ge=0)
    deadline: datetime

    @field_validator('deadline')
    @classmethod
    def validate_deadline(cls, v: datetime) -> datetime:
        # Check if deadline is in the future
        now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
        if v < now:
            raise ValueError("Goal deadline must be in the future.")
        return v

class GoalUpdate(BaseModel):
    progress: float
    status: Optional[str] = None # "active", "completed", "failed"

class GoalResponse(BaseModel):
    id: str
    user_id: str
    category: str
    title: str
    target_value: float
    progress: float
    status: str
    deadline: str
    created_at: str

# Challenges Schemas
class ChallengeCreate(BaseModel):
    title: str
    description: str
    points: int
    duration_days: int
    category: str

class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str
    points: int
    duration_days: int
    category: str
    active: bool

# Community Schemas
class PostCreate(BaseModel):
    content: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    user_id: str
    user_name: str
    content: str
    created_at: str

class PostResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    content: str
    likes: List[str]
    comments: List[CommentResponse]
    created_at: str

# Emission Factors Schema
class EmissionFactorUpdate(BaseModel):
    key: str
    value: float
    unit: str
    category: str

# Dashboard Analytics
class DashboardSummary(BaseModel):
    monthly_emissions: float
    yearly_emissions: float
    sustainability_score: int
    points: int
    badges: List[str]
