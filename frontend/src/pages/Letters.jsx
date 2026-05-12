import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'
import { Button } from '../components/common'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { canCreateEntry, canGenerateQR } from '../utils/roleGuard'
import { formatShortDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Eye, 
  QrCode, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  CheckCircle2,
  Calendar as CalendarIcon,
  Mail,
  Printer,
  Building2,
  UserRound,
  Activity,
  Copy,
  X,
  MapPin,
  Send,
  Sparkles,
  Clock,
  ArrowRight,
  LayoutGrid
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
  const detailsRef = useRef(null)
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showEntryDetails, setShowEntryDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, pages: 0 })
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
    unit_district: '',
    send_to: '',
  })
  const [creating, setCreating] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    fetchEntries()
  }, [debouncedSearch, pagination.page])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: debouncedSearch || undefined,
      }

      const res = await api.get('/api/entries', { params })
      const items = res.data.items || []
      setEntries(items)
      
      if (!selectedEntry && items.length > 0) {
        setSelectedEntry(items[0])
      } else if (selectedEntry) {
        const updated = items.find(item => item.id === selectedEntry.id)
        if (!updated) setSelectedEntry(items[0] || null)
      }
      
      setPagination({
        page: res.data.page,
        per_page: res.data.per_page,
        total: res.data.total,
        pages: res.data.pages,
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
      
      const createdEntry = res.data?.entry || res.data
      if (createdEntry?.id) {
        setSelectedEntry(createdEntry)
        setShowEntryDetails(true)
        setTimeout(() => {
          detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 400)
      }
      
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
        unit_district: '',
        send_to: '',
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
        className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-10"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Letters & Patrak
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track all correspondence entries
          </p>
        </motion.div>

        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="space-y-6">
          
          {/* Form + Details Row */}
          <div className={`grid transition-all duration-300 ease-in-out ${
            showEntryDetails 
              ? 'lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]' 
              : 'grid-cols-1'
          } gap-6 items-start`}>
            
            {/* New Tapal Entry Form */}
            <motion.div
              layout
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Form Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 sm:px-6 py-4 flex items-center gap-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileText size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-semibold">New Tapal Entry</h2>
                  <p className="text-slate-300 text-xs">Fill in the details below to create a new entry</p>
                </div>
              </div>
              
              <form onSubmit={handleCreateEntry} className="p-5 sm:p-6 space-y-5">
                {/* Receiving Mode Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Receiving Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Physical', label: 'Physical', icon: QrCode, desc: 'Paper' },
                      { id: 'Mails', label: 'Email', icon: Mail, desc: 'Digital' },
                      { id: 'Fax', label: 'Fax', icon: Printer, desc: 'Fax Line' }
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = createForm.receiving_mode === mode.id;
                      return (
                        <button
                          type="button"
                          key={mode.id}
                          onClick={() => setCreateForm({ ...createForm, receiving_mode: mode.id })}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                            isSelected
                              ? 'border-red-500 bg-red-50 text-red-600'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <div className="text-center">
                            <span className="text-sm font-semibold block">{mode.label}</span>
                            <span className="text-xs text-slate-400">{mode.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dynamic Mode Inputs */}
                <AnimatePresence>
                  {createForm.receiving_mode === 'Mails' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Email <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="email"
                        value={createForm.sender_email}
                        onChange={(e) => setCreateForm({ ...createForm, sender_email: e.target.value })}
                        placeholder="sender@government.gov.in"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                      />
                    </motion.div>
                  )}

                  {createForm.receiving_mode === 'Fax' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fax Number <span className="text-red-500">*</span></label>
                      <input
                        required
                        value={createForm.fax_number}
                        onChange={(e) => setCreateForm({ ...createForm, fax_number: e.target.value })}
                        placeholder="+91 (79) 2325-XXXX"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unit/District and Send To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <MapPin size={14} />
                      Unit / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={createForm.unit_district}
                      onChange={(e) => setCreateForm({ ...createForm, unit_district: e.target.value })}
                      placeholder="Enter unit or district"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <Send size={14} />
                      Send To <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={createForm.send_to}
                      onChange={(e) => setCreateForm({ ...createForm, send_to: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all cursor-pointer"
                    >
                      <option value="">Select destination</option>
                      <option value="DG office">DG Office</option>
                      <option value="uploaded-sarkar">Uploaded-Sarkar</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    placeholder="Brief subject of the patrak..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Sender Name and Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={createForm.sender_name}
                      onChange={(e) => setCreateForm({ ...createForm, sender_name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Designation</label>
                    <input
                      value={createForm.sender_designation}
                      onChange={(e) => setCreateForm({ ...createForm, sender_designation: e.target.value })}
                      placeholder="e.g. DySP, Inspector"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Date and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Received Date <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="date"
                      value={createForm.received_date}
                      onChange={(e) => setCreateForm({ ...createForm, received_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all cursor-pointer"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Confidential">Confidential</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description (Optional)</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Additional notes or context..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setShowEntryDetails(false)
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
                        unit_district: '',
                        send_to: '',
                      })
                    }} 
                    className="sm:w-auto !text-slate-600 !border !border-slate-300 !bg-white hover:!bg-slate-50"
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={creating} 
                    className="flex-1 sm:flex-none sm:min-w-[200px] !bg-red-600 hover:!bg-red-700 shadow-sm"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Create Entry
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Selected Tapal Details Panel */}
            <AnimatePresence>
              {showEntryDetails && selectedEntry && (
                <motion.div
                  ref={detailsRef}
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden lg:sticky lg:top-6"
                >
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <UserRound size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">Selected Entry Details</h3>
                      <p className="text-slate-300 text-xs">View and track this entry</p>
                    </div>
                    <button
                      onClick={() => setShowEntryDetails(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X size={18} className="text-white/70 hover:text-white" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Patrak ID Card */}
                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Patrak ID</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{selectedEntry.unique_id}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(selectedEntry.unique_id || '')}
                        className="p-2 bg-white rounded-lg shadow-sm text-slate-500 hover:text-red-600 transition-colors"
                        title="Copy ID"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    {/* Subject */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subject</p>
                      <p className="text-base font-semibold text-slate-800 mt-1">{selectedEntry.subject}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Sender', value: selectedEntry.sender_name, icon: UserRound },
                        { label: 'Designation', value: selectedEntry.sender_designation || 'Officer', icon: FileText },
                        { label: 'Department', value: selectedEntry.current_department || 'Pending', icon: Building2 },
                        { label: 'Status', value: selectedEntry.status || 'Active', icon: Activity },
                        { label: 'Date', value: formatShortDate(selectedEntry.received_date), icon: CalendarIcon },
                        { label: 'Priority', value: selectedEntry.priority, icon: Clock },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                            <item.icon size={12} />
                            {item.label}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{item.value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedEntry.description || 'No additional description provided.'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      {canGenerateQR(user?.role) && (
                        <Button onClick={() => handleGenerateQR(selectedEntry.id)} className="w-full !bg-emerald-600 hover:!bg-emerald-700">
                          <QrCode size={16} className="mr-2" />
                          Generate QR Code
                        </Button>
                      )}
                      <Button 
                        onClick={() => navigate(`/track-my-tapal?id=${encodeURIComponent(selectedEntry.unique_id || '')}`)} 
                        className="w-full"
                      >
                        Track Entry
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tapal List Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <LayoutGrid size={18} className="text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Tapal List</h2>
                  <p className="text-xs text-slate-500">Showing {entries.length} of {pagination.total} records</p>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all w-full sm:w-64"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-400">Loading entries...</div>
              ) : entries.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">No entries found.</div>
              ) : (
                entries.map((entry, index) => {
                  const isSelected = selectedEntry?.id === entry.id
                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => {
                        setSelectedEntry(entry)
                        setShowEntryDetails(true)
                      }}
                      className={`w-full text-left px-5 py-4 transition-all hover:bg-slate-50 ${
                        isSelected && showEntryDetails ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-red-600">
                              {entry.unique_id || `#${entry.id}`}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              entry.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' :
                              entry.priority === 'Confidential' ? 'bg-rose-100 text-rose-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {entry.priority}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800 mt-1 truncate">{entry.subject}</h3>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <UserRound size={12} />
                              {entry.sender_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {entry.current_department || 'Pending'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                            entry.receiving_mode === 'Mails' ? 'bg-blue-100 text-blue-700' :
                            entry.receiving_mode === 'Fax' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {entry.receiving_mode || 'Physical'}
                          </span>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatShortDate(entry.received_date)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages || 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  className="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  className="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  )
}
