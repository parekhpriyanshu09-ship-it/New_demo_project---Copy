import React from "react";
import { LayoutDashboard, FileText, ScanLine, BarChart3, Users, ClipboardList, Search } from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Entry Form", icon: FileText },
  { label: "Scanner", icon: ScanLine },
  { label: "Reports", icon: BarChart3 },
  { label: "Users", icon: Users },
  { label: "System Logs", icon: ClipboardList },
];

export function Sidebar() {
  return (
    <aside
      className="hidden lg:flex w-[260px] shrink-0 flex-col gap-6 p-5 border-r border-border/50 relative overflow-hidden bg-white/60"
    >

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl glass-strong flex items-center justify-center">
          <ScanLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Patrak Tracking</div>
          <div className="text-xs text-muted-foreground">System</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by Patrak ID, Title…"
          className="w-full glass rounded-2xl pl-9 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 transition"
        />
      </div>

      {/* Menu */}
      <nav className="relative flex flex-col gap-1.5">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              active
                ? "glass-strong text-foreground shadow-[0_8px_24px_-12px_oklch(0.7_0.18_260/0.5)]"
                : "text-foreground/70 hover:bg-white/40"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                active ? "bg-gradient-to-br from-[oklch(0.85_0.1_240)] to-[oklch(0.85_0.1_270)] text-white" : "bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </button>
        ))}
      </nav>

      
    </aside>
  );
}
