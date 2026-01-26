import React, { useState, useEffect } from 'react';
import { X, GraduationCap, BedDouble, Activity, Monitor } from 'lucide-react';
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
    color: 'indigo', 
    pillar: 'academics',
    exams: [], 
    resources: [], 
    links: [] 
  });

  useEffect(() => { 
    if (isOpen) {
      setFormData(initialData || { 
        id: Date.now(), 
        name: '', 
        code: '', 
        color: 'indigo', 
        pillar: 'academics',
        exams: [], 
        resources: [], 
        links: [] 
      }); 
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const pillars: { id: PillarType, label: string, icon: any, color: string }[] = [
    { id: 'academics', label: 'Work', icon: GraduationCap, color: 'text-emerald-500' },
    { id: 'recovery', label: 'Sleep', icon: BedDouble, color: 'text-indigo-500' },
    { id: 'vitality', label: 'Vital', icon: Activity, color: 'text-rose-500' },
    { id: 'digital', label: 'Digital', icon: Monitor, color: 'text-amber-500' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${theme.cardBg} w-full max-w-2xl rounded-3xl p-6 md:p-8 border ${theme.cardBorder} shadow-2xl overflow-y-auto max-h-[90vh]`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text} cinematic-text`}>{initialData ? 'Edit Course' : 'Add New Course'}</h2>
          <button onClick={onClose}><X size={20} className={theme.subtext} /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${theme.subtext}`}>Course Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} />
            </div>
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${theme.subtext}`}>Reference Code</label>
              <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className={`w-full p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text}`} />
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.subtext}`}>Sorting Pillar Allocation</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pillars.map(p => (
                <button
                  key={p.id}
                  onClick={() => setFormData({...formData, pillar: p.id})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    formData.pillar === p.id 
                      ? `border-orange-500 bg-orange-500/10 shadow-lg scale-105` 
                      : `${theme.inputBorder} ${theme.inputBg} opacity-60`
                  }`}
                >
                  <p.icon className={`mb-2 ${formData.pillar === p.id ? 'text-orange-500' : p.color}`} size={24} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text}`}>{p.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] italic opacity-40 leading-relaxed">Choose which dashboard bucket tasks related to this course will appear in.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-10">
          <button onClick={onClose} className={`px-6 py-3 rounded-xl font-bold text-sm md:text-base ${theme.buttonSecondary}`}>Cancel</button>
          <button onClick={() => onSave(formData)} className={`px-6 py-3 rounded-xl font-bold text-sm md:text-base ${theme.buttonPrimary}`}>Initialize Course</button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;