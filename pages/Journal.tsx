
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Feather, Check, Bold, Italic, Underline, 
  Heading1, Heading2, List, RotateCcw, 
  AlignLeft, Type, Calendar, BookOpen, ChevronLeft, ChevronRight,
  MoreHorizontal, Palette, Plus, Loader2, X
} from 'lucide-react';
import { JOURNAL_THEMES, JOURNAL_THEMES_DARK, NOISE_SVG } from '../constants';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';

interface JournalPageProps {
  isDarkMode?: boolean;
  userId?: string;
}

const JournalPage: React.FC<JournalPageProps> = ({ isDarkMode = false, userId }) => {
  // Date State
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.toLocaleString('default', { month: 'short' }).toUpperCase());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // Content State
  const [content, setContent] = useState("");
  const [activeMood, setActiveMood] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const themes = isDarkMode ? JOURNAL_THEMES_DARK : JOURNAL_THEMES;
  const currentTheme = themes[activeMood] || themes.default;

  // Load entry from Firestore
  useEffect(() => {
    const fetchEntry = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      const docId = `${currentYear}_${currentMonth}_${selectedDay}`;
      const docRef = doc(db, 'users', userId, 'journal', docId);
      
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContent(data.text || "");
          setActiveMood(data.mood || "default");
          if (editorRef.current) {
            editorRef.current.innerHTML = data.text || "";
          }
        } else {
          setContent("");
          setActiveMood("default");
          if (editorRef.current) {
            editorRef.current.innerHTML = "";
          }
        }
      } catch (error) {
        console.error("Error fetching journal entry:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [userId, currentYear, currentMonth, selectedDay]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    
    const editorContent = editorRef.current?.innerHTML || "";
    const docId = `${currentYear}_${currentMonth}_${selectedDay}`;
    const docRef = doc(db, 'users', userId, 'journal', docId);
    
    try {
      await setDoc(docRef, {
        text: editorContent,
        mood: activeMood,
        updatedAt: serverTimestamp(),
        year: currentYear,
        month: currentMonth,
        day: selectedDay
      }, { merge: true });
    } catch (error) {
      console.error("Error saving journal entry:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const wordCount = (editorRef.current?.innerText || "").trim().split(/\s+/).filter(x => x).length;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const daysInMonth = new Date(currentYear, months.indexOf(currentMonth) + 1, 0).getDate();

  const moodBubbles = [
    { id: 'default', color: 'bg-stone-400' },
    { id: 'happy', color: 'bg-yellow-400' },
    { id: 'energetic', color: 'bg-orange-500' },
    { id: 'calm', color: 'bg-teal-400' },
    { id: 'creative', color: 'bg-purple-400' },
    { id: 'grateful', color: 'bg-emerald-400' },
    { id: 'mysterious', color: 'bg-indigo-400' },
    { id: 'sad', color: 'bg-blue-400' },
    { id: 'anxious', color: 'bg-rose-400' },
    { id: 'burnout', color: 'bg-stone-800' },
  ];

  return (
    <div className={`w-full h-[80vh] md:h-[calc(100vh-10rem)] flex rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-700 relative border border-white/10 ${currentTheme.bg} bg-gradient-to-br`}>
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay z-0" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />
      
      {/* Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
          className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply blur-3xl opacity-30 ${currentTheme.orb1}`} 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
          className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply blur-3xl opacity-30 ${currentTheme.orb2}`} 
        />
      </div>

      {/* --- SIDEBAR (Timeline) --- */}
      {showMobileTimeline && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setShowMobileTimeline(false)}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex flex-col border-r 
        ${showMobileTimeline ? 'translate-x-0' : '-translate-x-full'}
        ${isDarkMode ? 'border-white/5 bg-slate-900/95 md:bg-black/20' : 'border-black/5 bg-white/95 md:bg-white/40'}
        backdrop-blur-xl md:backdrop-blur-xl
      `}>
        <div className="p-6 md:p-8 h-full flex flex-col relative">
           <button 
             onClick={() => setShowMobileTimeline(false)} 
             className="absolute top-4 right-4 md:hidden p-2 opacity-50 hover:opacity-100"
           >
             <X size={20} className={currentTheme.text} />
           </button>

           <div className="flex items-center justify-between mb-8">
             <h2 className={`text-xl font-black cinematic-text ${currentTheme.text}`}>Timeline</h2>
             <div className="flex items-center gap-3">
               <button onClick={() => setCurrentYear(y => y-1)} className="p-1 opacity-50 hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
               <span className={`text-sm font-black tracking-widest ${currentTheme.text}`}>{currentYear}</span>
               <button onClick={() => setCurrentYear(y => y+1)} className="p-1 opacity-50 hover:opacity-100 transition-opacity"><ChevronRight size={16}/></button>
             </div>
           </div>
           
           <div className="grid grid-cols-4 gap-2 mb-8 shrink-0">
             {months.map(m => (
               <button 
                 key={m} 
                 onClick={() => setCurrentMonth(m)}
                 className={`text-[9px] py-2 rounded-lg font-black tracking-widest transition-all ${currentMonth === m ? 'bg-black text-white' : 'opacity-40 hover:opacity-100'}`}
               >
                 {m}
               </button>
             ))}
           </div>

           <div className="space-y-1 overflow-y-auto custom-scrollbar pr-2 flex-1">
             {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
               <button
                 key={day}
                 onClick={() => { setSelectedDay(day); setShowMobileTimeline(false); }}
                 className={`w-full flex items-center gap-4 p-2.5 rounded-xl transition-all ${selectedDay === day ? 'bg-white/40 shadow-sm' : 'hover:bg-black/5 opacity-60'}`}
               >
                 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${selectedDay === day ? 'bg-black text-white border-black' : 'border-black/20 text-black'}`}>
                   {day}
                 </div>
                 <span className="text-[11px] font-bold text-black/70">
                   {new Date(currentYear, months.indexOf(currentMonth), day).toLocaleDateString('en-US', { weekday: 'long' })}
                 </span>
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* --- MAIN EDITOR --- */}
      <div className="flex-1 flex flex-col relative z-20 min-w-0">
        {/* Header */}
        <header className="p-4 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
          <div className="space-y-1 w-full md:w-auto">
            <div className="flex items-baseline gap-3">
              <button onClick={() => setShowMobileTimeline(true)} className="md:hidden mr-2 opacity-50 p-1">
                  <Calendar size={24} className={currentTheme.text} />
              </button>
              <h1 className="text-4xl md:text-6xl font-black cinematic-text text-black/80">{selectedDay}</h1>
              <span className="text-xl md:text-2xl font-light tracking-[0.2em] text-black/50 uppercase">{currentMonth} {currentYear}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-black/40">
              <BookOpen size={12} />
              <span>Memory Sequence</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 md:p-3 rounded-full bg-white/30 backdrop-blur-md shadow-inner border border-white/40 self-end md:self-auto overflow-x-auto max-w-full">
             {moodBubbles.map(bubble => (
               <button
                 key={bubble.id}
                 onClick={() => setActiveMood(bubble.id)}
                 className={`w-6 h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center shrink-0 ${bubble.color} ${activeMood === bubble.id ? 'ring-2 ring-offset-2 ring-black/40' : 'opacity-60'}`}
               >
                 {activeMood === bubble.id && <Check size={12} className="text-white" />}
               </button>
             ))}
             <button className="w-6 h-6 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center text-black/40 hover:bg-black/5 shrink-0">
                <Plus size={12} />
             </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="px-4 md:px-10 py-3 flex items-center gap-1 opacity-50 overflow-x-auto no-scrollbar mask-gradient-right">
          <button onClick={() => execCmd('bold')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><Bold size={16}/></button>
          <button onClick={() => execCmd('italic')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><Italic size={16}/></button>
          <button onClick={() => execCmd('underline')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><Underline size={16}/></button>
          <div className="w-px h-4 bg-black/20 mx-2 shrink-0" />
          <button onClick={() => execCmd('formatBlock', 'H1')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><Heading1 size={16}/></button>
          <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><Heading2 size={16}/></button>
          <div className="w-px h-4 bg-black/20 mx-2 shrink-0" />
          <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><List size={16}/></button>
          <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-black/5 rounded-lg shrink-0"><AlignLeft size={16}/></button>
          <div className="flex-1 min-w-[20px]" />
          <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase shrink-0 whitespace-nowrap">{wordCount} Words</span>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative p-4 md:p-10 pt-4">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm z-30">
               <Loader2 className="animate-spin text-black/20" size={40} />
            </div>
          ) : (
            <div 
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full h-full outline-none text-lg md:text-2xl font-serif leading-relaxed text-black/70 overflow-y-auto custom-scrollbar editor-content pb-24 md:pb-0"
              style={{ fontFamily: '"Merriweather", serif' }}
              data-placeholder="Document your journey..."
            />
          )}

          {/* Update Registry Button */}
          <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl transition-all ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <BookOpen size={16} />}
              {isSaving ? "SYNCING..." : "UPDATE REGISTRY"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
