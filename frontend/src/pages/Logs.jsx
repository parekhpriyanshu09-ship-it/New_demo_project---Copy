import { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { canViewAllLogs, DEPARTMENTS } from '../utils/roleGuard'
import {
  ChevronLeft, ChevronRight, Clock, RefreshCw, User as UserIcon, Building2,
  FileText, Scan, Upload, Shield, AlertCircle, FileStack
} from 'lucide-react'

// ─── Live Clock (IST) ────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const date = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const time = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
      <Clock size={18} className="text-red-500" />
      <div className="flex flex-col">
        <span className="font-bold text-sm text-slate-800 leading-tight">{time}</span>
        <span className="text-xs text-slate-500 font-medium leading-tight">{date}</span>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTimeSplit(dateString) {
  if (!dateString) return { date: 'N/A', time: '' }
  const utcString = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z'
  const d = new Date(utcString)

  const dateStr = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const timeStr = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })

  return { date: dateStr, time: timeStr }
}

function PriorityBadge({ priority }) {
  const styles = {
    Urgent: 'bg-orange-50 text-orange-600 border border-orange-200',
    Confidential: 'bg-red-50 text-red-600 border border-red-200',
    Normal: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${styles[priority] || styles.Normal}`}>
      {priority || 'Normal'}
    </span>
  )
}

function MethodBadge({ method }) {
  const isUpload = method === 'upload'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isUpload ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
      {method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown'}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Logs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('All')
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 0 })
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchLogs()
    intervalRef.current = setInterval(fetchLogs, 30000)
    return () => clearInterval(intervalRef.current)
  }, [selectedDepartment, pagination.page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        department: canViewAllLogs(user?.role) && selectedDepartment !== 'All' ? selectedDepartment : undefined,
      }
      const res = await api.get('/api/logs', { params })
      setLogs(res.data.items || [])
      setPagination(prev => ({
        ...prev,
        page: res.data.page,
        total: res.data.total,
        pages: res.data.pages,
      }))
      setLastRefreshed(new Date())
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    clearInterval(intervalRef.current)
    fetchLogs()
    intervalRef.current = setInterval(fetchLogs, 30000)
  }

  // Calculate dynamic stats from current logs
  const stats = {
    total: logs.length,
    camera: logs.filter(l => l.scan_method === 'camera').length,
    upload: logs.filter(l => l.scan_method === 'upload').length,
    confidential: logs.filter(l => l.entry_priority === 'Confidential').length,
    urgent: logs.filter(l => l.entry_priority === 'Urgent').length
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto pb-10 pt-2 px-2 sm:px-6">

        {/* ─── Header ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
          <div>
            <h1 className="font-heading font-bold text-2xl text-slate-800 tracking-tight">System Logs</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 text-xs font-medium">Complete record of all patrak scan activities.</p>
              <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                (Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LiveClock />
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Department Filter ─── */}
        {canViewAllLogs(user?.role) && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {['All', ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                onClick={() => {
                  setSelectedDepartment(dept)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedDepartment === dept
                    ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-md shadow-red-200'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

        {/* ─── Dynamic Stats Cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <FileStack size={20} className="text-[#dc2626]" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-tight">{stats.total}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Logs</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Scan size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-tight">{stats.camera}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Camera Scans</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Upload size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-tight">{stats.upload}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Upload Scans</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-tight">{stats.confidential}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Confidential</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-tight">{stats.urgent}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Urgent</p>
            </div>
          </div>
        </div>

        {/* ─── Logs Table ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Entry Details</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Priority</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Department Scanned</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Received By</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Date &amp; Time</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Method</th>
                  <th className="text-left px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-3 py-3 text-xs">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-bold">No logs found</p>
                      <p className="text-slate-400 text-xs mt-1">Logs will appear here after QR codes are scanned</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const { date, time } = formatDateTimeSplit(log.received_at)
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Log # */}
                        <td className="px-3 py-3 text-xs text-xs font-bold text-slate-400">
                          #{log.id}
                        </td>

                        {/* Entry Details */}
                        <td className="px-3 py-3 text-xs max-w-[160px]">
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={log.entry_subject}>
                              {log.entry_subject || 'Unknown Subject'}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                              {log.entry_sender}
                              {log.entry_sender_designation && ` - ${log.entry_sender_designation}`}
                            </p>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3 text-xs">
                          <PriorityBadge priority={log.entry_priority} />
                        </td>

                        {/* Department Scanned At */}
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-700">{log.department_name}</span>
                          </div>
                        </td>

                        {/* Received By */}
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center shrink-0 border border-red-100">
                              <UserIcon size={12} className="text-red-500" />
                            </div>
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-slate-700 leading-tight">
                                {log.received_by_username}
                              </p>
                              <p className="text-xs font-medium text-slate-400 capitalize mt-0.5">
                                {log.received_by_role === 'department_user' ? 'Department User' : log.received_by_role}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400 shrink-0" />
                            <div className="flex flex-col">
                              <p className="text-xs font-medium text-slate-700">{date}</p>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">{time}</p>
                            </div>
                          </div>
                        </td>

                        {/* Scan Method */}
                        <td className="px-3 py-3 text-xs">
                          <MethodBadge method={log.scan_method} />
                        </td>

                        {/* Remarks */}
                        <td className="px-3 py-3 text-xs">
                          {log.remarks ? (
                            <p className="text-xs font-medium text-slate-500 truncate max-w-[100px]" title={log.remarks}>
                              {log.remarks}
                            </p>
                          ) : (
                            <span className="text-xs font-medium text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
            <p className="text-xs font-medium text-slate-500">
              Showing <span className="font-bold text-slate-700">{logs.length}</span> of{' '}
              <span className="font-bold text-slate-700">{pagination.total}</span> logs
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft size={14} className="text-slate-600" />
              </button>
              <span className="text-xs font-bold text-slate-600 px-1">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}