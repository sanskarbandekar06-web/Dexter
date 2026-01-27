
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Edit3, Award, Zap, Crown, Eye,
  Type, Contrast, Share2, Settings,
  X, Sun, Droplets, Flame, Target, Activity as ActivityIcon, Check,
  Languages, Smartphone, LogOut, Trash2, Users, User,
  Bell, Shield, Globe, Palette, Moon, HelpCircle, Info, ChevronRight,
  ShieldAlert, UserMinus
} from 'lucide-react';
import { UserProfile, AccessibilitySettings, ThemeColors } from '../types';
import ImageEditorModal from '../components/ImageEditorModal';
import { signOut, auth } from '../lib/firebase';

interface ProfilePageProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  settings: AccessibilitySettings;
  setSettings: (s: AccessibilitySettings) => void;
  theme: ThemeColors;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  profile, setProfile, settings, setSettings, theme, isDarkMode, onToggleTheme 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'interface' | 'connectivity' | 'security'>('account');
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string; type: 'avatar' | 'banner' }>({
    isOpen: false, src: '', type: 'avatar'
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditorState({ isOpen: true, src: reader.result as string, type });
        e.target.value = ''; 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorSave = (resultDataUrl: string) => {
    setProfile({ ...profile, [editorState.type]: resultDataUrl });
    setEditorState({ ...editorState, isOpen: false });
  };

  const handleSaveInfo = () => {
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const menuItems = [
    { id: 'account', icon: User, label: 'Account Registry' },
    { id: 'interface', icon: Palette, label: 'Appearance' },
    { id: 'connectivity', icon: Smartphone, label: 'Phone & Sync' },
    { id: 'security', icon: Shield, label: 'Security & Exit' },
  ];

  return (
    <div className="h-full pb-32 md:pb-20 custom-scrollbar relative overflow-x-hidden">
      <AnimatePresence>
        {editorState.isOpen && (
          <ImageEditorModal 
            src={editorState.src} type={editorState.type}
            onSave={handleEditorSave}
            onCancel={() => setEditorState({ ...editorState, isOpen: false })}
            theme={theme} isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* SYSTEM PREFERENCES OVERLAY */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/40"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-5xl h-[85vh] ${theme.cardBg} border ${theme.cardBorder} rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative`}
            >
              <button 
                onClick={() => setShowSettings(false)}
                title="Close Settings"
                className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-current transition-all"
              >
                <X size={20} />
              </button>

              {/* Sidebar Navigation */}
              <div className={`w-full md:w-72 p-6 md:p-8 border-b md:border-b-0 md:border-r ${theme.sidebarBorder} bg-black/5 flex flex-col gap-6 md:gap-8 overflow-x-auto md:overflow-visible`}>
                <div className="space-y-1 shrink-0">
                  <h2 className="text-xl font-black cinematic-text">System Settings</h2>
                  <p className="text-sm font-black uppercase tracking-widest opacity-40">Heuristics v4.2.0</p>
                </div>

                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                  {menuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSettingsTab(item.id as any)}
                      className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                        settingsTab === item.id 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                          : 'opacity-50 hover:opacity-100 hover:bg-black/5'
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5 hidden md:flex flex-col gap-4">
                  <button onClick={() => setShowSettings(false)} className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity`}>
                    <User size={14} /> Back to Profile
                  </button>
                </div>
              </div>

              {/* Settings Content Area */}
              <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={settingsTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 md:space-y-10"
                  >
                    {settingsTab === 'account' && (
                      <div className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black">Account Registry</h3>
                          <p className="text-sm opacity-50">Manage your identity and authentication details.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className={`p-5 rounded-[2rem] border ${theme.cardBorder} ${theme.inputBg} flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4`}>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><User size={20} /></div>
                              <div>
                                <div className="text-sm font-black">Identity Info</div>
                                <div className="text-xs opacity-50">{profile.email}</div>
                              </div>
                            </div>
                            <button title="Edit Identity" className="text-[10px] font-black uppercase tracking-widest text-orange-500 w-full sm:w-auto text-left sm:text-right">Edit</button>
                          </div>
                          <div className={`p-5 rounded-[2rem] border ${theme.cardBorder} ${theme.inputBg} flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4`}>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><Users size={20} /></div>
                              <div>
                                <div className="text-sm font-black">Switch Protocol</div>
                                <div className="text-xs opacity-50">Active: Primary User</div>
                              </div>
                            </div>
                            <button title="Switch Protocol" className="px-4 py-2 bg-indigo-500/10 rounded-xl text-[10px] font-black uppercase w-full sm:w-auto">Switch</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === 'interface' && (
                      <div className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black">Interface Protocol</h3>
                          <p className="text-sm opacity-50">Fine-tune the visual experience of your dashboard.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-6 rounded-[2rem] border ${theme.cardBorder} ${theme.inputBg} space-y-4`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Moon size={18} /></div>
                              <span className="font-bold text-sm">Theme Mode</span>
                            </div>
                            <div className="flex p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                              <button 
                                onClick={onToggleTheme}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${!isDarkMode ? 'bg-white shadow-md text-orange-500' : 'opacity-40'}`}
                              >
                                <Sun size={14} /> Bright
                              </button>
                              <button 
                                onClick={onToggleTheme}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${isDarkMode ? 'bg-indigo-500 shadow-lg text-white' : 'opacity-40'}`}
                              >
                                <Moon size={14} /> Dark
                              </button>
                            </div>
                          </div>

                          <div className={`p-6 rounded-[2rem] border ${theme.cardBorder} ${theme.inputBg} space-y-4`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Globe size={18} /></div>
                              <span className="font-bold text-sm">Language Library</span>
                            </div>
                            <select aria-label="Select Language" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 p-3 rounded-xl text-sm font-bold outline-none">
                              <option>English (United States)</option>
                              <option>Japanese (日本語)</option>
                              <option>Spanish (Español)</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-6 rounded-[2.5rem] border ${theme.cardBorder} ${theme.inputBg} flex items-center justify-between`}>
                           <div className="flex items-center gap-4">
                             <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-500"><Contrast size={20} /></div>
                             <span className="font-bold">High Contrast Mode</span>
                           </div>
                           <button onClick={() => setSettings({...settings, highContrast: !settings.highContrast})} aria-label="Toggle High Contrast" className={`w-12 h-6 rounded-full transition-all relative ${settings.highContrast ? 'bg-orange-500' : 'bg-black/20'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.highContrast ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                      </div>
                    )}

                    {settingsTab === 'connectivity' && (
                      <div className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black">Synchronization</h3>
                          <p className="text-sm opacity-50">Connect with external devices and biometric hubs.</p>
                        </div>
                        <div className={`p-12 rounded-[3rem] border-2 border-dashed ${theme.cardBorder} flex flex-col items-center justify-center text-center space-y-6`}>
                           <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                             <Smartphone size={40} />
                           </div>
                           <div>
                             <h4 className="text-lg font-bold">Pair Mobile Device</h4>
                             <p className="text-xs opacity-50 max-w-xs mx-auto">Establish a secure link with the Dexter mobile app for real-time biometric sync.</p>
                           </div>
                           <button className="px-8 py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30">Initialize Link</button>
                        </div>
                      </div>
                    )}

                    {settingsTab === 'security' && (
                      <div className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black">Exit Protocol</h3>
                          <p className="text-sm opacity-50">Manage authentication states and data privacy.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <button 
                            onClick={handleSignOut}
                            className={`w-full p-6 rounded-[2.5rem] border border-orange-500/20 bg-orange-500/5 flex items-center justify-between group hover:bg-orange-500/10 transition-all`}
                          >
                             <div className="flex items-center gap-4">
                               <div className="p-3 bg-orange-500 text-white rounded-2xl"><LogOut size={20} /></div>
                               <div className="text-left">
                                 <div className="text-sm font-black text-orange-600 dark:text-orange-400">De-Authorize Session</div>
                                 <div className="text-xs opacity-50">Sign out of current interface</div>
                               </div>
                             </div>
                             <ChevronRight size={20} className="opacity-20 group-hover:opacity-100" />
                          </button>

                          <button className={`w-full p-6 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 flex items-center justify-between group hover:bg-rose-500/10 transition-all`}>
                             <div className="flex items-center gap-4">
                               <div className="p-3 bg-rose-500 text-white rounded-2xl"><Trash2 size={20} /></div>
                               <div className="text-left">
                                 <div className="text-sm font-black text-rose-600">Deactivate Protocol</div>
                                 <div className="text-xs opacity-50">Permanently delete your cognitive registry</div>
                               </div>
                             </div>
                             <ChevronRight size={20} className="opacity-20 group-hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={bannerInputRef} onChange={(e) => handleFileSelect(e, 'banner')} accept="image/*" className="hidden" />
      <input type="file" ref={avatarInputRef} onChange={(e) => handleFileSelect(e, 'avatar')} accept="image/*" className="hidden" />

      {/* Header Banner */}
      <div className="relative h-48 md:h-64 w-full rounded-2xl md:rounded-3xl overflow-hidden mb-8 shadow-lg group">
        <img src={profile.banner} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Profile Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={() => bannerInputRef.current?.click()} aria-label="Change Banner Image" className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
          <Camera size={18} />
        </button>
      </div>

      {/* Main Identity Card */}
      <div className="relative -mt-16 px-4 mb-8">
        <div className={`relative ${theme.cardBg} border ${theme.sidebarBorder} rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6`}>
          <div className="relative">
             <div onClick={() => avatarInputRef.current?.click()} title="Change Avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden cursor-pointer group">
               <img src={profile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="User Avatar" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <Edit3 className="text-white" size={20} />
               </div>
             </div>
             <div className="absolute bottom-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">Lvl {Math.floor(profile.streak / 7) + 1}</div>
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-1 w-full md:w-auto">
             {isEditing ? (
               <div className="space-y-2">
                 <input 
                   className={`w-full text-2xl font-black bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500`} 
                   value={profile.name} 
                   onChange={e => setProfile({...profile, name: e.target.value})} 
                   placeholder="Your Name"
                   aria-label="Edit Name"
                 />
                 <input 
                   className={`w-full text-sm opacity-50 bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500`} 
                   value={profile.title} 
                   onChange={e => setProfile({...profile, title: e.target.value})} 
                   placeholder="Your Title"
                   aria-label="Edit Title"
                 />
               </div>
             ) : (
               <>
                 <h1 className="text-3xl font-black cinematic-text tracking-tight">{profile.name}</h1>
                 <p className="text-sm opacity-50 font-medium tracking-wide uppercase">{profile.title}</p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-xs opacity-60 font-bold">
                   <span>{profile.age} Cycles</span>
                   <span>•</span>
                   <span>{profile.class} Rank</span>
                 </div>
               </>
             )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              title="System Settings"
              className={`p-3 rounded-2xl border ${theme.sidebarBorder} hover:bg-black/5 transition-all text-current`}
            >
              <Settings size={20}/>
            </button>
            <button title="Share Profile" className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20">
              <Share2 size={18} /> Flex
            </button>
            {isEditing && (
              <button onClick={handleSaveInfo} title="Save Changes" className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg hover:bg-emerald-600 transition-colors">
                <Check size={20} />
              </button>
            )}
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} title="Edit Profile" className={`p-3 rounded-2xl border ${theme.sidebarBorder} hover:bg-black/5 transition-all`}>
                <Edit3 size={20}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Goals & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-12">
        {/* Streak Block */}
        <div className={`${theme.cardBg} border ${theme.sidebarBorder} rounded-[2rem] p-8 shadow-xl relative overflow-hidden group`}>
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
           <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Consistency Engine</span>
              <Flame size={20} className="text-orange-500 animate-pulse" />
           </div>
           <div className="flex items-end gap-2">
             <div className="text-5xl font-black tabular-nums">{profile.streak}</div>
             <div className="text-sm opacity-50 font-bold mb-2 uppercase tracking-widest">Active Days</div>
           </div>
           <div className="mt-6 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(profile.streak % 7) * 14.28}%` }} 
                className="h-full bg-orange-500" 
              />
           </div>
        </div>
        
        {/* Goals Block */}
        <div className={`md:col-span-2 ${theme.cardBg} border ${theme.sidebarBorder} rounded-[2rem] p-8 shadow-xl`}>
           <div className="flex items-center gap-2 mb-6">
              <Target size={18} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Operational Targets</span>
           </div>
           <div className="flex flex-wrap gap-2">
             {profile.goals && profile.goals.length > 0 ? (
               profile.goals.map((goal, i) => (
                 <span key={i} className="px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-bold border border-indigo-500/20">
                   {goal}
                 </span>
               ))
             ) : (
               <p className="text-xs opacity-40 italic">No targets defined in registry.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
