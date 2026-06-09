import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Car, MapPin, CheckCircle2 } from 'lucide-react';
import type { MemberParkingSummary } from '../../types';

const MemberDashboard: React.FC = () => {
  const [summary, setSummary] = useState<MemberParkingSummary | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get<MemberParkingSummary>('/members/parking-summary');
        setSummary(data);
      } catch { /* ignore */ }
    };
    fetch();
  }, []);

  const fillPercent = summary ? Math.min(100, Math.round((summary.currentlyParkedCount / summary.totalCapacity) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Member Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">View available parking spots in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Capacity</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{summary?.totalCapacity || '...'}</span>
            <Car className="w-5 h-5 text-brandPurple-500" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currently Parked</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{summary?.currentlyParkedCount || '...'}</span>
            <MapPin className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Spots</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-extrabold ${summary?.availableSpots === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-brandTeal-600 dark:text-brandTeal-400'}`}>
              {summary?.availableSpots ?? '...'}
            </span>
            <CheckCircle2 className="w-5 h-5 text-brandTeal-500" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Parking Occupancy</span>
          <span className="text-sm text-slate-500">{summary?.currentlyParkedCount ?? 0} / {summary?.totalCapacity ?? 0}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-white/5">
          <div className="h-full bg-brandPurple-500 transition-all duration-500" style={{ width: `${fillPercent}%` }} />
        </div>
        <p className="text-xs text-slate-500 text-center">{summary ? `${fillPercent}% occupied` : 'Loading...'}</p>
      </div>
    </div>
  );
};

export default MemberDashboard;
