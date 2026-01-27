import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Lock, User, Phone, 
  ChevronRight, Sparkles, Target, Activity,
  Camera, Plus
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, 
  doc, setDoc, auth, db 
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
    activityLevel: "moderate",
    goals: "",
    avatar: DEFAULT_AVATARS[0]
  });

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

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onSuccess();
        onClose();
      } else {
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
            activityLevel: formData.activityLevel,
            goals: formData.goals.split(',').map(g => g.trim()).filter(g => g !== ""),
            avatar: formData.avatar,
            banner: "https://images.unsplash.com/photo-1506259091721-347f798196d4?auto=format&fit=crop&w=1200&q=80",
            title: "Cognitive Initiate",
            age: 21,
            class: "Solaris",
            streak: 0,
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
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Full Name</label>
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
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Mobile Interface</label>
                       <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input 
                          type="tel" 
                          value={formData.mobile} 
                          onChange={e => setFormData({...formData, mobile: e.target.value})} 
                          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} 
                          placeholder="+1 (555) 000-0000" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Email Protocol</label>
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
                       <label className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Access Key</label>
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
                    <button onClick={() => setStep(2)} className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-600 transition-all">Next Phase <ChevronRight size={18}/></button>
                  </motion.div>
                )}

                {step === 2 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="space-y-4">
                        <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Activity size={14}/> Activity Level</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['low', 'moderate', 'high', 'athlete'].map(lvl => (
                             <button 
                               key={lvl} 
                               onClick={() => setFormData({...formData, activityLevel: lvl})} 
                               className={`py-3 px-4 rounded-xl border text-sm font-black capitalize transition-all ${
                                 formData.activityLevel === lvl 
                                   ? 'bg-orange-500 border-orange-500 text-white shadow-lg' 
                                   : `${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} ${theme.inputBorder} ${theme.text} hover:opacity-100`
                               }`}
                             >
                               {lvl}
                             </button>
                           ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${theme.text}`}><Target size={14}/> Current Goals</label>
                        <textarea 
                          value={formData.goals} 
                          onChange={e => setFormData({...formData, goals: e.target.value})} 
                          className={`w-full p-4 rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} h-24 focus:ring-2 ring-orange-500/20 outline-none`} 
                          placeholder="Goal 1, Goal 2, Goal 3..." 
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className={`flex-1 py-4 rounded-2xl border ${isDarkMode ? 'border-white/20 bg-slate-800' : 'border-slate-300 bg-slate-100'} font-black ${theme.text} hover:opacity-80 transition-all shadow-sm`}>Back</button>
                        <button onClick={() => setStep(3)} className="flex-[2] py-4 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all">Next Phase</button>
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
                      {error && <p className="text-xs text-rose-500 font-bold text-center">{error}</p>}
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