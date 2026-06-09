import React, { useState } from 'react';
import API from '../../services/api';
import { Search, User, Phone, Building2, AlertCircle } from 'lucide-react';
import type { PlateOwnerMatch } from '../../types';

const SearchPlate: React.FC = () => {
  const [plate, setPlate] = useState('');
  const [results, setResults] = useState<PlateOwnerMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setError('');
    setSearched(true);
    try {
      const { data } = await API.get<PlateOwnerMatch[]>(`/members/search-plate?plate=${plate}`);
      setResults(data);
      if (data.length === 0) setError('No owner found for this plate number.');
    } catch {
      setError('Failed to search. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Search Vehicle Owner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Enter a plate number to find the registered owner's details.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text" value={plate} onChange={e => setPlate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Plate Number (e.g. MH01AB1234)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 uppercase tracking-widest text-sm"
            />
          </div>
          <button onClick={handleSearch}
            className="px-6 py-2.5 bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold rounded-xl transition-all duration-200 text-sm flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {searched && error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-600 dark:text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100 text-sm">
                  {r.plate}
                </span>
                <span className="text-[10px] font-bold text-brandTeal-600 dark:text-brandTeal-400 bg-brandTeal-500/10 px-2 py-0.5 rounded-full uppercase border border-brandTeal-500/20">Registered</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brandPurple-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Owner</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brandTeal-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Phone</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Building</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Building {r.buildingNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPlate;
