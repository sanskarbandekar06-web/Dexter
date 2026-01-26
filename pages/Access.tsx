
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Type, HeartHandshake, Upload, Play, Pause, 
  RefreshCw, Check, Mic, Volume2, Wind, Loader2, FileText,
  AlignJustify, Settings, ZoomIn, ZoomOut, MoveHorizontal, BookOpen,
  Layout, LayoutTemplate, Zap, Sparkles, XCircle, Download, FileWarning, ExternalLink
} from 'lucide-react';
import { ThemeColors } from '../types';
import { generateAudioExplanation, convertToDyslexiaFriendly, generateGroundingExercise } from '../lib/genai-access';

interface AccessPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
}

// --- AUDIO UTILITIES FOR GEMINI PCM ---
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --------------------------------------

const AccessPage: React.FC<AccessPageProps> = ({ isDarkMode, theme }) => {
  const [activeTab, setActiveTab] = useState<'vision' | 'lexicon' | 'serenity'>('vision');
  
  // -- VISION STATE --
  const [visionFile, setVisionFile] = useState<File | null>(null);
  const [visionResult, setVisionResult] = useState<{ text: string, audioData?: string } | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [ttsEngine, setTtsEngine] = useState<'browser' | 'gemini'>('browser');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // -- LEXICON (READER) STATE --
  const [lexiconFile, setLexiconFile] = useState<File | null>(null);
  const [lexiconFileUrl, setLexiconFileUrl] = useState<string | null>(null);
  const [lexiconFileType, setLexiconFileType] = useState<'image'|'pdf'|'text'|'other'>('other');
  const [lexiconTextContent, setLexiconTextContent] = useState<string>("");
  const [lexiconHtml, setLexiconHtml] = useState("");
  const [isLexiconLoading, setIsLexiconLoading] = useState(false);
  
  // Reader Settings
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 18,
    lineHeight: 2.0,
    letterSpacing: 0.05,
    fontFamily: 'Verdana, sans-serif',
    wordSpacing: 0.1,
    splitView: true
  });

  // -- SERENITY STATE --
  const [anxietyContext, setAnxietyContext] = useState("");
  const [groundingSteps, setGroundingSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSerenityLoading, setIsSerenityLoading] = useState(false);

  // --- AUDIO CONTROL HANDLERS ---
  const stopAudio = () => {
    // 1. Stop Gemini Audio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { /* ignore */ }
      audioSourceRef.current = null;
    }

    // 2. Stop Browser Audio
    window.speechSynthesis.cancel();
    
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!visionResult) return;

    // SCENARIO A: BROWSER TTS
    if (ttsEngine === 'browser') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(visionResult.text);
      utterance.onend = () => setIsPlaying(false);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      return;
    }

    // SCENARIO B: GEMINI FENRIR (Audio Data)
    if (ttsEngine === 'gemini' && visionResult.audioData) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const rawBytes = decodeBase64(visionResult.audioData);
        const buffer = await decodeAudioData(rawBytes, audioContextRef.current);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        
        audioSourceRef.current = source;
        source.start(0);
        setIsPlaying(true);
      } catch (e) {
        console.error("Audio playback failed", e);
        setIsPlaying(false);
      }
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // --- VISION HANDLERS ---
  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVisionFile(file);
      setIsVisionLoading(true);
      stopAudio(); // Stop any existing audio
      
      const result = await generateAudioExplanation(file, ttsEngine);
      setVisionResult(result);
      setIsVisionLoading(false);
    }
  };

  // --- LEXICON HANDLERS ---
  const handleLexiconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (lexiconFileUrl) URL.revokeObjectURL(lexiconFileUrl);
      
      setLexiconFile(file);
      const url = URL.createObjectURL(file);
      setLexiconFileUrl(url);

      // Determine Preview Type
      if (file.type.startsWith('image/')) {
        setLexiconFileType('image');
      } else if (file.type === 'application/pdf') {
        setLexiconFileType('pdf');
      } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        setLexiconFileType('text');
        const text = await file.text();
        setLexiconTextContent(text);
      } else {
        setLexiconFileType('other');
      }

      setIsLexiconLoading(true);
      const html = await convertToDyslexiaFriendly(file);
      setLexiconHtml(html);
      setIsLexiconLoading(false);
    }
  };

  const resetLexicon = () => {
    if (lexiconFileUrl) URL.revokeObjectURL(lexiconFileUrl);
    setLexiconFile(null);
    setLexiconFileUrl(null);
    setLexiconHtml("");
    setLexiconFileType('other');
    setLexiconTextContent("");
  };

  const downloadLexicon = () => {
    if (!lexiconHtml) return;
    const blob = new Blob([
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>NeuroAid Reflow</title><style>body { font-family: ${readerSettings.fontFamily}; line-height: ${readerSettings.lineHeight}; padding: 40px; max-width: 800px; margin: 0 auto; }</style></head><body>${lexiconHtml}</body></html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflow-${lexiconFile?.name || 'doc'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (lexiconFileUrl) URL.revokeObjectURL(lexiconFileUrl);
    };
  }, []);

  const startGrounding = async () => {
    setIsSerenityLoading(true);
    const steps = await generateGroundingExercise(anxietyContext || "general anxiety");
    setGroundingSteps(steps);
    setCurrentStep(0);
    setIsSerenityLoading(false);
  };

  const renderLexiconPreview = () => {
    if (lexiconFileType === 'image') {
      return <img src={lexiconFileUrl!} className="w-full h-full object-contain" alt="Original" />;
    }
    if (lexiconFileType === 'pdf') {
      return (
        <object data={lexiconFileUrl!} type="application/pdf" className="w-full h-full rounded-2xl">
            <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-60">
                <FileWarning size={40} className="mb-4 text-orange-500" />
                <p className="font-bold text-sm mb-2">Preview Blocked by Browser</p>
                <p className="text-xs mb-4 max-w-[220px]">Brave/Chrome Shield may block embedded PDF files. Click below to view.</p>
                <a 
                  href={lexiconFileUrl!} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <ExternalLink size={14} /> Open PDF
                </a>
            </div>
        </object>
      );
    }
    if (lexiconFileType === 'text') {
      return (
        <div className="w-full h-full p-6 overflow-y-auto bg-white text-slate-800 font-mono text-sm whitespace-pre-wrap">
          {lexiconTextContent}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
        <FileWarning size={48} className="mb-2" />
        <p className="font-bold">Preview not supported</p>
        <p className="text-xs">Original file format cannot be displayed directly.</p>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 animate-fadeInUp pb-32">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className={`text-4xl font-black cinematic-text ${theme.text}`}>Neuro-Aid</h1>
          <p className={`text-sm font-medium opacity-60 ${theme.text}`}>Adaptive Technology for Diverse Minds</p>
        </div>
        
        <div className={`mt-4 md:mt-0 flex p-1 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
          <button onClick={() => setActiveTab('vision')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'vision' ? 'bg-violet-500 text-white shadow-lg' : 'opacity-50 hover:opacity-100'}`}>
            <Eye size={16} /> Auditory
          </button>
          <button onClick={() => setActiveTab('lexicon')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'lexicon' ? 'bg-emerald-500 text-white shadow-lg' : 'opacity-50 hover:opacity-100'}`}>
            <Type size={16} /> Reader
          </button>
          <button onClick={() => setActiveTab('serenity')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'serenity' ? 'bg-rose-500 text-white shadow-lg' : 'opacity-50 hover:opacity-100'}`}>
            <HeartHandshake size={16} /> Serenity
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'vision' && (
          <motion.div 
            key="vision"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className={`p-8 rounded-[2.5rem] border ${theme.cardBorder} ${theme.cardBg} shadow-xl relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-violet-500" />
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500"><Eye size={24}/></div>
                  Document-to-Audio
                </h2>
                
                {/* TTS ENGINE SELECTOR */}
                <div className={`flex flex-col gap-1 p-1 rounded-xl border ${theme.cardBorder} bg-black/5 dark:bg-white/5`}>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2 py-1 text-center">Voice Engine</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setTtsEngine('browser')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${ttsEngine === 'browser' ? 'bg-violet-500 text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <Zap size={12} fill="currentColor" /> Browser (Fast)
                    </button>
                    <button 
                      onClick={() => setTtsEngine('gemini')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${ttsEngine === 'gemini' ? 'bg-indigo-500 text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <Sparkles size={12} fill="currentColor" /> Fenrir (HD)
                    </button>
                  </div>
                </div>
              </div>

              <p className="opacity-60 mb-8 leading-relaxed">
                Upload your course materials (PDF, Text, Markdown, Images). Our AI will scan the entire document and read it aloud to you.
              </p>
              
              <label className={`block w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all ${isVisionLoading ? 'border-violet-500 bg-violet-500/5' : 'border-gray-300 dark:border-gray-700'}`}>
                <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.md" onChange={handleVisionUpload} className="hidden" />
                {isVisionLoading ? (
                  <div className="flex flex-col items-center animate-pulse text-violet-500">
                     <Loader2 size={40} className="animate-spin mb-4" />
                     <span className="font-bold">Analyzing Document...</span>
                  </div>
                ) : (
                  <>
                     {visionFile ? (
                       <div className="flex flex-col items-center">
                         <FileText size={48} className="mb-4 text-violet-500" />
                         <span className="font-bold text-center px-4">{visionFile.name}</span>
                         <span className="text-xs opacity-50 mt-2">Click to replace</span>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                         <Upload size={40} className="mb-4 opacity-30" />
                         <span className="font-bold opacity-60">Upload File (PDF, TXT, MD, IMG)</span>
                       </div>
                     )}
                  </>
                )}
              </label>
            </div>

            <div className={`p-8 rounded-[2.5rem] border ${theme.cardBorder} ${theme.cardBg} shadow-xl relative overflow-hidden flex flex-col justify-center items-center text-center`}>
               {!visionResult ? (
                 <div className="opacity-30 flex flex-col items-center">
                   <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-white/5 mb-4 animate-pulse" />
                   <p className="font-bold">Waiting for input...</p>
                 </div>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center space-y-8 animate-fadeInUp">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-violet-500/30 blur-3xl rounded-full ${isPlaying ? 'animate-pulse' : ''}`} />
                      <button 
                        onClick={toggleAudio}
                        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
                      >
                         {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2"/>}
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-w-md w-full">
                      <h3 className="text-xl font-bold">
                        {ttsEngine === 'browser' ? "Reading (Browser TTS)" : "Audio Generated (Fenrir)"}
                      </h3>
                      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left text-sm max-h-48 overflow-y-auto custom-scrollbar">
                        {visionResult.text}
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'lexicon' && (
          <motion.div 
            key="lexicon"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
             {!lexiconFile ? (
               <div className={`p-12 rounded-[2.5rem] border ${theme.cardBorder} ${theme.cardBg} shadow-xl flex flex-col items-center text-center max-w-2xl mx-auto mt-10`}>
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h2 className="text-3xl font-black mb-4">Cognitive Reader</h2>
                  <p className="opacity-60 mb-8 max-w-md">
                    Upload any document. We will preserve the images but reflow the text into a completely customizable, dyslexia-friendly format.
                  </p>
                  <label className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform cursor-pointer flex items-center gap-3">
                     <Upload size={20} /> Select Document
                     <input type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleLexiconUpload} className="hidden" />
                  </label>
               </div>
             ) : (
               <div className="flex flex-col h-[calc(100vh-140px)]">
                 <div className={`p-4 mb-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} shadow-lg flex flex-wrap items-center gap-6 z-20`}>
                    <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-6 mr-2">
                       <button onClick={resetLexicon} className="p-2 hover:bg-black/5 rounded-lg text-rose-500" title="Close / Reset">
                         <XCircle size={20} />
                       </button>
                       <span className="font-bold text-sm truncate max-w-[150px]">{lexiconFile.name}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                         <Type size={16} className="opacity-50" />
                         <select 
                           value={readerSettings.fontFamily}
                           onChange={(e) => setReaderSettings({...readerSettings, fontFamily: e.target.value})}
                           className={`bg-transparent text-sm font-bold outline-none ${theme.text}`}
                         >
                           <option value="Verdana, sans-serif">Verdana (Clean)</option>
                           <option value="'Comic Sans MS', 'Chalkboard SE', sans-serif">Comic Sans (Dyslexia)</option>
                           <option value="Arial, sans-serif">Arial (Standard)</option>
                           <option value="'Courier New', monospace">Monospace (Code)</option>
                         </select>
                      </div>

                      <div className="flex items-center gap-2">
                         <button onClick={() => setReaderSettings(s => ({...s, fontSize: Math.max(12, s.fontSize - 2)}))} className="p-1 hover:bg-black/5 rounded"><ZoomOut size={16}/></button>
                         <span className="text-xs font-bold w-8 text-center">{readerSettings.fontSize}px</span>
                         <button onClick={() => setReaderSettings(s => ({...s, fontSize: Math.min(32, s.fontSize + 2)}))} className="p-1 hover:bg-black/5 rounded"><ZoomIn size={16}/></button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={downloadLexicon}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                        title="Save Reflowed Data"
                      >
                        <Download size={14} /> Save
                      </button>

                      <button 
                        onClick={() => setReaderSettings(s => ({...s, splitView: !s.splitView}))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${readerSettings.splitView ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 opacity-60'}`}
                      >
                        <Layout size={14} /> Split View
                      </button>
                    </div>
                 </div>

                 <div className="flex-1 flex gap-6 overflow-hidden">
                    {readerSettings.splitView && (
                      <div className={`flex-1 rounded-3xl border ${theme.cardBorder} bg-white overflow-hidden shadow-inner relative`}>
                         {renderLexiconPreview()}
                         <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur pointer-events-none">
                           Original
                         </div>
                      </div>
                    )}

                    <div className={`flex-1 rounded-3xl border ${theme.cardBorder} ${isDarkMode ? 'bg-[#1e2025]' : 'bg-white'} shadow-inner overflow-hidden flex flex-col relative`}>
                       <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full pointer-events-none z-10">
                           Cognitive Reflow
                       </div>
                       
                       {isLexiconLoading ? (
                         <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                           <Loader2 size={40} className="animate-spin text-emerald-500" />
                           <p className="font-bold">Analyzing structural patterns...</p>
                         </div>
                       ) : (
                         <div 
                           className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12"
                           style={{
                             fontFamily: readerSettings.fontFamily,
                             fontSize: `${readerSettings.fontSize}px`,
                             lineHeight: readerSettings.lineHeight,
                             letterSpacing: `${readerSettings.letterSpacing}em`,
                             wordSpacing: `${readerSettings.wordSpacing}em`,
                             color: isDarkMode ? '#e2e8f0' : '#0f172a' // Very dark blue/black for max contrast in light mode
                           }}
                         >
                           <div 
                             dangerouslySetInnerHTML={{ __html: lexiconHtml }} 
                             className="prose prose-lg dark:prose-invert max-w-none [&>h1]:font-black [&>h1]:mb-6 [&>h2]:font-bold [&>h2]:mt-8 [&>ul]:list-disc [&>ul]:pl-6 [&>li]:mb-2 [&>strong]:text-emerald-600 [&>strong]:dark:text-emerald-400"
                           />
                         </div>
                       )}
                    </div>
                 </div>
               </div>
             )}
          </motion.div>
        )}

        {activeTab === 'serenity' && (
          <motion.div 
            key="serenity"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex flex-col items-center justify-center max-w-3xl mx-auto"
          >
             <div className={`w-full p-8 rounded-[2.5rem] border ${theme.cardBorder} ${theme.cardBg} shadow-2xl text-center mb-8`}>
                <Wind size={48} className="text-rose-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-4">Cognitive Grounding</h2>
                <p className="opacity-60 mb-8">
                  Overwhelmed? Tell us what's happening (e.g., "Exam panic", "Too much noise"). We will generate a structured grounding exercise.
                </p>
                
                <div className="flex gap-4">
                  <input 
                    value={anxietyContext} 
                    onChange={e => setAnxietyContext(e.target.value)}
                    placeholder="I am feeling..." 
                    className={`flex-1 p-4 rounded-xl ${theme.inputBg} border ${theme.inputBorder} outline-none focus:ring-2 ring-rose-500/30`} 
                  />
                  <button onClick={startGrounding} disabled={isSerenityLoading} className="px-8 rounded-xl bg-rose-500 text-white font-bold shadow-lg hover:bg-rose-600 transition-all flex items-center">
                    {isSerenityLoading ? <Loader2 className="animate-spin" /> : "Aid Me"}
                  </button>
                </div>
             </div>

             {groundingSteps.length > 0 && (
               <div className="w-full space-y-4">
                 {groundingSteps.map((step, i) => (
                   <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className={`p-6 rounded-2xl border-l-4 ${i <= currentStep ? 'border-rose-500 bg-rose-500/5' : 'border-gray-200 dark:border-gray-800 opacity-40'} flex items-center justify-between transition-all`}
                   >
                     <div className="text-lg font-medium">{step}</div>
                     {i <= currentStep && (
                       <button onClick={() => setCurrentStep(Math.min(groundingSteps.length - 1, currentStep + 1))} className={`p-2 rounded-full ${i === currentStep ? 'bg-rose-500 text-white animate-pulse' : 'text-rose-500'}`}>
                         <Check size={20} />
                       </button>
                     )}
                   </motion.div>
                 ))}
                 
                 {currentStep === groundingSteps.length - 1 && (
                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center p-8 text-emerald-500 font-bold text-xl">
                     You have centered yourself. Well done.
                   </motion.div>
                 )}
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessPage;
