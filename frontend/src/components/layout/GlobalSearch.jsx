import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/roleGuard'
import api from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import {
  LayoutDashboard,
  QrCode,
  FilePenLine,
  LocateFixed,
  BarChart3,
  HelpCircle,
  Users,
  History,
  Settings,
  Search
} from 'lucide-react'

const PAGES = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scanner', label: 'With QR Code', icon: QrCode },
  { path: '/letters?action=new', label: 'Without QR Code', icon: FilePenLine },
  { path: '/track-my-tapal', label: 'Track My Tapal', icon: LocateFixed },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  { path: '/admin/users', label: 'Users', icon: Users, requireAdmin: true },
  { path: '/logs', label: 'System Logs', icon: History },
  { path: '/settings', label: 'Account Settings', icon: Settings },
]

export default function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState({ entries: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [hoveredEntry, setHoveredEntry] = useState(null)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    async function fetchSearch() {
      if (!debouncedSearch.trim()) {
        setSearchResults({ entries: [], users: [] })
        return
      }
      setIsSearching(true)

      const query = debouncedSearch.trim()

      const isNlpQuery = /\b(how|from|many|show|total|count|pending|forwarded|received|urgent|physical|fax|email|yesterday|today|last|this|week|month)\b/i.test(query)

      try {
        const entriesRes = await api.get('/api/entries', { params: { search: query, per_page: 5 } }).catch(() => ({ data: { items: [] } }))
        const entries = entriesRes?.data?.items || []

        let users = []
        if (!isNlpQuery && user?.role === ROLES.ADMIN && query.length >= 2) {
          try {
            const usersRes = await api.get('/api/admin/users', { params: { search: query, per_page: 3 } })
            users = usersRes?.data?.items || []
          } catch {
            users = []
          }
        }

        setSearchResults({ entries, users })
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults({ entries: [], users: [] })
      } finally {
        setIsSearching(false)
      }
    }
    fetchSearch()
  }, [debouncedSearch, user])

  useEffect(() => {
    const handleResize = () => {
      if (isSearchFocused && searchRef.current) {
        const rect = searchRef.current.getBoundingClientRect()
        // Anchor to bottom of the search bar
        setPopupPosition({ top: rect.bottom + 8, left: rect.left })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isSearchFocused])

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect()
      // Bottom anchor since it's now in the top navbar
      setPopupPosition({ top: rect.bottom + 8, left: rect.left })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearchFocused(false)
      navigate(`/letters?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (path) => {
    setSearchQuery('')
    setIsSearchFocused(false)
    navigate(path)
  }

  useEffect(() => {
    function handleClickOutsideSearch(event) {
      const popup = document.getElementById('search-popup')
      if (searchRef.current && !searchRef.current.contains(event.target) && (!popup || !popup.contains(event.target))) {
        setIsSearchFocused(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSearch)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSearch)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="relative w-full max-w-[520px] mx-auto px-4" ref={searchRef}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="relative group w-full">
          {!isSearchFocused && (
            <div className="absolute -inset-[1px] rounded-[18px] bg-gradient-to-r from-blue-300 to-indigo-300 dark:from-blue-600 dark:to-indigo-600 opacity-20 blur-[2px] pointer-events-none" />
          )}

          <form onSubmit={handleSearch} className="relative flex items-center bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md focus-within:shadow-lg focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none" />

            <Search className={`absolute left-3.5 h-[18px] w-[18px] z-10 pointer-events-none transition-colors duration-200 ${isSearchFocused ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-neutral-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />

            <input
              ref={searchInputRef}
              placeholder="Search patraks, reports, dates..."
              className="w-full bg-transparent pl-10 pr-12 py-2 text-sm font-semibold text-slate-800 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 placeholder:font-medium outline-none rounded-2xl relative z-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
              <span className={`flex items-center justify-center h-[22px] px-2 rounded-md border text-xs font-bold transition-colors ${isSearchFocused ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-400 dark:text-neutral-500'} shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]`}>
                /
              </span>
            </div>
          </form>
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isSearchFocused && (searchQuery.trim() || searchResults.entries?.length > 0 || searchResults.users?.length > 0) && (
            <motion.div
              id="search-popup"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed w-[420px] md:w-[520px] bg-white dark:bg-[#121214] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-[9999] overflow-y-auto no-scrollbar"
              style={{
                left: popupPosition.left,
                top: popupPosition.top,
                maxHeight: '480px'
              }}
            >
              {isSearching ? (
                <div className="flex items-center justify-center gap-1 py-8">
                  <motion.span className="w-2 h-2 rounded-full bg-slate-400" animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} />
                  <motion.span className="w-2 h-2 rounded-full bg-slate-400" animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} />
                  <motion.span className="w-2 h-2 rounded-full bg-slate-400" animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    {PAGES.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase())).map(page => {
                      const shortcutMap = {
                        '/': '⌘D',
                        '/letters': '⌘N',
                        '/scanner': '⌘S',
                        '/reports': '⌘R',
                        '/admin/users': '⌘U',
                        '/logs': '⌘L',
                        '/settings': '⌘,',
                      }
                      const shortcut = shortcutMap[page.path] || '⌘/'

                      return (
                        <button
                          key={page.path}
                          onClick={() => handleSuggestionClick(page.path)}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-sm font-medium text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                        >
                          <page.icon className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                          <span className="flex-1 truncate">{page.label}</span>
                          <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-xs text-slate-400 dark:text-neutral-500 font-semibold select-none tracking-wide h-[18px] flex items-center">
                            {shortcut}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {searchResults.users?.length > 0 && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-neutral-800/60" />
                      <div className="px-3.5 py-1.5 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                        Users
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {searchResults.users.map(u => (
                          <button
                            key={`user-${u.id}`}
                            onClick={() => handleSuggestionClick('/admin/users')}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-sm text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                          >
                            <Users className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{u.username}</div>
                              <div className="text-xs text-slate-400 dark:text-neutral-500 truncate mt-0.5">{u.email}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 select-none">
                              <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-xs text-slate-400 dark:text-neutral-500 font-bold h-[17px] flex items-center">⌘K</span>
                              <span className="text-xs text-slate-400 dark:text-neutral-500">➔</span>
                              <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-xs text-slate-400 dark:text-neutral-500 font-bold h-[17px] flex items-center">U</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {searchResults.entries?.length > 0 && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-neutral-800/60" />
                      <div className="px-3.5 py-1.5 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                        Recent Entries
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {searchResults.entries.map(entry => (
                          <div
                            key={`entry-${entry.id}`}
                            className="relative"
                            onMouseEnter={(e) => {
                              if (entry.match_contexts?.length > 0) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setHoveredEntry({ entry, x: rect.right + 8, y: rect.top })
                              }
                            }}
                            onMouseLeave={() => setHoveredEntry(null)}
                          >
                            <button
                              onClick={() => handleSuggestionClick(`/letters/${entry.id}`)}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-sm text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                            >
                              <FilePenLine className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{entry.subject}</div>
                                <div className="text-xs text-slate-400 dark:text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                                  <span>{entry.unique_id}</span>
                                  <span>•</span>
                                  <span className="truncate">{entry.sender_name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border h-[17px] flex items-center tracking-wide ${entry.priority === 'HIGH' ? 'bg-red-50/50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400' :
                                  entry.priority === 'MEDIUM' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400' :
                                    'bg-slate-50 border-slate-100 text-slate-500 dark:bg-neutral-800/40 dark:border-neutral-800 dark:text-slate-400'
                                  }`}>
                                  {entry.priority}
                                </span>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {searchQuery.trim() && !searchResults.entries?.length && !searchResults.users?.length && PAGES.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">No results found</div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Hover Tooltip Portaled */}
      {hoveredEntry?.entry?.match_contexts?.length > 0 && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed pointer-events-none z-[10000] max-w-[280px] bg-slate-900/95 dark:bg-white/95 backdrop-blur-sm border border-slate-800 dark:border-white/20 p-3 rounded-xl shadow-2xl flex flex-col gap-2"
          style={{ top: hoveredEntry.y, left: hoveredEntry.x }}
        >
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Matched On
          </div>
          <div className="flex flex-col gap-1.5">
            {hoveredEntry.entry.match_contexts.slice(0, 3).map((ctx, idx) => (
              <div key={idx} className="text-xs text-slate-300 dark:text-slate-700 leading-snug break-words line-clamp-3">
                <span className="font-semibold text-slate-200 dark:text-slate-800 capitalize mr-1">{ctx.field}:</span>
                <span dangerouslySetInnerHTML={{ __html: ctx.snippet }} />
              </div>
            ))}
            {hoveredEntry.entry.match_contexts.length > 3 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                + {hoveredEntry.entry.match_contexts.length - 3} more matches
              </div>
            )}
          </div>
        </motion.div>,
        document.body
      )}

    </div>
  )
}
