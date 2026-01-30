
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Lock, User, Phone, 
  ChevronRight, Sparkles, Target, Activity,
  Camera, Plus, Calendar, Users, Loader2, ChevronDown
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, 
  doc, setDoc, auth, db, collection, query, where, getDocs
} from '../lib/firebase';
import { ThemeColors } from '../types';
import ImageEditorModal from './ImageEditorModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDarkMode: boolean;
  theme: ThemeColors;
  initialMode?: 'login' | 'register';
}

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
];

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, isDarkMode, theme, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string }>({
    isOpen: false, src: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    mobile: "",
    birthdate: "",
    gender: "Prefer not to say",
    activityLevel: "moderate",
    goals: "",
    avatar: DEFAULT_AVATARS[0]
  });

  // Reset state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(1);
      setError("");
    }
  }, [isOpen, initialMode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditorState({ isOpen: true, src: reader.result as string });
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorSave = (resultDataUrl: string) => {
    setFormData({ ...formData, avatar: resultDataUrl });
    setEditorState({ ...editorState, isOpen: false });
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return 21; // Default
    const today = new Date();
    const birthDate = new Date(birthdate);
    if (isNaN(birthDate.getTime())) return 21; // Validate date to prevent NaN
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handleNext = async () => {
    setError("");
    if (step === 1) {
      if (!formData.name.trim()) return setError("Full Name is required.");
      if (!formData.mobile.trim()) return setError("Mobile number is required.");
      if (formData.mobile.length > 12) return setError("Mobile number cannot exceed 12 digits.");
      if (!formData.email.trim()) return setError("Email is required.");
      if (!formData.password.trim()) return setError("Password is required.");

      // Check for unique mobile number
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("mobile", "==", formData.mobile));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setError("This mobile number is already registered to another operative.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error checking mobile uniqueness:", err);
        // Fallback: proceed if offline or permission denied (depending on rules), 
        // but ideally this catches duplicates.
      }
      setLoading(false);
      setStep(2);
    } else if (step === 2) {
      if (!formData.birthdate) return setError("Birthdate is required.");
      if (!formData.gender) return setError("Gender is required.");
      if (!formData.goals.trim()) return setError("Please define at least one goal.");
      setStep(3);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onSuccess();
        onClose();
      } else {
        // Final validation
        if (step === 3 && !formData.avatar) return setError("Please select an avatar.");

        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // 2. Set Display Name & Photo for Auth
        await updateProfile(user, {
          displayName: formData.name,
          photoURL: formData.avatar
        });
        
        // 3. Create Full Document in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            birthdate: formData.birthdate,
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            goals: formData.goals.split(',').map(g => g.trim()).filter(g => g !== ""),
            avatar: formData.avatar,
            banner: "https://images.unsplash.com/photo-1506259091721-347f798196d4?auto=format&fit=crop&w=1200&q=80",
            title: "Cognitive Initiate",
            age: calculateAge(formData.birthdate),
            class: "Solaris",
            streak: 0,
            level: 0,
            trophies: [],
            metrics: { sleep: 7, study: 4, exercise: 30, screenTime: 5 },
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          console.error("Firestore document setup failed:", dbErr);
        }

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <AnimatePresence>
        {editorState.isOpen && (
          <ImageEditorModal 
            src={editorState.src} 
            type="avatar"
            onSave={handleEditorSave}
            onCancel={() => setEditorState({ ...editorState, isOpen: false })}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'} w-full max-w-lg rounded-[2.5rem] border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} shadow-3xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="p-6 md:p-8 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="text-orange-500" size={20} />
            <h2 className={`text-xl md:text-2xl font-black cinematic-text ${theme.text}`}>
              {mode === 'login' ? 'Welcome Back' : 'Initiate Protocol'}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${theme.text}`}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 pt-0 flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:ring-2 ring-orange-500/20 outline-none`} 
                      placeholder="alex@sector7.com" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:ring-2 ring-orange-500/20 outline-none`} 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
                <button onClick={handleAuth} disabled={loading} className={`w-full py-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:bg-orange-600 transition-all`}>
                  {loading ? "Authenticating..." : "Establish Connection"} <ChevronRight size={18} />
                </button>
                <p className={`text-center text-sm opacity-60 ${theme.text}`}>
                  New operative? <button onClick={() => setMode('register')} className="text-orange-500 font-black">Register System</button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="register" className="space-y-6">
                {error && <p className="text-xs text-rose-500 font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
                
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Full Name <span className="text-orange-500">*</span></label>
                       <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input 
                          type="text" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} 
                          placeholder="Alex Sterling" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Mobile Interface <span className="text-orange-500">*</span> (Max 12)</label>
                       <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input 
                          type="tel" 
                          value={formData.mobile} 
                          onChange={e => {
                            if (e.target.value.length <= 12) {
                              setFormData({...formData, mobile: e.target.value});
                            }
                          }} 
                          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} 
                          placeholder="+15550000000" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Email Protocol <span className="text-orange-500">*</span></label>
                       <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} 
                          placeholder="alex@sector7.com" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Access Key <span className="text-orange-500">*</span></label>
                       <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input 
                          type="password" 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} 
                          placeholder="••••••••" 
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleNext} 
                      disabled={loading}
                      className={`w-full py-4 rounded-2xl bg-orange-500 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-600 transition-all ${loading ? 'opacity-70' : ''}`}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                          Next Phase <ChevronRight size={18}/>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* Personal Details Row with Enhanced Animation */}
                      <div className="flex gap-4">
                         
                         {/* Birthdate Input */}
                         <motion.div 
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                           className="flex-1 space-y-2 group"
                         >
                           <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Calendar size={14}/> Birthdate <span className="text-orange-500">*</span></label>
                           <div className={`relative rounded-2xl border transition-all duration-300 ${
                             formData.birthdate 
                               ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                               : `${theme.inputBorder} ${isDarkMode ? 'hover:border-white/20' : 'hover:border-slate-300'}`
                             } ${theme.inputBg} focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 group-hover:shadow-md`}
                           >
                             <input 
                               type="date" 
                               value={formData.birthdate} 
                               onChange={e => setFormData({...formData, birthdate: e.target.value})}
                               onClick={(e) => {
                                 // Safe call to showPicker
                                 try {
                                   if (typeof e.currentTarget.showPicker === 'function') {
                                     e.currentTarget.showPicker();
                                   }
                                 } catch (error) {
                                   // Ignore errors if feature is unavailable
                                 }
                               }}
                               style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                               className={`w-full py-4 px-4 bg-transparent ${theme.text} text-sm font-bold outline-none cursor-pointer min-h-[58px] [&::-webkit-calendar-picker-indicator]:opacity-0 z-10 relative`} 
                             />
                             <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${formData.birthdate ? 'text-orange-500' : 'opacity-40 ' + theme.text}`}>
                               <Calendar size={18} />
                             </div>
                           </div>
                         </motion.div>

                         {/* Gender Input */}
                         <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
                           className="flex-1 space-y-2 group"
                         >
                           <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Users size={14}/> Gender <span className="text-orange-500">*</span></label>
                           <div className={`relative rounded-2xl border transition-all duration-300 ${
                             formData.gender && formData.gender !== "Prefer not to say"
                               ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                               : `${theme.inputBorder} ${isDarkMode ? 'hover:border-white/20' : 'hover:border-slate-300'}`
                             } ${theme.inputBg} focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 group-hover:shadow-md`}
                           >
                             <select 
                               value={formData.gender} 
                               onChange={e => setFormData({...formData, gender: e.target.value})} 
                               className={`w-full py-4 px-4 bg-transparent ${theme.text} text-sm font-bold outline-none appearance-none cursor-pointer min-h-[58px] relative z-10`} 
                             >
                               <option value="" disabled>Select Gender</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Non-binary">Non-binary</option>
                               <option value="Other">Other</option>
                               <option value="Prefer not to say">Prefer not to say</option>
                             </select>
                             <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${formData.gender !== "Prefer not to say" ? 'text-orange-500' : 'opacity-40 ' + theme.text}`}>
                               <ChevronDown size={18} />
                             </div>
                           </div>
                         </motion.div>
                      </div>

                      <div className="space-y-4">
                        <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Activity size={14}/> Activity Level</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['low', 'moderate', 'high', 'athlete'].map((lvl, idx) => (
                             <motion.button 
                               key={lvl} 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: 0.3 + (idx * 0.05) }}
                               onClick={() => setFormData({...formData, activityLevel: lvl})} 
                               className={`py-3 px-4 rounded-xl border text-sm font-black capitalize transition-all ${
                                 formData.activityLevel === lvl 
                                   ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105' 
                                   : `${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} ${theme.inputBorder} ${theme.text} hover:opacity-100`
                               }`}
                             >
                               {lvl}
                             </motion.button>
                           ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Target size={14}/> Current Goals <span className="text-orange-500">*</span></label>
                        <textarea 
                          value={formData.goals} 
                          onChange={e => setFormData({...formData, goals: e.target.value})} 
                          className={`w-full p-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} h-20 focus:ring-2 ring-orange-500/20 outline-none`} 
                          placeholder="Goal 1, Goal 2, Goal 3..." 
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className={`flex-1 py-4 rounded-2xl border ${isDarkMode ? 'border-white/20 bg-slate-800' : 'border-slate-300 bg-slate-100'} font-black ${theme.text} hover:opacity-80 transition-all shadow-sm`}>Back</button>
                        <button onClick={handleNext} className="flex-[2] py-4 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all">Next Phase</button>
                      </div>
                   </motion.div>
                )}

                {step === 3 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="text-center space-y-4">
                        <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Visual Identity</label>
                        <div className="flex justify-center">
                          <div className="relative group">
                            <img src={formData.avatar} className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-xl object-cover" />
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                               <Camera className="text-white" size={24} />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center flex-wrap gap-4">
                           {DEFAULT_AVATARS.map((av, i) => (
                             <button key={i} onClick={() => setFormData({...formData, avatar: av})} className={`w-12 h-12 rounded-full border-2 transition-all ${formData.avatar === av ? 'border-orange-500 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}>
                               <img src={av} className="w-full h-full rounded-full object-cover" />
                             </button>
                           ))}
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className={`w-12 h-12 rounded-full border-2 border-dashed ${isDarkMode ? 'border-white/20 hover:border-white/40' : 'border-slate-300 hover:border-slate-400'} flex items-center justify-center text-orange-500 transition-all`}
                           >
                             <Plus size={20} className="animate-pulse" />
                           </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className={`flex-1 py-4 rounded-2xl border ${isDarkMode ? 'border-white/20 bg-slate-800' : 'border-slate-300 bg-slate-100'} font-black ${theme.text} hover:opacity-80 transition-all shadow-sm`}>Back</button>
                        <button onClick={handleAuth} disabled={loading} className="flex-[2] py-4 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all">
                          {loading ? "Registering..." : "Finalize Protocol"}
                        </button>
                      </div>
                   </motion.div>
                )}
                
                <p className={`text-center text-sm opacity-60 ${theme.text}`}>
                  Returning operative? <button onClick={() => {setMode('login'); setStep(1);}} className="text-orange-500 font-black">Sign In</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
