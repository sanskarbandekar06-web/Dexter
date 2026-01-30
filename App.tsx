import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, Zap, LayoutDashboard, GraduationCap, 
  PenTool, Book, Timer, UserCircle, Menu, LogOut, X, AlertTriangle, Sparkles,
  Accessibility, Ear, Headphones, Gamepad2
} from 'lucide-react';
import { 
  onAuthStateChanged, signOut, doc, getDoc, setDoc, auth, db, serverTimestamp, collection, query, onSnapshot, orderBy, limit, addDoc 
} from './lib/firebase';
import { APP_THEMES, GLOBAL_STYLES, CUSTOM_STYLES, generateMockHistory, INITIAL_TASKS, INITIAL_COURSES } from './constants';
import { UserData, HistoryItem, UserProfile, AccessibilitySettings, Task, CalendarEvent, Course } from './types';
import DashboardView from './pages/Dashboard';
import AcademicsPage from './pages/Academics';
import NotebookPage from './pages/Notebook';
import JournalPage from './pages/Journal';
import FocusPage from './pages/Focus';
import StudyRoom from './pages/StudyRoom';
import LandingPage from './pages/Landing';
import ProfilePage from './pages/Profile';
import AccessPage from './pages/Access';
import GamesPage from './pages/Games';
import AuthModal from './components/AuthModal';
import DayPlannerModal from './components/DayPlannerModal'; 
import { consultTheBrain, generateHolisticSchedule } from './lib/gemini';
import { fetchGoogleFitData, requestGoogleFitAuth } from './lib/googleFit';
import { simulateHealthMetrics, calculateCognitiveScore, assessBurnoutRisk } from './lib/cognitiveEngine';
import { format } from 'date-fns';

const LOCAL_STORAGE_KEY = 'day_score_cache';

// Activity Tracker Hook
const useActivityTracker = (onActivity: () => void) => {
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => onActivity();
    
    events.forEach(e => window.addEventListener(e, handleActivity));
    return () => events.forEach(e => window.removeEventListener(e, handleActivity));
  }, [onActivity]);
};

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [tab, setTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({ 
    sleep: 0, study: 0, exercise: 0, screenTime: 0, idleTime: 0, activeFocusTime: 0, score: 0,
    steps: 0, calories: 0, heartRate: 0, burnoutRisk: 'Low' 
  });
  const [fitbitDetails, setFitbitDetails] = useState<{ steps: number, calories: number, avgHr: number } | null>(null);
  const [history] = useState<HistoryItem[]>(generateMockHistory());
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [latestJournal, setLatestJournal] = useState<{ text: string, mood: string } | null>(null);

  const [focusState, setFocusState] = useState({
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isActive: false
  });
  
  // Accumulator for Focus Timer to track minutes for Deep Work
  const focusAccumulatorRef = useRef(0);

  // Activity Tracking
  const lastActivityRef = useRef(Date.now());
  const idleThreshold = 60000; // 1 minute
  // Using any to avoid "Cannot find namespace 'NodeJS'" error when types are missing
  const trackerRef = useRef<any>(null);

  const [studySession, setStudySession] = useState({
    isActive: false,
    duration: 0
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

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
    level: 0,
    trophies: []
  });

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    dyslexiaMode: false,
    highContrast: false,
    adhdMode: false
  });

  // Handle URL Callback for Google Fit
  useEffect(() => {
    if (window.location.pathname === '/googlefit/callback') {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const accessToken = params.get('access_token');
      
      if (accessToken) {
         localStorage.setItem('temp_gfit_token', accessToken);
         window.history.replaceState(null, '', '/'); 
      }
    }
  }, []);

  // Sync temp token after auth
  useEffect(() => {
    if (currentUser) {
      const tempToken = localStorage.getItem('temp_gfit_token');
      if (tempToken) {
         setDoc(doc(db, 'users', currentUser.uid, 'googleFitTokens', 'current'), {
           access_token: tempToken,
           updated_at: serverTimestamp()
         }).then(() => {
           localStorage.removeItem('temp_gfit_token');
           syncGoogleFitData(tempToken);
         });
      }
    }
  }, [currentUser]);

  // --- COGNITIVE ENGINE LOOP (SIMULATION & SCORING) ---
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
        // 1. If NO real wearable connected, run simulation
        if (!fitbitDetails) {
            const currentHour = new Date().getHours();
            const simulated = simulateHealthMetrics(currentHour);
            
            setUserData(prev => {
                // Merge simulated health data with real tracked browser data
                const updated = { ...prev, ...simulated };
                const newScore = calculateCognitiveScore(updated);
                const burnout = assessBurnoutRisk(updated);
                
                return { 
                    ...updated, 
                    score: newScore, 
                    burnoutRisk: burnout 
                };
            });
        } else {
            // Real data exists, just re-calculate score/burnout based on latest browser activity
            setUserData(prev => {
                const newScore = calculateCognitiveScore(prev);
                const burnout = assessBurnoutRisk(prev);
                return { ...prev, score: newScore, burnoutRisk: burnout };
            });
        }
    }, 5000); // Update every 5 seconds for "Live" feel

    return () => clearInterval(interval);
  }, [currentUser, fitbitDetails]);


  // --- ACTIVITY TRACKING ---
  const resetIdleTimer = () => {
    lastActivityRef.current = Date.now();
  };
  useActivityTracker(resetIdleTimer);

  useEffect(() => {
    if (!currentUser) return;
    
    // Interval to update screen time & idle metrics
    trackerRef.current = setInterval(() => {
       const now = Date.now();
       const isIdle = (now - lastActivityRef.current) > idleThreshold;
       
       if (document.visibilityState === 'visible') {
           if (!isIdle) {
               // Active Screen Time
               const increment = 1/3600; // 1 second in hours
               setUserData(prev => ({
                   ...prev,
                   screenTime: parseFloat((prev.screenTime + increment).toFixed(4)),
                   activeFocusTime: parseFloat(((prev.activeFocusTime || 0) + increment).toFixed(4))
               }));
           } else {
               // Idle Screen Time
               const increment = 1/3600;
               setUserData(prev => ({
                   ...prev,
                   screenTime: parseFloat((prev.screenTime + increment).toFixed(4)),
                   idleTime: parseFloat(((prev.idleTime || 0) + increment).toFixed(4))
               }));
           }
       }
    }, 1000);

    return () => {
       if (trackerRef.current) clearInterval(trackerRef.current);
    };
  }, [currentUser]);


  // --- GOOGLE FIT INTEGRATION ---
  const handleGoogleFitConnect = () => {
    requestGoogleFitAuth();
  };

  const syncGoogleFitData = async (token: string) => {
    try {
      const data = await fetchGoogleFitData(token);
      
      setFitbitDetails({
        steps: data.steps,
        calories: data.calories,
        avgHr: data.avgHr
      });

      // Scale exercise score to 0-10 based on steps (10k steps = 10)
      const exerciseScore = data.steps > 0 ? parseFloat((data.steps / 1000).toFixed(2)) : 0;

      setUserData(prev => ({
        ...prev,
        sleep: data.sleepHours > 0 ? data.sleepHours : prev.sleep,
        exercise: exerciseScore > 0 ? exerciseScore : prev.exercise,
        steps: data.steps,
        calories: data.calories,
        heartRate: data.avgHr
      }));

      if (auth.currentUser) {
         const todayStr = format(new Date(), 'yyyy-MM-dd');
         await setDoc(doc(db, "users", auth.currentUser.uid, "dailyStats", todayStr), {
            sleep: data.sleepHours,
            exercise: exerciseScore, 
            steps: data.steps, 
            calories: data.calories
         }, { merge: true });
      }
    } catch (err) {
      console.error("Sync Google Fit Data Error", err);
    }
  };

  // Check for existing token on load
  useEffect(() => {
    if (!currentUser) return;
    const tokenDocRef = doc(db, 'users', currentUser.uid, 'googleFitTokens', 'current');
    getDoc(tokenDocRef).then((snap) => {
      if (snap.exists()) {
        const { access_token } = snap.data();
        if (access_token) {
          syncGoogleFitData(access_token);
        }
      }
    });
  }, [currentUser]);


  // --- TASK PERSISTENCE LOGIC ---
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    const q = query(collection(db, 'users', currentUser.uid, 'tasks'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
      setTasks(fetchedTasks);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- COURSES PERSISTENCE LOGIC ---
  useEffect(() => {
    if (!currentUser) {
      setCourses(INITIAL_COURSES);
      return;
    }
    const q = query(collection(db, 'users', currentUser.uid, 'courses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCourses: Course[] = snapshot.docs.map(doc => doc.data() as Course);
      if (fetchedCourses.length > 0) setCourses(fetchedCourses);
      else setCourses([]);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- JOURNAL LISTENER (FOR AI) ---
  useEffect(() => {
    if (!currentUser) return;
    const date = new Date();
    const docId = `${date.getFullYear()}_${date.toLocaleString('default', { month: 'short' }).toUpperCase()}_${date.getDate()}`;
    
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid, 'journal', docId), (doc) => {
        if (doc.exists()) {
            setLatestJournal(doc.data() as any);
        } else {
            setLatestJournal(null);
        }
    });
    return () => unsub();
  }, [currentUser]);

  const handleStudyTimeUpdate = async (hoursToAdd: number) => {
    if (!currentUser) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    setUserData(prev => {
        const newStudy = parseFloat((prev.study + hoursToAdd).toFixed(2));
        const newActiveFocus = parseFloat(((prev.activeFocusTime || 0) + hoursToAdd).toFixed(2));
        
        // Use engine to update score immediately
        const tempState = {...prev, study: newStudy, activeFocusTime: newActiveFocus};
        const totalScore = calculateCognitiveScore(tempState);

        const docRef = doc(db, "users", currentUser.uid, "dailyStats", todayStr);
        setDoc(docRef, { 
            ...prev,
            study: newStudy,
            activeFocusTime: newActiveFocus,
            score: totalScore,
            date: serverTimestamp() 
        }, { merge: true }).catch(err => console.error("Auto-tracker sync failed", err));

        const streak = userProfile.streak || 0;
        const newLevel = Math.floor((streak * 100 + totalScore) / 250);
        if (newLevel !== userProfile.level) {
             const userRef = doc(db, "users", currentUser.uid);
             setDoc(userRef, { level: newLevel }, { merge: true });
             setUserProfile(p => ({ ...p, level: newLevel }));
        }

        return { ...prev, study: newStudy, activeFocusTime: newActiveFocus, score: totalScore };
    });
  };

  const handleTaskComplete = (task: Task) => {
      if (task.pillar === 'academics') {
          handleStudyTimeUpdate(0.5); 
      } else if (task.pillar === 'vitality') {
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          setUserData(prev => {
             // Add 1.5 units to exercise score (equivalent to ~1500 steps)
             const newExercise = prev.exercise + 1.5; 
             const totalScore = calculateCognitiveScore({...prev, exercise: newExercise});
             if(currentUser) {
                setDoc(doc(db, "users", currentUser.uid, "dailyStats", todayStr), { exercise: newExercise, score: totalScore }, { merge: true });
             }
             return {...prev, exercise: newExercise, score: totalScore};
          });
      }
  };

  // --- DAY ARCHITECT HANDLER ---
  const handleGenerateSchedule = async (energy: string, wakeTime: string, priorities: string[]) => {
    if (!currentUser) return;
    setIsGeneratingSchedule(true);
    
    const result = await generateHolisticSchedule(
        energy, 
        wakeTime, 
        priorities, 
        courses, 
        userProfile.name
    );

    if (result.schedule.length > 0) {
        const taskRef = collection(db, 'users', currentUser.uid, 'tasks');
        result.schedule.forEach(async (task, index) => {
            const { id, ...taskData } = task;
            await addDoc(taskRef, {
                ...taskData,
                createdAt: Date.now(),
                order: tasks.length + index
            });
        });
        setAiInsight(result.advice); 
    }

    setIsGeneratingSchedule(false);
    setIsPlannerOpen(false);
    setTab('todo'); 
  };

  // --- FOCUS TIMER LOGIC (GLOBAL) ---
  useEffect(() => {
    let interval: any = null;
    if (focusState.isActive && focusState.timeLeft > 0) {
      interval = setInterval(() => {
        setFocusState(prev => {
          if (prev.timeLeft <= 1) {
             if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Session Complete", { body: "Time to transition." });
             }
             return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });

        focusAccumulatorRef.current += 1;
        if (focusAccumulatorRef.current >= 60) {
            handleStudyTimeUpdate(1/60); 
            focusAccumulatorRef.current = 0;
        }

      }, 1000);
    } else {
        clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [focusState.isActive]);

  // --- GEMINI INTELLIGENCE BRAIN (Background) ---
  useEffect(() => {
    if (view !== 'app' || !currentUser) return;

    const timer = setTimeout(async () => {
      if (tasks.length > 0 && tasks.some(t => t.isAI)) return;

      const brainResponse = await consultTheBrain(
          userData, 
          courses, 
          tasks, 
          latestJournal, 
          userProfile.name
      );
      
      if (brainResponse.insight) {
        setAiInsight(brainResponse.insight);
      }
    }, 5000); 

    return () => clearTimeout(timer);
  }, [tasks, userData, courses, latestJournal, view, currentUser]); 

  // --- NARRATION & AUTH EFFECTS ---
  useEffect(() => {
    if (!isNarrationEnabled) { 
      window.speechSynthesis.cancel(); 
      return; 
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Filter out huge structural containers to avoid noise
      if (target.tagName === 'BODY' || target.tagName === 'HTML' || target.id === 'root') return;

      // Extract text content, prioritizing meaningful labels
      const text = target.innerText?.trim() || target.getAttribute('aria-label') || target.getAttribute('title');
      
      if (text && text.length > 0 && text.length < 500) {
        // Cancel current speech to prevent queueing long lists
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    const handleMouseOut = () => {
      // Optional: stop speaking when moving mouse out of an element
      // For short phrases, we let it finish, but for accessibility we can cancel
      // window.speechSynthesis.cancel();
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
          const docRef = doc(db, "users", user.uid);
          let docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
             await setDoc(docRef, {
                name: user.displayName || "New Operative",
                email: user.email,
                mobile: "",
                activityLevel: "moderate",
                goals: [],
                createdAt: serverTimestamp(),
                level: 0,
                streak: 0, 
                lastActiveDate: new Date().toISOString().split('T')[0],
                title: "Cognitive Architect",
                avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
                banner: "https://images.unsplash.com/photo-1506259091721-347f798196d4?auto=format&fit=crop&w=1200&q=80"
             }, { merge: true });
             docSnap = await getDoc(docRef);
          }
          
          const data = docSnap.data();
          if (data) {
             const todayStr = new Date().toISOString().split('T')[0];
             const lastActive = data.lastActiveDate;
             let currentStreak = data.streak || 0;

             if (lastActive !== todayStr) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastActive === yesterdayStr) {
                   currentStreak += 1;
                } else {
                   currentStreak = 1; 
                }

                const currentScore = 0;
                const newLevel = Math.floor((currentStreak * 100 + currentScore) / 250);

                await setDoc(docRef, {
                   streak: currentStreak,
                   level: newLevel,
                   lastActiveDate: todayStr
                }, { merge: true });
                
                data.streak = currentStreak;
                data.level = newLevel;
                data.lastActiveDate = todayStr;
             }

             setUserProfile(prev => ({ ...prev, ...data }));
          }

          setIsAuthModalOpen(false);
          setView('app');
          setIsCloudError(false);
        } catch (err: any) {
          console.error("Profile load error", err);
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
  
  const handleDataUpdate = async (field: string, value: string) => {
    // Only attempt strict number parsing for numeric fields to prevent NaN or errors on strings
    const isNumeric = !isNaN(parseFloat(value)) && isFinite(Number(value));
    
    let newVal: string | number = value;
    if (isNumeric) {
        newVal = parseFloat(parseFloat(value).toFixed(2));
    }
    
    setUserData(prev => ({ ...prev, [field]: newVal }));
  };

  // --- STUDY ROOM TIMER LOGIC ---
  useEffect(() => {
    let interval: any = null;
    if (studySession.isActive) {
      interval = setInterval(() => {
        setStudySession(prev => {
          const nextDuration = prev.duration + 1;
          if (nextDuration % 60 === 0) {
             handleStudyTimeUpdate(1/60);
          }
          return { ...prev, duration: nextDuration };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studySession.isActive]);

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), updatedProfile, { merge: true });
        setIsCloudError(false);
      } catch (err) { setIsCloudError(true); }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUserData({ sleep: 0, study: 0, exercise: 0, screenTime: 0, idleTime: 0, activeFocusTime: 0, score: 0 });
    setCourses(INITIAL_COURSES);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'academics', icon: GraduationCap, label: 'Strategy Map' },
    { id: 'study', icon: Headphones, label: 'Study Room' },
    { id: 'games', icon: Gamepad2, label: 'Recreation' },
    { id: 'todo', icon: PenTool, label: 'Checklist' },
    { id: 'journal', icon: Book, label: 'Journal' },
    { id: 'focus', icon: Timer, label: 'Focus' },
    { id: 'access', icon: Accessibility, label: 'Neuro-Aid' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const ThemeToggle = (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)} 
      className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/10 text-yellow-400' : 'bg-black/5 text-slate-600'}`}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  const NarrationToggle = (
    <button 
      onClick={() => {
         if (isNarrationEnabled) window.speechSynthesis.cancel();
         setIsNarrationEnabled(!isNarrationEnabled);
      }} 
      className={`p-2 rounded-xl transition-all ${isNarrationEnabled ? 'bg-indigo-500 text-white shadow-lg' : isDarkMode ? 'bg-white/10 text-slate-400' : 'bg-black/5 text-slate-400'}`}
    >
      <Ear size={20} />
    </button>
  );

  if (view === 'landing') {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <style>{CUSTOM_STYLES}</style>
        <LandingPage 
          theme={theme} 
          onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
          onRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
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

  // Pass details directly if connected, otherwise the engine will populate UserData.steps/hr
  const displayFitbitDetails = fitbitDetails || {
      steps: userData.steps || 0,
      calories: userData.calories || 0,
      avgHr: userData.heartRate || 0
  };

  const dashboardWithProps = (
     <DashboardView 
        userData={userData} 
        userProfile={userProfile}
        handleProfileUpdate={handleProfileUpdate}
        handleDataUpdate={handleDataUpdate} 
        history={history} 
        isDarkMode={isDarkMode} 
        theme={theme} 
        aiInsight={aiInsight}
        tasks={tasks}
        courses={courses} 
        fitbitDetails={displayFitbitDetails}
        // @ts-ignore
        onConnectGoogleFit={handleGoogleFitConnect}
        isGoogleFitConnected={!!fitbitDetails}
     />
  );
  
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
          <Zap className="text-orange-500 shrink-0" size={24} /> Dexter
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
              <Zap className="text-orange-500 shrink-0" /> Dexter
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

        {/* DAY ARCHITECT BUTTON */}
        <div className="mt-auto mb-4 px-2">
           <button 
             onClick={() => setIsPlannerOpen(true)}
             className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20 hover:bg-orange-500/20 transition-all`}
             title="Open Day Architect"
           >
              <Sparkles size={18} />
              {!isSidebarCollapsed && "Day Architect"}
           </button>
        </div>

        <div className={`space-y-4 ${isSidebarCollapsed ? 'items-center' : ''} flex flex-col`}>
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
        <div className={`h-full overflow-y-auto custom-scrollbar ${tab === 'study' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 pb-32 md:pb-8'}`}>
          {tab === 'dashboard' && dashboardWithProps}
          {tab === 'academics' && <AcademicsPage isDarkMode={isDarkMode} theme={theme} events={events} setEvents={setEvents} courses={courses} setCourses={setCourses} userId={currentUser?.uid} />}
          {tab === 'study' && (
            <StudyRoom 
              isDarkMode={isDarkMode} 
              theme={theme} 
              studySession={studySession}
              setStudySession={setStudySession}
            />
          )}
          {tab === 'games' && <GamesPage />}
          {tab === 'todo' && (
            <NotebookPage 
              isDarkMode={isDarkMode} 
              theme={theme} 
              tasks={tasks} 
              setTasks={setTasks} 
              userId={currentUser?.uid} 
              onOpenPlanner={() => setIsPlannerOpen(true)}
              onTaskComplete={handleTaskComplete}
            />
          )}
          {tab === 'journal' && <JournalPage isDarkMode={isDarkMode} userId={currentUser?.uid} />}
          {tab === 'focus' && (
            <FocusPage 
              isDarkMode={isDarkMode} 
              theme={theme} 
              focusState={focusState} 
              setFocusState={setFocusState}
              onUpdateStudyTime={handleStudyTimeUpdate}
            />
          )}
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
              userData={userData}
              // @ts-ignore
              onConnectGoogleFit={handleGoogleFitConnect}
            />
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl flex items-center justify-around px-4 z-[90] shadow-2xl">
         {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'study', icon: Headphones, label: 'Study' }, { id: 'focus', icon: Timer, label: 'Focus' }, { id: 'profile', icon: UserCircle, label: 'Profile' }].map(m => (
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

      <DayPlannerModal 
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onGenerate={handleGenerateSchedule}
        isDarkMode={isDarkMode}
        theme={theme}
        isLoading={isGeneratingSchedule}
      />
    </div>
  );
}