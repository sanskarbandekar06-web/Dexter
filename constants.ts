
import { ThemeColors, JournalTheme, HistoryItem, JournalData, CalendarEvent, Task } from './types';
import { addDays, subDays, startOfWeek, getDay, format } from 'date-fns';

export const CUSTOM_STYLES = `
  /* 1. ACADEMICS: Book Opening */
  .book-container { perspective: 800px; }
  .book-cover { 
    transform-origin: left center; 
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
    transform-style: preserve-3d;
  }
  .group:hover .book-cover { 
    transform: rotateY(-140deg); 
  }

  /* 2. RECOVERY: Zzz Floating */
  @keyframes float-z {
    0% { opacity: 0; transform: translateY(0) scale(0.5); }
    30% { opacity: 1; transform: translateY(-8px) scale(1); }
    100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
  }
  .zzz { opacity: 0; }
  .group:hover .zzz-1 { animation: float-z 2s infinite ease-out; animation-delay: 0s; }
  .group:hover .zzz-2 { animation: float-z 2s infinite ease-out; animation-delay: 0.7s; }
  .group:hover .zzz-3 { animation: float-z 2s infinite ease-out; animation-delay: 1.4s; }

  /* 3. DIGITAL: Multi-Speed Clock Spin */
  @keyframes clock-spin-1 { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes clock-spin-2 { 0% { transform: rotate(0deg); } 100% { transform: rotate(720deg); } }
  @keyframes clock-spin-3 { 0% { transform: rotate(0deg); } 100% { transform: rotate(1080deg); } }
  
  .clock-hand { transform-origin: bottom center; transform: rotate(0deg); }
  .group:hover .hand-h { animation: clock-spin-1 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
  .group:hover .hand-m { animation: clock-spin-2 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
  .group:hover .hand-s { animation: clock-spin-3 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite; }

  /* 4. VITALITY: Heartbeat */
  @keyframes heartbeat {
    0% { transform: scale(1); }
    15% { transform: scale(1.15); }
    30% { transform: scale(1); }
    45% { transform: scale(1.15); }
    60% { transform: scale(1); }
  }
  .group:hover .anim-heart { animation: heartbeat 1.5s ease-in-out infinite; }

  /* 5. LIVELY GRID BACKGROUND */
  @keyframes grid-drift {
    0% { background-position: 0 0; }
    100% { background-position: 80px 80px; }
  }
  .grid-pattern {
    background-image: linear-gradient(to right, currentColor 1px, transparent 1px),
                      linear-gradient(to bottom, currentColor 1px, transparent 1px);
    background-size: 40px 40px;
    animation: grid-drift 30s linear infinite;
  }
`;

export const GLOBAL_STYLES = `
  :root { --font-cinematic: 'Playfair Display', serif; --font-ui: 'Inter', sans-serif; --font-hand: 'Caveat', cursive; }
  
  html {
    scroll-behavior: smooth;
  }

  body { 
    font-family: var(--font-ui); 
    transition: filter 0.3s ease; 
    margin: 0; 
    padding: 0; 
  }

  .cinematic-text { font-family: var(--font-cinematic); }
  .handwritten { font-family: var(--font-hand); }
  
  /* Notebook Styles */
  .notebook-paper { background-color: #fdfbf7; background-image: linear-gradient(#e5e5e5 1px, transparent 1px); background-size: 100% 2.5rem; position: relative; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
  .dark .notebook-paper { background-color: #1e293b; background-image: linear-gradient(#334155 1px, transparent 1px); color: #e2e8f0; }
  .notebook-margin { border-left: 2px solid #ef4444; height: 100%; position: absolute; left: 3rem; top: 0; opacity: 0.3; }
  
  /* Utilities */
  .animate-fadeInUp { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.2); border-radius: 10px; }
  
  /* Editor Styles */
  .editor-content:empty:before { content: attr(data-placeholder); color: currentColor; opacity: 0.3; pointer-events: none; }
  .editor-content h1 { font-size: 2em; font-weight: 800; margin-bottom: 0.5em; line-height: 1.2; }
  .editor-content h2 { font-size: 1.5em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; }
  .editor-content ul { list-style-type: disc; padding-left: 1.5em; }
  .editor-content ol { list-style-type: decimal; padding-left: 1.5em; }
  .editor-content blockquote { border-left: 3px solid currentColor; padding-left: 1em; opacity: 0.8; font-style: italic; }
`;

export const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`;

export const APP_THEMES: { light: ThemeColors; dark: ThemeColors } = {
  light: { 
    bg: "bg-[#F8FAFC]", 
    text: "text-slate-900", 
    subtext: "text-slate-500", 
    card: "bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-[2rem]",
    cardBg: "bg-white", 
    cardBorder: "border-slate-200", 
    cardShadow: "shadow-sm hover:shadow-md", 
    navActive: "bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100", 
    navInactive: "text-slate-500 hover:bg-slate-100", 
    buttonPrimary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20", 
    buttonSecondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50", 
    chartFillStart: "#f97316", 
    chartStroke: "#f97316", 
    gradientRing: "text-orange-500", 
    sidebarBg: "bg-white", 
    sidebarBorder: "border-slate-100", 
    inputBg: "bg-slate-50", 
    inputBorder: "border-stone-200" 
  },
  dark: { 
    bg: "bg-[#020617]", 
    text: "text-white", 
    subtext: "text-slate-400", 
    card: "bg-slate-900/40 border border-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl rounded-[2rem]",
    cardBg: "bg-[#0f172a]", 
    cardBorder: "border-white/10", 
    cardShadow: "shadow-none", 
    navActive: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", 
    navInactive: "text-slate-400 hover:bg-white/5", 
    buttonPrimary: "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10", 
    buttonSecondary: "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10", 
    chartFillStart: "#6366f1", 
    chartStroke: "#818cf8", 
    gradientRing: "text-indigo-500", 
    sidebarBg: "bg-[#020617]", 
    sidebarBorder: "border-white/5", 
    inputBg: "bg-white/5", 
    inputBorder: "border-white/10" 
  }
};

export const JOURNAL_THEMES: { [key: string]: JournalTheme } = {
  default: { bg: "from-stone-100 via-stone-200 to-stone-100", orb1: "bg-orange-100", orb2: "bg-blue-100", text: "text-stone-800", glass: "bg-white/40 border-white/40", sidebar: "text-stone-500", accent: "text-stone-900" },
  happy: { bg: "from-amber-50 via-orange-50 to-yellow-50", orb1: "bg-yellow-300", orb2: "bg-orange-300", text: "text-amber-900", glass: "bg-white/30 border-white/40", sidebar: "text-amber-700/60", accent: "text-amber-600" },
  sad: { bg: "from-slate-100 via-blue-50 to-slate-200", orb1: "bg-blue-300", orb2: "bg-indigo-300", text: "text-slate-800", glass: "bg-white/20 border-white/30", sidebar: "text-slate-500", accent: "text-slate-700" },
  anxious: { bg: "from-rose-50 via-fuchsia-50 to-purple-50", orb1: "bg-rose-300", orb2: "bg-fuchsia-300", text: "text-rose-900", glass: "bg-white/30 border-white/40", sidebar: "text-rose-800/60", accent: "text-rose-600" },
  burnout: { bg: "from-stone-900 via-stone-800 to-stone-900", orb1: "bg-stone-700", orb2: "bg-stone-600", text: "text-stone-300", glass: "bg-black/20 border-white/10", sidebar: "text-stone-500", accent: "text-stone-200" },
  energetic: { bg: "from-orange-100 via-red-50 to-rose-100", orb1: "bg-orange-400", orb2: "bg-red-400", text: "text-red-900", glass: "bg-white/30 border-white/40", sidebar: "text-red-800/60", accent: "text-red-600" },
  calm: { bg: "from-teal-50 via-cyan-50 to-emerald-50", orb1: "bg-teal-300", orb2: "bg-cyan-300", text: "text-teal-900", glass: "bg-white/40 border-white/50", sidebar: "text-teal-700/60", accent: "text-teal-600" },
  creative: { bg: "from-violet-100 via-purple-100 to-fuchsia-100", orb1: "bg-violet-300", orb2: "bg-fuchsia-300", text: "text-violet-900", glass: "bg-white/30 border-white/40", sidebar: "text-violet-700/60", accent: "text-violet-600" },
  grateful: { bg: "from-emerald-950 via-green-950 to-emerald-950", orb1: "bg-emerald-600/20", orb2: "bg-green-600/20", text: "text-emerald-100", glass: "bg-emerald-950/30 border-emerald-500/10", sidebar: "text-emerald-400/60", accent: "text-emerald-400" },
  mysterious: { bg: "from-indigo-100 via-slate-200 to-indigo-100", orb1: "bg-indigo-400", orb2: "bg-violet-400", text: "text-indigo-950", glass: "bg-white/20 border-white/30", sidebar: "text-indigo-800/60", accent: "text-indigo-800" }
};

export const JOURNAL_THEMES_DARK: { [key: string]: JournalTheme } = {
  default: { bg: "from-slate-950 via-gray-900 to-slate-950", orb1: "bg-indigo-900/20", orb2: "bg-blue-900/20", text: "text-slate-200", glass: "bg-white/5 border-white/10", sidebar: "text-slate-500", accent: "text-slate-400" },
  happy: { bg: "from-yellow-950 via-amber-950 to-orange-950", orb1: "bg-yellow-600/20", orb2: "bg-amber-600/20", text: "text-amber-100", glass: "bg-amber-950/30 border-amber-500/10", sidebar: "text-amber-500/60", accent: "text-amber-400" },
  sad: { bg: "from-slate-950 via-blue-950 to-indigo-950", orb1: "bg-blue-600/20", orb2: "bg-indigo-600/20", text: "text-blue-100", glass: "bg-blue-950/30 border-blue-500/10", sidebar: "text-blue-400/60", accent: "text-blue-300" },
  anxious: { bg: "from-rose-950 via-red-950 to-pink-950", orb1: "bg-rose-600/20", orb2: "bg-pink-600/20", text: "text-rose-100", glass: "bg-rose-950/30 border-rose-500/10", sidebar: "text-rose-400/60", accent: "text-rose-300" },
  burnout: { bg: "from-neutral-950 via-stone-950 to-neutral-950", orb1: "bg-stone-800/30", orb2: "bg-neutral-800/30", text: "text-stone-400", glass: "bg-stone-950/40 border-stone-500/10", sidebar: "text-stone-600", accent: "text-stone-500" },
  energetic: { bg: "from-red-950 via-orange-950 to-red-950", orb1: "bg-orange-600/20", orb2: "bg-red-600/20", text: "text-orange-100", glass: "bg-red-950/30 border-red-500/10", sidebar: "text-red-400/60", accent: "text-orange-400" },
  calm: { bg: "from-teal-950 via-cyan-950 to-teal-950", orb1: "bg-teal-600/20", orb2: "bg-cyan-600/20", text: "text-cyan-100", glass: "bg-teal-950/30 border-teal-500/10", sidebar: "text-teal-400/60", accent: "text-cyan-400" },
  creative: { bg: "from-purple-950 via-fuchsia-950 to-violet-950", orb1: "bg-purple-600/20", orb2: "bg-fuchsia-600/20", text: "text-purple-100", glass: "bg-purple-950/30 border-purple-500/10", sidebar: "text-purple-400/60", accent: "text-fuchsia-400" },
  grateful: { bg: "from-emerald-950 via-green-950 to-emerald-950", orb1: "bg-emerald-600/20", orb2: "bg-green-600/20", text: "text-emerald-100", glass: "bg-emerald-950/30 border-emerald-500/10", sidebar: "text-emerald-400/60", accent: "text-emerald-400" },
  mysterious: { bg: "from-indigo-950 via-violet-950 to-indigo-950", orb1: "bg-indigo-600/30", orb2: "bg-violet-600/30", text: "text-indigo-200", glass: "bg-indigo-950/40 border-indigo-500/20", sidebar: "text-indigo-400/60", accent: "text-indigo-300" }
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 1, date: new Date(), type: 'assignment', title: 'CS Problem Set 4', subject: 'CS 101' },
  { id: 2, date: addDays(new Date(), 2), type: 'exam', title: 'Calculus Midterm', subject: 'MAT 201' },
  { id: 3, date: addDays(new Date(), 2), type: 'study', title: 'Group Study', subject: 'MAT 201' },
  { id: 4, date: addDays(new Date(), 5), type: 'assignment', title: 'Thermo Lab Report', subject: 'PHY 301' },
  { id: 5, date: addDays(new Date(), 5), type: 'assignment', title: 'CS Project Proposal', subject: 'CS 101' },
  { id: 6, date: addDays(new Date(), 5), type: 'study', title: 'Review Ch 4-5', subject: 'PHY 301' },
  { id: 7, date: addDays(new Date(), 5), type: 'study', title: 'Review Ch 6', subject: 'PHY 301' },
  { id: 8, date: addDays(new Date(), 10), type: 'exam', title: 'Physics Final', subject: 'PHY 301' },
  { id: 9, date: addDays(new Date(), 14), type: 'assignment', title: 'Portfolio Update', subject: 'CS 101' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Calculus Assignment", done: false, pillar: 'academics' },
  { id: 2, text: "Read Chapter 4", done: true, pillar: 'academics' },
  { id: 3, text: "Evening Meditation", done: false, pillar: 'recovery' },
  { id: 4, text: "10k Steps Challenge", done: false, pillar: 'vitality' },
  { id: 5, text: "Clear Inbox Zero", done: true, pillar: 'digital' }
];

export const generateMockHistory = (): HistoryItem[] => 
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, score: Math.floor(Math.random() * 35 + 60) }));

export const generateMonthHistory = (): { day: string, score: number }[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return Array.from({ length: 28 }, (_, i) => ({
    day: days[i % 7],
    score: Math.floor(Math.random() * 100)
  }));
};

// Generates a year history ending today, aligned specifically for a week-by-week grid
export const generateYearHistory = (): { day: string, score: number, date: string, month: string, isFirstDayOfMonth: boolean, value: number, index: number }[] => {
  const today = new Date();
  
  // Create an array of 365 days ending today
  const dates = [];
  for (let i = 364; i >= 0; i--) {
    const d = subDays(today, i);
    dates.push(d);
  }

  // To make the grid alignment work perfectly with grid-auto-flow: column, 
  // we need to pad the start of the array with null/empty placeholders 
  // until we reach the day of the week of the first date.
  // In JS getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
  // Our grid rows will be 0 (Sun) to 6 (Sat).
  
  const firstDate = dates[0];
  const dayOfWeek = firstDate.getDay(); // 0-6
  
  // Padding
  const paddedData = [];
  for (let i = 0; i < dayOfWeek; i++) {
    paddedData.push({
      day: '',
      score: 0,
      date: '',
      month: '',
      isFirstDayOfMonth: false,
      value: 0,
      index: -1 // Mark as padding
    });
  }

  let previousScore = 50;
  let momentum = 0;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  dates.forEach((d, i) => {
    // Score Logic
    if (Math.random() > 0.85) momentum = (Math.random() - 0.5) * 6;
    let score = previousScore + momentum + (Math.random() - 0.5) * 8;
    if (d.getDay() === 0 || d.getDay() === 6) score -= 5;
    score = Math.max(0, Math.min(100, score)); // Allow 0
    
    // Random "Empty" days (0 score) to simulate real usage gaps
    if (Math.random() > 0.9) score = 0;

    previousScore = score;

    paddedData.push({
      day: days[d.getDay()],
      score: Math.floor(score),
      date: format(d, 'yyyy-MM-dd'),
      month: months[d.getMonth()],
      isFirstDayOfMonth: d.getDate() === 1,
      value: Math.floor(score),
      index: i
    });
  });

  return paddedData;
};

export const generateJournalData = (): JournalData => {
  return { 2024: { Jan: { 12: { text: "The morning light hit the desk perfectly today. I felt a sense of calm.", mood: "default" }, 14: { text: "So much anxiety about the launch next week. My chest feels tight.", mood: "anxious" }, 20: { text: "Got the promotion! Best day ever!", mood: "happy" } } } };
};
