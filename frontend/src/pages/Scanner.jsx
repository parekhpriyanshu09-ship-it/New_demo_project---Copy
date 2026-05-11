import { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import { Card, Button } from '../components/common'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Search,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  FileText,
  Tag,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Calendar as CalendarIcon,
  ChevronDown,
  Mail,
  Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { useSearchParams } from 'react-router-dom'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
}

export default function Scanner() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'camera')
  const [cameraStarted, setCameraStarted] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [entryDetails, setEntryDetails] = useState(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [result, setResult] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const [electronicEntries, setElectronicEntries] = useState([])
  const [loadingElectronic, setLoadingElectronic] = useState(false)

  const fetchElectronicEntries = async () => {
    setLoadingElectronic(true)
    try {
      const res = await api.get('/api/entries?per_page=100')
      const userDept = user?.department || 'DG Office'
      const isAdmin = user?.role === 'admin'
      const pending = res.data.items.filter(entry => {
        const isElectronic = entry.receiving_mode === 'Mails' || entry.receiving_mode === 'Fax'
        const isPendingHere = isAdmin || entry.current_department === userDept
        return isElectronic && isPendingHere && entry.status !== 'Closed'
      })
      setElectronicEntries(pending)
    } catch (error) {
      toast.error('Failed to load electronic queue')
    } finally {
      setLoadingElectronic(false)
    }
  }

  const handleReceiveDigitallyDirect = async (entryId, deptName) => {
    try {
      await api.post('/api/qr/receive-electronic', {
        entry_id: entryId,
        department_name: deptName
      })
      toast.success('Document digitally received and logged!')
      fetchElectronicEntries()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to digitally receive document')
    }
  }

  const scannerRef = useRef(null)
  const isMountedRef = useRef(true)
  const scannerStartedRef = useRef(false)
  const hasScannedRef = useRef(false)
  const containerIdRef = useRef(`qr-reader-${Date.now()}`)

  const killAllCameraTracksSynchronously = () => {
    try {
      const container = document.getElementById(containerIdRef.current)
      if (container) {
        container.querySelectorAll('video').forEach(video => {
          if (video.srcObject) {
            video.srcObject.getTracks().forEach(t => t.stop())
            video.srcObject = null
          }
        })
      }
    } catch (e) { }
    try {
      document.querySelectorAll('video').forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop())
          video.srcObject = null
        }
      })
    } catch (e) { }
  }

  const destroyScanner = () => {
    scannerStartedRef.current = false
    setCameraReady(false)
    setCameraStarted(false)
    killAllCameraTracksSynchronously()
    if (scannerRef.current) {
      const s = scannerRef.current
      scannerRef.current = null
      try { s.stop().catch(() => { }).finally(() => { try { s.clear() } catch (e) { } }) }
      catch (e) { }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      destroyScanner()
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'camera') {
      destroyScanner()
    }
    if (activeTab === 'electronic') {
      fetchElectronicEntries()
    }
  }, [activeTab])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) destroyScanner()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleStartCamera = () => {
    if (scannerStartedRef.current) return
    setCameraError('')
    setCameraStarted(true)
  }

  useEffect(() => {
    if (!cameraStarted || scannerStartedRef.current || !isMountedRef.current) return
    const containerId = containerIdRef.current
    let cancelled = false
    const initScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner
        scannerStartedRef.current = true
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decodedText) => {
            if (!isMountedRef.current || cancelled) return
            handleScanSuccess(decodedText)
          },
          () => { }
        )
        if (!cancelled && isMountedRef.current) setCameraReady(true)
      } catch (err) {
        if (cancelled) return
        console.error('Scanner error:', err)
        scannerStartedRef.current = false
        setCameraStarted(false)
        killAllCameraTracksSynchronously()
        if (isMountedRef.current) {
          const msg = err.toString().toLowerCase()
          if (msg.includes('permission') || msg.includes('denied')) {
            setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
          } else {
            setCameraError('Camera not available. Please use Upload QR mode instead.')
          }
        }
      }
    }
    initScanner()
    return () => { cancelled = true }
  }, [cameraStarted])

  const handleScanSuccess = (decodedText) => {
    if (hasScannedRef.current) return
    hasScannedRef.current = true

    const onScanParsed = (entry_id, unique_id) => {
      destroyScanner()
      setScannedData({ entry_id, unique_id })
      fetchEntryDetails(entry_id)
      toast.success('QR Code identified successfully!')
    }

    try {
      const normalized = decodedText.trim().replace(/\n/g, '').replace(/\r/g, '')
      let match = normalized.match(/entry:(\d+)\|uid:(.+)/)
      if (match) { onScanParsed(parseInt(match[1]), match[2].trim()); return }
      match = normalized.match(/entry:(\d+):uid:(.+)/)
      if (match) { onScanParsed(parseInt(match[1]), match[2].trim()); return }

      try {
        const parsed = JSON.parse(normalized.replace(/'/g, '"').replace(/None/g, 'null'))
        if (parsed.entry_id) { onScanParsed(parseInt(parsed.entry_id), parsed.unique_id || ''); return }
      } catch { }

      match = normalized.match(/entry[:\s](\d+)/i)
      if (match) { onScanParsed(parseInt(match[1]), ''); return }

      hasScannedRef.current = false
      toast.error('Unrecognized QR format')
    } catch {
      hasScannedRef.current = false
      toast.error('Invalid QR data')
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!scannedData?.entry_id) return
    setLoading(true)
    try {
      const res = await api.post('/api/qr/scan', {
        entry_id: scannedData.entry_id,
        department_name: user.department || 'DG Office',
        remarks: remarks
      })
      setResult({ success: true, message: res.data.message })
      toast.success('Status updated successfully!')
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.detail || 'Update failed' })
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const html5QrCode = new Html5Qrcode("hidden-qr-reader")
      const decodedText = await html5QrCode.scanFile(file, true)
      handleScanSuccess(decodedText)
      try { html5QrCode.clear() } catch(e) {}
    } catch (error) {
      console.error('File scan error:', error)
      toast.error('Could not extract QR data from image. Please ensure it is a clear QR code.')
    } finally {
      setLoading(false)
      if (e.target) e.target.value = ''
    }
  }

  const fetchEntryDetails = async (entry_id) => {
    setFetchingDetails(true)
    try {
      const res = await api.get(`/api/entries/${entry_id}`)
      setEntryDetails(res.data)
    } catch (error) {
      setEntryDetails(null)
    } finally {
      setFetchingDetails(false)
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setEntryDetails(null)
    setResult(null)
    setRemarks('')
    setCameraReady(false)
    setCameraError('')
    setCameraStarted(false)
    scannerStartedRef.current = false
    hasScannedRef.current = false
    destroyScanner()
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1500px] mx-auto space-y-5 pb-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 font-heading tracking-tight leading-none">
              QR Scanner Terminal
            </h1>
            <p className="text-slate-400 font-bold text-[11px]">
              Scan patrak QR codes for immediate department arrival confirmation.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white border border-slate-50 rounded-xl px-3 sm:px-4 py-2 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
              <ShieldCheck size={14} className="text-red-600" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Secured Scan</span>
            </div>
            <button onClick={resetScanner} className="p-2.5 bg-white border border-slate-50 rounded-xl text-slate-400 hover:text-red-600 shadow-sm transition-all">
              <RefreshCw size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.div>

        {/* Tab Selection */}
        <motion.div variants={itemVariants} className="flex gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'camera'
              ? 'bg-red-600 text-white shadow-lg shadow-red-100'
              : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-50'
              }`}
          >
            <Camera size={14} className="inline-block mr-2 mt-[-2px]" />
            Live Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'upload'
              ? 'bg-red-600 text-white shadow-lg shadow-red-100'
              : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-50'
              }`}
          >
            <Upload size={14} className="inline-block mr-2 mt-[-2px]" />
            Upload Asset
          </button>
          <button
            onClick={() => setActiveTab('electronic')}
            className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'electronic'
              ? 'bg-red-600 text-white shadow-lg shadow-red-100'
              : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-50'
              }`}
          >
            <Building2 size={14} className="inline-block mr-2 mt-[-2px]" />
            Electronic Queue
          </button>
        </motion.div>

        {activeTab !== 'electronic' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Scanner Viewport */}
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2rem] overflow-hidden border-[6px] border-white shadow-2xl relative min-h-[360px] sm:min-h-[480px] flex items-center justify-center">
            {activeTab === 'camera' ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6">
                {cameraError ? (
                  <div className="text-center">
                    <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
                    <p className="text-white font-black text-[14px] mb-2">Access Denied</p>
                    <p className="text-slate-400 text-[11px] max-w-xs mx-auto mb-6 leading-relaxed">{cameraError}</p>
                    <Button onClick={() => setCameraStarted(false)} className="!bg-rose-500 !rounded-xl !text-[11px] !py-2.5">Retry Connection</Button>
                  </div>
                ) : (
                  <>
                    <div
                      id={containerIdRef.current}
                      className="rounded-3xl overflow-hidden border-2 border-white/10"
                      style={{ width: '280px', height: '280px', display: cameraStarted ? 'block' : 'none' }}
                    />
                    {!cameraStarted && (
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                          <Camera size={32} className="text-red-400" />
                        </div>
                        <h3 className="text-white font-black text-lg tracking-tight mb-2">Camera Readiness</h3>
                        <p className="text-slate-500 text-[11px] max-w-xs mx-auto mb-8 leading-relaxed">
                          Position the patrak QR code clearly within the viewport for automated identification.
                        </p>
                        <button
                          onClick={handleStartCamera}
                          className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-red-900/50 transition-all flex items-center gap-3 mx-auto"
                        >
                          <Play size={18} fill="currentColor" />
                          Initialize Terminal
                        </button>
                      </div>
                    )}
                    {cameraStarted && !cameraReady && (
                      <div className="mt-6 flex flex-col items-center">
                        <Loader2 size={24} className="text-red-400 animate-spin mb-3" />
                        <p className="text-red-300 text-[10px] font-black uppercase tracking-widest">Warming Up Sensor...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-12 text-center w-full h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                  <Upload size={32} className="text-red-400" />
                </div>
                <p className="text-white font-black text-base mb-2">Electronic Submission</p>
                <p className="text-slate-500 text-[11px] mb-8 max-w-xs mx-auto">Select a high-resolution image of the QR code for off-line processing.</p>
                <label className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer">
                  Browse Files
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Visual scan overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20 animate-scan" />
          </motion.div>

          {/* Result & Actions */}
          <motion.div variants={itemVariants} className="flex flex-col gap-5">
            <Card className="flex-1 bg-white rounded-[2rem] p-8 border border-slate-50 shadow-sm relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full blur-3xl -mr-16 -mt-16" />

              <AnimatePresence mode="wait">
                {!scannedData && !result ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center py-10"
                  >
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-800 font-black text-[13px] tracking-tight mb-1">Awaiting Scanner Input</p>
                    <p className="text-slate-400 font-bold text-[11px] max-w-[200px]">The processing engine will automatically trigger upon QR detection.</p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-6"
                  >
                    <div className={`w-16 h-16 ${result.success ? 'bg-emerald-50' : 'bg-rose-50'} rounded-[1.5rem] flex items-center justify-center mb-6`}>
                      {result.success ? <CheckCircle size={32} className="text-emerald-500" /> : <AlertCircle size={32} className="text-rose-500" />}
                    </div>
                    <h3 className={`text-lg font-black tracking-tight ${result.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {result.success ? 'Movement Logged' : 'Operational Error'}
                    </h3>
                    <p className="text-slate-400 font-bold text-[12px] mt-2 mb-8 leading-relaxed max-w-xs">{result.message}</p>
                    <button onClick={resetScanner} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all">
                      Initiate New Scan
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <CheckCircle size={20} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-slate-800 tracking-tight leading-none mb-1">Identification Verified</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry UID: {scannedData.unique_id?.startsWith('PTRK') ? scannedData.unique_id : `#${scannedData.unique_id?.slice(0, 8) || 'N/A'}`}</p>
                      </div>
                    </div>

                    {fetchingDetails ? (
                      <div className="py-12 text-center">
                        <Loader2 size={32} className="text-red-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-[11px] font-bold">Synchronizing letter profile...</p>
                      </div>
                    ) : entryDetails ? (
                      <div className="space-y-5">
                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50/80">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Profile</p>
                          <h4 className="text-[13px] font-black text-slate-800 leading-snug">{entryDetails.subject}</h4>

                          <div className="grid grid-cols-2 gap-4 mt-5">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Originator</p>
                              <p className="text-[11px] font-black text-slate-700">{entryDetails.sender_name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${entryDetails.priority === 'Urgent' ? 'text-amber-500' :
                                entryDetails.priority === 'Confidential' ? 'text-rose-500' :
                                  'text-emerald-500'
                                }`}>{entryDetails.priority}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Arrival Remarks</label>
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add operational notes (optional)..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button variant="ghost" onClick={resetScanner} className="flex-1 !text-slate-400 !font-bold">Abort</Button>
                          <Button onClick={handleManualSubmit} loading={loading} className="flex-2 !bg-red-600 shadow-xl shadow-red-100">
                            <CheckCircle size={16} className="mr-2" />
                            Confirm Arrival
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-rose-600 text-[11px] font-bold">The system could not retrieve the profile for this Entry ID. Please check the network or scan again.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
        ) : (
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm"
          >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-6 mb-6 gap-4">
                 <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                       <Building2 className="text-emerald-500" size={20} />
                       Incoming Digital Transmission Queue
                    </h2>
                    <p className="text-slate-400 font-bold text-[11px] mt-0.5">
                       Real-time electronic mail and fax entries waiting for acknowledgement at {user?.department || 'your department'}.
                    </p>
                 </div>
                 <button 
                   onClick={fetchElectronicEntries}
                   className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2 self-start sm:self-auto transition-all"
                 >
                    <RefreshCw size={12} className={loadingElectronic ? 'animate-spin' : ''} />
                    Refresh Queue
                 </button>
              </div>

              {loadingElectronic ? (
                 <div className="py-20 text-center">
                    <Loader2 size={36} className="text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Fetching incoming server nodes...</p>
                 </div>
              ) : electronicEntries.length === 0 ? (
                 <div className="py-16 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100">
                       <Building2 size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-700 font-black text-[13px] tracking-tight mb-1">Queue is Clear</h3>
                    <p className="text-slate-400 font-bold text-[11px] leading-relaxed">
                       No digital Mails or Fax documents are currently waiting for arrival validation at this stage. All transmissions are logged.
                    </p>
                 </div>
              ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                             <th className="pb-3 pl-4">Patrak ID</th>
                             <th className="pb-3">Subject</th>
                             <th className="pb-3">Mode</th>
                             <th className="pb-3">Sender Detail</th>
                             <th className="pb-3">Stage</th>
                             <th className="pb-3 pr-4 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50/50">
                          {electronicEntries.map((entry) => (
                             <tr key={entry.id} className="text-xs text-slate-700 hover:bg-slate-50/40 transition-colors group">
                                <td className="py-4 pl-4 font-black text-slate-800 group-hover:text-red-600 transition-colors">
                                   {entry.unique_id || `PTRK/2025/000${entry.id}`}
                                </td>
                                <td className="py-4 max-w-xs truncate">
                                   <div className="font-bold text-slate-700">{entry.subject}</div>
                                   <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{entry.description || 'No description'}</div>
                                </td>
                                <td className="py-4">
                                   <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider border ${
                                     entry.receiving_mode === 'Mails' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                   }`}>
                                      {entry.receiving_mode}
                                   </span>
                                </td>
                                <td className="py-4 font-medium text-slate-500">
                                   {entry.receiving_mode === 'Mails' ? (
                                      <div className="flex items-center gap-1.5 text-[11px]">
                                         <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                         <span className="truncate max-w-[150px] font-bold text-slate-600">{entry.sender_email}</span>
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-1.5 text-[11px]">
                                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                         <span className="font-mono font-bold text-slate-600">{entry.fax_number}</span>
                                      </div>
                                   )}
                                </td>
                                <td className="py-4">
                                   <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                      <span>Current:</span>
                                      <span className="text-slate-800 font-extrabold">{entry.current_department}</span>
                                   </div>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                   <button 
                                     onClick={() => handleReceiveDigitallyDirect(entry.id, entry.current_department)}
                                     className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-50 hover:shadow-lg hover:shadow-emerald-100 flex items-center gap-1.5 ml-auto"
                                   >
                                      <CheckCircle size={12} />
                                      Acknowledge Receipt
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
          </motion.div>
        )}
      </motion.div>
        {/* Hidden div for file scanning */}
        <div id="hidden-qr-reader" style={{ display: "none" }}></div>
    </Layout>
  )
}
