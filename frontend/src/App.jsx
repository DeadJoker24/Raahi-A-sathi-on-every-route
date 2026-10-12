import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DriverDashboard } from './pages/DriverDashboard';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { VehiclePage } from './pages/VehiclePage';
import { PublishCommutePage } from './pages/PublishCommutePage';
import { MyCommutesPage } from './pages/MyCommutesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route 
                path="/driver/dashboard" 
                element={
                  <ProtectedRoute allowedRole="DRIVER">
                    <DriverDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/driver/commutes" 
                element={
                  <ProtectedRoute allowedRole="DRIVER">
                    <MyCommutesPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/driver/commutes/new" 
                element={
                  <ProtectedRoute allowedRole="DRIVER">
                    <PublishCommutePage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/passenger/dashboard" 
                element={
                  <ProtectedRoute allowedRole="PASSENGER">
                    <PassengerDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/driver/vehicle" 
                element={
                  <ProtectedRoute allowedRole="DRIVER">
                    <VehiclePage />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
