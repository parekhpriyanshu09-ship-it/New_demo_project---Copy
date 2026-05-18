import React, { useMemo } from "react";
import { Loader2, Mail, Inbox, Printer, HelpCircle } from "lucide-react";
import { useReceivingModes } from "../../hooks/useDashboard";
import { dashboardTheme } from "../../theme/dashboardTheme";

const SEGMENT_STYLES = {
  "Physical": {
    bg: dashboardTheme.series[5],
    text: dashboardTheme.primaryDeep,
    icon: Inbox,
    iconColor: dashboardTheme.accentPrimary,
  },
  "Mails": {
    bg: dashboardTheme.series[4],
    text: dashboardTheme.primaryDeep,
    icon: Mail,
    iconColor: dashboardTheme.accentLight,
  },
  "Fax": {
    bg: dashboardTheme.series[0],
    text: dashboardTheme.text,
    icon: Printer,
    iconColor: dashboardTheme.softHighlight,
  }
};

const FALLBACK_STYLE = {
  bg: dashboardTheme.accentPrimary,
  text: dashboardTheme.primaryDeep,
  icon: HelpCircle,
  iconColor: dashboardTheme.accentPrimary,
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
      <div className="mb-6 flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_20%,transparent)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_15%,transparent)] px-3 py-1 text-xs font-black uppercase tracking-widest text-[color:var(--dashboard-accent-primary)]">
            Channels Breakdown
          </span>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-brand-dark dark:text-white">
            Patrak Receiving Overview
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Distribution of received tapal by source channel
          </p>
        </div>

        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_25%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--dashboard-accent-primary)_20%,transparent),color-mix(in_srgb,var(--dashboard-primary-deep)_10%,transparent))] px-6 py-4 text-right">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Entries</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-[color:var(--dashboard-accent-primary)]">{total}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--dashboard-accent-primary)]" />
        </div>
      ) : total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No entries registered yet
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--dashboard-primary-deep)_10%,transparent)] p-2 shadow-inner">
            <div className="flex h-16 w-full overflow-hidden rounded-xl bg-[color:color-mix(in_srgb,var(--dashboard-primary-deep)_20%,transparent)]">
              {data.map((m) => {
                const styles = SEGMENT_STYLES[m.label] || FALLBACK_STYLE;
                const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
                return (
                  <div
                    key={m.label}
                    className="flex h-full items-center justify-center border-r border-white/25 last:border-r-0"
                    style={{ width: `${pct}%`, backgroundColor: styles.bg }}
                    title={`${m.label}: ${pct}%`}
                  >
                    {pct > 6 && (
                      <span className="text-sm font-black" style={{ color: styles.text }}>
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
                  className="group flex flex-col justify-between rounded-2xl border border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_20%,transparent)] bg-white/80 p-5 shadow-[0_16px_36px_-28px_color-mix(in_srgb,var(--dashboard-primary-deep)_70%,transparent)] transition-all duration-200 hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_60%,transparent)] hover:bg-[#f4fffb] dark:bg-[color:color-mix(in_srgb,var(--dashboard-primary-deep)_35%,transparent)] dark:hover:bg-[color:color-mix(in_srgb,var(--dashboard-secondary)_35%,transparent)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_15%,transparent)] text-[color:var(--dashboard-accent-primary)] ring-1 ring-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_25%,transparent)]">
                      <IconComponent className="h-5 w-5" style={{ color: styles.iconColor }} />
                    </div>
                    <span className="rounded-full bg-[color:color-mix(in_srgb,var(--dashboard-accent-primary)_15%,transparent)] px-3 py-1 text-xs font-black text-[color:var(--dashboard-secondary)] dark:text-[color:var(--dashboard-soft-highlight)]">
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-black text-brand-dark dark:text-white">{m.label}</h4>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-black tabular-nums text-[color:var(--dashboard-primary-deep)] dark:text-white">
                        {m.value}
                      </span>
                      <span className="pb-1 text-sm font-bold text-muted-foreground">
                        {m.value === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--dashboard-primary-deep)_10%,transparent)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--dashboard-accent-primary),var(--dashboard-soft-highlight))] transition-all duration-500"
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
