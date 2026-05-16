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
  PlusCircle,
  QrCode,
  FilePenLine,
  LocateFixed,
  BarChart3,
  Users,
  History,
  Settings,
  LogOut,
  X,
  Search,
  ChevronsUpDown,
  ChevronDown,
  HelpCircle
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'New Tapal Entry',
    icon: PlusCircle,
    children: [
      { path: '/scanner', label: 'With QR Code', icon: QrCode },
      { path: '/letters?action=new', matchPath: '/letters', label: 'Without QR Code', icon: FilePenLine },
    ],
  },
  { path: '/track-my-tapal', label: 'Track My Tapal', icon: LocateFixed },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/how-it-works', label: 'How It Works', icon: HelpCircle },
]

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

const adminItems = [
  { path: '/admin/users', label: 'Users', icon: Users, requireAdmin: true },
  { path: '/logs', label: 'System Logs', icon: History },
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

  const navigate = useNavigate()

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const desktopProfileRef = useRef(null)
  const mobileProfileRef = useRef(null)
  const [openGroups, setOpenGroups] = useState({ 'New Tapal Entry': true })


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

  const visibleAdminItems = adminItems.filter(item => {
    if (item.requireAdmin && user?.role !== ROLES.ADMIN) return false
    return true
  })

  const isItemActive = (item) => {
    if (item.matchPath) return location.pathname === item.matchPath
    if (item.path === '/') return location.pathname === '/'
    return item.path && location.pathname.startsWith(item.path)
  }

  const isGroupActive = (item) => item.children?.some(child => isItemActive(child))

  const toggleGroup = (label) => {
    if (isCollapsed) {
      onToggle()
      setOpenGroups(prev => ({ ...prev, [label]: true }))
      return
    }
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleNavClick = () => {
    onMobileClose?.()
  }

  const renderNavItem = (item, { mobile = false, nested = false } = {}) => {
    const Icon = item.icon
    const active = isItemActive(item)
    const compact = isCollapsed && !mobile

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={compact ? item.label : undefined}
        onClick={() => {
          handleNavClick()
          if (location.pathname !== (item.matchPath || item.path)) {
            navigate(item.path)
          }
        }}
        className={`group relative flex items-center ${mobile ? 'gap-3 px-3 py-2.5 text-sm' : 'gap-2.5 px-3 py-2 text-sm'} transition-all duration-200 select-none ${nested ? (mobile ? 'ml-6' : compact ? 'mx-auto justify-center' : 'ml-6') : compact ? 'mx-auto justify-center h-10 w-10 px-0' : ''
          } ${active
            ? 'border border-blue-400/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 rounded-xl text-slate-900 dark:text-white font-bold shadow-[0_0_24px_rgba(37,99,235,0.16)]'
            : 'text-slate-600 dark:text-neutral-400 hover:bg-blue-500/10 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-[0_0_18px_rgba(59,130,246,0.12)] rounded-xl font-semibold'
          }`}
      >
        <span className={`${mobile ? 'h-6 w-6' : 'h-[18px] w-[18px]'} shrink-0 flex items-center justify-center`}>
          <Icon className={`${mobile ? 'h-4 w-4' : 'h-[18px] w-[18px]'} shrink-0 transition-transform group-hover:scale-105 ${active ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-neutral-500'
            }`} />
        </span>

        {!compact && <span className="flex-1 truncate">{item.label}</span>}

        {compact && (
          <span className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-blue-400/20 bg-slate-950/95 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-blue-950/30 transition-opacity group-hover:opacity-100">
            {item.label}
          </span>
        )}
      </NavLink>
    )
  }

  const renderNavGroup = (item, { mobile = false } = {}) => {
    const Icon = item.icon
    const compact = isCollapsed && !mobile
    const groupActive = isGroupActive(item)
    const isOpen = openGroups[item.label] || groupActive

    return (
      <div key={item.label} className="flex flex-col gap-1">
        <button
          type="button"
          title={compact ? item.label : undefined}
          onClick={() => toggleGroup(item.label)}
          className={`group relative flex items-center ${mobile ? 'gap-3 px-3 py-2.5 text-sm' : 'gap-2.5 px-3 py-2 text-sm'} transition-all duration-200 select-none text-left ${compact ? 'mx-auto h-10 w-10 justify-center px-0' : ''
            } ${groupActive
              ? 'border border-blue-400/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 rounded-xl text-slate-900 dark:text-white font-bold shadow-[0_0_24px_rgba(37,99,235,0.16)]'
              : 'text-slate-600 dark:text-neutral-400 hover:bg-blue-500/10 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-[0_0_18px_rgba(59,130,246,0.12)] rounded-xl font-semibold'
            }`}
        >
          <Icon className={`${mobile ? 'h-4 w-4' : 'h-[18px] w-[18px]'} shrink-0 transition-transform group-hover:scale-105 ${groupActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-neutral-500'
            }`} />
          {!compact && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
          {compact && (
            <span className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-blue-400/20 bg-slate-950/95 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-blue-950/30 transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {isOpen && !compact && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden flex flex-col gap-1"
            >
              {item.children.map(child => renderNavItem(child, { mobile, nested: true }))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const renderSidebarSearch = ({ mobile = false } = {}) => (
    <div className={mobile ? 'py-1' : 'relative py-1'} ref={searchRef}>
      {isCollapsed && !mobile ? (
        <button
          onClick={handleCollapsedSearchClick}
          title="Search System"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-500 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-[0_0_18px_rgba(59,130,246,0.12)] transition-all duration-200 mx-auto"
        >
          <Search className="h-4 w-4" />
          <span className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-blue-400/20 bg-slate-950/95 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-blue-950/30 transition-opacity group-hover:opacity-100">
            Search System
          </span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="pt-2"
        >
          {/* Floating Label */}
          <div className="px-2 mb-2 flex items-center gap-1.5 opacity-90">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 tracking-[0.15em] uppercase">Global Search</span>
          </div>

          <div className="relative group">
            {/* Animated glowing highlight background when not focused */}
            {!isSearchFocused && (
              <div className="absolute -inset-[1px] rounded-[18px] bg-gradient-to-r from-blue-300 to-indigo-300 dark:from-blue-600 dark:to-indigo-600 opacity-30 blur-[2px] animate-pulse pointer-events-none" />
            )}

            <form onSubmit={handleSearch} className="relative flex items-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl border-[1.5px] border-blue-200/80 dark:border-indigo-500/30 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-[1px] focus-within:shadow-lg focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20 transition-all duration-300">
              {/* Inner highlight for glassmorphism */}
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none" />

              <Search className={`absolute left-3.5 h-[18px] w-[18px] z-10 pointer-events-none transition-colors duration-200 ${isSearchFocused ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-neutral-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />

              <input
                ref={searchInputRef}
                placeholder="Search by ID, Title..."
                className="w-full bg-transparent pl-10 pr-12 py-3 text-sm font-semibold text-slate-800 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 placeholder:font-medium outline-none rounded-2xl relative z-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
              />

              {/* Command Hint */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                <span className={`flex items-center justify-center h-[22px] px-2 rounded-md border text-xs font-bold transition-colors ${isSearchFocused ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-400 dark:text-neutral-500'} shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]`}>
                  /
                </span>
              </div>
            </form>
          </div>
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
                left: mobile ? 16 : popupPosition.left,
                top: mobile ? 160 : popupPosition.top,
                maxHeight: '480px',
                maxWidth: mobile ? 'calc(100vw - 32px)' : undefined
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
                        '/': 'D',
                        '/letters': 'N',
                        '/scanner': 'S',
                        '/reports': 'R',
                        '/admin/users': 'U',
                        '/logs': 'L',
                        '/settings': ',',
                      }
                      const shortcut = shortcutMap[page.path] || '/'

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
                                  <span>-</span>
                                  <span className="truncate">{entry.sender_name}</span>
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border h-[17px] flex items-center tracking-wide ${entry.priority === 'HIGH' ? 'bg-red-50/50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400' :
                                entry.priority === 'MEDIUM' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400' :
                                  'bg-slate-50 border-slate-100 text-slate-500 dark:bg-neutral-800/40 dark:border-neutral-800 dark:text-slate-400'
                                }`}>
                                {entry.priority}
                              </span>
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
    </div>
  )

  const renderNavigation = ({ mobile = false } = {}) => (
    <>
      {visibleItems.map(item => (
        <div key={item.path || item.label} className="flex flex-col gap-1">
          {item.children ? renderNavGroup(item, { mobile }) : renderNavItem(item, { mobile })}

        </div>
      ))}
      {visibleAdminItems.length > 0 && (
        <>
          {!isCollapsed || mobile ? (
            <div className="text-xs font-bold text-slate-400/85 dark:text-neutral-500 uppercase tracking-widest px-1 mt-3 mb-1">
              Administration
            </div>
          ) : (
            <div className="my-2 border-t border-slate-200/50 dark:border-neutral-800/80" />
          )}
          {visibleAdminItems.map(item => renderNavItem(item, { mobile }))}
        </>
      )}
    </>
  )

  const searchInputClass = "w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-slate-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-neutral-200 outline-none placeholder:text-slate-500 dark:placeholder:text-neutral-400 placeholder:font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 focus:shadow-lg focus:-translate-y-[1px] hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-[1px] transition-all duration-300 shadow-sm"

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
          className={`flex items-center gap-2.5 p-1 rounded-xl cursor-pointer select-none transition-all duration-150 ${isCollapsed ? 'justify-center hover:bg-slate-50 dark:hover:bg-neutral-900' : 'hover:bg-slate-50 dark:hover:bg-neutral-900 w-full'
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
              <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 truncate leading-none">Patrak Tracking</span>
              <span className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-semibold">System</span>
            </div>
          )}
        </div>

        {/* Section label matches reference text: Platform */}
        {!isCollapsed && (
          <div className="text-xs font-bold text-slate-400/85 dark:text-neutral-500 uppercase tracking-widest px-1 mt-2 mb-1">
            Platform
          </div>
        )}

        {/* Navigation list structured precisely like the image */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
          {renderNavigation()}
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
                <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  Account Options
                </div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
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
            className={`flex items-center gap-2.5 p-1 rounded-xl cursor-pointer select-none transition-all duration-150 ${isCollapsed ? 'justify-center hover:bg-slate-50 dark:hover:bg-neutral-900' : 'hover:bg-slate-50 dark:hover:bg-neutral-900 w-full'
              }`}
          >
            {/* Round avatar wrapper */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm relative">
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 truncate leading-none">{user?.username || 'admin'}</span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-semibold">{user?.email || 'admin@scrb.gov.in'}</span>
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
                  <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-medium leading-none">System</span>
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
            <div className="hidden">
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
              {renderNavigation({ mobile: true })}
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
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                      Account Options
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleNavClick();
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
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
                    <span className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-1 leading-none font-medium">{user?.email || 'admin@scrb.gov.in'}</span>
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
