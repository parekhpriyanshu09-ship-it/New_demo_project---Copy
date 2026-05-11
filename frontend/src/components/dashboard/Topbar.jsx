import React from "react";
import { Bell, Calendar, Moon } from "lucide-react";

export function Topbar() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="bg-[var(--background)]/60 border-b border-border/50 px-5 py-3 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5 w-full sm:w-auto">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight whitespace-nowrap text-slate-900 dark:text-neutral-100 leading-none">
          Welcome back, admin!
        </h1>
        {/* Compact Horizontal Quick Controls Capsule */}
        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-neutral-900/40 p-1 rounded-full border border-slate-100/60 dark:border-neutral-800/40 shadow-sm shrink-0">
          <button className="h-7 w-7 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition">
            <Moon className="h-3.5 w-3.5 text-slate-700 dark:text-neutral-300" />
          </button>
          <button className="relative h-7 w-7 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition">
            <Bell className="h-3.5 w-3.5 text-slate-700 dark:text-neutral-300" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_25)]" />
          </button>
          <div className="flex items-center gap-2 px-2.5 border-l border-slate-200 dark:border-neutral-800/80 text-[10.5px] font-semibold text-slate-600 dark:text-neutral-400">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{date}</span>
            <span className="text-muted-foreground hidden md:inline">({day}, {time})</span>
          </div>
        </div>
      </div>
      {/* Right side is completely clean as requested */}
      <div className="hidden sm:block" />
    </header>
  );
}