import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import MemberLayout from './components/MemberLayout';

import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import VehicleEntry from './features/dashboard/VehicleEntry';
import VehicleExit from './features/dashboard/VehicleExit';
import ResidentList from './features/residents/ResidentList';
import VisitorLogs from './features/visitors/VisitorLogs';
import Logs from './features/logs/Logs';
import Settings from './features/settings/Settings';
import AdminReports from './features/admin/AdminReports';

import MemberDashboard from './features/member/MemberDashboard';
import ReportForm from './features/member/ReportForm';
import MyReports from './features/member/MyReports';
import SearchOwner from './features/member/SearchOwner';

import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
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
  if (authCtx.token && authCtx.role === 'member') {
    return <Navigate to="/member" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>

        {/* Login Page (Unified) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Admin Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="entry" element={<VehicleEntry />} />
          <Route path="exit" element={<VehicleExit />} />
          <Route path="residents" element={<ResidentList />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<AdminReports />} />
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
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px',
              fontWeight: 'bold',
              borderRadius: '12px',
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
