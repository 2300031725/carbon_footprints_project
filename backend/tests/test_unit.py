import pytest
from app.services.calculator import calculate_emissions
from app.services.recommendations import generate_recommendations
from app.core.security import get_password_hash, verify_password

class DummyDBManager:
    def get_collection(self, name):
        class DummyCollection:
            async def find_one(self, query):
                return None
            async def insert_one(self, doc):
                return None
        return DummyCollection()

@pytest.mark.asyncio
async def test_calculate_emissions_base():
    # Base input with 0 values
    data = {
        "transportation": {
            "car_km": 0,
            "bike_km": 0,
            "public_transit_km": 0,
            "flights_per_year": 0
        },
        "energy": {
            "electricity_kwh": 0,
            "gas_lpg": 0,
            "renewable_pct": 0
        },
        "food": {
            "diet_type": "Vegan",
            "meat_servings": 0,
            "food_waste_level": "Low"
        },
        "lifestyle": {
            "online_purchases": 0,
            "clothing_purchases": 0,
            "electronics_purchases": 0,
            "waste_generation": 0
        }
    }
    
    db = DummyDBManager()
    res = await calculate_emissions(data, db)
    
    # Vegan diet base is 45, low food waste is 0. All else is 0. Total = 45.0
    assert res["total_emission"] == 45.0
    # Sustainability score calculation: score = max(5, min(100, int(100 - (45.0 / 12.0)))) = 96
    assert res["sustainability_score"] == 96
    assert res["transportation"]["emission_co2"] == 0
    assert res["energy"]["emission_co2"] == 0
    assert res["food"]["emission_co2"] == 45.0
    assert res["lifestyle"]["emission_co2"] == 0

@pytest.mark.asyncio
async def test_calculate_emissions_complex():
    data = {
        "transportation": {
            "car_km": 100,             # 100 * 4.33 * 0.171 = 74.043
            "bike_km": 50,              # 50 * 4.33 * 0 = 0
            "public_transit_km": 100,   # 100 * 4.33 * 0.04 = 17.32
            "flights_per_year": 12      # (12 * 250) / 12 = 250
        },
        "energy": {
            "electricity_kwh": 200,     # 200 * 0.385 * (1 - 0.5) = 38.5
            "gas_lpg": 10,              # 10 * 2.3 = 23.0
            "renewable_pct": 50
        },
        "food": {
            "diet_type": "Vegetarian",  # Vegetarian base = 75
            "meat_servings": 0,
            "food_waste_level": "Medium" # Medium waste = 10
        },
        "lifestyle": {
            "online_purchases": 4,      # 4 * 2.5 = 10.0
            "clothing_purchases": 2,    # 2 * 15.0 = 30.0
            "electronics_purchases": 2,  # (2 * 120.0) / 12 = 20.0
            "waste_generation": 1       # 1 * 4.33 * 5 = 21.65
        }
    }
    
    db = DummyDBManager()
    res = await calculate_emissions(data, db)
    
    # Expected totals:
    # Trans: 74.043 + 0 + 17.32 + 250 = 341.363 -> round 341.36
    # Energy: 38.5 + 23.0 = 61.5 -> round 61.5
    # Food: 75 + 10 = 85.0 -> round 85.0
    # Lifestyle: 10 + 30 + 20 + 21.65 = 81.65 -> round 81.65
    # Total monthly: 341.363 + 61.5 + 85.0 + 81.65 = 569.513 -> round 569.51
    # Score: max(5, min(100, int(100 - (569.51 / 12)))) = int(100 - 47.459) = 52
    
    assert abs(res["transportation"]["emission_co2"] - 341.36) < 0.1
    assert abs(res["energy"]["emission_co2"] - 61.5) < 0.1
    assert abs(res["food"]["emission_co2"] - 85.0) < 0.1
    assert abs(res["lifestyle"]["emission_co2"] - 81.65) < 0.1
    assert abs(res["total_emission"] - 569.51) < 0.2
    assert res["sustainability_score"] == 52

def test_generate_recommendations():
    record = {
        "transportation": {"emission_co2": 500},
        "energy": {"emission_co2": 100},
        "food": {"emission_co2": 200},
        "lifestyle": {"emission_co2": 50}
    }
    recs = generate_recommendations(record)
    assert len(recs) > 0
    # Transportation is the highest category, so transport recommendations should be featured
    categories = [r["category"] for r in recs]
    assert "Transportation" in categories

def test_password_hashing():
    password = "supersecretpwd"
    pwd_hash = get_password_hash(password)
    assert pwd_hash != password
    assert verify_password(password, pwd_hash) is True
    assert verify_password("wrongpwd", pwd_hash) is False
