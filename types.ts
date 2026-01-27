
export type PillarType = 'academics' | 'recovery' | 'vitality' | 'digital';

export interface UserData {
  sleep: number;
  study: number;
  exercise: number;
  screenTime: number;
}

export interface HistoryItem {
  name: string;
  score: number;
}

export interface Resource {
  id: number;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'file' | 'image';
  url?: string;
  size?: string;
}

export interface ExamRecord {
  id: number;
  title: string;
  date: string; // ISO string
  score?: number; // User's score
  totalMarks: number;
  weight: number; // Percentage impact on grade
}

export interface Course {
  id: number;
  name: string;
  code: string;
  color: string; // Tailwind color class (e.g. "bg-blue-500")
  pillar: PillarType;
  professor?: string;
  location?: string;
  exams: ExamRecord[];
  resources: Resource[];
  links: Resource[]; // Re-using Resource type for simple links
}

export interface Task {
  id: number | string;
  text: string;
  done: boolean;
  priority?: 'high' | 'normal'; 
  pillar?: PillarType;
  isAI?: boolean;
  aiReason?: string;
  order?: number;
  createdAt?: number;
}

export interface CalendarEvent {
  id: number;
  date: Date;
  type: string;
  title: string;
  subject: string;
}

export interface JournalEntry {
  text: string;
  mood: string;
}

export interface JournalData {
  [year: number]: {
    [month: string]: {
      [day: number]: JournalEntry;
    };
  };
}

export interface ThemeColors {
  bg: string;
  text: string;
  subtext: string;
  card: string; 
  cardBg: string; 
  cardBorder: string; 
  cardShadow: string; 
  navActive: string;
  navInactive: string;
  buttonPrimary: string;
  buttonSecondary: string;
  chartFillStart: string;
  chartStroke: string;
  gradientRing: string;
  sidebarBg: string;
  sidebarBorder: string;
  inputBg: string;
  inputBorder: string;
}

export interface JournalTheme {
  bg: string;
  orb1: string;
  orb2: string;
  text: string;
  glass: string;
  sidebar: string;
  accent: string;
}

export interface Trophy {
  id: string;
  icon: string;
  name: string;
  description: string;
  dateEarned: string;
  color: string;
}

export interface AccessibilitySettings {
  dyslexiaMode: boolean;
  highContrast: boolean;
  adhdMode: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  age: number;
  class: string;
  activityLevel: 'low' | 'moderate' | 'high' | 'athlete';
  goals: string[];
  avatar: string; 
  banner: string; 
  title: string;
  streak: number;
  trophies: Trophy[];
}
