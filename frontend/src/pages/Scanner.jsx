import { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import { Card, Button } from '../components/common'
import api from '../services/api'
import { forwardPatrak, receivePatrak } from '../api/forwardApi'
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
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { useSearchParams } from 'react-router-dom'

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
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'camera')
  const [cameraStarted, setCameraStarted] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [entryDetails, setEntryDetails] = useState(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [electronicEntries, setElectronicEntries] = useState([])
  const [loadingElectronic, setLoadingElectronic] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false)
  const [receiving, setReceiving] = useState(false)

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
      setTimeout(() => {
        setVerificationComplete(true)
      }, 1500)
    } catch (error) {
      setEntryDetails(null)
    } finally {
      setFetchingDetails(false)
    }
  }

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
      await receivePatrak(entryId)
      toast.success('Document digitally received and logged!')
      fetchElectronicEntries()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to digitally receive document')
    }
  }

  const handleConfirmArrival = async () => {
    if (!entryDetails) return
    setReceiving(true)
    try {
      await receivePatrak(entryDetails.id)
      setArrivalConfirmed(true)
      toast.success('Patrak received at current department!')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm arrival')
    } finally {
      setReceiving(false)
    }
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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to forward patrak')
    } finally {
      setForwarding(false)
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setEntryDetails(null)
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
            { id: 'upload', label: 'Upload Asset', icon: Upload },
            { id: 'electronic', label: 'Electronic Queue', icon: Building2 }
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

        {activeTab !== 'electronic' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 px-2">
            <motion.div variants={itemVariants} className="xl:col-span-5">
              <div className="bg-slate-900 rounded-[1.5rem] overflow-hidden border-[5px] border-slate-800 shadow-2xl relative min-h-[340px] sm:min-h-[420px] flex items-center justify-center">
                {activeTab === 'camera' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-5">
                    {cameraError ? (
                      <div className="text-center">
                        <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle size={28} className="text-rose-400" />
                        </div>
                        <p className="text-white font-black text-[13px] mb-2">Access Denied</p>
                        <p className="text-slate-400 text-[10px] max-w-xs mx-auto mb-6 leading-relaxed">{cameraError}</p>
                        <Button onClick={() => setCameraStarted(false)} className="!bg-rose-500 !rounded-xl !text-[10px] !py-2.5">Retry Connection</Button>
                      </div>
                    ) : (
                      <>
                        <div
                          id={containerIdRef.current}
                          className="rounded-2xl overflow-hidden border-2 border-white/10"
                          style={{ width: '260px', height: '260px', display: cameraStarted ? 'block' : 'none' }}
                        />
                        {!cameraStarted && (
                          <div className="text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/10">
                              <Camera size={28} className="text-slate-400" />
                            </div>
                            <h3 className="text-white font-black text-base tracking-tight mb-2">QR Scanner Ready</h3>
                            <p className="text-slate-500 text-[10px] max-w-xs mx-auto mb-8 leading-relaxed">
                              Position the patrak QR code within the viewport for instant identification.
                            </p>
                            <button
                              onClick={handleStartCamera}
                              className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/50 transition-all flex items-center gap-3 mx-auto"
                            >
                              <Play size={16} fill="currentColor" />
                              Initialize Scanner
                            </button>
                          </div>
                        )}
                        {cameraStarted && !cameraReady && (
                          <div className="mt-6 flex flex-col items-center">
                            <Loader2 size={22} className="text-slate-400 animate-spin mb-3" />
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Warming Up Sensor...</p>
                          </div>
                        )}
                        {cameraStarted && cameraReady && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-[260px] h-[260px] border-2 border-emerald-400/50 rounded-2xl animate-pulse" />
                            </div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center w-full h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-5 border border-white/10">
                      <Upload size={28} className="text-slate-400" />
                    </div>
                    <p className="text-white font-black text-sm mb-2">Upload QR Image</p>
                    <p className="text-slate-500 text-[10px] mb-8 max-w-xs mx-auto">Select a high-resolution image of the QR code for processing.</p>
                    <label className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer">
                      Browse Files
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {cameraReady ? 'Active' : 'Standby'}
                    </span>
                  </div>
                  <div className="text-[9px] font-medium text-slate-500">
                    {activeTab === 'camera' ? 'Live Feed' : 'File Mode'}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="xl:col-span-7">
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
                            <div>
                              <p className="text-[11px] font-black text-emerald-600 tracking-tight">QR Verified</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Entry UID: {scannedData.unique_id?.startsWith('PTRK') ? scannedData.unique_id : `#${scannedData.unique_id?.slice(0, 8) || 'N/A'}`}
                              </p>
                            </div>
                          </div>

                          {fetchingDetails ? (
                            <div className="py-12 text-center">
                              <Loader2 size={28} className="text-slate-400 animate-spin mx-auto mb-4" />
                              <p className="text-slate-400 text-[10px] font-bold">Loading patrak details...</p>
                            </div>
                          ) : entryDetails ? (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div className="flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</p>
                                    <h4 className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2">{entryDetails.subject}</h4>
                                  </div>
                                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getPriorityColor(entryDetails.priority)}`}>
                                    {entryDetails.priority}
                                  </span>
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
                                </div>
                              </div>

                              {!arrivalConfirmed ? (
                                <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                                  <div className="flex items-center gap-3 mb-5">
                                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                                      <Clock size={24} className="text-amber-600" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-[11px] font-black text-amber-800">Confirm Arrival</p>
                                      <p className="text-[9px] font-medium text-amber-600">Verify patrak received at your department</p>
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={handleConfirmArrival}
                                    loading={receiving}
                                    className="!bg-gradient-to-r from-amber-500 to-orange-500 !text-white !shadow-lg !shadow-amber-200 !font-black !text-[10px] px-8"
                                  >
                                    <CheckCircle size={14} className="mr-2" />
                                    Confirm Arrival
                                  </Button>
                                </div>
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
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm mx-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-5 mb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">Digital Transmission Queue</h2>
                  <p className="text-slate-400 font-bold text-[10px]">
                    Incoming Mails & Fax documents awaiting acknowledgement
                  </p>
                </div>
              </div>
              <button 
                onClick={fetchElectronicEntries}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all"
              >
                <RefreshCw size={12} className={loadingElectronic ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {loadingElectronic ? (
              <div className="py-16 text-center">
                <Loader2 size={32} className="text-slate-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Loading queue data...</p>
              </div>
            ) : electronicEntries.length === 0 ? (
              <div className="py-14 text-center max-w-md mx-auto">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Building2 size={24} className="text-slate-300" />
                </div>
                <h3 className="text-slate-700 font-black text-[12px] tracking-tight mb-1">Queue is Clear</h3>
                <p className="text-slate-400 font-bold text-[10px] leading-relaxed">
                  No pending digital documents at this time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-4">Patrak ID</th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Mode</th>
                      <th className="pb-3">Sender</th>
                      <th className="pb-3">Current Dept</th>
                      <th className="pb-3 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {electronicEntries.map((entry) => (
                      <tr key={entry.id} className="text-xs hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3.5 pl-4 font-black text-slate-700 group-hover:text-rose-600 transition-colors">
                          {entry.unique_id || `PTRK/2025/000${entry.id}`}
                        </td>
                        <td className="py-3.5 max-w-[200px]">
                          <div className="font-bold text-slate-700 truncate">{entry.subject}</div>
                          <div className="text-[9px] text-slate-400 font-medium truncate">{entry.description || 'No description'}</div>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider border ${
                            entry.receiving_mode === 'Mails' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-violet-50 text-violet-600 border-violet-100'
                          }`}>
                            {entry.receiving_mode}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-slate-500 text-[11px]">
                          {entry.sender_email || entry.fax_number || 'N/A'}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-1 bg-slate-800 text-white text-[9px] font-black rounded-lg">
                            {entry.current_department}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button 
                            onClick={() => handleReceiveDigitallyDirect(entry.id, entry.current_department)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 ml-auto"
                          >
                            <CheckCircle size={11} />
                            Acknowledge
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