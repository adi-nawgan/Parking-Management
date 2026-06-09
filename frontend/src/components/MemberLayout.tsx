import React, { useContext, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Car,
  Sun,
  Moon,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const MemberLayout: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);

  if (!authCtx || !themeCtx) throw new Error('MemberLayout must be inside AuthProvider and ThemeProvider');

  const { member, logout } = authCtx;
  const { theme, toggleTheme } = themeCtx;
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/member', icon: LayoutDashboard },
    { name: 'Search Owner', path: '/member/search', icon: Search },
    { name: 'Report Issue', path: '/member/report', icon: AlertTriangle },
    { name: 'My Reports', path: '/member/reports', icon: ClipboardList },
  ];

  const toggleMobile = (): void => setMobileOpen(!mobileOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">

      {/* Premium Top Navbar */}
      <header className="h-16 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-darkCard px-6 flex justify-between items-center z-40 fixed top-0 left-0 right-0 transition-colors duration-300 shadow-sm">
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMobile} 
            className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white mr-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent leading-none">
              Member Portal
            </span>
            <span className="text-[8px] tracking-[0.2em] font-extrabold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
              Society resident
            </span>
          </div>
        </div>

        {/* Right Side: Theme, User Details, and Logout */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/85 border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-amber-400 transition-all duration-200 hover:scale-[1.02]"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Profile Badge (Desktop) */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                {member?.name || 'Society Occupant'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Bldg {member?.buildingNumber} • Flat {member?.flatNumber}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm ring-2 ring-blue-500/20">
              {member?.name?.charAt(0).toUpperCase() || 'M'}
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-scale flex items-center justify-center gap-2 px-3.5 py-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-450 bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800 dark:hover:bg-rose-500/10 border border-slate-200/50 dark:border-white/5 hover:border-rose-500/25 dark:hover:border-rose-500/25 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Drawer/Sidebar container */}
      <div className="pt-16 flex flex-1 relative min-h-0">
        <aside className="w-64 border-r border-slate-800 bg-[#0B0F19] p-6 hidden md:flex md:flex-col justify-between flex-shrink-0 fixed top-16 bottom-0 left-0 z-30 shadow-lg">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-l-4
                    ${isActive
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500 font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'}
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Status Info Footer */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-[10px] text-slate-400 space-y-1">
            <p className="font-bold uppercase tracking-wider text-slate-400">Security Guard Desk</p>
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Intercom Ready
            </div>
          </div>
        </aside>

        {/* Mobile Slide-in Drawer Navigation */}
        <div className={`
          fixed inset-0 z-50 md:hidden transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={toggleMobile}
          />
          {/* Menu Drawer */}
          <aside className={`
            absolute top-0 bottom-0 left-0 w-64 bg-[#0B0F19] p-6 border-r border-white/5 flex flex-col justify-between transition-transform duration-300 ease-out shadow-2xl
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-200">Member Portal</span>
                </div>
                <button 
                  onClick={toggleMobile}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={toggleMobile}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-l-4
                        ${isActive
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500 font-bold'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'}
                      `}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                  {member?.name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Member</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{member?.name || 'Resident Member'}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>

    </div>
  );
};

export default MemberLayout;
