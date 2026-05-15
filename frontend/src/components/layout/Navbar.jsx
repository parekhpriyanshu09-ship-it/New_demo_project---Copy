import { useState, useEffect } from 'react'
import {
  Bell,
  Calendar,
  Menu
} from 'lucide-react'
import GlobalSearch from './GlobalSearch'

export default function Navbar({ sidebarCollapsed, onMenuClick }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Exact date formatting to match the reference image: "May 09, 2026"
  const dateStr = currentTime.toLocaleDateString("en-US", { 
    month: "short", 
    day: "2-digit", 
    year: "numeric" 
  })

  // Exact day and time formatting to match the reference image: "Saturday, 11:57 AM"
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" })
  const timeStr = currentTime.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: true 
  })

  return (
    <header
      className="
        bg-white/70 dark:bg-neutral-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 px-6 py-3 flex items-center justify-between gap-4
        sticky top-0 z-40
        transition-all duration-300
        w-full
      "
    >
      {/* Left side: Hamburger + Greeting */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 lg:w-[250px] shrink-0">
        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition shrink-0 border border-slate-200/50 dark:border-white/10"
        >
          <Menu className="h-4.5 w-4.5 text-slate-800 dark:text-white" />
        </button>

        {/* Greeting Text */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
          Welcome back, admin!
        </h1>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex flex-1 justify-center max-w-[550px] w-full px-4">
        <GlobalSearch />
      </div>

      {/* Right side: Notification + Date & Time */}
      <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/60 dark:bg-neutral-950/40 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-slate-200/50 dark:border-neutral-800/40 shadow-xs shrink-0">
        {/* Notification Circle Icon Button */}
        <button className="relative h-8 w-8 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer">
          <Bell className="h-4 w-4 text-slate-700 dark:text-neutral-300 stroke-[2.25]" />
          {/* Circular Red Notification Dot */}
          <span className="absolute top-[7px] right-[7px] h-2 w-2 rounded-full bg-red-500 border border-white dark:border-neutral-800" />
        </button>

        {/* Thin vertical separator line */}
        <div className="h-6 border-l border-slate-200/80 dark:border-neutral-800/80" />

        {/* Calendar Rounded-Square Icon Button */}
        <div className="h-8 w-8 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs">
          <Calendar className="h-4 w-4 text-[#5f62f1] dark:text-[#818cf8] stroke-[2.25]" />
        </div>

        {/* Stacked Date & Time Text Column */}
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="font-extrabold text-[12.5px] text-slate-800 dark:text-neutral-200 tracking-tight leading-none whitespace-nowrap">
            {dateStr}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-neutral-400 font-bold tracking-tight mt-0.5 leading-none whitespace-nowrap">
            {dayName}, {timeStr}
          </span>
        </div>
      </div>
    </header>
  )
}
