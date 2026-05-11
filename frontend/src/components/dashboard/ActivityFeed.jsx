import { motion } from 'framer-motion'
import { Activity, Clock, ArrowRight } from 'lucide-react'

function timeAgo(dateString) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const STATUS_COLORS = [
  'bg-red-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-sky-500'
]

export default function ActivityFeed({ activities = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="card-premium overflow-hidden bg-white"
    >
      {/* Compact Header */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-100">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading">Activity Intelligence</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Operations</p>
          </div>
        </div>
        <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Compact Scrollable List */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
        {!activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <Activity size={32} className="opacity-20 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {activities.map((activity, index) => {
              const statusColor = STATUS_COLORS[index % STATUS_COLORS.length]

              return (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Status Indicator */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${statusColor} ring-4 ring-white shadow-sm`} />
                  </div>

                  {/* Subject & Dept */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 truncate group-hover:text-red-600 transition-colors">
                      {activity.entry_subject || 'Scan Operation'}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        {activity.department || 'N/A'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-500">
                        {activity.received_by || 'Staff'}
                      </span>
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 rounded-lg shadow-sm flex-shrink-0">
                    <Clock size={10} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">
                      {timeAgo(activity.received_at)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Audit Log v4.2</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Secure</span>
        </div>
      </div>
    </motion.div>
  )
}