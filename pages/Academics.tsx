import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, TrendingUp, 
  FileText, Link as LinkIcon, ExternalLink, X, 
  Trash2, GraduationCap,
  Download, Upload,
  MoreHorizontal, Filter, Grid, List, Search,
  Image as ImageIcon, PlayCircle, File
} from 'lucide-react';
import { ThemeColors, CalendarEvent, Course, ExamRecord, Resource, PillarType } from '../types';
import CourseModal from '../components/CourseModal';

interface AcademicsPageProps {
  isDarkMode: boolean;
  theme: ThemeColors;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

function formatBytes(bytes: number, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const INITIAL_COURSES: Course[] = [
  {
    id: 1,
    name: "Data Structures",
    code: "CS 101",
    color: "bg-blue-500",
    pillar: 'academics',
    professor: "Dr. Turing",
    location: "Hall A",
    exams: [
      { id: 1, title: "Midterm", date: "2024-03-15", score: 88, totalMarks: 100, weight: 30 },
      { id: 2, title: "Final", date: "2024-05-20", totalMarks: 100, weight: 50 }
    ],
    resources: [
      { id: 1, title: "Binary Trees Guide", type: "pdf", size: "2.4 MB" },
      { id: 2, title: "Sorting Algorithms", type: "video" }
    ],
    links: [
      { id: 1, title: "Course Portal", type: "link", url: "https://university.edu/cs101" }
    ]
  },
  {
    id: 2,
    name: "Calculus II",
    code: "MAT 201",
    color: "bg-orange-500",
    pillar: 'academics',
    professor: "Prof. Newton",
    exams: [
      { id: 1, title: "Quiz 1", date: "2024-02-10", score: 18, totalMarks: 20, weight: 10 }
    ],
    resources: [],
    links: []
  },
  {
    id: 3,
    name: "Sleep Hygiene",
    code: "RECOVERY",
    color: "bg-indigo-500",
    pillar: 'recovery',
    professor: "Dr. Rest",
    exams: [],
    resources: [],
    links: []
  }
];

const AcademicsPage: React.FC<AcademicsPageProps> = ({ isDarkMode, theme }) => {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'academics' | 'growth'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (activeFilter === 'academics') result = courses.filter(c => c.pillar === 'academics');
    else if (activeFilter === 'growth') result = courses.filter(c => c.pillar !== 'academics');
    
    if (searchQuery.trim()) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [courses, activeFilter, searchQuery]);

  const handleSaveCourse = (course: Course) => {
    const exists = courses.find(c => c.id === course.id);
    if (exists) {
      setCourses(courses.map(c => c.id === course.id ? course : c));
    } else {
      setCourses([...courses, course]);
    }
    setIsAddingCourse(false);
  };

  const updateCourse = (updated: Course) => {
    setCourses(courses.map(c => c.id === updated.id ? updated : c));
    setSelectedCourse(updated);
  };

  const deleteCourse = (id: number) => {
    setCourses(courses.filter(c => c.id !== id));
    setSelectedCourse(null);
  };

  const ExamSection = ({ course }: { course: Course }) => {
    const [isAdding, setIsAdding] = useState(false);

    const addExam = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const scoreVal = formData.get('score');
      
      const newExam: ExamRecord = {
        id: Date.now(),
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        totalMarks: Number(formData.get('total')),
        weight: Number(formData.get('weight')),
        score: scoreVal ? Number(scoreVal) : undefined
      };
      updateCourse({ ...course, exams: [...course.exams, newExam] });
      setIsAdding(false);
    };

    const updateScore = (examId: number, score: number) => {
      const updatedExams = course.exams.map(e => e.id === examId ? { ...e, score } : e);
      updateCourse({ ...course, exams: updatedExams });
    };

    const gradedExams = course.exams.filter(e => e.score !== undefined);
    const average = gradedExams.length > 0 
      ? Math.round(gradedExams.reduce((acc, curr) => acc + ((curr.score! / curr.totalMarks) * 100), 0) / gradedExams.length)
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
               <TrendingUp size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
             </div>
             <div>
               <h4 className={`font-bold ${theme.text}`}>Performance</h4>
               <p className={`text-xs opacity-50 ${theme.text}`}>Current Average: <span className={average >= 80 ? 'text-emerald-500' : 'text-orange-500'}>{average}%</span></p>
             </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 text-xs font-bold"
          >
            <Plus size={14} /> Add Exam
          </motion.button>
        </div>

        {isAdding && (
          <form onSubmit={addExam} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 space-y-3 animate-fadeInUp">
             <input name="title" required placeholder="Exam Title" className="w-full bg-transparent border-b border-black/10 dark:border-white/10 p-2 outline-none text-sm" />
             <div className="flex gap-3">
               <input name="date" type="date" required className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 p-2 outline-none text-sm opacity-70" />
               <input name="total" type="number" placeholder="Total Marks" required className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 p-2 outline-none text-sm" />
             </div>
             <div className="flex gap-3">
               <input name="weight" type="number" placeholder="Weight %" className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 p-2 outline-none text-sm" />
               <input name="score" type="number" placeholder="My Score" className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 p-2 outline-none text-sm" />
             </div>
             <div className="flex justify-end gap-2 pt-2">
               <button type="button" onClick={() => setIsAdding(false)} className="text-xs opacity-50 px-3">Cancel</button>
               <button type="submit" className="text-xs font-bold bg-blue-500 text-white px-4 py-1.5 rounded-lg">Save</button>
             </div>
          </form>
        )}

        <div className="space-y-3">
          {course.exams.map(exam => (
             <div key={exam.id} className={`p-4 rounded-2xl border ${theme.cardBorder} ${isDarkMode ? 'bg-white/5' : 'bg-white'} flex items-center justify-between group`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <span className="text-[10px] font-bold uppercase opacity-50">{new Date(exam.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(exam.date).getDate()}</span>
                  </div>
                  <div>
                    <h5 className={`font-bold ${theme.text}`}>{exam.title}</h5>
                    <p className={`text-xs opacity-50 ${theme.text}`}>Weight: {exam.weight}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <div className="text-[10px] uppercase font-bold opacity-40">Score</div>
                      <div className="flex items-baseline gap-1">
                        <input 
                          type="number" 
                          defaultValue={exam.score} 
                          onBlur={(e) => updateScore(exam.id, Number(e.target.value))}
                          placeholder="-"
                          className={`w-10 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none font-black text-lg ${theme.text}`}
                        />
                        <span className="opacity-50 text-sm">/ {exam.totalMarks}</span>
                      </div>
                   </div>
                   <button onClick={() => updateCourse({ ...course, exams: course.exams.filter(e => e.id !== exam.id) })} className="opacity-0 group-hover:opacity-100 text-rose-500 p-2 transition-opacity">
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
          ))}
          {course.exams.length === 0 && <p className="text-center text-sm opacity-40 py-4 italic">No exam records found.</p>}
        </div>
      </div>
    );
  };

  const ResourceSection = ({ course }: { course: Course }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [stagedFile, setStagedFile] = useState<{ file: File, preview: string, type: 'image' | 'video' | 'other' } | null>(null);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      let fileType: 'image' | 'video' | 'other' = 'other';
      
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';

      setStagedFile({ file, preview: previewUrl, type: fileType });
    };

    const confirmUpload = () => {
      if (!stagedFile) return;

      const newRes: Resource = {
        id: Date.now(),
        title: stagedFile.file.name,
        type: stagedFile.file.type.includes('pdf') ? 'pdf' : stagedFile.file.type.includes('image') ? 'image' : stagedFile.file.type.includes('video') ? 'video' : 'file',
        size: formatBytes(stagedFile.file.size),
        url: stagedFile.preview
      };
      
      updateCourse({ ...course, resources: [...course.resources, newRes] });
      setStagedFile(null);
      setIsAdding(false);
    };

    const cancelUpload = () => {
        if(stagedFile) URL.revokeObjectURL(stagedFile.preview);
        setStagedFile(null);
        setIsAdding(false);
    }

    const deleteResource = (id: number) => {
        const updated = course.resources.filter(r => r.id !== id);
        updateCourse({ ...course, resources: updated });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
               <FileText size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
             </div>
             <div>
               <h4 className={`font-bold ${theme.text}`}>Library</h4>
               <p className={`text-xs opacity-50 ${theme.text}`}>{course.resources.length} Assets</p>
             </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 text-xs font-bold"
          >
            <Upload size={14} /> Upload
          </motion.button>
        </div>

        {isAdding && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             {!stagedFile ? (
               <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5`}>
                  <input type="file" required onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={24} className={`mb-2 opacity-50 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <p className={`text-sm font-bold ${theme.text}`}>Drop asset or click to browse</p>
               </div>
             ) : (
                <div className={`relative rounded-2xl overflow-hidden border ${theme.cardBorder} bg-black/5 dark:bg-white/5 p-4`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/10 flex items-center justify-center relative">
                            {stagedFile.type === 'image' && <img src={stagedFile.preview} className="w-full h-full object-cover" />}
                            {stagedFile.type === 'video' && <video src={stagedFile.preview} className="w-full h-full object-cover" />}
                            {stagedFile.type === 'other' && <FileText className="opacity-50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{stagedFile.file.name}</div>
                            <div className="text-xs opacity-50">{formatBytes(stagedFile.file.size)}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={cancelUpload} className="flex-1 py-2 text-xs font-bold rounded-xl border border-black/10 dark:border-white/10 opacity-70 hover:opacity-100">Cancel</button>
                        <button onClick={confirmUpload} className="flex-1 py-2 text-xs font-bold rounded-xl bg-indigo-500 text-white shadow-lg">Confirm Upload</button>
                    </div>
                </div>
             )}
             
             {!stagedFile && (
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="text-xs px-3 opacity-50">Cancel</button>
                </div>
             )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {course.resources.map(res => (
             <div key={res.id} className={`group relative rounded-2xl border ${theme.cardBorder} ${isDarkMode ? 'bg-white/5' : 'bg-white'} overflow-hidden transition-all hover:shadow-lg`}>
                
                {/* Preview Area */}
                <div className="h-32 bg-black/5 dark:bg-white/5 relative flex items-center justify-center overflow-hidden">
                    {res.type === 'image' && (
                        <img src={res.url} alt={res.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    )}
                    {res.type === 'video' && (
                        <>
                           <video src={res.url} className="w-full h-full object-cover opacity-80" />
                           <div className="absolute inset-0 flex items-center justify-center">
                                <PlayCircle className="text-white drop-shadow-lg" size={32} />
                           </div>
                        </>
                    )}
                    {res.type === 'pdf' && <FileText size={32} className="opacity-30" />}
                    {res.type === 'file' && <File size={32} className="opacity-30" />}

                    {/* Overlay Action */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a href={res.url} download={res.title} className="p-2 rounded-full bg-white text-black hover:scale-110 transition-transform">
                            <Download size={16} />
                        </a>
                        <button onClick={() => deleteResource(res.id)} className="p-2 rounded-full bg-rose-500 text-white hover:scale-110 transition-transform">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="p-3">
                    <div className={`text-xs font-bold truncate ${theme.text}`}>{res.title}</div>
                    <div className="flex justify-between items-center mt-1">
                        <div className="text-[10px] opacity-40 uppercase font-bold">{res.type} • {res.size}</div>
                    </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const LinkSection = ({ course }: { course: Course }) => {
     const [isAdding, setIsAdding] = useState(false);

     const addLink = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const newLink: Resource = {
        id: Date.now(),
        title: formData.get('title') as string,
        type: 'link',
        url: formData.get('url') as string
      };
      updateCourse({ ...course, links: [...course.links, newLink] });
      setIsAdding(false);
    };

     return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
               <LinkIcon size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
             </div>
             <div>
               <h4 className={`font-bold ${theme.text}`}>External Portals</h4>
             </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 text-xs font-bold"
          >
            <Plus size={14} /> Add Link
          </motion.button>
        </div>

        {isAdding && (
          <form onSubmit={addLink} className="flex gap-2 animate-fadeInUp">
            <input name="title" required placeholder="Title" className={`w-1/3 rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} outline-none`} />
            <input name="url" required placeholder="https://..." className={`flex-1 rounded-lg px-3 py-2 text-sm ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} outline-none`} />
            <button type="submit" className="bg-blue-500 text-white rounded-lg px-4 text-sm font-bold">Add</button>
          </form>
        )}

        <div className="space-y-2">
           {course.links.map(link => (
             <a href={link.url} target="_blank" rel="noreferrer" key={link.id} className={`block p-3 rounded-xl border ${theme.cardBorder} ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'} transition-all group`}>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                        <LinkIcon size={14} />
                      </div>
                      <span className={`text-sm font-bold ${theme.text}`}>{link.title}</span>
                   </div>
                   <ExternalLink size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
             </a>
           ))}
        </div>
      </div>
     );
  };

  return (
    <div className="h-full overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-end justify-between px-4 md:px-8 py-6 pb-2 gap-6">
        <div className="flex-1 w-full md:w-auto">
           <h1 className={`text-4xl font-black tracking-tight cinematic-text ${theme.text}`}>Strategy Map</h1>
           <p className={`text-sm opacity-50 font-medium ${theme.text}`}>Adaptive Growth Trajectories</p>
           
           <div className="mt-4 relative max-w-md group w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-orange-500 transition-colors" size={18} />
             <input 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               placeholder="Search registry..."
               className={`w-full py-3 pl-12 pr-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} ${theme.text} outline-none focus:ring-2 ring-orange-500/20`}
             />
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className={`flex p-1 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} shadow-sm w-full md:w-auto`}>
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-orange-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveFilter('academics')}
              className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'academics' ? 'bg-orange-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
            >
              Academic
            </button>
            <button 
              onClick={() => setActiveFilter('growth')}
              className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'growth' ? 'bg-orange-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
            >
              Growth
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(249, 115, 22, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingCourse(true)}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black shadow-xl transition-all group active:scale-95 border border-white/10`}
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" strokeWidth={3} /> 
            <span className="text-sm tracking-wide">INITIATE PROTOCOL</span>
          </motion.button>
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-[calc(100vh-220px)] custom-scrollbar pb-32">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <motion.div
              layout
              layoutId={`course-${course.id}`}
              key={course.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSelectedCourse(course)}
              whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
              className={`relative aspect-[4/3] rounded-[2.5rem] p-8 cursor-pointer overflow-hidden group border ${theme.cardBorder} ${theme.cardBg}`}
            >
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity ${course.color}`} />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/10 ${theme.text} backdrop-blur-md`}>
                     {course.code}
                   </div>
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${course.color} text-white shadow-lg`}>
                     <GraduationCap size={20} />
                   </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black leading-tight mb-2 group-hover:text-orange-500 transition-colors">{course.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black opacity-30 tracking-[0.2em]">{course.pillar} Pillar</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredCourses.length === 0 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Search size={48} strokeWidth={1} />
                <p className="font-bold">No matching strategies found in registry.</p>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CourseModal 
        isOpen={isAddingCourse} 
        onClose={() => setIsAddingCourse(false)} 
        onSave={handleSaveCourse} 
        isDarkMode={isDarkMode} 
      />

      <AnimatePresence>
        {selectedCourse && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div 
              layoutId={`course-${selectedCourse.id}`}
              className={`w-full max-w-5xl h-[85vh] ${theme.cardBg} rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border ${theme.cardBorder}`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedCourse(null)}
                className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-current backdrop-blur-md"
              >
                <X size={20} />
              </button>

              <div className={`w-full md:w-1/3 p-8 ${selectedCourse.color} relative overflow-hidden flex flex-col justify-between text-white`}>
                 <div className="absolute inset-0 bg-black/10" />
                 <div className="relative z-10 space-y-6">
                    <div className="inline-block px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest">
                      {selectedCourse.code}
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tight mb-2">{selectedCourse.name}</h2>
                      <p className="text-sm font-medium opacity-80 uppercase tracking-widest">{selectedCourse.pillar} Pillar</p>
                    </div>
                 </div>
                 <button onClick={() => deleteCourse(selectedCourse.id)} className="relative z-10 flex items-center gap-2 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity mt-8 md:mt-0">
                    <Trash2 size={14} /> Remove Course
                 </button>
              </div>

              <div className={`flex-1 p-8 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                 <div className="space-y-12 max-w-2xl mx-auto">
                    <ExamSection course={selectedCourse} />
                    <hr className="border-black/5 dark:border-white/5" />
                    <ResourceSection course={selectedCourse} />
                    <hr className="border-black/5 dark:border-white/5" />
                    <LinkSection course={selectedCourse} />
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AcademicsPage;