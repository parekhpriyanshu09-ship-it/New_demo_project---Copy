import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export default function DepartmentChart({ data = [], title = "Operational Volume" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="card-premium h-full flex flex-col overflow-hidden"
    >
      <div className="p-8 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-red-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-heading">{title}</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Real-time distribution of letter flow across all departments.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 text-emerald-600">
              <TrendingUp size={10} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">+8.4%</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[340px] px-6 pb-6 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 12 }}
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '16px',
              }}
              itemStyle={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}
              labelStyle={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value) => [`${value} Patraks`, 'Inventory']}
            />
            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              barSize={45}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stable Sync</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node: SCRB_SRV_01</p>
      </div>
    </motion.div>
  )
}