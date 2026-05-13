import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import api from '../services/api'
import { AlertCircle, BadgeCheck, Camera, CheckCircle2, Clock3, LocateFixed, Loader2, QrCode, Search, Upload, ArrowRight, Building2, UserRound, Calendar, ShieldCheck } from 'lucide-react'

const statusClass = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  created: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
  forwarded: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20',
  received: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
  active: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
  closed: 'bg-purple-500/10 text-purple-300 border-purple-400/20',
  'in transit': 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
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
      <div className="h-2" />
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-blue-950/20 backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-950/70 to-slate-950 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 shadow-lg shadow-blue-950/30">
              <LocateFixed className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Track My Tapal</h1>
              <p className="text-xs font-semibold text-slate-400">Dynamic forwarding-based tracking system</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[390px_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-blue-300" />
                <h2 className="text-sm font-black text-white">Search via Patrak ID</h2>
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
                  className="w-full rounded-xl border border-blue-400/20 bg-slate-950/80 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-300/50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  Fetch Tracking Status
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-4 w-4 text-blue-300" />
                <h2 className="text-sm font-black text-white">Search via QR Code</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 min-h-[280px] flex items-center justify-center overflow-hidden">
                {cameraError ? (
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-300" />
                    <p className="text-xs font-bold text-slate-400">{cameraError}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div id={scannerIdRef.current} className="mx-auto overflow-hidden rounded-2xl" style={{ width: 260, height: 260, display: cameraStarted ? 'block' : 'none' }} />
                    {!cameraStarted && (
                      <>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                          <Camera className="h-7 w-7 text-blue-300" />
                        </div>
                        <p className="mx-auto mb-5 max-w-[240px] text-xs font-semibold leading-5 text-slate-500">
                          Scan the tapal QR code to fetch the same tracking status.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError('')
                    setCameraStarted(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-blue-200 transition hover:bg-blue-500/20"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/[0.1]">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 min-h-[520px]">
            {error ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-300" />
                  <p className="text-sm font-black text-white">{error}</p>
                </div>
              </div>
            ) : !trackingData ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <QrCode className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                  <p className="text-sm font-black text-white">Tracking status will appear here</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Use Patrak ID search or scan QR code.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Patrak Overview</p>
                    <h2 className="mt-1 text-xl font-black text-white">{trackingData?.subject || 'Tracked Tapal'}</h2>
                    <p className="mt-2 text-xs font-bold text-slate-500">{trackingData?.patrak_id || patrakId}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${statusClass[normalizedStatus] || statusClass.pending}`}>
                    {currentStatus}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid gap-3 sm:grid-cols-3 mb-6">
                  {[
                    { label: 'Current Department', value: trackingData?.current_department || 'Pending', icon: Building2 },
                    { label: 'Sender', value: trackingData?.sender_name || 'N/A', icon: UserRound },
                    { label: 'Priority', value: trackingData?.priority || 'Normal', icon: ShieldCheck },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                        <item.icon size={12} />
                        {item.label}
                      </div>
                      <p className="mt-2 truncate text-xs font-black text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Dynamic Movement Timeline */}
                <div>
                  <h3 className="mb-4 text-sm font-black text-white">Movement History</h3>
                  {movements.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                      <Clock3 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-400">No movements recorded yet</p>
                      <p className="mt-1 text-xs text-slate-500">Patrak is awaiting its first forward action</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {movements.map((movement, index) => {
                        const isLast = index === movements.length - 1
                        const status = movement.status?.toLowerCase() || 'forwarded'
                        
                        return (
                          <motion.div
                            key={`${movement.to_department}-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="relative"
                          >
                            <div className="flex gap-4">
                              {/* Timeline indicator */}
                              <div className="flex flex-col items-center">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                                  status === 'received' || status === 'created' 
                                    ? 'border-emerald-400/50 bg-emerald-500/20' 
                                    : status === 'closed'
                                    ? 'border-purple-400/50 bg-purple-500/20'
                                    : 'border-cyan-400/50 bg-cyan-500/20'
                                }`}>
                                  {status === 'received' || status === 'created' ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                  ) : status === 'closed' ? (
                                    <BadgeCheck className="h-5 w-5 text-purple-300" />
                                  ) : (
                                    <ArrowRight className="h-5 w-5 text-cyan-300" />
                                  )}
                                </div>
                                {!isLast && <div className="h-8 w-px bg-gradient-to-b from-cyan-400/30 to-transparent" />}
                              </div>

                              {/* Movement details */}
                              <div className="min-w-0 flex-1 pb-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    {/* From -> To */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {movement.from_department && (
                                        <>
                                          <span className="text-sm font-semibold text-slate-300">{movement.from_department}</span>
                                          <ArrowRight className="h-3 w-3 text-slate-500" />
                                        </>
                                      )}
                                      <span className="text-sm font-black text-white">{movement.to_department}</span>
                                    </div>
                                    
                                    {/* Meta info */}
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <UserRound size={10} />
                                        {movement.forwarded_by || 'System'}
                                      </span>
                                      {movement.timestamp && (
                                        <span className="flex items-center gap-1">
                                          <Calendar size={10} />
                                          {new Date(movement.timestamp).toLocaleString()}
                                        </span>
                                      )}
                                    </div>

                                    {/* Remarks */}
                                    {movement.remarks && (
                                      <p className="mt-2 text-xs text-slate-400 italic bg-white/5 rounded-lg px-3 py-2">
                                        "{movement.remarks}"
                                      </p>
                                    )}
                                  </div>

                                  {/* Status badge */}
                                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    status === 'received' || status === 'created' 
                                      ? 'border-emerald-400/30 text-emerald-300' 
                                      : status === 'closed'
                                      ? 'border-purple-400/30 text-purple-300'
                                      : 'border-cyan-400/30 text-cyan-300'
                                  }`}>
                                    {movement.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
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
