import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Building, RefreshCw, Layers } from "lucide-react";
import { useCalendarData } from "../../hooks/useDashboard";
import { mockDashboardEntries } from "../../data/dashboardMockData";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarCard({ selectedDate, onDateSelect, onSelectedDateHasPatraksChange }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());

  // selectedDate and onDateSelect are now controlled by the parent (Dashboard)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Carousel swipe state for navigating multiple entries on the same date
  const [entryIndex, setEntryIndex] = useState(0);

  const month = currentDate.getMonth() + 1; // 1-indexed
  const year = currentDate.getFullYear();

  // Fetch calendar dates activity indicators (dots)
  const { dates: calInward, loading: inwardLoading } = useCalendarData(month, year, "inward");
  const { dates: calOutward, loading: outwardLoading } = useCalendarData(month, year, "outward");

  const refreshMockEntries = () => {
    setEntriesLoading(true);
    window.setTimeout(() => setEntriesLoading(false), 150);
  };

  useEffect(() => {
    refreshMockEntries();
  }, []);

  // Reset swipe index when selected date changes
  useEffect(() => {
    setEntryIndex(0);
  }, [selectedDate]);

  // Compute marked dates for calendar indicators (dots) from the shared dashboard mock data.
  const markedDates = useMemo(() => {
    const counts = {};
    mockDashboardEntries.forEach(entry => {
      if (entry.received_date) {
        const dateStr = entry.received_date.split("T")[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    onDateSelect(todayStr);
  };

  const getDateStr = (day) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isTodayDate = (day) =>
    day === today.getDate() &&
    month - 1 === today.getMonth() &&
    year === today.getFullYear();

  // Cells structure
  const cells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ d: prevMonthLastDay - i, muted: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = getDateStr(i);
    cells.push({
      d: i,
      isToday: isTodayDate(i),
      isSelected: selectedDate === dateStr,
      count: markedDates[dateStr] || 0,
      dateStr,
    });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ d: i, muted: true });
    }
  }

  // Filter the same shared mock patraks used by the rest of the dashboard.
  const currentSelectedEntries = useMemo(() => {
    if (!selectedDate) return [];
    return mockDashboardEntries.filter(entry => {
      if (!entry.received_date) return false;
      return entry.received_date.split("T")[0] === selectedDate;
    });
  }, [selectedDate]);

  const activeEntry = currentSelectedEntries[Math.min(entryIndex, currentSelectedEntries.length - 1)];
  const showSelectedPatrakDetails = Boolean(selectedDate && currentSelectedEntries.length > 0);

  useEffect(() => {
    onSelectedDateHasPatraksChange?.(showSelectedPatrakDetails);
  }, [onSelectedDateHasPatraksChange, showSelectedPatrakDetails]);

  // Formatting helpers
  const formatTimeStr = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatDateStrFull = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "Current Date";
    const [y, m, d] = selectedDate.split("-");
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }, [selectedDate]);

  return (
    <div className={`glass-strong rounded-2xl p-5 flex flex-col h-full gap-4 ${showSelectedPatrakDetails ? "justify-between" : "justify-start"}`}>
      {/* 1. Header Bar matching reference layout */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800/40">
        <div className="flex items-center gap-3">
          {/* Mini Calendar Date block icon */}
          <div className="flex flex-col items-center justify-center bg-slate-100/80 dark:bg-neutral-800/80 rounded-xl h-14 w-14 border border-slate-200/50 dark:border-neutral-700/30 shrink-0 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90">
              {MONTHS[today.getMonth()].slice(0, 3)}
            </span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">
              {today.getDate()}
            </span>
          </div>
          {/* Calendar Titles */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-800 dark:text-neutral-100 tracking-tight leading-none">
                {MONTHS[month - 1]} {year}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-neutral-800/80 text-muted-foreground px-1.5 py-0.5 rounded-md leading-none">
                Week {Math.ceil((today.getDate() + firstDayOfMonth) / 7)}
              </span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground/80 mt-1 leading-none">
              {today.toLocaleDateString("en-IN", { weekday: "long" })}
            </span>
          </div>
        </div>

        {/* Calendar Navigations grouped */}
        <div className="flex items-center gap-1">
          <div className="flex items-center border border-slate-200/40 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={prevMonth}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800/80 transition text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={goToday}
              className="text-xs font-black px-3.5 py-1.5 hover:bg-white dark:hover:bg-neutral-800/80 rounded-lg transition text-slate-700 dark:text-neutral-200 leading-none"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800/80 transition text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Refresh/Sync button */}
          <button
            onClick={refreshMockEntries}
            className={`h-8 w-8 rounded-xl bg-slate-50/50 dark:bg-neutral-900/30 border border-slate-200/40 dark:border-neutral-800/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition hover:bg-white dark:hover:bg-neutral-800/80 ${entriesLoading ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Month Calendar Widget Grid */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className={`grid grid-cols-7 gap-1 text-center text-xs transition-opacity ${inwardLoading || outwardLoading ? "opacity-50" : "opacity-100"}`}>
          {cells.map((c, i) => {
            const hasData = !c.muted && c.count > 0;
            return (
              <div
                key={i}
                className="py-0.5 relative flex items-center justify-center"
                onClick={() => {
                  if (!c.muted) {
                    onDateSelect(c.dateStr);
                  }
                }}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer relative font-bold text-[10.5px] ${c.isSelected
                      ? "bg-indigo-600 text-white font-black shadow-[0_4px_12px_-3px_rgba(79,70,229,0.5)] scale-105"
                      : c.isToday
                        ? "border-2 border-indigo-600 text-indigo-600 font-extrabold hover:bg-slate-100/50 dark:hover:bg-neutral-800/40"
                        : c.muted
                          ? "text-slate-300 dark:text-neutral-700 font-medium"
                          : "text-slate-700 dark:text-neutral-300 hover:bg-slate-100/50 dark:hover:bg-neutral-800/40"
                    }`}
                >
                  {c.d}
                  {hasData && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${c.isSelected ? "bg-white" : "bg-indigo-500"}`} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showSelectedPatrakDetails && (
        <>
          {/* Separator Line */}
          <div className="h-[1px] w-full bg-slate-100 dark:bg-neutral-800/40" />

          {/* 3. Patrak Event Details / Swiper Block */}
          <div className="flex-1 flex flex-col justify-between min-h-[220px]">
            {/* Header Summary Indicator */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-indigo-500" />
                Selected Date Patrak
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                {formattedSelectedDate}
              </span>
            </div>

            {/* Dynamic Card Display */}
            {entriesLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Syncing Data...</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between border border-slate-200/40 dark:border-neutral-800/50 rounded-2xl p-4 bg-slate-50/30 dark:bg-neutral-900/15">
                <div className="flex flex-col gap-3">
                  {/* Carousel Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                        {activeEntry.unique_id}
                      </span>
                      <h4
                        className="text-xs sm:text-[13px] font-extrabold text-slate-800 dark:text-neutral-100 leading-snug mt-1 truncate max-w-[200px]"
                        title={activeEntry.subject}
                      >
                        {activeEntry.subject}
                      </h4>
                    </div>

                    {/* Swiper Arrow buttons for Multi-Entry Swipe */}
                    {currentSelectedEntries.length > 1 && (
                      <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700/50 px-1.5 py-0.5 rounded-lg shadow-sm select-none">
                        <button
                          onClick={() => setEntryIndex((prev) => (prev === 0 ? currentSelectedEntries.length - 1 : prev - 1))}
                          className="p-1 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <span className="text-[9px] font-black text-slate-500 tracking-wider">
                          {entryIndex + 1}/{currentSelectedEntries.length}
                        </span>
                        <button
                          onClick={() => setEntryIndex((prev) => (prev === currentSelectedEntries.length - 1 ? 0 : prev + 1))}
                          className="p-1 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Icon Info Rows */}
                  <div className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span>{formatDateStrFull(activeEntry.received_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span>{formatTimeStr(activeEntry.received_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span className="truncate">{activeEntry.sender_name} ({activeEntry.sender_designation || "Officer"})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span className="uppercase tracking-widest text-[8px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 px-1.5 py-0.5 rounded leading-none">
                        {activeEntry.current_department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* About / Description Block */}
                <div className="mt-3 border-t border-slate-100 dark:border-neutral-800/40 pt-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/90">About this patrak</span>
                  <p
                    className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 leading-snug mt-1.5 line-clamp-2"
                    title={activeEntry.description || "No description provided."}
                  >
                    {activeEntry.description || "No official description provided for this tracking correspondence."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
