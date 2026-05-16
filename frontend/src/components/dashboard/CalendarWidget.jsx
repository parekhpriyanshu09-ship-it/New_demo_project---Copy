import { useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarWidget({ markedDates = [], onDateClick, selectedDate, compact = false, viewType = 'inward' }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDay = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const getDateStr = (day) => {
    if (!day) return null
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isSelected = (day) => selectedDate === getDateStr(day)

  // Build cells
  const cells = []
  for (let i = startingDay - 1; i >= 0; i--) cells.push({ d: prevMonthLastDay - i, muted: true })
  for (let i = 1; i <= daysInMonth; i++) {
    const today = isToday(i)
    const selected = isSelected(i)
    cells.push({ d: i, active: selected || (today && !selectedDate), dot: markedDates.includes(getDateStr(i)) })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) cells.push({ d: i, muted: true })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
          <span className="ml-2 font-semibold">{MONTHS[month]} {year}</span>
        </div>
        <button
          onClick={() => {
            const today = new Date()
            setCurrentDate(today)
            if (onDateClick) onDateClick(getDateStr(today.getDate()))
          }}
          className="text-xs px-3 py-1 rounded-md border border-border hover:bg-accent"
        >
          Today
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-semibold mb-1">
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((c, i) => (
          <div
            key={i}
            onClick={() => { if (!c.muted && onDateClick) onDateClick(getDateStr(c.d)) }}
            className="aspect-square flex flex-col items-center justify-center relative rounded-md cursor-pointer"
          >
            <div
              className={`h-8 w-8 flex items-center justify-center rounded-full ${
                c.active ? 'text-white' : c.muted ? 'text-muted-foreground/40' : 'hover:bg-accent'
              }`}
              style={c.active ? { background: 'var(--gradient-primary)' } : undefined}
            >
              {c.d}
            </div>
            {c.dot && !c.active && (
              <div className="h-1 w-1 rounded-full bg-primary absolute bottom-1" />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Total Received Today</div>
          <div className="text-2xl font-bold">18</div>
        </div>
        <div
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md"
          style={{ background: 'oklch(0.70 0.17 165 / 0.12)', color: 'var(--cat-green)' }}
        >
          <TrendingUp className="h-3 w-3" /> 12.5% vs yesterday
        </div>
      </div>
    </div>
  )
}
