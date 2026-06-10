import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Search, Car, User, Phone, Home, Loader2, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../shared/PageTransition';
import type { PlateOwnerMatch } from '../../types';

const SearchOwner: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PlateOwnerMatch[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!query.trim()) return;
    setPendingQuery(query.trim());
    setShowConfirmModal(true);
  };

  const handleConfirmPrivacyNotice = async (): Promise<void> => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');
    setResults([]);
    setSearched(false);
    try {
      const { data } = await API.get<PlateOwnerMatch[]>(`/members/search-plate?plate=${pendingQuery.toUpperCase()}`);
      setResults(data);
      setSearched(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to query plate details. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPrivacyNotice = (): void => {
    setShowConfirmModal(false);
    setPendingQuery('');
  };

  // Automatically search as they type (debounced) or when they clear
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  return (
    <PageTransition><div className="space-y-8">
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

      {/* Privacy Notice Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Privacy Notice</h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  You are about to view personal contact details of a resident. This action will be logged and monitored by the admin. Do you want to continue?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelPrivacyNotice}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs border border-slate-200 dark:border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPrivacyNotice}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/15"
                >
                  Yes, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div></PageTransition>
  );
};

export default SearchOwner;
