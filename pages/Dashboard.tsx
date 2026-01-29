
import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Sparkles, Grid, LineChart as LineChartIcon, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { ThemeColors, UserData, HistoryItem, Task, PillarType, Course, UserProfile } from '../types';
import { generateYearHistory } from '../constants';
import { auth, db, collection, query, onSnapshot, setDoc, doc, serverTimestamp } from '../lib/firebase';
import { startOfDay, format } from 'date-fns';

interface DashboardViewProps {
  userData: UserData;
  handleDataUpdate: (field: string, value: string) => void;
  userProfile?: UserProfile;
  handleProfileUpdate?: (p: UserProfile) => void;
  history: HistoryItem[];
  isDarkMode: boolean;
  theme: ThemeColors;
  aiInsight?: string;
  tasks: Task[];
  courses?: Course[];
  fitbitDetails?: { steps: number, calories: number, avgHr: number } | null;
  onConnectGoogleFit?: () => void;
  isGoogleFitConnected?: boolean;
}

// --- ORIGINAL SCORE JAR VISUALIZER (Reverted) ---
const ScoreJar = ({ score, isDarkMode }: { score: number, isDarkMode: boolean }) => {
  const percentage = Math.min(Math.max(score, 0), 100);
  
  const waveVariants: Variants = {
    animate: (i: number) => ({
      x: ["0%", "-50%"],
      transition: {
        duration: i === 1 ? 8 : 12,
        repeat: Infinity,
        ease: "linear" as const
      }
    })
  };

  return (
    <div className="relative w-48 h-64 md:w-56 md:h-72 flex items-center justify-center">
      {/* Jar Body */}
      <div className={`relative w-full h-full rounded-[4rem] border-[8px] md:border-[10px] overflow-hidden shadow-2xl transition-all duration-700
        ${isDarkMode 
          ? 'bg-slate-900/30 border-slate-700/50 shadow-[0_0_40px_rgba(99,102,241,0.2)]' 
          : 'bg-white/40 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}
        backdrop-blur-sm
      `}>
        
        {/* Glass Reflections */}
        <div className="absolute top-4 left-4 w-4 h-32 bg-white/20 rounded-full blur-[2px] z-20 pointer-events-none" />
        <div className="absolute top-4 right-6 w-2 h-16 bg-white/10 rounded-full blur-[1px] z-20 pointer-events-none" />

        {/* Liquid Container */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end h-full">
           <motion.div 
             initial={{ height: 0 }}
             animate={{ height: `${percentage}%` }}
             transition={{ type: "spring", stiffness: 20, damping: 10 }}
             className={`w-full relative transition-colors duration-1000
               ${isDarkMode ? 'bg-indigo-600' : 'bg-orange-400'}
             `}
           >
             {/* Waves */}
             <div className="absolute bottom-[calc(100%-1px)] left-0 w-[200%] h-12 overflow-hidden">
               <motion.svg viewBox="0 0 200 20" preserveAspectRatio="none" custom={1} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-70 fill-current ${isDarkMode ? 'text-indigo-500' : 'text-orange-300'}`}>
                 <path d="M0 10 Q 25 20 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
               </motion.svg>
               <motion.svg viewBox="0 0 200 20" preserveAspectRatio="none" custom={2} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-40 fill-current translate-y-1 ${isDarkMode ? 'text-indigo-400' : 'text-orange-200'}`}>
                 <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
               </motion.svg>
             </div>

             {/* Bubbles */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ y: [0, -200], opacity: [0, 0.6, 0] }}
                    transition={{ duration: 3 + Math.random()*2, repeat: Infinity, delay: Math.random()*2 }}
                    className="absolute w-2 h-2 bg-white/30 rounded-full"
                    style={{ left: `${20 + Math.random()*60}%`, bottom: '-10px' }}
                  />
                ))}
             </div>
           </motion.div>
        </div>

        {/* Score Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 drop-shadow-md">
           <span className={`text-6xl md:text-7xl font-black tabular-nums tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(score)}</span>
           <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-60 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Daily Score</span>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3 py-2 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md border ${isDarkMode ? 'bg-slate-900/90 text-white border-white/10' : 'bg-white/95 text-slate-900 border-slate-200'}`}>
        <p className="opacity-50 mb-1">{label}</p>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500" />
           <span>{Math.round(payload[0].value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// -- ISOLATED CHART COMPONENT --
const PerformanceCharts = React.memo(({ 
  yearData, trendData, chartMode, isDarkMode, theme
}: any) => {
  const [hoveredNode, setHoveredNode] = useState<{ idx: number, score: number, date: string } | null>(null);

  const getHeatMapColor = (s: number) => {
    // When score is 0, explicitly return a 'white' style or transparent style
    // "make the heat map to white colour when it zero"
    if (s === 0) return isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-200'; 
    
    if (isDarkMode) {
      if (s >= 80) return 'bg-[#818cf8]'; // Indigo
      if (s >= 50) return 'bg-[#6366f1]'; // Violet
      if (s >= 20) return 'bg-[#4338ca]'; // Deep Indigo
      return 'bg-slate-800'; 
    } else {
      if (s >= 80) return 'bg-[#fbbf24]'; // Amber
      if (s >= 50) return 'bg-[#f59e0b]'; // Orange
      if (s >= 20) return 'bg-[#d97706]'; // Dark Orange
      return 'bg-orange-100';
    }
  };

  const monthLabels: { label: string, colIndex: number }[] = [];
  yearData.forEach((d: any, i: number) => {
    if (d.index !== -1 && d.isFirstDayOfMonth) {
      const colIndex = Math.floor(i / 7);
      if (!monthLabels.some(m => m.colIndex === colIndex)) {
        monthLabels.push({ label: d.month, colIndex });
      }
    }
  });

  const totalCols = Math.ceil(yearData.length / 7);

  return (
    <div className="relative z-10 flex-1 w-full min-h-[300px]">
      <AnimatePresence mode="wait">
        {chartMode === 'heatmap' && (
          <motion.div 
            key="heatmap"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col"
          >
              <div className="w-full flex-1 flex flex-col justify-center">
                 <div className="w-full h-full flex flex-col justify-center">
                    <div className="flex mb-2 pl-8 relative h-4 w-full">
                       {monthLabels.map((m, i) => (
                         <div 
                           key={i} 
                           className="absolute text-[9px] font-black uppercase tracking-widest opacity-40"
                           // Dynamic positioning based on percentage to match 1fr columns
                           style={{ left: `calc(${(m.colIndex / totalCols) * 100}% + 28px)` }}
                         >
                           {m.label}
                         </div>
                       ))}
                    </div>

                    <div className="flex w-full items-center">
                      <div className="flex flex-col gap-[3px] mr-2 shrink-0">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                          <div key={d} className="h-[14px] flex items-center justify-end min-w-[20px]">
                            <span className={`text-[9px] font-bold ${[1,3,5].includes(i) ? 'opacity-40' : 'opacity-0'}`}>{d}</span>
                          </div>
                        ))}
                      </div>

                      <div 
                        className="grid gap-[3px] grid-flow-col w-full"
                        style={{ 
                          gridTemplateRows: 'repeat(7, 1fr)',
                          // Stretch columns to fill width
                          gridAutoColumns: '1fr' 
                        }}
                      >
                        {yearData.map((data: any, idx: number) => {
                          if (data.index === -1) {
                            return <div key={`pad-${idx}`} className="h-[14px]" />;
                          }
                          return (
                            <motion.div
                              key={idx}
                              onMouseEnter={() => setHoveredNode({ idx, score: data.score, date: data.date })}
                              onMouseLeave={() => setHoveredNode(null)}
                              whileHover={{ scale: 1.4, zIndex: 50 }}
                              // Prevent layout shifts during scale by relying on transforms
                              layout={false} 
                              className={`h-[14px] rounded-[3px] transition-colors duration-300 relative ${getHeatMapColor(data.score)}`}
                            >
                              <AnimatePresence>
                                {hoveredNode?.idx === idx && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -40, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`absolute left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg shadow-xl z-50 pointer-events-none whitespace-nowrap border ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                                  >
                                    <div className="text-[10px] font-bold opacity-50 mb-0.5 uppercase">{hoveredNode.date}</div>
                                    <div className="text-xs font-black">Score: {hoveredNode.score}</div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                 </div>
              </div>
          </motion.div>
        )}

        {chartMode === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-[300px] relative"
          >
            <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden rounded-3xl">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 8, repeat: Infinity }}
                  className={`absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] ${isDarkMode ? 'bg-indigo-600' : 'bg-orange-300'}`} 
                />
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                  className={`absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full blur-[80px] ${isDarkMode ? 'bg-fuchsia-600' : 'bg-rose-300'}`} 
                />
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDarkMode ? "#818cf8" : "#fbbf24"} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={isDarkMode ? "#818cf8" : "#fbbf24"} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} stroke="currentColor" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}
                  stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  interval="preserveStartEnd"
                  minTickGap={20}
                  tickFormatter={(val) => val.slice(0, 5)}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}
                  stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                    cursor={{ stroke: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} 
                    content={<CustomTooltip isDarkMode={isDarkMode} />} 
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={isDarkMode ? "#818cf8" : "#fbbf24"} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                  filter="url(#glow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const DashboardView: React.FC<DashboardViewProps> = ({ isDarkMode, theme, aiInsight, tasks = [], courses = [], handleDataUpdate, userProfile, handleProfileUpdate, fitbitDetails, onConnectGoogleFit, isGoogleFitConnected }) => {
  const [metrics, setMetrics] = useState<UserData>({ sleep: 0, study: 0, exercise: 0, screenTime: 0, score: 0 });
  const [loading, setLoading] = useState(true);
  const [yearData, setYearData] = useState<any[]>(generateYearHistory(true)); // Start empty
  const [expandedPillar, setExpandedPillar] = useState<PillarType | null>(null);
  const [chartMode, setChartMode] = useState<'heatmap' | 'graph'>('heatmap');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Listener for ALL daily stats to populate history and today's metrics
    const q = query(collection(db, 'users', user.uid, 'dailyStats'));
    
    const unsub = onSnapshot(q, (snap) => {
       const historyMap = new Map();
       // Default state
       let todayMetrics: Partial<UserData> = { sleep: 0, study: 0, exercise: 0, screenTime: 0, score: 0 };
       
       snap.forEach(doc => {
         const data = doc.data();
         historyMap.set(doc.id, data);
         if (doc.id === todayStr) {
            todayMetrics = {
                ...data,
                // Ensure defaults for optional fields if missing in old data
                sleep: data.sleep || 0,
                study: data.study || 0,
                exercise: data.exercise || 0,
                screenTime: data.screenTime || 0,
                score: data.score || 0
            };
         }
       });

       // Merge local app state (live tracker) with DB state to avoid flickering reset
       setMetrics(prev => ({ ...prev, ...todayMetrics as UserData }));
       
       // SYNC TO APP STATE
       Object.entries(todayMetrics).forEach(([key, val]) => {
          handleDataUpdate(key, val.toString());
       });

       // Merge real data with grid skeleton
       const blankGrid = generateYearHistory(true);
       const mergedGrid = blankGrid.map(day => {
          if (day.index === -1) return day;
          const record = historyMap.get(day.date);
          return {
            ...day,
            score: record ? record.score : 0,
          };
       });
       
       setYearData(mergedGrid);
       setLoading(false);
    });

    return () => unsub();
  }, []); 

  const handleLiveUpdate = async (field: string, value: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    // STRICT 2-digit format
    const val = parseFloat(parseFloat(value).toFixed(2));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Optimistic update local state
    const newMetrics = { ...metrics, [field]: val };
    setMetrics(newMetrics);
    
    handleDataUpdate(field, value);

    // Calculate Exam Performance
    let examScoreComponent = 0;
    let totalExamPercent = 0;
    let examCount = 0;
    
    courses.forEach(c => {
        c.exams.forEach(e => {
            if (e.score !== undefined) {
                totalExamPercent += (e.score / e.totalMarks) * 100;
                examCount++;
            }
        });
    });
    
    const examAvg = examCount > 0 ? totalExamPercent / examCount : 0; // 0-100
    examScoreComponent = examAvg * 0.2; // Max 20 points
    
    const sleepScore = Math.min(newMetrics.sleep * 3.75, 30); // 8h * 3.75 = 30pts
    const studyScore = Math.min(newMetrics.study * 7.5, 30);  // 4h * 7.5 = 30pts
    // Vitality: Now scaled 0-10. 10 * 2 = 20pts
    const vitalScore = Math.min(newMetrics.exercise * 2, 20); 
    const digitalPenalty = newMetrics.screenTime * 2; // -2pts per hour
    
    let totalScore = Math.round(sleepScore + studyScore + vitalScore + examScoreComponent - digitalPenalty);
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Update Score in App State
    handleDataUpdate('score', totalScore.toString());

    // --- LEVEL UPDATE LOGIC (Persisted) ---
    // Formula: Level = floor((Streak * 100 + Score) / 250)
    if (userProfile && handleProfileUpdate) {
        const streak = userProfile.streak || 0;
        const newLevel = Math.floor((streak * 100 + totalScore) / 250);
        
        if (newLevel !== userProfile.level) {
            handleProfileUpdate({ ...userProfile, level: newLevel });
        }
    }

    // Update Daily Stats Document
    await setDoc(doc(db, "users", user.uid, "dailyStats", todayStr), { 
        ...newMetrics,
        score: totalScore,
        date: serverTimestamp() 
    }, { merge: true });
  };

  // Compute trend data for graph from yearData
  const trendData = useMemo(() => {
    return yearData
        .filter(d => d.index !== -1)
        .slice(-30)
        .map(d => ({ 
            name: d.date.split('-').slice(1).join('/'), 
            score: d.score 
        }));
  }, [yearData]);
  
  const pillarTasks = useMemo(() => ({
    academics: tasks.filter(t => t.pillar === 'academics'),
    recovery: tasks.filter(t => t.pillar === 'recovery'),
    vitality: tasks.filter(t => t.pillar === 'vitality'),
    digital: tasks.filter(t => t.pillar === 'digital'),
  }), [tasks]);

  const toggleExpand = (p: PillarType) => setExpandedPillar(expandedPillar === p ? null : p);

  // Score is now coming directly from DB calculation or optimistic state
  const currentScore = metrics['score'] !== undefined ? metrics['score'] : 0;

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 size={40} className="animate-spin text-orange-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
           <h2 className={`text-3xl md:text-4xl font-black ${theme.text} cinematic-text`}>Dashboard</h2>
        </div>
        
        <div className="flex gap-2">
          {!isGoogleFitConnected && onConnectGoogleFit ? (
            <motion.button 
              onClick={onConnectGoogleFit}
              whileHover={{ scale: 1.02 }} 
              className={`px-4 py-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2`}
            >
              <Activity size={14} /> Connect Google Fit
            </motion.button>
          ) : (
            <div className={`px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2`}>
               <Activity size={14} fill="currentColor" /> Live Sync Active
            </div>
          )}
          <motion.div whileHover={{ scale: 1.02 }} className={`px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/5 border-orange-500/10'} flex items-center gap-3 max-w-md w-full md:w-auto shadow-sm backdrop-blur-md`}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shrink-0"><Sparkles size={16} /></div>
            <div className="flex-1 overflow-hidden">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-40">AI Guidance</span>
               <p className="text-xs font-bold leading-tight line-clamp-2 italic">{aiInsight || 'Systems initialized. Cognitive flow optimal.'}</p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <motion.div layout className={`rounded-[2rem] md:rounded-[3.1rem] p-8 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group ${isDarkMode ? "bg-slate-900/60 border border-white/10" : "bg-white border border-slate-200 shadow-xl"}`}>
          <div className="absolute inset-0 z-0"><div className={`absolute inset-0 grid-pattern opacity-[0.05] ${isDarkMode ? 'text-indigo-400' : 'text-orange-500'}`} /></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
             {/* ORIGINAL SCORE JAR VISUALIZER */}
             <ScoreJar score={currentScore} isDarkMode={isDarkMode} />
          </div>
        </motion.div>
        
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4 md:gap-6">
          <motion.div layout className={expandedPillar === 'academics' ? 'col-span-2' : ''}>
            <MetricCard 
              theme={theme} onChange={handleLiveUpdate} label="Work" val={metrics.study} maxVal={10} k="study" sub="Deep Focus" 
              col="text-emerald-500" bg="bg-emerald-500" liquidColor="bg-gradient-to-t from-emerald-600 to-emerald-400" secondaryLiquidColor="text-emerald-300" 
              customIconType="academics" isDarkMode={isDarkMode} 
              isExpanded={expandedPillar === 'academics'} onToggleExpand={() => toggleExpand('academics')}
              tasks={pillarTasks.academics}
            />
          </motion.div>
          <motion.div layout className={expandedPillar === 'recovery' ? 'col-span-2' : ''}>
            <MetricCard 
              theme={theme} onChange={handleLiveUpdate} label="Sleep" val={metrics.sleep} maxVal={8} k="sleep" sub="Neural Repair" 
              col="text-violet-500" bg="bg-violet-500" liquidColor="bg-gradient-to-t from-violet-600 to-violet-400" secondaryLiquidColor="text-violet-300" 
              customIconType="recovery" isDarkMode={isDarkMode} 
              isExpanded={expandedPillar === 'recovery'} onToggleExpand={() => toggleExpand('recovery')}
              tasks={pillarTasks.recovery}
            />
          </motion.div>
          <motion.div layout className={expandedPillar === 'vitality' ? 'col-span-2' : ''}>
            <MetricCard 
              theme={theme} onChange={handleLiveUpdate} icon={Activity} label="Vital" val={metrics.exercise} maxVal={10} k="exercise" sub="Activity Score" 
              col="text-rose-500" bg="bg-rose-500" liquidColor="bg-gradient-to-t from-rose-600 to-rose-400" secondaryLiquidColor="text-rose-300" 
              customIconType="vitality" isDarkMode={isDarkMode} 
              isExpanded={expandedPillar === 'vitality'} onToggleExpand={() => toggleExpand('vitality')}
              tasks={pillarTasks.vitality}
              extraDetails={fitbitDetails ? fitbitDetails : undefined} // Pass sim data here
            />
          </motion.div>
          <motion.div layout className={expandedPillar === 'digital' ? 'col-span-2' : ''}>
            <MetricCard 
              theme={theme} onChange={handleLiveUpdate} label="Digital" val={metrics.screenTime} maxVal={6} k="screenTime" sub="Optic Strain" 
              col="text-amber-500" bg="bg-amber-500" liquidColor="bg-gradient-to-t from-amber-500 to-yellow-400" secondaryLiquidColor="text-amber-300" 
              customIconType="digital" isDarkMode={isDarkMode} 
              isExpanded={expandedPillar === 'digital'} onToggleExpand={() => toggleExpand('digital')}
              tasks={pillarTasks.digital}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        <motion.div className={`${theme.card} p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] w-full relative overflow-hidden flex flex-col min-h-[400px]`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
            <h3 className={`font-black uppercase tracking-widest text-[10px] ${theme.text} flex items-center gap-2`}>
              <TrendingUp size={16} className="text-emerald-500"/> Performance Analytics
            </h3>
            
            <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/5'}`}>
              <button 
                onClick={() => setChartMode('heatmap')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chartMode === 'heatmap' ? 'bg-orange-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
              >
                <Grid size={14} /> Heatmap
              </button>
              <button 
                onClick={() => setChartMode('graph')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chartMode === 'graph' ? 'bg-orange-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
              >
                <LineChartIcon size={14} /> Graph
              </button>
            </div>
          </div>

          <PerformanceCharts 
            yearData={yearData}
            trendData={trendData}
            chartMode={chartMode}
            isDarkMode={isDarkMode}
            theme={theme}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardView;