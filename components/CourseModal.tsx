
import React, { useState, useEffect } from 'react';
import { X, GraduationCap, BedDouble, Activity, Monitor, Leaf, BookOpen } from 'lucide-react';
import { APP_THEMES } from '../constants';
import { Course, PillarType } from '../types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  initialData?: Course;
  isDarkMode: boolean;
}

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, onSave, initialData, isDarkMode }) => {
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const [formData, setFormData] = useState<Course>({ 
    id: Date.now(), 
    name: '', 
    code: '', 
    color: 'bg-indigo-500', 
    pillar: 'academics',
    exams: [], 
    resources: [], 
    links: [] 
  });
  
  // New High-Level Category State
  const [category, setCategory] = useState<'academic' | 'growth'>('academic');

  useEffect(() => { 
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        // Determine category based on existing pillar
        setCategory(initialData.pillar === 'academics' ? 'academic' : 'growth');
      } else {
        setFormData({ 
          id: Date.now(), 
          name: '', 
          code: '', 
          color: 'bg-indigo-500', 
          pillar: 'academics',
          exams: [], 
          resources: [], 
          links: [] 
        });
        setCategory('academic');
      }
    }
  }, [isOpen, initialData]);

  // Handle Category Switching Logic
  const handleCategoryChange = (newCat: 'academic' | 'growth') => {
    setCategory(newCat);
    if (newCat === 'academic') {
      setFormData(prev => ({ ...prev, pillar: 'academics' }));
    } else {
      // Default to vitality for growth if switching from academic
      if (formData.pillar === 'academics') {
         setFormData(prev => ({ ...prev, pillar: 'vitality' }));
      }
    }
  };

  if (!isOpen) return null;

  const growthPillars: { id: PillarType, label: string, icon: any, color: string }[] = [
    { id: 'vitality', label: 'Vitality', icon: Activity, color: 'text-rose-500' },
    { id: 'recovery', label: 'Recovery', icon: BedDouble, color: 'text-indigo-500' },
    { id: 'digital', label: 'Digital', icon: Monitor, color: 'text-amber-500' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${theme.cardBg} w-full max-w-2xl rounded-3xl p-6 md:p-8 border ${theme.cardBorder} shadow-2xl overflow-y-auto max-h-[90vh]`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text} cinematic-text`}>{initialData ? 'Edit Strategy' : 'New Strategy'}</h2>
          <button onClick={onClose}><X size={20} className={theme.subtext} /></button>
        </div>
        <div className="space-y-6">
          
          {/* CATEGORY SELECTION */}
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.subtext}`}>Primary Domain</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleCategoryChange('academic')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${category === 'academic' ? 'bg-blue-500 text-white shadow-lg border-blue-500' : `${theme.inputBg} ${theme.inputBorder} opacity-60 hover:opacity-100`}`}
              >
                <BookOpen size={20} />
                <span className="font-bold text-sm uppercase tracking-wide">Academic</span>
              </button>
              <button 
                onClick={() => handleCategoryChange('growth')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${category === 'growth' ? 'bg-emerald-500 text-white shadow-lg border-emerald-500' : `${theme.inputBg} ${theme.inputBorder} opacity-60 hover:opacity-100`}`}
              >
                <Leaf size={20} />
                <span className="font-bold text-sm uppercase tracking-wide">Growth</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${theme.subtext}`}>Strategy Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} font-bold`} placeholder="e.g. Calculus II or Gym Routine" />
            </div>
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${theme.subtext}`}>Code / Tag</label>
              <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className={`w-full p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} placeholder="e.g. MAT201" />
            </div>
          </div>

          {category === 'growth' && (
            <div className="animate-fadeInUp">
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.subtext}`}>Specific Pillar Alignment</label>
              <div className="grid grid-cols-3 gap-3">
                {growthPillars.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFormData({...formData, pillar: p.id})}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      formData.pillar === p.id 
                        ? `border-orange-500 bg-orange-500/10 shadow-lg scale-105` 
                        : `${theme.inputBorder} ${theme.inputBg} opacity-60`
                    }`}
                  >
                    <p.icon className={`mb-2 ${formData.pillar === p.id ? 'text-orange-500' : p.color}`} size={20} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text}`}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'academic' && (
             <div className={`p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold flex items-center gap-3 animate-fadeInUp`}>
                <GraduationCap size={20} />
                <span>This course will contribute to your "Academic" Score.</span>
             </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <button onClick={onClose} className={`px-6 py-3 rounded-xl font-bold text-sm md:text-base ${theme.buttonSecondary}`}>Cancel</button>
          <button onClick={() => onSave(formData)} className={`px-6 py-3 rounded-xl font-bold text-sm md:text-base ${theme.buttonPrimary}`}>Initialize Strategy</button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
