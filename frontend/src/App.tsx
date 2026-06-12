import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import MemberLayout from './components/MemberLayout';
import SecurityLayout from './components/SecurityLayout';

import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import VehicleEntry from './features/dashboard/VehicleEntry';
import VehicleExit from './features/dashboard/VehicleExit';
import ResidentList from './features/residents/ResidentList';
import VisitorLogs from './features/visitors/VisitorLogs';
import Logs from './features/logs/Logs';
import Settings from './features/settings/Settings';
import AdminReports from './features/admin/AdminReports';
import AuditLogs from './features/admin/AuditLogs';
import MemberManagement from './features/admin/MemberManagement';
import GuardManagement from './features/admin/GuardManagement';

import MemberDashboard from './features/member/MemberDashboard';
import ReportForm from './features/member/ReportForm';
import MyReports from './features/member/MyReports';
import SearchOwner from './features/member/SearchOwner';

import SecurityDashboard from './features/security/SecurityDashboard';

import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import type { UserRole } from './types';

interface RouteGuardProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-bold">Loading security session...</div>;
  }
  if (!authCtx.token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

interface RoleRouteProps {
  children: ReactNode;
  role: UserRole;
  fallback?: string;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, role, fallback }) => {
  const authCtx = useContext(AuthContext);
  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-bold">Loading security session...</div>;
  }
  if (!authCtx.token) {
    return <Navigate to="/login" replace />;
  }
  if (authCtx.role !== role) {
    return <Navigate to={fallback || '/'} replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-bold">Loading security session...</div>;
  }
  if (authCtx.token && authCtx.role === 'admin') {
    return <Navigate to="/" replace />;
  }
  if (authCtx.token && authCtx.role === 'security') {
    return <Navigate to="/security" replace />;
  }
  if (authCtx.token && authCtx.role === 'member') {
    return <Navigate to="/member" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Login Page (Unified) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Admin Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="residents" element={<ResidentList />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="security-guards" element={<GuardManagement />} />
        </Route>

        {/* Security Guard Routes */}
        <Route path="/security" element={<RoleRoute role="security"><SecurityLayout /></RoleRoute>}>
          <Route index element={<SecurityDashboard />} />
          <Route path="entry" element={<VehicleEntry />} />
          <Route path="exit" element={<VehicleExit />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        {/* Member Routes */}
        <Route path="/member" element={<RoleRoute role="member"><MemberLayout /></RoleRoute>}>
          <Route index element={<MemberDashboard />} />
          <Route path="report" element={<ReportForm />} />
          <Route path="reports" element={<MyReports />} />
          <Route path="search" element={<SearchOwner />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#0F172A',
              },
              style: {
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#0F172A',
              },
              style: {
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
