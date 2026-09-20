import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PgsPage from './pages/PgsPage';
import RoomsPage from './pages/RoomsPage';
import BedsPage from './pages/BedsPage';
import ResidentsPage from './pages/ResidentsPage';
import AllocationsPage from './pages/AllocationsPage';
import PaymentsPage from './pages/PaymentsPage';
import MaintenancePage from './pages/MaintenancePage';
import NoticesPage from './pages/NoticesPage';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentPaymentsPage from './pages/resident/ResidentPaymentsPage';
import ResidentMaintenancePage from './pages/resident/ResidentMaintenancePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Applies the correct CSS theme on <html> based on user role
function ThemeController() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.role === 'RESIDENT') {
      document.documentElement.setAttribute('data-theme', 'resident');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [user?.role]);
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  return user?.role === 'RESIDENT' ? <ResidentDashboard /> : <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeController />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            <Route path="pgs" element={<PgsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="beds" element={<BedsPage />} />
            <Route path="residents" element={<ResidentsPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="resident-payments" element={<ResidentPaymentsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="resident-maintenance" element={<ResidentMaintenancePage />} />
            <Route path="notices" element={<NoticesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
