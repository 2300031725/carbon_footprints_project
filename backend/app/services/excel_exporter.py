import pandas as pd
from io import BytesIO
from typing import List, Dict, Any

def export_history_to_excel(records: List[Dict[str, Any]]) -> BytesIO:
    """
    Exports a user's carbon footprint record history into an Excel workbook.
    """
    data = []
    for r in records:
        # Normalize nested fields
        trans = r.get("transportation", {})
        energy = r.get("energy", {})
        food = r.get("food", {})
        lifestyle = r.get("lifestyle", {})
        
        data.append({
            "Calculation Date": r.get("date", ""),
            "Total Carbon (kg CO2/month)": r.get("total_emission", 0),
            "Transportation (kg CO2)": trans.get("emission_co2", 0),
            "Energy (kg CO2)": energy.get("emission_co2", 0),
            "Food Habits (kg CO2)": food.get("emission_co2", 0),
            "Lifestyle & Shopping (kg CO2)": lifestyle.get("emission_co2", 0),
            "Car Travel (km/week)": trans.get("car_km", 0),
            "Bike Travel (km/week)": trans.get("bike_km", 0),
            "Public Transit (km/week)": trans.get("public_transit_km", 0),
            "Flights (flights/year)": trans.get("flights_per_year", 0),
            "Electricity Usage (kWh/month)": energy.get("electricity_kwh", 0),
            "LPG/Gas Usage (kg/month)": energy.get("gas_lpg", 0),
            "Renewable Electricity (%)": energy.get("renewable_pct", 0),
            "Diet Category": food.get("diet_type", "N/A"),
            "Meat Servings (weekly)": food.get("meat_servings", 0),
            "Food Waste Level": food.get("food_waste_level", "N/A"),
            "Online Shop Orders (monthly)": lifestyle.get("online_purchases", 0),
            "Clothes Purchased (monthly)": lifestyle.get("clothing_purchases", 0),
            "Electronics Bought (yearly)": lifestyle.get("electronics_purchases", 0),
            "Household Waste (bags/week)": lifestyle.get("waste_generation", 0)
        })
        
    df = pd.DataFrame(data)
    
    buffer = BytesIO()
    # Write dataframe to excel buffer using openpyxl engine
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Carbon History')
        
    buffer.seek(0)
    return buffer
