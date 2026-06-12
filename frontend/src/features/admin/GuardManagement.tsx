import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Loader2, X, UserCheck } from 'lucide-react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

interface Guard {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'deactivated';
}

const GuardManagement: React.FC = () => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchGuards = async () => {
    try {
      const res = await API.get('/admin/security-guards');
      setGuards(res.data);
    } catch (err) {
      console.error('Failed to fetch guards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/admin/security-guards', formData);
      toast.success('Security guard created successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchGuards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create guard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await API.patch(`/admin/security-guards/${id}/status`);
      toast.success('Guard status updated');
      fetchGuards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this guard?')) return;
    try {
      await API.delete(`/admin/security-guards/${id}`);
      toast.success('Guard deleted');
      fetchGuards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete guard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security Guards</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage guard accounts and access</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Guard
        </button>
      </div>

      <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
              {guards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No security guards yet. Click "Add Guard" to create one.
                  </td>
                </tr>
              ) : (
                guards.map((guard) => (
                  <tr key={guard._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{guard.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{guard.email}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{guard.phone}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(guard._id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          guard.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}
                      >
                        {guard.status === 'active' ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(guard._id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-darkCard border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Security Guard</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="guard@society.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="Set a secure password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Guard
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardManagement;
