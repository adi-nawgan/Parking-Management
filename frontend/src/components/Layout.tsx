import React, { useContext, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileClock,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Sun,
  Moon,
  AlertTriangle,
  LucideIcon
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const Layout: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);

  if (!authCtx || !themeCtx) throw new Error('Layout must be inside AuthProvider and ThemeProvider');

  const { admin, logout } = authCtx;
  const { theme, toggleTheme } = themeCtx;
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Residents Database', path: '/residents', icon: Users },
    { name: 'Visitor Logs', path: '/visitors', icon: ClipboardList },
    { name: 'System Settings', path: '/settings', icon: Settings },
    { name: 'Parking Reports', path: '/reports', icon: AlertTriangle },
  ];

  const toggleMobile = (): void => setMobileOpen(!mobileOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">

      {/* Mobile Top Bar */}
      <header className="md:hidden glass-panel flex justify-between items-center px-6 py-4 z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brandPurple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brandPurple-500/10">
            <ShieldAlert className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-brandPurple-600 to-indigo-500 bg-clip-text text-transparent dark:from-brandPurple-400 dark:to-indigo-300">SPMS</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <button onClick={toggleMobile} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex md:flex-col
        transition duration-300 ease-in-out z-50
        w-64 bg-[#070612] text-slate-200 border-r border-brandPurple-500/10 min-h-screen p-6 justify-between flex-shrink-0 shadow-2xl
      `}>
        <div>
          {/* Logo Header */}
          <div className="hidden md:flex items-center gap-3 mb-8 px-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brandPurple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brandPurple-500/15">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-brandPurple-400 to-indigo-300 bg-clip-text text-transparent leading-none">SPMS Console</span>
              <span className="text-[8px] tracking-[0.2em] font-extrabold text-slate-500 uppercase mt-0.5">Surveillance</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-brandPurple-500/15 text-brandPurple-300 border-l-4 border-brandPurple-500 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brandPurple-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area / Theme and Logout */}
        <div className="space-y-4">
          {/* User Badge */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-br from-darkCard/50 to-darkBg/30 border border-brandPurple-500/10 shadow-md relative overflow-hidden group">
            {/* Soft decorative background pulse */}
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-brandPurple-500/5 blur-xl group-hover:bg-brandPurple-500/10 transition-colors duration-300"></div>

            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brandPurple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm ring-2 ring-brandPurple-500/20">
                G
              </div>
              {/* Online Green Pulsing Dot */}
              <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070612] animate-pulse"></span>
            </div>

            <div className="overflow-hidden">
              <p className="text-[9px] text-brandPurple-400 font-bold uppercase tracking-widest">Active Guard</p>
              <p className="text-xs font-bold truncate text-slate-200" title={admin?.email}>
                {admin?.email || 'admin@society.com'}
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-3.5 w-full px-4 py-3 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/25 rounded-xl text-sm font-medium transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Layout;
