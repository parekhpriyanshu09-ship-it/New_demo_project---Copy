import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'
import { Button, Badge, Input, Modal, Card } from '../components/common'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { canCreateEntry, canGenerateQR, DEPARTMENTS } from '../utils/roleGuard'
import { formatShortDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import { 
  Search, 
  Plus, 
  Eye, 
  QrCode, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileText,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  Mail,
  Printer
} from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

export default function Letters() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedDepartment, setSelectedDepartment] = useState('All')
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, pages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    subject: '',
    sender_name: '',
    sender_designation: '',
    received_date: '',
    priority: 'Normal',
    description: '',
    receiving_mode: 'Physical',
    sender_email: '',
    fax_number: '',
  })
  const [creating, setCreating] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    pending: 0,
    in_transit: 0,
    received: 0
  })

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const q = searchParams.get('search') || ''
    if (q !== debouncedSearch && q !== search) {
      setSearch(q)
    }

    if (searchParams.get('action') === 'new') {
      setShowCreateModal(true)
    }
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, setSearchParams])

  useEffect(() => {
    fetchEntries()
  }, [debouncedSearch, selectedDepartment, pagination.page])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: debouncedSearch || undefined,
        department: selectedDepartment !== 'All' ? selectedDepartment : undefined,
      }

      const res = await api.get('/api/entries', { params })
      setEntries(res.data.items || [])
      setPagination({
        page: res.data.page,
        per_page: res.data.per_page,
        total: res.data.total,
        pages: res.data.pages,
      })

      // Simulated stats for now
      setSummaryStats({
        total: res.data.total || 0,
        pending: Math.floor((res.data.total || 0) * 0.3),
        in_transit: Math.floor((res.data.total || 0) * 0.5),
        received: Math.floor((res.data.total || 0) * 0.2)
      })
    } catch (error) {
      console.error('Failed to fetch entries:', error)
      toast.error('Failed to load entries')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const selectedDate = createForm.received_date;
      const now = new Date();
      const [year, month, day] = selectedDate.split('-');
      const finalDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

      const payload = {
        ...createForm,
        received_date: finalDate.toISOString(),
      }
      await api.post('/api/entries', payload)
      toast.success('Entry created successfully!')
      setShowCreateModal(false)
      setCreateForm({
        subject: '',
        sender_name: '',
        sender_designation: '',
        received_date: '',
        priority: 'Normal',
        description: '',
        receiving_mode: 'Physical',
        sender_email: '',
        fax_number: '',
      })
      fetchEntries()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create entry')
    } finally {
      setCreating(false)
    }
  }

  const handleGenerateQR = async (entryId) => {
    try {
      const res = await api.get(`/api/qr/generate/${entryId}`)
      const link = document.createElement('a')
      link.href = `data:image/png;base64,${res.data.qr_image}`
      link.download = `qr-${entryId}.png`
      link.click()
      toast.success('QR Code downloaded!')
    } catch (error) {
      toast.error('Failed to generate QR code')
    }
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
                Letters &amp; Patrak Directory
             </h1>
             <p className="text-slate-400 font-bold text-[11px]">
                Comprehensive list of all tracked correspondence within the system.
             </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
             <div className="bg-white border border-slate-50 rounded-xl px-3 sm:px-4 py-2 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
                <CalendarIcon size={14} className="text-slate-400" />
                <span className="text-[11px] font-black text-slate-700">All Time</span>
                <ChevronDown size={14} className="text-slate-300" />
             </div>
             {canCreateEntry(user?.role, user?.department) && (
               <Button onClick={() => setShowCreateModal(true)} className="!bg-[#dc2626] hover:!bg-red-700 !rounded-xl shadow-lg shadow-red-100">
                 <Plus size={16} strokeWidth={3} />
                 <span className="text-[11px] font-black uppercase tracking-widest ml-1">New Entry</span>
               </Button>
             )}
          </div>
        </motion.div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
           <StatsCard title="Total Letters" value={summaryStats.total} icon={FileText} delay={0} />
           <StatsCard title="Pending" value={summaryStats.pending} icon={Clock} delay={1} />
           <StatsCard title="In Transit" value={summaryStats.in_transit} icon={ArrowRightLeft} delay={2} />
           <StatsCard title="Delivered" value={summaryStats.received} icon={CheckCircle2} delay={3} />
        </div>

        {/* Filters & Search Row */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-50 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search subject or sender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[12px] font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 flex-1 min-w-0">
            {['All', ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                onClick={() => {
                  setSelectedDepartment(dept)
                  setPagination({ ...pagination, page: 1 })
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedDepartment === dept
                    ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Table Card */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique ID</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sender Details</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-20 text-center text-[11px] font-bold text-slate-400">Syncing with system...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-[11px] font-bold text-slate-400">No records found matching criteria.</td></tr>
                ) : (
                  entries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/letters/${entry.id}`)}
                    >
                      <td className="px-4 py-4 text-[10px] font-bold text-red-600 font-mono">
                        {entry.unique_id.startsWith('PTRK') ? entry.unique_id : `#${entry.unique_id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-[11px] font-black text-slate-800 tracking-tight leading-tight">{entry.subject}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entry.current_department}</span>
                          <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase leading-none border ${
                            entry.receiving_mode === 'Mails' ? 'bg-green-50 text-green-600 border-green-100' :
                            entry.receiving_mode === 'Fax' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {entry.receiving_mode || 'Physical'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[11px] font-bold text-slate-600">{entry.sender_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entry.sender_designation || 'Officer'}</p>
                      </td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-500">
                        {formatShortDate(entry.received_date)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          entry.priority === 'Urgent' ? 'bg-amber-50 text-amber-600' : 
                          entry.priority === 'Confidential' ? 'bg-rose-50 text-rose-600' : 
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                         <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                           entry.status === 'Active' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                         }`}>
                           {entry.status}
                         </span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => navigate(`/letters/${entry.id}`)}
                             className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 shadow-sm transition-all border border-transparent hover:border-slate-100"
                           >
                             <Eye size={14} />
                           </button>
                           {canGenerateQR(user?.role) && (
                             <button
                               onClick={() => handleGenerateQR(entry.id)}
                               className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-600 shadow-sm transition-all border border-transparent hover:border-slate-100"
                             >
                               <QrCode size={14} />
                             </button>
                           )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-50 bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {entries.length} of {pagination.total} records
            </p>
            <div className="flex items-center gap-4">
               <button
                 disabled={pagination.page === 1}
                 onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                 className="p-2 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-400"
               >
                 <ChevronLeft size={16} strokeWidth={3} />
               </button>
               <span className="text-[11px] font-black text-slate-700">
                 Page {pagination.page} / {pagination.pages || 1}
               </span>
               <button
                 disabled={pagination.page >= pagination.pages}
                 onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                 className="p-2 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-400"
               >
                 <ChevronRight size={16} strokeWidth={3} />
               </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Modern Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="New Patrak Entry"
          >
            <form onSubmit={handleCreateEntry} className="space-y-4 pt-2">
              {/* Receiving Mode Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receiving Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Physical', label: 'Physical', icon: QrCode, desc: 'Paper QR' },
                    { id: 'Mails', label: 'Email / Mail', icon: Mail, desc: 'Digital Inbox' },
                    { id: 'Fax', label: 'Fax Letter', icon: Printer, desc: 'Fax Line' }
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = createForm.receiving_mode === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setCreateForm({ ...createForm, receiving_mode: mode.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5 text-center ${
                          isSelected
                            ? 'border-red-600 bg-red-50/20 text-red-600 shadow-md shadow-red-50/30'
                            : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-wider">{mode.label}</span>
                          <span className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">{mode.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Inputs based on Receiving Mode */}
              {createForm.receiving_mode === 'Mails' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Email Address</label>
                  <input
                    required
                    type="email"
                    value={createForm.sender_email}
                    onChange={(e) => setCreateForm({ ...createForm, sender_email: e.target.value })}
                    placeholder="e.g. sender@gujaratpolice.gov.in"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              )}

              {createForm.receiving_mode === 'Fax' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Fax Number</label>
                  <input
                    required
                    value={createForm.fax_number}
                    onChange={(e) => setCreateForm({ ...createForm, fax_number: e.target.value })}
                    placeholder="e.g. +91 (79) 2325-XXXX"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Title</label>
                 <input
                   required
                   value={createForm.subject}
                   onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                   placeholder="Brief subject of the patrak..."
                   className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Name</label>
                  <input
                    required
                    value={createForm.sender_name}
                    onChange={(e) => setCreateForm({ ...createForm, sender_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                  <input
                    value={createForm.sender_designation}
                    onChange={(e) => setCreateForm({ ...createForm, sender_designation: e.target.value })}
                    placeholder="e.g. DySP"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Received Date</label>
                  <input
                    required
                    type="date"
                    value={createForm.received_date}
                    onChange={(e) => setCreateForm({ ...createForm, received_date: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all appearance-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Additional context..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[12px] font-bold text-foreground focus:ring-2 focus:ring-red-100 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1 !text-slate-400 !font-bold">
                  Discard
                </Button>
                <Button type="submit" loading={creating} className="flex-1 !bg-[#dc2626] hover:!bg-red-700 shadow-lg shadow-red-100">
                  <CheckCircle2 size={16} className="mr-2" />
                  Finalize Entry
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </Layout>
  )
}