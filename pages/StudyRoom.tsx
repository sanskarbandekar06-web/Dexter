
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Maximize2, Minimize2, 
  CloudRain, Flame, Trees, Coffee, SkipForward, 
  Headphones, Radio, Wind, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeColors } from '../types';
import SparkleCursor from '../components/SparkleCursor';
import { NOISE_SVG } from '../constants';

interface StudyRoomProps {
  isDarkMode: boolean;
  theme: ThemeColors;
}

const STREAMS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Girl', label: 'Beats to Study/Relax To' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Boy', label: 'Chillwave / Retrowave' },
  { id: 'S4fJ5e_6X9U', title: 'Cozy Cabin', label: 'Snowfall & Fireplace' },
  { id: '1F8p92Z6dXY', title: 'Deep Focus', label: 'Binaural Theta Waves' },
  { id: 'videoseries?list=PL6NdkXsPL07KN01gH2vucRgQA_WlZ_7aP', title: 'Zelda Ambience', label: 'Nintendo Soundscapes' }
];

const AMBIENT_SOUNDS = [
  { id: 'rain', icon: CloudRain, label: 'Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { id: 'fire', icon: Flame, label: 'Fire', url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3' },
  { id: 'forest', icon: Trees, label: 'Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
  { id: 'cafe', icon: Coffee, label: 'Cafe', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-44.mp3' },
  { id: 'wind', icon: Wind, label: 'Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-through-trees-1237.mp3' },
];

const FloatingParticles = () => {
  const particles = useMemo(() => Array.from({ length: 20 }), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            opacity: 0,
            scale: 0
          }}
          animate={{ 
            y: [null, Math.random() * -100 + "%"],
            opacity: [0, 0.6, 0],
            scale: [0, Math.random() * 2 + 0.5, 0]
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10
          }}
          className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[1px] shadow-[0_0_5px_rgba(253,224,71,0.6)]"
        />
      ))}
    </div>
  );
};

const StudyRoom: React.FC<StudyRoomProps> = ({ isDarkMode, theme }) => {
  const [currentStreamIdx, setCurrentStreamIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({ rain: 0, fire: 0, forest: 0, cafe: 0, wind: 0 });
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  
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

    return () => {
      // Cleanup
      Object.values(audios).forEach(a => {
        a.pause();
        a.src = "";
      });
    };
  }, []);

  // Handle Volume Changes
  const updateVolume = (id: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    if (audioElements[id]) {
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

  // Listen for fullscreen changes (ESC key)
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
    <div ref={containerRef} className={`relative h-full flex flex-col ${isFullscreen ? 'overflow-hidden' : 'overflow-y-auto md:overflow-hidden'} transition-all duration-1000 ${isFullscreen ? 'bg-black' : 'animate-gradient bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]'}`}>
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 400% 400%;
          animation: gradient-shift 120s ease infinite;
        }
        input[type=range].vertical-slider {
           -webkit-appearance: slider-vertical;
        }
      `}</style>
      <SparkleCursor isDarkMode={true} />
      
      {/* --- ENCHANTED ATMOSPHERE --- */}
      {!isFullscreen && (
        <div className="absolute inset-0 pointer-events-none">
           {/* Texture Overlay */}
           <div className="absolute inset-0 opacity-10 mix-blend-overlay z-10" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />
           
           {/* Aurora Gradients */}
           <motion.div 
             animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px] bg-[#059669] opacity-30" 
           />
           <motion.div 
             animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
             transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute -bottom-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px] bg-[#d97706] opacity-20" 
           />
           
           <FloatingParticles />
        </div>
      )}

      {/* --- HEADER --- */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 px-4 md:px-12 pt-4 md:pt-8 flex justify-between items-end mb-4 shrink-0"
          >
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 md:gap-3 mb-2"
              >
                 <div className="p-1.5 md:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                   <Headphones size={16} className="md:w-5 md:h-5" />
                 </div>
                 <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/60 drop-shadow-md">Sector 7 Sanctuary</span>
              </motion.div>
              <h1 className="text-2xl md:text-5xl font-black cinematic-text text-white drop-shadow-2xl tracking-tight">
                Study Room
                <span className="text-emerald-500">.</span>
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-black/20 backdrop-blur-xl shadow-lg">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse relative z-10" />
                  <div className="absolute inset-0 bg-red-500 blur-sm animate-pulse" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Live Connection</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN STAGE --- */}
      <div className={`relative flex-1 flex flex-col items-center md:justify-center p-4 md:p-8 transition-all duration-700 ${isFullscreen ? 'p-0 justify-center' : 'justify-start md:justify-center pt-6 md:pt-0'}`}>
        
        <motion.div 
          layout
          className={`relative w-full max-w-6xl overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-700 group shrink-0
            ${isFullscreen ? 'w-full h-full rounded-none' : `aspect-video rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-sm`}
          `}
        >
           {/* Bio-Glass Border Effect (Non-Fullscreen) */}
           {!isFullscreen && (
             <>
               <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 pointer-events-none z-20" />
               <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-emerald-500/10 pointer-events-none z-20" />
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
                 <h2 className="text-xl md:text-3xl font-bold drop-shadow-lg tracking-tight">{STREAMS[currentStreamIdx].title}</h2>
                 <p className="text-[10px] md:text-xs text-emerald-300 font-bold uppercase tracking-widest drop-shadow-md mt-1">{STREAMS[currentStreamIdx].label}</p>
              </div>
              
              <div className="flex gap-2 md:gap-3">
                 <button 
                   onClick={nextStream} 
                   className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
                   title="Next Stream"
                 >
                    <SkipForward size={18} className="md:w-5 md:h-5" fill="currentColor" />
                 </button>
                 <button 
                   onClick={toggleFullscreen} 
                   className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
                   title="Toggle Immersion"
                 >
                    {isFullscreen ? <Minimize2 size={18} className="md:w-5 md:h-5" /> : <Maximize2 size={18} className="md:w-5 md:h-5" />}
                 </button>
              </div>
           </div>
        </motion.div>

        {/* --- AMBIENT MIXER --- */}
        {/* RELATIVE on Mobile (below video), ABSOLUTE on Desktop (floating) */}
        <div className={`
             w-[95%] md:w-auto max-w-3xl z-30 transition-all duration-700 transform mx-auto
             mt-6 mb-24 md:mb-0 md:mt-0 
             md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:pb-12
             ${isFullscreen ? 'translate-y-32 opacity-0 group-hover:translate-y-0 group-hover:opacity-100' : ''}
        `}>
           <div className={`
              flex items-center gap-4 md:gap-6 p-2 md:pr-8 rounded-[2rem] md:rounded-[2.5rem]
              bg-[#0f172a]/80 backdrop-blur-2xl border border-yellow-500/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]
              relative overflow-visible
           `}>
              {/* Decor: Left Cap */}
              <div className="hidden md:flex flex-col items-center justify-center pl-6 pr-4 h-full border-r border-white/5">
                 <Radio size={20} className="text-emerald-400 mb-1" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100/60">Mixer</span>
              </div>

              {/* Icons Container */}
              <div className="w-full md:w-auto flex items-center justify-around md:justify-start gap-2 md:gap-1 px-4 py-2 md:py-0 overflow-x-auto no-scrollbar">
                 {AMBIENT_SOUNDS.map(sound => (
                    <div key={sound.id} className="relative flex flex-col items-center group/sound py-2 shrink-0">
                       
                       {/* Slider Popup Container with Bridge */}
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-4 opacity-0 group-hover/sound:opacity-100 transition-all duration-300 pointer-events-none group-hover/sound:pointer-events-auto z-40">
                          <div className="p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center gap-3 w-12">
                             <div className="text-[10px] font-bold text-white tabular-nums">{Math.round(volumes[sound.id] * 100)}</div>
                             <div className="h-24 w-1.5 bg-white/20 rounded-full relative overflow-hidden">
                                <div 
                                   className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-full transition-all duration-100" 
                                   style={{ height: `${volumes[sound.id] * 100}%` }} 
                                />
                                <input 
                                  type="range" 
                                  min="0" max="1" step="0.05" 
                                  value={volumes[sound.id]}
                                  onChange={(e) => updateVolume(sound.id, parseFloat(e.target.value))}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer vertical-slider"
                                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                />
                             </div>
                             <div className="w-1 h-1 rounded-full bg-white/50" />
                          </div>
                       </div>

                       <button 
                          onClick={() => toggleSound(sound.id)}
                          className={`
                            p-3 md:p-4 rounded-2xl transition-all duration-300 relative group-hover/sound:scale-110
                            ${volumes[sound.id] > 0 
                              ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
                          `}
                       >
                          <sound.icon size={18} className="md:w-5 md:h-5" strokeWidth={volumes[sound.id] > 0 ? 2.5 : 2} />
                          {volumes[sound.id] > 0 && (
                            <div className="absolute inset-0 rounded-2xl border border-white/30 animate-pulse" />
                          )}
                       </button>
                       
                       {/* Label below button */}
                       <span className={`absolute -bottom-5 text-[9px] font-bold uppercase tracking-wider transition-colors ${volumes[sound.id] > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                         {sound.label}
                       </span>
                    </div>
                 ))}
              </div>

              {/* Decor: Right Cap */}
              <div className="hidden md:flex flex-col items-end border-l border-white/5 pl-6">
                 <div className="flex items-center gap-1.5 mb-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                 </div>
                 <span className="text-[9px] text-white/30 font-mono">24bit / 48kHz</span>
              </div>
           </div>
        </div>

      </div>

      <style>{`
        input[type=range].vertical-slider {
           -webkit-appearance: slider-vertical;
        }
      `}</style>
    </div>
  );
};

export default StudyRoom;
