import React from 'react';
import { Check, Clock, Calendar as CalendarIcon, User, MapPin } from 'lucide-react';

const Timeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  // Filter out pending departments
  const activeTimeline = timeline.filter(step => step.status?.toLowerCase() !== 'pending');

  if (activeTimeline.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2 px-1">
        <MapPin size={14} className="text-red-500" />
        Movement History
      </h3>
      
      <div className="relative pl-1.5">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-6 w-[2px] bg-slate-200/60 rounded-full"></div>

        <div className="space-y-0 relative">
          {activeTimeline.map((step, index) => {
            const isCompleted = step.status?.toLowerCase() === 'received' || step.status?.toLowerCase() === 'forwarded';
            const isLast = index === activeTimeline.length - 1;

            let dateStr = '';
            let timeStr = '';

            if (step.timestamp) {
              try {
                const safeTimestamp = step.timestamp.replace(' ', 'T');
                const dateObj = new Date(safeTimestamp);
                dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                const parts = step.timestamp.split(' ');
                dateStr = parts[0] || '';
                timeStr = parts[1] || '';
              }
            }

            return (
              <div key={index} className="relative flex items-start group pb-4">
                {/* Timeline Dot */}
                <div className="absolute left-[-1.5px] top-[14px] z-10 flex items-center justify-center">
                  <div className={`w-[14px] h-[14px] rounded-full border-2 ring-4 ring-white transition-all flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
                      : 'bg-white border-slate-300'
                  }`}>
                    {isCompleted && <Check size={8} strokeWidth={4} className="text-white" />}
                  </div>
                </div>

                {/* Content */}
                <div className={`ml-6 flex-1 bg-white hover:bg-slate-50/80 rounded-xl p-3 border transition-colors ${isLast ? 'border-red-100 shadow-sm shadow-red-50' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base font-bold text-slate-800 leading-tight">
                      {step.department}
                    </h4>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-sm font-black uppercase tracking-wider ${
                      isCompleted ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1.5">
                      {dateStr && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </div>
                      )}
                      {timeStr && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeStr}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {step.user || 'System'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
