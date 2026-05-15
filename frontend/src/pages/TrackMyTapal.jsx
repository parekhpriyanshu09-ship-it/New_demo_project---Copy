import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import api from '../services/api'
import { searchPatraks } from '../api/trackApi'
import {
  AlertCircle, Camera, LocateFixed, Loader2, QrCode, Upload,
  MapPin, FileText, User, Clock, Shield, Zap, Headphones, Search,
  Calendar as CalendarIcon, Info, Sparkles, SlidersHorizontal
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────────────── */
const statusClass = {
  pending: 'bg-amber-50 text-amber-600',
  created: 'bg-emerald-50 text-emerald-600',
  forwarded: 'bg-cyan-50 text-cyan-600',
  received: 'bg-emerald-50 text-emerald-600',
  active: 'bg-blue-50 text-blue-600',
  closed: 'bg-purple-50 text-purple-600',
  'in transit': 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-600',
}

function parseQrValue(value) {
  const normalized = String(value || '').trim()
  let match = normalized.match(/uid:([^|]+)/i) || normalized.match(/uid:\s*(.+)/i)
  if (match) return match[1].trim()
  try {
    const parsed = JSON.parse(normalized.replace(/'/g, '"').replace(/None/g, 'null'))
    if (parsed.unique_id) return parsed.unique_id
    if (parsed.patrak_id) return parsed.patrak_id
    if (parsed.entry_id) return parsed.entry_id
  } catch { /* plain text */ }
  return normalized
}

function formatTime(dateStr) {
  if (!dateStr) return '--:--'
  try { return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '--:--' }
}

function formatDate(dateStr) {
  if (!dateStr) return '--/--/----'
  try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '--/--/----' }
}

/* ─── feature strip data ──────────────────────────────────────────── */
const FEATURES = [
  { icon: Search, title: 'Real-time Tracking', desc: 'Get instant updates on your tapal status' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Your data is safe and secure with us' },
  { icon: Zap, title: 'Fast & Efficient', desc: 'Quick and easy way to track your tapal' },
  { icon: Headphones, title: '24/7 Support', desc: 'We are here to help you anytime' },
]

/* ═══════════════════════════════════════════════════════════════════ */
export default function TrackMyTapal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('id')   // 'id' | 'qr'
  const [patrakId, setPatrakId] = useState(searchParams.get('id') || '')

  const [smartQuery, setSmartQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const advancedRef = useRef(null)

  const [advancedForm, setAdvancedForm] = useState({
    keyword: '', senderName: '', receiverDepartment: '', senderLocation: '', status: '', priority: '', patrakId: '', date: '', fromDate: '', toDate: ''
  })

  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  const placeholders = [
    "Search tapals from Surat on 13 May...",
    "Urgent tapal received today...",
    "Patrak from crime branch...",
    "Pending tapal from Ahmedabad...",
    "Confidential patrak by Dhruv..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trackingData, setTrackingData] = useState(null)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const scannerRef = useRef(null)
  const scannerStartedRef = useRef(false)
  const scannerIdRef = useRef(`track-qr-reader-${Date.now()}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (advancedRef.current && !advancedRef.current.contains(event.target)) {
        setShowAdvanced(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /* auto-track from URL param */
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) { setPatrakId(id); fetchTracking(id) }
  }, [])

  /* cleanup scanner on unmount */
  useEffect(() => () => stopScanner(), [])

  /* start camera when tab=qr and cameraStarted=true */
  useEffect(() => {
    if (!cameraStarted || scannerStartedRef.current) return
    let cancelled = false
    async function startCam() {
      try {
        const scanner = new Html5Qrcode(scannerIdRef.current)
        scannerRef.current = scanner
        scannerStartedRef.current = true
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decoded) => {
            if (cancelled) return
            const id = parseQrValue(decoded)
            stopScanner()
            setPatrakId(id)
            fetchTracking(id)
            toast.success('QR code scanned')
          },
          () => { }
        )
      } catch {
        scannerStartedRef.current = false
        setCameraStarted(false)
        setCameraError('Camera not available. Upload a QR image instead.')
      }
    }
    startCam()
    return () => { cancelled = true }
  }, [cameraStarted])


  const handleSmartSearch = async (e, queryOverride = null) => {
    if (e) e.preventDefault()
    const queryToUse = queryOverride !== null ? queryOverride : smartQuery
    const hasAdvanced = Object.values(advancedForm).some(v => v)
    if (!queryToUse.trim() && !hasAdvanced) return
    setIsSearching(true)
    setSearchResults(null)
    setTrackingData(null)
    setError('')
    setShowAdvanced(false)
    try {
      const payload = { ...advancedForm }
      if (queryToUse.trim()) payload.smart_query = queryToUse.trim()
      const results = await searchPatraks(payload)
      setSearchResults(results || [])
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const resetSearch = () => {
    setSmartQuery('')
    setAdvancedForm({
      keyword: '', senderName: '', receiverDepartment: '', senderLocation: '', status: '', priority: '', patrakId: '', date: '', fromDate: '', toDate: ''
    })
    setSearchResults(null)
    setTrackingData(null)
    setError('')
  }
  const stopScanner = () => {
    setCameraStarted(false)
    scannerStartedRef.current = false
    if (scannerRef.current) {
      const s = scannerRef.current
      scannerRef.current = null
      try { s.stop().catch(() => { }).finally(() => { try { s.clear() } catch { } }) } catch { }
    }
  }

  const fetchTracking = async (idToFetch = patrakId) => {
    const id = String(idToFetch || '').trim()
    if (!id) { setError('Enter a valid Patrak ID or scan a QR code.'); return }
    setLoading(true); setError(''); setTrackingData(null)
    setSearchParams({ id })
    try {
      const res = await api.get(`/api/track/${encodeURIComponent(id)}`)
      setTrackingData(res.data)
    } catch {
      setError('Tracking status not found for this Patrak ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true)
    try {
      const scanner = new Html5Qrcode('track-hidden-qr-reader')
      const decoded = await scanner.scanFile(file, true)
      try { scanner.clear() } catch { }
      const id = parseQrValue(decoded)
      setPatrakId(id); fetchTracking(id)
    } catch {
      toast.error('Could not read QR code from image')
    } finally {
      setLoading(false); e.target.value = ''
    }
  }

  const movements = trackingData?.movements || []
  const currentStatus = (trackingData?.current_status || 'Pending').toString()
  const normStatus = currentStatus.toLowerCase()

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-10">
        <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

          {/* ── HEADER CARD ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#e6f9f4] rounded-2xl flex items-center justify-center shrink-0">
                <LocateFixed size={26} className="text-[#00C896]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Track Your Tapal</h1>
                <p className="text-sm text-slate-500">Track your official tapal using Patrak ID or QR Code</p>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT GRID ──────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">

            {/* ── LEFT PANEL ───────────────────────── */}
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex items-end">
                <button
                  onClick={() => { setActiveTab('id'); stopScanner() }}
                  className={`flex items-center gap-2.5 px-6 py-3.5 text-[13.5px] font-bold rounded-t-2xl transition-all ${activeTab === 'id'
                    ? 'bg-[#00C896] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-b-0 border-slate-100 hover:bg-slate-50'
                    }`}
                >
                  <FileText size={18} className={activeTab === 'id' ? 'text-white' : 'text-slate-400'} />
                  Track via Patrak ID
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex items-center gap-2.5 px-6 py-3.5 text-[13.5px] font-bold rounded-t-2xl transition-all ml-1 ${activeTab === 'qr'
                    ? 'bg-[#00C896] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-b-0 border-slate-100 hover:bg-slate-50'
                    }`}
                >
                  <QrCode size={18} className={activeTab === 'qr' ? 'text-white' : 'text-slate-400'} />
                  Track via QR Code
                </button>
                <button
                  onClick={() => { setActiveTab('search'); stopScanner() }}
                  className={`flex items-center gap-2.5 px-6 py-3.5 text-[13.5px] font-bold rounded-t-2xl transition-all ml-1 ${activeTab === 'search'
                    ? 'bg-[#00C896] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-b-0 border-slate-100 hover:bg-slate-50'
                    }`}
                >
                  <Sparkles size={18} className={activeTab === 'search' ? 'text-white' : 'text-slate-400'} />
                  Smart Search
                </button>
              </div>

              {/* Card Body */}
              <div className={`bg-white rounded-b-2xl rounded-tr-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex-1 flex flex-col ${activeTab === 'search' ? 'justify-start h-[550px] overflow-y-auto pr-2 pb-4 custom-scrollbar' : 'justify-center min-h-[360px]'}`}>
                {activeTab === 'id' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-bold text-slate-800 mb-1.5">Enter Patrak ID</h2>
                    <p className="text-[13.5px] text-slate-500 mb-8">Enter the unique Patrak ID to track the current status</p>

                    <form onSubmit={(e) => { e.preventDefault(); fetchTracking() }} className="space-y-4">
                      <div className="relative">
                        <input
                          value={patrakId}
                          onChange={(e) => setPatrakId(e.target.value)}
                          placeholder="e.g. PATRK/2026/05/000123"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-[14px] text-slate-800 font-semibold outline-none bg-white placeholder:text-slate-400 focus:border-[#00C896] focus:ring-4 focus:ring-[#00C896]/10 transition-all shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <FileText size={18} />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#00C896] hover:bg-[#00b386] text-white font-bold rounded-xl py-3.5 text-[14px] transition-colors disabled:opacity-60 shadow-[0_2px_8px_-2px_rgba(0,200,150,0.4)]"
                      >
                        {loading
                          ? <Loader2 size={18} className="animate-spin" />
                          : <LocateFixed size={18} />}
                        Track Tapal
                      </button>
                    </form>

                    <div className="mt-6 flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="w-5 h-5 rounded-full bg-[#00C896] flex items-center justify-center shrink-0 mt-0.5">
                        <Info size={12} className="text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        Enter a valid Patrak ID to view real-time tracking updates and status history.
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'qr' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-bold text-slate-800 mb-1.5">Scan QR Code</h2>
                    <p className="text-[13.5px] text-slate-500 mb-8">Use camera or upload a QR image to track your tapal</p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 min-h-[240px] flex items-center justify-center overflow-hidden mb-4">
                      {cameraError ? (
                        <div className="text-center p-6">
                          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
                          <p className="text-xs font-bold text-slate-500">{cameraError}</p>
                        </div>
                      ) : (
                        <div className="text-center w-full">
                          <div
                            id={scannerIdRef.current}
                            className="mx-auto overflow-hidden rounded-xl"
                            style={{ width: 240, height: 240, display: cameraStarted ? 'block' : 'none' }}
                          />
                          {!cameraStarted && (
                            <div className="py-10">
                              <div className="mx-auto mb-4 w-16 h-16 bg-[#e6f9f4] rounded-2xl flex items-center justify-center">
                                <Camera size={28} className="text-[#00C896]" />
                              </div>
                              <p className="text-xs text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                                Click Camera to scan or Upload a QR image
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setCameraError(''); setCameraStarted(true) }}
                        className="flex items-center justify-center gap-2 border border-[#00C896]/20 bg-[#e6f9f4] text-[#00C896] font-bold text-sm rounded-xl py-3 hover:bg-[#00C896]/10 transition"
                      >
                        <Camera size={16} /> Camera
                      </button>
                      <label className="flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-bold text-sm rounded-xl py-3 hover:bg-slate-50 cursor-pointer transition shadow-sm">
                        <Upload size={16} /> Upload
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-[22px] font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                          <Sparkles size={22} className="text-[#00C896]" />
                          Smart Search
                        </h2>
                        <p className="text-[13.5px] text-slate-500">Use natural language to find tapals instantly</p>
                      </div>
                      {(smartQuery || Object.values(advancedForm).some(v => v)) && (
                        <button type="button" onClick={resetSearch} className="text-[12px] font-bold text-[#00C896] bg-[#e6f9f4] px-3 py-1.5 rounded-lg hover:bg-[#00C896]/20 transition-colors">
                          Clear Search
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSmartSearch} className="relative z-20 space-y-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#00C896] to-[#0D3D56] rounded-[14px] blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                        <div className="relative bg-white rounded-xl shadow-sm border border-slate-200/80 flex items-center h-14">
                           <div className="w-14 flex items-center justify-center shrink-0">
                             <Search className="text-slate-400" size={20} />
                           </div>
                           <input
                             value={smartQuery}
                             onChange={(e) => setSmartQuery(e.target.value)}
                             className="flex-1 bg-transparent border-none outline-none text-slate-800 text-[15px] font-medium placeholder:text-slate-400 h-full"
                             placeholder={placeholders[placeholderIdx]}
                           />
                           
                           {/* Filter Button */}
                           <button 
                             type="button"
                             onClick={() => setShowAdvanced(!showAdvanced)}
                             className={`w-14 h-full flex items-center justify-center border-l border-slate-100 transition-colors ${showAdvanced ? 'bg-slate-50 text-[#00C896]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                             title="Show search options"
                           >
                             <SlidersHorizontal size={20} />
                           </button>

                           <div className="pr-1.5 pl-1 flex items-center gap-2 shrink-0">
                             <button type="submit" disabled={isSearching || (!smartQuery.trim() && !Object.values(advancedForm).some(v=>v))} className="bg-[#0D3D56] text-white w-11 h-11 rounded-lg flex items-center justify-center shadow-md hover:bg-[#092a3b] transition-all disabled:opacity-50">
                                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                             </button>
                           </div>
                        </div>
                      </div>

                      {/* GMAIL STYLE POPUP */}
                      {showAdvanced && (
                        <div ref={advancedRef} className="absolute top-[60px] left-0 right-0 sm:right-auto sm:w-[500px] bg-white rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="grid grid-cols-[100px_1fr] gap-y-3.5 gap-x-4 items-center">
                              
                              <label className="text-[12px] font-medium text-slate-500 text-right">Sender</label>
                              <input value={advancedForm.senderName} onChange={e=>setAdvancedForm({...advancedForm, senderName: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" placeholder="e.g. John Doe" />

                              <label className="text-[12px] font-medium text-slate-500 text-right">Department</label>
                              <input value={advancedForm.receiverDepartment} onChange={e=>setAdvancedForm({...advancedForm, receiverDepartment: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />

                              <label className="text-[12px] font-medium text-slate-500 text-right">Subject / Words</label>
                              <input value={advancedForm.keyword} onChange={e=>setAdvancedForm({...advancedForm, keyword: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />

                              <label className="text-[12px] font-medium text-slate-500 text-right">Location</label>
                              <input value={advancedForm.senderLocation} onChange={e=>setAdvancedForm({...advancedForm, senderLocation: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />

                              <label className="text-[12px] font-medium text-slate-500 text-right">Patrak ID</label>
                              <input value={advancedForm.patrakId} onChange={e=>setAdvancedForm({...advancedForm, patrakId: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />

                              <label className="text-[12px] font-medium text-slate-500 text-right">Status</label>
                              <select value={advancedForm.status} onChange={e=>setAdvancedForm({...advancedForm, status: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors bg-white">
                                <option value=""></option>
                                <option value="Pending">Pending</option>
                                <option value="Received">Received</option>
                                <option value="Forwarded">Forwarded</option>
                                <option value="Closed">Closed</option>
                              </select>

                              <label className="text-[12px] font-medium text-slate-500 text-right">Priority</label>
                              <select value={advancedForm.priority} onChange={e=>setAdvancedForm({...advancedForm, priority: e.target.value})} className="w-full border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors bg-white">
                                <option value=""></option>
                                <option value="NORMAL">Normal</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                              </select>
                              
                              <label className="text-[12px] font-medium text-slate-500 text-right">Date Within</label>
                              <div className="flex gap-2">
                                <input type="date" value={advancedForm.fromDate} onChange={e=>setAdvancedForm({...advancedForm, fromDate: e.target.value})} className="flex-1 border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />
                                <span className="text-slate-400 mt-1">-</span>
                                <input type="date" value={advancedForm.toDate} onChange={e=>setAdvancedForm({...advancedForm, toDate: e.target.value})} className="flex-1 border-b border-slate-200 hover:border-slate-300 py-1.5 text-[13.5px] outline-none focus:border-[#00C896] transition-colors" />
                              </div>

                           </div>
                           
                           <div className="flex justify-end mt-6">
                             <button type="submit" className="bg-[#0D3D56] text-white px-6 py-2 rounded font-bold text-[13px] hover:bg-[#092a3b] transition-colors flex items-center gap-2">
                               Search
                             </button>
                           </div>
                        </div>
                      )}

                      {/* Quick Search Chips */}
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Suggested Quick Searches</p>
                        <div className="flex flex-wrap gap-2.5">
                          {['Urgent tapals today', 'Pending from Surat', 'Crime Branch', 'Received yesterday', 'High priority'].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => { setSmartQuery(chip); handleSmartSearch(null, chip) }}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-[#00C896]/10 hover:text-[#00C896] hover:border-[#00C896]/30 transition-all shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>

                    {/* Results below the filters */}
                    {searchResults && (
                      <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                          <h3 className="text-sm font-bold text-slate-800">Search Results</h3>
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{searchResults.length} found</span>
                        </div>
                        {searchResults.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-[13px] font-bold text-slate-600">No records found matching filters</p>
                            <p className="text-[12px] text-slate-400 mt-1">Try adjusting your search criteria</p>
                          </div>
                        ) : (
                          <div className="space-y-3 pb-4">
                            {searchResults.map(result => (
                              <div key={result.unique_id} title={`Date shown is: ${result.date_label || 'Received Date'}`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#00C896]/40 hover:shadow-md transition-all group relative overflow-hidden cursor-help">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#00C896] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[13.5px] font-bold text-[#0D3D56]">{result.unique_id}</span>
                                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1"><CalendarIcon size={10} /> {formatDate(result.received_date)}</span>
                                  </div>
                                  <button onClick={() => { fetchTracking(result.unique_id); toast.success('Tracking loaded!') }} className="shrink-0 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-[#00C896] hover:text-white hover:border-[#00C896] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5">
                                    <LocateFixed size={12} /> View Tracking
                                  </button>
                                </div>
                                <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 mb-3" title={result.subject}>{result.subject}</p>
                                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
                                  <span className="flex items-center gap-1 bg-[#f8fafc] border border-slate-200 px-2 py-1 rounded text-[10.5px] font-bold text-slate-600 truncate max-w-[140px]" title={result.sender_name}>
                                    <User size={10} className="text-slate-400" /> {result.sender_name}
                                  </span>
                                  <span className="flex items-center gap-1 bg-[#f8fafc] border border-slate-200 px-2 py-1 rounded text-[10.5px] font-bold text-slate-600 truncate max-w-[140px]" title={result.current_department}>
                                    <MapPin size={10} className="text-slate-400" /> {result.current_department}
                                  </span>
                                  <div className="flex-1 flex justify-end gap-2">
                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${result.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : result.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{result.priority}</span>
                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${statusClass[result.status?.toLowerCase()] || 'bg-blue-50 text-blue-600 border-blue-100'}`}>{result.status}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT PANEL ──────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-[550px]">
              {error ? (
                <div className="flex flex-col items-center justify-center text-center h-full">
                  <AlertCircle className="mb-3 h-12 w-12 text-amber-400" />
                  <p className="text-base font-bold text-slate-800">{error}</p>
                  <p className="mt-2 text-sm text-slate-500">Please check the ID and try again.</p>
                </div>
              ) : !trackingData ? (
                <div className="flex flex-col items-center justify-center text-center h-full">
                  <div className="relative mb-8">
                    <img
                      src="/track-postbox.png"
                      alt="Track your Tapal"
                      className="w-64 h-64 lg:w-72 lg:h-72 object-contain"
                    />
                  </div>
                  <h3 className="text-[22px] font-bold text-slate-900 mb-2.5">Track your Tapal in real-time</h3>
                  <p className="text-[13.5px] text-slate-500 max-w-[280px] leading-relaxed">
                    Enter Patrak ID or scan QR Code to get instant tracking updates.
                  </p>
                </div>
              ) : (
                /* ── TRACKING RESULTS ── */
                <div className="space-y-6 h-full overflow-y-auto pr-2 pb-4">
                  {/* Entry Details */}
                  <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
                      <FileText size={16} className="text-[#00C896]" />
                      <h3 className="text-sm font-bold text-slate-800">Entry Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Patrak ID</p>
                        <p className="text-[13px] font-bold text-slate-800 break-all">{trackingData.patrak_id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-md tracking-wide uppercase ${statusClass[normStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {currentStatus === 'Active' ? 'In Transit' : currentStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subject</p>
                        <p className="text-[13px] font-semibold text-slate-800 line-clamp-2" title={trackingData.subject}>{trackingData.subject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Priority</p>
                        <span className="inline-flex px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md tracking-wide uppercase border border-red-100/50">
                          {trackingData.priority.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Sender</p>
                        <p className="text-[13px] font-semibold text-slate-800">{trackingData.sender_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Designation</p>
                        <p className="text-[13px] font-semibold text-slate-800">{trackingData.sender_designation || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Current Department</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#e6f9f4] flex items-center justify-center shrink-0">
                            <MapPin size={12} className="text-[#00C896]" />
                          </div>
                          <p className="text-[13px] font-bold text-slate-800">{trackingData.current_department}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Movement History */}
                  <div className="flex-1 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                      <Clock size={16} className="text-[#00C896]" />
                      <h3 className="text-sm font-bold text-slate-800">Department History</h3>
                    </div>

                    {movements.length === 0 ? (
                      <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100 h-full flex flex-col items-center justify-center">
                        <Clock size={28} className="mb-3 text-slate-300" />
                        <p className="text-[13px] font-semibold text-slate-500">No movements recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 relative before:absolute before:inset-y-0 before:left-[17px] before:w-px before:bg-slate-200/70">
                        {movements
                          .map((movement, index) => {
                            const mStatus = movement.status?.toLowerCase() || 'forwarded'
                            return (
                              <div key={`${movement.to_department}-${index}`} className="relative pl-10">
                                <div className="absolute left-[9px] top-1 w-[17px] h-[17px] rounded-full bg-white border-[3px] border-[#00C896] shadow-sm z-10" />
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <p className="text-[13.5px] font-bold text-slate-800 truncate">{movement.to_department}</p>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 tracking-wide ${mStatus === 'received' || mStatus === 'created' ? 'bg-emerald-50 text-emerald-600' :
                                      mStatus === 'closed' ? 'bg-purple-50 text-purple-600' :
                                        'bg-blue-50 text-blue-600'
                                      }`}>{movement.status}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-2">
                                    <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
                                      <span className="text-slate-400">From:</span>
                                      <span className="font-semibold text-slate-700">{movement.from_department || 'Origin'}</span>
                                    </p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
                                      <span className="text-slate-400">By:</span>
                                      <span className="font-semibold text-slate-700">{movement.forwarded_by || 'System'}</span>
                                    </p>
                                  </div>
                                  {movement.remarks && (
                                    <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                      <p className="text-[11.5px] text-slate-600 italic">"{movement.remarks}"</p>
                                    </div>
                                  )}
                                  <p className="text-[11px] font-medium text-slate-400 mt-2.5 flex items-center gap-1.5">
                                    <CalendarIcon size={12} />
                                    {movement.timestamp ? `${formatDate(movement.timestamp)}, ${formatTime(movement.timestamp)}` : '--/--/----'}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FEATURE CARDS STRIP ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-[#e6f9f4] rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-[#00C896]" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-800 mb-1">{title}</p>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-200/60">
          <p className="text-xs font-medium text-slate-400">© 2026 Patrak Tracking System. All rights reserved.</p>
          <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            Designed with <span className="text-[#00C896]">♥</span> for efficient tracking
          </p>
        </div>
      </div>

      <div id="track-hidden-qr-reader" className="hidden" />
    </Layout>
  )
}

