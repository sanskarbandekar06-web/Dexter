
import { ThemeColors, JournalTheme, HistoryItem, JournalData, CalendarEvent, Task, Course } from './types';
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
  
  /* Custom Scrollbar */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.7); }
  
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
  calm: { bg: "from-teal-50 via-cyan-50 to-teal-950", orb1: "bg-teal-600/20", orb2: "bg-cyan-600/20", text: "text-cyan-100", glass: "bg-teal-950/30 border-teal-500/10", sidebar: "text-teal-400/60", accent: "text-cyan-400" },
  creative: { bg: "from-purple-950 via-fuchsia-950 to-violet-950", orb1: "bg-purple-600/20", orb2: "bg-fuchsia-600/20", text: "text-purple-100", glass: "bg-purple-950/30 border-purple-500/10", sidebar: "text-purple-400/60", accent: "text-fuchsia-400" },
  grateful: { bg: "from-emerald-950 via-green-950 to-emerald-950", orb1: "bg-emerald-600/20", orb2: "bg-green-600/20", text: "text-emerald-100", glass: "bg-emerald-950/30 border-emerald-500/10", sidebar: "text-emerald-400/60", accent: "text-emerald-400" },
  mysterious: { bg: "from-indigo-950 via-violet-950 to-indigo-950", orb1: "bg-indigo-600/30", orb2: "bg-violet-600/30", text: "text-indigo-200", glass: "bg-indigo-950/40 border-indigo-500/20", sidebar: "text-indigo-400/60", accent: "text-indigo-400" }
};

export const JOURNAL_THEMES_DARK: { [key: string]: JournalTheme } = {
  default: { bg: "from-slate-900 via-slate-950 to-black", orb1: "bg-indigo-900/40", orb2: "bg-violet-900/40", text: "text-slate-200", glass: "bg-slate-900/40 border-white/10", sidebar: "text-slate-400", accent: "text-indigo-400" },
  happy: { bg: "from-amber-950 via-orange-950 to-yellow-950", orb1: "bg-yellow-600/30", orb2: "bg-orange-600/30", text: "text-amber-100", glass: "bg-amber-950/30 border-white/10", sidebar: "text-amber-400/60", accent: "text-amber-400" },
  sad: { bg: "from-slate-950 via-blue-950 to-slate-900", orb1: "bg-blue-600/30", orb2: "bg-indigo-600/30", text: "text-blue-100", glass: "bg-blue-950/30 border-white/10", sidebar: "text-blue-400/60", accent: "text-blue-400" },
  anxious: { bg: "from-rose-950 via-fuchsia-950 to-purple-950", orb1: "bg-rose-600/30", orb2: "bg-fuchsia-600/30", text: "text-rose-100", glass: "bg-rose-950/30 border-white/10", sidebar: "text-rose-400/60", accent: "text-rose-400" },
  burnout: { bg: "from-stone-950 via-stone-900 to-black", orb1: "bg-stone-800/40", orb2: "bg-stone-700/40", text: "text-stone-300", glass: "bg-stone-950/30 border-white/5", sidebar: "text-stone-500", accent: "text-stone-400" },
  energetic: { bg: "from-orange-950 via-red-950 to-rose-950", orb1: "bg-orange-600/30", orb2: "bg-red-600/30", text: "text-red-100", glass: "bg-red-950/30 border-white/10", sidebar: "text-red-400/60", accent: "text-red-400" },
  calm: { bg: "from-teal-950 via-cyan-950 to-black", orb1: "bg-teal-600/30", orb2: "bg-cyan-600/30", text: "text-teal-100", glass: "bg-teal-950/30 border-white/10", sidebar: "text-teal-400/60", accent: "text-teal-400" },
  creative: { bg: "from-purple-950 via-fuchsia-950 to-black", orb1: "bg-purple-600/30", orb2: "bg-fuchsia-600/30", text: "text-purple-100", glass: "bg-purple-950/30 border-white/10", sidebar: "text-purple-400/60", accent: "text-fuchsia-400" },
  grateful: { bg: "from-emerald-950 via-green-950 to-black", orb1: "bg-emerald-600/30", orb2: "bg-green-600/30", text: "text-emerald-100", glass: "bg-emerald-950/30 border-white/10", sidebar: "text-emerald-400/60", accent: "text-emerald-400" },
  mysterious: { bg: "from-indigo-950 via-violet-950 to-black", orb1: "bg-indigo-600/30", orb2: "bg-violet-600/30", text: "text-indigo-100", glass: "bg-indigo-950/30 border-white/10", sidebar: "text-indigo-400/60", accent: "text-indigo-400" }
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 1, date: new Date(), type: 'assignment', title: 'CS Problem Set 4', subject: 'CS 101' },
  { id: 2, date: addDays(new Date(), 2), type: 'exam', title: 'Calculus Midterm', subject: 'MAT 201' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Calculus Assignment", done: false, pillar: 'academics' },
  { id: 2, text: "Read Chapter 4", done: true, pillar: 'academics' },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 1,
    name: "Data Structures",
    code: "CS 101",
    color: "bg-blue-500",
    pillar: 'academics',
    professor: "Dr. Turing",
    location: "Hall A",
    exams: [
      { id: 1, title: "Midterm", date: "2024-03-15", score: 88, totalMarks: 100, weight: 30 },
      { id: 2, title: "Final", date: "2024-05-20", totalMarks: 100, weight: 50 }
    ],
    resources: [
      { id: 1, title: "Binary Trees Guide", type: "pdf", size: "2.4 MB" },
      { id: 2, title: "Sorting Algorithms", type: "video" }
    ],
    links: [
      { id: 1, title: "Course Portal", type: "link", url: "https://university.edu/cs101" }
    ]
  },
  {
    id: 2,
    name: "Calculus II",
    code: "MAT 201",
    color: "bg-orange-500",
    pillar: 'academics',
    professor: "Prof. Newton",
    exams: [
      { id: 1, title: "Quiz 1", date: "2024-02-10", score: 18, totalMarks: 20, weight: 10 }
    ],
    resources: [],
    links: []
  },
  {
    id: 3,
    name: "Sleep Hygiene",
    code: "RECOVERY",
    color: "bg-indigo-500",
    pillar: 'recovery',
    professor: "Dr. Rest",
    exams: [],
    resources: [],
    links: []
  }
];

export const generateMockHistory = (): HistoryItem[] => 
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, score: 0 }));

export const generateMonthHistory = (): { day: string, score: number }[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return Array.from({ length: 28 }, (_, i) => ({
    day: days[i % 7],
    score: 0
  }));
};

// Generates a year history structure ending today
export const generateYearHistory = (empty: boolean = false): { day: string, score: number, date: string, month: string, isFirstDayOfMonth: boolean, value: number, index: number }[] => {
  const today = new Date();
  const dates = [];
  for (let i = 364; i >= 0; i--) {
    const d = subDays(today, i);
    dates.push(d);
  }

  const firstDate = dates[0];
  const dayOfWeek = firstDate.getDay(); // 0-6
  
  const paddedData = [];
  for (let i = 0; i < dayOfWeek; i++) {
    paddedData.push({
      day: '', score: 0, date: '', month: '', isFirstDayOfMonth: false, value: 0, index: -1
    });
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  dates.forEach((d, i) => {
    let score = empty ? 0 : Math.floor(Math.random() * 100); 
    paddedData.push({
      day: days[d.getDay()],
      score: score,
      date: format(d, 'yyyy-MM-dd'),
      month: months[d.getMonth()],
      isFirstDayOfMonth: d.getDate() === 1,
      value: score,
      index: i
    });
  });

  return paddedData;
};

export const generateJournalData = (): JournalData => {
  return {};
};
