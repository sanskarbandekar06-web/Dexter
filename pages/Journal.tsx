import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Feather, Check, Bold, Italic, Underline, 
  Heading1, Heading2, List, RotateCcw, 
  AlignLeft, Type, Calendar, BookOpen, ChevronLeft, ChevronRight,
  MoreHorizontal, Palette, Plus
} from 'lucide-react';
import { JOURNAL_THEMES, JOURNAL_THEMES_DARK, NOISE_SVG, generateJournalData } from '../constants';
import { JournalData } from '../types';

interface JournalPageProps {
  isDarkMode?: boolean;
}

// --- Color Theory Utilities ---
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate a complementary/harmonious palette
function generateThemeFromColor(baseColor: string, isDark: boolean) {
  const { h, s, l } = hexToHsl(baseColor);
  
  // Color Logic
  const bgL = isDark ? 10 : 96;
  const textL = isDark ? 90 : 15;
  const accentL = isDark ? 60 : 40;
  
  const bg1 = hslToHex(h, 30, bgL);
  const bg2 = hslToHex((h + 30) % 360, 40, isDark ? bgL + 5 : bgL - 2); // Analogous
  
  const orb1 = hslToHex(h, 80, 60);
  const orb2 = hslToHex((h + 180) % 360, 80, 60); // Complementary

  const text = hslToHex(h, 30, textL);
  const accent = hslToHex(h, 80, accentL);

  return {
    bgGradient: `linear-gradient(135deg, ${bg1}, ${bg2})`,
    orb1Color: orb1,
    orb2Color: orb2,
    textColor: text,
    glassColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
    accentColor: accent,
    sidebarColor: hslToHex(h, 20, isDark ? 40 : 60),
  };
}
// ------------------------------

const MoodSelector = ({ activeMood, onChange, isDarkMode, customColor, onCustomColorChange }: any) => {
  const moods = [
    { id: 'default', color: isDarkMode ? '#64748b' : '#78716c', label: 'Neutral' },
    { id: 'happy', color: '#eab308', label: 'Joy' },
    { id: 'energetic', color: '#f97316', label: 'Energy' },
    { id: 'calm', color: '#14b8a6', label: 'Calm' },
    { id: 'creative', color: '#a855f7', label: 'Flow' },
    { id: 'grateful', color: '#10b981', label: 'Grateful' },
    { id: 'mysterious', color: '#6366f1', label: 'Deep' },
    { id: 'sad', color: '#3b82f6', label: 'Sorrow' },
    { id: 'anxious', color: '#f43f5e', label: 'Anxiety' },
    { id: 'burnout', color: isDarkMode ? '#27272a' : '#44403c', label: 'Burnout' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
      {moods.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${activeMood === m.id ? 'scale-110 ring-2 ring-offset-2 ring-offset-transparent ring-current' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
          style={{ color: m.color, backgroundColor: m.color }}
          title={m.label}
        >
          {activeMood === m.id && <Check size={14} className="text-white drop-shadow-md" />}
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 whitespace-nowrap bg-black/80 text-white px-2 py-0.5 rounded-md pointer-events-none transition-opacity z-20">
            {m.label}
          </span>
        </button>
      ))}

      {/* Custom Theme Picker */}
      <div className="relative group">
        <button
           onClick={() => { onChange('custom'); fileInputRef.current?.click(); }}
           className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 border-dashed border-current ${activeMood === 'custom' ? 'scale-110 ring-2 ring-offset-2 ring-offset-transparent ring-current opacity-100' : 'opacity-40 hover:opacity-100'}`}
           style={{ color: customColor }}
           title="Custom Theme"
        >
          {activeMood === 'custom' ? <Palette size={14} /> : <Plus size={14} />}
        </button>
        <input 
          ref={fileInputRef}
          type="color" 
          value={customColor}
          onChange={(e) => {
             onCustomColorChange(e.target.value);
             if(activeMood !== 'custom') onChange('custom');
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 whitespace-nowrap bg-black/80 text-white px-2 py-0.5 rounded-md pointer-events-none transition-opacity z-20">
            Custom
        </span>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon: Icon, onClick, active = false, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-all shrink-0 ${active ? 'bg-black/10 dark:bg-white/10 text-current' : 'opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
  >
    <Icon size={16} />
  </button>
);

const JournalPage: React.FC<JournalPageProps> = ({ isDarkMode = false }) => {
  const [entries, setEntries] = useState<JournalData>(generateJournalData());
  
  // Date State
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.toLocaleString('default', { month: 'short' }));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // Editor State
  const currentEntry = entries[currentYear]?.[currentMonth]?.[selectedDay] || { text: "", mood: "default" };
  const [activeMood, setActiveMood] = useState(currentEntry.mood);
  const [customColor, setCustomColor] = useState("#8b5cf6"); // Default custom purple
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Theme Selection
  const themes = isDarkMode ? JOURNAL_THEMES_DARK : JOURNAL_THEMES;
  
  // Determine if using a preset or custom theme
  const isCustom = activeMood === 'custom';
  const presetTheme = themes[activeMood] || themes.default;
  const customThemeStyles = isCustom ? generateThemeFromColor(customColor, isDarkMode) : null;

  // Helper to get style values whether custom or preset
  const getStyle = () => {
    if (isCustom && customThemeStyles) {
      return {
        containerBg: { background: customThemeStyles.bgGradient },
        orb1: { background: customThemeStyles.orb1Color },
        orb2: { background: customThemeStyles.orb2Color },
        text: { color: customThemeStyles.textColor },
        glass: { background: customThemeStyles.glassColor, borderColor: customThemeStyles.borderColor },
        sidebar: { color: customThemeStyles.sidebarColor },
      };
    }
    return {
      containerBg: {}, // Managed by className in preset
      orb1: {}, // Managed by className
      orb2: {}, // Managed by className
      text: {}, // Managed by className
      glass: {}, // Managed by className
      sidebar: {}, // Managed by className
    };
  };

  const styles = getStyle();

  // Sync editor content with selected day
  useEffect(() => {
    if (editorRef.current) {
      const entryText = entries[currentYear]?.[currentMonth]?.[selectedDay]?.text || "";
      editorRef.current.innerHTML = entryText; 
      setActiveMood(entries[currentYear]?.[currentMonth]?.[selectedDay]?.mood || "default");
    }
  }, [selectedDay, currentMonth, currentYear, entries]);

  // Command handlers
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    setIsSaving(true);
    const content = editorRef.current?.innerHTML || "";
    
    setEntries(prev => ({
      ...prev,
      [currentYear]: {
        ...prev[currentYear],
        [currentMonth]: {
          ...prev[currentYear]?.[currentMonth],
          [selectedDay]: { text: content, mood: activeMood }
        }
      }
    }));

    setTimeout(() => setIsSaving(false), 800);
  };

  const wordCount = (editorRef.current?.innerText || "").trim().split(/\s+/).filter(x => x).length;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysInMonth = new Date(currentYear, months.indexOf(currentMonth) + 1, 0).getDate();

  return (
    <div 
      className={`w-full h-[calc(100vh-8rem)] flex rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-700 relative border border-white/10 ${!isCustom ? presetTheme.bg : ''}`}
      style={styles.containerBg}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay z-0" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
          className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply blur-3xl opacity-50 transition-colors duration-1000 ${!isCustom ? presetTheme.orb1 : ''}`} 
          style={styles.orb1}
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
          className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply blur-3xl opacity-50 transition-colors duration-1000 ${!isCustom ? presetTheme.orb2 : ''}`} 
          style={styles.orb2}
        />
      </div>

      {/* --- SIDEBAR (Timeline) --- */}
      <div className={`hidden md:flex w-72 flex-col border-r ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/40'} backdrop-blur-xl relative z-20`}>
        <div className="p-6 border-b border-white/10">
           <div className="flex items-center justify-between mb-6">
             <h2 className={`text-xl font-black cinematic-text ${!isCustom ? presetTheme.text : ''}`} style={styles.text}>Timeline</h2>
             <div className="flex gap-2">
               <button onClick={() => setCurrentYear(y => y-1)} className={`p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10`} style={styles.text}><ChevronLeft size={16}/></button>
               <span className={`font-bold`} style={styles.text}>{currentYear}</span>
               <button onClick={() => setCurrentYear(y => y+1)} className={`p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10`} style={styles.text}><ChevronRight size={16}/></button>
             </div>
           </div>
           <div className="grid grid-cols-4 gap-2">
             {months.map(m => (
               <button 
                 key={m} 
                 onClick={() => setCurrentMonth(m)}
                 className={`text-[10px] py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${currentMonth === m ? 'bg-current text-white bg-opacity-80 shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                 style={currentMonth === m ? { backgroundColor: isDarkMode ? '#fff' : '#000', color: isDarkMode ? '#000' : '#fff' } : styles.text}
               >
                 {m}
               </button>
             ))}
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const hasEntry = entries[currentYear]?.[currentMonth]?.[day];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${selectedDay === day ? `bg-white/20 dark:bg-white/10 shadow-lg ring-1 ring-white/20` : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedDay === day ? 'bg-current text-white' : 'bg-transparent border border-current opacity-40 group-hover:opacity-100'}`}
                  style={selectedDay === day ? { backgroundColor: isDarkMode ? '#fff' : '#000', color: isDarkMode ? '#000' : '#fff' } : styles.text}
                >
                  {day}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-xs font-bold opacity-80 ${!isCustom ? presetTheme.text : ''}`} style={styles.text}>
                    {new Date(currentYear, months.indexOf(currentMonth), day).toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  {hasEntry && (
                    <div className="flex items-center gap-1.5 mt-1">
                       <div className={`w-1.5 h-1.5 rounded-full ${!isCustom ? themes[hasEntry.mood]?.orb1.replace('bg-', 'bg-') : ''}`} style={{ backgroundColor: isCustom ? customThemeStyles?.accentColor : undefined }} />
                       <span className={`text-[9px] uppercase tracking-wider opacity-50 truncate max-w-[100px]`} style={styles.text}>
                         {hasEntry.mood}
                       </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MAIN EDITOR --- */}
      <div className="flex-1 flex flex-col relative z-20 backdrop-blur-sm">
        {/* Header */}
        <header className={`p-6 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
          <div>
            <div className={`flex items-baseline gap-3 mb-1 ${!isCustom ? presetTheme.text : ''}`} style={styles.text}>
               <h1 className="text-4xl md:text-5xl font-black cinematic-text">{selectedDay}</h1>
               <span className="text-xl md:text-2xl font-light uppercase tracking-widest opacity-60">{currentMonth} {currentYear}</span>
            </div>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40`} style={styles.text}>
               <BookOpen size={12} />
               <span>Memory Sequence</span>
            </div>
          </div>
          
          <div className={`p-4 rounded-[2rem] shadow-lg backdrop-blur-md border w-full md:w-auto ${!isCustom ? presetTheme.glass : ''} ${isDarkMode ? 'border-white/10' : 'border-white/40'}`} style={styles.glass}>
             <MoodSelector 
                activeMood={activeMood} 
                onChange={setActiveMood} 
                isDarkMode={isDarkMode} 
                customColor={customColor}
                onCustomColorChange={setCustomColor}
             />
          </div>
        </header>

        {/* Toolbar */}
        <div className={`px-4 md:px-8 py-3 flex items-center gap-2 overflow-x-auto custom-scrollbar border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'} ${!isCustom ? presetTheme.sidebar : ''}`} style={styles.sidebar}>
          <ToolbarButton icon={Bold} title="Bold" onClick={() => execCmd('bold')} />
          <ToolbarButton icon={Italic} title="Italic" onClick={() => execCmd('italic')} />
          <ToolbarButton icon={Underline} title="Underline" onClick={() => execCmd('underline')} />
          <div className="w-px h-4 bg-current opacity-20 mx-2 shrink-0" />
          <ToolbarButton icon={Heading1} title="Large Heading" onClick={() => execCmd('formatBlock', 'H1')} />
          <ToolbarButton icon={Heading2} title="Small Heading" onClick={() => execCmd('formatBlock', 'H2')} />
          <div className="w-px h-4 bg-current opacity-20 mx-2 shrink-0" />
          <ToolbarButton icon={List} title="Bullet List" onClick={() => execCmd('insertUnorderedList')} />
          <ToolbarButton icon={AlignLeft} title="Clear Format" onClick={() => execCmd('removeFormat')} />
          <div className="flex-1 min-w-[20px]" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-30 whitespace-nowrap hidden md:block">{wordCount} Words</span>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden group">
          <div 
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={`w-full h-full p-6 md:p-12 outline-none overflow-y-auto custom-scrollbar text-lg md:text-xl leading-relaxed editor-content ${!isCustom ? presetTheme.text : ''} selection:bg-orange-500/30`}
            style={{ 
              fontFamily: '"Merriweather", "Georgia", serif',
              ...styles.text
            }}
            onInput={() => {}} 
            data-placeholder="Document your journey..."
          />
          
          {/* Floating Save FAB */}
          <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-none">
             <AnimatePresence>
               {wordCount > 50 && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className={`p-4 rounded-2xl ${!isCustom ? presetTheme.glass : ''} backdrop-blur-xl border border-white/20 shadow-xl max-w-xs pointer-events-auto hidden md:block`}
                   style={styles.glass}
                 >
                    <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-black uppercase tracking-widest">
                      <Feather size={12} /> Reflection Insight
                    </div>
                    <p className={`text-xs italic leading-relaxed opacity-80`} style={styles.text}>
                      {activeMood === 'happy' && "Your energy is resonating. Capture this feeling for future reference."}
                      {activeMood === 'sad' && "Processing sorrow is an act of strength. Let it flow onto the page."}
                      {activeMood === 'anxious' && "Externalize the noise. Once written, it can be managed."}
                      {activeMood === 'energetic' && "Use this momentum. What big goal can you tackle now?"}
                      {activeMood === 'calm' && "Serenity is a rare resource. Guard this state carefully."}
                      {activeMood === 'creative' && "The muse is active. Don't self-edit, just pour."}
                      {activeMood === 'default' && "Consistency is the bedrock of mastery. Keep logging."}
                      {isCustom && "Expressing yourself in your own colors."}
                    </p>
                 </motion.div>
               )}
             </AnimatePresence>
             
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleSave}
               className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold uppercase text-xs tracking-widest transition-all ${isSaving ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
             >
               {isSaving ? (
                 <><Check size={18} /> Saved</>
               ) : (
                 <><Save size={18} /> Update Registry</>
               )}
             </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;