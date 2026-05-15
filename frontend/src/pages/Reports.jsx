import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Printer, Share2, Calendar, Filter,
  ChevronDown, ChevronRight, Search, Clock, CheckCircle2,
  AlertCircle, TrendingUp, Users, Building2, Inbox, Send,
  QrCode, BarChart3, FolderOpen, FileSpreadsheet, FileIcon,
  History, Pin, CalendarClock, MailPlus, Archive
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
}

const REPORT_CATEGORIES = [
  {
    id: 'daily',
    title: 'Daily Inward Register',
    description: 'Summary of all inward patraks for the selected date range',
    icon: Inbox,
    color: 'blue',
    format: ['PDF', 'Excel']
  },
  {
    id: 'outward',
    title: 'Outward Movement Report',
    description: 'Complete record of outward patrak movements',
    icon: Send,
    color: 'red',
    format: ['PDF', 'Excel']
  },
  {
    id: 'department',
    title: 'Department Summary',
    description: 'Department-wise patrak processing and pending analysis',
    icon: Building2,
    color: 'purple',
    format: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'pending',
    title: 'Pending Action Report',
    description: 'List of patraks awaiting action beyond SLA period',
    icon: AlertCircle,
    color: 'orange',
    format: ['PDF', 'Excel']
  },
  {
    id: 'monthly',
    title: 'Monthly Disposal Report',
    description: 'Monthly statistics and disposal performance metrics',
    icon: Calendar,
    color: 'green',
    format: ['PDF', 'Excel']
  },
  {
    id: 'qr',
    title: 'QR Scan Activity Report',
    description: 'QR code scanning activity and verification logs',
    icon: QrCode,
    color: 'cyan',
    format: ['PDF', 'Excel']
  },
  {
    id: 'priority',
    title: 'Priority Wise Report',
    description: 'Analysis of patraks by priority level and response time',
    icon: TrendingUp,
    color: 'rose',
    format: ['PDF']
  },
  {
    id: 'user',
    title: 'User Activity Report',
    description: 'User-wise processing statistics and performance',
    icon: Users,
    color: 'indigo',
    format: ['PDF', 'Excel']
  },
]

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'bg-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: 'bg-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: 'bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: 'bg-orange-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: 'bg-green-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', icon: 'bg-cyan-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', icon: 'bg-rose-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: 'bg-indigo-100' },
}

const MOCK_HISTORY = [
  { id: 1, name: 'Daily Inward Register', generatedBy: 'Admin', date: '13 May 2026', time: '10:30 AM', format: 'PDF', size: '2.4 MB' },
  { id: 2, name: 'Pending Action Report', generatedBy: 'DG Office', date: '12 May 2026', time: '04:15 PM', format: 'Excel', size: '1.1 MB' },
  { id: 3, name: 'Department Summary', generatedBy: 'SCRB Admin', date: '11 May 2026', time: '09:00 AM', format: 'PDF', size: '3.2 MB' },
  { id: 4, name: 'Monthly Disposal Report', generatedBy: 'Admin', date: '10 May 2026', time: '02:45 PM', format: 'PDF', size: '4.8 MB' },
  { id: 5, name: 'QR Scan Activity', generatedBy: 'CID Crime', date: '09 May 2026', time: '11:20 AM', format: 'Excel', size: '0.8 MB' },
]

const DEPARTMENTS = ['All Departments', 'DG Office', 'CID Crime', 'Law & Order', 'Training', 'TS & SCRB']
const PRIORITIES = ['All Priorities', 'Normal', 'Urgent', 'Critical']
const STATUS = ['All Status', 'Active', 'Closed', 'Pending']

export default function Reports() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('generate')

  const [filters, setFilters] = useState({
    dateRange: 'last7',
    startDate: '',
    endDate: '',
    department: 'All Departments',
    priority: 'All Priorities',
    status: 'All Status',
    reportType: 'daily'
  })

  const [previewData, setPreviewData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerateReport = async (category) => {
    setIsGenerating(true)
    setSelectedCategory(category)

    await new Promise(resolve => setTimeout(resolve, 1500))

    setPreviewData({
      category: category.title,
      generatedAt: new Date().toLocaleString('en-IN'),
      totalEntries: 127,
      departmentsCovered: 5,
      summary: [
        { label: 'Total Inward', value: 48, color: 'blue' },
        { label: 'Total Outward', value: 35, color: 'red' },
        { label: 'Pending Action', value: 12, color: 'orange' },
        { label: 'Resolved', value: 32, color: 'green' },
      ],
      departmentBreakdown: [
        { name: 'DG Office', inward: 20, outward: 15, pending: 5 },
        { name: 'CID Crime', inward: 10, outward: 8, pending: 2 },
        { name: 'Law & Order', inward: 8, outward: 6, pending: 2 },
        { name: 'Training', inward: 6, outward: 4, pending: 2 },
        { name: 'TS & SCRB', inward: 4, outward: 2, pending: 1 },
      ],
      dateRange: filters.startDate && filters.endDate
        ? `${filters.startDate} to ${filters.endDate}`
        : 'Last 7 Days'
    })

    setIsGenerating(false)
    setActiveTab('preview')
  }

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format}...`)
  }

  const FilterSection = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setFilterOpen(!filterOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-600" />
          <span className="text-sm font-semibold text-slate-800">Report Filters</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
        />
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date Range</label>
                  <div className="relative">
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="last7">Last 7 Days</option>
                      <option value="last14">Last 14 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {filters.dateRange === 'custom' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</label>
                  <div className="relative">
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                  <div className="relative">
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      {STATUS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const ReportCategoryCard = ({ category, index }) => {
    const colors = COLOR_MAP[category.color]

    return (
      <motion.div
        variants={itemVariants}
        className={`bg-white rounded-lg border ${colors.border} hover:shadow-md transition-all cursor-pointer group`}
        onClick={() => handleGenerateReport(category)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center shrink-0`}>
              <category.icon size={20} className={colors.text} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {category.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <div className="flex gap-1.5">
              {category.format.map(fmt => (
                <span key={fmt} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                  {fmt}
                </span>
              ))}
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </motion.div>
    )
  }

  const ReportPreview = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Report Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download size={14} />
            PDF
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium text-slate-600">Generating report...</p>
        </div>
      ) : previewData ? (
        <div className="p-6">
          <div className="text-center border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">{previewData.category}</h2>
            <p className="text-sm text-slate-500 mt-1">
              Date Range: {previewData.dateRange} | Generated: {previewData.generatedAt}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {previewData.summary.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                <p className={`text-2xl font-bold ${item.color === 'blue' ? 'text-blue-600' :
                  item.color === 'red' ? 'text-red-600' :
                    item.color === 'orange' ? 'text-orange-600' :
                      'text-green-600'
                  }`}>{item.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Inward</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Outward</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Pending</th>
                </tr>
              </thead>
              <tbody>
                {previewData.departmentBreakdown.map((dept, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{dept.name}</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 font-semibold">{dept.inward}</td>
                    <td className="px-4 py-2.5 text-center text-red-600 font-semibold">{dept.outward}</td>
                    <td className="px-4 py-2.5 text-center text-orange-600 font-semibold">{dept.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText size={48} className="mb-3 opacity-50" />
          <p className="text-sm font-medium">Select a report category to generate preview</p>
        </div>
      )}
    </div>
  )

  const ReportHistory = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <History size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Recently Generated Reports</h3>
        </div>
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated By</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Format</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_HISTORY.map((report, i) => (
              <tr key={report.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" />
                    <span className="font-medium text-slate-800">{report.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{report.generatedBy}</td>
                <td className="px-4 py-2.5">
                  <span className="text-slate-700">{report.date}</span>
                  <span className="text-slate-400 text-xs ml-1">{report.time}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">{report.format}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{report.size}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Download">
                      <Download size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Print">
                      <Printer size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8f9fa] -mx-4 -mt-4 p-4 sm:p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1600px] mx-auto space-y-5"
        >


          {/* Tab Navigation - Full Width Segmented Control */}
          <motion.div variants={itemVariants} className="w-full">
            <div className="flex items-stretch bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Generate Report Tab */}
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 transition-all duration-200 group relative ${
                  activeTab === 'generate'
                    ? 'bg-[#E8F0EA]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {activeTab === 'generate' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A7C59]" />
                )}
                <div className={`p-1.5 rounded-md ${activeTab === 'generate' ? 'bg-[#4A7C59]' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  <FolderOpen size={16} className={activeTab === 'generate' ? 'text-white' : 'text-slate-500'} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-semibold ${activeTab === 'generate' ? 'text-[#2D4A35]' : 'text-slate-700'}`}>
                    Generate Report
                  </span>
                  <span className={`block text-[11px] ${activeTab === 'generate' ? 'text-[#5A7A63]' : 'text-slate-400'}`}>
                    Create new reports
                  </span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px bg-slate-200" />

              {/* Report Preview Tab */}
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 transition-all duration-200 group relative ${
                  activeTab === 'preview'
                    ? 'bg-[#EDE9F4]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {activeTab === 'preview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B5B8C]" />
                )}
                <div className={`p-1.5 rounded-md ${activeTab === 'preview' ? 'bg-[#6B5B8C]' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  <FileText size={16} className={activeTab === 'preview' ? 'text-white' : 'text-slate-500'} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-semibold ${activeTab === 'preview' ? 'text-[#3D3454]' : 'text-slate-700'}`}>
                    Report Preview
                  </span>
                  <span className={`block text-[11px] ${activeTab === 'preview' ? 'text-[#7A6A96]' : 'text-slate-400'}`}>
                    View generated output
                  </span>
                </div>
              </button>

              {/* Divider */}
              <div className="w-px bg-slate-200" />

              {/* Report History Tab */}
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 transition-all duration-200 group relative ${
                  activeTab === 'history'
                    ? 'bg-[#F2EEE8]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B7355]" />
                )}
                <div className={`p-1.5 rounded-md ${activeTab === 'history' ? 'bg-[#8B7355]' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  <History size={16} className={activeTab === 'history' ? 'text-white' : 'text-slate-500'} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-semibold ${activeTab === 'history' ? 'text-[#4A3F33]' : 'text-slate-700'}`}>
                    Report History
                  </span>
                  <span className={`block text-[11px] ${activeTab === 'history' ? 'text-[#8B7355]' : 'text-slate-400'}`}>
                    Past generated reports
                  </span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Filter Panel */}
          <motion.div variants={itemVariants}>
            <FilterSection />
          </motion.div>

          {/* Content based on active tab */}
          {activeTab === 'generate' && (
            <motion.div variants={itemVariants}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Archive size={16} className="text-slate-500" />
                  Available Report Templates
                </h2>
                <span className="text-xs text-slate-500">{REPORT_CATEGORIES.length} reports available</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {REPORT_CATEGORIES.map((category, index) => (
                  <ReportCategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div variants={itemVariants}>
              <ReportPreview />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div variants={itemVariants}>
              <ReportHistory />
            </motion.div>
          )}

          {/* Quick Actions Section - Premium Features */}
          <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <CalendarClock size={14} className="text-blue-500" />
                Scheduled Reports
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <Pin size={14} className="text-orange-500" />
                Pinned Reports
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <MailPlus size={14} className="text-green-500" />
                Auto Email
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <Download size={14} className="text-purple-500" />
                Download Center
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <Archive size={14} className="text-cyan-500" />
                Archive Access
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors text-slate-700">
                <Share2 size={14} className="text-rose-500" />
                Share Report
              </button>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  )
}