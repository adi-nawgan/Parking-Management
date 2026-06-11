import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PageTransition from '../shared/PageTransition';
import {
  ClipboardList,
  XCircle,
  FileSpreadsheet,
  Car,
  Building,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ParkingLog } from '../../types';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ParkingLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [plate, setPlate] = useState<string>('');
  const [flat, setFlat] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchLogs = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (plate) params.append('plate', plate);
      if (flat) params.append('flat', flat);
      if (building) params.append('building', building);
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await API.get<ParkingLog[]>(`/logs?${params.toString()}`);
      setLogs(data);
      setError('');
    } catch {
      setError('Failed to fetch vehicle logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plate, flat, building, type, startDate, endDate]);

  const clearFilters = (): void => {
    setPlate('');
    setFlat('');
    setBuilding('');
    setType('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = async (): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (plate) params.append('plate', plate);
      if (flat) params.append('flat', flat);
      if (building) params.append('building', building);
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await API.get(`/logs/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parking_logs_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported as CSV');
    } catch {
      toast.error('Failed to export logs');
    }
  };

  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const getPersonName = (log: ParkingLog): string => {
    if (log.type === 'visitor') {
      return log.visitorDetails?.name || '—';
    }
    return (log.residentId as { ownerName?: string } | null)?.ownerName || '—';
  };

  return (
    <PageTransition><div className="space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vehicle Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Complete history of all vehicle entries and exits.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-scale flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-all self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export as CSV</span>
        </button>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Plate Number</label>
            <input
              type="text"
              value={plate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlate(e.target.value)}
              placeholder="Enter Plate"
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
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Flat</label>
            <input
              type="text"
              value={flat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlat(e.target.value)}
              placeholder="Enter Flat"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Type</label>
            <select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
            >
              <option value="">All Types</option>
              <option value="resident">Resident</option>
              <option value="tenant">Tenant</option>
              <option value="visitor">Visitor</option>
            </select>
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

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading vehicle logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">No Logs Found</p>
            <p className="text-xs text-slate-500">No vehicle logs match your current filter choices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-white/[0.01] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Plate</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Destination</th>
                  <th className="py-4 px-6">Entry Time</th>
                  <th className="py-4 px-6">Exit Time</th>
                  <th className="py-4 px-6">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-100/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
                        {log.plate}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        log.type === 'resident'
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20'
                          : log.type === 'tenant'
                          ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {getPersonName(log)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Bldg {log.buildingNumber} • Flat {log.flatNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-xs">
                      {new Date(log.entryTime).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-xs">
                      {log.exitTime ? new Date(log.exitTime).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDuration(log.duration)}
                      </span>
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

export default Logs;
