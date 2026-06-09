import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Image as ImageIcon, Filter } from 'lucide-react';
import type { ParkingReport, ReportStatus } from '../../types';

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-brandTeal-600 dark:text-brandTeal-400', bg: 'bg-brandTeal-500/10', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle },
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ParkingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await API.get<ParkingReport[]>(`/admin/reports${params}`);
      setReports(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    try {
      await API.put(`/admin/reports/${id}/status`, { status });
      fetchReports();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Parking Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Review and resolve member-submitted parking violation reports.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brandPurple-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm p-4">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-200 dark:border-white/5">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No reports found</p>
          <p className="text-xs text-slate-500 mt-1">No parking violation reports match your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => {
            const cfg = statusConfig[r.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={r._id} className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.color.replace('text', 'border')}/20`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm capitalize">{r.reportType.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500">Reported by <span className="font-semibold">{r.reportedBy?.name || 'Unknown'}</span> • {r.reportedBy?.email} • Bldg {r.reportedBy?.buildingNumber} Flat {r.reportedBy?.flatNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color} border ${cfg.color.replace('text', 'border')}/20 flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>

                {r.plate && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Plate:</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-xs font-mono font-bold tracking-wider">{r.plate}</span>
                  </div>
                )}

                <p className="text-sm text-slate-600 dark:text-slate-300">{r.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>📍 Building {r.location.buildingNumber}{r.location.description ? ` • ${r.location.description}` : ''}</span>
                  {r.photoUrl && (
                    <a href={import.meta.env.VITE_API_URL?.replace('/api', '') + r.photoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brandPurple-600 dark:text-brandPurple-400 hover:underline font-medium">
                      <ImageIcon className="w-3 h-3" /> View Photo
                    </a>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                </div>

                {r.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <button onClick={() => handleResolve(r._id, 'resolved')}
                      className="px-3 py-1.5 bg-brandTeal-500/10 hover:bg-brandTeal-500 text-brandTeal-600 hover:text-white rounded-lg text-xs font-semibold border border-brandTeal-500/25 hover:border-transparent transition-all duration-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                    <button onClick={() => handleResolve(r._id, 'dismissed')}
                      className="px-3 py-1.5 bg-slate-500/10 hover:bg-slate-500 text-slate-500 hover:text-white rounded-lg text-xs font-semibold border border-slate-500/25 hover:border-transparent transition-all duration-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                )}

                {r.resolvedAt && (
                  <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-white/5">
                    {r.status === 'resolved' ? 'Resolved' : 'Dismissed'} on {new Date(r.resolvedAt).toLocaleString()}
                    {r.resolvedBy && ` by ${r.resolvedBy.email}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
