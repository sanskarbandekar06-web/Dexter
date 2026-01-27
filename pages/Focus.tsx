
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Pause, Play, RotateCcw, Plus, Minus, Trees, Leaf, Sparkles, X, Wind, Coffee, Zap } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ThemeColors } from '../types';

interface FocusState {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
}

interface FocusPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
  focusState: FocusState;
  setFocusState: React.Dispatch<React.SetStateAction<FocusState>>;
}

const DEFAULT_TIME = 25 * 60;

// Ambient fireflies/spores component
const AmbientParticles = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const particles = useMemo(() => Array.from({ length: 15 }), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            x: [null, Math.random() * 100 + "%", Math.random() * 100 + "%"],
            y: [null, Math.random() * 100 + "%", Math.random() * 100 + "%"],
            opacity: [0, 0.4, 0.8, 0.4, 0],
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`absolute w-1 h-1 rounded-full blur-[1px] ${isDarkMode ? 'bg-indigo-300 shadow-[0_0_8px_indigo]' : 'bg-orange-300 shadow-[0_0_8px_orange]'}`}
        />
      ))}
    </div>
  );
};

// Breathing Exercise Overlay
const BreathingOverlay = ({ onClose, isDarkMode }: { onClose: () => void; isDarkMode: boolean }) => {
  const [text, setText] = useState("Inhale");
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const cycle = [
      { t: "Inhale", s: 1.5 },
      { t: "Hold", s: 1.5 },
      { t: "Exhale", s: 1.0 },
      { t: "Hold", s: 1.0 },
    ];
    
    let step = 0;
    
    const runStep = () => {
      const { t, s } = cycle[step];
      setText(t);
      setScale(s);
      step = (step + 1) % 4;
    };

    runStep(); // Initial
    const interval = setInterval(runStep, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] overflow-hidden"
    >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2"><X size={32}/></button>
        
        <div className="relative flex items-center justify-center mb-12">
            <motion.div 
                animate={{ scale: scale }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className={`w-64 h-64 rounded-full ${isDarkMode ? 'bg-indigo-500/20' : 'bg-emerald-500/20'} blur-2xl absolute`}
            />
            <motion.div 
                animate={{ scale: scale }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className={`w-48 h-48 rounded-full border-4 ${isDarkMode ? 'border-indigo-400' : 'border-emerald-400'} flex items-center justify-center relative z-10 shadow-lg`}
            >
                <span className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">{text}</span>
            </motion.div>
        </div>
        
        <div className="text-center space-y-2">
            <h3 className="text-white text-2xl font-black cinematic-text">Purity Protocol</h3>
            <p className="text-white/60 font-medium tracking-wide text-sm max-w-xs mx-auto">Synchronize your breath to clear cognitive cache.</p>
        </div>
    </motion.div>
  );
};

const FocusPage: React.FC<FocusPageProps> = ({ isDarkMode, theme, focusState, setFocusState }) => {
  const { timeLeft, totalTime, isActive } = focusState;
  
  // Custom Time Input State
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  
  // Purity Mode State
  const [showPurity, setShowPurity] = useState(false);

  // Helper to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (amount: number) => {
    const newTotal = Math.max(60, totalTime + amount);
    setFocusState(prev => ({
        ...prev,
        totalTime: newTotal,
        timeLeft: newTotal,
        isActive: false
    }));
  };

  const handleTimeClick = () => {
    if (isActive) return;
    setIsEditing(true);
    setEditValue(Math.floor(totalTime / 60).toString());
  };

  const handleTimeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(editValue);
    if (!isNaN(val) && val > 0 && val <= 180) { // Limit to 3 hours
      const newTime = val * 60;
      setFocusState({ timeLeft: newTime, totalTime: newTime, isActive: false });

      // Ask for background permission (Notifications) when setting a custom timer
      if ("Notification" in window && Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.log("Notification permission ignored");
        }
      }
    }
    setIsEditing(false);
  };

  // Fluid Progress Calculation (Filling up)
  const progress = 1 - (timeLeft / totalTime);
  const percentage = progress * 100;

  const waveVariants: Variants = {
    animate: (i: number) => ({
      x: [0, -100, 0],
      transition: {
        duration: i === 1 ? 4 : 7,
        repeat: Infinity,
        ease: "linear" as const
      }
    })
  };

  // Presets
  const applyPreset = (minutes: number) => {
      const t = minutes * 60;
      setFocusState({ timeLeft: t, totalTime: t, isActive: false });
  };

  return (
    <div className={`relative h-full flex flex-col items-center justify-between overflow-y-auto md:overflow-hidden rounded-[2rem] md:rounded-[3rem] transition-all duration-1000 ${isDarkMode ? 'bg-[#020617]' : 'bg-[#FDFBF7]'} border border-white/10 shadow-2xl`}>
      
      {/* 1. COZY FOREST BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Sky Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b opacity-40 ${isDarkMode ? 'from-indigo-950 via-slate-950 to-black' : 'from-orange-50 via-stone-50 to-white'}`} />
        
        {/* Distant Forest Silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-around opacity-10 px-12">
           <Trees size={120} className={theme.text} strokeWidth={1} />
           <Trees size={180} className={theme.text} strokeWidth={1} />
           <Trees size={140} className={theme.text} strokeWidth={1} />
           <Trees size={200} className={theme.text} strokeWidth={1} />
        </div>

        {/* Floating Particles */}
        <AmbientParticles isDarkMode={isDarkMode} />

        {/* Drifting Leaves */}
        <motion.div 
          animate={{ x: [0, 20, 0], y: [0, 10, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 opacity-10 text-emerald-600"
        >
          <Leaf size={40} />
        </motion.div>
        
        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.1)]" />
      </div>

      <AnimatePresence>
        {showPurity && <BreathingOverlay onClose={() => setShowPurity(false)} isDarkMode={isDarkMode} />}
      </AnimatePresence>

      {/* HEADER */}
      <header className="relative z-10 text-center space-y-2 mt-6 md:mt-12 w-full px-6 shrink-0">
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/5 border-orange-500/20'} text-[10px] font-black uppercase tracking-[0.2em] ${theme.text}`}
           >
             <Sparkles size={12} className="text-orange-500" /> Sanctuary Protocol
           </motion.div>
           <h2 className={`text-3xl md:text-5xl font-black ${theme.text} cinematic-text`}>Focus Reservoir</h2>
      </header>

      {/* 2. MAIN TIMER INTERFACE (CENTERED) */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-center w-full max-w-2xl px-4 md:px-6 py-4 min-h-[400px]">
        
        <div className="relative flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-0">
          
          {/* ADJUSTMENT CONTROLS - LEFT (Add) */}
          <div className="order-2 md:order-1 md:absolute md:left-0 xl:-left-12 flex flex-row md:flex-col gap-4 z-20">
             <motion.button 
               whileHover={{ scale: 1.1, x: -2 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => adjustTime(300)}
               aria-label="Add 5 Minutes"
               className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border ${theme.sidebarBorder} ${theme.cardBg} ${theme.text} shadow-xl backdrop-blur-md flex flex-col items-center justify-center group`}
             >
                <Plus size={20} className="group-hover:text-orange-500 transition-colors" />
                <span className="text-[9px] font-black mt-0.5">5m</span>
             </motion.button>
             <motion.button 
               whileHover={{ scale: 1.1, x: -2 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => adjustTime(60)}
               aria-label="Add 1 Minute"
               className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border ${theme.sidebarBorder} ${theme.cardBg} ${theme.text} shadow-xl backdrop-blur-md flex flex-col items-center justify-center group`}
             >
                <Plus size={20} className="group-hover:text-orange-500 transition-colors" />
                <span className="text-[9px] font-black mt-0.5">1m</span>
             </motion.button>
          </div>

          {/* THE FLUID JAR */}
          <div className="order-1 md:order-2 relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center my-4 md:my-0">
            <div className={`relative w-full h-full rounded-full border-[8px] md:border-[12px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-colors duration-500
              ${isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/40 border-slate-100'}
            `}>
              {/* Glass Glare */}
              <div className="absolute top-0 left-16 w-10 h-full bg-white/10 blur-2xl z-30 pointer-events-none rounded-full" />
              
              {/* Liquid Wave Container */}
              <div className="absolute inset-0 flex flex-col justify-end">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${percentage}%` }}
                  transition={{ type: "spring", stiffness: 20, damping: 10 }}
                  className={`relative w-full transition-colors duration-1000
                    ${isDarkMode ? 'bg-indigo-600/80' : 'bg-orange-400/80'}
                  `}
                >
                  {/* The Waves */}
                  <div className="absolute bottom-full left-0 w-[200%] h-16 overflow-hidden">
                    <motion.svg viewBox="0 0 100 20" preserveAspectRatio="none" custom={1} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-60 fill-current ${isDarkMode ? 'text-indigo-600' : 'text-orange-400'}`}>
                      <path d="M0 10 Q 25 20 50 10 T 100 10 V 20 H 0 Z" />
                    </motion.svg>
                    <motion.svg viewBox="0 0 100 20" preserveAspectRatio="none" custom={2} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-40 fill-current translate-y-2 ${isDarkMode ? 'text-fuchsia-500' : 'text-rose-400'}`}>
                      <path d="M0 10 Q 25 0 50 10 T 100 10 V 20 H 0 Z" />
                    </motion.svg>
                  </div>
                </motion.div>
              </div>

              {/* Central Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-40 drop-shadow-2xl">
                 {isEditing ? (
                   <form onSubmit={handleTimeSubmit} className="flex flex-col items-center w-full px-12">
                     <input 
                       autoFocus
                       type="number"
                       value={editValue}
                       onChange={e => setEditValue(e.target.value)}
                       onBlur={() => handleTimeSubmit()}
                       className={`w-full text-center bg-transparent border-b-2 border-white/50 outline-none text-6xl md:text-8xl font-black cinematic-text ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2`}
                     />
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Enter Minutes</span>
                   </form>
                 ) : (
                   <motion.div 
                     key={timeLeft}
                     onClick={handleTimeClick}
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     whileHover={{ scale: 1.05 }}
                     className={`cursor-pointer text-6xl md:text-8xl font-black tabular-nums tracking-tighter cinematic-text ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                     title="Click to edit duration"
                   >
                     {formatTime(timeLeft)}
                   </motion.div>
                 )}
                 {!isEditing && (
                   <div className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40 transition-colors mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                     {isActive ? 'Flow State' : 'Tap to Edit'}
                   </div>
                 )}
              </div>
            </div>
            
            {/* Outer Glow Ring */}
            <div className={`absolute -inset-8 blur-[80px] opacity-15 pointer-events-none rounded-full transition-colors duration-1000 ${isDarkMode ? 'bg-indigo-500' : 'bg-orange-500'}`} />
          </div>

          {/* ADJUSTMENT CONTROLS - RIGHT (Subtract) */}
          <div className="order-3 md:order-3 md:absolute md:right-0 xl:-right-12 flex flex-row md:flex-col gap-4 z-20">
             <motion.button 
               whileHover={{ scale: 1.1, x: 2 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => adjustTime(-300)}
               aria-label="Subtract 5 Minutes"
               className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border ${theme.sidebarBorder} ${theme.cardBg} ${theme.text} shadow-xl backdrop-blur-md flex flex-col items-center justify-center group`}
             >
                <Minus size={20} className="group-hover:text-rose-500 transition-colors" />
                <span className="text-[9px] font-black mt-0.5">5m</span>
             </motion.button>
             <motion.button 
               whileHover={{ scale: 1.1, x: 2 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => adjustTime(-60)}
               aria-label="Subtract 1 Minute"
               className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border ${theme.sidebarBorder} ${theme.cardBg} ${theme.text} shadow-xl backdrop-blur-md flex flex-col items-center justify-center group`}
             >
                <Minus size={20} className="group-hover:text-rose-500 transition-colors" />
                <span className="text-[9px] font-black mt-0.5">1m</span>
             </motion.button>
          </div>
        </div>

        {/* 3. CONTROL BUTTONS */}
        <div className="flex gap-6 md:gap-12 items-center mt-8 md:mt-12 mb-4 md:mb-0">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setFocusState(prev => ({...prev, isActive: false, timeLeft: prev.totalTime}))} 
            aria-label="Reset Timer"
            className={`p-4 md:p-6 rounded-full hover:bg-black/5 dark:hover:bg-white/5 border ${theme.sidebarBorder} ${theme.text} transition-all group`}
          >
            <RotateCcw size={20} className="md:w-6 md:h-6 group-hover:-rotate-180 transition-transform duration-700" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: isDarkMode ? '0 0 60px rgba(99,102,241,0.5)' : '0 0 60px rgba(249,115,22,0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFocusState(prev => ({...prev, isActive: !prev.isActive}))} 
            aria-label={isActive ? "Pause Timer" : "Start Timer"}
            className={`relative p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden group ${theme.buttonPrimary}`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
            <div className="relative z-10">
              {isActive ? <Pause size={32} className="md:w-10 md:h-10" /> : <Play size={32} className="md:w-10 md:h-10 ml-1 md:ml-2" />}
            </div>
          </motion.button>

          <div 
            onClick={() => setShowPurity(true)}
            className="flex flex-col items-center opacity-40 hover:opacity-100 transition-all cursor-pointer group" 
            aria-label="Activate Purity Protocol"
          >
             <div className="p-3 rounded-2xl bg-transparent group-hover:bg-emerald-500/10 transition-colors">
               <Leaf size={20} className={`md:w-6 md:h-6 ${theme.text} group-hover:text-emerald-500 transition-colors`} />
             </div>
             <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${theme.text}`}>Purity</span>
          </div>
        </div>
      </div>

      {/* 4. FOOTER PRESETS - TO FILL SPACE */}
      <div className={`relative z-10 w-full p-4 md:px-12 md:py-6 border-t ${theme.sidebarBorder} backdrop-blur-md bg-white/5 dark:bg-black/10 shrink-0`}>
         <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <button onClick={() => applyPreset(25)} className={`flex items-center gap-2 px-4 py-3 md:px-6 rounded-xl border ${theme.sidebarBorder} hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[10px] md:text-xs font-bold ${theme.text} whitespace-nowrap`}>
               <Zap size={14} className="text-orange-500"/> Focus (25m)
            </button>
            <button onClick={() => applyPreset(50)} className={`flex items-center gap-2 px-4 py-3 md:px-6 rounded-xl border ${theme.sidebarBorder} hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[10px] md:text-xs font-bold ${theme.text} whitespace-nowrap`}>
               <Zap size={14} className="text-orange-500 fill-current"/> Flow (50m)
            </button>
            <button onClick={() => applyPreset(5)} className={`flex items-center gap-2 px-4 py-3 md:px-6 rounded-xl border ${theme.sidebarBorder} hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[10px] md:text-xs font-bold ${theme.text} whitespace-nowrap`}>
               <Coffee size={14} className="text-emerald-500"/> Short Break
            </button>
            <button onClick={() => applyPreset(15)} className={`flex items-center gap-2 px-4 py-3 md:px-6 rounded-xl border ${theme.sidebarBorder} hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[10px] md:text-xs font-bold ${theme.text} whitespace-nowrap`}>
               <Coffee size={14} className="text-emerald-500 fill-current"/> Long Break
            </button>
         </div>
      </div>
    </div>
  );
};

export default FocusPage;
