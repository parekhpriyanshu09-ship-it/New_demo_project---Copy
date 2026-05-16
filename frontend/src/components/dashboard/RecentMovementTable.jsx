import { motion } from 'framer-motion'
import { Eye, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { formatShortDate } from '../../utils/dateUtils'

const statusStyle = (s) =>
  s?.toUpperCase() === 'RECEIVED' || s?.toUpperCase() === 'COMPLETED'
    ? { bg: 'oklch(0.70 0.17 165 / 0.15)', color: 'var(--cat-green)' }
    : { bg: 'oklch(0.72 0.18 55 / 0.15)', color: 'var(--cat-orange)' }

export default function RecentMovementTable({ onSelect, selectedMovementId }) {
  const navigate = useNavigate()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await api.get('/api/entries', { params: { per_page: 5 } })
        const items = res.data.items || []
        const formattedMovements = items.map(entry => ({
          id: entry.unique_id.startsWith('PTRK') ? entry.unique_id : `#${entry.unique_id.slice(0, 8)}`,
          original_id: entry.id, // backend UUID
          title: entry.subject,
          from: entry.sender_name,
          to: entry.current_department,
          time: formatShortDate(entry.received_date),
          status: entry.status || 'IN TRANSIT',
          raw: entry
        }))
        setMovements(formattedMovements)
        
        if (formattedMovements.length > 0 && !selectedMovementId && onSelect) {
          onSelect(formattedMovements[0])
        }
      } catch (error) {
        console.error('Failed to fetch recent movements:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, []) // Empty dependency array so it only fetches on mount

  // ... (we'll keep the rest of the render the same)
  return (
    <div className="xl:col-span-2 bg-card rounded-xl p-5 border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Patrak Movement</h3>
        <button onClick={() => navigate('/letters')} className="text-xs text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center min-h-[200px]">
             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : movements.length === 0 ? (
          <div className="h-full flex items-center justify-center min-h-[200px] text-sm text-muted-foreground">
             No recent movements found.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground font-semibold">
                <th className="pb-3 pr-3">ID</th>
                <th className="pb-3 pr-3">TITLE</th>
                <th className="pb-3 pr-3">FROM</th>
                <th className="pb-3 pr-3">TO</th>
                <th className="pb-3 pr-3">LATEST UPDATE</th>
                <th className="pb-3 pr-3">STATUS</th>
                <th className="pb-3">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((r, i) => {
                const s = statusStyle(r.status)
                const isSelected = selectedMovementId === r.id
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onSelect && onSelect(r)}
                    className="border-t border-border cursor-pointer transition-colors hover:opacity-80"
                    style={isSelected ? { background: 'oklch(0.70 0.17 165 / 0.12)' } : {}}
                  >
                    <td className="py-3 pr-3 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {r.id}
                    </td>
                    <td className="py-3 pr-3 max-w-[200px] truncate" title={r.title}>{r.title}</td>
                    <td className="py-3 pr-3 text-muted-foreground truncate max-w-[120px]">{r.from}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{r.to}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{r.time}</td>
                    <td className="py-3 pr-3">
                      <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: s.bg, color: s.color }}>
                        {r.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">
                      <button 
                        className="p-1.5 rounded transition-colors hover:bg-[oklch(0.70_0.17_165/0.12)] hover:text-[color:var(--cat-green)]" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/letters/${r.original_id}`); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
