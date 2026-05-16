import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ChevronDown, BarChart3, TrendingUp } from 'lucide-react'

export default function MainLineChart({ data }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">DG Office - Patrak Received Analysis</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total This Week', value: '342', icon: BarChart3 },
          { label: 'Total This Month', value: '1,245', icon: BarChart3 },
          { label: 'Daily Average', value: '178', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: 'oklch(0.55 0.22 290 / 0.15)' }}
            >
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              <div className="text-lg font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-56 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cat-purple)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--cat-purple)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ background: 'oklch(0.20 0.04 265)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, padding: '12px' }} 
              itemStyle={{ color: 'white', fontWeight: 600 }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
              wrapperStyle={{ zIndex: 100 }}
              isAnimationActive={false}
              formatter={(value) => [value, 'Received']}
            />
            <Area type="monotone" dataKey="value" stroke="var(--cat-purple)" strokeWidth={2.5} fill="url(#areaG)" activeDot={{ r: 6, fill: "var(--cat-purple)", stroke: "white", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
