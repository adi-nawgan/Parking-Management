import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Search, LogOut, ArrowLeft, Clock, ShieldAlert, Building, DoorOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import PageTransition from '../shared/PageTransition';
import type { ParkedVehicle, DashboardSummary } from '../../types';

const VehicleExit: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  // Search input
  const [exitQuery, setExitQuery] = useState<string>( '');
  const [parkedVehicles, setParkedVehicles] = useState<ParkedVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<ParkedVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ParkedVehicle | null>(null);

  const [formError, setFormError] = useState<string>('');

  const fetchParked = async () => {
    try {
      const { data } = await API.get<DashboardSummary>('/dashboard/summary');
      setParkedVehicles(data.currentlyParkedList || []);
    } catch (err) {
      console.error('Failed to load parked vehicles for exit selection:', err);
    }
  };

  useEffect(() => {
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Register Vehicle Exit</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log vehicle departure out of society premises.</p>
          </div>
        </div>

        {formError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs rounded-2xl font-bold text-center">
            {formError}
          </div>
        )}

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Exit form */}
          <div className="lg:col-span-5 space-y-6">
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
                      placeholder="ENTER LICENSE PLATE"
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
                        🟢 Inside
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-350 border-t border-rose-500/10 pt-3.5">
                      <div className="flex items-center gap-1.5"><Building className="w-4 h-4 text-rose-500" /> Bldg {selectedVehicle.buildingNumber}</div>
                      <div className="flex items-center gap-1.5"><DoorOpen className="w-4 h-4 text-rose-500" /> Flat {selectedVehicle.flatNumber}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-rose-500" /> {getElapsedTime(selectedVehicle.entryTime)}</div>
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

          {/* Right Column: Live Onsite Vehicles Feed */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="premium-card p-6 flex-1 flex flex-col justify-between gap-4 shadow-md overflow-hidden min-h-[400px]">
              <div className="border-b border-slate-100 dark:border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Vehicles Currently Onsite ({parkedVehicles.length})</h3>
                <p className="text-[11px] text-slate-500 mt-1">Select a vehicle from the live feed list to automatically populate the exit form.</p>
              </div>

              {parkedVehicles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <Clock className="w-12 h-12 text-slate-400 dark:text-slate-600 animate-pulse" />
                  <p className="font-bold text-slate-700 dark:text-slate-350">No Vehicles Parked</p>
                  <p className="text-xs text-slate-500">All registered vehicles have departed the premises.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3.5 pr-1 mt-4">
                  {parkedVehicles.map((veh, index) => (
                    <motion.div
                      key={veh._id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                      className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between gap-4 hover:border-rose-500/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-white/10 group-hover:border-rose-500/20">
                          {veh.plate.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{veh.plate}</span>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${
                              veh.type === 'resident' 
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20' 
                                : veh.type === 'tenant' 
                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20' 
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20'
                            }`}>
                              {veh.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Bldg {veh.buildingNumber} • Flat {veh.flatNumber} • Parked {getElapsedTime(veh.entryTime)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectVehicle(veh)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg text-xs font-bold border border-rose-500/25 hover:border-transparent transition-all duration-200 flex items-center gap-1 shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Select
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </PageTransition>
  );
};

export default VehicleExit;
