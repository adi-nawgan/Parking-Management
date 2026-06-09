import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Save,
  ShieldAlert,
  Mail,
  Lock,
  Sliders,
  CheckCircle
} from 'lucide-react';
import type { SystemSettings } from '../../types';

interface SettingsPayload {
  totalCapacity: number;
  overflowLimit: number;
  overstayLimit: number;
  adminEmail: string;
  adminPassword?: string;
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Settings form states
  const [totalCapacity, setTotalCapacity] = useState<number>(60);
  const [overflowLimit, setOverflowLimit] = useState<number>(68);
  const [overstayHours, setOverstayHours] = useState<number>(24);
  const [adminEmail, setAdminEmail] = useState<string>('');

  // Password updates
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const fetchSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await API.get<SystemSettings>('/settings');
      setTotalCapacity(data.totalCapacity);
      setOverflowLimit(data.overflowLimit);
      setAdminEmail(data.adminEmail);
      setOverstayHours(data.overstayLimit ? Math.round(data.overstayLimit / 60) : 24);
      setError('');
    } catch {
      setError('Failed to fetch settings from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const payload: SettingsPayload = {
      totalCapacity: Number(totalCapacity),
      overflowLimit: Number(overflowLimit),
      overstayLimit: Number(overstayHours) * 60,
      adminEmail
    };

    if (newPassword) {
      payload.adminPassword = newPassword;
    }

    try {
      await API.put('/settings', payload);
      setSuccess('Configuration settings saved successfully');
      setNewPassword('');
      setConfirmPassword('');
      fetchSettings();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to update system configurations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure threshold boundaries, alarm triggers, and security credentials.</p>
      </div>

      {success && (
        <div className="p-4 bg-brandTeal-500/10 border border-brandTeal-500/20 text-brandTeal-600 dark:text-brandTeal-400 text-sm rounded-xl text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Threshold Configuration Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <Sliders className="w-5 h-5 text-brandPurple-500 dark:text-brandPurple-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Capacity & Alarm Boundaries</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Marked Parking Capacity
              </label>
              <input
                type="number"
                required
                min={1}
                value={totalCapacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalCapacity(Number(e.target.value))}
                placeholder="Enter Capacity"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Stalls marked inside. If capacity goes above this, dashboard enters yellow warning overflow mode.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Critical Overflow Limit
              </label>
              <input
                type="number"
                required
                min={totalCapacity}
                value={overflowLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverflowLimit(Number(e.target.value))}
                placeholder="Enter Overflow Limit"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Absolute limit. If count hits this, system sends email alerts to the administrator and dashboard triggers red full warning.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Maximum Park Duration (Hours)
              </label>
              <input
                type="number"
                required
                min={1}
                value={overstayHours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverstayHours(Number(e.target.value))}
                placeholder="Enter Overstay Limit"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Time (in hours) a vehicle can remain parked before being highlighted as overstaying on the dashboard. Trigger email warning.
              </p>
            </div>

          </div>
        </div>

        {/* Security / Admin Credentials Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
              <ShieldAlert className="w-5 h-5 text-brandPurple-500 dark:text-brandPurple-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administrator Profile</h2>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Alert Target & Login Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminEmail(e.target.value)}
                  placeholder="Enter Admin Email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Change Password
              </label>
              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Leave empty to retain current password.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brandPurple-600 hover:bg-brandPurple-700 disabled:bg-brandPurple-600/50 text-white font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm mt-8 shadow-lg shadow-brandPurple-500/15"
          >
            <Save className="w-4 h-4" /> Save Configurations
          </button>
        </div>

      </form>

    </div>
  );
};

export default Settings;
