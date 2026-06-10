import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Search,
  Edit2,
  Trash2,
  UserPlus,
  X,
  Phone,
  Building,
  DoorOpen,
  Plus,
  Trash,
  Car,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { Resident, Vehicle } from '../../types';

const ResidentList: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Right Drawer state
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form states
  const [buildingNumber, setBuildingNumber] = useState<number>(28);
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [type, setType] = useState<'resident' | 'tenant'>('resident');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchResidents = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await API.get<Resident[]>(`/residents?search=${search}`);
      setResidents(data);
      setError('');
    } catch {
      setError('Failed to load resident records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setBuildingNumber(28);
    setFlatNumber('');
    setOwnerName('');
    setPhone('');
    setType('resident');
    setVehicles([{ plate: '', vehicleType: 'Car', color: '' }]);
    setShowDrawer(true);
  };

  const openEditDrawer = (res: Resident): void => {
    setDrawerMode('edit');
    setCurrentId(res._id);
    setBuildingNumber(res.buildingNumber || 28);
    setFlatNumber(res.flatNumber);
    setOwnerName(res.ownerName);
    setPhone(res.phone);
    setType(res.type);
    setVehicles(res.vehicles.length > 0 ? [...res.vehicles] : [{ plate: '', vehicleType: 'Car', color: '' }]);
    setShowDrawer(true);
  };

  const handleAddVehicleField = (): void => {
    if (vehicles.length >= 3) {
      toast.error('Maximum 3 registered vehicles allowed per occupant');
      return;
    }
    setVehicles([...vehicles, { plate: '', vehicleType: 'Car', color: '' }]);
  };

  const handleRemoveVehicleField = (index: number): void => {
    const updated = vehicles.filter((_, idx) => idx !== index);
    setVehicles(updated);
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string): void => {
    const updated = vehicles.map((v, idx) => {
      if (idx === index) {
        return { ...v, [field]: value };
      }
      return v;
    });
    setVehicles(updated);
  };

  const submitForm = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    const cleanVehicles = vehicles.filter(v => v.plate && v.plate.trim() !== '');

    const payload = {
      buildingNumber: Number(buildingNumber),
      flatNumber,
      ownerName,
      phone,
      type,
      vehicles: cleanVehicles
    };

    try {
      if (drawerMode === 'create') {
        await API.post('/residents', payload);
        toast.success(`Profile created for ${ownerName}`);
      } else {
        await API.put(`/residents/${currentId}`, payload);
        toast.success(`Profile updated for ${ownerName}`);
      }
      setShowDrawer(false);
      fetchResidents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error processing request');
      toast.error(e.response?.data?.message || 'Failed to save profile');
    }
  };

  const handleDelete = async (id: string, name: string): Promise<void> => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1 min-w-[250px]">
        <p className="text-slate-200 text-xs font-semibold">
          Are you sure you want to remove {name}? All vehicle records will be unlinked.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-450 rounded-lg border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await API.delete(`/residents/${id}`);
                toast.success(`Removed profile for ${name}`);
                fetchResidents();
              } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                toast.error(e.response?.data?.message || 'Delete operation failed');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-[10px] font-bold text-white rounded-lg shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      style: {
        background: '#0F172A',
        border: '1px solid rgba(245, 158, 11, 0.25)', // warning accent
      }
    });
  };

  return (
    <div className="space-y-8 relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Resident Database</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage registered flat occupants, tenants, and their vehicles.</p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="btn-scale px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/15"
        >
          <UserPlus className="w-5 h-5" /> Add Resident
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search Flat, Name, or license plate..."
          className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm shadow-inner"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-sm rounded-xl text-center font-bold">
          {error}
        </div>
      )}

      {/* Resident Records Card Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading resident profiles...
        </div>
      ) : residents.length === 0 ? (
        <div className="p-12 text-center text-slate-450 dark:text-slate-500 space-y-2">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-bold text-slate-700 dark:text-slate-350">No registered profiles</p>
          <p className="text-xs text-slate-500">Try matching a different query or add a new occupant profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {residents.map((res, index) => (
            <motion.div
              key={res._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
              className={`
                premium-card rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between gap-6 relative group
                ${res.isParked ? 'border-emerald-500/40 shadow-md shadow-emerald-500/[0.03]' : 'border-slate-200'}
              `}
            >
              {/* Header profile layout */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Name Initial Avatar */}
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center font-black text-slate-800 dark:text-white text-base shadow-inner">
                    {res.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{res.ownerName}</span>
                      <span className={`
                        px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
                        ${res.type === 'resident' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20'}
                      `}>
                        {res.type}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-blue-500" /> Bldg {res.buildingNumber} • Flat {res.flatNumber}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {res.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Parked status badge */}
                <div>
                  {res.isParked ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg uppercase tracking-wider animate-pulse flex items-center gap-1">
                      🟢 Parked
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Out
                    </span>
                  )}
                </div>
              </div>

              {/* Registered Vehicles list */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/[0.05] pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Registered Vehicles ({res.vehicles?.length || 0})
                  </span>
                </div>
                {res.vehicles && res.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {res.vehicles.map((v) => {
                      const currentlyParkedInside = res.parkedVehicles?.includes(v.plate);
                      return (
                        <div
                          key={v._id || v.plate}
                          className={`
                            p-2.5 rounded-xl border flex flex-col justify-center relative overflow-hidden transition-colors
                            ${currentlyParkedInside
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'}
                          `}
                        >
                          <span className="text-xs font-bold tracking-wider font-mono uppercase block">{v.plate}</span>
                          <span className="text-[9px] text-slate-450 dark:text-slate-500 block mt-0.5">{v.color} • {v.vehicleType}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No vehicles registered</p>
                )}
              </div>

              {/* Edit and Delete Actions on Card Hover */}
              <div className="absolute right-4 bottom-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => openEditDrawer(res)}
                  className="btn-scale p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-blue-500/10 transition-all flex items-center justify-center"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(res._id, res.ownerName)}
                  className="btn-scale p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md hover:shadow-rose-500/10 transition-all flex items-center justify-center"
                  title="Delete Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Centered Modal Overlay */}
      {showDrawer && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-default"
            onClick={() => setShowDrawer(false)}
          ></div>

          {/* Modal Wrapper */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh] animate-fadeIn">
               
               {/* Header */}
               <div className="shrink-0 p-6 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {drawerMode === 'create' ? 'Add Occupant Profile' : 'Edit Occupant Profile'}
                </h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={submitForm} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                
                {/* Full name input */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Occupant Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Phone number */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Phone Number (Login username)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Building */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      Building
                    </label>
                    <select
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                    >
                      {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map((num) => (
                        <option key={num} value={num}>Building {num}</option>
                      ))}
                    </select>
                  </div>

                  {/* Flat number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      Flat Number
                    </label>
                    <input
                      type="text"
                      required
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g. 504"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Classification Toggle */}
                <div>
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Occupancy Status
                  </span>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-white/5">
                    {(['resident', 'tenant'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 uppercase ${
                          type === t
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-extrabold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Vehicle Addition field section */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-widest">
                      Registered Vehicles
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVehicleField}
                      className="text-xs font-bold text-blue-600 dark:text-blue-450 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Vehicle
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No vehicles added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {vehicles.map((veh, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-3 relative group/veh"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicleField(idx)}
                            className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove Vehicle"
                          >
                            <Trash className="w-4 h-4" />
                          </button>

                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Vehicle #{idx + 1}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">License Plate</label>
                              <input
                                type="text"
                                required
                                value={veh.plate}
                                onChange={(e) => handleVehicleChange(idx, 'plate', e.target.value.toUpperCase())}
                                placeholder="MH12RR1234"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-xs font-mono uppercase"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Color</label>
                              <input
                                type="text"
                                required
                                value={veh.color}
                                onChange={(e) => handleVehicleChange(idx, 'color', e.target.value)}
                                placeholder="White, Black"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>

               {/* Drawer Action Footer */}
               <div className="shrink-0 p-6 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.01] flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/85 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all select-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('div')?.previousElementSibling as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10"
                >
                  Save Occupant
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResidentList;
