import { motion } from 'framer-motion'
import { Building2, Shield, FileText, AlertTriangle, Activity, Users, Send } from 'lucide-react'

const departmentIcons = {
  'DG Office': Building2,
  'CID Crime': Shield,
  'Law & Order': Users,
  Training: FileText,
  'TS & SCRB': Activity,
}

const getDepartmentColor = (dept) => {
  const colors = {
    'DG Office': 'var(--cat-purple)',
    'CID Crime': 'var(--cat-green)',
    'Law & Order': 'var(--cat-orange)',
    Training: 'var(--cat-pink)',
    'TS & SCRB': 'var(--cat-teal)'
  }
  return colors[dept] || 'var(--cat-blue)'
}

export default function LiveTimeline({ movement }) {
  if (!movement) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-card h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
        Select a patrak to view timeline
      </div>
    )
  }

  // Generate timeline based on movement
  const items = [
    { 
      name: movement.from, 
      sub: 'Entry Created & Dispatched', 
      time: movement.time, 
      status: 'Completed', 
      color: getDepartmentColor(movement.from), 
      icon: departmentIcons[movement.from] || Send 
    },
    { 
      name: movement.to, 
      sub: movement.status === 'RECEIVED' ? 'Received & Acknowledged' : 'In Transit', 
      time: movement.status === 'RECEIVED' ? movement.time : '', 
      status: movement.status === 'RECEIVED' ? 'Completed' : 'Current', 
      color: movement.status === 'RECEIVED' ? getDepartmentColor(movement.to) : 'var(--cat-orange)', 
      icon: departmentIcons[movement.to] || Building2 
    }
  ]

  // Add a pending final step just to show progress like the original design
  if (movement.status !== 'RECEIVED') {
    items.push({
      name: movement.to,
      sub: 'Pending Receipt',
      time: '',
      status: '',
      color: 'var(--muted-foreground)',
      icon: departmentIcons[movement.to] || Building2
    })
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card h-full flex flex-col">
      <h3 className="font-semibold mb-4">Live Patrak Movement</h3>
      <div 
        className="text-xs mb-4 font-medium flex items-center gap-2 p-2 rounded-lg border"
        style={{ background: 'oklch(0.70 0.17 165 / 0.12)', borderColor: 'oklch(0.70 0.17 165 / 0.25)', color: 'var(--cat-green)' }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--cat-green)' }} />
        Tracking: <span className="font-bold">{movement.id}</span>
      </div>
      <div className="space-y-1 flex-1">
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 relative pb-4"
            >
              {i < items.length - 1 && (
                <div className="absolute left-[18px] top-9 bottom-0 w-px bg-border" />
              )}
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 z-10"
                style={{ background: `color-mix(in oklab, ${it.color} 15%, transparent)` }}
              >
                <Icon className="h-4 w-4" style={{ color: it.color }} />
              </div>
              <div className="flex-1 flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.sub}</div>
                  {it.time && <div className="text-xs text-muted-foreground mt-0.5">{it.time}</div>}
                </div>
                {it.status && (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{
                      background: it.status === 'Completed' ? 'oklch(0.70 0.17 165 / 0.15)' : 'oklch(0.62 0.18 250 / 0.15)',
                      color: it.status === 'Completed' ? 'var(--cat-green)' : 'var(--cat-blue)',
                    }}
                  >
                    {it.status}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
