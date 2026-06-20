import urllib.request
import json
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("ecotrack.chatbot")

# Predefined advisory responses for the local rule-based fallback
SUSTAINABILITY_KNOWLEDGE = {
    "hello": "Hello! I am EcoBot, your sustainability advisor. Ask me anything about reducing your carbon footprint, green habits, or details about your score!",
    "hi": "Hello! I am EcoBot, your sustainability advisor. Ask me anything about reducing your carbon footprint, green habits, or details about your score!",
    "score": "Your sustainability score is based on your monthly carbon emissions. Swapping car trips for cycling, cutting meat consumption, and using energy-saving appliances will boost it!",
    "car": "Cars are a major source of transportation emissions (average 170g CO2 per km). Switching to an electric vehicle, carpooling, or taking public transit can make a massive difference.",
    "bike": "Riding a bicycle has zero tailpipe emissions! Choosing a bike over a car for a 5 km commute daily saves around 30 kg of CO2 every month.",
    "transit": "Public transportation (buses, trains, subways) is highly efficient, averaging only 40g CO2 per passenger km. Using it three times a week is a great goal!",
    "flight": "A single flight can produce hundreds of kilograms of carbon emissions. For holidays, consider 'staycations' or train travel. If you must fly, check if you can offset your carbon emissions.",
    "solar": "Solar panels generate clean, renewable electricity, offsetting about 0.38kg of CO2 for every kWh produced compared to grid electricity.",
    "meat": "Meat (especially beef and lamb) has a very high carbon footprint due to deforestation and methane emissions. Swapping beef for beans or poultry twice a week significantly cuts emissions.",
    "waste": "Food waste in landfills decays anaerobically, creating methane—a gas 28 times more potent than CO2. Planning meals, freezing extras, and composting scraps solves this.",
    "plastic": "Plastics are made from petrochemicals and take hundreds of years to decompose. Switching to reusable cups, bottles, and canvas bags keeps plastic waste out of ecosystems.",
    "recycle": "Recycling saves energy by reusing materials rather than extracting raw resources. Always clean your plastic, glass, aluminum, and paper before putting them in recycling bins.",
    "energy": "Electricity usage in homes is a big carbon source. You can save up to 20% by upgrading to LED light bulbs, setting thermostat offsets, and turning off standby electronics.",
    "appliances": "Look for Energy Star certified appliances which use 10-50% less energy than standard models, cutting both your bills and footprint."
}

def ask_openai(prompt: str, api_key: str) -> Optional[str]:
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are EcoBot, an expert AI sustainability advisor for EcoTrack. Provide helpful, actionable, and encouraging advice regarding carbon footprint reduction, eco-friendly habits, and climate change. Keep responses concise (under 4 sentences)."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return None

def ask_gemini(prompt: str, api_key: str) -> Optional[str]:
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{
                "parts": [{
                    "text": f"You are EcoBot, an expert AI sustainability advisor for EcoTrack. Provide helpful, encouraging advice regarding carbon footprint reduction. Answer this question in under 4 sentences: {prompt}"
                }]
            }]
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return None

async def get_chatbot_reply(user_message: str, user_profile: Dict[str, Any], latest_record: Optional[Dict[str, Any]] = None) -> str:
    """
    Get conversational response. Uses external API if configured, otherwise falls back to local rules-based engine.
    """
    msg = user_message.lower().strip()
    
    # Check if external API key exists
    if settings.OPENAI_API_KEY:
        openai_reply = ask_openai(user_message, settings.OPENAI_API_KEY)
        if openai_reply:
            return openai_reply
            
    if settings.GEMINI_API_KEY:
        gemini_reply = ask_gemini(user_message, settings.GEMINI_API_KEY)
        if gemini_reply:
            return gemini_reply

    # --- Rule-Based Sustainability Advisor Fallback ---
    # Handle user-specific details first
    if "my footprint" in msg or "my emissions" in msg or "my carbon" in msg or "dashboard" in msg:
        if latest_record:
            total = latest_record.get("total_emission", 0)
            score = latest_record.get("sustainability_score", 50)
            return (
                f"Your latest monthly carbon footprint is {total} kg CO2, resulting in a Sustainability Score of {score}/100. "
                f"Your highest category is electricity/energy. You can reduce this by setting goals or taking challenges!"
            )
        else:
            return "It looks like you haven't filled out the Carbon Calculator yet! Head over to the Calculator page to calculate your footprint first."
            
    if "my points" in msg or "my badges" in msg or "my level" in msg or "badges" in msg:
        points = user_profile.get("points", 0)
        badges = user_profile.get("badges", [])
        badge_str = ", ".join(badges) if badges else "None yet"
        return f"You currently have {points} Eco Points and earned badges: [{badge_str}]. Complete challenges to earn more!"

    # Match predefined keywords
    for keyword, response in SUSTAINABILITY_KNOWLEDGE.items():
        if keyword in msg:
            return response
            
    # Default fallback
    return (
        "That's an interesting question! To live more sustainably, focus on: "
        "1. Active transport (walking/cycling), 2. Upgrading home energy efficiency, 3. Reducing meat consumption, "
        "and 4. Lowering waste. Is there a specific area you'd like advice on?"
    )
