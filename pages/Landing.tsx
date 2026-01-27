
import React from 'react';
import { 
  ArrowRight, Zap, Sparkles, Brain, Clock, 
  BookOpen, ShieldCheck, HeartPulse,
  LogIn, UserPlus, Twitter, Github, Linkedin,
  ChevronDown, Target, BarChart3, Sun, Moon
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ThemeColors } from '../types';

interface LandingPageProps {
  theme: ThemeColors;
  onGetStarted: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const NavLink = ({ href, label, theme }: { href: string; label: string; theme: ThemeColors }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // Account for sticky navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <a 
      href={href} 
      onClick={handleClick}
      className={`text-sm font-semibold transition-all hover:opacity-100 opacity-70 ${theme.text} hover:scale-105 active:scale-95 whitespace-nowrap`}
    >
      {label}
    </a>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, theme, isDarkMode, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: index * 0.1, duration: 0.8 }}
    whileHover={{ y: -12, scale: 1.02 }}
    className={`p-8 rounded-[2.5rem] border ${theme.cardBorder} ${theme.cardBg} backdrop-blur-xl shadow-xl space-y-4 group`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-50 text-orange-600'}`}>
      <Icon size={28} />
    </div>
    <h3 className={`text-xl font-bold ${theme.text}`}>{title}</h3>
    <p className={`text-sm leading-relaxed ${theme.subtext}`}>{desc}</p>
  </motion.div>
);

const LandingPage: React.FC<LandingPageProps> = ({ theme, onGetStarted, isDarkMode, onToggleTheme }) => {
  const { scrollY } = useScroll();
  
  // Transform values for a glassy "Scrolled" state
  const navBgOpacity = useTransform(scrollY, [0, 50], [0, isDarkMode ? 0.75 : 0.8]);
  const navBlur = useTransform(scrollY, [0, 50], [0, 20]);
  const navBorderOpacity = useTransform(scrollY, [0, 50], [0, 0.1]);
  const navY = useTransform(scrollY, [0, 50], [0, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  const navRgb = isDarkMode ? "15, 23, 42" : "255, 255, 255";

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} relative overflow-x-hidden selection:bg-orange-500/30`}>
      {/* 1. ANIMATED BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Drifting Grid */}
        <div 
          className={`absolute inset-0 grid-pattern opacity-[0.06] dark:opacity-[0.04] ${isDarkMode ? 'text-indigo-400' : 'text-orange-600'}`} 
        />
        
        {/* Floating Organic Orbs */}
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 ${isDarkMode ? 'bg-indigo-600' : 'bg-orange-300'}`} 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 ${isDarkMode ? 'bg-fuchsia-600' : 'bg-rose-300'}`} 
        />
      </div>

      {/* 2. GLASSY NAVBAR */}
      <motion.nav 
        style={{ 
          backgroundColor: useTransform(navBgOpacity, v => `rgba(${navRgb}, ${v})`),
          backdropFilter: useTransform(navBlur, v => `blur(${v}px)`),
          borderColor: useTransform(navBorderOpacity, v => `rgba(255, 255, 255, ${v})`),
          y: navY
        }}
        className={`fixed top-0 left-0 right-0 z-[100] border-b px-6 md:px-12 py-4 flex items-center transition-all duration-300 ease-out`}
      >
        {/* Left: Logo Container */}
        <div className="flex-1 flex items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-xl font-black cinematic-text cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Zap className="text-orange-500" fill="currentColor" />
            <span>Dexter</span>
          </motion.div>
        </div>

        {/* Middle: Center Links Container */}
        <div className="hidden lg:flex flex-[2] items-center justify-center gap-10">
          <NavLink href="#home" label="Home" theme={theme} />
          <NavLink href="#features" label="Features" theme={theme} />
          <NavLink href="#about" label="About Us" theme={theme} />
          <NavLink href="#why" label="Why Us" theme={theme} />
        </div>

        {/* Right: Actions Container */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: 15 }}
            onClick={onToggleTheme} 
            className={`p-2.5 rounded-xl border transition-all duration-500 ease-in-out ${
              isDarkMode 
                ? 'bg-slate-800/50 border-white/10 text-yellow-400' 
                : 'bg-slate-100/50 border-black/5 text-orange-500 shadow-sm'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDarkMode ? 'dark' : 'light'}
                initial={{ y: -10, opacity: 0, rotate: -45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 10, opacity: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? <Sun size={20} fill="currentColor" /> : <Moon size={20} fill="currentColor" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <button onClick={onGetStarted} className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 ${theme.text}`}>
            <LogIn size={18} /> Sign In
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(249, 115, 22, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg transition-all`}
          >
            <UserPlus size={18} /> Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* 3. HERO SECTION */}
      <section id="home" className="relative z-10 pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center min-h-screen">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl space-y-10"
        >
          <motion.div variants={itemVariants} className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border ${theme.cardBorder} ${theme.cardBg} backdrop-blur-md shadow-sm text-[10px] font-black tracking-[0.2em] uppercase`}>
            <Sparkles size={14} className="text-orange-500 animate-pulse"/> <span>Sector Alpha Activated</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-[9rem] font-black tracking-tighter cinematic-text leading-[0.85] py-4">
            Master Your <br />
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 via-indigo-500 to-orange-500 bg-[length:200%_auto]"
            >
              Daily Rhythm
            </motion.span>
          </motion.h1>

          <motion.p variants={itemVariants} className={`max-w-2xl mx-auto text-lg md:text-2xl font-medium opacity-60 leading-relaxed ${theme.text}`}>
            A Solarpunk-themed cognitive energy management ecosystem. Synchronize your sleep, deep work, and recovery to unlock your peak potential.
          </motion.p>

          <motion.div variants={itemVariants} className="pt-8 flex flex-col md:flex-row gap-6 justify-center items-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted} 
              className={`group relative inline-flex items-center gap-4 px-12 py-6 rounded-3xl text-xl font-black transition-all shadow-2xl shadow-orange-500/20 ${theme.buttonPrimary}`}
            >
              Enter Dashboard <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
            <button className={`px-10 py-5 rounded-3xl border ${theme.cardBorder} font-bold text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all`}>
               Watch Protocol
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-20">
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 opacity-30"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Initialization Downstream</span>
              <ChevronDown size={20} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. FEATURES GRID */}
      <section id="features" className="relative z-10 py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24 space-y-4"
        >
          <h2 className={`text-5xl md:text-7xl font-black cinematic-text ${theme.text}`}>The Tools of Mastery</h2>
          <p className={`max-w-xl mx-auto text-lg opacity-60 ${theme.subtext}`}>High-fidelity instruments designed to capture the essence of your focus.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            index={0} icon={Target} 
            title="Tactical Map" desc="Visualize your academic trajectories with real-time risk assessment and objective planning." 
            theme={theme} isDarkMode={isDarkMode}
          />
          <FeatureCard 
            index={1} icon={Clock} 
            title="Flow Engine" desc="Precision focus intervals synchronized with your circadian rhythm for deep cognitive output." 
            theme={theme} isDarkMode={isDarkMode}
          />
          <FeatureCard 
            index={2} icon={Brain} 
            title="Pattern Synth" desc="Advanced Gemini-driven heuristics that decode your behavior and offer personalized life paths." 
            theme={theme} isDarkMode={isDarkMode}
          />
          <FeatureCard 
            index={3} icon={BookOpen} 
            title="Mind Vault" desc="Emotional frequency journaling that evolves its visual state based on your sentiment analysis." 
            theme={theme} isDarkMode={isDarkMode}
          />
        </div>
      </section>

      {/* 5. STORY SECTION */}
      <section id="about" className="relative z-10 py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="space-y-10"
          >
            <div className={`inline-block px-4 py-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-100 text-orange-700'} text-xs font-black uppercase tracking-widest`}>
              Project Solarpunk
            </div>
            <h2 className="text-5xl md:text-7xl font-black cinematic-text leading-[0.9]">Nature's Pulse, <br/><span className="opacity-40">Digital Precision.</span></h2>
            <p className={`text-xl leading-relaxed opacity-70 ${theme.subtext}`}>
              Dexter bridges the gap between biological intuition and technological measurement. We don't just track data—we curate a lifestyle that honors the human rhythm in a hyper-connected world.
            </p>
            <div className="grid grid-cols-2 gap-12 pt-4">
              <div className="space-y-2">
                <div className="text-5xl font-black text-orange-500">98%</div>
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">User Retention</p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-black text-indigo-500">2.4h</div>
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Flow Gain / Day</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "circOut" }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-gradient-to-tr from-orange-500/30 to-indigo-600/30 blur-[100px] rounded-full animate-pulse" />
            <div className="relative rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80" 
                alt="Productivity" 
                className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. WHY US SECTION */}
      <section id="why" className="relative z-10 py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-4"
        >
          <h2 className={`text-4xl md:text-6xl font-black cinematic-text ${theme.text}`}>Why Connect with Us?</h2>
          <p className={`max-w-xl mx-auto ${theme.subtext}`}>Connecting your data to Dexter means connecting to your better self.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold">Privacy First</h3>
            <p className={theme.subtext}>Your cognitive data is yours. We use edge-encryption to ensure your journals and patterns remain private.</p>
          </div>
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
              <HeartPulse size={32} />
            </div>
            <h3 className="text-2xl font-bold">Burnout Prevention</h3>
            <p className={theme.subtext}>Our AI detects 'Cognitive Fatigue' before you do, suggesting recovery sessions when they matter most.</p>
          </div>
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <BarChart3 size={32} />
            </div>
            <h3 className="text-2xl font-bold">Unified Metrics</h3>
            <p className={theme.subtext}>Sleep, study, exercise, and screen time—all in one elegant score. No more app-switching.</p>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="relative z-10 py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`max-w-6xl mx-auto p-12 md:p-24 rounded-[4rem] bg-slate-900 text-white text-center space-y-12 shadow-3xl relative overflow-hidden group`}
        >
          {/* Internal Grid */}
          <div className="absolute inset-0 grid-pattern opacity-[0.05] pointer-events-none" />
          
          <h2 className="text-5xl md:text-8xl font-black tracking-tight cinematic-text leading-[0.85] relative z-10">Reclaim Your <br/> Daily Pulse.</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto relative z-10">Join a global collective of engineers and students optimizing their life through intelligence.</p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10 pt-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted} 
              className="px-12 py-6 rounded-[2rem] bg-orange-500 text-white font-black text-2xl hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/30"
            >
              Start Your Protocol
            </motion.button>
            <button className="px-12 py-6 rounded-[2rem] border border-white/20 font-bold text-xl hover:bg-white/10 transition-all">
              Read the Manifesto
            </button>
          </div>
        </motion.div>
      </section>

      {/* 8. FOOTER */}
      <footer className={`relative z-10 pt-32 pb-16 px-6 md:px-12 border-t border-white/5 ${theme.sidebarBg}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-2xl font-black cinematic-text">
              <Zap className="text-orange-500" fill="currentColor" />
              <span>Dexter</span>
            </div>
            <p className={`text-sm opacity-50 leading-relaxed ${theme.text}`}>
              An architectural approach to human performance. Quantifying cognitive states for a balanced tomorrow.
            </p>
            <div className="flex gap-6">
              <Twitter size={22} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
              <Github size={22} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
              <Linkedin size={22} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
          </div>
          
          {['Product', 'Company', 'Resources'].map((cat, i) => (
             <div key={i} className="space-y-8">
                <h4 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">{cat}</h4>
                <ul className="space-y-5 text-sm font-bold">
                  {['Overview', 'Security', 'Protocols', 'Laboratory'].map(link => (
                    <li key={link} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-2 group">
                       <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                       {link}
                    </li>
                  ))}
                </ul>
             </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center">© 2025 DEXTER LABORATORY. OPERATING UNDER SECTOR 7 BYPASS.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest opacity-30">
            <span className="cursor-pointer hover:opacity-100">Privacy</span>
            <span className="cursor-pointer hover:opacity-100">Ethics</span>
            <span className="cursor-pointer hover:opacity-100">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
