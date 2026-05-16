import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { useNavigate, useLocation } from 'react-router-dom'
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
  Clock,
  ArrowRight,
  ArrowLeftRight,
  History,
  ChevronDown
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


const formSchema = z.object({
  receiving_mode: z.enum(['By Hand', 'Mails', 'Post', 'Fax']),
  sender_email: z.string().email('Invalid email').optional().or(z.literal('')),
  fax_number: z.string().optional().or(z.literal('')),
  sender_type: z.string().min(1, 'Sender Type is required'),
  sender_name: z.string().optional().or(z.literal('')),
  sender_address: z.string().optional().or(z.literal('')),
  unit_district: z.string().min(1, 'Unit/District is required'),
  send_to: z.string().optional().or(z.literal('')),
  sender_designation: z.string().optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required'),
  received_date: z.string().min(1, 'Received Date is required'),
  priority: z.string().min(1, 'Priority is required'),
  sender_reference_number: z.string().optional().or(z.literal('')),
  reference_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal(''))
}).refine(data => {
  if (data.sender_type !== 'Citizen' && (!data.send_to || data.send_to.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Organization is required",
  path: ["send_to"]
})

const DEPARTMENTS = [
  "DG Office",
  "CID Crime",
  "Law & Order",
  "Training",
  "TS & SCRB",
  "SP Office",
  "Control Room",
  "HQ"
]

export default function Letters() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const detailsRef = useRef(null)
  const [editMode, setEditMode] = useState(false)
  const [editEntryId, setEditEntryId] = useState(null)
  const [lastModified, setLastModified] = useState(null)
  const [patrakUniqueId, setPatrakUniqueId] = useState(null)
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showEntryDetails, setShowEntryDetails] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, pages: 0 })
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiving_mode: 'By Hand',
      sender_email: '',
      fax_number: '',
      sender_type: 'Citizen',
      sender_name: '',
      sender_address: '',
      unit_district: '',
      send_to: '',
      sender_designation: '',
      subject: '',
      received_date: '',
      priority: 'Normal',
      sender_reference_number: '',
      reference_date: '',
      description: ''
    }
  })
  const receiving_mode_watch = form.watch('receiving_mode')
  const senderTypeWatch = form.watch('sender_type')

  useEffect(() => {
    if (senderTypeWatch === 'Citizen') {
      form.setValue('send_to', '')
      form.setValue('sender_designation', '')
      form.clearErrors(['send_to', 'sender_designation'])
    }
  }, [senderTypeWatch, form])

  const [creating, setCreating] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    fetchEntries()
  }, [debouncedSearch, pagination.page])

  useEffect(() => {
    if (location.state?.editMode && location.state?.patrakData) {
      const data = location.state.patrakData
      setEditMode(true)
      setEditEntryId(data.id)
      setLastModified(data.updated_at)
      setPatrakUniqueId(data.unique_id)

      const rDate = data.received_date ? new Date(data.received_date).toISOString().split('T')[0] : ''
      const refDate = data.reference_date ? new Date(data.reference_date).toISOString().split('T')[0] : ''

      form.reset({
        receiving_mode: data.receiving_mode || 'By Hand',
        sender_email: data.sender_email || '',
        fax_number: data.fax_number || '',
        sender_type: data.sender_type || 'Citizen',
        sender_name: data.sender_name || '',
        sender_address: data.sender_address || '',
        unit_district: data.unit_district || '',
        send_to: data.send_to || '',
        sender_designation: data.sender_designation || '',
        subject: data.subject || '',
        received_date: rDate,
        priority: data.priority || 'Normal',
        sender_reference_number: data.sender_reference_number || '',
        reference_date: refDate,
        description: data.description || ''
      })
    }
  }, [location.state, form])

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
        // Do not auto-open details on load to maintain full-width form
      } else if (selectedEntry) {
        const updated = items.find(item => item.id === selectedEntry.id)
        if (!updated) {
          setSelectedEntry(items[0] || null)
          if (items.length === 0) setShowEntryDetails(false)
        }
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

  // ── Blank default values — used to fully reset the form ──────────────
  const BLANK_DEFAULTS = {
    receiving_mode: 'By Hand',
    sender_email: '',
    fax_number: '',
    sender_type: 'Citizen',
    sender_name: '',
    sender_address: '',
    unit_district: '',
    send_to: '',
    sender_designation: '',
    subject: '',
    received_date: '',
    priority: 'Normal',
    sender_reference_number: '',
    reference_date: '',
    description: ''
  }

  const clearEditState = () => {
    setEditMode(false)
    setEditEntryId(null)
    setLastModified(null)
    setPatrakUniqueId(null)
    setSelectedEntry(null)
    setShowEntryDetails(false)
    form.reset(BLANK_DEFAULTS)
  }

  const handleCreateEntry = async (data) => {
    setCreating(true)
    // Capture BEFORE any async state changes (avoids stale-closure bugs)
    const wasEditMode = editMode
    const wasEditEntryId = editEntryId

    try {
      const selectedDate = data.received_date;
      const now = new Date();
      const [year, month, day] = selectedDate.split('-');
      const finalDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

      let finalRefDate = null;
      if (data.reference_date) {
        const [ry, rm, rd] = data.reference_date.split('-');
        finalRefDate = new Date(ry, rm - 1, rd, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
      }

      const payload = {
        ...data,
        received_date: finalDate.toISOString(),
        reference_date: finalRefDate || undefined
      }

      let res;
      if (wasEditMode && wasEditEntryId) {
        res = await api.put(`/api/entries/${wasEditEntryId}`, payload)

        // ── Fully reset form and UI back to Create mode ────────────────
        clearEditState()
        // Replace history entry so browser-back doesn't re-trigger edit mode
        navigate('/letters', { replace: true, state: {} })

        toast.success(
          '✅ Patrak updated successfully\nQR code remains unchanged and valid.',
          { duration: 5000 }
        )
      } else {
        res = await api.post('/api/entries', payload)
        toast.success('Entry created successfully!')

        const createdEntry = res.data?.entry || res.data
        if (createdEntry?.id) {
          setSelectedEntry(createdEntry)
          setShowEntryDetails(true)
          setTimeout(() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 400)
        }
        form.reset(BLANK_DEFAULTS)
      }

      fetchEntries()
    } catch (error) {
      toast.error(error.response?.data?.detail || (wasEditMode ? 'Failed to update entry' : 'Failed to create entry'))
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
          <div className={`grid gap-6 items-start transition-all duration-500 ease-in-out ${showEntryDetails
            ? 'lg:grid-cols-[2fr_1fr]'
            : 'grid-cols-1'
            }`}>

            {/* New Tapal Entry Form */}
            <motion.div
              layout
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Form Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 sm:px-6 py-4 flex items-center gap-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  {editMode ? <History size={20} className="text-emerald-400" /> : <FileText size={20} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-semibold">
                      {editMode ? 'Edit Patrak Entry' : 'New Tapal Entry'}
                    </h2>
                    {editMode && (
                      <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Edit Mode</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">
                    {editMode ? 'Update patrak information and resubmit changes' : 'Fill in the details below to create a new entry'}
                  </p>
                  {editMode && patrakUniqueId && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-slate-400">
                      <span>ID: {patrakUniqueId}</span>
                      {lastModified && <span>• Modified: {formatShortDate(lastModified)}</span>}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={form.handleSubmit(handleCreateEntry)} className="p-5 sm:p-6 space-y-8 bg-slate-50/50">

                {/* 1. Receiving Mode Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'By Hand', label: 'By Hand', icon: QrCode, desc: 'Physical Submission' },
                      { id: 'Mails', label: 'Email', icon: Mail, desc: 'Digital Mail' },
                      { id: 'Post', label: 'Post', icon: Mail, desc: 'Postal Service' },
                      { id: 'Fax', label: 'Fax', icon: Printer, desc: 'Fax Line' }
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = receiving_mode_watch === mode.id;
                      return (
                        <button
                          type="button"
                          key={mode.id}
                          onClick={() => form.setValue('receiving_mode', mode.id, { shouldValidate: true })}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="text-center">
                            <span className="text-sm font-semibold block">{mode.label}</span>
                            <span className="text-xs opacity-70">{mode.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Dynamic Email/Fax Fields */}
                  <AnimatePresence>
                    {receiving_mode_watch === 'Mails' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-2">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Email <span className="text-red-500">*</span></label>
                          <input type="email" {...form.register('sender_email')} placeholder="sender@email.com" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                          {form.formState.errors.sender_email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.sender_email.message}</p>}
                        </div>
                      </motion.div>
                    )}
                    {receiving_mode_watch === 'Fax' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-2">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fax Number <span className="text-red-500">*</span></label>
                          <input {...form.register('fax_number')} placeholder="+91 XXXX XXXX" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                          {form.formState.errors.fax_number && <p className="text-red-500 text-xs mt-1">{form.formState.errors.fax_number.message}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 items-start">
                  {/* 2. Sender Details Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800">Sender Details</h3>
                      <p className="text-xs text-slate-500">Information about the sender</p>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Type <span className="text-red-500">*</span></label>
                          <select {...form.register('sender_type')} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all cursor-pointer">
                            <option value="Citizen">Citizen</option>
                            <option value="Government Department">Government Department</option>
                            <option value="Private Department">Private Department</option>
                            <option value="Employee">Employee</option>
                          </select>
                          {form.formState.errors.sender_type && <p className="text-red-500 text-xs mt-1">{form.formState.errors.sender_type.message}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Name</label>
                          <input {...form.register('sender_name')} placeholder="Enter sender name" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Address</label>
                          <textarea {...form.register('sender_address')} placeholder="Enter complete address" rows={2} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400 resize-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                            <MapPin size={14} /> Unit / District <span className="text-red-500">*</span>
                          </label>
                          <input {...form.register('unit_district')} placeholder="Enter unit or district" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                          {form.formState.errors.unit_district && <p className="text-red-500 text-xs mt-1">{form.formState.errors.unit_district.message}</p>}
                        </div>
                        <AnimatePresence mode="popLayout">
                          {senderTypeWatch !== 'Citizen' && (
                            <>
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="pt-1">
                                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <Send size={14} /> Sender Organization / Unit / Department <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    {...form.register('send_to')}
                                    type="text"
                                    placeholder="Enter organization, unit or department"
                                    className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                                  />
                                  {form.formState.errors.send_to && <p className="text-red-500 text-xs mt-1">{form.formState.errors.send_to.message}</p>}
                                </div>
                              </motion.div>
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="pt-1">
                                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Designation</label>
                                  <input {...form.register('sender_designation')} placeholder="e.g. Inspector, Officer, Manager" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* 3. Letter Details Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800">Letter Details</h3>
                      <p className="text-xs text-slate-500">Information related to patrak/document</p>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
                          <input {...form.register('subject')} placeholder="Brief subject of the patrak..." className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                          {form.formState.errors.subject && <p className="text-red-500 text-xs mt-1">{form.formState.errors.subject.message}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"><CalendarIcon size={14} /> Received Date <span className="text-red-500">*</span></label>
                          <input type="date" {...form.register('received_date')} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                          {form.formState.errors.received_date && <p className="text-red-500 text-xs mt-1">{form.formState.errors.received_date.message}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority <span className="text-red-500">*</span></label>
                          <select {...form.register('priority')} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all cursor-pointer">
                            <option value="Normal">Normal</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Confidential">Confidential</option>
                          </select>
                          {form.formState.errors.priority && <p className="text-red-500 text-xs mt-1">{form.formState.errors.priority.message}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sender Letter / Reference No.</label>
                          <input {...form.register('sender_reference_number')} placeholder="Enter sender reference number" className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"><CalendarIcon size={14} /> Reference Date</label>
                          <input type="date" {...form.register('reference_date')} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description (Optional)</label>
                        <textarea {...form.register('description')} placeholder="Additional notes or context..." rows={3} className="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (editMode) {
                        clearEditState()
                        navigate('/letters', { replace: true, state: {} })
                      } else {
                        form.reset(BLANK_DEFAULTS)
                      }
                    }}
                    className="sm:w-auto !text-slate-600 !border !border-slate-300 !bg-white hover:!bg-slate-50"
                  >
                    <X size={16} className="mr-2" />
                    {editMode ? 'Cancel Edit' : 'Reset'}
                  </Button>
                  <Button
                    type="submit"
                    loading={creating}
                    className="sm:min-w-[200px] !bg-indigo-600 hover:!bg-indigo-700 shadow-sm"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    {editMode ? 'Update Entry' : 'Create Entry'}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Selected Tapal Details Panel */}
            <AnimatePresence>
              {showEntryDetails && selectedEntry && (
                <motion.div
                  ref={detailsRef}
                  initial={{ opacity: 0, x: 40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 overflow-hidden lg:sticky lg:top-6 flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                  {/* Panel Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold text-sm">Patrak Preview</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${selectedEntry.priority === 'Urgent' ? 'bg-red-500 text-white' :
                            selectedEntry.priority === 'Important' ? 'bg-amber-500 text-white' :
                              'bg-emerald-500 text-white'
                          }`}>{selectedEntry.priority}</span>
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5 truncate">{selectedEntry.unique_id}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => navigator.clipboard?.writeText(selectedEntry.unique_id || '')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy ID"
                      >
                        <Copy size={15} className="text-white/70 hover:text-white" />
                      </button>
                      <button
                        onClick={() => setShowEntryDetails(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-white/70 hover:text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">

                      {/* ── Receiving Mode ─────────────────────────────── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Send size={12} className="text-indigo-600" />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receiving Mode</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                          {selectedEntry.receiving_mode === 'Mails' ? <Mail size={14} className="text-indigo-600 shrink-0" /> :
                            selectedEntry.receiving_mode === 'Fax' ? <Printer size={14} className="text-indigo-600 shrink-0" /> :
                              selectedEntry.receiving_mode === 'Post' ? <Mail size={14} className="text-indigo-600 shrink-0" /> :
                                <ArrowRight size={14} className="text-indigo-600 shrink-0" />}
                          <span className="text-[12px] font-bold text-indigo-700">{selectedEntry.receiving_mode || 'By Hand'}</span>
                          {selectedEntry.receiving_mode === 'Mails' && selectedEntry.sender_email && (
                            <span className="text-[10px] text-indigo-500 ml-auto truncate">{selectedEntry.sender_email}</span>
                          )}
                          {selectedEntry.receiving_mode === 'Fax' && selectedEntry.fax_number && (
                            <span className="text-[10px] text-indigo-500 ml-auto">{selectedEntry.fax_number}</span>
                          )}
                        </div>
                      </div>

                      {/* ── Sender Details ─────────────────────────────── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                            <UserRound size={12} className="text-blue-600" />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sender Details</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                          {[
                            { label: 'Sender Type', value: selectedEntry.sender_type, always: true },
                            { label: 'Sender Name', value: selectedEntry.sender_name, always: true },
                            { label: 'Address', value: selectedEntry.sender_address, always: true },
                            { label: 'Unit / District', value: selectedEntry.unit_district, always: true },
                            // Only show for non-Citizen
                            ...(selectedEntry.sender_type !== 'Citizen' ? [
                              { label: 'Organization', value: selectedEntry.send_to },
                              { label: 'Designation', value: selectedEntry.sender_designation },
                            ] : []),
                          ].filter(f => f.value).map(f => (
                            <div key={f.label} className="flex items-start justify-between gap-3 px-3 py-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0 mt-0.5 w-24">{f.label}</p>
                              <p className="text-[11px] font-semibold text-slate-700 text-right break-words">{f.value}</p>
                            </div>
                          ))}
                          {![selectedEntry.sender_type, selectedEntry.sender_name, selectedEntry.sender_address, selectedEntry.unit_district].some(Boolean) && (
                            <p className="text-[10px] text-slate-400 px-3 py-3 text-center">No sender information</p>
                          )}
                        </div>
                      </div>

                      {/* ── Letter Details ─────────────────────────────── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                            <FileText size={12} className="text-amber-600" />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Letter Details</p>
                        </div>

                        {/* Subject — full width */}
                        <div className="mb-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                          <p className="text-[12px] font-bold text-slate-800 leading-snug">{selectedEntry.subject || '—'}</p>
                        </div>

                        {/* 2-col grid for dates + priority */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {[
                            { label: 'Received Date', value: selectedEntry.received_date ? new Date(selectedEntry.received_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null, icon: CalendarIcon },
                            { label: 'Reference Date', value: selectedEntry.reference_date ? new Date(selectedEntry.reference_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null, icon: CalendarIcon },
                          ].map(f => f.value && (
                            <div key={f.label} className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2">
                              <div className="flex items-center gap-1 mb-0.5">
                                <f.icon size={10} className="text-slate-400" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{f.label}</p>
                              </div>
                              <p className="text-[11px] font-bold text-slate-700">{f.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Reference number */}
                        {selectedEntry.sender_reference_number && (
                          <div className="mb-2 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ref. Number</p>
                            <p className="text-[11px] font-bold text-slate-700">{selectedEntry.sender_reference_number}</p>
                          </div>
                        )}

                        {/* Description — full width, multiline */}
                        {selectedEntry.description && (
                          <div className="px-3 py-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-1.5">Description</p>
                            <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedEntry.description}</p>
                          </div>
                        )}
                      </div>



                    </div>
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white space-y-2">
                    {canGenerateQR(user?.role) && (
                      <Button onClick={() => handleGenerateQR(selectedEntry.id)} className="w-full !bg-emerald-600 hover:!bg-emerald-700 !text-sm">
                        <QrCode size={15} className="mr-2" />
                        Generate QR Code
                      </Button>
                    )}
                    <p className="text-center text-[9px] text-slate-400">
                      Patrak ID · <span className="font-mono font-bold text-slate-500">{selectedEntry.unique_id}</span>
                    </p>
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
                  <Building2 size={18} className="text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Tapal List</h2>
                  <p className="text-xs text-slate-500">Showing {entries.length} of {pagination.total} records</p>
                </div>
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
                      className={`w-full text-left px-5 py-4 transition-all hover:bg-slate-50 ${isSelected && showEntryDetails ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-red-600">
                              {entry.unique_id || `#${entry.id}`}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' :
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
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${entry.receiving_mode === 'Mails' ? 'bg-blue-100 text-blue-700' :
                            entry.receiving_mode === 'Fax' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {entry.receiving_mode || 'By Hand'}
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
