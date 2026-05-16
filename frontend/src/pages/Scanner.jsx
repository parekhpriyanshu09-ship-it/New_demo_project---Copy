import { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import { Card, Button } from '../components/common'
import api from '../services/api'
import { forwardPatrak, receivePatrak } from '../api/forwardApi'
import { updateEntry } from '../api/entriesApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Building2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  X,
  Send,
  Clock,
  User,
  ArrowLeftRight,
  Search,
  Edit2,
  History,
  MapPin
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { useSearchParams, useNavigate } from 'react-router-dom'

const DEPARTMENTS = [
  'DG Office',
  'CID Crime',
  'Law & Order',
  'Training',
  'TS & SCRB',
  'Cyber Cell',
  'Admin Branch'
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

export default function Scanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'camera')
  const [cameraStarted, setCameraStarted] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [entryDetails, setEntryDetails] = useState(null)
  const [movements, setMovements] = useState([])
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false)
  const [receiving, setReceiving] = useState(false)
  
  const [editHistory, setEditHistory] = useState([])

  const [showForwardModal, setShowForwardModal] = useState(false)
  const [forwardForm, setForwardForm] = useState({ to_department: '', remarks: '' })
  const [forwarding, setForwarding] = useState(false)

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
          { fps: 10, qrbox: { width: 150, height: 150 }, aspectRatio: 1 },
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
      const res = await api.get(`/api/entries/${entry_id}/tracking`)
      setEntryDetails(res.data.entry)
      setMovements(res.data.movements || [])
      setEditHistory(res.data.edit_history || [])
      
      setTimeout(() => {
        setVerificationComplete(true)
      }, 1500)
    } catch (error) {
      setEntryDetails(null)
      setMovements([])
      setEditHistory([])
    } finally {
      setFetchingDetails(false)
    }
  }

  const handleConfirmArrival = async () => {
    if (!entryDetails) return
    setReceiving(true)
    try {
      await receivePatrak(entryDetails.id)
      setArrivalConfirmed(true)
      toast.success('Patrak received at current department!')
      try {
        const movesRes = await api.get(`/api/entries/${entryDetails.id}/tracking`)
        setMovements(movesRes.data.movements || [])
        setEditHistory(movesRes.data.edit_history || [])
      } catch(e) {}
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm arrival')
    } finally {
      setReceiving(false)
    }
  }

  const handleEditDetails = () => {
    navigate('/without-qr-code', { 
      state: { editMode: true, patrakData: entryDetails } 
    })
  }

  const handleForward = async (e) => {
    e.preventDefault()
    if (!forwardForm.to_department || !entryDetails) return

    setForwarding(true)
    try {
      const response = await forwardPatrak({
        entry_id: entryDetails.id,
        to_department: forwardForm.to_department,
        remarks: forwardForm.remarks || undefined
      })
      
      setShowForwardModal(false)
      setForwardForm({ to_department: '', remarks: '' })
      
      setResult({
        success: true,
        message: `Patrak successfully forwarded to ${forwardForm.to_department}`,
        movement: {
          from: entryDetails.current_department,
          to: forwardForm.to_department
        }
      })
      setArrivalConfirmed(false)
      toast.success(`Patrak forwarded to ${forwardForm.to_department}`)
      try {
        const movesRes = await api.get(`/api/entries/${entryDetails.id}/tracking`)
        setMovements(movesRes.data.movements || [])
        setEditHistory(movesRes.data.edit_history || [])
      } catch(e) {}
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to forward patrak')
    } finally {
      setForwarding(false)
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setEntryDetails(null)
    setMovements([])
    setEditHistory([])
    setResult(null)
    setCameraReady(false)
    setCameraError('')
    setCameraStarted(false)
    setVerificationComplete(false)
    setArrivalConfirmed(false)
    setShowForwardModal(false)
    setForwardForm({ to_department: '', remarks: '' })
    scannerStartedRef.current = false
    hasScannedRef.current = false
    destroyScanner()
  }

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Urgent': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'Important': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto space-y-4 pb-10"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 font-heading tracking-tight leading-none">
              Patrak Movement Terminal
            </h1>
            <p className="text-slate-400 font-bold text-[11px]">
              Scan patrak QR codes for verification and dynamic forwarding.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl px-3 sm:px-4 py-2 shadow-sm flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-tight">Secured Terminal</span>
            </div>
            <button onClick={resetScanner} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 shadow-sm transition-all hover:border-rose-100">
              <RefreshCw size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-1.5 px-2">
          {[
            { id: 'camera', label: 'Live Camera', icon: Camera },
            { id: 'upload', label: 'Upload QR Code', icon: Upload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-300'
                  : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 px-2">
            <motion.div variants={itemVariants} className="xl:col-span-4">
              <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-700/50 hover:border-teal-500/30 shadow-[0_0_40px_-15px_rgba(20,184,166,0.15)] relative min-h-[300px] sm:min-h-[340px] flex items-center justify-center transition-all duration-300 group">
                {activeTab === 'camera' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-5">
                    {cameraError ? (
                      <div className="text-center p-6 relative z-20">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <AlertCircle size={24} className="text-rose-400" />
                        </div>
                        <p className="text-white font-black text-[11px] mb-1.5 uppercase tracking-wide">Access Denied</p>
                        <p className="text-slate-400 text-[9px] max-w-[200px] mx-auto mb-5 leading-relaxed">{cameraError}</p>
                        <Button onClick={() => setCameraStarted(false)} className="!bg-rose-500/20 hover:!bg-rose-500/30 !text-rose-400 border border-rose-500/30 !rounded-xl !text-[9px] !py-2 !uppercase tracking-widest font-black transition-all">Retry</Button>
                      </div>
                    ) : (
                      <>
                        <div
                          id={containerIdRef.current}
                          className="[&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full"
                          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: cameraStarted ? 'block' : 'none' }}
                        />
                        {!cameraStarted && (
                          <div className="text-center relative z-20 p-6">
                            <div className="w-14 h-14 bg-slate-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                              <Camera size={24} className="text-teal-400" />
                            </div>
                            <h3 className="text-white font-black text-[13px] tracking-tight mb-2">Scanner Ready</h3>
                            <p className="text-slate-400 text-[9px] max-w-[200px] mx-auto mb-6 leading-relaxed">
                              Position the QR code within the frame.
                            </p>
                            <button
                              onClick={handleStartCamera}
                              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all flex items-center gap-2 mx-auto"
                            >
                              <Play size={14} fill="currentColor" />
                              Start Camera
                            </button>
                          </div>
                        )}
                        {cameraStarted && !cameraReady && (
                          <div className="mt-6 flex flex-col items-center relative z-20 bg-slate-900/60 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                            <Loader2 size={18} className="text-teal-400 animate-spin mb-2" />
                            <p className="text-slate-300 text-[8px] font-black uppercase tracking-widest">Initializing...</p>
                          </div>
                        )}
                        {cameraStarted && cameraReady && (
                          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                            <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]">
                              {/* Dark overlay cutout */}
                              <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] rounded-2xl transition-all duration-500" />
                              
                              {/* Corner Brackets */}
                              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-teal-400 rounded-tl-2xl" />
                              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-teal-400 rounded-tr-2xl" />
                              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-teal-400 rounded-bl-2xl" />
                              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-teal-400 rounded-br-2xl" />
                              
                              {/* Scanning Line Animation */}
                              <motion.div 
                                className="absolute left-0 right-0 h-[1.5px] bg-teal-400 shadow-[0_0_12px_2px_rgba(45,212,191,0.6)] z-20"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center relative z-20">
                    <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-700/50">
                      <Upload size={24} className="text-teal-400" />
                    </div>
                    <p className="text-white font-black text-[13px] mb-1.5 tracking-tight">Upload QR Image</p>
                    <p className="text-slate-400 text-[9px] mb-6 max-w-[200px] mx-auto leading-relaxed">Select a high-resolution image of the QR code.</p>
                    <label className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-slate-900/20">
                      Browse Files
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 shadow-xl shadow-slate-950/50">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-teal-400 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(45,212,191,0.8)]' : 'bg-slate-500'}`} />
                      <span className="text-[7.5px] font-black text-slate-200 uppercase tracking-widest">
                        {cameraReady ? 'Active' : 'Standby'}
                      </span>
                    </div>
                    <div className="w-px h-2.5 bg-white/10" />
                    <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeTab === 'camera' ? 'Live Feed' : 'File Mode'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="xl:col-span-8">
              <Card className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm h-full min-h-[420px]">
                <AnimatePresence mode="wait">
                  {!scannedData && !result ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-12"
                    >
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
                        <Search size={24} className="text-slate-300" />
                      </div>
                      <p className="text-slate-800 font-black text-[13px] tracking-tight mb-1">Awaiting Scanner Input</p>
                      <p className="text-slate-400 font-bold text-[11px] max-w-[220px]">Scan a QR code to reveal patrak details and forward.</p>
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center py-8"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-20 h-20 ${result.success ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-rose-50'} rounded-[2rem] flex items-center justify-center mb-6`}
                      >
                        {result.success ? (
                          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
                            <CheckCircle size={40} className="text-emerald-500" />
                          </motion.div>
                        ) : (
                          <AlertCircle size={40} className="text-rose-500" />
                        )}
                      </motion.div>
                      <h3 className={`text-lg font-black tracking-tight mb-2 ${result.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {result.success ? 'Patrak Successfully Forwarded' : 'Operation Failed'}
                      </h3>
                      <p className="text-slate-500 font-bold text-[11px] mt-2 mb-6 leading-relaxed max-w-xs">{result.message}</p>
                      {result.movement && (
                        <div className="bg-slate-50 rounded-2xl px-6 py-4 mb-8 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Movement Trail</p>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg">{result.movement.from}</span>
                            <ArrowRight size={16} className="text-emerald-500" />
                            <span className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg">{result.movement.to}</span>
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={resetScanner} 
                        className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:bg-slate-700"
                      >
                        Initiate New Scan
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      {verificationComplete ? (
                        <>
                          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center"
                            >
                              <CheckCircle size={20} className="text-emerald-600" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-emerald-600 tracking-tight">QR Verified</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Entry UID: {scannedData.unique_id?.startsWith('PTRK') ? scannedData.unique_id : `#${scannedData.unique_id?.slice(0, 8) || 'N/A'}`}
                              </p>
                              {editHistory.length > 0 && (
                                <p className="text-[9px] font-bold text-violet-500 mt-0.5">
                                  ✏ Last updated by {editHistory[0]?.edited_by_name || 'Unknown'} · {new Date(editHistory[0]?.edited_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>

                          {fetchingDetails ? (
                            <div className="py-12 text-center">
                              <Loader2 size={28} className="text-slate-400 animate-spin mx-auto mb-4" />
                              <p className="text-slate-400 text-[10px] font-bold">Loading patrak details...</p>
                            </div>
                          ) : entryDetails ? (
                            <div className="space-y-4">
                              {/* Patrak Info Card */}
                              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div className="flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</p>
                                    <h4 className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2">{entryDetails.subject}</h4>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getPriorityColor(entryDetails.priority)}`}>
                                      {entryDetails.priority}
                                    </span>
                                    {editHistory.length > 0 && (
                                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-violet-100 text-violet-700 border border-violet-200">
                                        ✏ Updated
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                      <User size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Originator</p>
                                      <p className="text-[10px] font-black text-slate-700 truncate">{entryDetails.sender_name}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                      <Building2 size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
                                      <p className="text-[10px] font-black text-slate-700">{entryDetails.current_department}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 col-span-2">
                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                      <Clock size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Received</p>
                                      <p className="text-[10px] font-black text-slate-700">
                                        {entryDetails.received_date ? new Date(entryDetails.received_date).toLocaleString() : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  {editHistory.length > 0 && (
                                    <div className="flex items-center gap-2 col-span-2 pt-3 mt-1 border-t border-slate-200">
                                      <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                                        <Edit2 size={14} className="text-violet-500" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Last Updated By</p>
                                        <p className="text-[10px] font-black text-violet-700 truncate">
                                          {editHistory[0]?.edited_by_name || 'Unknown'}
                                          <span className="font-medium text-slate-400 ml-1">
                                            · {new Date(editHistory[0]?.edited_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Arrival Actions */}
                              {!arrivalConfirmed ? (
                                <>
                                  <div className="h-px bg-slate-100 my-4" />
                                  <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Clock size={20} className="text-amber-600" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-black text-slate-800 tracking-tight">Pending Arrival</p>
                                        <p className="text-[9px] font-medium text-slate-500">Review details or confirm immediately</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                      <Button
                                        onClick={handleEditDetails}
                                        variant="outline"
                                        className="flex-1 md:flex-none !border-teal-200 !text-teal-700 hover:!bg-teal-50 !font-black !text-[10px] px-5 shadow-sm transition-all"
                                      >
                                        <Edit2 size={14} className="mr-2" />
                                        Edit Details
                                      </Button>
                                      <Button
                                        onClick={handleConfirmArrival}
                                        loading={receiving}
                                        className="flex-1 md:flex-none !bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 !text-white !shadow-lg !shadow-amber-200 !font-black !text-[10px] px-6 transition-all"
                                      >
                                        <CheckCircle size={14} className="mr-2" />
                                        Confirm Arrival
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex gap-3 pt-2">
                                  <Button
                                    variant="ghost"
                                    onClick={resetScanner}
                                    className="!text-slate-400 !font-bold !text-[10px]"
                                  >
                                    <X size={14} className="mr-1.5" />
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => setShowForwardModal(true)}
                                    className="flex-1 !bg-red-600 !text-white !shadow-lg !shadow-red-200 !font-black !text-[10px]"
                                  >
                                    <ArrowLeftRight size={14} className="mr-2" />
                                    Forward to Department
                                  </Button>
                                </div>
                              )}

                              {/* Movement History Timeline */}
                              <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-5">
                                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                                    <History size={16} className="text-indigo-600" />
                                  </div>
                                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Movement History</h3>
                                </div>
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-sm">
                                  {movements.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-[11px] font-bold">No movement history recorded yet.</div>
                                  ) : (
                                    <div className="relative">
                                      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                                      <div className="space-y-5">
                                        {movements.map((m, idx) => {
                                          let statusColor = "bg-blue-100 text-blue-700 border-blue-200"
                                          let dotBg = "bg-blue-500"
                                          let dotRing = "ring-blue-100"
                                          let statusText = "Created"
                                          if (m.from_department && arrivalConfirmed && idx === movements.length - 1) {
                                            statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            dotBg = "bg-emerald-500"
                                            dotRing = "ring-emerald-100"
                                            statusText = "Received"
                                          } else if (m.from_department) {
                                            statusColor = "bg-orange-100 text-orange-700 border-orange-200"
                                            dotBg = "bg-orange-500"
                                            dotRing = "ring-orange-100"
                                            statusText = "Forwarded"
                                          }
                                          return (
                                            <div key={m.id || idx} className="relative flex gap-4">
                                              <div className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full ring-4 ${dotRing} shrink-0 mt-1 ${dotBg}`}>
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                              </div>
                                              <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow mb-1">
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${statusColor}`}>
                                                    {statusText}
                                                  </span>
                                                  <div className="text-right">
                                                    <span className="text-[9px] font-bold text-slate-400 block">
                                                      {new Date(m.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                  <span className="text-[11px] font-black text-slate-700">{m.from_department || 'Entry Created'}</span>
                                                  {m.to_department && (
                                                    <>
                                                      <ArrowRight size={12} className="text-slate-400 shrink-0" />
                                                      <span className="text-[11px] font-black text-slate-700">{m.to_department}</span>
                                                    </>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                  <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                                    <User size={10} className="text-slate-500" />
                                                  </div>
                                                  <span className="text-[10px] font-bold text-slate-500">{m.forwarded_by_name || 'System'}</span>
                                                </div>
                                                {m.remarks && (
                                                  <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border-l-2 border-slate-300">
                                                    <p className="text-[10px] text-slate-500 italic">&ldquo;{m.remarks}&rdquo;</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Edit History Timeline */}
                              <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
                                      <Edit2 size={16} className="text-violet-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Update History</h3>
                                      <p className="text-[9px] font-bold text-slate-400">QR code identity unchanged after each edit</p>
                                    </div>
                                  </div>
                                  {editHistory.length > 0 && (
                                    <span className="text-[9px] font-black text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                      {editHistory.length} edit{editHistory.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                {/* QR Preservation Notice */}
                                <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl">
                                  <span className="text-teal-500 mt-0.5 shrink-0">🔒</span>
                                  <p className="text-[9px] font-bold text-teal-700 leading-relaxed">
                                    Editing patrak details does not regenerate the QR code. The existing QR remains permanently valid for tracking and movement.
                                  </p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-sm">
                                  {editHistory.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-[11px] font-bold">No edits recorded yet.</div>
                                  ) : (
                                    <div className="relative">
                                      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-violet-200 to-transparent" />
                                      <div className="space-y-4">
                                        {editHistory.map((edit, idx) => {
                                          let changedFields = [];
                                          let oldValues = {};
                                          let newValues = {};
                                          try {
                                            changedFields = JSON.parse(edit.changed_fields);
                                            oldValues = JSON.parse(edit.old_values);
                                            newValues = JSON.parse(edit.new_values);
                                          } catch(e) {}

                                          // Human-readable field name map
                                          const fieldLabels = {
                                            subject: 'Subject',
                                            priority: 'Priority',
                                            sender_name: 'Sender Name',
                                            sender_type: 'Sender Type',
                                            sender_designation: 'Designation',
                                            sender_address: 'Address',
                                            sender_email: 'Email',
                                            sender_reference_number: 'Reference No.',
                                            reference_date: 'Reference Date',
                                            received_date: 'Received Date',
                                            unit_district: 'Unit / District',
                                            send_to: 'Organization',
                                            description: 'Description',
                                            fax_number: 'Fax Number',
                                            receiving_mode: 'Receiving Mode',
                                            status: 'Status',
                                          };

                                          const formatValue = (field, val) => {
                                            if (!val || val === 'None') return '—'
                                            if (field.includes('date') && val.includes('T')) {
                                              try { return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return val }
                                            }
                                            return val
                                          }

                                          return (
                                            <motion.div
                                              key={edit.id || idx}
                                              initial={{ opacity: 0, y: 8 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: idx * 0.05 }}
                                              className="relative flex gap-4"
                                            >
                                              <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full ring-4 ring-violet-100 shrink-0 mt-1 bg-violet-500">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                              </div>
                                              <div className="flex-1 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-1 overflow-hidden">
                                                {/* Header */}
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border bg-violet-50 text-violet-700 border-violet-200">
                                                      {changedFields.length} field{changedFields.length > 1 ? 's' : ''} changed
                                                    </span>
                                                  </div>
                                                  <div className="text-right">
                                                    <span className="text-[9px] font-bold text-slate-500 block">
                                                      {new Date(edit.edited_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 block">
                                                      {new Date(edit.edited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                  </div>
                                                </div>
                                                {/* Editor info */}
                                                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50">
                                                  <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                                                    <User size={10} className="text-violet-600" />
                                                  </div>
                                                  <span className="text-[10px] font-black text-slate-700">{edit.edited_by_name || 'System'}</span>
                                                  <span className="text-[9px] text-slate-400">· edited this patrak</span>
                                                </div>
                                                {/* Field diffs */}
                                                <div className="divide-y divide-slate-50">
                                                  {changedFields.map(field => (
                                                    <div key={field} className="px-4 py-3">
                                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                                        {fieldLabels[field] || field.replace(/_/g, ' ')}
                                                      </p>
                                                      <div className="space-y-1.5">
                                                        <div className="flex items-start gap-2">
                                                          <span className="text-[8px] font-black uppercase text-rose-400 shrink-0 mt-0.5 w-7">OLD</span>
                                                          <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 line-through break-all leading-relaxed flex-1">
                                                            {formatValue(field, oldValues[field])}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                          <span className="text-[8px] font-black uppercase text-emerald-500 shrink-0 mt-0.5 w-7">NEW</span>
                                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 break-all leading-relaxed flex-1">
                                                            {formatValue(field, newValues[field])}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                              <p className="text-rose-600 text-[11px] font-bold">Unable to retrieve patrak details. Please try again.</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <motion.div
                            animate={{ scale: [0.8, 1.1, 1] }}
                            transition={{ duration: 0.8 }}
                            className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-[2rem] flex items-center justify-center mb-5"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 size={32} className="text-orange-500" />
                            </motion.div>
                          </motion.div>
                          <p className="text-slate-800 font-black text-[13px] tracking-tight mb-1">Verifying QR Code</p>
                          <p className="text-slate-400 font-bold text-[11px]">Validating patrak identity and retrieving details...</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
      </motion.div>

      {/* Forward Modal - Same as Letters.jsx */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForwardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <ArrowLeftRight size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Forward Patrak</h3>
                    <p className="text-slate-300 text-xs">Select destination department</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/70 hover:text-white" />
                </button>
              </div>
              
              <form onSubmit={handleForward} className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Current Department
                  </label>
                  <div className="px-4 py-3 bg-slate-100 rounded-xl text-sm font-medium text-slate-700">
                    {entryDetails?.current_department}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                    Forward To <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={forwardForm.to_department}
                    onChange={(e) => setForwardForm({ ...forwardForm, to_department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all cursor-pointer"
                  >
                    <option value="">Select destination department</option>
                    {DEPARTMENTS.filter(d => d !== entryDetails?.current_department).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={forwardForm.remarks}
                    onChange={(e) => setForwardForm({ ...forwardForm, remarks: e.target.value })}
                    placeholder="Add any notes or instructions..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowForwardModal(false)}
                    className="flex-1 !text-slate-600 !border !border-slate-300 !bg-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={forwarding}
                    className="flex-1 !bg-red-600 hover:!bg-red-700"
                  >
                    <Send size={16} className="mr-2" />
                    Forward
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <div id="hidden-qr-reader" style={{ display: "none" }}></div>
    </Layout>
  )
}