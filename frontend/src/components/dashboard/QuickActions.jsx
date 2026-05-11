import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, ScanLine, Upload, Search, FileBarChart, ClipboardList } from "lucide-react";

const actions = [
  { id: "entry", label: "Entry Form", icon: Plus },
  { id: "scan", label: "Scan QR Code", icon: ScanLine },
  { id: "upload", label: "Upload QR Code", icon: Upload },
  { id: "search", label: "Tracking Search", icon: Search },
  { id: "reports", label: "View Reports", icon: FileBarChart },
  { id: "logs", label: "View Logs", icon: ClipboardList },
];

export function QuickActions() {
  const [activeTab, setActiveTab] = useState("entry");
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Check scroll position to dynamically show/hide arrows
  const updateArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 5);
    }
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.6; // Scroll 60% of visible container width
      const targetScroll = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-4 flex items-center justify-between text-foreground w-full">
      {/* Slide-show Pill Track Container */}
      <div className="relative flex items-center flex-1 w-full min-w-0">
        {/* Left Arrow Button with Fading Gradient Mask */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pr-10 z-10 bg-gradient-to-r from-white dark:from-[#0d0f14] via-white/80 dark:via-[#0d0f14]/80 to-transparent pointer-events-none rounded-l-2xl">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-md hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all duration-200"
              title="Scroll Left"
            >
              <ChevronLeft className="h-4.5 w-4.5 text-slate-800 dark:text-neutral-200" />
            </button>
          </div>
        )}

        {/* Right Arrow Button with Fading Gradient Mask */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pl-10 z-10 bg-gradient-to-l from-white dark:from-[#0d0f14] via-white/80 dark:via-[#0d0f14]/80 to-transparent pointer-events-none rounded-r-2xl">
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-md hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all duration-200"
              title="Scroll Right"
            >
              <ChevronRight className="h-4.5 w-4.5 text-slate-800 dark:text-neutral-200" />
            </button>
          </div>
        )}

        {/* Centered Scrolling Pill Track (preserving the exact large button size and gap, centered when fitting!) */}
        <div
          ref={scrollContainerRef}
          onScroll={updateArrows}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 w-full select-none scroll-smooth snap-x snap-mandatory justify-start sm:justify-center"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {actions.map((a) => {
            const isActive = activeTab === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setActiveTab(a.id)}
                className={`snap-start shrink-0 rounded-xl px-5 py-2 text-[13px] sm:text-[14px] font-bold tracking-tight transition-all duration-200 border border-transparent cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-black shadow-sm hover:bg-slate-800 dark:hover:bg-neutral-200"
                    : "bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/60 dark:text-neutral-200"
                }`}
              >
                <a.icon className="h-4 w-4 shrink-0" />
                <span>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
