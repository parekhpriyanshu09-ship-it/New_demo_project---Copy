import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp } from 'lucide-react'

const catColors = [
  { color: 'var(--cat-purple)', soft: 'oklch(0.55 0.22 290 / 0.12)' },
  { color: 'var(--cat-green)',  soft: 'oklch(0.70 0.17 165 / 0.12)' },
  { color: 'var(--cat-orange)', soft: 'oklch(0.72 0.18 55 / 0.12)' },
  { color: 'var(--cat-pink)',   soft: 'oklch(0.65 0.22 10 / 0.12)' },
  { color: 'var(--cat-blue)',   soft: 'oklch(0.62 0.18 250 / 0.12)' },
  { color: 'var(--cat-teal)',   soft: 'oklch(0.70 0.12 195 / 0.12)' },
]

const staticTrends = ['12.5', '8.3', '15.7', '10.2', '6.8', '9.1']

export default function StatsCard({ title, value, icon: Icon, chartData, delay = 0, index = 0 }) {
  const cat = catColors[index % 6]
  const trendPercent = staticTrends[index % 6]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08 }}
      className="bg-card rounded-xl p-4 border border-border shadow-card"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{ background: cat.soft }}
        >
          <Icon className="h-5 w-5" style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{title}</div>
          <div className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Patrak</div>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs">
        <TrendingUp className="h-3 w-3" style={{ color: 'var(--cat-green)' }} />
        <span className="font-semibold" style={{ color: 'var(--cat-green)' }}>{trendPercent}%</span>
        <span className="text-muted-foreground">this month</span>
      </div>
      <div className="h-10 -mx-1 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="v" stroke={cat.color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
