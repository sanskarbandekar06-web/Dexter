import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, Zap, LayoutDashboard, GraduationCap, 
  PenTool, Book, Timer, UserCircle, Menu, LogOut, X, AlertTriangle, Sparkles,
  Accessibility, Ear
} from 'lucide-react';
import { 
  onAuthStateChanged, signOut, doc, getDoc, setDoc, auth, db, serverTimestamp 
} from './lib/firebase';
import { APP_THEMES, GLOBAL_STYLES, CUSTOM_STYLES, generateMockHistory, INITIAL_EVENTS, INITIAL_TASKS } from './constants';
import { UserData, HistoryItem, UserProfile, AccessibilitySettings, Task, CalendarEvent } from './types';
import DashboardView from './pages/Dashboard';
import AcademicsPage from './pages/Academics';
import NotebookPage from './pages/Notebook';
import JournalPage from './pages/Journal';
import FocusPage from './pages/Focus';
import LandingPage from './pages/Landing';
import ProfilePage from './pages/Profile';
import AccessPage from './pages/Access';
import AuthModal from './components/AuthModal';
import { consultTheBrain } from './lib/gemini';

const LOCAL_STORAGE_KEY = 'day_score_cache';

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [tab, setTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
  
  // Initialize with zero values - Real data will be fetched in Dashboard
  const [userData, setUserData] = useState<UserData>({ sleep: 0, study: 0, exercise: 0, screenTime: 0 });
  const [history] = useState<HistoryItem[]>(generateMockHistory());
  
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [aiInsight, setAiInsight] = useState<string>("");

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCloudError, setIsCloudError] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "New operative",
    email: "",
    mobile: "",
    age: 21,
    class: "Initiate",
    activityLevel: 'low',
    goals: [],
    title: "Cognitive Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    banner: "https://images.unsplash.com/photo-1506259091721-347f798196d4?auto=format&fit=crop&w=1200&q=80",
    streak: 0,
    trophies: []
  });

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    dyslexiaMode: false,
    highContrast: false,
    adhdMode: false
  });

  // --- GEMINI INTELLIGENCE BRAIN ---
  useEffect(() => {
    if (view !== 'app') return;

    const timer = setTimeout(async () => {
      if (tasks.length > 0 && tasks[tasks.length - 1].isAI) return;

      const brainResponse = await consultTheBrain(userData, events, tasks, userProfile.name);
      
      if (brainResponse.insight) {
        setAiInsight(brainResponse.insight);
      }

      if (brainResponse.suggestedTask && !tasks.some(t => t.text === brainResponse.suggestedTask!.text)) {
        setTasks(prev => [...prev, brainResponse.suggestedTask!]);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [tasks, userData, events, view]); 
  // ---------------------------------

  useEffect(() => {
    if (!isNarrationEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      const interactiveElement = target.closest('button, a, input, select, textarea, [role="button"]');
      
      let elementToRead = target;
      if (interactiveElement) {
        elementToRead = interactiveElement as HTMLElement;
      }

      const ariaLabel = elementToRead.getAttribute('aria-label');
      const title = elementToRead.getAttribute('title');
      const alt = elementToRead.getAttribute('alt');
      
      let text = "";

      if (ariaLabel) text = ariaLabel;
      else if (title) text = title;
      else if (elementToRead.tagName === 'INPUT' || elementToRead.tagName === 'TEXTAREA') {
         const input = elementToRead as HTMLInputElement;
         text = input.placeholder || input.value || "Input field";
      }
      else if (elementToRead.tagName === 'IMG' && alt) {
         text = `Image: ${alt}`;
      }
      else if (elementToRead.innerText && elementToRead.innerText.trim().length > 0) {
         if (elementToRead.innerText.length < 150) {
            text = elementToRead.innerText;
         }
      }

      if (!text) return;

      let prefix = "";
      const tagName = elementToRead.tagName.toLowerCase();
      if (tagName === 'button' || elementToRead.getAttribute('role') === 'button') prefix = "Button: ";
      if (tagName === 'a') prefix = "Link: ";
      if (tagName === 'input') prefix = "Input: ";

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(prefix + text);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement;
      const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
      
      if (interactive && related && (interactive.contains(related) || interactive === related)) {
        return;
      }
      window.speechSynthesis.cancel();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.speechSynthesis.cancel();
    };
  }, [isNarrationEnabled]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // PROBLEM A: Ensure user document exists on every login
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
             // Create new user profile in Firestore
             await setDoc(docRef, {
                name: user.displayName || "New Operative",
                email: user.email,
                mobile: "",
                activityLevel: "moderate",
                goals: [],
                createdAt: serverTimestamp(),
                level: 1,
                streak: 0,
                // Don't store metrics in main doc anymore (Subcollections used)
                title: "Cognitive Initiate",
                avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
                banner: "https://images.unsplash.com/photo-1506259091721-347f798196d4?auto=format&fit=crop&w=1200&q=80"
             }, { merge: true });
          }

          // Fetch profile data (metrics are handled in Dashboard)
          const updatedSnap = await getDoc(docRef);
          if (updatedSnap.exists()) {
             const data = updatedSnap.data();
             setUserProfile(prev => ({ ...prev, ...data }));
          }
          
          setIsAuthModalOpen(false);
          setView('app');
          setIsCloudError(false);
        } catch (err: any) {
          console.error("Firestore sync error:", err.message);
          setIsCloudError(true);
        }
      } else {
        setCurrentUser(null);
        setView('landing');
        setTab('dashboard');
      }
    });
    return () => unsubscribe();
  }, []);
  
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  
  // This function is passed to Dashboard but will be effectively overridden by real-time listeners there
  const handleDataUpdate = async (field: string, value: string) => {
    // Legacy support or optimistic update for other components
    const newVal = parseFloat(value) || 0;
    setUserData(prev => ({ ...prev, [field]: newVal }));
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), updatedProfile, { merge: true });
        setIsCloudError(false);
      } catch (err) {
        console.error("Profile sync failed:", err);
        setIsCloudError(true);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Reset state on logout
    setUserData({ sleep: 0, study: 0, exercise: 0, screenTime: 0 });
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'academics', icon: GraduationCap, label: 'Strategy Map' },
    { id: 'todo', icon: PenTool, label: 'To-Do Protocol' },
    { id: 'journal', icon: Book, label: 'Journal' },
    { id: 'focus', icon: Timer, label: 'Focus Timer' },
    { id: 'access', icon: Accessibility, label: 'Neuro-Aid' },
    { id: 'profile', icon: UserCircle, label: 'Profile' }
  ];

  const ThemeToggle = (
    <motion.button 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9, rotate: 15 }}
      onClick={() => setIsDarkMode(!isDarkMode)} 
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`p-2.5 rounded-xl border transition-all duration-500 ease-in-out ${
        isDarkMode 
          ? 'bg-slate-900/80 border-slate-700 text-yellow-400' 
          : 'bg-white/80 border-orange-100 text-orange-500 shadow-orange-500/20'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDarkMode ? 'dark' : 'light'}
          initial={{ y: -10, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 10, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {isDarkMode ? <Sun size={20} fill="currentColor" /> : <Moon size={20} fill="currentColor" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
  
  const NarrationToggle = (
    <motion.button 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsNarrationEnabled(!isNarrationEnabled)} 
      title={isNarrationEnabled ? "Disable Screen Narrator" : "Enable Screen Narrator"}
      className={`p-2.5 rounded-xl border transition-all duration-300 ${
        isNarrationEnabled
          ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30' 
          : `${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'} border-transparent text-gray-400 hover:text-emerald-500`
      }`}
    >
      <Ear size={20} />
    </motion.button>
  );

  if (view === 'landing') {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <style>{CUSTOM_STYLES}</style>
        <LandingPage 
          theme={theme} 
          onGetStarted={() => { setAuthMode('register'); setIsAuthModalOpen(true); }} 
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={() => setView('app')}
          isDarkMode={isDarkMode}
          theme={theme}
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col md:flex-row transition-colors duration-500 font-sans overflow-hidden`}>
      <style>{GLOBAL_STYLES}</style>
      <style>{CUSTOM_STYLES}</style>
      
      {isCloudError && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-rose-500 text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2">
          <AlertTriangle size={12} /> Sync Error: Working in Local-First Mode (Offline)
        </div>
      )}

      {/* MOBILE HEADER */}
      <header className={`md:hidden flex items-center justify-between p-4 border-b ${theme.sidebarBorder} ${theme.sidebarBg} sticky top-0 z-[100] backdrop-blur-lg`}>
        <div className="flex items-center gap-2 text-xl font-bold cinematic-text">
          <Zap className="text-orange-500 shrink-0" size={24} /> DayScore
        </div>
        <div className="flex items-center gap-2">
          {NarrationToggle}
          {ThemeToggle}
          <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open Menu" className={`p-2.5 rounded-xl ${theme.navInactive}`}><Menu size={24} /></button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`fixed right-0 top-0 bottom-0 w-[80%] max-w-sm ${theme.sidebarBg} z-[120] p-6 flex flex-col md:hidden border-l ${theme.sidebarBorder}`}>
              <div className="flex justify-between items-center mb-10">
                <span className="text-lg font-black uppercase tracking-widest opacity-40">Protocol Index</span>
                <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close Menu" className="p-2 rounded-full hover:bg-black/5"><X size={24} /></button>
              </div>
              <nav className="space-y-4 flex-1">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => { setTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${tab === item.id ? theme.navActive : theme.navInactive}`}>
                    <item.icon size={22} /><span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </nav>
              <button onClick={handleLogout} className="w-full mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold border border-rose-500/20">
                <LogOut size={22} /><span>De-Authorize</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <div className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r ${theme.sidebarBorder} ${theme.sidebarBg} p-4 flex-col fixed h-full z-40 transition-all duration-300`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-8 h-10`}>
          {!isSidebarCollapsed && (
            <div className={`text-2xl font-bold flex items-center gap-2 ${theme.text} cinematic-text`}>
              <Zap className="text-orange-500 shrink-0" /> DayScore
            </div>
          )}
          <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
             aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
             className={`p-2 rounded-xl hover:bg-black/5 ${theme.text}`}
          >
             <Menu size={20} />
          </button>
        </div>
        
        <nav className="space-y-2 flex-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id)} 
              title={item.label}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all ${tab === item.id ? theme.navActive : theme.navInactive}`}
            >
              <item.icon size={22} className="shrink-0" /> 
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`mt-auto space-y-4 ${isSidebarCollapsed ? 'items-center' : ''} flex flex-col`}>
          <div className="flex justify-center w-full px-2 gap-2">
            {NarrationToggle}
            {ThemeToggle}
          </div>
          <button 
            onClick={handleLogout} 
            title="Sign Out"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold`}
          >
            <LogOut size={22} />{!isSidebarCollapsed && <span>De-Authorize</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} h-full overflow-hidden transition-all duration-300`}>
        <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 md:pb-8">
          {tab === 'dashboard' && (
            <DashboardView 
              userData={userData} // Effectively ignored by dashboard internal fetching
              handleDataUpdate={handleDataUpdate} // Effectively ignored
              history={history} // Effectively ignored
              isDarkMode={isDarkMode} 
              theme={theme} 
              aiInsight={aiInsight}
              tasks={tasks}
            />
          )}
          {tab === 'academics' && <AcademicsPage isDarkMode={isDarkMode} theme={theme} events={events} setEvents={setEvents} />}
          {tab === 'todo' && <NotebookPage isDarkMode={isDarkMode} theme={theme} tasks={tasks} setTasks={setTasks} />}
          {tab === 'journal' && <JournalPage isDarkMode={isDarkMode} />}
          {tab === 'focus' && <FocusPage isDarkMode={isDarkMode} theme={theme} />}
          {tab === 'access' && <AccessPage isDarkMode={isDarkMode} theme={theme} />}
          {tab === 'profile' && (
            <ProfilePage 
              profile={userProfile} 
              setProfile={handleProfileUpdate} 
              settings={accessibility} 
              setSettings={setAccessibility}
              theme={theme}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            />
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl flex items-center justify-around px-4 z-[90] shadow-2xl">
         {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'focus', icon: Timer, label: 'Focus' }, { id: 'access', icon: Accessibility, label: 'Neuro-Aid' }, { id: 'profile', icon: UserCircle, label: 'Profile' }].map(m => (
           <button 
             key={m.id} 
             onClick={() => setTab(m.id)} 
             aria-label={m.label}
             className={`p-3 rounded-xl transition-all ${tab === m.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : theme.navInactive}`}
           >
             <m.icon size={24} />
           </button>
         ))}
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setView('app')}
        isDarkMode={isDarkMode}
        theme={theme}
        initialMode={authMode}
      />
    </div>
  );
}