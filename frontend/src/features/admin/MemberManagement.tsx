import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { UserPlus, Unlock, ToggleLeft, ToggleRight, Search, Shield, ShieldAlert, Key, UserCheck, Trash, RefreshCw, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MemberManagementItem {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  buildingNumber: number;
  flatNumber: string;
  status: 'active' | 'deactivated';
  isLocked: boolean;
  lockUntil?: string;
  lookupCount: number;
}

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<MemberManagementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [buildingNumber, setBuildingNumber] = useState<number>(28);
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  const fetchMembers = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await API.get<MemberManagementItem[]>('/audit-logs/members');
      setMembers(data);
    } catch {
      toast.error('Failed to load member list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleUnlock = async (id: string, name: string): Promise<void> => {
    try {
      await API.post(`/audit-logs/members/${id}/unlock`);
      toast.success(`Unlocked account for ${name}`);
      fetchMembers();
    } catch {
      toast.error('Failed to unlock member account');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'deactivated', name: string): Promise<void> => {
    const nextStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await API.post(`/audit-logs/members/${id}/status`, { status: nextStatus });
      toast.success(`Account for ${name} is now ${nextStatus}`);
      fetchMembers();
    } catch {
      toast.error('Failed to update account status');
    }
  };

  const handleCreateMember = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name || !phone || !flatNumber || !password) {
      toast.error('Name, Phone, Flat Number, and Password are required');
      return;
    }

    setCreating(true);
    try {
      await API.post('/members/register', {
        name,
        email: email.trim() || undefined,
        phone: phone.trim(),
        buildingNumber,
        flatNumber: flatNumber.trim(),
        password,
      });

      toast.success(`Successfully registered member ${name}!`);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setBuildingNumber(28);
      setFlatNumber('');
      setPassword('');
      fetchMembers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create member account';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.phone.includes(search) || 
    m.flatNumber.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Resident Member Accounts</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400">Create, monitor, unlock, and deactivate member logins with system access rights.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-scale flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-all self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="premium-card p-4 max-w-md shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or flat..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="premium-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.05]">
                <th className="py-4 px-6">Occupant Name</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Residence Unit</th>
                <th className="py-4 px-6 text-center">Lookups Performed</th>
                <th className="py-4 px-6">Lockout Status</th>
                <th className="py-4 px-6">Account Mode</th>
                <th className="py-4 px-6 text-center">Administration Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Fetching member accounts...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-450 dark:text-slate-555">
                    No member accounts found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 px-6 font-semibold">{member.name}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-450">{member.phone}</td>
                    <td className="py-3.5 px-6 font-medium">Bldg {member.buildingNumber} • Flat {member.flatNumber}</td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono text-slate-900 dark:text-white">{member.lookupCount}</td>
                    <td className="py-3.5 px-6">
                      {member.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {member.status === 'deactivated' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded uppercase">
                          Deactivated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-450 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-3.5">
                        
                        {/* Unlock button */}
                        <button
                          disabled={!member.isLocked}
                          onClick={() => handleUnlock(member._id, member.name)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 border
                            ${member.isLocked 
                              ? 'bg-rose-550 border-rose-500 text-rose-500 hover:bg-rose-500/10 btn-scale' 
                              : 'opacity-40 cursor-not-allowed border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-slate-600'}`}
                          title="Manually unlock locked account"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unlock
                        </button>

                        {/* Deactivate/Activate button */}
                        <button
                          onClick={() => handleToggleStatus(member._id, member.status, member.name)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 border btn-scale
                            ${member.status === 'active'
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}
                        >
                          {member.status === 'active' ? (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn flex flex-col">
            
            {/* Header */}
            <div className="shrink-0 py-3.5 px-5 border-b border-slate-100 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Register Central Member Account</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateMember} className="p-5 space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Member Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Rahul@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Residence Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Building</label>
                  <select
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                  >
                    {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                      <option key={num} value={num}>Building {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest mb-1.5">Flat Number</label>
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="e.g. 502"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest mb-1.5">Account Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set login password..."
                  className="w-full px-3.5 py-2.5 pl-4 pr-11 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute bottom-3 right-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.08] mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Register Member</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MemberManagement;
