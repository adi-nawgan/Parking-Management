import React, { useState, useEffect } from 'react';
import { Shield, Car, Users, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import API from '../../services/api';
import PageTransition from '../shared/PageTransition';

interface DashboardStats {
  currentlyParkedCount: number;
  todayEntries: number;
  todayExits: number;
  activeVisitors: number;
}

const SecurityDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    currentlyParkedCount: 0,
    todayEntries: 0,
    todayExits: 0,
    activeVisitors: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/summary');
        const data = res.data;
        setStats({
          currentlyParkedCount: data.currentlyParkedCount || 0,
          todayEntries: data.currentlyParkedCount || 0,
          todayExits: 0,
          activeVisitors: data.currentlyParkedList?.filter((v: any) => v.type === 'visitor').length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time parking and gate overview</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Live
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Parked</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.currentlyParkedCount}</p>
          </div>

          <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entries</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayEntries}</p>
          </div>

          <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exits</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-rose-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayExits}</p>
          </div>

          <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visitors</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeVisitors}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/security/entry"
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-emerald-600 dark:text-emerald-400 font-bold text-sm"
            >
              <ArrowUpRight className="w-5 h-5" />
              Record Vehicle Entry
            </a>
            <a
              href="/security/exit"
              className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-rose-600 dark:text-rose-400 font-bold text-sm"
            >
              <ArrowDownLeft className="w-5 h-5" />
              Record Vehicle Exit
            </a>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SecurityDashboard;
