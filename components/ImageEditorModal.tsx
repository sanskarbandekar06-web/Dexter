
import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, Move, Sliders, ZoomIn, Sun, Contrast, Droplets, Check } from 'lucide-react';
import { ThemeColors } from '../types';

interface EditorState {
  scale: number;
  x: number;
  y: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ImageEditorModalProps {
  src: string;
  type: 'avatar' | 'banner';
  onSave: (res: string) => void;
  onCancel: () => void;
  theme: ThemeColors;
  isDarkMode: boolean;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  src,
  type,
  onSave,
  onCancel,
  theme,
  isDarkMode
}) => {
  const [state, setState] = useState<EditorState>({
    scale: 1, x: 0, y: 0, brightness: 100, contrast: 100, saturation: 100
  });
  const [activeTab, setActiveTab] = useState<'transform' | 'filters'>('transform');
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const VIEWPORT_SIZE = type === 'avatar' ? 280 : 500;
  const VIEWPORT_RATIO = type === 'avatar' ? 1 : 2.5;
  const viewportH = type === 'avatar' ? VIEWPORT_SIZE : VIEWPORT_SIZE / VIEWPORT_RATIO;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX - state.x, y: e.clientY - state.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setState(prev => ({ ...prev, x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSaveClick = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const OUTPUT_WIDTH = type === 'avatar' ? 500 : 1000;
    const scaleFactor = OUTPUT_WIDTH / VIEWPORT_SIZE;

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_WIDTH / (type === 'avatar' ? 1 : VIEWPORT_RATIO);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDarkMode ? '#000' : '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.translate(state.x * scaleFactor, state.y * scaleFactor);
    ctx.scale(state.scale * scaleFactor, state.scale * scaleFactor);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className={`${theme.cardBg} w-full max-w-lg rounded-3xl border ${theme.cardBorder} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
          <h3 className={`text-lg font-bold ${theme.text} cinematic-text flex items-center gap-2`}>
            <Edit3 size={18} /> Edit {type === 'avatar' ? 'Profile Picture' : 'Banner'}
          </h3>
          <button onClick={onCancel} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${theme.text}`}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative flex items-center justify-center p-8 select-none"
             onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
           <div 
             className={`relative overflow-hidden shadow-2xl border-4 border-white/20 z-10 cursor-move
               ${type === 'avatar' ? 'rounded-full' : 'rounded-xl'}
             `}
             style={{ width: VIEWPORT_SIZE, height: viewportH }}
             onMouseDown={handleMouseDown}
           >
             <img 
               ref={imageRef}
               src={src}
               alt="Edit"
               className="absolute max-w-none origin-center pointer-events-none"
               style={{
                 left: '50%', top: '50%',
                 transform: `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
                 filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`
               }}
               draggable={false}
             />
             <div className="absolute inset-0 pointer-events-none opacity-30">
               <div className="absolute top-1/3 w-full h-px bg-white/50"></div>
               <div className="absolute top-2/3 w-full h-px bg-white/50"></div>
               <div className="absolute left-1/3 h-full w-px bg-white/50"></div>
               <div className="absolute left-2/3 h-full w-px bg-white/50"></div>
             </div>
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className={`p-6 ${theme.cardBg} border-t ${theme.cardBorder}`}>
          <div className="flex gap-4 mb-6 justify-center">
             <button onClick={() => setActiveTab('transform')} className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'transform' ? 'border-orange-500 text-orange-500' : 'border-transparent opacity-50'}`}>
               <Move size={16} /> Position
             </button>
             <button onClick={() => setActiveTab('filters')} className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'filters' ? 'border-orange-500 text-orange-500' : 'border-transparent opacity-50'}`}>
               <Sliders size={16} /> Filters
             </button>
          </div>

          <div className="space-y-6 h-32">
            {activeTab === 'transform' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium opacity-70">
                    <span className="flex items-center gap-1"><ZoomIn size={12}/> Zoom</span>
                    <span>{Math.round(state.scale * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="3" step="0.05"
                    value={state.scale} 
                    onChange={e => setState({...state, scale: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium opacity-70">
                       <span className="flex items-center gap-1"><Sun size={12}/> Brightness</span>
                       <span>{state.brightness}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={state.brightness} onChange={e => setState({...state, brightness: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-500" />
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium opacity-70">
                       <span className="flex items-center gap-1"><Contrast size={12}/> Contrast</span>
                       <span>{state.contrast}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={state.contrast} onChange={e => setState({...state, contrast: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-500" />
                 </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={onCancel} className={`flex-1 py-3 rounded-xl border ${theme.cardBorder} hover:bg-black/5 dark:hover:bg-white/5 font-bold transition-colors`}>Cancel</button>
            <button onClick={handleSaveClick} className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2`}>
              <Check size={18} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
