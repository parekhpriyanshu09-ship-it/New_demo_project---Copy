import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-app)", backgroundAttachment: "fixed" }}>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => {
            if (window.innerWidth < 1024) {
              setMobileSidebarOpen(!mobileSidebarOpen)
            } else {
              setSidebarCollapsed(!sidebarCollapsed)
            }
          }}
        />

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0 flex-1"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}