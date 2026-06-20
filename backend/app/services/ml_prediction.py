import os
import pickle
import numpy as np
import logging
from sklearn.linear_model import LinearRegression

logger = logging.getLogger("ecotrack.ml")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "carbon_predictor.pkl")

def train_prediction_model():
    """
    Generates synthetic data and trains a Linear Regression model to predict
    monthly carbon footprint based on key user habits.
    """
    logger.info("Training Carbon Footprint Prediction ML Model...")
    np.random.seed(42)
    num_samples = 1000
    
    # Features:
    # 1. Car km per week [0, 800]
    # 2. Electricity kWh per month [50, 600]
    # 3. Meat servings per week [0, 21]
    # 4. Online purchases per month [0, 30]
    
    car_km = np.random.uniform(0, 800, num_samples)
    electricity = np.random.uniform(50, 600, num_samples)
    meat_servings = np.random.uniform(0, 21, num_samples)
    online_purchases = np.random.uniform(0, 30, num_samples)
    
    # Calculate target: carbon footprint (kg CO2) with some random noise
    # Car: ~0.171 * 4.33 kg CO2/km
    # Elec: ~0.385 kg CO2/kWh
    # Meat: ~2.5 * 4.33 kg CO2/serving
    # Online: ~2.5 kg CO2/purchase
    # Base constant ~ 100 kg CO2 (food base + waste base + clothing/lifestyle)
    base = 100.0
    noise = np.random.normal(0, 25, num_samples)
    
    target = (
        base + 
        car_km * 4.33 * 0.171 + 
        electricity * 0.385 + 
        meat_servings * 2.5 * 4.33 + 
        online_purchases * 2.5 + 
        noise
    )
    
    # Prepare training sets
    X = np.stack([car_km, electricity, meat_servings, online_purchases], axis=1)
    y = target
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Save the model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
        
    logger.info("Carbon Footprint Prediction ML Model trained and saved successfully!")

def load_prediction_model() -> LinearRegression:
    if not os.path.exists(MODEL_PATH):
        train_prediction_model()
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    return model

def predict_future_emissions(car_km: float, electricity: float, meat_servings: float, online_purchases: float) -> float:
    """
    Predict monthly carbon footprint based on the trained model.
    """
    try:
        model = load_prediction_model()
        X_test = np.array([[car_km, electricity, meat_servings, online_purchases]])
        prediction = model.predict(X_test)[0]
        return round(float(max(10.0, prediction)), 2)
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        # Fallback manual estimate if ML model fails
        fallback = 100.0 + (car_km * 4.33 * 0.171) + (electricity * 0.385) + (meat_servings * 2.5 * 4.33) + (online_purchases * 2.5)
        return round(fallback, 2)
