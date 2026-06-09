import React, { useState, useEffect, useRef, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import API from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  LogOut,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { toast } from 'react-hot-toast';
import type { ParkedVehicle, DashboardSummary } from '../../types';

type ParkingState = 'normal' | 'overflow' | 'full';

interface StateConfig {
  barColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  label: string;
  icon: React.ElementType;
}

const Dashboard: React.FC = () => {
  const themeCtx = useContext(ThemeContext);
  const navigate = useNavigate();
  if (!themeCtx) throw new Error('Dashboard must be inside ThemeProvider');
  const { theme } = themeCtx;

  // Stats states
  const [capacity, setCapacity] = useState<number>(60);
  const [overflowLimit, setOverflowLimit] = useState<number>(68);
  const [overstayLimit, setOverstayLimit] = useState<number>(1440);
  const [parkedCount, setParkedCount] = useState<number>(0);
  const [available, setAvailable] = useState<number>(60);
  const [state, setState] = useState<ParkingState>('normal');
  const [parkedList, setParkedList] = useState<ParkedVehicle[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Periodically refresh elapsed times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSummary = async (): Promise<void> => {
    try {
      const { data } = await API.get<DashboardSummary>('/dashboard/summary');
      setCapacity(data.totalCapacity);
      setOverflowLimit(data.overflowLimit);
      setParkedCount(data.currentlyParkedCount);
      setAvailable(data.availableSpots);
      setState(data.state);
      setParkedList(data.currentlyParkedList);

      const settingsRes = await API.get<{ overstayLimit: number }>('/settings');
      setOverstayLimit(settingsRes.data.overstayLimit);
    } catch (err) {
      console.error('Failed to load dashboard summaries:', err);
    }
  };

  useEffect(() => {
    fetchSummary();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('capacityUpdate', (data: Partial<DashboardSummary>) => {
      if (data.currentlyParkedCount !== undefined) setParkedCount(data.currentlyParkedCount);
      if (data.availableSpots !== undefined) setAvailable(data.availableSpots);
      if (data.state !== undefined) setState(data.state as ParkingState);
    });

    socketRef.current.on('vehicleEntry', (entry: ParkedVehicle) => {
      toast.success(`Vehicle ${entry.plate} entered flat ${entry.flatNumber}`);
      setParkedList((prev) => {
        if (prev.find(p => p._id === entry._id)) return prev;
        return [entry, ...prev];
      });
    });

    socketRef.current.on('vehicleExit', (exitLog: { plate: string }) => {
      toast.error(`Vehicle ${exitLog.plate} logged out`);
      setParkedList((prev) => prev.filter(p => p.plate !== exitLog.plate));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const submitVehicleExit = async (plate: string): Promise<void> => {
    try {
      await API.post('/dashboard/exit', { plate });
      toast.success(`Exit registered for ${plate}`);
      fetchSummary();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to log exit');
    }
  };

  const getElapsedTime = (entryTime: string): string => {
    const start = new Date(entryTime);
    const diffMs = currentTime.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} mins`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const isOverstaying = (entryTime: string): boolean => {
    if (!overstayLimit) return false;
    const diffMs = currentTime.getTime() - new Date(entryTime).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins > overstayLimit;
  };

  const stateConfig: Record<ParkingState, StateConfig> = {
    normal: {
      barColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/5',
      borderColor: 'border-emerald-500/30 dark:border-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      label: 'Normal Capacity',
      icon: CheckCircle2
    },
    overflow: {
      barColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/5',
      borderColor: 'border-amber-500/30 dark:border-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      label: 'Overflow Warning',
      icon: AlertTriangle
    },
    full: {
      barColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/5',
      borderColor: 'border-rose-500/30 dark:border-rose-500/10',
      textColor: 'text-rose-600 dark:text-rose-450',
      label: 'PARKING FULL',
      icon: ShieldAlert
    }
  };

  const currentSettings = stateConfig[state] ?? stateConfig.normal;
  const BarIcon = currentSettings.icon;

  // Percentage of standard capacity (can go > 100% in overflow)
  const occupancyPercentage = Math.round((parkedCount / capacity) * 100);

  return (
    <div className="space-y-8 relative">
      
      {/* Alert Header for Overflow/Full states */}
      {state !== 'normal' && (
        <div className={`p-4 rounded-2xl border ${currentSettings.borderColor} ${currentSettings.bgColor} flex items-center justify-between gap-4 animate-pulse relative z-10 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 border ${currentSettings.borderColor} shadow-inner`}>
              <BarIcon className={`w-5 h-5 ${currentSettings.textColor}`} />
            </div>
            <div>
              <p className={`font-bold ${currentSettings.textColor} text-sm`}>
                {currentSettings.label} Triggered
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {state === 'full'
                  ? 'The parking has reached critical capacity. Please enforce exit logging and restrict external visitors.'
                  : 'Currently parked vehicles exceed standard capacity. Overflow monitoring is active.'}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-black font-mono ${currentSettings.textColor}`}>{parkedCount} / {overflowLimit}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Surveillance Center</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time occupancy tracking and active log surveillance.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/entry')}
            className="btn-scale px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" /> Log Entry
          </button>
          <button
            onClick={() => navigate('/exit')}
            className="btn-scale px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-rose-500/10"
          >
            <LogOut className="w-4 h-4" /> Log Exit
          </button>
        </div>
      </div>

      {/* Circular Progress Speedometer Widget */}
      <div className="premium-card p-8 flex flex-col items-center justify-center relative z-10 shadow-sm overflow-hidden">
        {/* Speedometer Glow circles */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none"></div>
        
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
          Capacity Speedometer
        </h3>

        {/* Dynamic speedometer Progress bar */}
        <div className={`w-56 h-56 transition-all duration-300 ${
          state === 'full' ? 'glow-ring-red' : state === 'overflow' ? 'glow-ring-amber' : 'glow-ring-green'
        }`}>
          <CircularProgressbar
            value={parkedCount}
            maxValue={capacity}
            text={`${parkedCount} / ${capacity}`}
            styles={buildStyles({
              pathColor: state === 'full' ? '#EF4444' : state === 'overflow' ? '#F59E0B' : '#22C55E',
              textColor: theme === 'dark' ? '#F8FAFC' : '#0F172A',
              trailColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              textSize: '14px',
            })}
          />
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {occupancyPercentage}% Occupied
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            Status: <span className={`font-bold uppercase ${currentSettings.textColor}`}>{state}</span>
          </p>
        </div>
      </div>

      {/* KPI Stats Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Total Capacity card */}
        <div className="premium-card p-6 flex items-center justify-between border-slate-200 hover:border-blue-500/20">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Stalls</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{capacity}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Parked count card */}
        <div className={`premium-card p-6 flex items-center justify-between ${
          state === 'full' ? 'border-rose-500/35 shadow-[0_0_15px_rgba(239,68,68,0.08)]' : 'border-slate-200'
        }`}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Currently Inside</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{parkedCount}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            state === 'full' ? 'bg-rose-500/10 text-rose-500' : state === 'overflow' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Available spots card */}
        <div className="premium-card p-6 flex items-center justify-between border-slate-200 hover:border-emerald-500/20">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Available Spots</p>
            <p className={`text-3xl font-extrabold font-mono tracking-tight ${available <= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {available}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            available <= 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Live List of Occupied Vehicles */}
      <div className="premium-card overflow-hidden relative z-10 shadow-sm">
        
        {/* Table Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-white/[0.01]">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Vehicles Onsite</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Real-time tracking grid of cars parked in building slots.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 rounded-xl px-3.5 py-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold font-mono">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {parkedList.length === 0 ? (
          <div className="p-12 text-center text-slate-450 dark:text-slate-500 space-y-2">
            <Car className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-350">No Vehicles Parked</p>
            <p className="text-xs text-slate-500">Log a new vehicle entry to start active surveillance tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100/30 dark:bg-white/[0.01] text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Plate Number</th>
                  <th className="py-4 px-6">Tag / Type</th>
                  <th className="py-4 px-6">Destination</th>
                  <th className="py-4 px-6">Occupant Info</th>
                  <th className="py-4 px-6">Entry Time</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-sm text-slate-700 dark:text-slate-200">
                {parkedList.map((veh, idx) => {
                  const overstay = isOverstaying(veh.entryTime);
                  const isVisitor = veh.type === 'visitor';

                  return (
                    <tr
                      key={veh._id}
                      className={`
                        transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30 dark:bg-white/[0.01]'}
                        ${overstay ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.03] hover:bg-amber-500/[0.05]' : ''}
                      `}
                    >
                      {/* Plate */}
                      <td className="py-4 px-6 font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm">
                          {veh.plate}
                        </span>
                        {overstay && (
                          <span className="ml-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-2.5 h-2.5" /> Overstay
                          </span>
                        )}
                      </td>
                      
                      {/* Type Badge */}
                      <td className="py-4 px-6">
                        <span className={`
                          px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                          ${veh.type === 'resident' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20' : ''}
                          ${veh.type === 'tenant' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20' : ''}
                          ${veh.type === 'visitor' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20' : ''}
                        `}>
                          {veh.type}
                        </span>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        Bldg {veh.buildingNumber} • Flat {veh.flatNumber}
                      </td>

                      {/* Occupant Detail */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        {isVisitor
                          ? <div>
                              <p className="font-bold text-slate-700 dark:text-slate-200">{veh.visitorDetails?.name}</p>
                              <p className="text-[10px] text-slate-500">{veh.visitorDetails?.purpose}</p>
                            </div>
                          : <p className="font-bold text-slate-700 dark:text-slate-200">{veh.residentId?.ownerName || 'Resident Occupant'}</p>
                        }
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(veh.entryTime).toLocaleString()}
                      </td>

                      {/* Elapsed Duration */}
                      <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-350">
                        {getElapsedTime(veh.entryTime)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => submitVehicleExit(veh.plate)}
                          className="btn-scale px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl text-xs font-bold border border-rose-500/20 hover:border-transparent transition-all duration-200 flex items-center justify-center mx-auto gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Exit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
