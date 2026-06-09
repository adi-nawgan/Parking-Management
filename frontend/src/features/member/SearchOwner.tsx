import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Search, Car, User, Phone, Home, Loader2, Info } from 'lucide-react';
import type { PlateOwnerMatch } from '../../types';

const SearchOwner: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PlateOwnerMatch[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await API.get<PlateOwnerMatch[]>(`/members/search-plate?plate=${query.trim()}`);
      setResults(data);
      setSearched(true);
    } catch {
      setError('Failed to query plate details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically search as they type (debounced) or when they clear
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Lookup Vehicle Owner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Enter a vehicle license plate number to find the owner's contact details and building unit.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/5 max-w-2xl shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Car className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="e.g. MH12RR3321"
              className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brandPurple-600 hover:bg-brandPurple-700 disabled:bg-brandPurple-600/50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-brandPurple-500/15"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Owner
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl max-w-2xl text-center">
          {error}
        </div>
      )}

      {/* Results Display */}
      <div className="max-w-2xl space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-brandPurple-500" />
            Searching vehicle records...
          </div>
        ) : searched && results.length === 0 ? (
          <div className="p-10 text-center glass-card border border-slate-200 dark:border-white/5 rounded-2xl text-slate-500 text-sm space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No Owner Matches Found</p>
            <p className="text-xs">No registered resident owns a vehicle with the plate number "{query}".</p>
          </div>
        ) : (
          results.map((res, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 border border-brandPurple-500/10 hover:border-brandPurple-500/20 transition-all duration-300 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    {res.plate}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Owner Profile Matches</span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1 text-slate-700 dark:text-slate-300 text-sm">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-brandPurple-500" />
                    <span className="font-bold">{res.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-brandPurple-500" />
                    <span>Building {res.buildingNumber}</span>
                  </div>
                </div>
              </div>

              {/* Action/Contact Card */}
              <div className="w-full sm:w-auto flex justify-end">
                <a
                  href={`tel:${res.phone}`}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-brandPurple-500/10 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brandPurple-500/20 text-slate-700 dark:text-slate-200 hover:text-brandPurple-500 dark:hover:text-brandPurple-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {res.phone}</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchOwner;
