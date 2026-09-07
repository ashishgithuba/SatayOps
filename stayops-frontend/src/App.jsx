import React from 'react';
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

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pgs" element={<PgsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="beds" element={<BedsPage />} />
            <Route path="residents" element={<ResidentsPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
