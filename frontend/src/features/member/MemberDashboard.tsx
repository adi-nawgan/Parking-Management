import React, { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { 
  Car, 
  Search, 
  AlertTriangle, 
  Camera, 
  Phone, 
  Building, 
  Upload, 
  X, 
  User, 
  Loader2 
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { toast } from 'react-hot-toast';
import type { MemberParkingSummary, PlateOwnerMatch, ReportType } from '../../types';

const MemberDashboard: React.FC = () => {
  const themeCtx = useContext(ThemeContext);
  const authCtx = useContext(AuthContext);
  if (!themeCtx) throw new Error('MemberDashboard must be inside ThemeProvider');
  const { theme } = themeCtx;
  const memberBuilding = authCtx?.member?.buildingNumber || 28;

  const [summary, setSummary] = useState<MemberParkingSummary | null>(null);
  
  const [activeModal, setActiveModal] = useState<'report' | 'search' | null>(null);

  const [reportPlate, setReportPlate] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('wrongly_parked');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [locationDesc, setLocationDesc] = useState<string>('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

  const [searchPlate, setSearchPlate] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PlateOwnerMatch[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      const { data } = await API.get<MemberParkingSummary>('/members/parking-summary');
      setSummary(data);
    } catch {
      console.error('Failed to load parking metrics');
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const fillPercent = summary ? Math.min(100, Math.round((summary.currentlyParkedCount / summary.totalCapacity) * 100)) : 0;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      toast.success('Evidence image uploaded');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      toast.success('Evidence image uploaded');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setSubmittingReport(true);
    const formData = new FormData();
    if (reportPlate.trim()) formData.append('plate', reportPlate.toUpperCase().trim());
    formData.append('reportType', reportType);
    formData.append('description', reportDescription);
    formData.append('location', JSON.stringify({ buildingNumber: memberBuilding, description: locationDesc }));
    if (photo) formData.append('photo', photo);

    try {
      await API.post('/members/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Parking violation report submitted');
      setReportPlate('');
      setReportDescription('');
      setLocationDesc('');
      setPhoto(null);
      setPhotoPreview(null);
      setActiveModal(null);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleOwnerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);
    setHasSearched(false);
    try {
      const { data } = await API.get<PlateOwnerMatch[]>(`/members/search-plate?plate=${searchPlate.trim().toUpperCase()}`);
      setSearchResults(data);
      setHasSearched(true);
    } catch {
      toast.error('Failed to query plate details');
    } finally {
      setSearchLoading(false);
    }
  };

  const reportTypesList: { value: ReportType; label: string; desc: string }[] = [
    { value: 'wrongly_parked', label: 'Wrongly Parked', desc: 'Vehicle parked outside designated lines' },
    { value: 'took_extra_space', label: 'Took Extra Space', desc: 'Vehicle occupying more than one space' },
    { value: 'other', label: 'Other violation', desc: 'Any other parking issue or blocked exits' },
  ];

  return (
    <div className="space-y-8 relative z-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Member Console</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time society parking occupancy, owner search, and instant complaints.</p>
      </div>

      {/* Main Row: Speedometer Left, Quick Actions Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Speedometer ring */}
        <div className="premium-card p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden md:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.01] to-transparent pointer-events-none"></div>
          
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
            Live Occupancy
          </h3>

          <div className={`w-48 h-48 transition-all duration-300 ${
            fillPercent >= 95 ? 'glow-ring-red' : fillPercent >= 80 ? 'glow-ring-amber' : 'glow-ring-green'
          }`}>
            <CircularProgressbar
              value={summary?.currentlyParkedCount || 0}
              maxValue={summary?.totalCapacity || 60}
              text={summary ? `${summary.currentlyParkedCount} / ${summary.totalCapacity}` : '...'}
              styles={buildStyles({
                pathColor: fillPercent >= 95 ? '#EF4444' : fillPercent >= 80 ? '#F59E0B' : '#22C55E',
                textColor: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                trailColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                textSize: '14px',
              })}
            />
          </div>

          <div className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {summary?.availableSpots || 0} slots remaining
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:col-span-2">
          
          {/* Report Wrong Parking */}
          <div 
            onClick={() => setActiveModal('report')}
            className="premium-card premium-card-red p-6 cursor-pointer flex flex-col justify-between items-start gap-6 border-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">Report Wrong Parking</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">File a parking violation complaint with photo evidence directly to society admins.</p>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
              File Report <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Search Owner */}
          <div 
            onClick={() => setActiveModal('search')}
            className="premium-card premium-card-blue p-6 cursor-pointer flex flex-col justify-between items-start gap-6 border-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">Lookup Owner Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search a license plate number to find the owner's unit number and phone details.</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Lookup Plate <Car className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>
      </div>

      {/* Mini details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="premium-card p-5 border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Building slots</span>
          <p className="text-xl font-black text-slate-800 dark:text-white font-mono">Bldg {memberBuilding}</p>
        </div>
        <div className="premium-card p-5 border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total slots</span>
          <p className="text-xl font-black text-slate-800 dark:text-white font-mono">{summary?.totalCapacity || 60}</p>
        </div>
        <div className="premium-card p-5 border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System status</span>
          <p className="text-xl font-black text-emerald-500 flex items-center gap-1.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Surveillance OK
          </p>
        </div>
      </div>

      {/* 1. Report Modal */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn flex flex-col max-h-[70vh]">
            
            {/* Header */}
            <div className="shrink-0 py-3 px-5 border-b border-slate-100 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">File Violation Report</h3>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-3.5">
              
              {/* Plate Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Plate Number <span className="font-normal normal-case tracking-normal text-slate-400">(Optional)</span>
                </label>
                <input 
                  type="text" 
                  value={reportPlate} 
                  onChange={e => setReportPlate(e.target.value)}
                  placeholder="e.g. MH12RR1234"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 uppercase font-mono font-bold tracking-wider text-xs" 
                />
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Issue Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {reportTypesList.map(rt => (
                    <button 
                      type="button" 
                      key={rt.value} 
                      onClick={() => setReportType(rt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all duration-200 select-none ${
                        reportType === rt.value
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-[11px] font-bold">{rt.label}</p>
                      <p className="text-[8.5px] text-slate-400 mt-0.5 leading-snug">{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Specific Location Detail
                </label>
                <input 
                  type="text" 
                  value={locationDesc} 
                  onChange={e => setLocationDesc(e.target.value)}
                  placeholder="e.g. Near Wing-A Elevator, Row 4"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs" 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Description Details
                </label>
                <textarea 
                  required 
                  value={reportDescription} 
                  onChange={e => setReportDescription(e.target.value)} 
                  rows={2}
                  placeholder="Describe the parking issue observed..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs resize-none" 
                />
              </div>

              {/* Photo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Photo Evidence
                </label>
                
                <label 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  htmlFor="evidence-file"
                  className={`
                    border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-3 px-4 cursor-pointer transition-all duration-300 relative overflow-hidden group min-h-[72px] w-full
                    ${isDragActive ? 'border-blue-500 bg-blue-500/[0.02]' : ''}
                    ${photoPreview 
                      ? 'border-emerald-500/50 bg-emerald-500/[0.01]' 
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40 hover:border-rose-500/40'}
                  `}
                >
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                    id="evidence-file"
                  />
                  
                  {photoPreview ? (
                    <div className="flex flex-row items-center justify-center gap-4 w-full relative py-1">
                      <img src={photoPreview} alt="preview" className="h-12 w-20 object-cover rounded-lg border border-emerald-500/20 shadow-md" />
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-emerald-500">✓ Evidence Loaded</p>
                        <p className="text-[8px] text-slate-500 mt-0.5">Click/Drop again to replace</p>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          setPhoto(null); 
                          setPhotoPreview(null); 
                        }}
                        className="absolute top-1 right-2 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-left text-slate-500 w-full justify-center py-1">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:scale-105 transition-transform duration-300">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Drag & drop or click to upload photo</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">Max file size 5MB (JPG, PNG, WebP)</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

            </form>

            {/* Footer */}
            <div className="shrink-0 py-3 px-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.01] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('div')?.previousElementSibling as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={submittingReport}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5"
              >
                {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>Submit Complaint</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Search Modal */}
      {activeModal === 'search' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn flex flex-col max-h-[70vh]">
            
            {/* Header */}
            <div className="shrink-0 py-3 px-5 border-b border-slate-100 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Search Vehicle Owner</h3>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setSearchPlate('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4">
              
              {/* Search */}
              <form onSubmit={handleOwnerSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                    <Car className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    placeholder="ENTER VEHICLE LICENSE PLATE"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-mono font-bold tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-blue-500/10 transition-all"
                >
                  {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Results */}
              <div className="space-y-3 pt-1">
                {searchLoading ? (
                  <div className="p-5 text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> Querying license database...
                  </div>
                ) : hasSearched && searchResults.length === 0 ? (
                  <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-slate-500 text-xs space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">No Resident Matches Found</p>
                    <p className="text-[10px]">No occupant in society records owns a vehicle with license plate "{searchPlate}".</p>
                  </div>
                ) : (
                  searchResults.map((res, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/[0.01] border border-blue-500/20 dark:border-blue-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                            {res.plate}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Owner Match</span>
                        </div>

                        <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-500" /> <span className="font-extrabold text-slate-900 dark:text-white">{res.ownerName}</span></div>
                          <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5 text-blue-500" /> <span>Building {res.buildingNumber}</span></div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex justify-end">
                        <a
                          href={`tel:${res.phone}`}
                          className="w-full sm:w-auto px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call {res.phone}</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 py-3 px-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.01] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setSearchPlate('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all"
              >
                Close Lookup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MemberDashboard;
