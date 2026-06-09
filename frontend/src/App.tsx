import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import MemberLayout from './components/MemberLayout';

import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import ResidentList from './features/residents/ResidentList';
import VisitorLogs from './features/visitors/VisitorLogs';
import LogList from './features/logs/LogList';
import Settings from './features/settings/Settings';
import AdminReports from './features/admin/AdminReports';

import MemberLogin from './features/member/MemberLogin';
import MemberDashboard from './features/member/MemberDashboard';
import SearchPlate from './features/member/SearchPlate';
import ReportForm from './features/member/ReportForm';
import MyReports from './features/member/MyReports';

import { ThemeProvider } from './context/ThemeContext';
import type { UserRole } from './types';

interface RouteGuardProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-darkBg text-slate-400 flex items-center justify-center">Loading security session...</div>;
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
    return <div className="min-h-screen bg-darkBg text-slate-400 flex items-center justify-center">Loading security session...</div>;
  }
  if (!authCtx.token) {
    return <Navigate to={role === 'member' ? '/member/login' : '/login'} replace />;
  }
  if (authCtx.role !== role) {
    return <Navigate to={fallback || '/'} replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-darkBg text-slate-400 flex items-center justify-center">Loading security session...</div>;
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

        {/* Admin Login */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Member Login / Register */}
        <Route path="/member/login" element={<PublicRoute><MemberLogin /></PublicRoute>} />

        {/* Admin Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="residents" element={<ResidentList />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="logs" element={<LogList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Member Routes */}
        <Route path="/member" element={<RoleRoute role="member"><MemberLayout /></RoleRoute>}>
          <Route index element={<MemberDashboard />} />
          <Route path="search-plate" element={<SearchPlate />} />
          <Route path="report" element={<ReportForm />} />
          <Route path="reports" element={<MyReports />} />
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
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
