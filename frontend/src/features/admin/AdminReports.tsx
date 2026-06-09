import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Image as ImageIcon, Filter, X, ShieldAlert, MapPin, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ParkingReport, ReportStatus } from '../../types';

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle },
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ParkingReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Selected Report for detail modal
  const [selectedReport, setSelectedReport] = useState<ParkingReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await API.get<ParkingReport[]>(`/admin/reports${params}`);
      setReports(data);
    } catch {
      toast.error('Failed to load parking complaints');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolveStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    try {
      await API.put(`/admin/reports/${id}/status`, { status });
      toast.success(`Complaint status set to ${status}`);
      setSelectedReport(null); // Close modal
      fetchReports();
    } catch {
      toast.error('Failed to update complaint status');
    }
  };

  const getTimeAgo = (dateStr: string): string => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const getPhotoUrl = (path: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const cleanBase = baseUrl.replace('/api', '');
    return `${cleanBase}${path}`;
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Complaints Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Review parking violations and wrongly parked vehicles reported by residents.</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Searching complaint registries...
        </div>
      ) : reports.length === 0 ? (
        <div className="premium-card p-12 text-center border-slate-200">
          <AlertTriangle className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-350">No complaints logged</p>
          <p className="text-xs text-slate-500 mt-1">There are no reports registered under the selected status filter.</p>
        </div>
      ) : (
        /* Complaints Card Grid layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(r => {
            const cfg = statusConfig[r.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            
            return (
              <div 
                key={r._id} 
                onClick={() => setSelectedReport(r)}
                className="premium-card p-5 flex flex-col justify-between gap-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] border-slate-200 hover:border-blue-500/20"
              >
                <div className="space-y-3">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start gap-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color} border border-transparent`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {getTimeAgo(r.createdAt)}
                    </span>
                  </div>

                  {/* Classification Title */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white capitalize text-sm">
                      {r.reportType.replace(/_/g, ' ')}
                    </h3>
                    {r.plate && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded font-mono text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {r.plate}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / Image container if loaded */}
                  {r.photoUrl ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 relative group">
                      <img 
                        src={getPhotoUrl(r.photoUrl)} 
                        alt="violation snippet" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-250 dark:border-white/5 flex flex-col justify-center items-center text-slate-450">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">No Photo Evidence</span>
                    </div>
                  )}

                  {/* Slogan */}
                  <p className="text-xs text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                {/* Footer details */}
                <div className="border-t border-slate-100 dark:border-white/[0.05] pt-3 flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> Bldg {r.location.buildingNumber}</span>
                  <span className="truncate max-w-[120px] text-right font-medium">
                    By {r.reportedBy?.name || 'Occupant'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full details Modal View */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn max-h-[90vh] flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Complaint Detailed File</h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-200">
              
              {/* Photo Evidence in large detail */}
              {selectedReport.photoUrl ? (
                <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 relative">
                  <img 
                    src={getPhotoUrl(selectedReport.photoUrl)} 
                    alt="parking issue snippet" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-250 dark:border-white/10 flex flex-col justify-center items-center text-slate-450">
                  <ImageIcon className="w-10 h-10 opacity-30 mb-1" />
                  <span className="text-xs uppercase font-bold tracking-widest opacity-55">No Photo Evidence Loaded</span>
                </div>
              )}

              {/* Status Header info */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/[0.05] pb-4">
                <div>
                  <h4 className="text-base font-extrabold capitalize text-slate-900 dark:text-white">
                    {selectedReport.reportType.replace(/_/g, ' ')}
                  </h4>
                  {selectedReport.plate && (
                    <span className="inline-block mt-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Plate: {selectedReport.plate}
                    </span>
                  )}
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase border ${
                    statusConfig[selectedReport.status]?.bg
                  } ${statusConfig[selectedReport.status]?.color}`}>
                    {statusConfig[selectedReport.status]?.label}
                  </span>
                </div>
              </div>

              {/* Location and Description details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Bldg {selectedReport.location.buildingNumber} • {selectedReport.location.description || 'General lot'}</div>
                <div className="flex items-center gap-1.5 justify-end"><Clock className="w-4 h-4 text-blue-500" /> Logged {new Date(selectedReport.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Issue Description</span>
                <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  {selectedReport.description}
                </p>
              </div>

              {/* Reported occupant information */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{selectedReport.reportedBy?.name || 'Occupant'}</span>
                    <span className="block text-[10px] text-slate-450 tracking-wider">Flat {selectedReport.reportedBy?.flatNumber} occupant</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">{selectedReport.reportedBy?.phone}</p>
                </div>
              </div>

            </div>

            {/* Actions Footer inside Modal */}
            <div className="p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.01] flex gap-3">
              {selectedReport.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleResolveStatus(selectedReport._id, 'dismissed')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/85 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all"
                  >
                    Dismiss Complaint
                  </button>
                  <button
                    onClick={() => handleResolveStatus(selectedReport._id, 'resolved')}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10"
                  >
                    Resolve Violation
                  </button>
                </>
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-450 dark:text-slate-500 py-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complaint resolved & archives updated.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReports;
