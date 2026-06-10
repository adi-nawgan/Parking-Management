import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageTransition from '../shared/PageTransition';
import {
  ClipboardList,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { VisitorLog } from '../../types';

const VisitorLogs: React.FC = () => {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Filters state
  const [plate, setPlate] = useState<string>('');
  const [flat, setFlat] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchVisitorLogs = async (): Promise<void> => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (plate) queryParams.append('plate', plate);
      if (flat) queryParams.append('flat', flat);
      if (building) queryParams.append('building', building);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const { data } = await API.get<VisitorLog[]>(`/visitors?${queryParams.toString()}`);
      setVisitorLogs(data);
      setError('');
    } catch {
      setError('Failed to fetch visitor records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plate, flat, building, startDate, endDate]);

  const clearFilters = (): void => {
    setPlate('');
    setFlat('');
    setBuilding('');
    setStartDate('');
    setEndDate('');
  };

  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const getActiveDuration = (entryTime: string): string => {
    const diffMs = new Date().getTime() - new Date(entryTime).getTime();
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return formatDuration(diffMins);
  };

  const handleLogExit = async (vehiclePlate: string): Promise<void> => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1 min-w-[250px]">
        <p className="text-slate-200 text-xs font-semibold">
          Are you sure you want to log exit for vehicle {vehiclePlate}?
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-450 rounded-lg border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await API.post('/dashboard/exit', { plate: vehiclePlate });
                toast.success(`Vehicle ${vehiclePlate} logged out successfully`);
                fetchVisitorLogs();
              } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                toast.error(e.response?.data?.message || 'Failed to log vehicle exit');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-[10px] font-bold text-white rounded-lg shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      style: {
        background: '#0F172A',
        border: '1px solid rgba(245, 158, 11, 0.25)', // warning accent
      }
    });
  };

  return (
    <PageTransition><div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Visitor Logs</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Historical archive of external visitor entries, flat destinations, and repeat visits.</p>
      </div>

      {/* Filters Form */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Search Filters</span>
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-rose-450 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Plate Number</label>
            <input
              type="text"
              value={plate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlate(e.target.value)}
              placeholder="Enter Plate Number"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Building</label>
            <select
              value={building}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilding(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
            >
              <option value="">All Buildings</option>
              {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                <option key={num} value={num}>Building {num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Flat Visited</label>
            <input
              type="text"
              value={flat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlat(e.target.value)}
              placeholder="Enter Flat Number"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading visitor records...
          </div>
        ) : visitorLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">No Visitor Logs Found</p>
            <p className="text-xs text-slate-500">There are no records matching your current filter choices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-white/[0.01] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Plate</th>
                  <th className="py-4 px-6">Visitor Name</th>
                  <th className="py-4 px-6">Destination</th>
                  <th className="py-4 px-6">Entry Time</th>
                  <th className="py-4 px-6">Exit Time</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Status / Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-200">
                {visitorLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-100/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
                        {log.plate}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {log.visitorDetails?.name}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Bldg {log.buildingNumber} • Flat {log.flatNumber}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{log.visitorDetails?.purpose}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-xs">
                      {new Date(log.entryTime).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-xs">
                      {log.isCurrentlyInside ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brandTeal-500/10 text-brandTeal-600 dark:text-brandTeal-400 border border-brandTeal-500/25 uppercase whitespace-nowrap">
                            Still Inside
                          </span>
                          <button
                            onClick={() => handleLogExit(log.plate)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-[10px] font-bold border border-rose-500/25 hover:border-transparent transition-all duration-200"
                          >
                            Log Exit
                          </button>
                        </div>
                      ) : (
                        log.exitTime ? new Date(log.exitTime).toLocaleString() : '—'
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">
                      {log.isCurrentlyInside ? getActiveDuration(log.entryTime) : formatDuration(log.duration ?? 0)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {log.isCurrentlyInside && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brandTeal-500/10 text-brandTeal-600 dark:text-brandTeal-400 border border-brandTeal-500/25 uppercase">
                            Currently inside
                          </span>
                        )}
                        {log.isRepeatVisitor ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 uppercase flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" /> Repeat • {log.totalVisits} Visits
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700/20 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent uppercase">
                            First Visit
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div></PageTransition>
  );
};

export default VisitorLogs;
