import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import {
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Users,
  Lock,
  User,
  Shield,
  FileText,
  ScanLine,
  Check,
  Search,
  AlertCircle,
  Zap,
  QrCode,
  Loader2
} from 'lucide-react'

import SummaryCard from '../components/tracking/SummaryCard'
import Timeline from '../components/tracking/Timeline'

export default function Login() {
  const [activeTab, setActiveTab] = useState('track')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams();
  const [patrakId, setPatrakId] = useState(searchParams.get('id') || '');
  const [trackLoading, setTrackLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [trackError, setTrackError] = useState(null);
  const [trackData, setTrackData] = useState(null);
  
  const [filters, setFilters] = useState({
    subject: '',
    date: '',
    location: ''
  });
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setActiveTab('track');
      handleTrack(idFromUrl);
    }
  }, []);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

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
    if (!id || typeof id !== 'string' || !id.trim()) {
      setTrackError('Please enter a valid Patrak ID');
      return;
    }

    setTrackLoading(true);
    setTrackError(null);
    setTrackData(null);
    setSearchResults([]);
    
    setSearchParams({ id });

    try {
      const response = await axios.get(`http://localhost:8000/api/track/${id}`);
      setTrackData(response.data);
      setFilters({ subject: '', date: '', location: '' });
    } catch (err) {
      if (err.response?.status === 404) {
        setTrackError('Patrak not found. Please check the ID and try again.');
      } else if (err.response?.status === 429) {
        setTrackError('Too many requests. Please try again later.');
      } else {
        setTrackError('An error occurred while fetching tracking details. Please try again.');
      }
    } finally {
      setTrackLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ subject: '', date: '', location: '' });
    setSearchResults([]);
  };

  return (
    <div className="h-screen w-full bg-[#fcfcfd] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Background */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none lg:hidden overflow-hidden flex items-start justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-red-50/30"></div>
          <img 
            src="/login-bg.png" 
            alt="Background" 
            className="w-full h-full object-cover object-top opacity-60"
          />
        </div>

        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex lg:w-1/2 p-4 xl:p-8 flex-col relative justify-center bg-[#fffafa]"
        >
          {/* Background Illustration / Elements */}
          <div className="absolute inset-0 z-0 mix-blend-multiply opacity-90 overflow-hidden pointer-events-none rounded-r-3xl flex items-center justify-center">
            <img 
              src="/login-bg.png" 
              alt="Background Illustration" 
              className="w-full h-full object-cover object-center animate-[float_6s_ease-in-out_infinite]"
              style={{ filter: 'contrast(1.05) brightness(0.98)' }}
            />
          </div>

          <div className="relative z-10 w-full max-w-xl mx-auto xl:pl-4">
            {/* Header / Logo */}
            <div className="flex items-center gap-2.5 mb-4 xl:mb-5">
              <img
                src="/scrb-logo.png"
                alt="SCRB Logo"
                className="w-8 h-8 xl:w-10 xl:h-10 object-contain"
              />
              <img
                src="/Gujarat_Police.png"
                alt="Gujarat Police Logo"
                className="w-8 h-8 xl:w-10 xl:h-10 object-contain"
              />
              <div>
                <h1 className="text-[#0f172a] font-bold text-base xl:text-lg leading-tight">SCRB Gujarat</h1>
                <p className="text-slate-500 text-xs xl:text-xs font-medium leading-tight">State Crime Records Bureau</p>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-block bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs xl:text-xs font-semibold mb-3 flex items-center gap-1.5 w-max border border-red-100">
              <ShieldCheck size={12} />
              Secure. Track. Simplify.
            </div>

            {/* Title */}
            <h2 className="text-[#0f172a] text-2xl xl:text-3xl font-bold leading-tight mb-2">
              Welcome to<br />
              <span className="text-[#dc2626]">Patrak Tracking System</span>
            </h2>
            
            <p className="text-slate-500 text-xs xl:text-sm max-w-md mb-5 leading-relaxed">
              Track, manage and monitor internal courier letters securely and efficiently across all police departments.
            </p>

            {/* Features List */}
            <div className="space-y-3 xl:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <ShieldCheck size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-xs xl:text-sm">Secure & Reliable</h3>
                  <p className="text-slate-500 text-xs xl:text-xs">Enterprise grade security with role-based access</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <ScanLine size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-xs xl:text-sm">Real-time Tracking</h3>
                  <p className="text-slate-500 text-xs xl:text-xs">Track every patrak movement in real-time</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <BarChart3 size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-xs xl:text-sm">Smart Dashboard</h3>
                  <p className="text-slate-500 text-xs xl:text-xs">Analytics and insights at your fingertips</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-red-50 rounded-lg xl:rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100/50">
                  <Users size={16} className="xl:w-5 xl:h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-xs xl:text-sm">Department Integration</h3>
                  <p className="text-slate-500 text-xs xl:text-xs">Unified system across all departments</p>
                </div>
              </div>

              {/* Highlighted Feature */}
              <div className="flex items-center justify-between p-2.5 xl:p-3 bg-red-50/80 border border-red-100 rounded-xl shadow-sm max-w-[340px] xl:max-w-[380px] mt-4 xl:mt-5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 xl:w-8 xl:h-8 bg-[#dc2626] rounded-full flex items-center justify-center text-white shrink-0 shadow-md shadow-red-200">
                    <ShieldCheck size={14} className="xl:w-4 xl:h-4" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-xs xl:text-xs">Enterprise Security</h3>
                    <p className="text-slate-500 text-xs xl:text-xs">OWASP Top 10 Compliant System</p>
                  </div>
                </div>
                <div className="w-4 h-4 xl:w-5 xl:h-5 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                  <Check size={10} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column (Form & Tracker) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-4 xl:p-6 bg-transparent lg:bg-[#fcfcfd] z-10 overflow-y-auto w-full relative"
        >
          <div className="w-full max-w-md lg:max-w-[380px] xl:max-w-[400px] flex flex-col items-center pt-6 lg:pt-0 pb-8 lg:pb-0 my-auto shrink-0">
            {/* Mobile Header (Hidden on LG) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6 w-full mt-2">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src="/scrb-logo.png" alt="SCRB Logo" className="w-[4.5rem] h-[4.5rem] sm:w-[5rem] sm:h-[5rem] object-contain drop-shadow-sm" />
                <img src="/Gujarat_Police.png" alt="Gujarat Police Logo" className="w-[4.5rem] h-[4.5rem] sm:w-[5rem] sm:h-[5rem] object-contain drop-shadow-sm" />
              </div>
              
              <h1 className="text-[#0f172a] font-black text-2xl sm:text-3xl mb-1 tracking-tight">SCRB Gujarat</h1>
              <p className="text-slate-500 text-sm sm:text-sm font-medium mb-5">State Crime Records Bureau</p>
              
              <div className="bg-red-50/80 text-red-600 px-4 py-1.5 rounded-full text-xs sm:text-xs font-bold mb-6 flex items-center justify-center gap-1.5 border border-red-100 shadow-sm backdrop-blur-sm">
                <ShieldCheck size={14} strokeWidth={2.5} />
                Secure. Track. Simplify.
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="w-full bg-slate-100/80 p-1.5 rounded-2xl flex items-center mb-6 border border-slate-200/60 shadow-inner backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('track')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'track' 
                    ? 'bg-white text-[#dc2626] shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Search size={16} />
                Track Patrak
              </button>
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'login' 
                    ? 'bg-white text-[#dc2626] shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Lock size={16} />
                Staff Login
              </button>
            </div>

            <div className="w-full relative">
              <AnimatePresence mode="wait">
                {activeTab === 'track' ? (
                  <motion.div
                    key="track"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 sm:p-8 border border-slate-100/80 w-full mb-6">
                      
                      {!trackData ? (
                        <>
                          <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-3 shadow-sm border border-red-100">
                              <Search size={24} />
                            </div>
                            <h2 className="font-bold text-xl lg:text-lg xl:text-xl text-slate-800 mb-1.5 tracking-tight">Track Document</h2>
                            <p className="text-slate-500 text-sm lg:text-xs xl:text-sm text-center">Enter Patrak ID or search by details</p>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700 ml-1">Patrak ID</label>
                              <div className="relative flex gap-2">
                                <input
                                  type="text"
                                  value={patrakId}
                                  onChange={(e) => setPatrakId(e.target.value)}
                                  placeholder="e.g. PAT-2026-001"
                                  className="w-full pl-4 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                />
                                <button 
                                  onClick={() => handleTrack()}
                                  disabled={trackLoading}
                                  className="bg-[#dc2626] hover:bg-red-700 text-white px-4 rounded-xl flex items-center justify-center transition-all shadow-md shadow-red-200/50 disabled:opacity-70"
                                >
                                  {trackLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                              <div className="h-px bg-slate-200 flex-1"></div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR SEARCH BY</span>
                              <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            <div className="space-y-3">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <FileText size={14} />
                                </div>
                                <input
                                  type="text"
                                  value={filters.subject}
                                  onChange={(e) => setFilters({...filters, subject: e.target.value})}
                                  placeholder="Subject keywords"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                />
                              </div>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <Zap size={14} />
                                </div>
                                <input
                                  type="text"
                                  value={filters.location}
                                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                                  placeholder="Origin / Location"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                />
                              </div>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <AlertCircle size={14} />
                                </div>
                                <input
                                  type="date"
                                  value={filters.date}
                                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-400"
                                />
                              </div>
                            </div>

                            {(filters.subject || filters.date || filters.location) && (
                              <div className="flex justify-end pt-1">
                                <button 
                                  onClick={clearFilters}
                                  className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                                >
                                  Clear Filters
                                </button>
                              </div>
                            )}
                          </div>

                          {trackError && (
                            <div className="mt-4 bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start gap-2">
                              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                              <p className="text-rose-600 text-xs font-medium leading-tight">{trackError}</p>
                            </div>
                          )}

                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-6">
                             <h2 className="font-bold text-lg text-slate-800 tracking-tight">Tracking Results</h2>
                             <button 
                               onClick={() => {
                                 setTrackData(null);
                                 setPatrakId('');
                                 setSearchParams({});
                               }}
                               className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                             >
                               <Search size={12} /> New Search
                             </button>
                          </div>
                          <div className="space-y-6">
                            <SummaryCard entry={trackData} timeline={trackData.timeline} />
                          </div>
                        </>
                      )}

                      {/* Search Results Display */}
                      {searching && searchResults.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                          <p className="text-xs font-medium">Searching entries...</p>
                        </div>
                      )}

                      {searchResults.length > 0 && !trackData && (
                        <div className="mt-6 space-y-3">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                            Matching Results ({searchResults.length}) {filters.location && <span className="normal-case text-slate-400 ml-1">[Searched in Origin/Sender Department]</span>}
                          </h3>
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {searchResults.map((result) => (
                              <button
                                key={result.unique_id}
                                onClick={() => handleTrack(result.unique_id)}
                                className="w-full text-left bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 p-3 rounded-xl transition-all group"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-black text-red-600 bg-white border border-red-100 px-2 py-0.5 rounded shadow-sm">
                                    {result.unique_id}
                                  </span>
                                  <span className="text-xs font-medium text-slate-400">
                                    {new Date(result.received_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1 group-hover:text-red-700 transition-colors line-clamp-2">
                                  {result.subject}
                                </h4>
                                <div className="flex items-center justify-between mt-2">
                                   <p className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                                     <ShieldCheck size={12} /> {result.sender_name}
                                   </p>
                                   <p className="text-xs font-bold text-slate-400 uppercase bg-slate-200/50 px-1.5 py-0.5 rounded">
                                     {result.current_department}
                                   </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(filters.subject || filters.date || filters.location) && searchResults.length === 0 && !searching && !trackData && (
                        <div className="text-center py-6 mt-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm font-bold text-slate-600 mb-0.5">No Patraks Found</p>
                          <p className="text-xs text-slate-400">Try adjusting your filters.</p>
                        </div>
                      )}

                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 sm:p-8 border border-slate-100/80 w-full mb-6">
                      <div className="flex flex-col items-center mb-6 xl:mb-8">
                        <div className="hidden lg:flex items-center gap-3 mb-2">
                          <img
                            src="/scrb-logo.png"
                            alt="SCRB Logo"
                            className="w-12 h-12 xl:w-14 xl:h-14 object-contain"
                          />
                          <img
                            src="/Gujarat_Police.png"
                            alt="Gujarat Police Logo"
                            className="w-12 h-12 xl:w-14 xl:h-14 object-contain"
                          />
                        </div>
                        <h2 className="font-bold text-xl lg:text-lg xl:text-xl text-slate-800 mb-1.5 tracking-tight">Staff Login</h2>
                        <p className="text-slate-500 text-sm lg:text-xs xl:text-sm">Enter credentials to access</p>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-3 xl:space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700 ml-1">Username</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <User size={14} />
                            </div>
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Enter your username"
                              required
                              className="w-full pl-8 pr-3 py-2 xl:py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm xl:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700 ml-1">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock size={14} />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required
                              className="w-full pl-8 pr-9 py-2 xl:py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm xl:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer group ml-1">
                            <div className="relative flex items-center justify-center">
                              <input type="checkbox" className="peer appearance-none w-[14px] h-[14px] border-2 border-slate-200 rounded-[3px] cursor-pointer checked:bg-[#dc2626] checked:border-[#dc2626] transition-all" />
                              <svg className="absolute w-2 h-2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                            <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Remember me</span>
                          </label>
                          <a href="#" className="text-[#dc2626] font-bold hover:underline">Forgot Password?</a>
                        </div>

                        {error && (
                          <p className="text-rose-500 text-xs font-medium text-center bg-rose-50 py-1.5 px-2 rounded-lg border border-rose-100">{error}</p>
                        )}

                        <button 
                          type="submit" 
                          disabled={loading}
                          className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold text-sm xl:text-sm py-2.5 xl:py-3 rounded-xl transition-all shadow-md shadow-red-200/50 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <>
                              <div className="w-[14px] h-[14px] flex items-center justify-center shrink-0 opacity-90">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                 </svg>
                              </div>
                              Sign In
                            </>
                          )}
                        </button>
                      </form>

                      <p className="text-center mt-6 xl:mt-8 text-slate-500 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#dc2626] font-bold hover:underline">
                          Register
                        </Link>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Footer/Cards (Hidden on LG) */}
            <div className="lg:hidden w-full space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50/60 border border-red-100/80 rounded-[1rem] shadow-sm w-full backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#dc2626] rounded-full flex items-center justify-center text-white shrink-0 shadow-md shadow-red-200">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-slate-800 font-extrabold text-sm">Enterprise Security</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">OWASP Top 10 Compliant System</p>
                  </div>
                </div>
                <div className="w-6 h-6 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                  <Check size={14} strokeWidth={3} />
                </div>
              </div>

              <div className="bg-[#fcfcfd]/80 border border-slate-100/80 rounded-[1rem] p-5 shadow-sm w-full backdrop-blur-sm">
                 <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#dc2626] shadow-sm mb-2.5">
                        <Lock size={16} strokeWidth={2} />
                      </div>
                      <h4 className="text-slate-800 font-extrabold text-xs sm:text-xs mb-1">Data Encryption</h4>
                      <p className="text-slate-500 text-xs sm:text-xs leading-tight font-medium">End-to-end<br/>encrypted</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#dc2626] shadow-sm mb-2.5">
                        <Shield size={16} strokeWidth={2} />
                      </div>
                      <h4 className="text-slate-800 font-extrabold text-xs sm:text-xs mb-1">Role Based Access</h4>
                      <p className="text-slate-500 text-xs sm:text-xs leading-tight font-medium">Secure role<br/>management</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#dc2626] shadow-sm mb-2.5">
                        <FileText size={16} strokeWidth={2} />
                      </div>
                      <h4 className="text-slate-800 font-extrabold text-xs sm:text-xs mb-1">Audit Logs</h4>
                      <p className="text-slate-500 text-xs sm:text-xs leading-tight font-medium">Complete activity<br/>logs</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200/60 mt-1">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#dc2626] shadow-sm">
                      <ShieldCheck size={16} strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-slate-800 font-extrabold text-sm sm:text-sm mb-0.5">100% Secure</h4>
                      <p className="text-slate-500 text-xs sm:text-xs font-medium">Your data is protected</p>
                    </div>
                 </div>
              </div>
              
              <div className="text-center pt-2 pb-6">
                <p className="text-slate-500 text-xs font-medium">© 2026 Patrak Tracking System. All rights reserved.</p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Footer Features */}
      <div className="hidden lg:block bg-[#fcfcfd] border-t border-slate-200/60 py-2.5 px-4 z-20 shrink-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-2 items-center justify-between">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <Lock size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-xs xl:text-xs mb-0.5">Data Encryption</h4>
                <p className="text-slate-500 text-xs xl:text-xs">End-to-end encrypted</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <Shield size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-xs xl:text-xs mb-0.5">Role Based Access</h4>
                <p className="text-slate-500 text-xs xl:text-xs">Secure role management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <FileText size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-xs xl:text-xs mb-0.5">Audit Logs</h4>
                <p className="text-slate-500 text-xs xl:text-xs">Complete activity logs</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                <ShieldCheck size={10} />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-xs xl:text-xs mb-0.5">100% Secure</h4>
                <p className="text-slate-500 text-xs xl:text-xs">Your data is protected</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-400 text-xs xl:text-xs font-medium">© 2026 Patrak Tracking System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}