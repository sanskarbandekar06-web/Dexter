
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Type, HeartHandshake, Upload, Play, Pause, 
  Check, Loader2, FileText, XCircle, Download, FileWarning, ExternalLink,
  Zap, Sparkles, Brain, Wind, ListTodo, ShieldAlert
} from 'lucide-react';
import { ThemeColors } from '../types';
import { generateAudioExplanation, convertToDyslexiaFriendly, generateCrisisSupport, generateTaskBreakdown } from '../lib/genai-access';

interface AccessPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
}

const STORAGE_KEY = 'day_score_access_v1';

const AccessPage: React.FC<AccessPageProps> = ({ isDarkMode, theme }) => {
  // --- PERSISTENCE LOGIC ---
  const [activeTab, setActiveTab] = useState<'vision' | 'lexicon' | 'panic' | 'action'>('vision');
  
  const [visionResult, setVisionResult] = useState<{ text: string } | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [lexiconHtml, setLexiconHtml] = useState("");
  const [isLexiconLoading, setIsLexiconLoading] = useState(false);
  const [lexiconFileName, setLexiconFileName] = useState("");
  
  const [therapyAdvice, setTherapyAdvice] = useState("");
  const [isPanicLoading, setIsPanicLoading] = useState(false);

  const [actionSteps, setActionSteps] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setVisionResult(data.visionResult || null);
      setLexiconHtml(data.lexiconHtml || "");
      setLexiconFileName(data.lexiconFileName || "");
      setTherapyAdvice(data.therapyAdvice || "");
      setActionSteps(data.actionSteps || []);
      setActiveTab(data.activeTab || 'vision');
    }
  }, []);

  // Save state on change
  useEffect(() => {
    const data = {
      visionResult, lexiconHtml, lexiconFileName, therapyAdvice, actionSteps, activeTab
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [visionResult, lexiconHtml, lexiconFileName, therapyAdvice, actionSteps, activeTab]);

  // --- AUDIO ---
  const toggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else if (visionResult) {
      const utterance = new SpeechSynthesisUtterance(visionResult.text);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // --- HANDLERS ---
  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIsVisionLoading(true);
      const res = await generateAudioExplanation(e.target.files[0]);
      setVisionResult(res);
      setIsVisionLoading(false);
    }
  };

  const handleLexiconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLexiconFileName(file.name);
      setIsLexiconLoading(true);
      const html = await convertToDyslexiaFriendly(file);
      setLexiconHtml(html);
      setIsLexiconLoading(false);
    }
  };

  const handlePanic = async (context: string) => {
    setIsPanicLoading(true);
    const advice = await generateCrisisSupport(context);
    setTherapyAdvice(advice);
    setIsPanicLoading(false);
  };

  const handleAction = async (goal: string) => {
    setIsActionLoading(true);
    const steps = await generateTaskBreakdown(goal);
    setActionSteps(steps);
    setIsActionLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 animate-fadeInUp pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
        <div>
          <h1 className={`text-4xl md:text-5xl font-black cinematic-text ${theme.text}`}>Neuro-Aid</h1>
          <p className={`text-sm md:text-base font-medium opacity-60 mt-2 ${theme.text}`}>Heuristic support for cognitive diverse states.</p>
        </div>
        
        <div className={`flex p-1.5 rounded-2xl border ${theme.cardBorder} ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} shadow-inner overflow-x-auto max-w-full no-scrollbar`}>
          {[
            { id: 'vision', icon: Eye, label: 'Auditory', color: 'bg-violet-500' },
            { id: 'lexicon', icon: Type, label: 'Reader', color: 'bg-emerald-500' },
            { id: 'panic', icon: ShieldAlert, label: 'Panic Button', color: 'bg-rose-500' },
            { id: 'action', icon: ListTodo, label: 'Action Aid', color: 'bg-amber-500' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === t.id ? `${t.color} text-white shadow-lg` : `opacity-50 hover:opacity-100 ${theme.text}`}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'vision' && (
          <motion.div key="vision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
            {/* Left Card: Upload */}
            <div className={`${theme.card} p-8 rounded-[2.5rem] flex flex-col shadow-xl`}>
              <div className="flex items-center gap-3 mb-4 text-violet-500">
                 <Eye size={24} />
                 <h2 className={`text-2xl font-black ${theme.text}`}>Auditory Aid</h2>
              </div>
              <p className={`mb-8 text-sm opacity-60 leading-relaxed ${theme.text} max-w-md`}>Converts PDFs and Courseware into clear, verbatim audio for cognitive ease.</p>
              
              <label className={`flex-1 min-h-[200px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${isVisionLoading ? 'border-violet-500 bg-violet-500/5' : `border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5`}`}>
                  <input type="file" onChange={handleVisionUpload} className="hidden" />
                  {isVisionLoading ? (
                     <Loader2 className="animate-spin text-violet-500 mb-4" size={48} />
                  ) : (
                     <Upload className={`opacity-20 group-hover:opacity-40 transition-opacity mb-4 ${theme.text}`} size={48} />
                  )}
                  <span className={`font-bold text-sm opacity-40 group-hover:opacity-80 transition-opacity ${theme.text}`}>
                     {isVisionLoading ? 'Analyzing Structure...' : 'Upload Study Material'}
                  </span>
              </label>
            </div>

            {/* Right Card: Result */}
            <div className={`${theme.card} p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-xl`}>
              {visionResult ? (
                <div className="space-y-8 w-full h-full flex flex-col items-center justify-center">
                   <div className="relative">
                      <div className="absolute inset-0 bg-violet-500 blur-3xl opacity-20 rounded-full animate-pulse" />
                      <button 
                        onClick={toggleAudio} 
                        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform group"
                      >
                        {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
                      </button>
                   </div>
                   <div className="max-w-md w-full">
                      <div className={`text-xs opacity-50 font-mono p-6 bg-black/5 dark:bg-white/5 rounded-3xl text-left h-64 overflow-y-auto custom-scrollbar ${theme.text}`}>
                        {visionResult.text}
                      </div>
                   </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center opacity-20 ${theme.text}`}>
                   <Zap size={80} strokeWidth={1} />
                   <span className="mt-6 font-black text-xs uppercase tracking-[0.3em]">Registry Empty</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'lexicon' && (
          <motion.div key="lexicon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 h-full">
            <div className={`${theme.card} p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6`}>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"><Type size={28} /></div>
                <div>
                  <h2 className={`text-2xl font-black ${theme.text}`}>Cognitive Reflow</h2>
                  <p className={`text-sm opacity-50 ${theme.text}`}>Dyslexia-friendly semantic reconstruction.</p>
                </div>
              </div>
              <label className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform text-center">
                <input type="file" onChange={handleLexiconUpload} className="hidden" />
                {isLexiconLoading ? 'Processing...' : 'Load Document'}
              </label>
            </div>
            {lexiconHtml && (
              <div className={`${theme.card} p-8 md:p-12 rounded-[2.5rem] overflow-y-auto max-h-[60vh] custom-scrollbar`} style={{ fontFamily: 'Verdana, sans-serif', lineHeight: 2 }}>
                <div dangerouslySetInnerHTML={{ __html: lexiconHtml }} className="prose dark:prose-invert max-w-none [&>h1]:text-emerald-500 [&>strong]:text-emerald-600 [&>li]:mb-4" />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'panic' && (
          <motion.div key="panic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full pt-10">
            <div className={`${theme.card} p-10 md:p-14 rounded-[3rem] text-center relative overflow-hidden shadow-2xl`}>
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 pointer-events-none" />
              <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={40} />
              </div>
              <h2 className={`text-3xl md:text-4xl font-black mb-3 ${theme.text}`}>Panic Button</h2>
              <p className={`opacity-60 mb-12 text-sm md:text-base ${theme.text}`}>Immediate psychological support when the noise gets too loud.</p>
              
              <div className="relative mb-8">
                <textarea 
                  placeholder="Tell me what's overwhelming you..." 
                  className={`w-full p-6 rounded-[2rem] bg-black/5 dark:bg-white/5 border ${theme.cardBorder} ${theme.text} outline-none focus:ring-2 ring-rose-500/20 h-40 text-base resize-none`}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePanic(e.currentTarget.value); } }}
                />
                <button 
                  onClick={(e) => { const el = e.currentTarget.previousSibling as HTMLTextAreaElement; handlePanic(el.value); }}
                  className="absolute bottom-4 right-4 p-3 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                >
                  {isPanicLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {therapyAdvice && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-left relative">
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2"><Brain size={14}/> AI Counselor</div>
                    <p className={`text-base italic leading-relaxed font-medium ${theme.text}`}>{therapyAdvice}</p>
                    <button onClick={() => setTherapyAdvice("")} className={`absolute top-6 right-6 opacity-30 hover:opacity-100 ${theme.text}`}><XCircle size={20}/></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'action' && (
          <motion.div key="action" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto w-full pt-10">
            <div className={`${theme.card} p-10 md:p-14 rounded-[3rem] shadow-2xl`}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shrink-0"><ListTodo size={40} /></div>
                <div>
                   <h2 className={`text-3xl font-black ${theme.text}`}>ADHD Action Aid</h2>
                   <p className={`text-sm opacity-50 ${theme.text}`}>Bypass task paralysis with micro-sequences.</p>
                </div>
              </div>

              <div className="flex gap-3 mb-10">
                <input 
                  placeholder="What task are you stuck on?" 
                  className={`flex-1 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border ${theme.cardBorder} ${theme.text} outline-none focus:ring-2 ring-amber-500/20`}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleAction(e.currentTarget.value); }}
                />
                <button onClick={(e) => { const el = e.currentTarget.previousSibling as HTMLInputElement; handleAction(el.value); }} className="px-8 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-colors">
                  {isActionLoading ? <Loader2 className="animate-spin" /> : "Plan"}
                </button>
              </div>

              <div className="space-y-4">
                {actionSteps.map((step, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className={`group flex items-center gap-5 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-amber-500/30 transition-all`}>
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{i + 1}</div>
                    <span className={`font-bold text-base ${theme.text}`}>{step}</span>
                  </motion.div>
                ))}
                {actionSteps.length > 0 && (
                  <button onClick={() => setActionSteps([])} className={`w-full py-4 text-xs font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity ${theme.text}`}>Clear Protocol</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessPage;
