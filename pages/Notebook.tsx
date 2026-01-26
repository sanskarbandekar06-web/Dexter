import React, { useState } from 'react';
import { Check, Trash2, Sparkles, BrainCircuit } from 'lucide-react';
import { ThemeColors, Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotebookPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const NotebookPage: React.FC<NotebookPageProps> = ({ isDarkMode, theme, tasks, setTasks }) => {
  const [input, setInput] = useState("");
  
  const addTask = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      setTasks([...tasks, { id: Date.now(), text: input, done: false }]);
      setInput("");
    }
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
  };

  return (
    <div className={`max-w-4xl mx-auto h-[85vh] flex flex-col animate-fadeInUp ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className={`text-4xl font-bold ${theme.text} cinematic-text`}>To-Do Protocol</h2>
          <p className={`text-xs font-bold uppercase tracking-widest opacity-40 ${theme.text}`}>Operational Objectives</p>
        </div>
        {tasks.some(t => t.isAI) && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <Sparkles size={12} /> AI Intervention Active
          </div>
        )}
      </div>
      
      <div className={`flex-1 rounded-2xl md:rounded-r-2xl notebook-paper overflow-y-auto px-6 md:px-12 py-8 relative transition-colors duration-500 shadow-xl ${isDarkMode ? 'shadow-black/50' : 'shadow-slate-200'}`}>
        <div className="notebook-margin"></div>
        <div className="space-y-6 ml-4 md:ml-6">
            <AnimatePresence>
              {tasks.map(task => (
                <motion.div 
                  key={task.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center group relative"
                >
                  <button 
                    onClick={() => toggleTask(task.id)} 
                    aria-label={`Mark task "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`}
                    className={`w-5 h-5 mr-4 border-2 rounded flex items-center justify-center transition-all duration-300 ${task.done ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}
                  >
                    {task.done && <Check size={14} className="text-white" />}
                  </button>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <span className={`text-xl handwritten pt-1 transition-all duration-300 ${task.done ? 'text-gray-400 line-through' : (isDarkMode ? 'text-gray-200' : 'text-stone-800')} ${task.isAI ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                      {task.text}
                    </span>
                    {task.isAI && (
                      <span className="text-[10px] font-sans font-bold text-emerald-500 flex items-center gap-1 opacity-80 mt-0.5">
                        <BrainCircuit size={10} /> {task.aiReason || "Recommended by Brain"}
                      </span>
                    )}
                  </div>

                  {task.isAI && !task.done && (
                     <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                       <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                     </div>
                  )}

                  <button 
                    onClick={() => removeTask(task.id)} 
                    aria-label={`Delete task "${task.text}"`}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:scale-110 transition-all p-2"
                  >
                    <Trash2 size={18}/>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <div className="flex items-center mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-5 h-5 mr-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded"></div>
                <input 
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={addTask}
                  placeholder="Add a new objective..." 
                  aria-label="New Task Input"
                  className={`flex-1 bg-transparent border-none focus:outline-none text-xl handwritten placeholder-stone-400 dark:placeholder-gray-600 ${isDarkMode ? 'text-white' : 'text-stone-800'}`} 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookPage;