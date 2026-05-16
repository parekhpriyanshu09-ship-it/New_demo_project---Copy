import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { Card, Badge, Button } from '../components/common'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { canGenerateQR, DEPARTMENTS } from '../utils/roleGuard'
import { formatDate, formatTime } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import {
  ArrowLeft, QrCode, Download, MapPin, Clock, CheckCircle,
  Package, User, Building2, AlertTriangle, FileText, Check,
  RefreshCw, ShieldCheck, Calendar as CalendarIcon, ChevronRight,
  Printer, Info, FileSpreadsheet, Search, Mail
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function EntryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [entry, setEntry] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [searchId, setSearchId] = useState('')

  useEffect(() => {
    fetchEntryDetail()
  }, [id])

  const fetchEntryDetail = async () => {
    try {
      const [entryRes, trackingRes] = await Promise.all([
        api.get(`/api/entries/${id}`),
        api.get(`/api/entries/${id}/tracking`),
      ])
      setEntry(entryRes.data)
      setTracking(trackingRes.data)
    } catch (error) {
      toast.error('Failed to load entry details')
      navigate('/letters')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadQR = () => {
    if (entry?.qr_code_data) {
      const link = document.createElement('a')
      link.href = `data:image/png;base64,${entry.qr_code_data}`
      link.download = `qr-${entry.unique_id}.png`
      link.click()
      toast.success('QR Code downloaded!')
    }
  }

  const handleRegenerateQR = async () => {
    try {
      await api.post(`/api/qr/regenerate/${entry.id}`)
      toast.success('QR Code regenerated!')
      fetchEntryDetail()
    } catch (error) {
      toast.error('Failed to regenerate QR Code')
    }
  }

  const [receivingDigitally, setReceivingDigitally] = useState(false)

  const handleReceiveDigitally = async () => {
    setReceivingDigitally(true)
    try {
      await api.post('/api/qr/receive-electronic', {
        entry_id: entry.id,
        department_name: entry.current_department
      })
      toast.success('Document digitally received and logged!')
      fetchEntryDetail()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to digitally receive document')
    } finally {
      setReceivingDigitally(false)
    }
  }

  const handlePrintQR = () => {
    if (!entry?.qr_code_data) {
      toast.error('No QR code available to print')
      return
    }

    const printWindow = document.createElement('iframe')
    printWindow.style.position = 'absolute'
    printWindow.style.top = '-1000px'
    printWindow.style.left = '-1000px'
    document.body.appendChild(printWindow)
    
    printWindow.contentDocument.open()
    printWindow.contentDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${entry.unique_id || `PTRK/2025/000${entry.id}`}</title>
          <style>
            @page { size: auto; margin: 0; }
            body { 
              margin: 0; 
              padding: 20px;
              display: flex; 
              align-items: center; 
              justify-content: center;
            }
            .qr-image { width: 150px; height: 150px; object-fit: contain; }
          </style>
        </head>
        <body>
          <img class="qr-image" src="data:image/png;base64,${entry.qr_code_data}" onload="window.print()" />
        </body>
      </html>
    `)
    printWindow.contentDocument.close()
    
    // Clean up the iframe after print dialog opens
    setTimeout(() => {
      if (document.body.contains(printWindow)) {
        document.body.removeChild(printWindow)
      }
    }, 5000)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing records...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const completedSteps = tracking?.timeline?.filter(t => t.status === 'completed').length || 0
  const totalSteps = tracking?.timeline?.length || 6
  const progressPercent = (completedSteps / (totalSteps - 1)) * 100

  const isElectronic = entry?.receiving_mode && entry?.receiving_mode !== 'Physical'
  const isAtUserDepartment = user && (user.department === entry?.current_department || user.role === 'admin')
  const hasLogAtStage = tracking?.timeline?.some(n => n.department === entry?.current_department && n.log)
  const canReceiveDigitally = isElectronic && isAtUserDepartment && !hasLogAtStage

  return (
    <Layout>
      <div className="max-w-[1300px] mx-auto pb-10 pt-4 px-4 bg-[#f8fafc] min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-0 sm:border-b-2 sm:border-red-700 pb-2 sm:pb-3 mb-6 gap-4 sm:gap-0">
           <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto order-1 sm:order-2">
              <button
                onClick={() => navigate('/letters')}
                className="text-[#b71c1c] font-bold text-sm sm:text-sm flex items-center gap-1.5 sm:px-4 sm:py-2 sm:border sm:border-[#b71c1c] sm:rounded-md sm:bg-white hover:bg-red-50 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to List
              </button>
              <button 
                onClick={handlePrintQR}
                className="px-4 py-2 bg-[#b71c1c] text-white rounded-md font-bold text-sm sm:text-sm hover:bg-red-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer size={16} />
                Print
              </button>
           </div>
           <h1 className="text-xl sm:text-2xl font-bold text-[#b71c1c] tracking-tight order-2 sm:order-1 mt-2 sm:mt-0">
              Track 'N' Trace
           </h1>
        </div>

        {/* Mobile Tabs */}
        <div className="flex sm:hidden w-full bg-white rounded-xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
           <button onClick={() => setActiveTab('details')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 relative z-10 transition-all ${activeTab === 'details' ? 'text-[#b71c1c]' : 'text-slate-400'}`}>
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-[#b71c1c] transition-opacity ${activeTab === 'details' ? 'opacity-100' : 'opacity-0'}`} />
              <FileText size={18} />
              <span className="text-xs font-bold">Details</span>
           </button>
           <button onClick={() => setActiveTab('status')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 relative z-10 transition-all border-x border-slate-100 ${activeTab === 'status' ? 'text-[#b71c1c]' : 'text-slate-400'}`}>
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-[#b71c1c] transition-opacity ${activeTab === 'status' ? 'opacity-100' : 'opacity-0'}`} />
              <MapPin size={18} />
              <span className="text-xs font-bold">Status</span>
           </button>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-2 mb-8 border-b border-slate-200">
           <button 
             onClick={() => setActiveTab('details')}
             className={`px-8 py-3.5 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all ${
               activeTab === 'details' 
                 ? 'bg-white text-[#b71c1c] border-t-4 border-t-[#b71c1c] border-x border-x-slate-200 border-b border-b-white -mb-[1px]' 
                 : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border border-transparent'
             }`}
           >
              <FileText size={16} />
              Entry Details
           </button>
           <button 
             onClick={() => setActiveTab('status')}
             className={`px-8 py-3.5 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all ${
               activeTab === 'status' 
                 ? 'bg-white text-[#b71c1c] border-t-4 border-t-[#b71c1c] border-x border-x-slate-200 border-b border-b-white -mb-[1px]' 
                 : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border border-transparent'
             }`}
           >
              <MapPin size={16} />
              Tracking Status
           </button>
        </div>

        {/* Content Area */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
             
             {/* Left Column - Entry Details Card */}
             <div className="bg-white border border-slate-100 sm:border-slate-200 rounded-xl sm:rounded-lg p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                   <FileText className="text-[#b71c1c] sm:hidden" size={20} />
                   <h2 className="text-lg sm:text-xl font-bold text-slate-800">Entry Details</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-5 mb-8">
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Patrak ID</span>
                      <span className="text-xs sm:text-sm text-slate-800 font-bold text-right sm:text-left sm:col-span-2 max-w-[180px] sm:max-w-none break-all">{entry.unique_id || `PTRK/2025/000${entry.id}`}</span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Receiving Mode</span>
                      <div className="text-right sm:text-left sm:col-span-2">
                         <span className={`px-2 py-1 text-xs sm:text-xs font-black rounded uppercase tracking-wider border ${
                           entry.receiving_mode === 'Mails' ? 'bg-green-50 text-green-600 border-green-100' :
                           entry.receiving_mode === 'Fax' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                           'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>
                            {entry.receiving_mode || 'Physical'}
                         </span>
                      </div>
                   </div>
                   {entry.receiving_mode === 'Mails' && entry.sender_email && (
                      <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                         <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Sender Email</span>
                         <span className="text-xs sm:text-sm text-slate-800 font-bold text-right sm:text-left sm:col-span-2 break-all">{entry.sender_email}</span>
                      </div>
                   )}
                   {entry.receiving_mode === 'Fax' && entry.fax_number && (
                      <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                         <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Sender Fax</span>
                         <span className="text-xs sm:text-sm text-slate-800 font-bold text-right sm:text-left sm:col-span-2">{entry.fax_number}</span>
                      </div>
                   )}
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Subject</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2">{entry.subject}</span>
                   </div>
                   <div className="flex justify-between items-center sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Priority</span>
                      <div className="text-right sm:text-left sm:col-span-2">
                         <span className="px-3 py-1 bg-[#b71c1c] text-white text-xs sm:text-xs font-bold rounded shadow-sm tracking-wide">
                            {entry.priority.toUpperCase()}
                         </span>
                      </div>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Sender</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2">{entry.sender_name}</span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Designation</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2">{entry.sender_designation || 'N/A'}</span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Department (Current)</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2 max-w-[150px] sm:max-w-none">{entry.current_department}</span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Created On</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2">
                         {formatDate(entry.received_date)}<br className="sm:hidden" />
                         <span className="text-slate-500 sm:hidden"> at {formatTime(entry.received_date)}</span>
                      </span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Description</span>
                      <span className="text-xs sm:text-sm text-slate-800 text-right sm:text-left sm:col-span-2">{entry.description || 'N/A'}</span>
                   </div>
                   <div className="flex justify-between items-start sm:grid sm:grid-cols-3">
                      <span className="text-xs sm:text-sm text-slate-400 sm:text-slate-500 font-medium w-1/3 sm:w-auto">Total Movements</span>
                      <span className="text-xs sm:text-sm text-slate-800 font-medium text-right sm:text-left sm:col-span-2">{completedSteps} / {totalSteps} Completed</span>
                   </div>
                </div>

                {/* Sub-card for QR scanning prompt */}
                <div className="bg-red-50/50 border border-red-100 rounded-xl sm:rounded-lg p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                   <div className="flex flex-col w-full items-center sm:items-start relative">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 sm:mb-1 w-full">
                         <QrCode className="text-[#b71c1c] sm:hidden" size={20} />
                         <h4 className="text-sm font-bold text-[#b71c1c]">Scan to Track this Patrak</h4>
                      </div>
                      <p className="text-xs sm:text-xs text-slate-600 mb-4 leading-relaxed max-w-[250px] sm:max-w-none">
                         Use this QR Code to track or update movement status of this patrak.
                      </p>
                      <div className="p-2 border border-slate-200 rounded-lg bg-white mb-4 sm:hidden">
                         {entry.qr_code_data ? (
                           <img 
                             src={`data:image/png;base64,${entry.qr_code_data}`} 
                             alt="QR" 
                             className="w-32 h-32 object-contain"
                           />
                         ) : (
                           <div className="w-32 h-32 bg-slate-50 flex items-center justify-center">
                              <QrCode size={32} className="text-slate-300" />
                           </div>
                         )}
                      </div>
                      <div className="hidden sm:block mb-0">
                         {entry.qr_code_data ? (
                           <img 
                             src={`data:image/png;base64,${entry.qr_code_data}`} 
                             alt="Mini QR" 
                             className="w-24 h-24 object-contain bg-white p-1 rounded border border-slate-200 absolute right-0 top-0"
                           />
                         ) : null}
                      </div>
                      <button 
                        onClick={handleDownloadQR}
                        className="w-full sm:w-auto px-4 py-2 sm:py-1.5 border border-[#b71c1c] text-[#b71c1c] bg-white rounded-md text-sm sm:text-xs font-bold hover:bg-red-50 transition-colors flex justify-center items-center gap-2"
                      >
                         <Download size={14} />
                         Download QR Code
                      </button>
                   </div>
                </div>
             </div>

             {/* Right Column - Track N Trace Service Card */}
             <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm flex flex-col items-center">
                <div className="flex items-center gap-3 mb-6">
                   <img src="/scrb-logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => e.target.style.display='none'} />
                   <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Patrak Tracking System</h2>
                </div>

                <div className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white text-center py-3 mb-8 relative overflow-hidden shadow-sm">
                   {/* Diagonal stripes effect mimicking the image */}
                   <div className="absolute top-0 left-0 w-16 h-full bg-yellow-400/90 transform -skew-x-[30deg] -ml-8" />
                   <div className="absolute top-0 left-6 w-4 h-full bg-yellow-400/90 transform -skew-x-[30deg]" />
                   <div className="absolute top-0 right-0 w-16 h-full bg-yellow-400/90 transform -skew-x-[30deg] -mr-8" />
                   <div className="absolute top-0 right-6 w-4 h-full bg-yellow-400/90 transform -skew-x-[30deg]" />
                   
                   <h3 className="text-lg font-bold relative z-10">Track 'N' Trace Service</h3>
                </div>

                <p className="text-slate-800 font-bold mb-6">Scan the QR code to track your patrak</p>

                <div className="p-4 border-2 border-red-300 rounded-xl mb-10 bg-white">
                   {entry.qr_code_data ? (
                     <img 
                       src={`data:image/png;base64,${entry.qr_code_data}`} 
                       alt="Large QR" 
                       className="w-48 h-48 object-contain mix-blend-multiply"
                     />
                   ) : (
                     <div className="w-48 h-48 bg-slate-50 flex items-center justify-center">
                        <QrCode size={64} className="text-slate-300" />
                     </div>
                   )}
                </div>

                <div className="w-full max-w-md mt-auto">
                   <div className="bg-red-50/30 sm:bg-red-50/50 border border-red-100 rounded-xl sm:rounded-md p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex items-center gap-2">
                         <span className="text-[#b71c1c] font-black">+</span>
                         <span className="font-bold text-[#b71c1c] text-sm">Note:</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-5 sm:pl-0 sm:mt-0.5">
                         You can track the status of your patrak by scanning the QR code.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Tracking Status Tab Implementation */}
        {activeTab === 'status' && (
           <div className="space-y-6">
              {/* Top Summary Card */}
              <div className="bg-white border border-slate-100 sm:border-slate-200 rounded-xl sm:rounded-lg p-5 shadow-sm">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                    <div className="flex gap-4 items-center">
                       <div className="w-16 h-16 bg-emerald-500 sm:bg-[#dc2626] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                          <FileText size={28} className="text-white" />
                       </div>
                       <div className="sm:hidden flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <p className="text-xs text-slate-500 font-medium">Current Status</p>
                             <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">
                                {entry.status === 'Active' ? 'In Transit' : entry.status}
                             </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">At {entry.current_department}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 sm:mt-0 sm:flex-1 sm:grid-cols-5 sm:items-center border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                       <div className="hidden sm:block">
                          <p className="text-xs text-slate-400 font-bold mb-1">Patrak ID</p>
                          <p className="text-sm font-bold text-slate-800">{entry.unique_id || `PTRK/2025/000${entry.id}`}</p>
                       </div>
                       <div className="hidden sm:block">
                          <p className="text-xs text-slate-400 font-bold mb-1">Subject</p>
                          <p className="text-sm font-bold text-slate-800 max-w-[180px] truncate">{entry.subject}</p>
                       </div>
                       <div className="hidden sm:block">
                          <p className="text-xs text-slate-400 font-bold mb-1">Current Status</p>
                          <div className="flex flex-col items-start gap-1">
                             <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded">
                                {entry.status === 'Active' ? 'In Transit' : entry.status}
                             </span>
                             <p className="text-xs font-bold text-slate-800">At {entry.current_department}</p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-1">
                          <p className="text-xs sm:text-xs text-slate-400 font-bold">Priority</p>
                          <div>
                             <span className="px-3 py-1 bg-[#b71c1c] text-white text-xs font-bold rounded shadow-sm">
                                {entry.priority.toUpperCase()}
                             </span>
                          </div>
                       </div>
                       <div className="flex flex-col gap-1">
                          <p className="text-xs sm:text-xs text-slate-400 font-bold">Total Movements</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">{completedSteps} / {totalSteps} Completed</p>
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
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">From (Sender)</p>
                            <p className="text-xs font-bold text-slate-800">{entry.sender_name} <span className="text-slate-500 font-medium">({entry.sender_designation || tracking?.timeline?.[0]?.department || 'Origin'})</span></p>
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
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">To (Final Destination)</p>
                            <p className="text-xs font-bold text-slate-800">{tracking?.timeline?.[tracking.timeline.length - 1]?.department || 'Final Destination'}</p>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Main Timeline and Details Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                 
                 {/* Left Column - Movement Timeline */}
                 <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6">Patrak Movement Timeline</h3>
                    
                    <div className="relative">
                       {/* Timeline Vertical Line */}
                       <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-slate-200 z-0" />

                       <div className="space-y-4 relative z-10">
                         {tracking?.timeline?.map((node, index) => {
                            const isCompleted = node.status === 'completed';
                            const isCurrent = node.status === 'current';
                            const isPending = node.status === 'pending';

                            return (
                              <div key={node.department} className="flex items-start sm:items-center gap-4 sm:gap-6 relative">
                                 {/* Interactive Dot Wrapper */}
                                 <div className="w-10 flex justify-center shrink-0 mt-2 sm:mt-0 relative z-10">
                                    <div className={`w-6 h-6 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white ${
                                       isCompleted ? 'bg-emerald-600 text-white' : 
                                       isCurrent ? 'bg-[#b71c1c] text-white' : 
                                       'bg-slate-200 text-slate-500'
                                    }`}>
                                       {index + 1}
                                    </div>
                                 </div>

                                 {/* Timeline Card */}
                                 <div className={`flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 rounded-lg border ${
                                    isCurrent ? 'bg-red-50/20 border-red-100' : 'bg-transparent sm:bg-white sm:border-slate-100 border-transparent'
                                 }`}>
                                    <div className="w-full">
                                       <div className="flex items-center justify-between sm:justify-start gap-3 mb-1.5 w-full">
                                          <h4 className="text-sm font-bold text-slate-800">{node.department}</h4>
                                          <span className={`px-2 py-0.5 rounded text-xs sm:text-xs font-bold ${
                                             isCompleted ? 'bg-emerald-50 text-emerald-600' : 
                                             isCurrent ? 'bg-red-50 text-red-600' : 
                                             'bg-slate-100 text-slate-500'
                                          }`}>
                                             {isCompleted ? 'Received' : isCurrent ? 'In Transit' : 'Pending'}
                                          </span>
                                       </div>
                                       <p className="text-sm sm:text-sm text-slate-500 mb-2 sm:mb-0">
                                          {isCompleted ? 'Patrak received and registered' : 
                                           isCurrent ? 'Patrak is currently with this department' : 
                                           'Awaiting patrak'}
                                       </p>
                                       <div className="flex sm:hidden items-center gap-1.5 text-slate-400 mt-2">
                                          <CalendarIcon size={12} />
                                          <p className="text-xs font-medium">
                                             {((isCompleted || isCurrent) && node.log) ? `${formatDate(node.log.received_at)}, ${formatTime(node.log.received_at)}` : '--/--/----, --:--'}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="hidden sm:block text-right shrink-0">
                                       <p className="text-sm text-slate-500 font-medium">
                                          {(isCompleted || isCurrent) && node.log ? formatDate(node.log.received_at) : '--'}
                                       </p>
                                       <p className="text-sm text-slate-500 font-medium mt-0.5">
                                          {(isCompleted || isCurrent) && node.log ? formatTime(node.log.received_at) : '--:-- --'}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                            )
                         })}
                       </div>

                       {/* Legend */}
                       <div className="flex items-center gap-6 mt-8 pt-5 border-t border-slate-100 ml-16">
                          <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                             <span className="text-xs font-bold text-slate-500">Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                             <span className="text-xs font-bold text-slate-500">Current</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                             <span className="text-xs font-bold text-slate-500">Pending</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Column - Location details */}
                 <div className="lg:col-span-1 space-y-6">
                    
                    {/* Current Location Card */}
                    <div className="bg-red-50/30 border border-red-100 rounded-lg p-6 shadow-sm">
                       {(() => {
                          const currentIdx = tracking?.timeline?.findIndex(n => n.status === 'current') ?? -1;
                          const currentNode = currentIdx !== -1 ? tracking.timeline[currentIdx] : null;
                          const lastLogNode = [...(tracking?.timeline || [])].reverse().find(n => n.log);

                          return (
                             <>
                                <div className="flex items-center gap-2 mb-6 border-b border-red-100 pb-4">
                                   <MapPin size={18} className="text-[#b71c1c]" />
                                   <h3 className="text-sm font-bold text-[#b71c1c]">Current Location Details</h3>
                                </div>
                                
                                <div className="space-y-5">
                                   <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Department</p>
                                      <p className="text-sm font-bold text-slate-800">{currentNode ? currentNode.department : (lastLogNode ? lastLogNode.department : entry.current_department)}</p>
                                   </div>
                                   
                                   <div className="flex gap-2">
                                      <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                      <p className="text-xs text-slate-600 font-medium">Headquarters Building, Central Sector</p>
                                   </div>

                                   <div className="border-t border-slate-200 pt-5 space-y-4">
                                      <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Received On</p>
                                         <p className="text-xs font-bold text-slate-800">
                                            {lastLogNode?.log ? `${formatDate(lastLogNode.log.received_at)}, ${formatTime(lastLogNode.log.received_at)}` : 'N/A'}
                                         </p>
                                      </div>
                                      <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Received By</p>
                                         <p className="text-xs font-bold text-slate-800">{lastLogNode?.log?.received_by || 'System Automated'}</p>
                                      </div>
                                      <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Remarks</p>
                                         <p className="text-xs font-bold text-slate-600">{lastLogNode?.log?.remarks || 'Patrak is under process.'}</p>
                                      </div>
                                   </div>
                                </div>
                             </>
                          )
                       })()}
                    </div>

                    {/* Next Destination Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
                       {(() => {
                          const currentIdx = tracking?.timeline?.findIndex(n => n.status === 'current') ?? -1;
                          const nextNode = currentIdx !== -1 && currentIdx < tracking.timeline.length - 1 ? tracking.timeline[currentIdx + 1] : null;

                          return (
                             <>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                                   <Clock size={18} className="text-slate-500" />
                                   <h3 className="text-sm font-bold text-slate-700">Next Destination</h3>
                                </div>

                                <div className="space-y-5">
                                   <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Department</p>
                                      <p className="text-sm font-bold text-slate-800">{nextNode ? nextNode.department : 'Final Destination Reached'}</p>
                                   </div>

                                   {nextNode && (
                                      <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Expected Next Movement</p>
                                         <p className="text-xs font-bold text-slate-800">Upon Process Completion</p>
                                      </div>
                                   )}
                                </div>
                             </>
                          )
                       })()}
                    </div>
                 </div>
              </div>
           </div>
        )}



      </div>
    </Layout>
  )
}
import { CheckCircle2 } from 'lucide-react'