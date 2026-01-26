import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Sparkles, Grid, LineChart as LineChartIcon, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { ThemeColors, UserData, HistoryItem, Task, PillarType } from '../types';
import { generateYearHistory } from '../constants';
import { auth, db, collection, query, where, orderBy, limit, onSnapshot, setDoc, doc, serverTimestamp, getDocs } from '../lib/firebase';
import { startOfDay, format } from 'date-fns';

interface DashboardViewProps {
  userData: UserData;
  handleDataUpdate: (field: string, value: string) => void;
  history: HistoryItem[];
  isDarkMode: boolean;
  theme: ThemeColors;
  aiInsight?: string;
  tasks: Task[];
}

const ScoreJar = ({ score, isDarkMode }: { score: number, isDarkMode: boolean }) => {
  const percentage = Math.min(Math.max(score, 0), 100);
  
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

  return (
    <div className="relative w-48 h-64 md:w-56 md:h-72 flex items-center justify-center">
      <div className={`relative w-full h-full rounded-[3rem] border-4 overflow-hidden shadow-2xl transition-colors duration-500
        ${isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50/40 border-slate-200'}
      `}>
        <div className="absolute top-0 left-6 w-4 h-full bg-white/10 blur-sm z-30 pointer-events-none" />
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 30, damping: 15 }}
            className={`relative w-full transition-colors duration-1000
              ${isDarkMode ? 'bg-indigo-600/80' : 'bg-orange-400/80'}
            `}
          >
            <div className="absolute bottom-full left-0 w-[200%] h-12 overflow-hidden">
              <motion.svg viewBox="0 0 100 20" preserveAspectRatio="none" custom={1} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-60 fill-current ${isDarkMode ? 'text-indigo-600' : 'text-orange-400'}`}>
                <path d="M0 10 Q 25 20 50 10 T 100 10 V 20 H 0 Z" />
              </motion.svg>
              <motion.svg viewBox="0 0 100 20" preserveAspectRatio="none" custom={2} variants={waveVariants} animate="animate" className={`absolute inset-0 w-full h-full opacity-40 fill-current translate-y-1 ${isDarkMode ? 'text-fuchsia-500' : 'text-rose-400'}`}>
                <path d="M0 10 Q 25 0 50 10 T 100 10 V 20 H 0 Z" />
              </motion.svg>
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className={`text-7xl md:text-8xl font-black tracking-tighter drop-shadow-lg transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(score)}</div>
          <div className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-40 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Capacity</div>
        </div>
      </div>
      <div className={`absolute -inset-8 blur-3xl opacity-20 pointer-events-none rounded-full ${isDarkMode ? 'bg-indigo-500' : 'bg-orange-500'}`} />
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3 py-2 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md border ${isDarkMode ? 'bg-slate-900/90 text-white border-white/10' : 'bg-white/95 text-slate-900 border-slate-200'}`}>
        <p className="opacity-50 mb-1">{label}</p>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-orange-500" />
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

  // Updated Color Logic with proper Zero Handling and Theme Alignment
  const getHeatMapColor = (s: number) => {
    if (s === 0) return isDarkMode ? 'bg-white/5' : 'bg-slate-100'; // Empty state
    
    // Dark Mode (Indigo Spectrum)
    if (isDarkMode) {
      if (s >= 80) return 'bg-indigo-400';
      if (s >= 50) return 'bg-indigo-600';
      if (s >= 20) return 'bg-indigo-800';
      return 'bg-indigo-950'; // Low but not zero
    } 
    // Light Mode (Orange Spectrum)
    else {
      if (s >= 80) return 'bg-orange-500';
      if (s >= 50) return 'bg-orange-400';
      if (s >= 20) return 'bg-orange-300';
      return 'bg-orange-200'; // Low but not zero
    }
  };

  // Calculate Month Labels for Grid (X-Axis)
  const monthLabels: { label: string, colIndex: number }[] = [];
  yearData.forEach((d: any, i: number) => {
    if (d.index !== -1 && d.isFirstDayOfMonth) {
      const colIndex = Math.floor(i / 7);
      if (!monthLabels.some(m => m.colIndex === colIndex)) {
        monthLabels.push({ label: d.month, colIndex });
      }
    }
  });

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
              <div className="w-full flex-1 overflow-x-auto custom-scrollbar pb-2">
                 <div className="min-w-[800px] h-full flex flex-col justify-center">
                    
                    {/* X-Axis: Months */}
                    <div className="flex mb-2 pl-8 relative h-4">
                       {monthLabels.map((m, i) => (
                         <div 
                           key={i} 
                           className="absolute text-[9px] font-black uppercase tracking-widest opacity-40"
                           style={{ left: `calc(${m.colIndex * 14}px + ${m.colIndex * 3}px + 32px)` }}
                         >
                           {m.label}
                         </div>
                       ))}
                    </div>

                    <div className="flex">
                      {/* Y-Axis: Days */}
                      <div className="flex flex-col gap-[3px] mr-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                          <div key={d} className="h-[14px] flex items-center justify-end min-w-[20px]">
                            <span className={`text-[9px] font-bold ${[1,3,5].includes(i) ? 'opacity-40' : 'opacity-0'}`}>{d}</span>
                          </div>
                        ))}
                      </div>

                      {/* The Grid */}
                      <div 
                        className="grid gap-[3px] grid-flow-col"
                        style={{ 
                          gridTemplateRows: 'repeat(7, 1fr)',
                          gridAutoColumns: '14px' 
                        }}
                      >
                        {yearData.map((data: any, idx: number) => {
                          if (data.index === -1) {
                            return <div key={`pad-${idx}`} className="w-[14px] h-[14px]" />;
                          }
                          return (
                            <motion.div
                              key={idx}
                              onMouseEnter={() => setHoveredNode({ idx, score: data.score, date: data.date })}
                              onMouseLeave={() => setHoveredNode(null)}
                              whileHover={{ scale: 1.4, zIndex: 50 }}
                              className={`w-[14px] h-[14px] rounded-[3px] transition-colors duration-300 relative ${getHeatMapColor(data.score)}`}
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

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4 px-4">
                 <span className="text-[9px] font-bold opacity-40 uppercase">Less</span>
                 <div className={`w-3 h-3 rounded-[2px] ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                 <div className={`w-3 h-3 rounded-[2px] ${isDarkMode ? 'bg-indigo-950' : 'bg-orange-200'}`} />
                 <div className={`w-3 h-3 rounded-[2px] ${isDarkMode ? 'bg-indigo-800' : 'bg-orange-300'}`} />
                 <div className={`w-3 h-3 rounded-[2px] ${isDarkMode ? 'bg-indigo-600' : 'bg-orange-400'}`} />
                 <div className={`w-3 h-3 rounded-[2px] ${isDarkMode ? 'bg-indigo-400' : 'bg-orange-500'}`} />
                 <span className="text-[9px] font-bold opacity-40 uppercase">More</span>
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
            {/* Ambient Background Glows */}
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
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDarkMode ? "#818cf8" : "#f97316"} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={isDarkMode ? "#818cf8" : "#f97316"} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} stroke="currentColor" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}
                  stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  interval="preserveStartEnd"
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
                  stroke={isDarkMode ? "#818cf8" : "#f97316"} 
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

// -----------------------------------------------------------------------

const DashboardView: React.FC<DashboardViewProps> = ({ isDarkMode, theme, aiInsight, tasks = [] }) => {
  const [metrics, setMetrics] = useState<UserData>({ sleep: 0, study: 0, exercise: 0, screenTime: 0 });
  const [loading, setLoading] = useState(true);
  const [yearData, setYearData] = useState<any[]>(generateYearHistory());
  const [expandedPillar, setExpandedPillar] = useState<PillarType | null>(null);
  const [chartMode, setChartMode] = useState<'heatmap' | 'graph'>('heatmap');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const today = startOfDay(new Date());

    // Listeners for metrics...
    const workQuery = query(collection(db, "users", user.uid, "workSessions"), where("date", ">=", today));
    const unsubWork = onSnapshot(workQuery, (snap) => {
      let totalMins = 0;
      snap.forEach(doc => totalMins += doc.data().durationMinutes || 0);
      setMetrics(prev => ({ ...prev, study: totalMins / 60 }));
    });

    const sleepQuery = query(collection(db, "users", user.uid, "sleepLogs"), orderBy("date", "desc"), limit(1));
    const unsubSleep = onSnapshot(sleepQuery, (snap) => {
      if (!snap.empty) setMetrics(prev => ({ ...prev, sleep: snap.docs[0].data().hours || 0 }));
    });

    const vitalQuery = query(collection(db, "users", user.uid, "vitalLogs"), orderBy("date", "desc"), limit(1));
    const unsubVital = onSnapshot(vitalQuery, (snap) => {
      if (!snap.empty) setMetrics(prev => ({ ...prev, exercise: snap.docs[0].data().heartRate || 0 }));
    });

    const screenQuery = query(collection(db, "users", user.uid, "screenUsage"), where("date", ">=", today));
    const unsubScreen = onSnapshot(screenQuery, (snap) => {
      let totalMins = 0;
      snap.forEach(doc => totalMins += doc.data().minutes || 0);
      setMetrics(prev => ({ ...prev, screenTime: totalMins / 60 }));
    });

    // In a real app, we would fetch history from Firebase here.
    // For now, we regenerate the year history locally to ensure it's up to date with "Today".
    setYearData(generateYearHistory());

    setLoading(false);

    return () => {
      unsubWork(); unsubSleep(); unsubVital(); unsubScreen();
    };
  }, []);

  // Sync metrics to Firebase (Calculate Score)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const workScore = metrics.study * 10;
    const sleepScore = metrics.sleep * 8;
    const heartScore = metrics.exercise / 100;
    const screenDeduction = (metrics.screenTime * 60) * 5;
    
    let totalScore = workScore + sleepScore + heartScore - screenDeduction;
    const clampedScore = Math.max(0, Math.min(100, totalScore));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    setDoc(doc(db, "users", user.uid, "dailyStats", todayStr), { score: clampedScore, date: serverTimestamp() }, { merge: true });

  }, [metrics]);

  const handleLiveUpdate = async (field: string, value: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const val = parseFloat(value);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    if (field === 'study') await setDoc(doc(db, "users", user.uid, "workSessions", todayStr), { durationMinutes: val * 60, date: serverTimestamp() });
    else if (field === 'sleep') await setDoc(doc(db, "users", user.uid, "sleepLogs", todayStr), { hours: val, date: serverTimestamp() });
    else if (field === 'exercise') await setDoc(doc(db, "users", user.uid, "vitalLogs", todayStr), { heartRate: val, date: serverTimestamp() });
    else if (field === 'screenTime') await setDoc(doc(db, "users", user.uid, "screenUsage", todayStr), { minutes: val * 60, date: serverTimestamp() });
  };

  const trendData = useMemo(() => {
    return yearData.filter(d => d.index !== -1).slice(-30).map(d => ({ name: d.date.split('-').slice(1).join('/'), score: d.score }));
  }, [yearData]);
  
  const displayScore = (metrics.study * 10) + (metrics.sleep * 8) + (metrics.exercise / 100) - ((metrics.screenTime * 60) * 5);
  const clampedDisplayScore = Math.max(0, Math.min(100, displayScore));

  const pillarTasks = useMemo(() => ({
    academics: tasks.filter(t => t.pillar === 'academics'),
    recovery: tasks.filter(t => t.pillar === 'recovery'),
    vitality: tasks.filter(t => t.pillar === 'vitality'),
    digital: tasks.filter(t => t.pillar === 'digital'),
  }), [tasks]);

  const toggleExpand = (p: PillarType) => setExpandedPillar(expandedPillar === p ? null : p);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 size={40} className="animate-spin text-orange-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
           <h2 className={`text-3xl md:text-4xl font-bold ${theme.text} cinematic-text`}>Dashboard</h2>
           <p className={`text-[10px] md:text-sm font-black tracking-[0.2em] uppercase opacity-40 ${theme.text}`}>Heuristics v3.11.0</p>
        </div>
        
        <motion.div whileHover={{ scale: 1.02 }} className={`px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/5 border-orange-500/20'} flex items-center gap-3 max-w-md w-full md:w-auto shadow-sm backdrop-blur-md`}>
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shrink-0"><Sparkles size={16} /></div>
          <div className="flex-1 overflow-hidden">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Cognitive Forecast</span>
             <p className="text-xs font-bold leading-tight line-clamp-2 italic">{aiInsight || 'Systems initialized. Cognitive flow optimal.'}</p>
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <motion.div layout className={`rounded-[2rem] md:rounded-[3.1rem] p-8 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group ${isDarkMode ? "bg-slate-900/60 border border-white/10" : "bg-white border border-slate-200 shadow-xl"}`}>
          <div className="absolute inset-0 z-0"><div className={`absolute inset-0 grid-pattern opacity-[0.05] ${isDarkMode ? 'text-indigo-400' : 'text-orange-500'}`} /></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
             <ScoreJar score={clampedDisplayScore} isDarkMode={isDarkMode} />
             <div className="flex items-center justify-center gap-2"><Zap className="text-orange-500" size={18} fill="currentColor" /><span className={`text-[10px] md:text-xs font-black tracking-[0.3em] uppercase opacity-50`}>Current Score</span></div>
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
              theme={theme} onChange={handleLiveUpdate} icon={Activity} label="Vital" val={metrics.exercise} maxVal={120} k="exercise" sub="Heart Rate" 
              col="text-rose-500" bg="bg-rose-500" liquidColor="bg-gradient-to-t from-rose-600 to-rose-400" secondaryLiquidColor="text-rose-300" 
              customIconType="vitality" isDarkMode={isDarkMode} 
              isExpanded={expandedPillar === 'vitality'} onToggleExpand={() => toggleExpand('vitality')}
              tasks={pillarTasks.vitality}
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
              <TrendingUp size={16} className="text-orange-500"/> Performance Analytics
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