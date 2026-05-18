import React, { useMemo } from "react";
import { Loader2, Mail, Inbox, Printer, HelpCircle } from "lucide-react";
import { useReceivingModes } from "../../hooks/useDashboard";

const SEGMENT_STYLES = {
  "Physical": {
    bgClass: "bg-[#a9f5e4] dark:bg-[#063d33]",
    textClass: "text-[#063d33] dark:text-[#a9f5e4]",
    icon: Inbox,
    iconColor: "#00c896"
  },
  "Mails": {
    bgClass: "bg-[#3ee7bd] dark:bg-[#087a63]",
    textClass: "text-[#063d33] dark:text-white",
    icon: Mail,
    iconColor: "#18d6a8"
  },
  "Fax": {
    bgClass: "bg-[#063d33] dark:bg-[#00c896]",
    textClass: "text-white",
    icon: Printer,
    iconColor: "#a9f5e4"
  }
};

const FALLBACK_STYLE = {
  bgClass: "bg-[#00c896]/15 dark:bg-[#00c896]/20",
  textClass: "text-[#063d33] dark:text-white",
  icon: HelpCircle,
  iconColor: "#00c896"
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
    <div className="glass-strong flex h-full min-h-[360px] w-full flex-col rounded-2xl p-6 text-foreground">
      <div className="mb-6 flex flex-col gap-4 border-b border-[#00c896]/20 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-[#00c896]/35 bg-[#00c896]/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#00c896]">
            Channels Breakdown
          </span>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-brand-dark dark:text-white">
            Patrak Receiving Overview
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Distribution of received tapal by source channel
          </p>
        </div>

        <div className="rounded-2xl border border-[#00c896]/25 bg-gradient-to-br from-[#00c896]/20 to-[#063d33]/10 px-6 py-4 text-right">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Entries</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-[#00c896]">{total}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#00c896]" />
        </div>
      ) : total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No entries registered yet
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-[#00c896]/20 bg-[#063d33]/10 p-2 shadow-inner">
            <div className="flex h-16 w-full overflow-hidden rounded-xl bg-[#063d33]/20">
              {data.map((m) => {
                const styles = SEGMENT_STYLES[m.label] || FALLBACK_STYLE;
                const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
                return (
                  <div
                    key={m.label}
                    className={`flex h-full items-center justify-center border-r border-white/25 last:border-r-0 ${styles.bgClass}`}
                    style={{ width: `${pct}%` }}
                    title={`${m.label}: ${pct}%`}
                  >
                    {pct > 6 && (
                      <span className={`text-sm font-black ${styles.textClass}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            {data.map((m) => {
              const styles = SEGMENT_STYLES[m.label] || FALLBACK_STYLE;
              const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
              const IconComponent = styles.icon;

              return (
                <div
                  key={m.label}
                  className="group flex flex-col justify-between rounded-2xl border border-[#00c896]/20 bg-white/80 p-5 shadow-[0_16px_36px_-28px_rgba(6,61,51,0.7)] transition-all duration-200 hover:-translate-y-1 hover:border-[#00c896]/60 hover:bg-[#f4fffb] dark:bg-[#063d33]/35 dark:hover:bg-[#087a63]/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00c896]/15 text-[#00c896] ring-1 ring-[#00c896]/25">
                      <IconComponent className="h-5 w-5" style={{ color: styles.iconColor }} />
                    </div>
                    <span className="rounded-full bg-[#00c896]/15 px-3 py-1 text-xs font-black text-[#087a63] dark:text-[#a9f5e4]">
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-black text-brand-dark dark:text-white">{m.label}</h4>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-black tabular-nums text-[#063d33] dark:text-white">
                        {m.value}
                      </span>
                      <span className="pb-1 text-sm font-bold text-muted-foreground">
                        {m.value === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#063d33]/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00c896] to-[#a9f5e4] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
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
