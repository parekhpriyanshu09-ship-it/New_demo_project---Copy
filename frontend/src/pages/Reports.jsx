import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { ChevronDown, Calendar, Download, FileText, Send, AlertCircle, CheckCircle2, BarChart2, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

const CHART_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ef4444', '#8b5cf6']
const DONUT_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7']

const Dropdown = ({ text, icon: Icon, primary = false }) => (
  <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold transition-all border ${
    primary 
      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm' 
      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
  }`}>
    {Icon && <Icon size={14} className={primary ? "text-white" : "text-slate-400"} />}
    <span>{text}</span>
    {!primary && <ChevronDown size={14} className="text-slate-400 ml-1" />}
  </button>
)

export default function Reports() {
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [filterDays, setFilterDays] = useState(7)
  const [stats, setStats] = useState({ total_entries: 0, active_entries: 0, closed_entries: 0 })
  const [deptForwarded, setDeptForwarded] = useState([])
  const [lineData, setLineData] = useState([])

  useEffect(() => {
    fetchReportData(filterDays)
  }, [filterDays])

  const fetchReportData = async (days) => {
    setLoading(true)
    try {
      const [statsRes, forwardedRes, inwardChartRes, outwardChartRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/department-forwarded'),
        api.get(`/api/dashboard/date-chart?view_type=inward&days=${days}`),
        api.get(`/api/dashboard/date-chart?view_type=outward&days=${days}`)
      ])

      setStats(statsRes.data)
      setDeptForwarded(forwardedRes.data.departments || [])

      const inwardData = inwardChartRes.data.data || []
      const outwardData = outwardChartRes.data.data || []
      
      const mergedLineData = inwardData.map(inItem => {
        const outItem = outwardData.find(o => o.date === inItem.date) || { count: 0 }
        return {
          date: new Date(inItem.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          inward: inItem.count,
          outward: outItem.count
        }
      }).reverse()
      
      setLineData(mergedLineData)
    } catch (error) {
      console.error("Failed to load reports data", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    toast.success("Preparing PDF Export...")
    setTimeout(() => window.print(), 500)
  }

  // Data processing
  const totalInward = deptForwarded.reduce((sum, d) => sum + d.received, 0) || stats.total_entries
  const totalOutward = deptForwarded.reduce((sum, d) => sum + d.forwarded, 0)
  
  // All departments are always shown (including TS & SCRB with 0 entries)
  const ALL_DEPTS = ['DG Office', 'CID Crime', 'Law & Order', 'Training', 'TS & SCRB']

  const donutDataRaw = ALL_DEPTS.map((deptName, i) => {
    const found = deptForwarded.find(d => d.department === deptName)
    return {
      name: deptName,
      shortName: deptName.length > 12 ? deptName.substring(0, 10) + '...' : deptName,
      value: found ? found.received : 0,
      fill: DONUT_COLORS[i % DONUT_COLORS.length]
    }
  }).sort((a, b) => b.value - a.value)

  const donutTotal = donutDataRaw.reduce((sum, item) => sum + item.value, 0)
  
  const donutData = donutDataRaw.map(item => ({
    ...item,
    percentage: donutTotal > 0 ? ((item.value / donutTotal) * 100).toFixed(1) : '0.0'
  }))

  const barData = ALL_DEPTS.map((deptName, i) => {
    const found = deptForwarded.find(d => d.department === deptName)
    const abbr = deptName === 'Law & Order' ? 'L&Order' : deptName === 'TS & SCRB' ? 'TS&SCRB' : deptName.length > 8 ? deptName.substring(0, 8) + '..' : deptName
    return {
      name: abbr,
      fullName: deptName,
      value: found ? found.received : 0,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }
  })

  const gaugeTotal = stats.active_entries + stats.closed_entries || 1
  const activePercent = ((stats.active_entries / gaugeTotal) * 100).toFixed(0)
  const closedPercent = ((stats.closed_entries / gaugeTotal) * 100).toFixed(0)

  // Gauge data needs to be ordered for the half-donut properly
  const gaugeData = [
    { name: 'Active', value: stats.active_entries, fill: '#22c55e' },
    { name: 'Closed', value: stats.closed_entries, fill: '#e2e8f0' },
  ]

  const topPerformers = ALL_DEPTS.map((deptName, i) => {
    const found = deptForwarded.find(d => d.department === deptName)
    const received = found ? found.received : 0
    const forwarded = found ? found.forwarded : 0
    const rate = received > 0 ? Math.min(100, Math.round((forwarded / received) * 100)) : 0
    return {
      name: deptName,
      value: rate,
      fill: DONUT_COLORS[i % DONUT_COLORS.length]
    }
  })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const getDateRangeText = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (filterDays - 1))
    
    const formatDate = (d) => {
      const day = d.getDate().toString().padStart(2, '0')
      const month = d.toLocaleString('en-US', { month: 'short' })
      const year = d.getFullYear()
      return `${day} ${month} ${year}`
    }
    
    // Only show year on the end date to save space if it's the same year
    const startStr = `${start.getDate().toString().padStart(2, '0')} ${start.toLocaleString('en-US', { month: 'short' })}`
    return `${startStr} – ${formatDate(end)}`
  }

  const CustomReportTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-neutral-900/95 backdrop-blur-md border border-slate-800 dark:border-neutral-800/80 p-2.5 rounded-xl shadow-xl text-white text-[10px] font-sans">
          <p className="font-bold text-slate-300 mb-0.5 leading-tight">{data.fullName}</p>
          <p className="font-extrabold text-sm text-white">
            {data.value.toLocaleString("en-IN")}{" "}
            <span className="text-[10px] text-slate-400 font-medium">Inward Patraks</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#fafafa] -mx-4 -mt-4 p-4 sm:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1500px] mx-auto space-y-5 print:m-0 print:p-0"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Analytics Overview</h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                  <path d="M4 12c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">Monitor patrak movement, department efficiency, and overall system health.</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full lg:w-auto mt-3 lg:mt-0">
              <div className="w-full sm:w-auto flex-1">
                <Dropdown text={getDateRangeText()} icon={Calendar} />
              </div>
              <div className="relative shrink-0 w-[48%] sm:w-auto">
                <select 
                  value={filterDays}
                  onChange={(e) => setFilterDays(Number(e.target.value))}
                  className="appearance-none w-full flex items-center pl-3 pr-8 py-2 rounded-lg text-[12px] font-bold transition-all border bg-white hover:bg-slate-50 text-slate-700 border-slate-200 outline-none cursor-pointer"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days</option>
                </select>
                <ChevronDown size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div onClick={handleExportPDF} className="w-[48%] sm:w-auto">
                <Dropdown text="Export Report" icon={Download} primary />
              </div>
            </div>
          </motion.div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Inward */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start w-full">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#eff6ff] text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={22} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[12px] font-bold text-slate-800 mb-1">Total Inward</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '-' : totalInward}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-emerald-600">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>
                    33.4%
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">vs prev {filterDays} days</span>
                </div>
              </div>
              <div className="w-16 h-1 bg-blue-600 rounded-full mt-4"></div>
            </motion.div>

            {/* Card 2: Total Outward */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start w-full">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fef2f2] text-red-500 flex items-center justify-center shrink-0">
                    <Send size={22} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[12px] font-bold text-slate-800 mb-1">Total Outward</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '-' : totalOutward}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef2f2] text-red-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>
                    12.4%
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">vs prev {filterDays} days</span>
                </div>
              </div>
              <div className="w-16 h-1 bg-red-500 rounded-full mt-4"></div>
            </motion.div>

            {/* Card 3: Pending Action */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start w-full">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fff7ed] text-orange-500 flex items-center justify-center shrink-0">
                    <AlertCircle size={22} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[12px] font-bold text-slate-800 mb-1">Pending Action</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '-' : stats.active_entries}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff7ed] text-orange-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>
                    2.1%
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">vs prev {filterDays} days</span>
                </div>
              </div>
              <div className="w-16 h-1 bg-orange-500 rounded-full mt-4"></div>
            </motion.div>

            {/* Card 4: Resolved Patraks */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start w-full">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[12px] font-bold text-slate-800 mb-1">Resolved Patraks</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '-' : stats.closed_entries}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-emerald-600">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>
                    62.0%
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">vs prev {filterDays} days</span>
                </div>
              </div>
              <div className="w-16 h-1 bg-emerald-500 rounded-full mt-4"></div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Movement Trends Area Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-7 xl:col-span-7 bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col h-[380px]">
               <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Movement Trends</h3>
                  <p className="text-[12px] text-slate-500 mt-1">Daily inward vs outward volume</p>
                  <div className="flex items-center gap-4 mt-3">
                     <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                       <span className="text-[11px] font-bold text-slate-800">Inward Volume</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                       <span className="text-[11px] font-bold text-slate-800">Outward Volume</span>
                     </div>
                  </div>
                </div>
                <div className="hidden sm:block relative">
                  <select 
                    value={filterDays}
                    onChange={(e) => setFilterDays(Number(e.target.value))}
                    className="appearance-none flex items-center gap-2 pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-bold transition-all border bg-white hover:bg-slate-50 text-slate-600 border-slate-200 outline-none cursor-pointer"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 800 }}
                      labelStyle={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="outward" name="Outward" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOutward)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                    <Area type="monotone" dataKey="inward" name="Inward" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInward)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Department Flow Donut Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-5 xl:col-span-5 bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col h-[380px]">
              <div className="flex items-start justify-between mb-2">
                 <div>
                   <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Department Flow</h3>
                   <p className="text-[12px] text-slate-500 mt-1">Inward distribution</p>
                </div>
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  View Details
                </button>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between mt-2 gap-4 sm:gap-6">
                {/* Pie Chart */}
                <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] shrink-0 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-none">{totalInward}</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-1">Total</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Pie
                        data={donutData}
                        innerRadius="65%"
                        outerRadius="95%"
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Vertical Legend */}
                <div className="w-full sm:flex-1 flex flex-col justify-center gap-3">
                  {donutData.length > 0 ? donutData.map(item => (
                    <div key={item.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 pr-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></div>
                        <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap" title={item.name}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] sm:text-[12px] font-black text-slate-900">{item.value}</span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 w-10 text-right">({item.percentage}%)</span>
                      </div>
                    </div>
                  )) : (
                    <span className="text-xs font-bold text-slate-400">No data</span>
                  )}
                </div>
              </div>

              {/* Footer Pill */}
              <div className="mt-4 bg-slate-50 rounded-lg py-2.5 px-4 flex justify-between items-center border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">Total Departments</span>
                <span className="text-[13px] font-black text-slate-900">{donutData.length}</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row: DG Office Inward Entry Analysis, Resolution Overview, Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
             {/* DG Office – Inward Entry Analysis — Horizontal Bar Chart, no card bg */}
             <motion.div variants={itemVariants} className="xl:col-span-5 flex flex-col h-[320px] bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
               {/* Header */}
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2.5">
                   <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                     <BarChart2 size={13} className="text-white" strokeWidth={2.5} />
                   </div>
                   <div>
                     <h3 className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">DG Office – Inward Entry Analysis</h3>
                     <p className="text-[11px] text-slate-400 font-medium">Volume received per department</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                   <TrendingUp size={10} className="text-blue-600" strokeWidth={3} />
                   <span className="text-[10px] font-black text-blue-700">{totalInward} Total</span>
                 </div>
               </div>

               {/* Vertical Bar Chart */}
               <div className="flex-1 min-h-[190px] w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 5 }}>
                     <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.8} />
                     <XAxis
                       dataKey="name"
                       axisLine={false}
                       tickLine={false}
                       tick={{ fontSize: 9.5, fill: "#64748b", fontWeight: 600 }}
                       dy={5}
                     />
                     <YAxis
                       axisLine={false}
                       tickLine={false}
                       tick={{ fontSize: 9.5, fill: "#64748b", fontWeight: 600 }}
                       dx={-2}
                     />
                     <Tooltip
                       content={<CustomReportTooltip />}
                       cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
                     />
                     <Bar
                       dataKey="value"
                       radius={[4, 4, 0, 0]}
                       maxBarSize={32}
                       animationDuration={1000}
                     >
                       {barData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               {/* Footer */}
               <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inward Entries · All Departments</span>
                 <button onClick={handleExportPDF} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                   <Download size={10} /> Export
                 </button>
               </div>
             </motion.div>

             {/* Resolution Overview Gauge */}
             <motion.div variants={itemVariants} className="xl:col-span-3 bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col h-[320px]">
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Resolution Overview</h3>
                <p className="text-[12px] text-slate-500 mt-1 mb-8">Status of patraks</p>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-[180px] h-[90px] relative overflow-hidden flex justify-center mt-auto">
                    <ResponsiveContainer width="100%" height="200%">
                      <PieChart>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius="75%"
                          outerRadius="100%"
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {gaugeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2">
                       <span className="text-[28px] font-black text-slate-900 leading-none">{stats.active_entries}</span>
                       <span className="text-[12px] font-bold text-slate-500 mt-1">Active</span>
                    </div>
                  </div>

                  <div className="w-full mt-auto pt-6 border-t border-slate-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
                        <span className="text-[12px] font-bold text-slate-800">Active</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-slate-800">{stats.active_entries}</span>
                        <span className="text-[11px] text-slate-500 font-medium w-10 text-right">({activePercent}%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]"></div>
                        <span className="text-[12px] font-bold text-slate-800">Closed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-slate-800">{stats.closed_entries}</span>
                        <span className="text-[11px] text-slate-500 font-medium w-10 text-right">({closedPercent}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
             </motion.div>

             {/* Top Performers Progress Bars */}
             <motion.div variants={itemVariants} className="xl:col-span-4 bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col h-[320px]">
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Top Performers</h3>
                <p className="text-[12px] text-slate-500 mt-1 mb-6">By volume processed</p>
                
                <div className="flex-1 flex flex-col justify-around py-2">
                  {topPerformers.length > 0 ? topPerformers.map(item => (
                    <div key={item.name} className="flex items-center gap-4 group">
                      <div className="flex items-center gap-2.5 w-[110px]">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100" style={{ color: item.fill }}>
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{item.name}</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.fill }}></div>
                      </div>
                      <span className="text-[11px] font-black text-slate-800 w-8 text-right">{item.value}%</span>
                    </div>
                  )) : (
                    <span className="text-xs font-bold text-slate-400">Not enough data</span>
                  )}
                </div>
             </motion.div>
          </div>

        </motion.div>
      </div>
    </Layout>
  )
}
