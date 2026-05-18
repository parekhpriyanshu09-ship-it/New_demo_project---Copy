import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, ScanLine, Upload, Search, FileBarChart, ClipboardList } from "lucide-react";

const actions = [
  { id: "entry", label: "Entry Form", icon: Plus, path: "/letters" },
  { id: "scan", label: "Scan QR Code", icon: ScanLine, path: "/scanner" },
  { id: "upload", label: "Upload QR Code", icon: Upload, path: "/scanner" },
  { id: "search", label: "Tracking Search", icon: Search, path: "/track-patrak" },
  { id: "reports", label: "View Reports", icon: FileBarChart, path: "/reports" },
  { id: "logs", label: "View Logs", icon: ClipboardList, path: "/logs" },
];

export function QuickActions() {
  const navigate = useNavigate();
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
    <div className="flex items-center justify-between text-foreground w-full">
      {/* Slide-show Pill Track Container */}
      <div className="relative flex items-center flex-1 w-full min-w-0">
        {/* Left Arrow Button with Fading Gradient Mask */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pr-10 z-10 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-brand-dark border border-brand-accent/30 dark:border-brand-accent/40 shadow-md hover:bg-brand-light dark:hover:bg-brand-dark/80 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all duration-200"
              title="Scroll Left"
            >
              <ChevronLeft className="h-4.5 w-4.5 text-brand-dark dark:text-brand-accent" />
            </button>
          </div>
        )}

        {/* Right Arrow Button with Fading Gradient Mask */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pl-10 z-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none">
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-brand-dark border border-brand-accent/30 dark:border-brand-accent/40 shadow-md hover:bg-brand-light dark:hover:bg-brand-dark/80 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all duration-200"
              title="Scroll Right"
            >
              <ChevronRight className="h-4.5 w-4.5 text-brand-dark dark:text-brand-accent" />
            </button>
          </div>
        )}

        {/* Centered Scrolling Pill Track (preserving the exact large button size and gap, centered when fitting!) */}
        <div
          ref={scrollContainerRef}
          onScroll={updateArrows}
          className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-1 w-full select-none scroll-smooth snap-x snap-mandatory justify-start sm:justify-center"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(a.path)}
              className="snap-start shrink-0 rounded-xl px-5 py-2 text-sm sm:text-base font-bold tracking-tight transition-all duration-200 border border-brand-accent/30 dark:border-brand-accent/40 cursor-pointer flex items-center gap-2 bg-white dark:bg-brand-dark/80 text-brand-dark dark:text-white shadow-sm hover:bg-brand-light dark:hover:bg-brand-dark hover:border-brand-accent dark:hover:border-brand-accent/60 active:scale-95"
            >
              <a.icon className="h-4 w-4 shrink-0" />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
