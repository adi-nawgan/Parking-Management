import React, { useState } from 'react';
import API from '../../services/api';
import { AlertTriangle, Upload, Camera, MapPin, Search, X } from 'lucide-react';
import type { ReportType } from '../../types';

const buildingOptions = [28, 29, 30, 31, 32, 33, 34, 35, 36, 37];

const ReportForm: React.FC = () => {
  const [plate, setPlate] = useState('');
  const [reportType, setReportType] = useState<ReportType>('wrongly_parked');
  const [description, setDescription] = useState('');
  const [buildingNumber, setBuildingNumber] = useState(28);
  const [locationDesc, setLocationDesc] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be under 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!description.trim()) {
      setError('Please provide a description');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (plate.trim()) formData.append('plate', plate);
    formData.append('reportType', reportType);
    formData.append('description', description);
    formData.append('location', JSON.stringify({ buildingNumber, description: locationDesc }));
    if (photo) formData.append('photo', photo);

    try {
      await API.post('/members/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Report submitted successfully!');
      setPlate('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      setLocationDesc('');
    } catch {
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes: { value: ReportType; label: string; desc: string }[] = [
    { value: 'wrongly_parked', label: 'Wrongly Parked', desc: 'Vehicle parked outside designated area' },
    { value: 'took_extra_space', label: 'Took Extra Space', desc: 'Vehicle occupying more than one spot' },
    { value: 'other', label: 'Other', desc: 'Any other parking violation' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Report Parking Issue</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Submit a report about a parking violation for admin review.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5">
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl text-center font-medium">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-brandTeal-500/10 border border-brandTeal-500/20 text-brandTeal-600 dark:text-brandTeal-400 text-xs rounded-xl text-center font-medium">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Plate (optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Vehicle Plate (optional)
            </label>
            <input type="text" value={plate} onChange={e => setPlate(e.target.value)}
              placeholder="Enter plate number if known"
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 uppercase tracking-widest text-sm" />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Issue Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reportTypes.map(rt => (
                <button type="button" key={rt.value} onClick={() => setReportType(rt.value)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${reportType === rt.value
                    ? 'bg-brandPurple-500/10 border-brandPurple-500/30 text-brandPurple-700 dark:text-brandPurple-300'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}`}>
                  <p className="text-xs font-bold">{rt.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{rt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Building
              </label>
              <select value={buildingNumber} onChange={e => setBuildingNumber(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-sm">
                {buildingOptions.map(n => <option key={n} value={n}>Building {n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Location Detail</label>
              <input type="text" value={locationDesc} onChange={e => setLocationDesc(e.target.value)}
                placeholder="e.g. Near entrance, Row 3"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe what you observed..."
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm resize-none" />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Photo Evidence (optional, max 5MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-brandPurple-500/30 transition-colors text-sm text-slate-600 dark:text-slate-400">
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoChange} className="hidden" />
              </label>
              {photoPreview && (
                <div className="relative">
                  <img src={photoPreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-white/10" />
                  <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            {loading ? 'Submitting...' : <><AlertTriangle className="w-4 h-4" /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
