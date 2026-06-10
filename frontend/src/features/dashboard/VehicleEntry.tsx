import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Search, UserCheck, User, PlusCircle, ArrowLeft, Building, DoorOpen, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../shared/PageTransition';
import type { PlateSearchMatch } from '../../types';

interface VisitorFormDetails {
  name: string;
  buildingVisited: number;
  flatVisited: string;
  purpose: string;
}

const VehicleEntry: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  
  // Search query
  const [entryPlate, setEntryPlate] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PlateSearchMatch[]>([]);
  const [matchedProfile, setMatchedProfile] = useState<PlateSearchMatch | null>(null);

  // Form values
  const [entryType, setEntryType] = useState<'resident' | 'tenant' | 'visitor'>('visitor');
  const [entryBuilding, setEntryBuilding] = useState<number>(28);
  const [entryFlat, setEntryFlat] = useState<string>('');
  const [residentId, setResidentId] = useState<string | null>(null);
  
  const [visitorDetails, setVisitorDetails] = useState<VisitorFormDetails>({
    name: '',
    buildingVisited: 28,
    flatVisited: '',
    purpose: '',
  });

  const [formError, setFormError] = useState<string>('');

  const handlePlateSearch = async (val: string): Promise<void> => {
    setEntryPlate(val);
    if (!val || val.trim() === '') {
      setSearchResults([]);
      setMatchedProfile(null);
      setEntryType('visitor');
      setResidentId(null);
      return;
    }

    try {
      const { data } = await API.get<PlateSearchMatch[]>(`/dashboard/search-plate?plate=${val}`);
      setSearchResults(data);

      // If exact plate is matched, auto fill
      const exactMatch = data.find(p => p.vehicle.plate === val.toUpperCase());
      if (exactMatch) {
        selectResidentVehicle(exactMatch);
      } else if (matchedProfile) {
        // Clear match if query typed differs
        setMatchedProfile(null);
        setEntryType('visitor');
        setResidentId(null);
      }
    } catch (err) {
      console.error('Error during auto-complete search:', err);
    }
  };

  const selectResidentVehicle = (match: PlateSearchMatch): void => {
    setEntryPlate(match.vehicle.plate);
    setEntryType(match.type);
    setEntryFlat(match.flatNumber);
    setEntryBuilding(match.buildingNumber || 28);
    setResidentId(match.residentId);
    setMatchedProfile(match);
    setSearchResults([]);
    setFormError('');
    toast.success(`Resident profile loaded for ${match.ownerName}`);
  };

  const submitVehicleEntry = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError('');

    if (!entryPlate) {
      setFormError('Plate number is required');
      return;
    }

    if (entryType === 'visitor' && (!visitorDetails.name || !visitorDetails.flatVisited)) {
      setFormError('Visitor name and destination flat are required');
      return;
    }

    if (entryType !== 'visitor' && !matchedProfile && !entryFlat) {
      setFormError('Flat number is required for manual resident entry');
      return;
    }

    setLoading(true);
    const payload = {
      plate: entryPlate.toUpperCase().trim(),
      type: entryType,
      flatNumber: entryType === 'visitor' ? visitorDetails.flatVisited : (matchedProfile ? matchedProfile.flatNumber : entryFlat),
      buildingNumber: Number(entryType === 'visitor' ? visitorDetails.buildingVisited : (matchedProfile ? matchedProfile.buildingNumber : entryBuilding)),
      residentId,
      visitorDetails: entryType === 'visitor' ? {
        name: visitorDetails.name,
        flatVisited: visitorDetails.flatVisited,
        purpose: visitorDetails.purpose
      } : null
    };

    try {
      await API.post('/dashboard/entry', payload);
      toast.success(`Vehicle ${entryPlate.toUpperCase()} entry registered!`);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Error processing entry');
      toast.error(e.response?.data?.message || 'Entry logging failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl mx-auto relative z-10 w-full">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all btn-scale shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Register Vehicle Entry</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Process new vehicle arrivals at the main gate terminal.</p>
          </div>
        </div>

        {formError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs rounded-2xl font-bold text-center">
            {formError}
          </div>
        )}

        {/* Unified Card Layout */}
        <div className="premium-card p-6 md:p-8 shadow-md relative w-full">
          <form onSubmit={submitVehicleEntry} className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Side: Core Vehicle Details */}
              <div className="space-y-6">
                {/* Plate Number input */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Plate Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-550">
                      <Search className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={entryPlate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlateSearch(e.target.value)}
                      placeholder="ENTER LICENSE PLATE"
                      className={`w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all duration-300 focus:ring-4 uppercase tracking-widest text-base font-extrabold
                        ${entryType === 'resident'
                          ? 'focus:border-blue-500 focus:ring-blue-500/10'
                          : entryType === 'tenant'
                          ? 'focus:border-purple-500 focus:ring-purple-500/10'
                          : 'focus:border-amber-500 focus:ring-amber-500/10'}`}
                    />
                  </div>

                  {/* Auto complete matches drop container */}
                  {searchResults.length > 0 && !matchedProfile && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                      {searchResults.map((match) => (
                        <button
                          type="button"
                          key={match.vehicle.plate}
                          onClick={() => selectResidentVehicle(match)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-750 text-left text-xs transition-colors"
                        >
                          <div>
                            <p className="font-mono font-extrabold tracking-wider text-slate-900 dark:text-slate-100 text-sm">{match.vehicle.plate}</p>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Bldg {match.buildingNumber} • Flat {match.flatNumber} • {match.ownerName} ({match.type})</p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/10 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> AutoFill
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Classification type indicators */}
                <div>
                  <span className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                    Registration Classification
                  </span>
                  <div className="flex gap-3">
                    {(['resident', 'tenant', 'visitor'] as const).map(t => (
                      <button
                        type="button"
                        key={t}
                        disabled={matchedProfile !== null}
                        onClick={() => {
                          setEntryType(t);
                          if (t === 'visitor') {
                            setResidentId(null);
                            setEntryFlat('');
                          }
                        }}
                        className={`
                          flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all duration-200 border flex items-center justify-center gap-1.5
                          ${entryType === t
                            ? t === 'resident'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white font-extrabold shadow-lg shadow-blue-500/15'
                              : t === 'tenant'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white font-extrabold shadow-lg shadow-purple-500/15'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500 text-white font-extrabold shadow-lg shadow-amber-500/15'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}
                          ${matchedProfile !== null ? 'opacity-50 cursor-not-allowed' : 'btn-scale'}
                        `}
                      >
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                  {matchedProfile && (
                    <p className="text-[10px] text-blue-500 font-bold mt-2">✓ Classification locked to database record</p>
                  )}
                </div>
              </div>

              {/* Right Side: Dynamic Form Detail Panels */}
              <div className="border-t lg:border-t-0 lg:border-l border-slate-200/60 dark:border-white/[0.08] pt-6 lg:pt-0 lg:pl-8 min-h-[200px] flex items-center">
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {matchedProfile ? (
                      <motion.div
                        key="matched"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 w-full"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-blue-500 tracking-wider">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Matched Database Profile</span>
                        </div>

                        <div className="p-5 rounded-xl bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/20 dark:border-blue-500/10 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-600/15 flex items-center justify-center text-blue-500 text-base font-black border border-blue-500/20 shadow-inner">
                              {matchedProfile.ownerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{matchedProfile.ownerName}</h4>
                              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
                                {matchedProfile.type}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-blue-500/10 pt-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-blue-500">
                                <Building className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-widest leading-none mb-1">Building</span>
                                <span>Building {matchedProfile.buildingNumber}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-blue-500">
                                <DoorOpen className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-widest leading-none mb-1">Flat</span>
                                <span>Flat {matchedProfile.flatNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : entryType === 'visitor' ? (
                      <motion.div
                        key="visitor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 w-full"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-amber-500 tracking-wider">
                          <User className="w-4 h-4" />
                          <span>Visitor Registration Form</span>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Visitor Full Name</label>
                            <input
                              type="text"
                              required
                              value={visitorDetails.name}
                              onChange={(e) => setVisitorDetails({ ...visitorDetails, name: e.target.value })}
                              placeholder="e.g. John Doe"
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm rounded-xl font-medium"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Visiting Building</label>
                              <select
                                value={visitorDetails.buildingVisited}
                                onChange={(e) => setVisitorDetails({ ...visitorDetails, buildingVisited: Number(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none transition-all duration-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm rounded-xl font-medium"
                              >
                                {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                                  <option key={num} value={num}>Building {num}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Visiting Flat</label>
                              <input
                                type="text"
                                required
                                value={visitorDetails.flatVisited}
                                onChange={(e) => setVisitorDetails({ ...visitorDetails, flatVisited: e.target.value })}
                                placeholder="e.g. 402"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm rounded-xl font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Purpose of Visit</label>
                            <input
                              type="text"
                              value={visitorDetails.purpose}
                              onChange={(e) => setVisitorDetails({ ...visitorDetails, purpose: e.target.value })}
                              placeholder="e.g. Delivery, Guest visit"
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm rounded-xl font-medium"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="manual-resident"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 w-full"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-blue-500 tracking-wider">
                          <User className="w-4 h-4" />
                          <span>Manual Resident/Tenant Info</span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vehicle details were not found in the database. Enter the residence details manually below to proceed.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Building Number</label>
                            <select
                              value={entryBuilding}
                              onChange={(e) => setEntryBuilding(Number(e.target.value))}
                              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none transition-all duration-300 focus:ring-4 text-sm rounded-xl font-medium
                                ${entryType === 'tenant' ? 'focus:border-purple-500 focus:ring-purple-500/10' : 'focus:border-blue-500 focus:ring-blue-500/10'}`}
                            >
                              {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                                  <option key={num} value={num}>Building {num}</option>
                                ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Flat Number</label>
                            <input
                              type="text"
                              required
                              value={entryFlat}
                              onChange={(e) => setEntryFlat(e.target.value)}
                              placeholder="e.g. 102"
                              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-300 focus:ring-4 text-sm rounded-xl font-medium
                                ${entryType === 'tenant' ? 'focus:border-purple-500 focus:ring-purple-500/10' : 'focus:border-blue-500 focus:ring-blue-500/10'}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* Bottom Actions Area */}
            <div className="pt-6 border-t border-slate-200/65 dark:border-white/[0.07] mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {matchedProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMatchedProfile(null);
                      setEntryPlate('');
                      setSearchResults([]);
                      setEntryType('visitor');
                      setResidentId(null);
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline select-none transition-colors"
                  >
                    Reset matched plate search query
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-scale w-full sm:w-64 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/15 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Search className="w-4 h-4 animate-spin" />
                    <span>Registering Entry...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4.5 h-4.5" />
                    <span>Submit Vehicle Entry</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </PageTransition>
  );
};

export default VehicleEntry;
