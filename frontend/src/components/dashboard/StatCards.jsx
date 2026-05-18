import { useMemo } from "react";
import { Building2, Briefcase, BookOpen, GraduationCap, Server, Loader2 } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboard";

// Department display config with capacity limits to render image-style cards
const DEPT_CONFIG = [
  {
    key: "DG Office",
    title: "DG Office",
    icon: Building2,
    maxCap: 30,
    unit: "files",
  },
  {
    key: "CID Crime",
    title: "CID Crime",
    icon: Briefcase,
    maxCap: 30,
    unit: "files",
  },
  {
    key: "Law & Order",
    title: "Law & Order",
    icon: BookOpen,
    maxCap: 20,
    unit: "files",
  },
  {
    key: "Training",
    title: "Training",
    icon: GraduationCap,
    maxCap: 15,
    unit: "files",
  },
  {
    key: "TS & SCRB",
    title: "TS & SCRB",
    icon: Server,
    maxCap: 25,
    unit: "files",
  },
];

// Separate component for each individual card item to encapsulate smooth hover and transitions
function CardItem({ s, loading }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#00AE8C]/35 bg-gradient-to-br from-[#00AE8C] to-[#112D48] p-4 text-white shadow-[0_16px_34px_-24px_rgba(17,45,72,0.8)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-22px_rgba(17,45,72,0.9)] group cursor-pointer select-none"
    >
      {/* Subtly animated ambient backlight on card hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.16] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

      {/* Header Block: Icon on left, stacked title & status on right aligned to center */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Animated Icon Wrapper */}
        <div className="h-9 w-9 rounded-xl bg-white/90 border border-white/30 flex items-center justify-center shrink-0 text-[#112D48] group-hover:scale-110 group-hover:bg-white transition-all duration-300">
          <s.icon className="h-4 w-4 group-hover:rotate-[6deg] transition-transform duration-300" />
        </div>
        
        {/* Vertical Stack: Department Title on top, Workload Status Badge directly below */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Full department name (no truncate, wraps onto second line beautifully if space is narrow) */}
          <span className="text-base font-bold text-white leading-tight transition-colors duration-200">
            {s.title}
          </span>
          
          {/* Contextual Workload Status Pill Badge - shown only if action is needed to keep optimal states beautifully clean */}
          {s.status === 'Action Needed' && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-white/95 border-white/50 text-[#112D48] select-none shrink-0 self-start transition-all duration-300">
              {s.status}
            </span>
          )}
        </div>
      </div>

      {/* Remaining Block Label */}
      <div className="text-sm text-white/72 font-semibold mt-4 relative z-10">
        Remaining
      </div>
      
      {/* Dynamic Count Loader/Value */}
      <div className="flex items-baseline mt-1 relative z-10">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-accent" />
        ) : (
          <>
            <span className="text-2xl font-bold text-white tracking-tight leading-none transition-all duration-300 group-hover:scale-[1.02]">
              {s.value.toLocaleString("en-IN")}
            </span>
            <span className="text-sm font-semibold text-white/72 ml-1.5 leading-none transition-colors duration-300">
              {s.unit}
            </span>
          </>
        )}
      </div>

      {/* Sleek Minimalist Progress Bar with hover-activated color gradients */}
      <div className="h-[6px] w-full bg-white/25 rounded-full overflow-hidden mt-4 relative z-10">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            s.status === 'Action Needed' 
              ? 'bg-gradient-to-r from-amber-300 to-white' 
              : 'bg-white group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#BFF5EA]'
          }`} 
          style={{ width: `${s.percent}%` }} 
        />
      </div>

      {/* Metric Sub-Details labels in perfectly arranged, solid format */}
      <div className="flex items-center justify-between mt-2.5 text-sm font-semibold text-white/72 relative z-10 transition-colors duration-300">
        <span>{s.percent}% left</span>
        <span>{Math.max(s.maxCap - s.value, 0)} used of {s.maxCap} {s.unit}</span>
      </div>
    </div>
  );
}

export function StatCards() {
  const { stats, loading } = useDashboardStats();

  const cards = useMemo(() => {
    return DEPT_CONFIG.map(cfg => {
      const value = stats?.department_counts?.[cfg.key] ?? 0;
      // Calculate dynamic progress percentage based on max capacity config
      const percent = Math.min(Math.round((value / cfg.maxCap) * 100), 100);
      // Warning status if load exceeds 70% threshold
      const isWarning = percent > 70;
      
      return {
        ...cfg,
        value,
        percent,
        // Upgraded placeholders to contextual business workload statuses
        status: isWarning ? "Action Needed" : "Optimal Load"
      };
    });
  }, [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(s => (
        <CardItem key={s.title} s={s} loading={loading} />
      ))}
    </div>
  );
}
