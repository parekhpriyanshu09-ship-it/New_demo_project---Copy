import React, { useMemo } from "react";
import { Loader2, Mail, Inbox, Printer, HelpCircle } from "lucide-react";
import { useReceivingModes } from "../../hooks/useDashboard";

const SEGMENT_STYLES = {
  "Physical": {
    bgClass: "bg-[#e0e7ff] dark:bg-indigo-950/30",
    textClass: "text-[#312e81] dark:text-indigo-200",
    icon: Inbox,
    iconColor: "#4f46e5"
  },
  "Mails": {
    bgClass: "bg-[#c7d2fe] dark:bg-indigo-900/40",
    textClass: "text-[#1e1b4b] dark:text-indigo-100",
    icon: Mail,
    iconColor: "#6366f1"
  },
  "Fax": {
    bgClass: "bg-[#6366f1] dark:bg-indigo-600",
    textClass: "text-white",
    icon: Printer,
    iconColor: "#818cf8"
  }
};

const FALLBACK_STYLE = {
  bgClass: "bg-slate-100 dark:bg-neutral-800/40",
  textClass: "text-slate-600 dark:text-slate-400",
  icon: HelpCircle,
  iconColor: "#64748b"
};

export function DonutCard() {
  const { modes, loading } = useReceivingModes();

  const data = useMemo(() =>
    modes
      .map(m => ({ label: m.mode, value: m.count }))
      .filter(m => m.value >= 0),
    [modes]
  );

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-strong rounded-2xl p-6 flex flex-col h-full justify-between w-full min-h-[220px] text-foreground">
      {/* Header Panel matching design */}
      <div className="flex items-center justify-between mb-5 w-full">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-neutral-100 tracking-tight">Patrak Receiving Overview</h3>
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider bg-indigo-50/50 dark:bg-indigo-900/20 px-2.5 py-0.5 rounded-md">
          Channels Breakdown
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center h-36">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center h-36 text-sm text-muted-foreground">
          No entries registered yet
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between w-full">
          {/* Segmented Progress Layout */}
          <div className="flex flex-col w-full mb-5">
            {/* 1. Top Tick Indicators aligned perfectly with segments */}
            <div className="flex w-full mb-1.5 select-none px-0.5">
              {data.map((m) => {
                const pct = total > 0 ? (m.value / total) * 100 : 0;
                const showText = pct > 12; // hide text if space is too narrow to avoid overlap
                return (
                  <div
                    key={m.label}
                    className="flex flex-col text-left transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  >
                    <span 
                      className={`text-xs font-extrabold text-muted-foreground/80 truncate pr-1 transition-opacity duration-300 ${
                        showText ? "opacity-100" : "opacity-0"
                      }`}
                      title={m.label}
                    >
                      {m.label}
                    </span>
                    <span className="text-xs font-black text-slate-300 dark:text-neutral-700/80 mt-1 leading-none">
                      |
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 2. Horizontal Segmented Progress Bar */}
            <div className="flex w-full h-[46px] bg-slate-100 dark:bg-neutral-800/40 rounded-xl overflow-hidden shadow-inner flex-row border border-slate-200/20 dark:border-neutral-800/20">
              {data.map((m) => {
                const styles = SEGMENT_STYLES[m.label] || FALLBACK_STYLE;
                const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
                return (
                  <div
                    key={m.label}
                    className={`h-full flex items-center justify-center transition-all duration-300 border-r border-white/40 dark:border-neutral-900/30 last:border-r-0 ${styles.bgClass}`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 5 && (
                      <span className={`text-xs font-black tracking-tight ${styles.textClass}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Detailed Data Table Rows with Fine Border Separators */}
          <div className="flex flex-col w-full">
            {data.map((m, index) => {
              const styles = SEGMENT_STYLES[m.label] || FALLBACK_STYLE;
              const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
              const IconComponent = styles.icon;

              return (
                <div
                  key={m.label}
                  className={`flex items-center justify-between w-full py-3.5 ${
                    index === 0 ? "border-t border-slate-100/80 dark:border-neutral-800/40" : ""
                  } border-b border-slate-100/80 dark:border-neutral-800/40 hover:bg-slate-50/20 dark:hover:bg-neutral-900/10 transition-colors duration-200 px-1`}
                >
                  {/* Left: Icon and Name */}
                  <div className="flex items-center min-w-0">
                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                      <IconComponent className="h-4.5 w-4.5" style={{ color: styles.iconColor }} />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-neutral-200 ml-3 truncate">
                      {m.label}
                    </span>
                  </div>

                  {/* Right: Absolute Count and Percentage */}
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="text-xs font-black text-slate-800 dark:text-neutral-100 tabular-nums">
                      {m.value} {m.value === 1 ? "entry" : "entries"}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground/90 min-w-[45px] text-right tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}