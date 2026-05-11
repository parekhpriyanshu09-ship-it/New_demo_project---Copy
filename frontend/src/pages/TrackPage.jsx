import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Loader2, AlertCircle, QrCode, HelpCircle, ShieldCheck, Zap, Eye, Lock, Heart } from 'lucide-react';
import SummaryCard from '../components/tracking/SummaryCard';
import Timeline from '../components/tracking/Timeline';

const TrackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patrakId, setPatrakId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // New Filter States
  const [filters, setFilters] = useState({
    subject: '',
    date: '',
    location: ''
  });
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      handleTrack(idFromUrl);
    }
  }, []);

  // Effect for live searching
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.subject || filters.date || filters.location) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.date) params.append('date', filters.date);
      if (filters.location) params.append('location', filters.location);
      
      const response = await axios.get(`http://localhost:8000/api/track/search?${params.toString()}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleTrack = async (idToFetch) => {
    const id = idToFetch || patrakId;
    if (!id.trim()) {
      setError('Please enter a valid Patrak ID');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setSearchResults([]); // Clear search results when tracking specific one
    
    setSearchParams({ id });

    try {
      const response = await axios.get(`http://localhost:8000/api/track/${id}`);
      setData(response.data);
      // Clear filters to focus on result
      setFilters({ subject: '', date: '', location: '' });
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Patrak not found. Please check the ID and try again.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else {
        setError('An error occurred while fetching tracking details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ subject: '', date: '', location: '' });
    setSearchResults([]);
  };

  return (
    <div 
      className="min-h-screen font-sans selection:bg-red-500/30 flex flex-col relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/tracking_bg.png')" }}
    >
      
      {/* Semi-transparent overlay to ensure content readability */}
      <div className="absolute inset-0 bg-white/60 pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
            <div className="w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-yellow-400 rounded-full"></div>
            </div>
          </div>
          <div className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
            <div className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-slate-800 leading-tight">SCRB Gujarat</h1>
            <p className="text-xs text-slate-500">State Crime Records Bureau</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
            <HelpCircle className="w-4 h-4 text-red-500" />
            How to Track?
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
            <QrCode className="w-4 h-4 text-red-500" />
            Scan QR Code
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center pt-12 pb-20 px-4 w-full max-w-5xl mx-auto">
        
        {/* Public Access Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 text-xs font-bold mb-8">
          <ShieldCheck className="w-3.5 h-3.5" />
          Public Access
        </div>

        {/* Hero Title */}
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 text-center">
          Track Your <span className="text-[#cc181e]">Patrak</span>
        </h2>
        <p className="text-slate-500 text-center max-w-lg mb-10">
          Find your Patrak using the filters below and click to view its real-time status.
        </p>

        {/* Filter Section */}
        <div className="w-full bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-2">
                <Search className="w-3 h-3" /> Subject
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={filters.subject}
                  onChange={(e) => setFilters({...filters, subject: e.target.value})}
                  placeholder="Enter Subject..."
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Location/Sender Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Origin / Location
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="Enter Sender Office..."
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {(filters.subject || filters.date || filters.location) && (
            <div className="flex justify-end mt-4">
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Search Results List */}
        {searchResults.length > 0 && !data && (
          <div className="w-full max-w-4xl space-y-4 mb-12 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4">
              Matching Patraks ({searchResults.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {searchResults.map((result) => (
                <button
                  key={result.unique_id}
                  onClick={() => handleTrack(result.unique_id)}
                  className="w-full bg-white hover:bg-red-50/30 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md group text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">
                        {result.unique_id}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(result.received_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 group-hover:text-red-700 transition-colors">
                      {result.subject}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> From: {result.sender_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Current Station</p>
                      <p className="text-sm font-bold text-slate-700">{result.current_department}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State for Search */}
        {searching && searchResults.length === 0 && (
          <div className="flex flex-col items-center gap-4 my-12 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            <p className="font-medium">Searching entries...</p>
          </div>
        )}

        {/* No Results State */}
        {(filters.subject || filters.date || filters.location) && searchResults.length === 0 && !searching && !data && (
          <div className="text-center py-12 px-6 bg-white/50 rounded-3xl border border-dashed border-slate-300 w-full mb-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">No Patraks Found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters or check the spelling.</p>
          </div>
        )}
        
        <div className="text-sm font-medium text-slate-500 mb-16 flex items-center gap-2">
          Or scan QR code on your Patrak <button className="text-[#cc181e] hover:text-red-700 flex items-center gap-1"><QrCode className="w-4 h-4"/> Scan QR Code</button>
        </div>

        {/* Error State */}
        {error && (
          <div className="w-full max-w-2xl mb-12 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Area */}
        {data && !loading && (
          <div className="w-full animate-fade-in-up transition-all duration-500 mb-12">
            <SummaryCard entry={data} timeline={data.timeline} />
          </div>
        )}

        {/* Features Footer (Only visible when not tracking or at bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-auto pt-16 border-t border-slate-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Secure & Private</h4>
              <p className="text-xs text-slate-500">Your data is protected with enterprise security</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Real-time Updates</h4>
              <p className="text-xs text-slate-500">Get instant updates on movement changes</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Transparent Process</h4>
              <p className="text-xs text-slate-500">Track across all departments</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">No Login Required</h4>
              <p className="text-xs text-slate-500">Enter ID or scan QR to track</p>
            </div>
          </div>
        </div>
      </main>

      {/* Solid Red Footer */}
      <footer className="w-full bg-[#991216] text-red-100 py-6 mt-auto border-t-[8px] border-[#cc181e] relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            © 2026 Patrak Tracking System. All rights reserved.
          </div>
          <div className="text-sm font-medium flex items-center gap-1.5">
            Made for SCRB Gujarat <Heart className="w-4 h-4" />
          </div>
        </div>
      </footer>
      
    </div>
  );
};

export default TrackPage;
