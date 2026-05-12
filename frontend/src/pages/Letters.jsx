import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'
import { Button, Modal } from '../components/common'
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
  ChevronLeft, 
  ChevronRight, 
  FileText,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronDown,
  Mail,
  Printer,
  Building2,
  UserRound,
  Activity,
  Copy
} from 'lucide-react'

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
  const [selectedEntry, setSelectedEntry] = useState(null)
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
      const items = res.data.items || []
      setEntries(items)
      setSelectedEntry(current => {
        if (!items.length) return null
        if (!current) return items[0]
        return items.find(item => item.id === current.id) || items[0]
      })
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
      const res = await api.post('/api/entries', payload)
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
      const createdEntry = res.data?.entry || res.data
      if (createdEntry?.id) {
        setSelectedEntry(createdEntry)
      }
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
                 <span className="text-[11px] font-black uppercase tracking-widest ml-1">New Tapal Entry</span>
               </Button>
             )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-5 items-start">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Tapal List</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Showing {entries.length} of {pagination.total} records</p>
              </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-[680px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="py-20 text-center text-[11px] font-bold text-slate-400">Syncing with system...</div>
              ) : entries.length === 0 ? (
                <div className="py-20 text-center text-[11px] font-bold text-slate-400">No records found matching criteria.</div>
              ) : (
                entries.map((entry, index) => {
                  const isSelected = selectedEntry?.id === entry.id
                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full text-left px-5 py-4 transition-all ${
                        isSelected ? 'bg-red-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-red-600 font-mono">
                            {entry.unique_id?.startsWith('PTRK') ? entry.unique_id : `#${entry.unique_id?.slice(0, 8) || entry.id}`}
                          </p>
                          <h3 className="mt-1 text-[13px] font-black text-slate-800 leading-tight truncate">{entry.subject}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entry.current_department || 'Department Pending'}</span>
                            <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase leading-none border ${
                              entry.receiving_mode === 'Mails' ? 'bg-green-50 text-green-600 border-green-100' :
                              entry.receiving_mode === 'Fax' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {entry.receiving_mode || 'Physical'}
                            </span>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          entry.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' :
                          entry.priority === 'Confidential' ? 'bg-rose-100 text-rose-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {entry.priority}
                        </span>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-50 bg-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {pagination.page} / {pagination.pages || 1}
              </p>
              <div className="flex items-center gap-4">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  className="p-2 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-400"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  className="p-2 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-400"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          <aside className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden xl:sticky xl:top-20">
            {selectedEntry ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Selected Tapal</p>
                    <h2 className="mt-1 text-lg font-black text-slate-800 leading-tight">{selectedEntry.subject}</h2>
                  </div>
                  <button
                    onClick={() => navigate(`/letters/${selectedEntry.id}`)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 transition-all"
                    title="Open full details"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-red-50/60 border border-red-100 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patrak ID</p>
                    <p className="text-[13px] font-black text-red-600 font-mono mt-0.5">{selectedEntry.unique_id}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(selectedEntry.unique_id || '')}
                    className="p-2 rounded-lg bg-white text-red-500 shadow-sm"
                    title="Copy Patrak ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: 'Sender', value: selectedEntry.sender_name, icon: UserRound },
                    { label: 'Designation', value: selectedEntry.sender_designation || 'Officer', icon: FileText },
                    { label: 'Department', value: selectedEntry.current_department || 'Pending', icon: Building2 },
                    { label: 'Status', value: selectedEntry.status || 'Active', icon: Activity },
                    { label: 'Date', value: formatShortDate(selectedEntry.received_date), icon: CalendarIcon },
                    { label: 'Priority', value: selectedEntry.priority, icon: CheckCircle2 },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <item.icon size={12} />
                        {item.label}
                      </div>
                      <p className="mt-2 text-[12px] font-black text-slate-700 truncate">{item.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-[12px] font-bold text-slate-600 leading-5">
                    {selectedEntry.description || 'No additional description added for this tapal.'}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  {canGenerateQR(user?.role) && (
                    <Button type="button" onClick={() => handleGenerateQR(selectedEntry.id)} className="flex-1 !bg-emerald-600 hover:!bg-emerald-700">
                      <QrCode size={15} className="mr-2" />
                      QR Code
                    </Button>
                  )}
                  <Button type="button" onClick={() => navigate(`/track-my-tapal?id=${encodeURIComponent(selectedEntry.unique_id || '')}`)} className="flex-1 !bg-slate-900 hover:!bg-slate-800">
                    Track
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-[11px] font-bold text-slate-400">Select an entry to view details.</div>
            )}
          </aside>
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
