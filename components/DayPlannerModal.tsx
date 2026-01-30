
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Battery, Target, Sparkles, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { ThemeColors, Task } from '../types';

interface DayPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (energy: string, wakeTime: string, priorities: string[]) => void;
  theme: ThemeColors;
  isDarkMode: boolean;
  isLoading: boolean;
}

const DayPlannerModal: React.FC<DayPlannerModalProps> = ({ 
  isOpen, onClose, onGenerate, theme, isDarkMode, isLoading 
}) => {
  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState(50);
  const [wakeTime, setWakeTime] = useState("08:00");
  const [priorities, setPriorities] = useState(["", "", ""]);

  const getEnergyLabel = (val: number) => {
    if (val < 30) return "Depleted (Low Spoons)";
    if (val < 70) return "Moderate Flow";
    return "Overflowing (High Spoons)";
  };

  const handlePriorityChange = (index: number, val: string) => {
    const newP = [...priorities];
    newP[index] = val;
    setPriorities(newP);
  };

  const handleSubmit = () => {
    const validPriorities = priorities.filter(p => p.trim() !== "");
    onGenerate(getEnergyLabel(energy), wakeTime, validPriorities.length > 0 ? validPriorities : ["General Well-being"]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-[2.5rem] border ${theme.cardBorder} shadow-3xl overflow-hidden flex flex-col max-h-[90vh] relative ${theme.cardBg}`}
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
           <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/20 to-rose-400/20 rounded-full blur-[80px]`} />
           <div className={`absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-[80px]`} />
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <X size={24} className={theme.text} />
        </button>

        <div className="relative z-10 p-8 md:p-10 flex flex-col h-full">
          <div className="text-center mb-8">
             <motion.div 
               initial={{ y: -10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-500/20"
             >
               <Sun size={12} /> Day Architect
             </motion.div>
             <h2 className={`text-3xl md:text-4xl font-black cinematic-text ${theme.text}`}>Design Your Flow</h2>
             <p className={`text-sm opacity-60 mt-2 ${theme.text}`}>Aligning tasks with your biological rhythm.</p>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar px-2">
             
             {/* 1. Wake Time */}
             <div className="space-y-3">
                <label className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                   <Clock size={14} /> Circadian Anchor (Wake Time)
                </label>
                <input 
                  type="time" 
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className={`w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border ${theme.cardBorder} ${theme.text} font-bold outline-none focus:ring-2 ring-orange-500/20`}
                />
             </div>

             {/* 2. Energy Level */}
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                      <Battery size={14} /> Energy Reserves
                   </label>
                   <span className="text-xs font-bold text-orange-500">{getEnergyLabel(energy)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={energy} 
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
             </div>

             {/* 3. Priorities */}
             <div className="space-y-3">
                <label className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${theme.text} opacity-50`}>
                   <Target size={14} /> Primary Objectives (Max 3)
                </label>
                <div className="space-y-2">
                   {priorities.map((p, i) => (
                     <input 
                       key={i}
                       placeholder={`Priority ${i + 1} (e.g. Finish Calculus)`}
                       value={p}
                       onChange={(e) => handlePriorityChange(i, e.target.value)}
                       className={`w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border ${theme.cardBorder} ${theme.text} text-sm font-medium outline-none focus:border-orange-500 transition-colors`}
                     />
                   ))}
                </div>
             </div>

          </div>

          <div className="mt-8">
             <button 
               onClick={handleSubmit}
               disabled={isLoading}
               className={`w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
             >
               {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               {isLoading ? "Consulting The Brain..." : "Generate Schedule"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DayPlannerModal;
