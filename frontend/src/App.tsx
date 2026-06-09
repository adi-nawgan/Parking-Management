import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

// Features
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import ResidentList from './features/residents/ResidentList';
import VisitorLogs from './features/visitors/VisitorLogs';
import LogList from './features/logs/LogList';
import Settings from './features/settings/Settings';
import { ThemeProvider } from './context/ThemeContext';

interface RouteGuardProps {
  children: ReactNode;
}

// Protected Route Shield
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

// Public Route Shield (prevents access to Login while already logged in)
const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const authCtx = useContext(AuthContext);

  if (!authCtx || authCtx.loading) {
    return <div className="min-h-screen bg-darkBg text-slate-400 flex items-center justify-center">Loading security session...</div>;
  }

  if (authCtx.token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>

        {/* Public auth paths */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Private console paths */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="residents" element={<ResidentList />} />
          <Route path="visitors" element={<VisitorLogs />} />
          <Route path="logs" element={<LogList />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
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
