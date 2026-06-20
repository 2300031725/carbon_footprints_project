from typing import Dict, Any

# Standard CO2 emission factors (in kg CO2)
DEFAULT_EMISSION_FACTORS = {
    # Transportation (per km or per flight)
    "car_co2_per_km": 0.171,          # Average medium car
    "bike_co2_per_km": 0.0,            # Zero direct emissions
    "public_transit_co2_per_km": 0.04, # Bus/Metro average
    "flight_co2_per_flight": 250.0,    # Average flight trip
    
    # Energy (per kWh or per kg)
    "electricity_co2_per_kwh": 0.385,  # Grid electricity average
    "gas_co2_per_kg": 2.30,            # LPG/Natural Gas
    
    # Food (per serving/level)
    "diet_vegan_monthly": 45.0,        # Vegan base emissions per month
    "diet_vegetarian_monthly": 75.0,   # Vegetarian base emissions per month
    "diet_meat_monthly": 120.0,        # Meat-eater base emissions per month
    "meat_serving_co2": 2.5,           # Additional per meat serving (weekly)
    "waste_low": 0.0,
    "waste_medium": 10.0,
    "waste_high": 25.0,
    
    # Lifestyle (per unit/month/year)
    "online_purchase_co2": 2.5,        # Packaging and transport
    "clothing_co2": 15.0,              # Fashion manufacturing average
    "electronics_co2": 120.0,          # Electronics manufacturing average
    "waste_bag_co2": 5.0               # Household waste bag co2
}

async def get_emission_factors(db_manager) -> Dict[str, float]:
    """
    Fetch emission factors from database. Fallback to defaults if empty.
    """
    collection = db_manager.get_collection("emission_factors")
    factors = {}
    for key, default_val in DEFAULT_EMISSION_FACTORS.items():
        doc = await collection.find_one({"key": key})
        if doc:
            factors[key] = float(doc["value"])
        else:
            # Seed default if missing
            await collection.insert_one({
                "key": key,
                "value": default_val,
                "unit": "kg CO2",
                "category": "default"
            })
            factors[key] = default_val
    return factors

async def calculate_emissions(data: Dict[str, Any], db_manager) -> Dict[str, Any]:
    """
    Calculate carbon emissions in kg CO2 per month based on user activity.
    """
    factors = await get_emission_factors(db_manager)
    
    # 1. Transportation
    trans = data.get("transportation", {})
    car_km = float(trans.get("car_km", 0))
    bike_km = float(trans.get("bike_km", 0))
    public_transit_km = float(trans.get("public_transit_km", 0))
    flights_per_year = float(trans.get("flights_per_year", 0))
    
    # Monthly distance = weekly * 4.33
    car_monthly_emissions = car_km * 4.33 * factors["car_co2_per_km"]
    bike_monthly_emissions = bike_km * 4.33 * factors["bike_co2_per_km"]
    transit_monthly_emissions = public_transit_km * 4.33 * factors["public_transit_co2_per_km"]
    # Monthly flight emissions = yearly / 12
    flights_monthly_emissions = (flights_per_year * factors["flight_co2_per_flight"]) / 12
    
    transportation_total = car_monthly_emissions + bike_monthly_emissions + transit_monthly_emissions + flights_monthly_emissions

    # 2. Energy
    energy = data.get("energy", {})
    electricity_kwh = float(energy.get("electricity_kwh", 0))
    gas_lpg = float(energy.get("gas_lpg", 0))
    renewable_pct = float(energy.get("renewable_pct", 0))
    
    # Electricity emissions discounted by renewable energy usage %
    elec_emissions = electricity_kwh * factors["electricity_co2_per_kwh"] * (1 - (renewable_pct / 100.0))
    gas_emissions = gas_lpg * factors["gas_co2_per_kg"]
    
    energy_total = elec_emissions + gas_emissions

    # 3. Food Habits
    food = data.get("food", {})
    diet_type = food.get("diet_type", "Vegetarian").lower()
    meat_servings = float(food.get("meat_servings", 0))
    food_waste_level = food.get("food_waste_level", "Medium").lower()
    
    if diet_type == "vegan":
        food_base = factors["diet_vegan_monthly"]
    elif diet_type == "vegetarian":
        food_base = factors["diet_vegetarian_monthly"]
    else:
        # Meat eater base + servings * weekly multiplier * 4.33
        food_base = factors["diet_meat_monthly"] + (meat_servings * factors["meat_serving_co2"] * 4.33)
        
    waste_co2 = factors.get(f"waste_{food_waste_level}", 10.0)
    food_total = food_base + waste_co2

    # 4. Shopping & Lifestyle
    lifestyle = data.get("lifestyle", {})
    online_purchases = float(lifestyle.get("online_purchases", 0))
    clothing_purchases = float(lifestyle.get("clothing_purchases", 0))
    electronics_purchases = float(lifestyle.get("electronics_purchases", 0))
    waste_generation = float(lifestyle.get("waste_generation", 0)) # bags per week
    
    online_co2 = online_purchases * factors["online_purchase_co2"]
    clothing_co2 = clothing_purchases * factors["clothing_co2"]
    electronics_co2 = (electronics_purchases * factors["electronics_co2"]) / 12
    waste_co2 = waste_generation * 4.33 * factors["waste_bag_co2"]
    
    lifestyle_total = online_co2 + clothing_co2 + electronics_co2 + waste_co2

    # Calculations summary
    total_monthly = transportation_total + energy_total + food_total + lifestyle_total
    
    # Sustainability Score: Scaled from 0 to 100. Average global carbon footprint is ~400 kg CO2 / month per capita.
    # Below 150 kg is excellent (score ~90-100), above 800 kg is very poor (score ~10-25).
    # Simple calculation: score = max(10, min(100, int(100 - (total_monthly / 10))))
    score = max(5, min(100, int(100 - (total_monthly / 12.0))))

    return {
        "transportation": {
            "car_km": car_km,
            "bike_km": bike_km,
            "public_transit_km": public_transit_km,
            "flights_per_year": flights_per_year,
            "emission_co2": round(transportation_total, 2)
        },
        "energy": {
            "electricity_kwh": electricity_kwh,
            "gas_lpg": gas_lpg,
            "renewable_pct": renewable_pct,
            "emission_co2": round(energy_total, 2)
        },
        "food": {
            "diet_type": food.get("diet_type"),
            "meat_servings": meat_servings,
            "food_waste_level": food.get("food_waste_level"),
            "emission_co2": round(food_total, 2)
        },
        "lifestyle": {
            "online_purchases": online_purchases,
            "clothing_purchases": clothing_purchases,
            "electronics_purchases": electronics_purchases,
            "waste_generation": waste_generation,
            "emission_co2": round(lifestyle_total, 2)
        },
        "total_emission": round(total_monthly, 2),
        "sustainability_score": score
    }
