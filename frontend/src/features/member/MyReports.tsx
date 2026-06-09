import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Image as ImageIcon, FileText } from 'lucide-react';
import type { ParkingReport, ReportStatus } from '../../types';

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-brandTeal-600 dark:text-brandTeal-400', bg: 'bg-brandTeal-500/10', border: 'border-brandTeal-500/20', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: XCircle },
};

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<ParkingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get<ParkingReport[]>('/members/reports');
        setReports(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-slate-500 text-sm p-4">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Track the status of your parking violation reports.</p>
      </div>

      {reports.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-200 dark:border-white/5">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No reports yet</p>
          <p className="text-xs text-slate-500 mt-1">Submit your first parking violation report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => {
            const cfg = statusConfig[r.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={r._id} className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm capitalize">{r.reportType.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color} ${cfg.border} border flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>

                {r.plate && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Plate:</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100">
                      {r.plate}
                    </span>
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
                </div>

                {r.resolvedAt && (
                  <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-white/5">
                    {r.status === 'resolved' ? 'Resolved' : 'Dismissed'} on {new Date(r.resolvedAt).toLocaleDateString()}
                    {r.resolvedBy && ` by admin`}
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

export default MyReports;
