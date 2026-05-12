import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/roleGuard'
import api from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import {
  LayoutDashboard,
  FileText,
  ScanLine,
  BarChart3,
  Users,
  History,
  Settings,
  LogOut,
  X,
  Search,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/letters', label: 'Entry Form', icon: FileText },
  { path: '/scanner', label: 'Scanner', icon: ScanLine },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/users', label: 'Users', icon: Users, requireAdmin: true },
  { path: '/logs', label: 'System Logs', icon: History },
]

const PAGES = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/letters', label: 'Entry Form', icon: FileText },
  { path: '/scanner', label: 'Scanner', icon: ScanLine },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/users', label: 'Users', icon: Users, requireAdmin: true },
  { path: '/logs', label: 'System Logs', icon: History },
  { path: '/settings', label: 'Account Settings', icon: Settings },
]


export default function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showScrbLogo, setShowScrbLogo] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowScrbLogo(prev => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState({ entries: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const navigate = useNavigate()
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const desktopProfileRef = useRef(null)
  const mobileProfileRef = useRef(null)

  useEffect(() => {
    async function fetchSearch() {
      if (!debouncedSearch.trim()) {
        setSearchResults({ entries: [], users: [] })
        return
      }
      setIsSearching(true)
      try {
        const query = debouncedSearch.trim()
        const promises = [api.get('/api/entries', { params: { search: query, per_page: 5 } })]

        if (user?.role === ROLES.ADMIN) {
          promises.push(api.get('/api/admin/users', { params: { search: query, per_page: 3 } }).catch(() => ({ data: { items: [] } })))
        }

        const results = await Promise.all(promises)

        setSearchResults({
          entries: results[0]?.data?.items || [],
          users: results[1]?.data?.items || []
        })
      } catch (err) {
        console.error('Search failed:', err)
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
        setPopupPosition({ top: rect.top + 8, left: rect.right + 8 })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isSearchFocused])

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect()
      setPopupPosition({ top: rect.top + 8, left: rect.right + 8 })
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

  const handleCollapsedSearchClick = () => {
    onToggle()
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 150)
  }

  useEffect(() => {
    function handleClickOutsideSearch(event) {
      const popup = document.getElementById('search-popup')
      if (searchRef.current && !searchRef.current.contains(event.target) && (!popup || !popup.contains(event.target))) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSearch)
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch)
  }, [])

  useEffect(() => {
    function handleClickOutsideProfile(event) {
      if (
        (desktopProfileRef.current && !desktopProfileRef.current.contains(event.target)) &&
        (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target))
      ) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideProfile)
    return () => document.removeEventListener('mousedown', handleClickOutsideProfile)
  }, [])

  useEffect(() => {
    onMobileClose?.()
  }, [location.pathname])

  const visibleItems = navItems.filter(item => {
    if (item.requireAdmin && user?.role !== ROLES.ADMIN) return false
    return true
  })

  const handleNavClick = () => {
    onMobileClose?.()
  }

  const searchInputClass = "w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-[13.5px] outline-none placeholder:text-slate-400 focus:ring-1 focus:ring-slate-400 dark:focus:ring-neutral-700 transition-all text-slate-800 dark:text-neutral-200"

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex shrink-0 flex-col gap-4 p-4 border-r border-slate-200/60 dark:border-neutral-800/80 sticky top-0 h-screen h-dvh bg-white dark:bg-[#0c0c0e] z-50 overflow-hidden"
      >
        {/* Acme-style Selector Header */}
        <div 
          onClick={onToggle}
          className={`flex items-center gap-2.5 p-1 rounded-xl cursor-pointer select-none transition-all duration-150 ${
            isCollapsed ? 'justify-center hover:bg-slate-50 dark:hover:bg-neutral-900' : 'hover:bg-slate-50 dark:hover:bg-neutral-900 w-full'
          }`}
        >
          {/* Logo container styled transparently with no background */}
          <div className="h-10 w-10 flex items-center justify-center shrink-0">
            <div className="w-[34px] h-[34px] relative">
              <motion.img
                src="/scrb-logo.png"
                alt="Logo"
                className="w-[34px] h-[34px] object-contain absolute inset-0"
                animate={{ opacity: showScrbLogo ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <motion.img
                src="/Gujarat_Police.png"
                alt="Gujarat Police Logo"
                className="w-[34px] h-[34px] object-contain absolute inset-0"
                animate={{ opacity: !showScrbLogo ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 flex flex-col text-left min-w-0">
              <span className="text-[13.5px] font-bold text-slate-800 dark:text-neutral-200 truncate leading-none">Patrak Tracking</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-semibold">System</span>
            </div>
          )}
        </div>

        {/* Search Bar matching precise input details */}
        <div className="relative" ref={searchRef}>
          {isCollapsed ? (
            <button
              onClick={handleCollapsedSearchClick}
              title="Search System"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all duration-150 mx-auto"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <form onSubmit={handleSearch}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500 z-10 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  placeholder="Search by ID, Title…"
                  className={searchInputClass}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                />
              </form>
            </motion.div>
          )}

          {createPortal(
            <AnimatePresence>
              {isSearchFocused && (searchQuery.trim() || searchResults.entries?.length > 0 || searchResults.users?.length > 0) && (
                <motion.div
                  id="search-popup"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="fixed w-[420px] bg-white dark:bg-[#121214] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-[9999] overflow-y-auto no-scrollbar"
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
                      {/* Pages suggestions with custom image-style shortcuts */}
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
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-[13.5px] font-medium text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                            >
                              <page.icon className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                              <span className="flex-1 truncate">{page.label}</span>
                              <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-[10px] text-slate-400 dark:text-neutral-500 font-semibold select-none tracking-wide h-[18px] flex items-center">
                                {shortcut}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Users results - structured with sequence-style shortcuts just like 'My profile' */}
                      {searchResults.users?.length > 0 && (
                        <>
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800/60" />
                          <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                            Users
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {searchResults.users.map(u => (
                              <button
                                key={`user-${u.id}`}
                                onClick={() => handleSuggestionClick('/admin/users')}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-[13.5px] text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                              >
                                <Users className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate">{u.username}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-neutral-500 truncate mt-0.5">{u.email}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 select-none">
                                  <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-[9px] text-slate-400 dark:text-neutral-500 font-bold h-[17px] flex items-center">⌘K</span>
                                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">➔</span>
                                  <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-[9px] text-slate-400 dark:text-neutral-500 font-bold h-[17px] flex items-center">U</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Entries results - custom list alignment */}
                      {searchResults.entries?.length > 0 && (
                        <>
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800/60" />
                          <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                            Recent Entries
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {searchResults.entries.map(entry => (
                              <button
                                key={`entry-${entry.id}`}
                                onClick={() => handleSuggestionClick(`/letters/${entry.id}`)}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-[13.5px] text-left transition-all duration-150 text-slate-700 dark:text-neutral-300"
                              >
                                <FileText className="h-[18px] w-[18px] text-slate-400 dark:text-neutral-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate">{entry.subject}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                                    <span>{entry.unique_id}</span>
                                    <span>•</span>
                                    <span className="truncate">{entry.sender_name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 select-none">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border h-[17px] flex items-center tracking-wide ${
                                    entry.priority === 'HIGH' ? 'bg-red-50/50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400' :
                                    entry.priority === 'MEDIUM' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400' :
                                    'bg-slate-50 border-slate-100 text-slate-500 dark:bg-neutral-800/40 dark:border-neutral-800 dark:text-slate-400'
                                  }`}>
                                    {entry.priority}
                                  </span>
                                </div>
                              </button>
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
        </div>

        {/* Section label matches reference text: Platform */}
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-slate-400/85 dark:text-neutral-500 uppercase tracking-widest px-1 mt-2 mb-1">
            Platform
          </div>
        )}

        {/* Navigation list structured precisely like the image */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (location.pathname !== item.path) {
                    navigate(item.path);
                  }
                }}
                className={`group flex items-center gap-2.5 px-3 py-2 text-[13.5px] transition-all duration-150 select-none ${
                  isActive
                    ? 'border border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/40 dark:bg-neutral-900/30 rounded-xl text-slate-800 dark:text-slate-100 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-semibold'
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-neutral-500'
                }`} />
                
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Profile Selector Footer matches header layout detail */}
        <div className="border-t border-slate-200/50 dark:border-neutral-800/80 pt-3 flex flex-col gap-2 shrink-0 relative" ref={desktopProfileRef}>
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 flex flex-col`}
              >
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  Account Options
                </div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            title="Account Options"
            className={`flex items-center gap-2.5 p-1 rounded-xl cursor-pointer select-none transition-all duration-150 ${
              isCollapsed ? 'justify-center hover:bg-slate-50 dark:hover:bg-neutral-900' : 'hover:bg-slate-50 dark:hover:bg-neutral-900 w-full'
            }`}
          >
            {/* Round avatar wrapper */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm relative">
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="flex flex-col text-left">
                  <span className="text-[13.5px] font-bold text-slate-800 dark:text-neutral-200 truncate leading-none">{user?.username || 'admin'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-semibold">{user?.email || 'admin@scrb.gov.in'}</span>
                </div>
                <ChevronsUpDown className={`h-4 w-4 text-slate-400 dark:text-neutral-500 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MOBILE SIDEBAR - Matches the visual alignment */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden fixed left-0 top-0 h-screen h-dvh w-[260px] shadow-2xl z-50 flex flex-col border-r border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-[#0c0c0e] p-4"
          >
            {/* Mobile Header Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-neutral-800/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 relative">
                    <motion.img
                      src="/scrb-logo.png"
                      alt="Logo"
                      className="w-8 h-8 object-contain absolute inset-0"
                      animate={{ opacity: showScrbLogo ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.img
                      src="/Gujarat_Police.png"
                      alt="Gujarat Police Logo"
                      className="w-8 h-8 object-contain absolute inset-0"
                      animate={{ opacity: !showScrbLogo ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200 leading-none">Patrak Tracking</span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium leading-none">System</span>
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 flex items-center justify-center hover:scale-105 transition shadow-sm text-slate-600 dark:text-neutral-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="py-3">
              <div className="relative">
                <form onSubmit={handleSearch}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500 z-10 pointer-events-none" />
                  <input
                    placeholder="Search by ID, Title…"
                    className={searchInputClass}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      handleNavClick();
                      if (location.pathname !== item.path) {
                        navigate(item.path);
                      }
                    }}
                    className={`group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ${
                      isActive
                        ? 'border border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/40 dark:bg-neutral-900/30 rounded-xl text-slate-800 dark:text-slate-100 font-semibold'
                        : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium'
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Mobile Footer Profile Selector */}
            <div className="border-t border-slate-200/50 dark:border-neutral-800/80 pt-3 relative" ref={mobileProfileRef}>
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 flex flex-col"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                      Account Options
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleNavClick();
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Log out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div 
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-3 p-1 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 w-full"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm relative">
                  <span>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate leading-none">{user?.username || 'admin'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-medium">{user?.email || 'admin@scrb.gov.in'}</span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-slate-400 dark:text-neutral-500 shrink-0 transition-transform" />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
