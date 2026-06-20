# 🌿 EcoTrack - Carbon Footprint Tracker Platform

EcoTrack is a modern, full-stack web application designed to help individuals calculate, visualize, and reduce their carbon footprint. By analyzing daily activities, EcoTrack provides personalized recommendations, goal-setting, community challenges, and machine learning-powered predictions to guide users on their path to sustainability.

---

## 🚀 How EcoTrack Helps People
1. **Accurate Assessment**: The interactive Carbon Calculator computes a user's footprint across Transport, Energy, Food, and Lifestyle, offering a direct view of their ecological impact.
2. **Visual Diagnostics**: Sleek, interactive charts illustrate which lifestyle choices contribute most to emissions, making complex data easy to comprehend.
3. **Actionable Recommendations**: EcoTrack provides concrete suggestions tailored to the user's high-emission categories.
4. **Gamification & Goals**: Joining weekly challenges (like *No Plastic Week* or *Meatless Week*) and setting goals rewards users with points and badges, turning climate action into a fun, social habit.
5. **AI Advisor & Predictive Modeling**: An AI chatbot (*EcoBot*) acts as a personal sustainability assistant, while a built-in Machine Learning model allows users to adjust range sliders to see how potential future changes (e.g. driving 30% less) will lower their carbon footprint.
6. **Data Portability**: Users can export their complete calculation history to Excel or download certified PDF carbon reports.

---

## 🛠️ Technology Stack
* **Frontend**: React (TypeScript), Vite, Tailwind CSS v4, Framer Motion, Recharts, i18next (Internationalization).
* **Backend**: FastAPI (Python), MongoDB (via Motor async driver) with an automatic local JSON database fallback if MongoDB is offline.
* **Machine Learning**: Scikit-Learn (Linear Regression predictor).
* **PDF & Excel generation**: ReportLab & Pandas / OpenPyXL.

---

## 🏃 How to Run the Project Locally

Follow these instructions to set up both the backend and frontend on your machine:

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **MongoDB** (Optional - if offline, the backend automatically falls back to an internal file database, keeping the app 100% functional out of the box!)

---

### Step 1: Setup and Start the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   * **Windows**:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
The backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Step 2: Setup and Start the Frontend
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
Access the application by opening your browser at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Access Credentials
Use the following pre-seeded accounts to explore the app:

| User Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Regular User** | `jane@gmail.com` | `jane123` | Emissions log, challenges, AI advisor, goals |
| **Administrator** | `admin@ecotrack.com` | `admin123` | Access user lists, global analytics, factor config |
