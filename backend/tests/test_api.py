import pytest
from datetime import datetime, timedelta, timezone

def test_unauthorized_routes(client):
    # Security: Accessing protected routes without token should return 401
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
    
    resp = client.get("/api/carbon/history")
    assert resp.status_code == 401

def test_invalid_jwt_token(client):
    # Security: Protected route with invalid token should return 401
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401

def test_login_success(client):
    # Seeding contains jane@gmail.com / jane123
    resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "jane123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@gmail.com"

def test_login_invalid_credentials(client):
    # Input validation / wrong credentials
    resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "wrongpassword"
    })
    assert resp.status_code == 400
    assert "detail" in resp.json()

def test_validation_invalid_email(client):
    # Input validation: Invalid email format -> 400 Bad Request
    resp = client.post("/api/auth/register", json={
        "name": "Bob",
        "email": "not-an-email",
        "password": "password123"
    })
    assert resp.status_code == 400

def test_validation_empty_password(client):
    # Input validation: Short/empty password -> 400 Bad Request
    resp = client.post("/api/auth/register", json={
        "name": "Bob",
        "email": "bob@gmail.com",
        "password": ""
    })
    assert resp.status_code == 400

def test_validation_negative_kilometers(client):
    # Login as jane to get a token
    login_resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "jane123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Input validation: Negative value -> 400 Bad Request
    payload = {
        "transportation": {
            "car_km": -100,
            "bike_km": 0,
            "public_transit_km": 0,
            "flights_per_year": 0
        },
        "energy": {
            "electricity_kwh": 100,
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
    
    resp = client.post("/api/carbon/calculate", json=payload, headers=headers)
    assert resp.status_code == 400

def test_validation_invalid_goal_deadline(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "jane123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Input validation: Goal deadline in the past -> 400 Bad Request
    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    payload = {
        "category": "transportation",
        "title": "Reduce driving",
        "target_value": 50,
        "deadline": past_date
    }
    
    resp = client.post("/api/goals", json=payload, headers=headers)
    assert resp.status_code == 400

def test_edge_case_zero_travel_huge_values(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "jane123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Edge case: Huge values and zero values
    payload = {
        "transportation": {
            "car_km": 0,
            "bike_km": 0,
            "public_transit_km": 0,
            "flights_per_year": 0
        },
        "energy": {
            "electricity_kwh": 999999, # Huge value
            "gas_lpg": 0,
            "renewable_pct": 100
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
    
    resp = client.post("/api/carbon/calculate", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    # Travel is 0
    assert data["transportation"]["emission_co2"] == 0
    # Electricity is 999999 but renewable_pct is 100 so energy is 0
    assert data["energy"]["emission_co2"] == 0
    assert data["total_emission"] == 45.0 # Just vegan food diet base

def test_user_flow_scenario_1(client):
    # Scenario 1: User registers -> Logs in -> Calculates footprint -> Receives recommendations
    email = f"user_{int(datetime.now().timestamp())}@gmail.com"
    
    # 1. Register
    reg_resp = client.post("/api/auth/register", json={
        "name": "Alice Flow",
        "email": email,
        "password": "password123"
    })
    assert reg_resp.status_code == 200
    
    # 2. Login
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Calculate Footprint
    payload = {
        "transportation": {"car_km": 150, "bike_km": 10, "public_transit_km": 20, "flights_per_year": 2},
        "energy": {"electricity_kwh": 300, "gas_lpg": 12, "renewable_pct": 15},
        "food": {"diet_type": "Non-Vegetarian", "meat_servings": 5, "food_waste_level": "Medium"},
        "lifestyle": {"online_purchases": 5, "clothing_purchases": 2, "electronics_purchases": 1, "waste_generation": 2}
    }
    calc_resp = client.post("/api/carbon/calculate", json=payload, headers=headers)
    assert calc_resp.status_code == 200
    assert calc_resp.json()["total_emission"] > 0
    
    # 4. Receives Recommendations
    recs_resp = client.get("/api/carbon/recommendations", headers=headers)
    assert recs_resp.status_code == 200
    assert len(recs_resp.json()) > 0

def test_user_flow_scenario_2(client):
    # Scenario 2: Log in -> Create Goal -> Update Progress -> Complete Goal -> Verify points increase
    login_resp = client.post("/api/auth/login", json={
        "email": "jane@gmail.com",
        "password": "jane123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get current user points
    user_me = client.get("/api/auth/me", headers=headers).json()
    initial_points = user_me["points"]
    
    # 1. Create Goal
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    goal_payload = {
        "category": "energy",
        "title": "Reduce home power",
        "target_value": 150,
        "deadline": future_date
    }
    goal_resp = client.post("/api/goals", json=goal_payload, headers=headers)
    assert goal_resp.status_code == 200
    goal_id = goal_resp.json()["id"]
    
    # 2. Update Progress
    update_resp = client.put(f"/api/goals/{goal_id}", json={
        "progress": 50.0,
        "status": "active"
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["progress"] == 50.0
    
    # 3. Complete Goal (Updates status to completed)
    complete_resp = client.put(f"/api/goals/{goal_id}", json={
        "progress": 100.0,
        "status": "completed"
    }, headers=headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "completed"
    
    # 4. Verify points increase by 150 for completed goal
    user_me_after = client.get("/api/auth/me", headers=headers).json()
    assert user_me_after["points"] == initial_points + 150
