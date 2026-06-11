import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import API from '../services/api';
import useInactivity from '../hooks/useInactivity';
import type { AuthContextType, AdminUser, MemberUser, UserRole } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [member, setMember] = useState<MemberUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      // 1. Try fetching admin profile
      const adminRes = await API.get('/auth/profile');
      setAdmin(adminRes.data);
      setRole('admin');
      setToken('cookie-present');
    } catch (adminErr) {
      try {
        // 2. Try fetching member profile
        const memberRes = await API.get('/members/profile');
        setMember(memberRes.data);
        setRole('member');
        setToken('cookie-present');
      } catch (memberErr) {
        // Not authenticated
        setAdmin(null);
        setMember(null);
        setRole(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('spms_admin');
      localStorage.removeItem('member_spms_data');
      localStorage.removeItem('auth_token');
      setToken(null);
      setAdmin(null);
      setMember(null);
      setRole(null);
    }
  }, []);

  useInactivity(() => {
    if (token) {
      logout();
    }
  }, 30 * 60 * 1000);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('auth_session_expired', handleExpired);
    return () => window.removeEventListener('auth_session_expired', handleExpired);
  }, [logout]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data } = await API.post<{ _id: string; email: string }>('/auth/login', { email, password });
      localStorage.setItem('spms_admin', JSON.stringify({ _id: data._id, email: data.email }));
      setToken('cookie-present');
      setAdmin({ _id: data._id, email: data.email });
      setRole('admin');
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const memberLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data } = await API.post<{ _id: string; name: string; email: string; phone: string; buildingNumber: number; flatNumber: string }>('/members/login', { email, password });
      localStorage.setItem('member_spms_data', JSON.stringify({ _id: data._id, name: data.name, email: data.email, phone: data.phone, buildingNumber: data.buildingNumber, flatNumber: data.flatNumber }));
      setToken('cookie-present');
      setMember({ _id: data._id, name: data.name, email: data.email, phone: data.phone, buildingNumber: data.buildingNumber, flatNumber: data.flatNumber });
      setRole('member');
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const memberRegister = async (regData: { name: string; email: string; password: string; phone: string; buildingNumber: number; flatNumber: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      // Admins register members directly now. This registers a member without logging them in immediately on current client.
      await API.post('/members/register', regData);
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  const unifiedLogin = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; message?: string }> => {
    try {
      const { data } = await API.post<{
        token: string;
        role: UserRole;
        _id: string;
        email: string;
        name?: string;
        phone?: string;
        buildingNumber?: number;
        flatNumber?: string;
      }>('/auth/unified-login', { email, password });

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setRole(data.role);

      if (data.role === 'admin') {
        localStorage.setItem('spms_admin', JSON.stringify({ _id: data._id, email: data.email }));
        setAdmin({ _id: data._id, email: data.email });
      } else {
        localStorage.setItem('member_spms_data', JSON.stringify({
          _id: data._id,
          name: data.name || '',
          email: data.email,
          phone: data.phone || '',
          buildingNumber: data.buildingNumber || 28,
          flatNumber: data.flatNumber || '',
        }));
        setMember({
          _id: data._id,
          name: data.name || '',
          email: data.email,
          phone: data.phone || '',
          buildingNumber: data.buildingNumber || 28,
          flatNumber: data.flatNumber || '',
        });
      }
      return { success: true, role: data.role };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ admin, member, token, role, loading, login, memberLogin, unifiedLogin, memberRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
