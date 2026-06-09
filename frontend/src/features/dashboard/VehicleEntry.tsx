import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Search, UserCheck, User, PlusCircle, ArrowLeft, Building, DoorOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
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

    setLoading(true);
    const payload = {
      plate: entryPlate.toUpperCase().trim(),
      type: entryType,
      flatNumber: entryType === 'visitor' ? visitorDetails.flatVisited : entryFlat,
      buildingNumber: Number(entryType === 'visitor' ? visitorDetails.buildingVisited : entryBuilding),
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
    <div className="space-y-6 max-w-2xl mx-auto relative z-10">
      
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
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-2xl font-bold text-center">
          {formError}
        </div>
      )}

      {/* Main card */}
      <div className="premium-card p-6 md:p-8 space-y-6 shadow-md relative">
        <form onSubmit={submitVehicleEntry} className="space-y-6">
          
          {/* Plate Number input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Plate Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={entryPlate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlateSearch(e.target.value)}
                placeholder="ENTER VEHICLE LICENSE PLATE"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase tracking-widest text-base font-extrabold"
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
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
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
                      ? 'bg-blue-600 border-blue-600 text-white font-extrabold shadow-md shadow-blue-500/15'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}
                    ${matchedProfile !== null ? 'opacity-50 cursor-not-allowed' : 'btn-scale'}
                  `}
                >
                  <span>{t}</span>
                </button>
              ))}
            </div>
            {matchedProfile && (
              <p className="text-[10px] text-blue-500 font-bold mt-1.5">✓ Classification locked to resident database entry</p>
            )}
          </div>

          {/* Matches Info details block */}
          {matchedProfile ? (
            <div className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/20 dark:border-blue-500/10 space-y-4 animate-slide-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-600/15 flex items-center justify-center text-blue-500 text-base font-black border border-blue-500/20">
                  {matchedProfile.ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{matchedProfile.ownerName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
                    {matchedProfile.type} • flat {matchedProfile.flatNumber}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-350 border-t border-blue-500/10 pt-3">
                <div className="flex items-center gap-1.5"><Building className="w-4 h-4 text-blue-500" /> Building {matchedProfile.buildingNumber}</div>
                <div className="flex items-center gap-1.5"><DoorOpen className="w-4 h-4 text-blue-500" /> Flat {matchedProfile.flatNumber}</div>
              </div>
            </div>
          ) : (
            /* Visitor entry form module */
            entryType === 'visitor' && (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 animate-slide-in">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-300 border-b border-slate-200/50 dark:border-white/[0.05] pb-2 mb-2 uppercase tracking-wider">
                  Visitor Entry Form
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1">Visitor Full Name</label>
                    <input
                      type="text"
                      required
                      value={visitorDetails.name}
                      onChange={(e) => setVisitorDetails({ ...visitorDetails, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1">Visiting Building</label>
                    <select
                      value={visitorDetails.buildingVisited}
                      onChange={(e) => setVisitorDetails({ ...visitorDetails, buildingVisited: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                    >
                      {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                        <option key={num} value={num}>Building {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1">Visiting Flat</label>
                    <input
                      type="text"
                      required
                      value={visitorDetails.flatVisited}
                      onChange={(e) => setVisitorDetails({ ...visitorDetails, flatVisited: e.target.value })}
                      placeholder="e.g. 402"
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    value={visitorDetails.purpose}
                    onChange={(e) => setVisitorDetails({ ...visitorDetails, purpose: e.target.value })}
                    placeholder="e.g. Delivery, Guest visit"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500 text-xs rounded-xl"
                  />
                </div>
              </div>
            )
          )}

          {/* Reset profile button if match was made */}
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
              className="text-xs font-bold text-rose-500 hover:text-rose-600 block mt-2 hover:underline select-none"
            >
              Reset matched plate search query
            </button>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="btn-scale w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/15 disabled:opacity-50"
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
        </form>
      </div>

    </div>
  );
};

export default VehicleEntry;
