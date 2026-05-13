import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import api from '../services/api'
import { AlertCircle, BadgeCheck, Camera, CheckCircle2, Clock3, LocateFixed, Loader2, QrCode, Search, Upload, ArrowRight, Building2, UserRound, Calendar as CalendarIcon, ShieldCheck, MapPin, FileText, User, Clock } from 'lucide-react'

const statusClass = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  created: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  forwarded: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  received: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  active: 'bg-blue-50 text-blue-600 border-blue-100',
  closed: 'bg-purple-50 text-purple-600 border-purple-100',
  'in transit': 'bg-red-50 text-red-600 border-red-100',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
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
  } catch {
    // Plain text QR values are valid too.
  }

  return normalized
}

function formatTime(dateStr) {
  if (!dateStr) return '--:--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return '--:--' }
}

function formatDate(dateStr) {
  if (!dateStr) return '--/--/----'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '--/--/----' }
}

export default function TrackMyTapal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [patrakId, setPatrakId] = useState(searchParams.get('id') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trackingData, setTrackingData] = useState(null)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef(null)
  const scannerStartedRef = useRef(false)
  const scannerIdRef = useRef(`track-qr-reader-${Date.now()}`)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setPatrakId(id)
      fetchTracking(id)
    }
  }, [])

  useEffect(() => {
    return () => stopScanner()
  }, [])

  useEffect(() => {
    if (!cameraStarted || scannerStartedRef.current) return

    let cancelled = false
    async function startScanner() {
      try {
        const scanner = new Html5Qrcode(scannerIdRef.current)
        scannerRef.current = scanner
        scannerStartedRef.current = true
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decodedText) => {
            if (cancelled) return
            const id = parseQrValue(decodedText)
            stopScanner()
            setPatrakId(id)
            fetchTracking(id)
            toast.success('QR code scanned')
          },
          () => {}
        )
      } catch (err) {
        console.error('Track QR scanner failed:', err)
        scannerStartedRef.current = false
        setCameraStarted(false)
        setCameraError('Camera not available. Upload a QR image instead.')
      }
    }

    startScanner()
    return () => { cancelled = true }
  }, [cameraStarted])

  const stopScanner = () => {
    setCameraStarted(false)
    scannerStartedRef.current = false
    if (scannerRef.current) {
      const scanner = scannerRef.current
      scannerRef.current = null
      try {
        scanner.stop().catch(() => {}).finally(() => {
          try { scanner.clear() } catch {}
        })
      } catch {}
    }
  }

  const fetchTracking = async (idToFetch = patrakId) => {
    const id = String(idToFetch || '').trim()
    if (!id) {
      setError('Enter a valid Patrak ID or scan a QR code.')
      return
    }

    setLoading(true)
    setError('')
    setTrackingData(null)
    setSearchParams({ id })

    try {
      const response = await api.get(`/api/track/${encodeURIComponent(id)}`)
      setTrackingData(response.data)
    } catch (err) {
      console.error('Tracking lookup failed:', err)
      setError('Tracking status not found for this Patrak ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const scanner = new Html5Qrcode('track-hidden-qr-reader')
      const decodedText = await scanner.scanFile(file, true)
      try { scanner.clear() } catch {}
      const id = parseQrValue(decodedText)
      setPatrakId(id)
      fetchTracking(id)
    } catch (err) {
      console.error('Track QR upload failed:', err)
      toast.error('Could not read QR code from image')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const movements = trackingData?.movements || []
  const currentStatus = (trackingData?.current_status || 'Pending').toString()
  const normalizedStatus = currentStatus.toLowerCase()

  return (
    <Layout>
      <div className="max-w-[1300px] mx-auto pb-10 pt-4 px-4 bg-[#f8fafc] min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-0 sm:border-b-2 sm:border-[#b71c1c] pb-2 sm:pb-3 mb-6 gap-4 sm:gap-0">
           <div className="flex items-center gap-3 order-1">
             <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shadow-sm shrink-0">
               <LocateFixed size={20} className="text-[#b71c1c]" />
             </div>
             <h1 className="text-xl sm:text-2xl font-bold text-[#b71c1c] tracking-tight mt-2 sm:mt-0">
                Track My Tapal
             </h1>
           </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr] items-start">
          {/* Left Column: Search & Camera */}
          <div className="space-y-6">
            {/* Search Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-[#b71c1c]" />
                <h2 className="text-sm font-bold text-slate-800">Search via Patrak ID</h2>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  fetchTracking()
                }}
                className="space-y-3"
              >
                <input
                  value={patrakId}
                  onChange={(event) => setPatrakId(event.target.value)}
                  placeholder="Enter unique Patrak ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#b71c1c] focus:ring-1 focus:ring-[#b71c1c]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b71c1c] px-4 py-3 text-[12px] font-bold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  Fetch Tracking Status
                </button>
              </form>
            </div>

            {/* QR Code Scanner Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-4 w-4 text-[#b71c1c]" />
                <h2 className="text-sm font-bold text-slate-800">Search via QR Code</h2>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[260px] flex items-center justify-center overflow-hidden">
                {cameraError ? (
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
                    <p className="text-xs font-bold text-slate-500">{cameraError}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div id={scannerIdRef.current} className="mx-auto overflow-hidden rounded-xl" style={{ width: 240, height: 240, display: cameraStarted ? 'block' : 'none' }} />
                    {!cameraStarted && (
                      <>
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-red-100 bg-red-50">
                          <Camera className="h-6 w-6 text-[#b71c1c]" />
                        </div>
                        <p className="mx-auto mb-5 max-w-[200px] text-xs font-medium leading-5 text-slate-500">
                          Scan the tapal QR code to fetch the tracking status.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError('')
                    setCameraStarted(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-[#b71c1c] transition hover:bg-red-100"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Tracking Result UI */}
          <div className="space-y-6">
            {error ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm min-h-[400px]">
                <AlertCircle className="mb-3 h-12 w-12 text-amber-500" />
                <p className="text-base font-bold text-slate-800">{error}</p>
                <p className="mt-2 text-sm text-slate-500">Please check the ID and try again.</p>
              </div>
            ) : !trackingData ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 mx-auto">
                  <QrCode className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-800">Tracking status will appear here</p>
                <p className="mt-2 text-sm text-slate-500">Use Patrak ID search or scan QR code.</p>
              </div>
            ) : (
              <>
                {/* Top Summary Card */}
                <div className="bg-white border border-slate-100 sm:border-slate-200 rounded-xl sm:rounded-lg p-5 shadow-sm">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                      <div className="flex gap-4 items-center">
                         <div className="w-16 h-16 bg-[#b71c1c] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <FileText size={28} className="text-white" />
                         </div>
                         <div className="sm:hidden flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-xs text-slate-500 font-medium">Current Status</p>
                               <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusClass[normalizedStatus] || 'bg-slate-100 text-slate-600'}`}>
                                  {currentStatus === 'Active' ? 'In Transit' : currentStatus}
                               </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">At {trackingData.current_department}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-2 sm:mt-0 sm:flex-1 sm:grid-cols-5 sm:items-center border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                         <div className="hidden sm:block">
                            <p className="text-xs text-slate-400 font-bold mb-1">Patrak ID</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{trackingData.patrak_id}</p>
                         </div>
                         <div className="hidden sm:block">
                            <p className="text-xs text-slate-400 font-bold mb-1">Subject</p>
                            <p className="text-sm font-bold text-slate-800 max-w-[180px] truncate" title={trackingData.subject}>{trackingData.subject}</p>
                         </div>
                         <div className="hidden sm:block">
                            <p className="text-xs text-slate-400 font-bold mb-1">Current Status</p>
                            <div className="flex flex-col items-start gap-1">
                               <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusClass[normalizedStatus] || 'bg-slate-100 text-slate-600'}`}>
                                  {currentStatus === 'Active' ? 'In Transit' : currentStatus}
                               </span>
                               <p className="text-[11px] font-bold text-slate-800">At {trackingData.current_department}</p>
                            </div>
                         </div>
                         
                         <div className="flex flex-col gap-1">
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold">Priority</p>
                            <div>
                               <span className="px-3 py-1 bg-[#b71c1c] text-white text-[10px] font-bold rounded shadow-sm">
                                  {trackingData.priority.toUpperCase()}
                               </span>
                            </div>
                         </div>
                         <div className="flex flex-col gap-1">
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold">Total Movements</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{trackingData.total_movements} Movements</p>
                         </div>
                      </div>
                   </div>
                   
                   {/* From and To Section */}
                   <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 -mx-5 -mb-5 px-5 py-4 rounded-b-xl sm:rounded-b-lg border-t-slate-100">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                              <User size={14} className="text-slate-500" />
                          </div>
                          <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">From (Sender)</p>
                              <p className="text-xs font-bold text-slate-800">{trackingData.sender_name} <span className="text-slate-500 font-medium">({trackingData.sender_designation || 'Origin'})</span></p>
                          </div>
                      </div>
                      
                      <div className="hidden sm:flex flex-1 items-center justify-center px-4 max-w-[200px]">
                          <div className="h-[2px] w-full bg-slate-200 relative">
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-400 transform rotate-45"></div>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-200 sm:border-0 sm:justify-end">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm shrink-0 sm:order-2">
                              <MapPin size={14} className="text-[#b71c1c]" />
                          </div>
                          <div className="text-left sm:text-right sm:order-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Current Department</p>
                              <p className="text-xs font-bold text-slate-800">{trackingData.current_department}</p>
                          </div>
                      </div>
                   </div>
                </div>

                {/* Timeline Area */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-6">Current Department History</h3>
                  
                  {movements.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center">
                      <Clock size={32} className="mx-auto mb-3 text-slate-400" />
                      <p className="text-sm font-bold text-slate-600">No movements recorded yet</p>
                      <p className="mt-1 text-xs text-slate-500">Patrak is awaiting its first forward action</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {movements
                         .filter(m => m.to_department === trackingData.current_department)
                         .map((movement, index) => {
                            const mStatus = movement.status?.toLowerCase() || 'forwarded';

                            return (
                              <div key={`${movement.to_department}-${index}`} className="flex items-start sm:items-center gap-4 sm:gap-6 relative">
                                 {/* Icon Wrapper */}
                                 <div className="w-10 flex justify-center shrink-0 mt-2 sm:mt-0 relative z-10">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white bg-[#b71c1c] text-white">
                                       <MapPin size={16} />
                                    </div>
                                 </div>

                                 {/* History Card */}
                                 <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-red-50/40 border-red-100">
                                    <div className="w-full">
                                       <div className="flex items-center justify-between sm:justify-start gap-3 mb-2 w-full">
                                          <h4 className="text-sm font-bold text-slate-800">
                                            {movement.to_department}
                                          </h4>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                             mStatus === 'received' || mStatus === 'created' ? 'bg-emerald-50 text-emerald-600' : 
                                             mStatus === 'closed' ? 'bg-purple-50 text-purple-600' : 
                                             'bg-red-50 text-red-600'
                                          }`}>
                                             {movement.status}
                                          </span>
                                       </div>
                                       
                                       <p className="text-[13px] text-slate-500 mb-2 sm:mb-0">
                                          Arrived from: <span className="font-semibold text-slate-700">{movement.from_department || 'Origin'}</span>
                                       </p>
                                       <p className="text-[13px] text-slate-500 mb-2 sm:mb-0 mt-1">
                                          Forwarded by: <span className="font-semibold text-slate-700">{movement.forwarded_by || 'System'}</span>
                                       </p>
                                       
                                       {movement.remarks && (
                                         <p className="text-[12px] text-slate-600 italic bg-white p-2.5 rounded border border-red-50 mt-3">"{movement.remarks}"</p>
                                       )}

                                       <div className="flex sm:hidden items-center gap-1.5 text-slate-400 mt-3">
                                          <CalendarIcon size={12} />
                                          <p className="text-[11px] font-medium">
                                             {movement.timestamp ? `${formatDate(movement.timestamp)}, ${formatTime(movement.timestamp)}` : '--/--/----'}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="hidden sm:block text-right shrink-0">
                                       <p className="text-[13px] text-slate-600 font-bold">
                                          {movement.timestamp ? formatDate(movement.timestamp) : '--'}
                                       </p>
                                       <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                                          {movement.timestamp ? formatTime(movement.timestamp) : '--:-- --'}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                            )
                         })}
                       
                       {movements.filter(m => m.to_department === trackingData.current_department).length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-sm font-medium text-slate-500">No specific history records for the current department yet.</p>
                          </div>
                       )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div id="track-hidden-qr-reader" className="hidden" />
    </Layout>
  )
}
