import React, { useContext, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardList,
  FileClock,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Car,
  Shield,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const SecurityLayout: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);

  if (!authCtx || !themeCtx) throw new Error('SecurityLayout must be inside AuthProvider and ThemeProvider');

  const { security, logout } = authCtx;
  const { theme, toggleTheme } = themeCtx;
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/security', icon: LayoutDashboard },
    { name: 'Vehicle Entry', path: '/security/entry', icon: ArrowUpRight },
    { name: 'Vehicle Exit', path: '/security/exit', icon: ArrowDownLeft },
    { name: 'Visitors', path: '/security/visitors', icon: ClipboardList },
    { name: 'Logs', path: '/security/logs', icon: FileClock },
  ];

  const toggleMobile = (): void => setMobileOpen(!mobileOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">

      <header className="h-16 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-darkCard px-6 flex items-center justify-between z-40 fixed top-0 left-0 right-0 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-3 bg-[#0B0F19] -ml-6 pl-6 pr-4 h-16 md:w-56">
          <button
            onClick={toggleMobile}
            className="md:hidden text-slate-400 hover:text-white mr-1"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-[#0B0F19] flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-white leading-none">
              SPMS Guard
            </span>
            <span className="text-[8px] tracking-[0.2em] font-extrabold text-slate-500 uppercase mt-0.5">
              Security Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/85 border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-amber-400 transition-all duration-200 hover:scale-[1.02]"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                {security?.name || 'Security Guard'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                On Duty
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm ring-2 ring-amber-500/20">
              S
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-scale flex items-center justify-center gap-2 px-3.5 py-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800 dark:hover:bg-rose-500/10 border border-slate-200/50 dark:border-white/5 hover:border-rose-500/25 dark:hover:border-rose-500/25 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="pt-16 flex flex-1 relative min-h-0">
        <aside className="w-56 border-r border-slate-800 bg-[#0B0F19] p-4 hidden md:flex md:flex-col flex-shrink-0 fixed top-16 bottom-0 left-0 z-30 shadow-lg">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border
                    ${isActive
                      ? 'bg-amber-500/15 text-amber-400 font-bold shadow-sm border-amber-500/20'
                      : 'text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={`
          fixed inset-0 z-50 md:hidden transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={toggleMobile}
          />
          <aside className={`
            absolute top-0 bottom-0 left-0 w-56 bg-[#0B0F19] p-4 border-r border-white/5 flex flex-col justify-between transition-transform duration-300 ease-out shadow-2xl
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-200 flex-1">SPMS Guard</span>
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
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border
                        ${isActive
                          ? 'bg-amber-500/15 text-amber-400 font-bold border-amber-500/20'
                          : 'text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white'}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-extrabold text-xs">
                S
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">On Duty</p>
                <p className="text-xs font-bold text-slate-300 truncate">{security?.name || 'Security Guard'}</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex-1 md:pl-56 flex flex-col min-w-0 transition-all duration-300">
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>

    </div>
  );
};

export default SecurityLayout;
