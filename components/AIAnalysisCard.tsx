import React from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { ThemeColors, UserData } from '../types';

interface AIAnalysisCardProps {
  userData: UserData;
  theme: ThemeColors;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ userData, theme }) => {
  const insights = [];
  if (userData.sleep < 7) insights.push({ title: 'Restoration Deficit', text: 'Sleep is below 7h. Memory consolidation impacted.', color: 'text-amber-500', bg: 'bg-amber-500/10' });
  else insights.push({ title: 'Optimal Recovery', text: 'Great sleep duration. Cognitive baseline primed.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' });
  
  // Infer Dark Mode from theme background hex
  const isDark = theme.bg.includes('#0B0C15');

  return (
    <div className={`${theme.card} p-6 rounded-3xl h-full flex flex-col relative overflow-hidden transition-all duration-500 group
      ${isDark 
        ? "shadow-[0_10px_30px_-10px_rgba(139,92,246,0.25),-10px_0_20px_-10px_rgba(139,92,246,0.15),10px_0_20px_-10px_rgba(139,92,246,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(139,92,246,0.35)]" 
        : "shadow-[0_10px_30px_-10px_rgba(139,92,246,0.15),-10px_0_20px_-10px_rgba(139,92,246,0.1),10px_0_20px_-10px_rgba(139,92,246,0.1)] hover:shadow-[0_15px_35px_-5px_rgba(139,92,246,0.25)]"
      }
    `}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg text-white shadow-lg shadow-violet-500/30">
          <Sparkles size={20} />
        </div>
        <h3 className={`text-xl font-bold ${theme.text} cinematic-text`}>AI Analysis</h3>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all duration-300 ${theme.inputBg} hover:translate-x-1 hover:shadow-lg hover:shadow-black/5`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-1.5 rounded-full ${insight.bg}`}>
                <Brain size={14} className={insight.color} />
              </div>
              <div>
                <h4 className={`text-sm font-bold mb-1 ${theme.text}`}>{insight.title}</h4>
                <p className={`text-xs leading-relaxed ${theme.subtext}`}>{insight.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisCard;