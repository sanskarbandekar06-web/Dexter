
import React from 'react';
import { LucideIcon, BedDouble, ChevronUp, ChevronDown, Maximize2, Minimize2, CheckCircle2, Circle } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { ThemeColors, Task } from '../types';

interface MetricCardProps {
  label: string;
  val: number;
  maxVal: number;
  k: string;
  sub: string;
  col: string;
  bg: string;
  liquidColor: string;
  secondaryLiquidColor: string;
  onChange: (field: string, value: string) => void;
  theme: ThemeColors;
  customIconType?: 'academics' | 'recovery' | 'digital' | 'vitality';
  icon?: LucideIcon;
  isDarkMode: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  tasks?: Task[];
}

const CustomBookIcon = ({ colorClass }: { colorClass: string }) => (
  <div className="relative w-6 h-7 book-container flex items-center justify-center drop-shadow-sm">
    <div className="absolute w-5 h-6 bg-white border border-gray-200 rounded-r-sm right-0 shadow-sm top-[1px]"></div>
    <div className={`absolute w-4 h-5 right-[2px] top-[3px] bg-white opacity-90 border-l border-gray-100 flex flex-col gap-[2px] pt-1.5 pl-[3px]`}>
        <div className="w-2.5 h-[1.5px] bg-black/10 rounded-full"></div>
        <div className="w-3 h-[1.5px] bg-black/10 rounded-full"></div>
    </div>
    <div className={`absolute w-5 h-7 rounded-r-md ${colorClass} bg-current z-10 book-cover left-0 top-0 shadow-md flex flex-col items-center justify-center gap-[2px] border-l border-white/20`}>
        <div className="w-2.5 h-[1.5px] bg-white/40 rounded-full"></div>
        <div className="w-3 h-[1.5px] bg-white/40 rounded-full"></div>
    </div>
  </div>
);

const CustomBedIcon = ({ colorClass }: { colorClass: string }) => (
  <div className="relative w-5 h-5">
    <BedDouble size={20} className={colorClass} />
    <div className="absolute -top-2 right-0 flex flex-col items-center">
      <span className={`text-[8px] font-bold absolute -top-1 right-0 zzz zzz-3 ${colorClass}`}>z</span>
      <span className={`text-[6px] font-bold absolute top-1 -right-1 zzz zzz-2 ${colorClass}`}>Z</span>
    </div>
  </div>
);

const CustomDigitalIcon = ({ colorClass }: { colorClass: string }) => (
  <div className={`relative w-5 h-8 border-[2px] rounded-md flex items-center justify-center overflow-hidden bg-white ${colorClass} border-current shadow-sm`}>
    <div className={`absolute inset-0 opacity-10 bg-current`}></div>
    <div className={`absolute w-1 h-1 rounded-full bg-current z-20 shadow-sm`}></div>
    <div className={`absolute bottom-1/2 left-1/2 w-[1.5px] h-2 bg-current -ml-[0.75px] rounded-full clock-hand hand-h`}></div> 
    <div className={`absolute bottom-1/2 left-1/2 w-[1px] h-2.5 bg-current -ml-[0.5px] rounded-full clock-hand hand-m`}></div> 
  </div>
);

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, val, maxVal, k, sub, col, bg, liquidColor, secondaryLiquidColor, onChange, theme, customIconType, icon: Icon, isDarkMode,
  isExpanded, onToggleExpand, tasks = []
}) => {
  const percentage = Math.min(Math.max((val / maxVal) * 100, 0), 100);

  const waveVariants: Variants = {
    animate: (i: number) => ({
      x: ["0%", "-50%"],
      transition: {
        duration: i === 1 ? 10 : 15,
        repeat: Infinity,
        ease: "linear" as const
      }
    })
  };

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.min(maxVal, val + 0.5);
    onChange(k, nextVal.toString());
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.max(0, val - 0.5);
    onChange(k, nextVal.toString());
  };

  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`${theme.card} relative overflow-hidden group transition-all duration-300 flex flex-col transform-gpu ${isExpanded ? 'col-span-2 min-h-[400px] p-6' : 'h-full p-4 md:p-5'}`}
      onClick={!isExpanded ? onToggleExpand : undefined}
    >
      {/* Background Reservoir Simulation */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
        <div className="absolute top-0 left-4 w-3 h-full bg-white/10 blur-[3px] z-30" />
        
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end h-full">
           <motion.div 
             initial={{ height: 0 }}
             animate={{ height: isExpanded ? '100%' : `${percentage}%` }}
             transition={{ type: "spring", stiffness: 30, damping: 15 }}
             className={`w-full relative ${liquidColor}`}
           >
             {/* Using bottom-[calc(100%-1px)] to prevent sub-pixel rendering gaps/lines between wave and body */}
             <div className="absolute bottom-[calc(100%-1px)] left-0 w-[200%] h-12 overflow-hidden">
               <motion.svg viewBox="0 0 200 20" preserveAspectRatio="none" custom={1} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-80 fill-current ${col}`}>
                 <path d="M0 10 Q 25 20 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
               </motion.svg>
               <motion.svg viewBox="0 0 200 20" preserveAspectRatio="none" custom={2} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-50 fill-current translate-y-1 ${secondaryLiquidColor}`}>
                 <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
               </motion.svg>
             </div>
           </motion.div>
        </div>
      </div>

      {/* Card Content Overlay */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="flex justify-between items-start mb-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${bg} ${col} bg-opacity-20 shadow-sm backdrop-blur-md border border-white/10`}>
              {customIconType === 'academics' && <CustomBookIcon colorClass={col} />}
              {customIconType === 'recovery' && <CustomBedIcon colorClass={isDarkMode ? 'text-white' : col} />}
              {customIconType === 'digital' && <CustomDigitalIcon colorClass={col} />}
              {customIconType === 'vitality' && Icon && <Icon size={20} className="anim-heart" />}
              {!customIconType && Icon && <Icon size={20} />}
            </div>
            <div>
              <span className={`text-[11px] font-black tracking-widest uppercase ${theme.text} block leading-none mb-0.5`}>{label}</span>
              <div className={`text-[9px] font-bold uppercase opacity-40 ${theme.text}`}>{sub}</div>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className={`p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95
              ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}
            `}
          >
            {isExpanded ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </button>
        </div>
        
        <div className={`flex flex-col ${isExpanded ? 'md:flex-row gap-8 mt-4' : 'justify-center flex-1 mt-2'}`}>
          <div className={`${isExpanded ? 'md:w-1/3' : 'w-full'} flex items-center justify-between pointer-events-auto`}>
            <div className="flex items-baseline">
                <span 
                  className={`text-4xl md:text-5xl font-black ${theme.text} tabular-nums tracking-tighter drop-shadow-sm select-none`}
                >
                  {val}
                </span>
                <span className={`ml-2 text-lg font-bold opacity-30 ${theme.text}`}>/ {maxVal}</span>
            </div>
              
            {/* Minimal Controls */}
            <div className="flex flex-col gap-1 ml-2">
              <motion.button 
                whileHover={{ scale: 1.2, y: -1 }}
                whileTap={{ scale: 0.9 }}
                onClick={increment}
                className={`p-1 rounded-lg ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/5'} transition-all`}
              >
                <ChevronUp size={22} strokeWidth={3} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.2, y: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={decrement}
                className={`p-1 rounded-lg ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/5'} transition-all`}
              >
                <ChevronDown size={22} strokeWidth={3} />
              </motion.button>
            </div>
          </div>

          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 space-y-3 max-h-[250px] overflow-y-auto pr-4 custom-scrollbar pointer-events-auto"
            >
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${theme.text}`}>Active Objectives</h4>
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className={`p-4 rounded-2xl border ${theme.cardBorder} ${isDarkMode ? 'bg-white/5' : 'bg-white'} flex items-center justify-between group/task`}>
                    <div className="flex items-center gap-3">
                      {task.done ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Circle className="opacity-30" size={18} />}
                      <span className={`text-sm font-bold ${task.done ? 'line-through opacity-40' : ''} ${theme.text}`}>{task.text}</span>
                    </div>
                    {task.isAI && (
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                        AI
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={`p-8 border-2 border-dashed ${theme.cardBorder} rounded-3xl text-center opacity-40`}>
                  <p className="text-xs font-bold italic">No specialized objectives for this pillar.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
