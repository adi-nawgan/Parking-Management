import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  X,
  Phone,
  Hash,
} from 'lucide-react';
import type { Resident, Vehicle } from '../../types';

const ResidentList: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // CRUD Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
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
      setError('Failed to load resident files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreateModal = (): void => {
    setModalMode('create');
    setBuildingNumber(28);
    setFlatNumber('');
    setOwnerName('');
    setPhone('');
    setType('resident');
    setVehicles([{ plate: '', vehicleType: 'Car', color: '' }]);
    setShowModal(true);
  };

  const openEditModal = (res: Resident): void => {
    setModalMode('edit');
    setCurrentId(res._id);
    setBuildingNumber(res.buildingNumber || 28);
    setFlatNumber(res.flatNumber);
    setOwnerName(res.ownerName);
    setPhone(res.phone);
    setType(res.type);
    setVehicles(res.vehicles.length > 0 ? [...res.vehicles] : [{ plate: '', vehicleType: 'Car', color: '' }]);
    setShowModal(true);
  };

  const handleAddVehicleField = (): void => {
    if (vehicles.length >= 3) return;
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
      if (modalMode === 'create') {
        await API.post('/residents', payload);
      } else {
        await API.put(`/residents/${currentId}`, payload);
      }
      setShowModal(false);
      fetchResidents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to remove this resident/tenant profile? All vehicle logs will be unlinked.')) {
      return;
    }
    try {
      await API.delete(`/residents/${id}`);
      fetchResidents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Delete operation failed');
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resident Database</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Register and manage flat occupants, tenants, and their vehicles.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-brandPurple-500/15"
        >
          <UserPlus className="w-5 h-5" /> Add Resident / Tenant
        </button>
      </div>

      {/* Query Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search by Flat, Owner Name, or Plate..."
          className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Resident Records Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading database profiles...
        </div>
      ) : residents.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          No registered resident matches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {residents.map((res) => (
            <div
              key={res._id}
              className={`
                glass-card rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between gap-6
                ${res.isParked ? 'border-brandTeal-500/40 shadow-lg shadow-brandTeal-500/[0.03]' : 'border-slate-200 dark:border-white/5'}
              `}
            >

              {/* Header Profile */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{res.ownerName}</span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${res.type === 'resident' ? 'bg-brandPurple-500/15 text-brandPurple-400 border border-brandPurple-500/25' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'}
                    `}>
                      {res.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-500" /> Bldg {res.buildingNumber} • Flat {res.flatNumber}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {res.phone}</span>
                  </div>
                </div>

                {/* Parked status indicator */}
                {res.isParked ? (
                  <span className="px-2.5 py-1 bg-brandTeal-500/10 text-brandTeal-400 border border-brandTeal-500/20 text-xs font-semibold rounded-lg flex items-center gap-1.5 animate-pulse">
                    🟢 Parked Inside
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-500/5 text-slate-500 border border-slate-700/20 text-xs font-semibold rounded-lg">
                    ⚪ Out
                  </span>
                )}
              </div>

              {/* Registered Vehicles */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Registered Vehicles</p>
                {res.vehicles && res.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {res.vehicles.map((v) => {
                      const currentlyParkedInside = res.parkedVehicles?.includes(v.plate);
                      return (
                        <div
                          key={v._id || v.plate}
                          className={`
                            p-3 rounded-xl border flex flex-col justify-center relative overflow-hidden
                            ${currentlyParkedInside
                              ? 'bg-brandTeal-500/10 border-brandTeal-500/30 text-brandTeal-600 dark:text-brandTeal-400'
                              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'}
                          `}
                        >
                          <span className="text-xs font-bold tracking-wider font-mono uppercase block">{v.plate}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">{v.color} • {v.vehicleType}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No vehicles registered</p>
                )}
              </div>

              {/* CRUD Actions Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-white/5 pt-4">
                <button
                  onClick={() => openEditModal(res)}
                  className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-brandPurple-500/10 dark:hover:bg-brandPurple-500/15 border border-slate-200 dark:border-white/5 hover:border-brandPurple-500/30 text-slate-500 hover:text-brandPurple-600 dark:text-slate-400 dark:hover:text-brandPurple-400 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(res._id)}
                  className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-slate-200 dark:border-white/5 hover:border-rose-500/30 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT RESIDENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {modalMode === 'create' ? 'Add Resident / Tenant Profile' : 'Update Resident Profile'}
            </h3>

            <form onSubmit={submitForm} className="space-y-4">

              {/* Main Fields - Row 1: Building + Flat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Building Number
                  </label>
                  <select
                    value={buildingNumber}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuildingNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-sm"
                  >
                    {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map(num => (
                      <option key={num} value={num}>Building {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Flat Number
                  </label>
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlatNumber(e.target.value)}
                    placeholder="Enter Flat Number"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                  />
                </div>
              </div>

              {/* Main Fields - Row 2: Occupancy Classification (full width) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Occupancy Classification
                </label>
                <select
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as 'resident' | 'tenant')}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-sm"
                >
                  <option value="resident">Resident Owner</option>
                  <option value="tenant">Tenant / Renter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Occupant Name
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwnerName(e.target.value)}
                  placeholder="Enter Occupant Name"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Contact
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                  placeholder="Enter Phone Contact"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 text-sm"
                />
              </div>

              {/* Registered Vehicles Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                    Registered Vehicles (Max 3)
                  </span>
                  {vehicles.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddVehicleField}
                      className="px-2.5 py-1 bg-brandPurple-500/10 hover:bg-brandPurple-600 text-brandPurple-650 dark:text-brandPurple-400 hover:text-white text-[11px] font-bold rounded-lg border border-brandPurple-500/25 hover:border-transparent transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add vehicle
                    </button>
                  )}
                </div>

                {vehicles.map((veh, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative group animate-fadeIn"
                  >
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Plate Number</label>
                      <input
                        type="text"
                        required
                        value={veh.plate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVehicleChange(index, 'plate', e.target.value)}
                        placeholder="Enter Plate Number"
                        className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Body Type</label>
                      <select
                        value={veh.vehicleType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleVehicleChange(index, 'vehicleType', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
                      >
                        <option value="Car">Car</option>
                        <option value="SUV">SUV</option>
                        <option value="Bike">Bike</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Color</label>
                      <input
                        type="text"
                        required
                        value={veh.color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVehicleChange(index, 'color', e.target.value)}
                        placeholder="Enter Color"
                        className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicleField(index)}
                        className="w-full sm:w-auto p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg border border-rose-500/25 hover:border-transparent transition-all flex items-center justify-center text-xs font-semibold gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm mt-6"
              >
                {modalMode === 'create' ? 'Add Occupant Profile' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResidentList;
