import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Icons (Using <g> instead of Fragments for safety) ---
const Icon = ({ name, size = 24, className }: any) => {
  const paths: any = {
    brain: (
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    ),
    trophy: (
      <g>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </g>
    ),
    refresh: (
      <g>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </g>
    ),
    zap: (
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    ),
    grid: (
      <g>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </g>
    ),
    keyboard: (
      <g>
        <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
        <path d="M6 8h.001" />
        <path d="M10 8h.001" />
        <path d="M14 8h.001" />
        <path d="M18 8h.001" />
        <path d="M6 12h.001" />
        <path d="M10 12h.001" />
        <path d="M14 12h.001" />
        <path d="M18 12h.001" />
      </g>
    ),
    cloud: (
      <g>
        <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
        <path d="M13 12l-3 5h4l-3 5" />
      </g>
    ),
    arrowLeft: (
      <g>
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </g>
    ),
    waves: (
      <g>
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 1.3 0 1.9.5 2.5 1" />
      </g>
    ),
    layers: (
      <g>
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      </g>
    ),
    sun: (
      <g>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </g>
    ),
    arrowRight: (
      <g>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </g>
    ),
    hand: (
      <g>
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </g>
    )
  };

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {paths[name] || null}
    </svg>
  );
};

// --- Constants & Config ---

const RANKS = [
  { name: "Neural Initiate", threshold: 0, color: "text-slate-400" },
  { name: "Focus Seeker", threshold: 500, color: "text-emerald-400" },
  { name: "Mind Architect", threshold: 1500, color: "text-blue-400" },
  { name: "Flow Walker", threshold: 3000, color: "text-indigo-400" },
  { name: "Cognitive Apex", threshold: 5000, color: "text-purple-400" },
  { name: "Transcendent", threshold: 10000, color: "text-amber-400" },
];

const GAMES = [
  { id: 'memory', name: 'Memory Match', icon: 'brain', description: 'Pattern Recognition', xp: 150 },
  { id: 'schulte', name: 'Schulte Grid', icon: 'grid', description: 'Peripheral Vision', xp: 200 },
  { id: 'typer', name: 'Zen Typer', icon: 'keyboard', description: 'Flow State Trigger', xp: 175 },
  { id: 'popper', name: 'Thought Popper', icon: 'cloud', description: 'Anxiety Reduction', xp: 150 },
  { id: 'flow', name: 'Neuro-Flow', icon: 'waves', description: 'Digital Fidget Spinner', xp: 100 },
  { id: 'entropy', name: 'Entropy Puzzle', icon: 'layers', description: 'Reverse Tetris', xp: 125 },
  { id: 'shadow', name: 'Perspective Shift', icon: 'sun', description: 'Find Clarity in Chaos', xp: 250 },
  { id: 'particle', name: 'Particle Reality', icon: 'hand', description: 'Gesture Controlled 3D', xp: 300 },
];

// --- Utility Components ---

const RankBadge = ({ xp }: any) => {
  const currentRank = RANKS.slice().reverse().find(r => xp >= r.threshold) || RANKS[0];
  const nextRank = RANKS.find(r => r.threshold > xp);
  const progress = nextRank 
    ? ((xp - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100 
    : 100;

  return (
    <div className="flex flex-col items-end">
      <span className={`text-xs font-bold uppercase tracking-wider ${currentRank.color}`}>
        {currentRank.name}
      </span>
      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${currentRank.color.replace('text-', 'bg-')}`} 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

// --- Helper for Dynamic Script Loading ---
const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// --- Game 1: Memory Match ---
const MemoryGame = ({ onWin }: any) => {
  const EMOJIS = ['🧠', '⚡', '🔋', '🌱', '🛡️', '💎'];
  const [cards, setCards] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const deck = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, solved: false }));
    setCards(deck);
  }, []);

  useEffect(() => {
    if (selected.length === 2) {
      setIsProcessing(true);
      const [first, second] = selected;
      if (cards[first].emoji === cards[second].emoji) {
        setCards(prev => prev.map(c => (c.id === first || c.id === second) ? { ...c, solved: true } : c));
        setSelected([]);
        setIsProcessing(false);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === first || c.id === second) ? { ...c, flipped: false } : c));
          setSelected([]);
          setIsProcessing(false);
        }, 800);
      }
    }
  }, [selected, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.solved)) onWin();
  }, [cards, onWin]);

  const flip = (index: number) => {
    if (isProcessing || cards[index].flipped || cards[index].solved) return;
    setCards(prev => prev.map(c => c.id === index ? { ...c, flipped: true } : c));
    setSelected(prev => [...prev, index]);
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {cards.map((card, i) => (
        <button
          key={i}
          onClick={() => flip(i)}
          className={`h-16 w-16 sm:h-20 sm:w-20 text-3xl flex items-center justify-center rounded-xl transition-all duration-500 transform border border-white/10 ${
            card.flipped || card.solved ? 'bg-indigo-600 rotate-[360deg]' : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          {(card.flipped || card.solved) ? card.emoji : <Icon name="zap" size={20} className="opacity-20" />}
        </button>
      ))}
    </div>
  );
};

// --- Game 2: Schulte Grid ---
const SchulteGrid = ({ onWin }: any) => {
  const [grid, setGrid] = useState<number[]>([]);
  const [nextNum, setNextNum] = useState(1);

  useEffect(() => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setGrid(numbers);
  }, []);

  const handleClick = (num: number) => {
    if (num === nextNum) {
      if (num === 25) onWin();
      setNextNum(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-slate-400 text-sm">Find number: <span className="text-white font-bold text-xl ml-2">{nextNum}</span></div>
      <div className="grid grid-cols-5 gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
        {grid.map((num, i) => (
          <button
            key={i}
            onClick={() => handleClick(num)}
            className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg text-lg font-bold transition-all ${
              num < nextNum ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Game 3: Zen Typer ---
const ZenTyper = ({ onWin }: any) => {
  const WORDS = ["FOCUS", "BREATHE", "CLARITY", "FLOW", "CALM", "SYNC", "PRESENT"];
  const [wordIndex, setWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [fading, setFading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: any) => {
    const val = e.target.value.toUpperCase();
    if (!/^[A-Z]*$/.test(val)) return;
    
    setInput(val);

    if (val === WORDS[wordIndex]) {
      setFading(true);
      setTimeout(() => {
        if (wordIndex === WORDS.length - 1) {
          onWin();
        } else {
          setWordIndex(prev => prev + 1);
          setInput("");
          setFading(false);
        }
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full max-w-md">
      <div className={`text-4xl sm:text-6xl font-black tracking-widest transition-all duration-300 ${
        fading ? 'opacity-0 scale-110 blur-sm' : 'opacity-100 scale-100'
      } ${input === WORDS[wordIndex] ? 'text-emerald-400' : 'text-white/20'}`}>
        {WORDS[wordIndex]}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        className="mt-8 bg-transparent border-b-2 border-indigo-500/50 text-center text-2xl text-white focus:outline-none focus:border-indigo-400 transition-colors uppercase tracking-widest w-full"
        autoFocus
        placeholder="TYPE..."
      />
      <p className="mt-4 text-xs text-slate-500">Type the word to synchronize</p>
    </div>
  );
};

// --- Game 4: Thought Popper ---
const ThoughtPopper = ({ onWin }: any) => {
  const NEGATIVES = ["DOUBT", "FEAR", "LATE", "FAIL", "NOPE", "TIRED"];
  const POSITIVES = ["HOPE", "GRIT", "CALM", "WIN", "GROW", "YES"];
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const TARGET = 8;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const spawnBubble = () => {
      const id = Date.now();
      const isNegative = Math.random() > 0.4;
      const text = isNegative 
        ? NEGATIVES[Math.floor(Math.random() * NEGATIVES.length)]
        : POSITIVES[Math.floor(Math.random() * POSITIVES.length)];
      
      const newBubble = {
        id,
        text,
        type: isNegative ? 'negative' : 'positive',
        left: Math.random() * 80 + 10,
        speed: Math.random() * 2 + 1,
      };

      setBubbles(prev => [...prev, newBubble]);

      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, 4000);
    };

    timerRef.current = setInterval(spawnBubble, 800);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (poppedCount >= TARGET) {
      clearInterval(timerRef.current);
      onWin();
    }
  }, [poppedCount, onWin]);

  const popBubble = (id: number, type: string) => {
    if (type === 'negative') {
      setPoppedCount(prev => prev + 1);
      setBubbles(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="relative w-full h-[400px] bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10">
      <div className="absolute top-4 left-4 z-10 bg-black/40 px-3 py-1 rounded-full text-xs font-mono text-indigo-300 border border-indigo-500/30">
        Negativity Cleared: {poppedCount}/{TARGET}
      </div>
      
      {bubbles.map(b => (
        <button
          key={b.id}
          onClick={() => popBubble(b.id, b.type)}
          className={`absolute transform -translate-x-1/2 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-transform active:scale-95 animate-float shadow-lg cursor-pointer
            ${b.type === 'negative' 
              ? 'bg-slate-800 text-slate-300 border border-slate-600 w-16 h-16 hover:bg-red-900/50 hover:border-red-500 hover:text-red-200' 
              : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 w-14 h-14 opacity-60 pointer-events-none'}`}
          style={{
            left: `${b.left}%`,
            animationDuration: `${b.speed}s`,
            bottom: '-20%'
          }}
        >
          {b.text}
        </button>
      ))}
      <style>{`
        @keyframes float {
          0% { bottom: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { bottom: 120%; opacity: 0; }
        }
        .animate-float {
          animation-name: float;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

// --- Game 5: Neuro-Flow Field ---
const FlowField = ({ onWin }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [calmScore, setCalmScore] = useState(0);

  useEffect(() => {
    if (calmScore >= 100) {
      onWin();
    }
  }, [calmScore, onWin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: any;

    const particleCount = 600; 
    const particles: any[] = [];
    const colorsCalm = ['#00f260', '#0575E6', '#64f38c', '#a2faac']; // Green/Blue
    const colorsStress = ['#ff0055', '#ff9900', '#ff2200', '#770011']; // Red/Orange

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Mouse Tracking
    const mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, speed: 0 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      
      const dist = Math.sqrt(Math.pow(mouse.x - mouse.prevX, 2) + Math.pow(mouse.y - mouse.prevY, 2));
      mouse.speed = dist; // Instantaneous speed
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      angle: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 2 + 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.color = colorsCalm[Math.floor(Math.random() * colorsCalm.length)];
      }

      update(stressLevel: number) {
        // Change color based on stress
        const targetColors = stressLevel > 5 ? colorsStress : colorsCalm;
        // Simple color swap (could be smoother but works for effect)
        if (Math.random() < 0.05) {
             this.color = targetColors[Math.floor(Math.random() * targetColors.length)];
        }

        // Flow logic
        this.angle += 0.01 + (stressLevel * 0.005); 
        this.x += this.vx + Math.sin(this.angle) * (1 + stressLevel * 0.5);
        this.y += this.vy + Math.cos(this.angle) * (1 + stressLevel * 0.5);

        // Interaction
        if (mouse.x > 0) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const force = (150 - distance) / 150;
            const repulse = force * 8; // Strength
            this.x -= (dx / distance) * repulse;
            this.y -= (dy / distance) * repulse;
          }
        }

        // Wrap
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let frameCount = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dampen speed reading over time
      mouse.speed *= 0.9;
      
      // Calculate Calmness for Game Logic
      frameCount++;
      if (frameCount % 60 === 0) { // Every second-ish
        if (mouse.speed < 15 && mouse.x > 0) { // Moving slowly and interacting
           setCalmScore(prev => {
             // Pure state update only - no side effects!
             const newScore = prev + 10;
             return Math.min(newScore, 100);
           });
        }
      }

      particles.forEach(particle => {
        particle.update(mouse.speed * 0.2); // Pass scaled speed as stress factor
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[400px] bg-slate-900 rounded-3xl overflow-hidden border border-white/10">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <Icon name="waves" size={18} className="text-blue-400" />
          Flow State
        </h2>
        <p className="text-slate-400 text-xs mt-1">Move slowly to harmonize.</p>
        <div className="mt-2 w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${calmScore}%` }} />
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};

// --- Game 6: Entropy Puzzle (Reverse Tetris) ---
const EntropyPuzzle = ({ onWin }: any) => {
  const [blocks, setBlocks] = useState(Array.from({ length: 64 }, (_, i) => ({ id: i, shattered: false })));
  
  const shatter = (id: number) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, shattered: true } : b));
  };

  useEffect(() => {
    if (blocks.every(b => b.shattered)) {
      setTimeout(onWin, 500);
    }
  }, [blocks, onWin]);

  return (
    <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 rounded-3xl border border-white/10 relative overflow-hidden">
       <div className="absolute top-4 left-6 text-xs text-slate-500 font-mono">
         ENTROPY: {(blocks.filter(b => !b.shattered).length / 64 * 100).toFixed(0)}%
       </div>
       <div className="grid grid-cols-8 gap-1 p-8 rotate-45 transform scale-75 sm:scale-100 transition-transform">
         {blocks.map((block) => (
           <button
             key={block.id}
             onMouseEnter={() => shatter(block.id)} // Hover mode for "Bubble Wrap" feel
             onClick={() => shatter(block.id)}
             className={`w-8 h-8 rounded-sm transition-all duration-700 ease-out border border-white/5
               ${block.shattered 
                 ? 'opacity-0 scale-0 rotate-[120deg] translate-y-10 pointer-events-none' 
                 : 'opacity-100 scale-100 bg-gradient-to-br from-indigo-500 to-purple-600 hover:bg-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
               }`}
           />
         ))}
       </div>
       <div className="absolute bottom-4 text-center w-full text-slate-600 text-[10px] pointer-events-none">
         HOVER OR CLICK TO SHATTER THE LATTICE
       </div>
    </div>
  );
};

// --- Game 7: Perspective Game (Finding Clarity - FIXED & LEVELED) ---
const PerspectiveGame = ({ onWin, level = 1 }: any) => {
  const [rotation, setRotation] = useState({ x: 35, y: -45 });
  const [locked, setLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Word Dictionary by Difficulty
  const WORD_SETS: any = {
    1: ['ZEN', 'JOY', 'ONE', 'NOW', 'AWE'],
    2: ['CALM', 'FLOW', 'HOPE', 'EASE'],
    3: ['FOCUS', 'TRUST', 'LIGHT', 'PEACE'],
    4: ['BREATH', 'SPIRIT', 'CENTER', 'GROWTH'],
    5: ['CLARITY', 'INSIGHT', 'BALANCE', 'WISDOM'],
    6: ['HARMONY', 'JOURNEY', 'SILENCE', 'EMPATHY'],
    7: ['SERENITY', 'PATIENCE', 'STRENGTH', 'KINDNESS'],
    8: ['GRATITUDE', 'RESILIENCE', 'AWARENESS', 'COMPASSION'],
    9: ['ETHEREAL', 'INFINITE', 'LUMINOUS', 'RADIANCE'],
    10: ['TRANQUILITY', 'EPIPHANY', 'SYMPHONY', 'EUPHORIA'],
    11: ['PERSPECTIVE', 'MINDFULNESS', 'EQUANIMITY', 'SYNCHRONICITY'],
    12: ['TRANSCENDENCE', 'ILLUMINATION', 'CONSCIOUSNESS', 'ENLIGHTENMENT']
  };

  // Select Word Logic
  const getWordForLevel = (lvl: number) => {
    // Cap difficulty, but levels can go infinite (cycling)
    const difficulty = Math.min(Math.floor((lvl + 1) / 2), 12) || 1;
    const words = WORD_SETS[difficulty] || WORD_SETS[12];
    return words[lvl % words.length]; // Cycle through words if level > set size
  };

  const [targetWord, setTargetWord] = useState(() => getWordForLevel(level));
  
  // Generate letters with randomized Z-depths for that "shattered" look
  const [letters, setLetters] = useState<any[]>([]);
  
  useEffect(() => {
    setTargetWord(getWordForLevel(level));
    setRotation({ x: 40, y: -40 }); // Reset rotation on new level
    setLocked(false);
  }, [level]);

  useEffect(() => {
    const newLetters = targetWord.split('').map((char: string, i: number) => {
      // Random Z-depth between -300 and 300
      const z = (Math.random() - 0.5) * 600; 
      // Add some color variety based on position
      const colors = ['text-emerald-400', 'text-cyan-400', 'text-indigo-400', 'text-purple-400', 'text-pink-400', 'text-amber-400'];
      return { 
        char, 
        z, 
        color: colors[i % colors.length] 
      };
    });
    setLetters(newLetters);
  }, [targetWord]);

  // Win condition: close to 0,0
  const isAligned = Math.abs(rotation.x) < 4 && Math.abs(rotation.y) < 4;

  useEffect(() => {
    if (isAligned && !locked) {
      setLocked(true);
      // Wait for the "Snap" animation to finish before triggering Level Complete
      const timer = setTimeout(() => {
        if (onWin) onWin();
      }, 1500); // 1.5s delay to enjoy the glow
      return () => clearTimeout(timer);
    }
  }, [isAligned, locked, onWin]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (locked || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // REDUCED SENSITIVITY: 40 degrees max rotation (was 70) for smoother control
    const rotateY = ((x - centerX) / centerX) * 40; 
    const rotateX = -((y - centerY) / centerY) * 40;

    setRotation({ x: rotateX, y: rotateY });
  };

  const perspective = 1000;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl border border-white/10 cursor-crosshair group"
      onMouseMove={handleMouseMove}
      style={{ perspective: `${perspective}px` }}
    >
      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
            <Icon name="sun" size={18} className="text-indigo-400" />
            PERCEPTION SHIFT
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="px-2 py-0.5 bg-indigo-500/20 rounded text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
            LVL {level}
          </div>
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-500 ${locked ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
            {locked ? 'LOCKED' : isAligned ? 'ALIGNING...' : 'MISALIGNED'}
          </div>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div 
        className="w-full h-full flex items-center justify-center preserve-3d"
        style={{ 
          transformStyle: 'preserve-3d',
          // Force 0,0 rotation when locked for the "Snap" effect
          transform: `rotateX(${locked ? 0 : rotation.x}deg) rotateY(${locked ? 0 : rotation.y}deg)`,
          // Slower ease-out for manual movement (0.2s), snappy cubic-bezier for the lock event (0.8s)
          transition: locked ? 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)' : 'transform 0.2s ease-out'
        }}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
          {letters.map((l, i) => {
            // Scale correction: scale = 1 + (z * -1) / perspective
            // When locked, we force scale to 1.1 for a "pop" effect
            const scaleCorrection = 1 + (l.z * -1) / perspective;
            const finalScale = locked ? 1.1 : scaleCorrection;
            
            return (
              <div 
                key={i}
                className={`text-6xl sm:text-8xl font-black transition-all duration-1000 select-none ${locked ? 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.9)]' : l.color}`}
                style={{ 
                  // If locked, Z becomes 0 (flat). If not, it uses the random Z depth.
                  transform: `translateZ(${locked ? 0 : l.z}px) scale(${finalScale})`,
                  opacity: locked ? 1 : 0.6,
                  textShadow: locked ? '0 0 20px rgba(255,255,255,0.5)' : 'none'
                }}
              >
                {l.char}
              </div>
            );
          })}
        </div>

        {/* Floating Junk (Visual Noise) - Fades out when locked */}
        <div 
           className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${locked ? 'opacity-0' : 'opacity-100'}`}
           style={{ transformStyle: 'preserve-3d' }}
        >
            <div className="absolute top-1/2 left-1/2 w-32 h-1 bg-white/5 rotate-45" style={{ transform: 'translateZ(150px) translateX(-100px)' }} />
            <div className="absolute top-1/2 left-1/2 w-1 h-32 bg-white/5 -rotate-12" style={{ transform: 'translateZ(-200px) translateY(50px)' }} />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/5 rounded-full" style={{ transform: 'translateZ(300px) translateX(100px)' }} />
        </div>
      </div>

      {/* Alignment Reticle - Disappears when locked */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${locked ? 'opacity-0' : 'opacity-10'}`}>
           <div className="w-64 h-[1px] bg-white absolute" />
           <div className="h-64 w-[1px] bg-white absolute" />
           <div className="w-64 h-64 border border-white rounded-full absolute scale-50" />
      </div>

    </div>
  );
};

// --- Game 8: Particle Reality (Three.js + MediaPipe) ---
const ParticleReality = ({ onWin }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentShape, setCurrentShape] = useState('heart');
  const [color, setColor] = useState('#00ffff');
  const [shapesExplored, setShapesExplored] = useState(new Set(['heart']));
  
  // Ref for Three.js / Game State to avoid re-renders
  const gameState = useRef({
    scene: null, camera: null, renderer: null, particles: null,
    targetPositions: null, positions: null,
    handOpenness: 1.0, handDistance: 1.0,
    targetColor: null, rotationSpeed: 0.002,
    shapeGen: null
  });

  // Win condition: Explore 3 shapes
  useEffect(() => {
    if (shapesExplored.size >= 3) {
      setTimeout(() => onWin(), 2000);
    }
  }, [shapesExplored, onWin]);

  useEffect(() => {
    let animationFrameId: any;
    let cameraUtils: any = null;
    let hands: any = null;

    const initGame = async () => {
      try {
        // 1. Load Dependencies
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

        setLoading(false);

        // 2. Setup Three.js
        const THREE = (window as any).THREE;
        if (!THREE) return; // Safety check

        const width = containerRef.current!.clientWidth;
        const height = containerRef.current!.clientHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050505, 0.02);
        
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Append canvas safely
        if(containerRef.current) {
            containerRef.current.appendChild(renderer.domElement);
        }

        // 3. Particle System
        const particleCount = 12000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const targetPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 50;
          targetPositions[i] = positions[i];
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create Soft Texture
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const context = canvas.getContext('2d')!;
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.PointsMaterial({
          size: 0.15,
          color: new THREE.Color(color),
          map: texture,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Generators
        const randomPointSphere = (r: number) => {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            return {x, y, z};
        };

        const generators: any = {
            heart: (i: number) => {
                const t = Math.random() * Math.PI * 2;
                let x = 16 * Math.pow(Math.sin(t), 3);
                let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                let z = (Math.random() - 0.5) * 5; 
                return { x: x*0.5, y: y*0.5, z: z };
            },
            saturn: (i: number) => {
                const isRing = Math.random() > 0.4;
                if (isRing) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 10 + Math.random() * 6;
                    return { x: Math.cos(angle) * r, y: (Math.random() - 0.5) * 0.5, z: Math.sin(angle) * r };
                }
                return randomPointSphere(7);
            },
            flower: (i: number) => {
                 const k = 4;
                 const theta = Math.random() * Math.PI * 2;
                 const rMax = Math.cos(k * theta);
                 const r = rMax * 10 * Math.sqrt(Math.random()); 
                 const x = r * Math.cos(theta);
                 const y = r * Math.sin(theta);
                 const z = (Math.cos(k * theta) * 3) * (Math.random() - 0.5); 
                 return { x, y, z };
            },
            buddha: (i: number) => {
                 const section = Math.random();
                 let p;
                 if (section < 0.2) { p = randomPointSphere(2.5); p.y += 6; }
                 else if (section < 0.6) { p = randomPointSphere(4.5); p.y -= 0.5; p.x *= 1.2; }
                 else { p = randomPointSphere(6); p.y = (p.y * 0.4) - 5; p.x *= 1.5; p.z *= 1.3; }
                 return p;
            },
            fireworks: (i: number) => randomPointSphere(15 + Math.random() * 10)
        };

        const morphToShape = (shapeName: string) => {
            const genFunc = generators[shapeName];
            for (let i = 0; i < particleCount; i++) {
                const pos = genFunc(i);
                targetPositions[i * 3] = pos.x;
                targetPositions[i * 3 + 1] = pos.y;
                targetPositions[i * 3 + 2] = pos.z;
            }
        };

        // Initial Shape
        morphToShape('heart');

        // Store in ref
        gameState.current = {
            scene: scene as any, camera: camera as any, renderer: renderer as any, particles: particles as any,
            targetPositions, positions,
            handOpenness: 1.0, handDistance: 1.0,
            targetColor: new THREE.Color(color) as any,
            rotationSpeed: 0.002,
            shapeGen: morphToShape as any
        };

        // 4. MediaPipe Hands
        const onResults = (results: any) => {
            if (!containerRef.current) return; // Cleanup check
            setCameraActive(true);
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                 const landmarks = results.multiHandLandmarks[0];
                 
                 // Openness Calculation
                 let totalDist = 0;
                 const tips = [4, 8, 12, 16, 20];
                 const wrist = landmarks[0];
                 tips.forEach(tipIdx => {
                    const tip = landmarks[tipIdx];
                    const d = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                    totalDist += d;
                 });
                 const avgDist = totalDist / 5;
                 let openness = (avgDist - 0.2) * 3.5; 
                 openness = Math.max(0, Math.min(1, openness));
                 gameState.current.handOpenness += (openness - gameState.current.handOpenness) * 0.1;

                 // Two Hand Scale
                 if (results.multiHandLandmarks.length === 2) {
                     const h1 = results.multiHandLandmarks[0][9];
                     const h2 = results.multiHandLandmarks[1][9];
                     const dist = Math.sqrt(Math.pow(h1.x - h2.x, 2) + Math.pow(h1.y - h2.y, 2));
                     let scale = dist * 2;
                     gameState.current.handDistance += (scale - gameState.current.handDistance) * 0.1;
                 } else {
                     gameState.current.handDistance += (1.0 - gameState.current.handDistance) * 0.05;
                 }
            } else {
                gameState.current.handOpenness += (0.8 - gameState.current.handOpenness) * 0.05;
                gameState.current.handDistance += (1.0 - gameState.current.handDistance) * 0.05;
            }
        };

        if ((window as any).Hands) {
            hands = new (window as any).Hands({locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
            hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
            hands.onResults(onResults);

            const videoElement = videoRef.current;
            if ((window as any).Camera && videoElement) {
                cameraUtils = new (window as any).Camera(videoElement, {
                    onFrame: async () => { await hands.send({image: videoElement}); },
                    width: 320, height: 240
                });
                cameraUtils.start();
            }
        }

        // 5. Animation Loop
        const clock = new THREE.Clock();
        const animate = () => {
            if (!containerRef.current) return;
            animationFrameId = requestAnimationFrame(animate);

            const state = gameState.current;
            if (!state.renderer) return;

            const time = clock.getElapsedTime();
            const positionsArr = state.particles.geometry.attributes.position.array;

            state.particles.rotation.y += state.rotationSpeed;
            state.particles.rotation.z = Math.sin(time * 0.2) * 0.1;

            const expansionFactor = 0.3 + (state.handOpenness * 1.2);
            const globalScale = state.handDistance;

            for (let i = 0; i < particleCount; i++) {
                const px = i * 3;
                let tx = state.targetPositions[px];
                let ty = state.targetPositions[px + 1];
                let tz = state.targetPositions[px + 2];

                // Noise
                tx += Math.sin(time * 2 + px) * 0.1;
                ty += Math.cos(time * 1.5 + px + 1) * 0.1;

                // Expand & Scale
                tx *= expansionFactor * globalScale;
                ty *= expansionFactor * globalScale;
                tz *= expansionFactor * globalScale;

                // Fireworks Chaos
                if (currentShape === 'fireworks' && state.handOpenness > 0.8) {
                    tx += (Math.random() - 0.5) * 5;
                    ty += (Math.random() - 0.5) * 5;
                    tz += (Math.random() - 0.5) * 5;
                }

                positionsArr[px] += (tx - positionsArr[px]) * 0.08;
                positionsArr[px + 1] += (ty - positionsArr[px + 1]) * 0.08;
                positionsArr[px + 2] += (tz - positionsArr[px + 2]) * 0.08;
            }

            state.particles.geometry.attributes.position.needsUpdate = true;
            state.particles.material.color.lerp(state.targetColor, 0.05);
            state.renderer.render(state.scene, state.camera);
        };
        animate();

      } catch (err) {
        console.error("Failed to init Particle Reality", err);
      }
    };

    initGame();

    return () => {
        // Cleanup
        cancelAnimationFrame(animationFrameId);
        if (cameraUtils) cameraUtils.stop();
        if (hands) hands.close();
        if (gameState.current.renderer) {
           const canvas = (gameState.current.renderer as any).domElement;
           // Safely remove only the canvas we added
           if (containerRef.current && canvas.parentNode === containerRef.current) {
               containerRef.current.removeChild(canvas);
           }
           (gameState.current.renderer as any).dispose();
        }
    };
  }, []); // Run once on mount

  // Effect to handle UI changes (Shape/Color) without re-init
  useEffect(() => {
    if (gameState.current.shapeGen) (gameState.current.shapeGen as any)(currentShape);
  }, [currentShape]);

  useEffect(() => {
    if (gameState.current.targetColor) (gameState.current.targetColor as any).set(color);
  }, [color]);

  const handleShapeChange = (shape: string) => {
    setCurrentShape(shape);
    setShapesExplored(prev => new Set(prev).add(shape));
  };

  return (
    <div ref={containerRef} className="relative w-full h-[500px] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <video ref={videoRef} className="hidden" playsInline></video>
        
        {/* Loading Overlay */}
        {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
                 <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-indigo-400 font-mono text-sm animate-pulse">Initializing Neural Interface...</p>
                 </div>
             </div>
        )}

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-start">
                 <div className="pointer-events-auto bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
                     <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                         Particle Reality
                     </h2>
                     <div className="flex items-center gap-2 mt-2">
                         <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                         <span className="text-xs text-slate-300 font-mono">
                             {cameraActive ? 'NEURAL LINK ACTIVE' : 'WAITING FOR CAMERA...'}
                         </span>
                     </div>
                     <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                         <p>🖐 Open Hand: Expand Universe</p>
                         <p>✊ Closed Fist: Compress Matter</p>
                         <p>👐 Two Hands: Scale Dimensions</p>
                     </div>
                 </div>

                 <div className="pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2">
                     <input 
                       type="color" 
                       value={color}
                       onChange={(e) => setColor(e.target.value)}
                       className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none"
                     />
                 </div>
            </div>

            {/* Footer Controls */}
            <div className="pointer-events-auto flex justify-center pb-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 overflow-x-auto max-w-full">
                    {[
                        { id: 'heart', label: 'Heart', emoji: '❤️' },
                        { id: 'saturn', label: 'Saturn', emoji: '🪐' },
                        { id: 'flower', label: 'Flower', emoji: '🌸' },
                        { id: 'buddha', label: 'Meditate', emoji: '🧘' },
                        { id: 'fireworks', label: 'Chaos', emoji: '🎆' }
                    ].map(shape => (
                        <button
                            key={shape.id}
                            onClick={() => handleShapeChange(shape.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 min-w-[80px]
                                ${currentShape === shape.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span className="text-lg">{shape.emoji}</span>
                            <span className="text-[10px] uppercase tracking-wider">{shape.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Main App ---
export default function GamesPage() {
  const [xp, setXp] = useState(1250);
  const [level, setLevel] = useState(1); // Global Level Counter
  const [activeGame, setActiveGame] = useState<string | null>(null); 
  const [showWin, setShowWin] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const handleGameSelect = (gameId: string) => {
    setActiveGame(gameId);
    setShowWin(false);
    setGameKey(k => k + 1);
    setLevel(1); // Reset level on new game start
  };

  const handleWin = useCallback(() => {
    setShowWin(prev => {
      if (prev) return prev; 
      setXp(currentXp => currentXp + 150);
      return true;
    });
  }, []);

  const handleNextLevel = () => {
    setShowWin(false);
    setGameKey(k => k + 1); // Remount game
    setLevel(l => l + 1);   // Increment Level
  };

  const backToMenu = () => {
    setActiveGame(null);
    setShowWin(false);
    setLevel(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 flex flex-col">
      
      {/* HUD */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={backToMenu}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Icon name="brain" size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">NeuroSync</span>
          </div>

          <div className="flex items-center gap-6">
            <RankBadge xp={xp} />
            
            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase">CP (XP)</span>
                <span className="font-mono text-lg font-bold text-indigo-400">{xp.toLocaleString()}</span>
              </div>
              <Icon name="trophy" size={20} className="text-yellow-500" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Background FX */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl w-full relative z-10">
          
          {!activeGame ? (
            // --- Game Selection Menu ---
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                  Select Protocol
                </h1>
                <p className="text-slate-400">Choose a cognitive calibration module.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleGameSelect(game.id)}
                    className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-2xl text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="absolute top-4 right-4 text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded">
                      +{game.xp} CP
                    </div>
                    <div className="bg-indigo-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-indigo-400">
                      <Icon name={game.icon} size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-white mb-1">{game.name}</h3>
                    <p className="text-sm text-slate-400">{game.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // --- Active Game View ---
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              {/* Game Header */}
              <div className="w-full flex items-center justify-between mb-8">
                <button 
                  onClick={backToMenu}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  <Icon name="arrowLeft" size={16} /> Back to Menu
                </button>
                <div className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
                  Module: {GAMES.find(g => g.id === activeGame)?.name}
                </div>
              </div>

              {/* Game Container */}
              <div className="relative w-full flex justify-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-2xl min-h-[400px] flex items-center justify-center">
                  
                  {activeGame === 'memory' && <MemoryGame key={gameKey} onWin={handleWin} />}
                  {activeGame === 'schulte' && <SchulteGrid key={gameKey} onWin={handleWin} />}
                  {activeGame === 'typer' && <ZenTyper key={gameKey} onWin={handleWin} />}
                  {activeGame === 'popper' && <ThoughtPopper key={gameKey} onWin={handleWin} />}
                  {activeGame === 'flow' && <FlowField key={gameKey} onWin={handleWin} />}
                  {activeGame === 'entropy' && <EntropyPuzzle key={gameKey} onWin={handleWin} />}
                  {activeGame === 'shadow' && <PerspectiveGame key={gameKey} onWin={handleWin} level={level} />}
                  {activeGame === 'particle' && <ParticleReality key={gameKey} onWin={handleWin} />}

                  {/* Win Overlay */}
                  {showWin && (
                    <div className={`absolute inset-0 z-20 flex animate-in fade-in duration-300 ${activeGame === 'shadow' ? 'items-end justify-center bg-transparent pointer-events-none' : 'items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-3xl'}`}>
                      {activeGame === 'shadow' ? (
                        // Special Minimal UI for Shadow Game (Bottom Bar)
                        <div className="pointer-events-auto w-full p-6 bg-gradient-to-t from-slate-900 to-transparent flex flex-col items-center animate-in slide-in-from-bottom-4">
                           <div className="text-center mb-4">
                             <h2 className="text-xl font-bold text-white drop-shadow-md">Perception Aligned</h2>
                             <p className="text-emerald-400 font-mono text-sm">+{GAMES.find(g => g.id === activeGame)?.xp} CP Earned</p>
                           </div>
                           <button 
                              onClick={handleNextLevel}
                              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center gap-2 transform hover:scale-105 active:scale-95"
                            >
                              NEXT LEVEL <Icon name="arrowRight" size={18} />
                            </button>
                        </div>
                      ) : (
                        // Standard Centered UI for other games
                        <div className="text-center space-y-6 p-6">
                          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 ring-4 ring-green-500/10">
                            <Icon name="trophy" size={40} className="text-green-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                                {activeGame === 'particle' ? 'Reality Synced' : 'Calibration Complete'}
                            </h2>
                            <p className="text-indigo-400 font-mono text-xl mt-2">
                              +{GAMES.find(g => g.id === activeGame)?.xp} CP Earned
                            </p>
                          </div>
                          <div className="flex gap-3 justify-center">
                            <button 
                              onClick={backToMenu}
                              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-white/10"
                            >
                              Menu
                            </button>
                            <button 
                              onClick={() => { setShowWin(false); setGameKey(k => k + 1); }}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                            >
                              <Icon name="refresh" size={18} />
                              Replay
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}