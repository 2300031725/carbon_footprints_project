// EcoTrack SPA App - Refactored Version 1.0.1
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/RouteGuards';
import MainLayout from './components/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages lazy dynamic imports for optimized code-splitting
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CarbonCalculator = React.lazy(() => import('./pages/Calculator'));
const Goals = React.lazy(() => import('./pages/Goals'));
const Challenges = React.lazy(() => import('./pages/Challenges'));
const Community = React.lazy(() => import('./pages/Community'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner message="Loading page components..." />}>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/calculator" element={<CarbonCalculator />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
