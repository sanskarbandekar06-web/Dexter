
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Maximize2, Minimize2, 
  CloudRain, Flame, Trees, Coffee, SkipForward, 
  Headphones, Radio, Wind, Sparkles, Play, Pause, Circle, RotateCcw,
  Zap, Activity, Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeColors } from '../types';
import SparkleCursor from '../components/SparkleCursor';
import { NOISE_SVG } from '../constants';

interface StudyRoomProps {
  isDarkMode: boolean;
  theme: ThemeColors;
  studySession: { isActive: boolean; duration: number };
  setStudySession: React.Dispatch<React.SetStateAction<{ isActive: boolean; duration: number }>>;
}

const STREAMS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Girl', label: 'Beats to Study/Relax To', tags: '50-80 BPM' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Boy', label: 'Active Flow / Retrowave', tags: '90-120 BPM' },
  { id: 'S4fJ5e_6X9U', title: 'Cozy Cabin', label: 'Snowfall & Fireplace', tags: 'Low Arousal' },
  { id: '1F8p92Z6dXY', title: 'Deep Focus', label: 'Binaural Theta Waves', tags: 'Cognitive' },
  { id: 'videoseries?list=PL6NdkXsPL07KN01gH2vucRgQA_WlZ_7aP', title: 'Zelda Ambience', label: 'Nintendo Soundscapes', tags: 'Nostalgia' }
];

const AMBIENT_SOUNDS = [
  { id: 'rain', icon: CloudRain, label: 'Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { id: 'fire', icon: Flame, label: 'Fire', url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3' },
  { id: 'forest', icon: Trees, label: 'Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
  { id: 'cafe', icon: Coffee, label: 'Cafe', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-44.mp3' },
  { id: 'wind', icon: Wind, label: 'Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-through-trees-1237.mp3' },
];

// --- NOISE GENERATOR (Web Audio API) ---
class ColoredNoise {
  ctx: AudioContext | null = null;
  node: AudioBufferSourceNode | null = null;
  gainNode: GainNode | null = null;

  constructor(private type: 'brown' | 'pink') {}

  start() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const bufferSize = 4096;
    const length = this.ctx.sampleRate * 5; // 5 seconds buffer
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (this.type === 'pink') {
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
      }
    } else { // brown
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
      }
    }

    this.node = this.ctx.createBufferSource();
    this.node.buffer = buffer;
    this.node.loop = true;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0;
    this.node.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    this.node.start();
  }

  setVolume(val: number) {
    if (this.gainNode) {
      // Smooth transition
      this.gainNode.gain.setTargetAtTime(val, this.ctx!.currentTime, 0.1);
    }
  }

  stop() {
    this.node?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

const StudyRoom: React.FC<StudyRoomProps> = ({ isDarkMode, theme, studySession, setStudySession }) => {
  const [currentStreamIdx, setCurrentStreamIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({ rain: 0, fire: 0, forest: 0, cafe: 0, wind: 0, brown: 0, pink: 0 });
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  
  // Noise Generators Refs
  const brownNoiseRef = useRef<ColoredNoise | null>(null);
  const pinkNoiseRef = useRef<ColoredNoise | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Audio Objects
  useEffect(() => {
    const audios: { [key: string]: HTMLAudioElement } = {};
    AMBIENT_SOUNDS.forEach(sound => {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = 0;
      audios[sound.id] = audio;
    });
    setAudioElements(audios);

    // Initialize Generators (Start muted)
    brownNoiseRef.current = new ColoredNoise('brown');
    pinkNoiseRef.current = new ColoredNoise('pink');
    
    // We start them on user interaction ideally, but here we init. 
    // They are started but volume 0.
    const startNoises = () => {
        brownNoiseRef.current?.start();
        pinkNoiseRef.current?.start();
        document.removeEventListener('click', startNoises);
    }
    document.addEventListener('click', startNoises);

    return () => {
      Object.values(audios).forEach(a => { a.pause(); a.src = ""; });
      brownNoiseRef.current?.stop();
      pinkNoiseRef.current?.stop();
      document.removeEventListener('click', startNoises);
    };
  }, []);

  // Auto-start only if it's a fresh session (0 duration and inactive)
  useEffect(() => {
    if (!studySession.isActive && studySession.duration === 0) {
       setStudySession(prev => ({ ...prev, isActive: true }));
    }
  }, []);

  const formatDuration = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Volume Changes
  const updateVolume = (id: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    
    if (id === 'brown') {
        brownNoiseRef.current?.setVolume(vol);
    } else if (id === 'pink') {
        pinkNoiseRef.current?.setVolume(vol);
    } else if (audioElements[id]) {
      const audio = audioElements[id];
      audio.volume = vol;
      if (vol > 0 && audio.paused) {
        audio.play().catch(e => console.log("Audio play failed:", e));
      } else if (vol === 0 && !audio.paused) {
        audio.pause();
      }
    }
  };

  const toggleSound = (id: string) => {
    const currentVol = volumes[id];
    updateVolume(id, currentVol > 0 ? 0 : 0.5);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const nextStream = () => {
    setCurrentStreamIdx((prev) => (prev + 1) % STREAMS.length);
  };

  return (
    <div ref={containerRef} className={`relative h-full flex flex-col overflow-hidden transition-all duration-1000 ${isFullscreen ? 'bg-black' : 'bg-gradient-to-br from-[#115533] via-[#0f172a] to-[#000000]'}`}>
      <SparkleCursor isDarkMode={true} />
      
      {/* --- ENCHANTED ATMOSPHERE --- */}
      {!isFullscreen && (
        <div className="absolute inset-0 pointer-events-none">
           {/* Texture Overlay */}
           <div className="absolute inset-0 opacity-10 mix-blend-overlay z-10" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />
           
           {/* Biophilic Gradients */}
           <motion.div 
             animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px] bg-[#1EB742] opacity-30" 
           />
           <motion.div 
             animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
             transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute -bottom-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px] bg-[#0C96E4] opacity-20" 
           />
        </div>
      )}

      {/* --- HEADER --- */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 px-6 md:px-12 pt-6 md:pt-8 flex justify-between items-end mb-4 shrink-0"
          >
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                 <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                   <Headphones size={20} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/60 drop-shadow-md">Psychoacoustics</span>
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-black cinematic-text text-white drop-shadow-2xl tracking-tight">
                Sanctuary
                <span className="text-emerald-500">.</span>
              </h1>
            </div>

            {/* Timer Controller */}
            <div className="hidden md:flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1.5 pl-5 pr-2 shadow-2xl">
              <div className="flex flex-col mr-2">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${studySession.isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none">
                       {studySession.isActive ? 'Deep Work' : 'Paused'}
                    </span>
                 </div>
                 <span className="text-sm font-mono font-bold text-white tabular-nums leading-none tracking-tight">
                    {formatDuration(studySession.duration)}
                 </span>
              </div>
              
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                 <button 
                    onClick={() => setStudySession(s => ({...s, isActive: !s.isActive}))}
                    className={`p-2 rounded-full transition-all active:scale-90 ${studySession.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                    title={studySession.isActive ? "Pause" : "Start"}
                 >
                    {studySession.isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                 </button>
                 
                 <button 
                    onClick={() => setStudySession({ isActive: false, duration: 0 })}
                    className="p-2 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                    title="Reset Session"
                 >
                    <RotateCcw size={14} />
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN STAGE --- */}
      <div className={`relative flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-700 ${isFullscreen ? 'p-0' : ''}`}>
        
        <motion.div 
          layout
          className={`relative w-full max-w-6xl overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-700 group
            ${isFullscreen ? 'w-full h-full rounded-none' : `aspect-video rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-sm`}
          `}
        >
           {/* Bio-Glass Border Effect (Non-Fullscreen) */}
           {!isFullscreen && (
             <>
               <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none z-20" />
               <div className="absolute inset-0 rounded-[2.5rem] border-2 border-emerald-500/10 pointer-events-none z-20" />
             </>
           )}

           {/* Video Player */}
           <div className="absolute inset-0 z-0 bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${STREAMS[currentStreamIdx].id}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&loop=1&playlist=${STREAMS[currentStreamIdx].id}`} 
                title="YouTube video player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                className={`w-full h-full object-cover opacity-90 transition-opacity duration-1000 ${isFullscreen ? 'opacity-100' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
           </div>

           {/* --- VIDEO CONTROLS OVERLAY --- */}
           <div className={`absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30`}>
              <div className="flex flex-col text-white">
                 <h2 className="text-2xl md:text-3xl font-bold drop-shadow-lg tracking-tight">{STREAMS[currentStreamIdx].title}</h2>
                 <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest drop-shadow-md">{STREAMS[currentStreamIdx].label}</p>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">{STREAMS[currentStreamIdx].tags}</span>
                 </div>
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setStudySession(s => ({...s, isActive: !s.isActive}))}
                   className="p-3 md:p-4 rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
                   title={studySession.isActive ? "Pause Session" : "Resume Session"}
                 >
                    {studySession.isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                 </button>
                 <button 
                   onClick={nextStream} 
                   className="p-3 md:p-4 rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
                   title="Next Stream"
                 >
                    <SkipForward size={20} fill="currentColor" />
                 </button>
                 <button 
                   onClick={toggleFullscreen} 
                   className="p-3 md:p-4 rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
                   title="Toggle Immersion"
                 >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                 </button>
              </div>
           </div>

           {/* --- NOISE MIXER (Research-Backed) --- */}
           <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 mb-6 md:mb-12 w-[90%] md:w-auto max-w-4xl z-30 transition-all duration-700 transform
               ${isFullscreen ? 'translate-y-32 opacity-0 group-hover:translate-y-0 group-hover:opacity-100' : ''}
           `}>
              <div className={`
                 flex flex-col md:flex-row items-center gap-6 p-1.5 md:pr-8 rounded-[2.5rem] 
                 bg-[#0f172a]/80 backdrop-blur-2xl border border-yellow-500/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]
                 relative overflow-visible
              `}>
                 {/* Left Cap */}
                 <div className="hidden md:flex flex-col items-center justify-center pl-6 pr-4 h-full border-r border-white/5">
                    <Radio size={20} className="text-emerald-400 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100/60">Color Noise</span>
                 </div>

                 <div className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2 md:py-0 overflow-x-auto no-scrollbar">
                    
                    {/* Colored Noises (Brown/Pink) */}
                    {[
                        { id: 'brown', label: 'Brown Noise', icon: Waves, color: 'text-amber-700', active: 'bg-amber-800' },
                        { id: 'pink', label: 'Pink Noise', icon: Waves, color: 'text-pink-400', active: 'bg-pink-600' }
                    ].map(noise => (
                        <div key={noise.id} className="relative flex flex-col items-center group/sound py-2">
                            {/* Volume Slider Pop-up */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-4 opacity-0 group-hover/sound:opacity-100 transition-all duration-300 pointer-events-none group-hover/sound:pointer-events-auto z-40">
                                <div className="p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center gap-3 w-12">
                                <div className="text-[10px] font-bold text-white tabular-nums">{Math.round(volumes[noise.id] * 100)}</div>
                                <div className="h-24 w-1.5 bg-white/20 rounded-full relative overflow-hidden">
                                    <div 
                                        className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-100 ${noise.active}`} 
                                        style={{ height: `${volumes[noise.id] * 100}%` }} 
                                    />
                                    <input 
                                        type="range" min="0" max="1" step="0.05" 
                                        value={volumes[noise.id]}
                                        onChange={(e) => updateVolume(noise.id, parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer vertical-slider"
                                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                    />
                                </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleSound(noise.id)}
                                className={`p-4 rounded-2xl transition-all duration-300 relative group-hover/sound:scale-110 ${volumes[noise.id] > 0 ? `${noise.active} text-white shadow-lg` : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                            >
                                <noise.icon size={20} strokeWidth={volumes[noise.id] > 0 ? 2.5 : 2} />
                            </button>
                            <span className="absolute -bottom-5 text-[9px] font-bold uppercase tracking-wider text-white/40 whitespace-nowrap">{noise.label}</span>
                        </div>
                    ))}

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    {/* Standard Ambience */}
                    {AMBIENT_SOUNDS.map(sound => (
                       <div key={sound.id} className="relative flex flex-col items-center group/sound py-2">
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-4 opacity-0 group-hover/sound:opacity-100 transition-all duration-300 pointer-events-none group-hover/sound:pointer-events-auto z-40">
                             <div className="p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center gap-3 w-12">
                                <div className="text-[10px] font-bold text-white tabular-nums">{Math.round(volumes[sound.id] * 100)}</div>
                                <div className="h-24 w-1.5 bg-white/20 rounded-full relative overflow-hidden">
                                   <div 
                                      className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-full transition-all duration-100" 
                                      style={{ height: `${volumes[sound.id] * 100}%` }} 
                                   />
                                   <input 
                                     type="range" min="0" max="1" step="0.05" 
                                     value={volumes[sound.id]}
                                     onChange={(e) => updateVolume(sound.id, parseFloat(e.target.value))}
                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer vertical-slider"
                                     style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                   />
                                </div>
                             </div>
                          </div>

                          <button 
                             onClick={() => toggleSound(sound.id)}
                             className={`p-4 rounded-2xl transition-all duration-300 relative group-hover/sound:scale-110 ${volumes[sound.id] > 0 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                          >
                             <sound.icon size={20} strokeWidth={volumes[sound.id] > 0 ? 2.5 : 2} />
                          </button>
                          <span className="absolute -bottom-5 text-[9px] font-bold uppercase tracking-wider text-white/20">{sound.label}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.div>
      </div>

      <style>{`input[type=range].vertical-slider { -webkit-appearance: slider-vertical; }`}</style>
    </div>
  );
};

export default StudyRoom;
