import React from "react";
import { BarChart3, CalendarDays, Inbox } from "lucide-react";

const TABS = [
  {
    id: "hod",
    title: "HOD wise tapal analysis",
    icon: BarChart3,
  },
  {
    id: "day-month",
    title: "Day and month wise",
    icon: CalendarDays,
  },
  {
    id: "receiving-mode",
    title: "Mode of receiving",
    icon: Inbox,
  },
];

export function DashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="rounded-2xl border border-[#00AE8C]/20 bg-white/85 p-1.5 shadow-[0_16px_40px_-28px_rgba(17,45,72,0.45)] backdrop-blur dark:bg-[#112D48]/45 dark:border-[#00AE8C]/25">
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00AE8C]/35 ${
                isActive
                  ? "bg-gradient-to-r from-[#00AE8C] to-[#112D48] text-white shadow-[0_12px_28px_-18px_rgba(17,45,72,0.8)]"
                  : "text-[#112D48]/75 hover:bg-[#00AE8C]/10 hover:text-[#112D48] dark:text-white/70 dark:hover:text-white"
              }`}
              aria-pressed={isActive}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TABS as DASHBOARD_TABS };
