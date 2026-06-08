import React, { createContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import useInactivity from '../hooks/useInactivity';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('spms_token');
    const storedAdmin = localStorage.getItem('spms_admin');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  // Standard Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('spms_token');
    localStorage.removeItem('spms_admin');
    setToken(null);
    setAdmin(null);
  }, []);

  // Bind inactivity auto-logout: 30 minutes (30 * 60 * 1000 ms)
  // Only trigger logout if there is an active session
  useInactivity(() => {
    if (token) {
      logout();
    }
  }, 30 * 60 * 1000);

  // Handle session expired events from axios interceptor
  useEffect(() => {
    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth_session_expired', handleExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpired);
    };
  }, [logout]);

  // Login handler
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      localStorage.setItem('spms_token', data.token);
      localStorage.setItem('spms_admin', JSON.stringify({ _id: data._id, email: data.email }));
      
      setToken(data.token);
      setAdmin({ _id: data._id, email: data.email });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
