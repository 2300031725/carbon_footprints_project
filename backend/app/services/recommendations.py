from typing import List, Dict, Any

def generate_recommendations(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Analyzes a carbon record and returns category-specific recommendations.
    Each recommendation contains: category, tip, impact_level, and potential_reduction.
    """
    recommendations = []
    
    # Extract emissions
    trans = record.get("transportation", {}).get("emission_co2", 0)
    energy = record.get("energy", {}).get("emission_co2", 0)
    food = record.get("food", {}).get("emission_co2", 0)
    lifestyle = record.get("lifestyle", {}).get("emission_co2", 0)
    
    # 1. Transportation Recommendations
    car_km = record.get("transportation", {}).get("car_km", 0)
    flights = record.get("transportation", {}).get("flights_per_year", 0)
    
    if trans > 120:
        if car_km > 100:
            recommendations.append({
                "category": "Transportation",
                "title": "Carpool or Remote Work",
                "tip": f"You drive about {car_km} km per week. Carpooling or working from home twice a week can reduce your transport emissions by up to 20%.",
                "impact": "High",
                "potential_saving": f"{round(car_km * 4.33 * 0.171 * 0.2, 1)} kg CO2/month"
            })
        if flights > 1:
            recommendations.append({
                "category": "Transportation",
                "title": "Reduce Flight Frequencies",
                "tip": "Air travel has an extremely high carbon intensity. Consider train alternatives for domestic trips or virtual meetings to save emissions.",
                "impact": "High",
                "potential_saving": "250.0 kg CO2 per flight saved"
            })
        recommendations.append({
            "category": "Transportation",
            "title": "Active Commuting",
            "tip": "Swap short car trips under 5 km with walking, cycling, or electric scooters. It's great for health and has zero emissions.",
            "impact": "Medium",
            "potential_saving": "15.0 - 30.0 kg CO2/month"
        })
    else:
        recommendations.append({
            "category": "Transportation",
            "title": "Eco-Driving Techniques",
            "tip": "Maintain proper tire inflation and avoid aggressive braking/acceleration to improve fuel efficiency by 10%.",
            "impact": "Low",
            "potential_saving": "5.0 - 10.0 kg CO2/month"
        })

    # 2. Energy Recommendations
    elec = record.get("energy", {}).get("electricity_kwh", 0)
    renewable = record.get("energy", {}).get("renewable_pct", 0)
    
    if energy > 100:
        if renewable < 30:
            recommendations.append({
                "category": "Energy",
                "title": "Switch to Renewable Power",
                "tip": f"Your renewable usage is {renewable}%. Consider switching to a green energy tariff or installing solar panels to offset electricity footprint.",
                "impact": "High",
                "potential_saving": f"{round(elec * 0.385 * 0.5, 1)} kg CO2/month (at 50% green mix)"
            })
        recommendations.append({
            "category": "Energy",
            "title": "Upgrade to LED Bulbs & Smart Thermostats",
            "tip": "LEDs consume 75% less energy than incandescent bulbs. Heating and cooling adjustments can lower monthly power loads by 15%.",
            "impact": "Medium",
            "potential_saving": "15.0 - 25.0 kg CO2/month"
        })
    else:
        recommendations.append({
            "category": "Energy",
            "title": "Eliminate Vampire Loads",
            "tip": "Unplug standby electronics like TVs, chargers, and game consoles. Vampire power counts for up to 5-10% of utility bills.",
            "impact": "Low",
            "potential_saving": "5.0 - 8.0 kg CO2/month"
        })

    # 3. Food Recommendations
    diet = str(record.get("food", {}).get("diet_type", "")).lower()
    meat_serv = record.get("food", {}).get("meat_servings", 0)
    waste = str(record.get("food", {}).get("food_waste_level", "")).lower()
    
    if food > 70:
        if "meat" in diet or "non-veg" in diet or meat_serv > 3:
            recommendations.append({
                "category": "Food",
                "title": "Introduce Plant-Based Days",
                "tip": f"You eat meat about {meat_serv} times a week. Reducing meat consumption by transitioning to a vegetarian diet or adopting 'Meatless Mondays' cuts food emissions significantly.",
                "impact": "High",
                "potential_saving": f"{round(meat_serv * 2.5 * 4.33 * 0.5, 1)} kg CO2/month"
            })
        if waste in ["medium", "high"]:
            recommendations.append({
                "category": "Food",
                "title": "Minimize Food Waste",
                "tip": "Plan your meals, store food correctly to avoid spoilage, and compost scraps. Food waste in landfills produces highly potent methane gas.",
                "impact": "Medium",
                "potential_saving": "10.0 - 25.0 kg CO2/month"
            })
    else:
        recommendations.append({
            "category": "Food",
            "title": "Eat Local and Seasonal",
            "tip": "Purchase locally produced foods to cut down transport emissions ('food miles') and support regional organic farming.",
            "impact": "Low",
            "potential_saving": "4.0 - 8.0 kg CO2/month"
        })

    # 4. Lifestyle & Shopping Recommendations
    online = record.get("lifestyle", {}).get("online_purchases", 0)
    clothes = record.get("lifestyle", {}).get("clothing_purchases", 0)
    
    if lifestyle > 80:
        if clothes > 2:
            recommendations.append({
                "category": "Lifestyle",
                "title": "Embrace Slow Fashion",
                "tip": f"You purchase ~{clothes} fashion items monthly. Buy high-quality pre-owned garments or repair existing clothing to reduce textile footprint.",
                "impact": "Medium",
                "potential_saving": f"{round(clothes * 15.0 * 0.5, 1)} kg CO2/month"
            })
        if online > 4:
            recommendations.append({
                "category": "Lifestyle",
                "title": "Consolidate Online Shipments",
                "tip": "Try grouping items into single shipments rather than making frequent one-off orders to reduce delivery truck mileage and packaging waste.",
                "impact": "Medium",
                "potential_saving": "5.0 - 12.0 kg CO2/month"
            })
        recommendations.append({
            "category": "Lifestyle",
            "title": "Zero Waste & Recycling",
            "tip": "Bring reusable canvas bags for grocery shopping, avoid single-use plastics, and recycle aluminum, glass, and cardboard correctly.",
            "impact": "Low",
            "potential_saving": "6.0 - 10.0 kg CO2/month"
        })
    else:
        recommendations.append({
            "category": "Lifestyle",
            "title": "Borrow & Share Economy",
            "tip": "Rent tools, equipment, or reference books instead of buying brand new products that sit idle most of their life cycle.",
            "impact": "Low",
            "potential_saving": "3.0 - 5.0 kg CO2/month"
        })

    return recommendations
