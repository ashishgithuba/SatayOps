import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('stayops_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });

      // Backend response shape:
      // { statusCode, success, message, data: { id, name, email, phone, role, status, token } }
      // Support both `res.data.data` (backend envelope) and a flatter
      // `res.data` shape in case the API service already unwraps it.
      const payload = res.data?.data || res.data;

      if (!payload || !payload.token) {
        throw new Error('Login response did not include a token.');
      }

      const { token, ...userData } = payload;

      localStorage.setItem('stayops_token', token);
      localStorage.setItem('stayops_user', JSON.stringify(userData));
      setUser(userData);
      return res;
    } catch (err) {
      // Do NOT silently fall back to a dummy user here — that hides real
      // auth/API errors and makes the app look "logged in" when it isn't.
      // Let the caller (Login page) catch this and show a proper error.
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('stayops_token');
    localStorage.removeItem('stayops_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
