import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Search, LogOut, ArrowLeft, Clock, ShieldAlert, Building, DoorOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ParkedVehicle, DashboardSummary } from '../../types';

const VehicleExit: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  // Search input
  const [exitQuery, setExitQuery] = useState<string>('');
  const [parkedVehicles, setParkedVehicles] = useState<ParkedVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<ParkedVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ParkedVehicle | null>(null);

  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    const fetchParked = async () => {
      try {
        const { data } = await API.get<DashboardSummary>('/dashboard/summary');
        setParkedVehicles(data.currentlyParkedList || []);
      } catch (err) {
        console.error('Failed to load parked vehicles for exit selection:', err);
      }
    };
    fetchParked();
  }, []);

  // Filter list of currently parked vehicles dynamically
  useEffect(() => {
    if (!exitQuery.trim()) {
      setFilteredVehicles([]);
      return;
    }
    const q = exitQuery.toUpperCase().trim();
    const filtered = parkedVehicles.filter(
      (v) => v.plate.toUpperCase().includes(q)
    );
    setFilteredVehicles(filtered);

    // If exact matches
    const exact = parkedVehicles.find(
      (v) => v.plate.toUpperCase() === q
    );
    if (exact) {
      setSelectedVehicle(exact);
      setFilteredVehicles([]);
    } else if (selectedVehicle && selectedVehicle.plate !== q) {
      setSelectedVehicle(null);
    }
  }, [exitQuery, parkedVehicles]);

  const selectVehicle = (veh: ParkedVehicle) => {
    setSelectedVehicle(veh);
    setExitQuery(veh.plate);
    setFilteredVehicles([]);
    toast.success(`Vehicle ${veh.plate} selected for exit`);
  };

  const getElapsedTime = (entryTime: string): string => {
    const start = new Date(entryTime);
    const diffMs = new Date().getTime() - start.getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));

    if (diffMins < 60) {
      return `${diffMins} mins`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const submitVehicleExit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError('');

    const plate = exitQuery.toUpperCase().trim();
    if (!plate) {
      setFormError('Plate number is required');
      return;
    }

    setLoading(true);
    try {
      await API.post('/dashboard/exit', { plate });
      toast.success(`Vehicle ${plate} logged out successfully!`);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Exit logging failed');
      toast.error(e.response?.data?.message || 'Failed to register exit');
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Register Vehicle Exit</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log vehicle departure out of society premises.</p>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs rounded-2xl font-bold text-center">
          {formError}
        </div>
      )}

      {/* Exit card form */}
      <div className="premium-card p-6 md:p-8 space-y-6 shadow-md relative">
        <form onSubmit={submitVehicleExit} className="space-y-6">
          
          {/* License plate search input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Search Plate Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={exitQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExitQuery(e.target.value)}
                placeholder="ENTER ACTIVE LICENSE PLATE"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 uppercase tracking-widest text-base font-extrabold"
              />
            </div>

            {/* Auto-complete drop list */}
            {filteredVehicles.length > 0 && !selectedVehicle && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                {filteredVehicles.map((veh) => (
                  <button
                    type="button"
                    key={veh._id}
                    onClick={() => selectVehicle(veh)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-750 text-left text-xs transition-colors"
                  >
                    <div>
                      <p className="font-mono font-extrabold tracking-wider text-slate-900 dark:text-slate-100 text-sm">{veh.plate}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Bldg {veh.buildingNumber} • Flat {veh.flatNumber} • {veh.type}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/10 flex items-center gap-1">
                      <LogOut className="w-3 h-3" /> Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active selected vehicle information */}
          {selectedVehicle && (
            <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/[0.02] border border-rose-500/20 dark:border-rose-500/10 space-y-4 animate-slide-in">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-500 text-base font-black border border-rose-500/20">
                    {selectedVehicle.plate.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{selectedVehicle.plate}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
                      {selectedVehicle.type} • destination
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  🟢 Currently Inside
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-350 border-t border-rose-500/10 pt-3.5">
                <div className="flex items-center gap-1.5"><Building className="w-4 h-4 text-rose-500" /> Building {selectedVehicle.buildingNumber}</div>
                <div className="flex items-center gap-1.5"><DoorOpen className="w-4 h-4 text-rose-500" /> Flat {selectedVehicle.flatNumber}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-rose-500" /> Parked {getElapsedTime(selectedVehicle.entryTime)}</div>
              </div>
            </div>
          )}

          {/* Selectable grid listing currently parked cars */}
          {!selectedVehicle && parkedVehicles.length > 0 && (
            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Quick Select Parked Vehicles
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                {parkedVehicles.map((veh) => (
                  <button
                    type="button"
                    key={veh._id}
                    onClick={() => selectVehicle(veh)}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl hover:border-rose-500/40 text-left transition-all btn-scale flex flex-col justify-center"
                  >
                    <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">{veh.plate}</span>
                    <span className="text-[10px] text-slate-500 mt-1 truncate">Bldg {veh.buildingNumber} • {veh.flatNumber}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="btn-scale w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-rose-500/15 disabled:opacity-50"
          >
            {loading ? (
              <>
                <ShieldAlert className="w-4.5 h-4.5 animate-spin" />
                <span>Processing Exit...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4.5 h-4.5" />
                <span>Submit Vehicle Exit</span>
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};

export default VehicleExit;
