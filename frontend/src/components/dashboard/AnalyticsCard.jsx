import React, { useEffect, useState } from "react";
import { CalendarDays, Folders, Activity, Loader2, ChevronDown } from "lucide-react";
import { useDateChart, useDashboardStats } from "../../hooks/useDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  inward: {
    label: "Inward",
    color: "oklch(0.65 0.18 245)", // Beautiful electric blue
  },
  outward: {
    label: "Outward",
    color: "oklch(0.65 0.18 15)",  // Beautiful vibrant red/rose
  },
};

export function AnalyticsCard({ selectedDate }) {
  const [days, setDays] = useState(14);
  const [isBelowLargeMonitor, setIsBelowLargeMonitor] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1535px)");
    const syncScreenSize = () => setIsBelowLargeMonitor(mediaQuery.matches);

    syncScreenSize();
    mediaQuery.addEventListener("change", syncScreenSize);

    return () => mediaQuery.removeEventListener("change", syncScreenSize);
  }, []);

  const effectiveDays = isBelowLargeMonitor ? 7 : days;

  const { data: inwardData, loading: inwardLoading } = useDateChart(selectedDate, "inward", effectiveDays);
  const { data: outwardData, loading: outwardLoading } = useDateChart(selectedDate, "outward", effectiveDays);
  const { stats, loading: statsLoading } = useDashboardStats();

  const chartLoading = inwardLoading || outwardLoading;

  // Merge datasets
  const mergedData = inwardData.map(inItem => {
    const outItem = outwardData.find(o => o.date === inItem.date) || { value: 0 };
    return {
      name: inItem.name,
      date: inItem.date,
      inward: inItem.value,
      outward: outItem.value,
    };
  });

  // Calculations
  const totalWeek = mergedData.slice(-7).reduce((s, d) => s + d.inward, 0);
  const dailyAvg = mergedData.length > 0
    ? Math.round(mergedData.reduce((s, d) => s + d.inward, 0) / mergedData.length)
    : 0;

  const summaryCards = [
    {
      label: "This Week",
      value: statsLoading ? "—" : totalWeek.toLocaleString("en-IN"),
      icon: CalendarDays,
      color: "oklch(0.7 0.15 235)",
      hoverClass: "animate-hover-calendar",
    },
    {
      label: "This Month",
      value: statsLoading ? "—" : (stats?.total_entries ?? "—").toLocaleString("en-IN"),
      icon: Folders,
      color: "oklch(0.7 0.15 295)",
      hoverClass: "animate-hover-folder",
    },
    {
      label: "Daily Avg",
      value: chartLoading ? "—" : dailyAvg.toLocaleString("en-IN"),
      icon: Activity,
      color: "oklch(0.65 0.15 170)",
      hoverClass: "animate-hover-activity",
    },
  ];

  return (
    <Card className="glass-strong rounded-2xl p-4 flex flex-col h-full min-h-[320px] text-foreground">
      {/* Card Header controls */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-neutral-100">
            Patrak Received Analysis
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-0.5">
            Inward vs Outward stacked volume
            {selectedDate && (
              <span className="ml-1 text-indigo-500 dark:text-indigo-400 font-semibold">
                · ending {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center text-xs font-semibold rounded-lg border border-border bg-white dark:bg-neutral-900 px-2.5 py-1 text-slate-800 dark:text-neutral-100 2xl:hidden">
          7 days
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden 2xl:flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-border bg-white dark:bg-neutral-900 px-2.5 py-1 focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-slate-800 dark:text-neutral-100">
              <span>{days} days</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[85px] w-[85px] bg-white dark:bg-neutral-900 border border-border ring-0 shadow-md p-1">
            <DropdownMenuItem
              onClick={() => setDays(7)}
              className={`text-xs cursor-pointer rounded-md px-2 py-1 focus:bg-slate-100 dark:focus:bg-neutral-800 ${days === 7 ? "font-bold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
            >
              7 days
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDays(14)}
              className={`text-xs cursor-pointer rounded-md px-2 py-1 focus:bg-slate-100 dark:focus:bg-neutral-800 ${days === 14 ? "font-bold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
            >
              14 days
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        {/* Unified horizontal metrics capsule bar */}
        <div className="flex items-center justify-between border border-slate-200/50 dark:border-neutral-800/40 bg-slate-50/30 dark:bg-neutral-900/15 rounded-xl p-0.5 mb-3">
          {summaryCards.map((s, index) => (
            <React.Fragment key={s.label}>
              {/* Item Section */}
              <div className="group flex flex-1 items-center gap-2 px-2.5 py-2 hover:bg-slate-100/30 dark:hover:bg-neutral-900/30 rounded-lg transition-all duration-300 cursor-pointer">
                {/* Left ItemMedia: Standalone naked animated icon */}
                <div className="flex items-center justify-center shrink-0 w-7 h-7 transition-transform duration-300 group-hover:scale-105">
                  <s.icon className={`h-4 w-4 transition-all duration-300 ${s.hoverClass}`} style={{ color: s.color }} />
                </div>
                {/* Right ItemContent: Dynamic values & labels */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground truncate leading-none">
                    {s.label}
                  </span>
                  <span className="text-base font-extrabold tracking-tight text-slate-800 dark:text-neutral-100 mt-0.5 leading-none">
                    {s.value}
                  </span>
                </div>
              </div>

              {/* Centered Vertical Divider Line */}
              {index < summaryCards.length - 1 && (
                <div className="h-7 w-[1px] bg-slate-200/80 dark:bg-neutral-800/80 shrink-0 self-center" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Recharts Stacked Bar Chart */}
        <div className="relative flex-1 min-h-[190px] w-full 2xl:pt-10">
          {chartLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mergedData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <div className="h-[205px] w-full">
              <ChartContainer config={chartConfig} className="aspect-auto h-[178px] w-full">
                <BarChart
                  accessibilityLayer
                  data={mergedData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 2 }}
                  barCategoryGap="8%"
                  barGap={0}
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" opacity={0.6} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={false}
                    interval={0}
                    height={28}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 600 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="inward"
                    stackId="a"
                    fill="var(--color-inward)"
                    radius={[0, 0, 4, 4]}
                    maxBarSize={effectiveDays === 30 ? 12 : effectiveDays === 14 ? 20 : 34}
                  />
                  <Bar
                    dataKey="outward"
                    stackId="a"
                    fill="var(--color-outward)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={effectiveDays === 30 ? 12 : effectiveDays === 14 ? 20 : 34}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
