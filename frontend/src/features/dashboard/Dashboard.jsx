import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import API from '../../services/api';
import { 
  Car, 
  Search, 
  Plus, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Clock, 
  Calendar,
  X,
  UserCheck
} from 'lucide-react';

const Dashboard = () => {
  // Stats states
  const [capacity, setCapacity] = useState(60);
  const [overflowLimit, setOverflowLimit] = useState(68);
  const [overstayLimit, setOverstayLimit] = useState(1440); // 24 hours
  const [parkedCount, setParkedCount] = useState(0);
  const [available, setAvailable] = useState(60);
  const [state, setState] = useState('normal'); // normal, overflow, full
  const [parkedList, setParkedList] = useState([]);
  
  // Modals & forms
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [plateQuery, setPlateQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Entry Form values
  const [entryPlate, setEntryPlate] = useState('');
  const [entryType, setEntryType] = useState('visitor'); // resident, tenant, visitor
  const [entryBuilding, setEntryBuilding] = useState(28);
  const [entryFlat, setEntryFlat] = useState('');
  const [residentId, setResidentId] = useState(null);
  const [visitorDetails, setVisitorDetails] = useState({ name: '', buildingVisited: 28, flatVisited: '', purpose: '' });
  const [formError, setFormError] = useState('');
  
  // Exit Form values
  const [exitPlate, setExitPlate] = useState('');
  
  const socketRef = useRef();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Periodically refresh elapsed times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard summary data
  const fetchSummary = async () => {
    try {
      const { data } = await API.get('/dashboard/summary');
      setCapacity(data.totalCapacity);
      setOverflowLimit(data.overflowLimit);
      setParkedCount(data.currentlyParkedCount);
      setAvailable(data.availableSpots);
      setState(data.state);
      setParkedList(data.currentlyParkedList);

      // Fetch global settings to get overstay threshold
      const settingsRes = await API.get('/settings');
      setOverstayLimit(settingsRes.data.overstayLimit);
    } catch (err) {
      console.error('Failed to load dashboard summaries:', err);
    }
  };

  // Socket.io integration
  useEffect(() => {
    fetchSummary();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('capacityUpdate', (data) => {
      if (data.currentlyParkedCount !== undefined) setParkedCount(data.currentlyParkedCount);
      if (data.availableSpots !== undefined) setAvailable(data.availableSpots);
      if (data.state !== undefined) setState(data.state);
    });

    socketRef.current.on('vehicleEntry', (entry) => {
      setParkedList((prev) => {
        // Prevent duplicate append
        if (prev.find(p => p._id === entry._id)) return prev;
        return [entry, ...prev];
      });
    });

    socketRef.current.on('vehicleExit', (exitLog) => {
      setParkedList((prev) => prev.filter(p => p.plate !== exitLog.plate));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Real-time lookup as typing in plate entry field
  const handlePlateSearch = async (val) => {
    setEntryPlate(val);
    if (!val || val.trim() === '') {
      setSearchResults([]);
      setEntryType('visitor');
      setResidentId(null);
      return;
    }

    try {
      const { data } = await API.get(`/dashboard/search-plate?plate=${val}`);
      setSearchResults(data);
      
      // Auto-fill exactly if unique match is made
      if (data.length === 1 && data[0].vehicle.plate === val.toUpperCase()) {
        selectResidentVehicle(data[0]);
      }
    } catch (err) {
      console.error('Error during auto-complete search:', err);
    }
  };

  const selectResidentVehicle = (match) => {
    setEntryPlate(match.vehicle.plate);
    setEntryType(match.type);
    setEntryFlat(match.flatNumber);
    setEntryBuilding(match.buildingNumber || 28);
    setResidentId(match.residentId);
    setSearchResults([]);
  };

  const submitVehicleEntry = async (e) => {
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

    const payload = {
      plate: entryPlate,
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
      
      // Reset entry forms
      setEntryPlate('');
      setEntryFlat('');
      setEntryBuilding(28);
      setResidentId(null);
      setVisitorDetails({ name: '', buildingVisited: 28, flatVisited: '', purpose: '' });
      setEntryType('visitor');
      setShowEntryModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error processing entry');
    }
  };

  const submitVehicleExit = async (plate) => {
    try {
      await API.post('/dashboard/exit', { plate });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log exit');
    }
  };

  // Calculate duration elapsed since entry
  const getElapsedTime = (entryTime) => {
    const start = new Date(entryTime);
    const diffMs = currentTime - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} mins`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  // Determine if vehicle is overstaying
  const isOverstaying = (entryTime) => {
    if (!overstayLimit) return false;
    const diffMs = currentTime - new Date(entryTime);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins > overstayLimit;
  };

  // Visual state classes
  const stateConfig = {
    normal: {
      barColor: 'bg-brandTeal-500',
      bgColor: 'bg-brandTeal-500/10',
      borderColor: 'border-brandTeal-500/20 dark:border-brandTeal-500/30',
      textColor: 'text-brandTeal-600 dark:text-brandTeal-400',
      label: 'Normal Capacity',
      icon: CheckCircle2
    },
    overflow: {
      barColor: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/35',
      textColor: 'text-amber-600 dark:text-amber-400',
      label: 'Overflow Warning',
      icon: AlertTriangle
    },
    full: {
      barColor: 'bg-rose-600 animate-pulse',
      bgColor: 'bg-rose-500/15 glow-red-pulse',
      borderColor: 'border-rose-600',
      textColor: 'text-rose-600 dark:text-rose-400',
      label: 'PARKING FULL',
      icon: AlertTriangle
    }
  };

  const currentSettings = stateConfig[state] || stateConfig.normal;
  const BarIcon = currentSettings.icon;

  // Percentage for progress bar
  const fillPercentage = Math.min(100, Math.round((parkedCount / overflowLimit) * 100));

  return (
    <div className="space-y-8">
      
      {/* Alert Header for Overflow states */}
      {state !== 'normal' && (
        <div className={`p-4 rounded-2xl border ${currentSettings.borderColor} ${currentSettings.bgColor} flex items-center justify-between gap-4 animate-bounce`}>
          <div className="flex items-center gap-3">
            <BarIcon className={`w-6 h-6 ${currentSettings.textColor}`} />
            <div>
              <p className={`font-bold ${currentSettings.textColor} text-base`}>
                {currentSettings.label} Status Triggered
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {state === 'full' 
                  ? 'The parking has reached critical overflow capacity limit. Enforce exit procedures and restrict new entry.' 
                  : 'Vehicles parked exceed standard marked spots. Overflow mode is active.'}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-black ${currentSettings.textColor}`}>{parkedCount} / {overflowLimit}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Parking Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time surveillance console for residential parking spaces.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEntryModal(true)}
            className="px-5 py-3 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-brandPurple-500/15"
          >
            <Plus className="w-5 h-5" /> Log Vehicle Entry
          </button>
        </div>
      </div>

      {/* KPI Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Capacity Limit Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Stalls Capacity</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{capacity}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Max Limit: {overflowLimit}</span>
          </div>
        </div>

        {/* Occupied Card */}
        <div className={`glass-card rounded-2xl p-6 border ${state === 'full' ? 'border-rose-500/50 glow-red-pulse' : 'border-slate-200 dark:border-white/5'} flex flex-col justify-between`}>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currently Inside</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{parkedCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Occupancy: {Math.round((parkedCount/capacity)*100)}%</span>
          </div>
        </div>

        {/* Available Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Slots</p>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-extrabold ${available === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-brandTeal-600 dark:text-brandTeal-400'}`}>{available}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">First come, first served</span>
          </div>
        </div>

      </div>

      {/* Large Visual Progress Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className={`w-5 h-5 ${currentSettings.textColor}`} />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Live Capacity Monitor Bar</span>
          </div>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{parkedCount} occupied / {capacity} marked spots</span>
        </div>
        
        {/* Progress tracks */}
        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-white/5">
          <div 
            className={`h-full transition-all duration-500 ease-out ${currentSettings.barColor}`} 
            style={{ width: `${fillPercentage}%` }}
          ></div>
        </div>

        {/* Legend labels */}
        <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 px-1 pt-1">
          <span className="text-brandTeal-600 dark:text-brandTeal-400 flex items-center gap-1">🟢 Normal (Under {capacity})</span>
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">🟡 Overflow ({capacity} to {overflowLimit - 1})</span>
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">🔴 Full ({overflowLimit}+)</span>
        </div>
      </div>

      {/* Live List of Occupied Vehicles */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Currently Parked Vehicles</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Live list of active vehicles parked inside the premises.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2 w-full md:w-auto">
            <Clock className="w-4 h-4 text-brandPurple-600 dark:text-brandPurple-400" />
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {parkedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <Car className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">No Vehicles Parked</p>
            <p className="text-xs text-slate-500">Log an entry using the button above to begin tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-white/[0.01] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Plate Number</th>
                  <th className="py-4 px-6">Classification</th>
                  <th className="py-4 px-6">Flat Destination</th>
                  <th className="py-4 px-6">Name / Details</th>
                  <th className="py-4 px-6">Entry Timestamp</th>
                  <th className="py-4 px-6">Duration Parked</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-200">
                {parkedList.map((veh) => {
                  const overstay = isOverstaying(veh.entryTime);
                  const isVisitor = veh.type === 'visitor';
                  
                  return (
                    <tr 
                      key={veh._id}
                      className={`
                        transition-colors hover:bg-slate-100/30 dark:hover:bg-white/[0.02]
                        ${overstay ? 'bg-amber-500/5 dark:bg-amber-500/5 hover:bg-amber-500/10' : ''}
                      `}
                    >
                      <td className="py-4 px-6 font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
                          {veh.plate}
                        </span>
                        {overstay && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase animate-pulse flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Overstay
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-bold uppercase border
                          ${veh.type === 'resident' ? 'bg-brandPurple-50 dark:bg-brandPurple-500/10 text-brandPurple-700 dark:text-brandPurple-400 border border-brandPurple-200 dark:border-brandPurple-500/20' : ''}
                          ${veh.type === 'tenant' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : ''}
                          ${veh.type === 'visitor' ? 'bg-brandTeal-50 dark:bg-brandTeal-500/10 text-brandTeal-700 dark:text-brandTeal-400 border border-brandTeal-200 dark:border-brandTeal-500/20' : ''}
                        `}>
                          {veh.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold">Bldg {veh.buildingNumber} • Flat {veh.flatNumber}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        {isVisitor 
                          ? <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{veh.visitorDetails?.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{veh.visitorDetails?.purpose}</p>
                            </div>
                          : <span>{veh.residentId?.ownerName || 'Resident Owner'}</span>
                        }
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(veh.entryTime).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                        {getElapsedTime(veh.entryTime)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => submitVehicleExit(veh.plate)}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/25 hover:border-transparent transition-all duration-200"
                        >
                          Log Exit
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

      {/* Vehicle Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-white/10 shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => {
                setShowEntryModal(false);
                setFormError('');
                setSearchResults([]);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Log Vehicle Entry</h3>

            {formError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl text-center font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={submitVehicleEntry} className="space-y-4">
              
              {/* Plate search */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Plate Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={entryPlate}
                    onChange={(e) => handlePlateSearch(e.target.value)}
                    placeholder="Enter Plate Number"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 uppercase tracking-widest text-sm"
                  />
                </div>

                {/* Auto complete search dropdown list */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                    {searchResults.map((match) => (
                      <button
                        type="button"
                        key={match.vehicle.plate}
                        onClick={() => selectResidentVehicle(match)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/65 text-left text-xs transition-colors"
                      >
                        <div>
                          <p className="font-mono font-extrabold tracking-wider text-slate-900 dark:text-slate-100">{match.vehicle.plate}</p>
                          <p className="text-slate-500 dark:text-slate-400">Bldg {match.buildingNumber} • Flat {match.flatNumber} • {match.ownerName} ({match.type})</p>
                        </div>
                        <span className="text-[10px] font-bold text-brandPurple-600 dark:text-brandPurple-400 bg-brandPurple-500/10 dark:bg-brandPurple-500/15 px-2 py-0.5 rounded border border-brandPurple-500/20 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Classification Type Display */}
              <div>
                <span className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Vehicle Type classification
                </span>
                <div className="flex gap-2">
                  {['resident', 'tenant', 'visitor'].map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setEntryType(t);
                        if (t === 'visitor') {
                          setResidentId(null);
                          setEntryFlat('');
                        }
                      }}
                      className={`
                        flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all duration-200 border
                        ${entryType === t 
                          ? 'bg-brandPurple-600 border-brandPurple-600 text-white font-black' 
                          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resident Info Inputs */}
              {entryType !== 'visitor' ? (
                <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-fadeIn">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Building</label>
                    <input
                      type="text"
                      disabled
                      value={entryBuilding ? `Bldg ${entryBuilding}` : ''}
                      className="w-full px-3 py-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-550 dark:text-slate-400 mb-1">Flat Number</label>
                    <input
                      type="text"
                      disabled
                      value={entryFlat}
                      className="w-full px-3 py-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-550 dark:text-slate-400 mb-1 font-semibold text-brandPurple-600 dark:text-brandPurple-400">Status Check</label>
                    <div className="w-full px-3 py-2 bg-brandPurple-500/10 border border-brandPurple-500/25 rounded-lg text-brandPurple-600 dark:text-brandPurple-400 font-bold text-[11px] uppercase text-center flex items-center justify-center">
                      ✓ Resident
                    </div>
                  </div>
                </div>
              ) : (
                /* Visitor Info Inputs */
                <div className="space-y-3 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-fadeIn">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-1 mb-2">
                    Visitor Entry Information
                  </span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Visitor Full Name</label>
                      <input
                        type="text"
                        required
                        value={visitorDetails.name}
                        onChange={(e) => setVisitorDetails({ ...visitorDetails, name: e.target.value })}
                        placeholder="Enter Visitor Name"
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Visiting Building</label>
                      <select
                        value={visitorDetails.buildingVisited}
                        onChange={(e) => setVisitorDetails({ ...visitorDetails, buildingVisited: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs rounded-lg"
                      >
                        {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                          <option key={num} value={num}>Building {num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Visiting Flat</label>
                      <input
                        type="text"
                        required
                        value={visitorDetails.flatVisited}
                        onChange={(e) => setVisitorDetails({ ...visitorDetails, flatVisited: e.target.value })}
                        placeholder="Flat"
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">Purpose of Visit</label>
                    <input
                      type="text"
                      value={visitorDetails.purpose}
                      onChange={(e) => setVisitorDetails({ ...visitorDetails, purpose: e.target.value })}
                      placeholder="Enter Purpose of Visit"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-xs rounded-lg"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm mt-6"
              >
                Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
