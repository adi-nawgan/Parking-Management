import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import API from '../services/api';
import useInactivity from '../hooks/useInactivity';
import type { AuthContextType, AdminUser } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth State from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('spms_token');
    const storedAdmin = localStorage.getItem('spms_admin');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin) as AdminUser);
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
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data } = await API.post<{ token: string; _id: string; email: string }>('/auth/login', { email, password });

      localStorage.setItem('spms_token', data.token);
      localStorage.setItem('spms_admin', JSON.stringify({ _id: data._id, email: data.email }));

      setToken(data.token);
      setAdmin({ _id: data._id, email: data.email });
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
