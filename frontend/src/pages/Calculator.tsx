import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculateMutation, usePredictMutation } from '../hooks/useQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Lightbulb, UtensilsCrossed, ShoppingBag, CheckCircle, Sparkles, Sliders, ArrowLeft, ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const steps = [
  { id: 'trans', title: 'Transportation', icon: Car },
  { id: 'energy', title: 'Energy Consumption', icon: Lightbulb },
  { id: 'food', title: 'Food Habits', icon: UtensilsCrossed },
  { id: 'life', title: 'Shopping & Lifestyle', icon: ShoppingBag },
  { id: 'results', title: 'Results & Predictions', icon: Sparkles }
];

const CarbonCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  
  // React Query Mutations
  const calculateMutation = useCalculateMutation();
  const predictMutation = usePredictMutation();

  // Form State
  const [formData, setFormData] = useState({
    transportation: {
      car_km: 120,
      bike_km: 15,
      public_transit_km: 50,
      flights_per_year: 2
    },
    energy: {
      electricity_kwh: 250,
      gas_lpg: 15,
      renewable_pct: 10
    },
    food: {
      diet_type: 'Non-Vegetarian',
      meat_servings: 4,
      food_waste_level: 'Medium'
    },
    lifestyle: {
      online_purchases: 6,
      clothing_purchases: 3,
      electronics_purchases: 1,
      waste_generation: 2
    }
  });

  // ML Prediction Slider State (defaults to current input values)
  const [mlInputs, setMlInputs] = useState({
    car_km: 120,
    electricity: 250,
    meat_servings: 4,
    online_purchases: 6
  });

  const handleTransChange = (field: string, val: number) => {
    setFormData(prev => ({
      ...prev,
      transportation: { ...prev.transportation, [field]: val }
    }));
  };

  const handleEnergyChange = (field: string, val: number) => {
    setFormData(prev => ({
      ...prev,
      energy: { ...prev.energy, [field]: val }
    }));
  };

  const handleFoodChange = (field: string, val: string | number) => {
    setFormData(prev => ({
      ...prev,
      food: { ...prev.food, [field]: val }
    }));
  };

  const handleLifeChange = (field: string, val: number) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: val }
    }));
  };

  // Submit Calculations
  const handleSubmitCalculations = async () => {
    try {
      await calculateMutation.mutateAsync(formData);
      
      // Initialize ML inputs with the newly logged inputs
      setMlInputs({
        car_km: formData.transportation.car_km,
        electricity: formData.energy.electricity_kwh,
        meat_servings: formData.food.meat_servings,
        online_purchases: formData.lifestyle.online_purchases
      });
      
      setActiveStep(4); // Advance to results step
    } catch (err) {
      console.error(err);
      alert('Failed to log carbon calculations.');
    }
  };

  useEffect(() => {
    if (activeStep === 4) {
      predictMutation.mutate({
        car_km: mlInputs.car_km,
        electricity: mlInputs.electricity,
        meat_servings: mlInputs.meat_servings,
        online_purchases: mlInputs.online_purchases
      });
    }
  }, [activeStep, mlInputs]);

  // Framer Motion variant options
  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (calculateMutation.isPending) {
    return <LoadingSpinner message="Calculating and logging your emissions..." />;
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Carbon Footprint Calculator</h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Complete the multi-step form to calculate and predict your carbon footprint.
        </p>
      </div>

      {/* Progress Wizard Header */}
      <div className="grid grid-cols-5 gap-2.5 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm overflow-x-auto">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const active = activeStep === idx;
          const completed = activeStep > idx;
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center text-center gap-1.5 p-2 rounded-2xl transition-all ${
                active 
                  ? 'bg-eco-55 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400' 
                  : completed 
                    ? 'text-eco-600 dark:text-eco-400' 
                    : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-sm ${
                active 
                  ? 'border-eco-500 bg-eco-500 text-white' 
                  : completed 
                    ? 'border-eco-500 bg-eco-50/50 dark:bg-eco-950/10' 
                    : 'border-slate-200 dark:border-slate-800'
              }`}>
                {completed ? <CheckCircle className="w-5 h-5 fill-eco-500 text-white" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className="text-2xs font-bold tracking-tight hidden sm:block">{step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Questionnaire Sheet */}
      <div className="glass-panel p-8 rounded-3xl shadow-sm min-h-[400px] flex flex-col justify-between relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div 
              key="step-0" 
              variants={slideVariants} 
              initial="initial" 
              animate="enter" 
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-3">
                <Car className="w-6 h-6 text-eco-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transportation Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="car_km" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Car Travel (km per week)</label>
                  <input 
                    id="car_km"
                    type="number"
                    value={formData.transportation.car_km}
                    onChange={(e) => handleTransChange('car_km', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="800"
                    value={formData.transportation.car_km}
                    onChange={(e) => handleTransChange('car_km', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Car Travel Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bike_km" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bicycle Travel (km per week)</label>
                  <input 
                    id="bike_km"
                    type="number"
                    value={formData.transportation.bike_km}
                    onChange={(e) => handleTransChange('bike_km', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="200"
                    value={formData.transportation.bike_km}
                    onChange={(e) => handleTransChange('bike_km', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Bicycle Travel Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="public_transit_km" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Public Transit (km per week)</label>
                  <input 
                    id="public_transit_km"
                    type="number"
                    value={formData.transportation.public_transit_km}
                    onChange={(e) => handleTransChange('public_transit_km', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="500"
                    value={formData.transportation.public_transit_km}
                    onChange={(e) => handleTransChange('public_transit_km', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Public Transit Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="flights_per_year" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Air Flights taken per year</label>
                  <input 
                    id="flights_per_year"
                    type="number"
                    value={formData.transportation.flights_per_year}
                    onChange={(e) => handleTransChange('flights_per_year', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="30"
                    value={formData.transportation.flights_per_year}
                    onChange={(e) => handleTransChange('flights_per_year', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Air Flights Range"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div 
              key="step-1" 
              variants={slideVariants} 
              initial="initial" 
              animate="enter" 
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-3">
                <Lightbulb className="w-6 h-6 text-eco-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Household Energy Consumption</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="electricity_kwh" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Electricity Usage (kWh / month)</label>
                  <input 
                    id="electricity_kwh"
                    type="number"
                    value={formData.energy.electricity_kwh}
                    onChange={(e) => handleEnergyChange('electricity_kwh', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="1000"
                    value={formData.energy.electricity_kwh}
                    onChange={(e) => handleEnergyChange('electricity_kwh', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Electricity Usage Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="gas_lpg" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">LPG / Gas consumption (kg / month)</label>
                  <input 
                    id="gas_lpg"
                    type="number"
                    value={formData.energy.gas_lpg}
                    onChange={(e) => handleEnergyChange('gas_lpg', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="100"
                    value={formData.energy.gas_lpg}
                    onChange={(e) => handleEnergyChange('gas_lpg', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="LPG / Gas consumption Range"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label htmlFor="renewable_pct" className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">Renewable Energy Share ({formData.energy.renewable_pct}%)</label>
                  <input 
                    id="renewable_pct"
                    type="range" min="0" max="100"
                    value={formData.energy.renewable_pct}
                    onChange={(e) => handleEnergyChange('renewable_pct', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-2 cursor-pointer"
                  />
                  <p className="text-2xs text-slate-455 font-bold uppercase mt-1">Solar offset discount applied to grid power footprint</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div 
              key="step-2" 
              variants={slideVariants} 
              initial="initial" 
              animate="enter" 
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-3">
                <UtensilsCrossed className="w-6 h-6 text-eco-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dietary & Food Habits</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="diet_type" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Diet Style</label>
                  <select 
                    id="diet_type"
                    value={formData.food.diet_type}
                    onChange={(e) => handleFoodChange('diet_type', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  >
                    <option value="Non-Vegetarian">Non-Vegetarian (Eats Meat)</option>
                    <option value="Vegetarian">Vegetarian (No Meat)</option>
                    <option value="Vegan">Vegan (Plant-Based only)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="meat_servings" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Weekly Meat Servings</label>
                  <input 
                    id="meat_servings"
                    type="number"
                    disabled={formData.food.diet_type !== 'Non-Vegetarian'}
                    value={formData.food.diet_type !== 'Non-Vegetarian' ? 0 : formData.food.meat_servings}
                    onChange={(e) => handleFoodChange('meat_servings', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors disabled:opacity-50"
                  />
                  <input 
                    type="range" min="0" max="21"
                    disabled={formData.food.diet_type !== 'Non-Vegetarian'}
                    value={formData.food.diet_type !== 'Non-Vegetarian' ? 0 : formData.food.meat_servings}
                    onChange={(e) => handleFoodChange('meat_servings', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 disabled:opacity-50 cursor-pointer"
                    aria-label="Weekly Meat Servings Range"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Food Waste Level</label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {['Low', 'Medium', 'High'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleFoodChange('food_waste_level', lvl)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formData.food.food_waste_level === lvl
                            ? 'bg-eco-600 text-white border-eco-600 shadow-lg shadow-eco-600/10'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-655 dark:text-slate-350 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div 
              key="step-3" 
              variants={slideVariants} 
              initial="initial" 
              animate="enter" 
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-3">
                <ShoppingBag className="w-6 h-6 text-eco-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shopping & Lifestyle</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="online_purchases" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Online Deliveries (per month)</label>
                  <input 
                    id="online_purchases"
                    type="number"
                    value={formData.lifestyle.online_purchases}
                    onChange={(e) => handleLifeChange('online_purchases', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="30"
                    value={formData.lifestyle.online_purchases}
                    onChange={(e) => handleLifeChange('online_purchases', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Online Deliveries Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="clothing_purchases" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Clothing Purchases (items per month)</label>
                  <input 
                    id="clothing_purchases"
                    type="number"
                    value={formData.lifestyle.clothing_purchases}
                    onChange={(e) => handleLifeChange('clothing_purchases', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="20"
                    value={formData.lifestyle.clothing_purchases}
                    onChange={(e) => handleLifeChange('clothing_purchases', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Clothing Purchases Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="electronics_purchases" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Electronics purchased (per year)</label>
                  <input 
                    id="electronics_purchases"
                    type="number"
                    value={formData.lifestyle.electronics_purchases}
                    onChange={(e) => handleLifeChange('electronics_purchases', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="10"
                    value={formData.lifestyle.electronics_purchases}
                    onChange={(e) => handleLifeChange('electronics_purchases', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Electronics purchased Range"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="waste_generation" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Household Waste (bags per week)</label>
                  <input 
                    id="waste_generation"
                    type="number"
                    value={formData.lifestyle.waste_generation}
                    onChange={(e) => handleLifeChange('waste_generation', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                  <input 
                    type="range" min="0" max="15"
                    value={formData.lifestyle.waste_generation}
                    onChange={(e) => handleLifeChange('waste_generation', Number(e.target.value))}
                    className="w-full accent-eco-500 mt-1 cursor-pointer"
                    aria-label="Household Waste Range"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 4 && calculateMutation.data && (
            <motion.div 
              key="step-4" 
              variants={slideVariants} 
              initial="initial" 
              animate="enter" 
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-855 pb-3 bg-eco-50/50 dark:bg-eco-950/20 p-4 rounded-2xl border border-eco-200/20">
                <CheckCircle className="w-7 h-7 text-eco-500 fill-eco-500/20" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emissions Summary Calculated!</h3>
                  <p className="text-2xs font-semibold text-eco-600 dark:text-eco-400 uppercase tracking-wide">Carbon record logged in database</p>
                </div>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Total Monthly</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{calculateMutation.data.total_emission} kg</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Sustainability Score</p>
                  <p className="text-xl font-black text-eco-600 mt-1">{calculateMutation.data.sustainability_score}/100</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Transportation</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{calculateMutation.data.transportation.emission_co2} kg</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Household Energy</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{calculateMutation.data.energy.emission_co2} kg</p>
                </div>
              </div>

              {/* Machine Learning carbon footprint prediction simulator */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-6 mt-2 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-eco-600" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">ML Carbon Footprint Future Predictor</h4>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">
                  Toggle these lifestyle sliders. The background ML model will predict your monthly carbon footprint dynamically!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-655 dark:text-slate-350">
                      <label htmlFor="ml_car_km">Weekly Driving:</label>
                      <span className="text-eco-600">{mlInputs.car_km} km</span>
                    </div>
                    <input 
                      id="ml_car_km"
                      type="range" min="0" max="800"
                      value={mlInputs.car_km}
                      onChange={(e) => setMlInputs(p => ({ ...p, car_km: Number(e.target.value) }))}
                      className="w-full accent-eco-600 mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-655 dark:text-slate-350">
                      <label htmlFor="ml_electricity">Electricity Consumption:</label>
                      <span className="text-eco-600">{mlInputs.electricity} kWh</span>
                    </div>
                    <input 
                      id="ml_electricity"
                      type="range" min="50" max="800"
                      value={mlInputs.electricity}
                      onChange={(e) => setMlInputs(p => ({ ...p, electricity: Number(e.target.value) }))}
                      className="w-full accent-eco-600 mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-655 dark:text-slate-350">
                      <label htmlFor="ml_meat_servings">Meat Servings/week:</label>
                      <span className="text-eco-600">{mlInputs.meat_servings} times</span>
                    </div>
                    <input 
                      id="ml_meat_servings"
                      type="range" min="0" max="21"
                      value={mlInputs.meat_servings}
                      onChange={(e) => setMlInputs(p => ({ ...p, meat_servings: Number(e.target.value) }))}
                      className="w-full accent-eco-600 mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-655 dark:text-slate-350">
                      <label htmlFor="ml_online_purchases">Online Shopping/month:</label>
                      <span className="text-eco-600">{mlInputs.online_purchases} orders</span>
                    </div>
                    <input 
                      id="ml_online_purchases"
                      type="range" min="0" max="30"
                      value={mlInputs.online_purchases}
                      onChange={(e) => setMlInputs(p => ({ ...p, online_purchases: Number(e.target.value) }))}
                      className="w-full accent-eco-600 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* ML calculations display box */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center font-bold">
                  <div className="text-center md:text-left">
                    <p className="text-2xs font-extrabold text-slate-400 uppercase">Predicted Footprint</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {predictMutation.isPending ? 'Calculating...' : predictMutation.data ? `${predictMutation.data.predicted_emissions} kg` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-2xs font-extrabold text-slate-400 uppercase">Offset Reduction (Recommended)</p>
                    <p className="text-2xl font-black text-eco-600 mt-1">
                      {predictMutation.isPending ? 'Calculating...' : predictMutation.data ? `${predictMutation.data.reduced_predicted_emissions} kg` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-eco-500 text-white rounded-2xl p-3 text-center shadow-md shadow-eco-600/10">
                    <p className="text-2xs font-black uppercase opacity-90">Potential Monthly Offset</p>
                    <p className="text-lg font-extrabold mt-0.5">
                      {predictMutation.isPending ? '...' : predictMutation.data ? `-${predictMutation.data.potential_monthly_saving} kg` : '0 kg'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls Row */}
        <div className="flex justify-between items-center border-t border-slate-150 dark:border-slate-800/80 pt-6 mt-8">
          {activeStep > 0 && activeStep < 4 ? (
            <button
              onClick={() => setActiveStep(activeStep - 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-extrabold text-slate-650 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : activeStep === 4 ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-xs font-extrabold text-slate-655 dark:text-slate-350 transition-colors cursor-pointer"
            >
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <div />
          )}

          {activeStep < 3 ? (
            <button
              onClick={() => setActiveStep(activeStep + 1)}
              className="eco-gradient text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-eco-600/10 cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : activeStep === 3 ? (
            <button
              onClick={handleSubmitCalculations}
              disabled={calculateMutation.isPending}
              className="eco-gradient text-white text-xs font-bold px-8 py-3 rounded-xl shadow-lg shadow-eco-600/15 disabled:opacity-50 cursor-pointer"
            >
              {calculateMutation.isPending ? 'Submitting...' : 'Save & Calculate'}
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveStep(0);
                calculateMutation.reset();
              }}
              className="eco-gradient text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer"
            >
              Recalculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarbonCalculator;
