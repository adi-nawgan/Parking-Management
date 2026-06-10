import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Search, FileSpreadsheet, Calendar, AlertTriangle, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface AuditLogEntry {
  _id: string;
  memberId?: string;
  memberName?: string;
  memberFlat?: string;
  actionType: string;
  plateSearched?: string;
  ipAddress: string;
  suspiciousActivity: boolean;
  timestamp: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [memberName, setMemberName] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchLogs = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (memberName.trim()) params.append('memberName', memberName.trim());
      if (actionType.trim()) params.append('actionType', actionType.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await API.get<AuditLogEntry[]>(`/audit-logs?${params.toString()}`);
      setLogs(data);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberName, actionType, startDate, endDate]);

  const handleResetFilters = (): void => {
    setMemberName('');
    setActionType('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = (): void => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'Member Name', 'Flat Number', 'Action Type', 'Plate Searched', 'IP Address', 'Suspicious Alert'];
    const rows = logs.map(l => [
      format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      l.memberName || 'System/Unknown',
      l.memberFlat || 'N/A',
      l.actionType,
      l.plateSearched || 'N/A',
      l.ipAddress,
      l.suspiciousActivity ? 'YES' : 'NO'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spms_audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Security Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track and monitor resident lookups, authentication failures, and suspicious activities.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-scale flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-all self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export as CSV</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="premium-card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 shadow-sm">
        
        {/* Name search */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Member Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Filter by name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Action Type dropdown */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Action Type</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="">All Actions</option>
            <option value="plate-lookup">Plate Lookup</option>
            <option value="failed-login">Failed Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>

        {/* Start Date picker */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* End Date picker */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
          <button
            onClick={handleResetFilters}
            className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Table view */}
      <div className="premium-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.05]">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Member Name</th>
                <th className="py-4 px-6">Flat</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Details / Plate</th>
                <th className="py-4 px-6">IP Address</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Querying audit log database...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-450 dark:text-slate-500">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const dateStr = format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss');
                  return (
                    <tr 
                      key={log._id}
                      className={`
                        transition-colors duration-150
                        ${log.suspiciousActivity 
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-350 hover:bg-rose-500/15' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300'}
                      `}
                    >
                      <td className="py-3.5 px-6 font-mono font-medium">{dateStr}</td>
                      <td className="py-3.5 px-6 font-semibold">
                        {log.memberName || <span className="text-slate-400 italic">System</span>}
                      </td>
                      <td className="py-3.5 px-6">{log.memberFlat || 'N/A'}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${log.actionType === 'plate-lookup'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10'
                            : log.actionType === 'failed-login'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold tracking-wider">
                        {log.plateSearched || '-'}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-450">{log.ipAddress}</td>
                      <td className="py-3.5 px-6 text-center">
                        {log.suspiciousActivity ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" /> Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" /> Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuditLogs;
