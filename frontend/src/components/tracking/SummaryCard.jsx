import React from 'react';
import { Copy, Calendar as CalendarIcon, MapPin, Activity, Building2, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SummaryCard = ({ entry, timeline }) => {
  if (!entry) return null;

  // Extract the first received date as "Registered On"
  let registeredDate = "N/A";
  if (timeline && timeline.length > 0) {
    const firstLog = timeline.find(t => t.timestamp);
    if (firstLog) {
      try {
        const safeTimestamp = firstLog.timestamp.replace(' ', 'T');
        const dateObj = new Date(safeTimestamp);
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        registeredDate = dateStr;
      } catch (e) {
        registeredDate = firstLog.timestamp.split(' ')[0] || firstLog.timestamp;
      }
    }
  }

  const handleCopy = async (e) => {
    e.stopPropagation();
    const idToCopy = entry.patrak_id || entry.unique_id || '';
    if (!idToCopy) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(idToCopy);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = idToCopy;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error('Fallback copy failed', error);
        } finally {
          textArea.remove();
        }
      }
      
      toast.success('Patrak ID copied!', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#dc2626'
        }
      });
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy ID', {
        style: { fontSize: '12px', fontWeight: 'bold' }
      });
    }
  };

  return (
    <div className="w-full mb-4">
      {/* Premium Compact Patrak Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative mb-4">
        {/* Red left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cc181e] rounded-l-2xl"></div>
        
        <div className="p-4 pl-5">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
            <div className="pr-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <FileTextIcon /> Patrak Overview
              </h2>
              <div className="text-[14px] font-extrabold text-slate-800 leading-tight">{entry.subject}</div>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-1 mt-0.5">
              <div 
                className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1 cursor-pointer hover:bg-red-100 transition-colors shadow-sm" 
                onClick={handleCopy}
              >
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">ID</span>
                <span className="text-[11px] font-black text-red-600 tracking-tight">{entry.patrak_id}</span>
                <Copy className="w-3 h-3 text-red-400 ml-0.5" />
              </div>
            </div>
          </div>
          
          {/* Data Grid */}
          <div className="flex flex-wrap gap-y-4 gap-x-4">
            <div className="min-w-[40%] flex-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Current Status</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-700 rounded-md text-[11px] font-bold border border-slate-200 shadow-sm">
                <Activity className="w-3 h-3 text-red-500" />
                {entry.current_status}
              </div>
            </div>
            <div className="min-w-[40%] flex-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Location</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <div className="w-5 h-5 rounded bg-red-50 flex items-center justify-center border border-red-100">
                  <Building2 className="w-3 h-3 text-red-500" />
                </div>
                <span className="truncate pr-1">{entry.current_department}</span>
              </div>
            </div>
            <div className="min-w-[40%] flex-1 mt-1 md:mt-0">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Date</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <div className="w-5 h-5 rounded bg-red-50 flex items-center justify-center border border-red-100">
                  <CalendarIcon className="w-3 h-3 text-red-500" />
                </div>
                {registeredDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Progress Bar (Premium Design & Animation) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-[#cc181e] via-[#b3141a] to-[#8a1014] rounded-2xl pt-4 pb-4 shadow-xl shadow-red-900/20 w-full relative z-10 border border-red-500/20"
      >
        <h3 className="text-[10px] text-red-100 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 px-5 relative z-30">
           <MapPin size={12} className="text-red-300" /> Movement Path
        </h3>
        
        {/* Scroll Container with smooth snap scrolling & hidden scrollbar */}
        <div className="flex items-start overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-[180px] -mt-[170px] px-6 relative z-20 gap-[32px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {timeline && timeline.map((step, index) => {
            const isCompleted = step.status?.toLowerCase() !== 'pending';
            const isFirst = index === 0;
            const isLast = index === timeline.length - 1;
            
            // Format Date for Tooltip
            let ttDate = 'Pending';
            let ttTime = '';
            if (step.timestamp && isCompleted) {
              try {
                const safeTimestamp = step.timestamp.replace(' ', 'T');
                const dateObj = new Date(safeTimestamp);
                ttDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                ttTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                const parts = step.timestamp.split(' ');
                ttDate = parts[0] || '';
                ttTime = parts[1] || '';
              }
            }
            
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1), duration: 0.4, type: "spring", stiffness: 120 }}
                className="relative flex flex-col items-center shrink-0 w-[64px] group cursor-pointer snap-center"
              >
                
                {/* Horizontal connector line with expanding animation */}
                {!isLast && (
                  <div className="absolute top-[14px] left-[50%] w-[calc(100%+32px)] h-[2px] z-0 overflow-hidden bg-[#981216]/50 rounded-full">
                    {isCompleted && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5 + (index * 0.1), duration: 0.5, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-red-400 to-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      />
                    )}
                  </div>
                )}
                
                {/* Tooltip Hover Box (Premium Glassmorphism) */}
                <div className={`absolute bottom-full w-[160px] bg-white/95 backdrop-blur-md border border-white/40 p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none shadow-2xl shadow-black/20 transform translate-y-3 group-hover:-translate-y-1 mb-3 flex flex-col items-center ${
                  isFirst && timeline.length > 1 ? 'left-[-15px]' : 
                  isLast && timeline.length > 1 ? 'right-[-15px] left-auto' : 
                  'left-[50%] -translate-x-1/2'
                }`}>
                   <div className="text-[12px] font-black text-slate-800 mb-2 leading-tight text-center tracking-tight">{step.department}</div>
                   
                   <div className="flex items-center justify-center mb-2">
                     <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                       {step.status}
                     </span>
                   </div>
                   
                   {isCompleted ? (
                     <div className="w-full flex flex-col">
                       <div className="text-[10px] font-bold text-slate-500 mt-1 flex flex-col gap-1 items-center bg-slate-50 p-2 rounded-lg border border-slate-100 w-full">
                         <div className="flex items-center gap-1.5"><CalendarIcon size={12} className="text-red-500" /> {ttDate}</div>
                         <div className="flex items-center gap-1.5"><Clock size={12} className="text-red-500" /> {ttTime}</div>
                       </div>
                       
                       {step.status?.toLowerCase() === 'received' && (
                         <div className="mt-2 w-full bg-amber-50 border border-amber-100/60 rounded-lg p-2 flex flex-col items-center shadow-sm">
                           <div className="text-[9px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                             <Clock size={10} /> Pending Action
                           </div>
                           <div className="text-[9px] text-amber-600/90 font-medium text-center leading-tight line-clamp-3 w-full">
                             {step.remarks ? step.remarks : 'Awaiting review and forwarding'}
                           </div>
                         </div>
                       )}

                       {step.status?.toLowerCase() === 'forwarded' && step.remarks && (
                         <div className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center">
                           <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Remarks</div>
                           <div className="text-[9px] text-slate-500 font-medium text-center leading-tight line-clamp-3 w-full">
                             {step.remarks}
                           </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="text-[10px] font-bold text-amber-600/80 mt-1 w-full text-center bg-amber-50 p-2 rounded-lg border border-amber-100/50">Awaiting arrival...</div>
                   )}
                   
                   {/* Tooltip Arrow pointing down */}
                   <div className={`absolute top-[99%] border-[7px] border-transparent border-t-white/95 ${
                     isFirst && timeline.length > 1 ? 'left-[38px]' : 
                     isLast && timeline.length > 1 ? 'right-[38px] left-auto' : 
                     'left-1/2 -translate-x-1/2'
                   }`}></div>
                </div>

                {/* Node Icon with Pulse Animation */}
                <div className="relative z-10">
                  {isCompleted && index === timeline.length - 1 && (
                     <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-40"></div>
                  )}
                  <motion.div 
                    whileHover={{ scale: 1.15 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-[2.5px] relative transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-white text-[#cc181e] border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' 
                      : 'bg-[#8a1014] text-red-300/50 border-red-900/60 shadow-inner'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" strokeWidth={3.5} /> : <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>}
                  </motion.div>
                </div>
                
                {/* Label aligned normally in the flex column */}
                <span className={`mt-2.5 text-[10px] font-black text-center leading-[1.3] transition-colors w-full break-words tracking-tight ${isCompleted ? 'text-white drop-shadow-sm' : 'text-red-200/50'}`}>
                  {step.department}
                </span>

              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// Simple icon for the header
const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

export default SummaryCard;
