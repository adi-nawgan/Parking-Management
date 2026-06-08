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
  Moon
} from 'lucide-react';

const Layout = () => {
  const { admin, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Residents Database', path: '/residents', icon: Users },
    { name: 'Visitor Logs', path: '/visitors', icon: ClipboardList },
    { name: 'Complete Logs', path: '/logs', icon: FileClock },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden glass-panel flex justify-between items-center px-6 py-4 z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-brandPurple-500 dark:text-brandPurple-400" />
          <span className="font-extrabold text-lg tracking-wider text-brandPurple-600 dark:text-brandPurple-400">SPMS</span>
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
        md:translate-x-0 md:static md:flex md:flex-col
        transition duration-300 ease-in-out z-50
        w-64 glass-panel min-h-screen p-6 justify-between flex-shrink-0
      `}>
        <div>
          {/* Logo Header */}
          <div className="hidden md:flex items-center gap-2.5 mb-8 px-2">
            <ShieldAlert className="w-7 h-7 text-brandPurple-500 dark:text-brandPurple-400" />
            <span className="font-extrabold text-xl tracking-wider text-brandPurple-600 dark:text-brandPurple-400">S P M S</span>
          </div>
 
          {/* User Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 mb-8">
            <div className="w-9 h-9 rounded-full bg-brandPurple-600 dark:bg-brandPurple-500 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Security Guard</p>
              <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{admin?.email}</p>
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
                      ? 'bg-brandPurple-500/10 dark:bg-brandPurple-500/15 text-brandPurple-700 dark:text-brandPurple-300 border-l-4 border-brandPurple-600 dark:border-brandPurple-500 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brandPurple-600 dark:text-brandPurple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area / Theme and Logout */}
        <div className="space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3.5 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl text-sm font-medium transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
