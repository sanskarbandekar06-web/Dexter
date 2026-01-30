
import React, { useState } from 'react';
import { Check, Trash2, Sparkles, BrainCircuit, ArrowUp, ArrowDown, Edit2, X, Flag, AlertCircle, Trash, Square, CheckSquare, Plus, Calendar } from 'lucide-react';
import { ThemeColors, Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db, collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from '../lib/firebase';

interface NotebookPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  userId?: string;
  onOpenPlanner?: () => void;
  onTaskComplete?: (task: Task) => void;
}

const NotebookPage: React.FC<NotebookPageProps> = ({ isDarkMode, theme, tasks, setTasks, userId, onOpenPlanner, onTaskComplete }) => {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editText, setEditText] = useState("");

  const taskRef = userId ? collection(db, 'users', userId, 'tasks') : null;

  const submitTask = async () => {
    if (input.trim() && taskRef) {
      const newTask: Omit<Task, 'id'> = {
        text: input,
        done: false,
        priority: 'normal',
        createdAt: Date.now(),
        order: tasks.length,
        pillar: 'academics' // Default
      };
      // Optimistic update handled by Firestore listener in App.tsx
      await addDoc(taskRef, newTask);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitTask();
    }
  };

  const removeTask = async (id: number | string) => {
    if (!userId) return;
    const docRef = doc(db, 'users', userId, 'tasks', id.toString());
    await deleteDoc(docRef);
  };

  const toggleTask = async (id: number | string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic toggle in UI is handled by listener, but we can trigger the score effect immediately
    if (!task.done && onTaskComplete) {
        onTaskComplete(task);
    }

    const docRef = doc(db, 'users', userId, 'tasks', id.toString());
    await updateDoc(docRef, { done: !task.done });
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async () => {
    if (editingId && editText.trim() && userId) {
      const docRef = doc(db, 'users', userId, 'tasks', editingId.toString());
      await updateDoc(docRef, { text: editText });
    }
    setEditingId(null);
  };

  const togglePriority = async (id: number | string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const docRef = doc(db, 'users', userId, 'tasks', id.toString());
    await updateDoc(docRef, { priority: task.priority === 'high' ? 'normal' : 'high' });
  };

  const moveTask = async (id: number | string, direction: 'up' | 'down') => {
    if (!userId) return;
    const activeTasks = tasks.filter(t => !t.done).sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = activeTasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= activeTasks.length) return;

    const taskA = activeTasks[index];
    const taskB = activeTasks[swapIndex];

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId, 'tasks', taskA.id.toString()), { order: taskB.order || 0 });
    batch.update(doc(db, 'users', userId, 'tasks', taskB.id.toString()), { order: taskA.order || 0 });
    await batch.commit();
  };

  const clearCompleted = async () => {
    if (!userId) return;
    const completed = tasks.filter(t => t.done);
    const batch = writeBatch(db);
    completed.forEach(t => {
      batch.delete(doc(db, 'users', userId, 'tasks', t.id.toString()));
    });
    await batch.commit();
  };

  const activeTasks = tasks.filter(t => !t.done).sort((a, b) => (a.order || 0) - (b.order || 0));
  const completedTasks = tasks.filter(t => t.done);

  return (
    <div className={`max-w-4xl mx-auto h-full md:h-[85vh] flex flex-col animate-fadeInUp ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-4 md:mb-6 px-2 gap-4 md:gap-0">
        <div>
          <h2 className={`text-3xl md:text-4xl font-bold ${theme.text} cinematic-text`}>Daily Checklist</h2>
          <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40 ${theme.text}`}>Operational Objectives</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {onOpenPlanner && (
            <button 
              onClick={onOpenPlanner}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                isDarkMode 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' 
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200'
              }`}
            >
              <Calendar size={12} /> Plan Day
            </button>
          )}
          {completedTasks.length > 0 && (
            <button 
              onClick={clearCompleted} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                isDarkMode 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
                  : 'bg-rose-200 text-rose-900 border border-rose-300 hover:bg-rose-300'
              }`}
            >
              <Trash size={12} /> Clear Done
            </button>
          )}
        </div>
      </div>
      
      <div className={`flex-1 rounded-3xl md:rounded-[3rem] notebook-paper overflow-y-auto px-4 md:px-14 py-8 md:py-10 relative transition-all duration-500 shadow-2xl ${isDarkMode ? 'shadow-black/50 border border-white/5' : 'shadow-slate-200 border border-slate-100'}`}>
        
        {/* Visual Enhancement: Binder Clip / Tape */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-24 h-8 bg-orange-400/40 dark:bg-orange-500/20 backdrop-blur-sm rounded-b-lg border-x border-b border-orange-500/20 z-10 flex items-center justify-center">
            <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>

        <div className="notebook-margin"></div>
        <div className="space-y-6 md:space-y-8 ml-10 md:ml-10">
            
            {/* Input Section */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-8 md:mb-10 pb-3 group">
                <div className="flex-1 flex items-center border-b-2 border-dashed border-gray-300 dark:border-gray-700/50 pb-2 group-focus-within:border-orange-500 transition-colors">
                  <div className="w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg group-focus-within:border-orange-500 transition-colors"></div>
                  <input 
                    value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Initiate new objective..." 
                    aria-label="New Task Input"
                    className={`flex-1 bg-transparent border-none focus:outline-none text-xl md:text-2xl handwritten placeholder-stone-500 dark:placeholder-gray-600 ${isDarkMode ? 'text-white' : 'text-stone-900'}`} 
                  />
                </div>
                <button 
                  onClick={submitTask}
                  disabled={!input.trim()}
                  className={`p-3 md:px-5 md:py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed'
                  }`}
                >
                  <Plus size={20} strokeWidth={3} />
                  <span className="inline md:hidden lg:inline text-xs font-black uppercase tracking-wider">Add</span>
                </button>
            </div>

            {/* Active Tasks List */}
            <AnimatePresence mode='popLayout'>
              {activeTasks.length === 0 && tasks.length === 0 && (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Sparkles size={40} className="mb-4 text-orange-500" strokeWidth={1} />
                    <p className={`italic text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Registry Clear. Awaiting Input.</p>
                 </motion.div>
              )}

              {activeTasks.map((task, index) => (
                <motion.div 
                  key={task.id} 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-start group relative p-3 md:p-4 -mx-2 md:-mx-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all ${task.priority === 'high' ? 'bg-orange-500/5 dark:bg-orange-500/10' : ''}`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} 
                    aria-label="Complete Task"
                    className={`mt-1.5 w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-5 rounded-lg flex items-center justify-center transition-all duration-300 border-2 ${
                      isDarkMode ? 'border-gray-600' : 'border-slate-400'
                    } hover:border-emerald-500 hover:scale-110 active:scale-90`}
                  >
                    <Square size={16} className="opacity-0 group-hover:opacity-20 transition-opacity" />
                  </button>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-2 md:pr-4">
                    {editingId === task.id ? (
                      <div className="flex items-center gap-3 w-full">
                        <input 
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          onBlur={saveEdit}
                          className={`flex-1 bg-transparent border-b-2 border-orange-500 outline-none text-xl md:text-2xl handwritten ${isDarkMode ? 'text-white' : 'text-stone-900'}`}
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(); }} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg"><Check size={18} /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className={`text-xl md:text-2xl handwritten leading-tight ${isDarkMode ? 'text-gray-100' : 'text-stone-900'} ${task.priority === 'high' ? 'font-bold' : ''}`}>
                          {task.text}
                        </span>
                        {task.isAI && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1.5">
                                <Sparkles size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">AI Guide</span>
                            </div>
                            <span className="text-[10px] font-bold opacity-30 italic truncate max-w-[200px] md:max-w-none">{task.aiReason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Task Actions - Always visible on mobile */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all scale-100 md:scale-95 md:group-hover:scale-100 z-10">
                     <button 
                        onClick={(e) => { e.stopPropagation(); togglePriority(task.id); }} 
                        title="Mark Priority"
                        className={`p-1.5 md:p-2 rounded-lg transition-all ${
                          task.priority === 'high' 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                     >
                        <Flag size={16} fill={task.priority === 'high' ? 'currentColor' : 'none'} />
                     </button>
                     
                     {!editingId && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEditing(task); }} 
                          title="Edit Task" 
                          className={`p-1.5 md:p-2 rounded-lg transition-all ${
                            isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-white/10' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200'
                          }`}
                        >
                          <Edit2 size={16} />
                        </button>
                     )}

                     <div className="flex flex-col gap-0.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'up'); }} 
                          disabled={index === 0} 
                          className={`p-0.5 disabled:opacity-10 transition-colors ${
                            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                          }`}
                        >
                           <ArrowUp size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'down'); }} 
                          disabled={index === activeTasks.length - 1} 
                          className={`p-0.5 disabled:opacity-10 transition-colors ${
                            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                          }`}
                        >
                           <ArrowDown size={12} />
                        </button>
                     </div>

                     <button 
                       onClick={(e) => { e.stopPropagation(); removeTask(task.id); }} 
                       title="Purge Task" 
                       className={`p-1.5 md:p-2 rounded-lg transition-all ${
                         isDarkMode ? 'text-gray-400 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-100'
                       }`}
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Completed Tasks Divider */}
            {completedTasks.length > 0 && (
               <div className="pt-8 md:pt-12">
                  <div className="flex items-center gap-3 md:gap-5 mb-6">
                     <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-3 md:px-4 py-1 border border-black/5 dark:border-white/5 rounded-full">Archive</span>
                     <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
                  </div>
                  
                  <div className="space-y-3">
                    {completedTasks.map(task => (
                       <motion.div 
                         key={task.id} 
                         layout
                         initial={{ opacity: 0, scale: 0.98 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex items-center group relative p-3 opacity-40 hover:opacity-100 transition-all"
                       >
                         <button 
                           onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} 
                           className="w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-5 rounded-lg flex items-center justify-center bg-indigo-500 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
                         >
                           <CheckSquare size={16} className="text-white" />
                         </button>
                         <span className="flex-1 text-xl md:text-2xl handwritten leading-tight line-through text-gray-400 dark:text-gray-600">
                           {task.text}
                         </span>
                         <button 
                           onClick={(e) => { e.stopPropagation(); removeTask(task.id); }} 
                           className={`opacity-100 md:opacity-0 group-hover:opacity-100 p-2 md:p-2.5 rounded-xl transition-all ${
                             isDarkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-100'
                           }`}
                         >
                           <Trash2 size={16}/>
                         </button>
                       </motion.div>
                    ))}
                  </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NotebookPage;
