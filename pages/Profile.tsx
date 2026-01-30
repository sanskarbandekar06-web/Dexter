
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Edit3, Award, Zap, Crown, Eye,
  Type, Contrast, Share2, Settings,
  X, Sun, Droplets, Flame, Target, Activity as ActivityIcon, Check,
  Languages, Smartphone, LogOut, Trash2, Users, User,
  Bell, Shield, Globe, Palette, Moon, HelpCircle, Info, ChevronRight,
  ShieldAlert, UserMinus, Calendar, FileText, Download, Loader2, Table, Mail
} from 'lucide-react';
import { UserProfile, AccessibilitySettings, ThemeColors, UserData } from '../types';
import ImageEditorModal from '../components/ImageEditorModal';
import { signOut, auth, db, collection, getDocs, query, orderBy, where } from '../lib/firebase';
import { startOfWeek, startOfMonth, format, parseISO, subDays } from 'date-fns';
import emailjs from '@emailjs/browser';
// @ts-ignore
import XLSX from 'xlsx-js-style';

// --- EMAILJS CONFIGURATION ---
const EMAILJS_SERVICE_ID = "service_vxwwcue";
const EMAILJS_TEMPLATE_ID = "template_nhlhhtx";
const EMAILJS_PUBLIC_KEY = "V_36BPOCy1t85cX7D";

interface ProfilePageProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  settings: AccessibilitySettings;
  setSettings: (s: AccessibilitySettings) => void;
  theme: ThemeColors;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userData: UserData; // Added to access live score
  onConnectGoogleFit?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  profile, setProfile, settings, setSettings, theme, isDarkMode, onToggleTheme, userData, onConnectGoogleFit 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'interface' | 'connectivity' | 'security'>('account');
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string; type: 'avatar' | 'banner' }>({
    isOpen: false, src: '', type: 'avatar'
  });
  
  // Export & Email State
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [exportError, setExportError] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

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

  const generateExcelData = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // 1. Calculate Date Range (Last 7 Days)
    const sevenDaysAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    
    // 2. Fetch Data Client-Side
    const q = query(collection(db, 'users', user.uid, 'dailyStats'));
    
    try {
      const querySnapshot = await getDocs(q);
      
      let rawData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(row => row.id >= sevenDaysAgoStr); // Filter last 7 days based on ID string

      // --- FALLBACK: If no historical data, use current live session data ---
      if (rawData.length === 0) {
         // Check if current userData has meaningful data
         if (userData.score > 0 || userData.study > 0 || userData.sleep > 0 || userData.steps > 0) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            rawData.push({
               id: todayStr,
               score: userData.score,
               sleep: userData.sleep,
               study: userData.study,
               activeFocusTime: userData.activeFocusTime || 0,
               steps: userData.steps || 0
            });
         }
      }

      if (rawData.length === 0) return null;

      // 3. Sort Data in Memory (Newest First)
      rawData.sort((a, b) => b.id.localeCompare(a.id));

      // 4. Process Data for Excel
      const dailyData = rawData.map(row => ({
          "Date": row.id,
          "Daily Score": row.score || 0,
          "Sleep (h)": row.sleep || 0,
          "Study (h)": row.study || 0,
          "Focus (h)": row.activeFocusTime || 0,
          "Steps": row.steps || 0
      }));

      // 5. Calculate Summary
      const totalScore = rawData.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avgScore = (totalScore / rawData.length).toFixed(1);
      const totalFocus = rawData.reduce((acc, curr) => acc + (curr.activeFocusTime || 0), 0).toFixed(1);

      // 6. Create Excel Workbook
      const wb = XLSX.utils.book_new();
      const summaryData = [{ "Report Period": "Last 7 Days", "Avg Score": avgScore, "Total Focus": `${totalFocus} hrs` }];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      const dailyWs = XLSX.utils.json_to_sheet(dailyData);

      // Style Header
      const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F46E5" } } };
      const applyHeaderStyle = (ws: any) => {
          if (!ws['!ref']) return;
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let C = range.s.c; C <= range.e.c; ++C) {
              const address = XLSX.utils.encode_cell({ r: 0, c: C });
              if (!ws[address]) continue;
              ws[address].s = headerStyle;
          }
      };
      applyHeaderStyle(summaryWs);
      applyHeaderStyle(dailyWs);

      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
      XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Logs");

      // 7. Write to Base64
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      
      return { 
          base64: wbout, 
          summary: { avgScore, totalFocus } 
      };
    } catch (e) {
      console.error("Error generating report:", e);
      return null;
    }
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    setEmailStatus(null);

    try {
      // 1. Generate Data
      const data = await generateExcelData();
      
      if (!data) {
        setEmailStatus({ type: 'error', msg: "No data found. Try tracking some activity first." });
        return;
      }

      // 2. Prepare Email Parameters
      // NOTE: We are removing the 'content' field with the Base64 file string.
      // Free EmailJS often fails when sending large strings as variables.
      // We send the stats in the message body instead.
      const summaryMessage = `
        Weekly Cognitive Report for ${profile.name}
        
        ----------------------------------
        Average Score: ${data.summary.avgScore}
        Total Deep Work: ${data.summary.totalFocus} hrs
        ----------------------------------
        
        The full Excel log has been downloaded to your device.
      `;

      const templateParams = {
        to_name: profile.name,
        to_email: profile.email,
        message: summaryMessage, // Mapping to standard 'message' field
        avg_score: data.summary.avgScore, // Retain specific fields if your template uses them
        total_focus: data.summary.totalFocus,
        report_date: format(new Date(), 'MMM dd, yyyy')
      };

      // 3. Send via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setEmailStatus({ type: 'success', msg: "Email sent! File downloaded." });
      
      // 4. TRIGGER DOWNLOAD AS BACKUP
      const link = document.createElement("a");
      link.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + data.base64;
      link.download = `Dexter_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();

    } catch (error: any) {
      console.error("Email failed:", error);
      setEmailStatus({ type: 'error', msg: "Email failed. Report downloaded locally." });
    } finally {
      setIsEmailing(false);
      setTimeout(() => setEmailStatus(null), 5000);
    }
  };

  const handleExportExcel = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsExporting(true);
    setExportError("");

    try {
      // Manual Export Logic
      const q = query(collection(db, 'users', user.uid, 'dailyStats'));
      const querySnapshot = await getDocs(q);
      
      let rawData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort Descending
      rawData.sort((a, b) => b.id.localeCompare(a.id));

      // Fallback for Manual Export too
      if (rawData.length === 0) {
         if (userData.score > 0 || userData.study > 0 || userData.sleep > 0) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            rawData.push({
               id: todayStr,
               score: userData.score,
               sleep: userData.sleep,
               study: userData.study,
               activeFocusTime: userData.activeFocusTime || 0
            });
         } else {
            setExportError("No history found to export.");
            setIsExporting(false);
            return;
         }
      }

      const dailyData = rawData.map(row => ({
        "Date": row.id,
        "Daily Score": row.score || 0,
        "Sleep Hours": row.sleep || 0,
        "Productivity Hours": row.study || 0,
        "Deep Work Hours": row.activeFocusTime || 0
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, ws, "Daily Metrics");
      XLSX.writeFile(wb, `${user.uid}_export.xlsx`);

    } catch (err: any) {
      console.error("Export failed", err);
      setExportError("Failed to generate Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return profile.age || 0;
    const today = new Date();
    const birthDate = new Date(birthdate);
    if (isNaN(birthDate.getTime())) return profile.age || 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const menuItems = [
    { id: 'account', icon: User, label: 'Account Registry' },
    { id: 'interface', icon: Palette, label: 'Appearance' },
    { id: 'connectivity', icon: Smartphone, label: 'Phone & Sync' },
    { id: 'security', icon: Shield, label: 'Security & Data' },
  ];

  const currentAge = calculateAge(profile.birthdate);

  const streakPoints = profile.streak * 100;
  const currentScore = userData.score || 0;
  const totalExperience = streakPoints + currentScore;
  const levelThreshold = 250; 
  
  const currentLevel = (profile.level !== undefined) ? profile.level : Math.floor(totalExperience / levelThreshold);
  const progressToNext = ((totalExperience % levelThreshold) / levelThreshold) * 100;

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
                             <ActivityIcon size={40} />
                           </div>
                           <div>
                             <h4 className="text-lg font-bold">Google Fit Integration</h4>
                             <p className="text-xs opacity-50 max-w-xs mx-auto">Establish a secure link with Google Health Connect for real-time biometric sync.</p>
                           </div>
                           {onConnectGoogleFit && (
                            <button onClick={onConnectGoogleFit} className="px-8 py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
                                Initialize Link
                            </button>
                           )}
                        </div>
                      </div>
                    )}

                    {settingsTab === 'security' && (
                      <div className="space-y-8">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black">Data & Security</h3>
                          <p className="text-sm opacity-50">Manage data exports, authentication, and privacy.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          
                          {/* EMAIL WEEKLY REPORT BUTTON */}
                          <button 
                            onClick={handleEmailReport}
                            disabled={isEmailing}
                            className={`w-full p-6 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/5 flex items-center justify-between group hover:bg-blue-500/10 transition-all`}
                          >
                             <div className="flex items-center gap-4">
                               <div className="p-3 bg-blue-500 text-white rounded-2xl">
                                 {isEmailing ? <Loader2 size={20} className="animate-spin"/> : <Mail size={20} />}
                               </div>
                               <div className="text-left">
                                 <div className="text-sm font-black text-blue-600 dark:text-blue-400">Email Weekly Report</div>
                                 <div className="text-xs opacity-50">
                                   {isEmailing ? "Processing..." : "Send last 7 days report"}
                                 </div>
                               </div>
                             </div>
                             <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 text-blue-500" />
                          </button>
                          {emailStatus && (
                            <div className={`text-xs font-bold p-3 rounded-xl border text-center ${emailStatus.type === 'success' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                              {emailStatus.msg}
                            </div>
                          )}

                          {/* EXPORT BUTTON */}
                          <button 
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className={`w-full p-6 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between group hover:bg-emerald-500/10 transition-all`}
                          >
                             <div className="flex items-center gap-4">
                               <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                                 {isExporting ? <Loader2 size={20} className="animate-spin"/> : <Table size={20} />}
                               </div>
                               <div className="text-left">
                                 <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">Export Daily Report (Excel)</div>
                                 <div className="text-xs opacity-50">
                                   {isExporting ? "Generating Spreadsheet..." : "Download structured .xlsx file"}
                                 </div>
                               </div>
                             </div>
                             <FileText size={20} className="opacity-20 group-hover:opacity-100 text-emerald-500" />
                          </button>
                          {exportError && (
                            <div className="text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                              {exportError}
                            </div>
                          )}

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

      {/* Header Banner - Enhanced */}
      <div className="relative h-56 md:h-72 w-full rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group border border-white/5">
        <img src={profile.banner} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Profile Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <button onClick={() => bannerInputRef.current?.click()} aria-label="Change Banner Image" className="absolute top-6 right-6 p-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100">
          <Camera size={20} />
        </button>
      </div>

      {/* Main Identity Card - Overlapping */}
      <div className="relative -mt-24 px-4 md:px-8 mb-8 z-10">
        <div className={`relative ${theme.cardBg} border ${theme.sidebarBorder} rounded-[2.5rem] p-6 md:p-10 shadow-3xl backdrop-blur-sm flex flex-col md:flex-row items-center gap-8`}>
          
          {/* Avatar Section */}
          <div className="relative shrink-0">
             <div onClick={() => avatarInputRef.current?.click()} title="Change Avatar" className="w-32 h-32 md:w-36 md:h-36 rounded-[2rem] border-[6px] border-white dark:border-[#0f172a] shadow-2xl overflow-hidden cursor-pointer group relative">
               <img src={profile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="User Avatar" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <Edit3 className="text-white" size={24} />
               </div>
             </div>
             {/* Rank Badge */}
             <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border-2 border-white dark:border-[#0f172a] flex items-center gap-1">
               <Crown size={12} fill="currentColor" /> Lvl {currentLevel}
             </div>
          </div>
          
          {/* Info Section */}
          <div className="text-center md:text-left flex-1 space-y-2 w-full md:w-auto">
             {isEditing ? (
               <div className="space-y-4 w-full max-w-lg mx-auto md:mx-0 bg-black/5 dark:bg-white/5 p-6 rounded-3xl">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40">Name</label>
                    <input 
                      className={`w-full text-lg font-black bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500 py-1`} 
                      value={profile.name} 
                      onChange={e => setProfile({...profile, name: e.target.value})} 
                      placeholder="Your Name"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40">Title</label>
                    <input 
                      className={`w-full text-sm opacity-80 bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500 py-1`} 
                      value={profile.title} 
                      onChange={e => setProfile({...profile, title: e.target.value})} 
                      placeholder="Your Title"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold opacity-40">Birthdate</label>
                       <input 
                         type="date"
                         className={`w-full text-xs font-bold bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500 py-1`} 
                         value={profile.birthdate || ''} 
                         onChange={e => setProfile({...profile, birthdate: e.target.value})} 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold opacity-40">Gender</label>
                       <select 
                         className={`w-full text-xs font-bold bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500 py-1.5`} 
                         value={profile.gender || 'Prefer not to say'} 
                         onChange={e => setProfile({...profile, gender: e.target.value})} 
                       >
                         <option>Prefer not to say</option>
                         <option>Male</option>
                         <option>Female</option>
                         <option>Non-binary</option>
                         <option>Other</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40">Mobile Interface</label>
                    <input 
                      type="tel"
                      className={`w-full text-xs font-bold bg-transparent border-b ${theme.cardBorder} outline-none focus:border-orange-500 py-1`} 
                      value={profile.mobile} 
                      onChange={e => setProfile({...profile, mobile: e.target.value})} 
                      placeholder="+1 (555) ..."
                    />
                 </div>
               </div>
             ) : (
               <>
                 <h1 className="text-4xl md:text-5xl font-black cinematic-text tracking-tight leading-none mb-1">{profile.name}</h1>
                 <p className="text-sm opacity-60 font-bold tracking-widest uppercase text-orange-500">{profile.title}</p>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                    <div className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-70">
                       {currentAge} Cycles
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-70">
                       {profile.gender || 'Unknown'}
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-70">
                       {profile.class} Rank
                    </div>
                 </div>
               </>
             )}
          </div>

          <div className="flex gap-3 self-center md:self-start mt-4 md:mt-0">
            <button 
              onClick={() => setShowSettings(true)}
              title="System Settings"
              className={`p-3 rounded-2xl border ${theme.sidebarBorder} hover:bg-black/5 transition-all text-current`}
            >
              <Settings size={20}/>
            </button>
            <button title="Share Profile" className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-8 mb-12">
        
        {/* Enhanced Streak Card */}
        <div className={`${theme.cardBg} border ${theme.sidebarBorder} rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:shadow-orange-500/10 transition-all duration-500`}>
           <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-50" />
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/20 blur-[60px] rounded-full group-hover:bg-orange-500/30 transition-colors" />
           
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-xl text-orange-500 w-fit">
                    <Flame size={18} className="fill-current animate-pulse" />
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block">Current Streak</span>
                </div>
             </div>
             
             <div className="mt-4">
               <div className="flex items-baseline gap-1">
                 <span className={`text-6xl md:text-7xl font-black tabular-nums tracking-tighter ${theme.text}`}>
                    {profile.streak}
                 </span>
                 <span className="text-xl font-bold text-orange-500 mb-2">Days</span>
               </div>
               <p className="text-xs opacity-50 font-medium mt-1">Keep the cognitive flow active.</p>
             </div>

             <div className="mt-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">
                   <span>Level {currentLevel}</span>
                   <span>{Math.round(progressToNext)}% to Next</span>
                </div>
                <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${progressToNext}%` }} 
                     transition={{ duration: 1, ease: "circOut" }}
                     className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                   />
                </div>
             </div>
           </div>
        </div>
        
        {/* Goals Block - Refined */}
        <div className={`md:col-span-2 ${theme.cardBg} border ${theme.sidebarBorder} rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden`}>
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Target size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black leading-none">Operational Targets</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Active Directives</span>
                 </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400">
                 Manage
              </button>
           </div>
           
           <div className="flex flex-wrap gap-3">
             {profile.goals && profile.goals.length > 0 ? (
               profile.goals.map((goal, i) => (
                 <motion.span 
                   key={i} 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="px-5 py-3 bg-indigo-500/5 text-indigo-500 rounded-2xl text-xs font-black border border-indigo-500/10 flex items-center gap-2 hover:bg-indigo-500/10 transition-colors cursor-default"
                 >
                   <Check size={14} /> {goal}
                 </motion.span>
               ))
             ) : (
               <div className="w-full py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                  <Target size={32} className="mb-2" />
                  <p className="text-xs font-bold italic">No targets defined in registry.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
