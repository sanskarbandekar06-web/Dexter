import { GoogleGenAI } from "@google/genai";
import { UserData, Task, CalendarEvent } from "../types";

// Initialize the Google GenAI SDK with the API key from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BrainAnalysisResult {
  suggestedTask: Task | null;
  insight: string;
}

// Helper function to create the AI task object
function createAITask(text: string, reason: string): Task {
  return {
    id: Date.now(), // Unique ID based on timestamp
    text: text,
    done: false,
    isAI: true,
    aiReason: reason
  };
}

export async function consultTheBrain(
  metrics: UserData,
  events: CalendarEvent[],
  tasks: Task[],
  userName: string
): Promise<BrainAnalysisResult> {
  
  // Filter for upcoming exams (next 7 days) and calculate days remaining
  const now = new Date();
  const upcomingExams = events.filter(e => 
    e.type === 'exam' && 
    e.date >= now && 
    e.date <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  ).map(e => {
    const diffTime = e.date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${e.title} (${e.subject}) in ${diffDays} days`;
  });

  const currentTasks = tasks.map(t => t.text).join(", ");
  const examsContext = upcomingExams.length > 0 ? upcomingExams.join(", ") : "None in next 7 days";

  const prompt = `
    You are the "Brain" of DayScore, a Solarpunk cognitive optimizer. 
    Your persona is like Dr. K (Healthy Gamer GG): empathetic, psychological, and focused on "Intervention before Cause".
    
    USER CONTEXT:
    - Name: ${userName}
    - Sleep: ${metrics.sleep}h (Target: 7h+)
    - Study: ${metrics.study}h (Target: 4h+)
    - Screen Time: ${metrics.screenTime}h (Target: <4h)
    - Upcoming Exams (CRITICAL): ${examsContext}
    - Current To-Do List: ${currentTasks || "Empty"}

    YOUR GOAL:
    Analyze the user's To-Do list against their reality and intervene if necessary.

    RULES FOR INTERVENTION (Evaluate in order):
    1. EXAM CHECK: If there is an exam in <= 3 days AND the To-Do list does NOT contain a task for it (look for "Study", "Review", or the exam subject name), you MUST intervene.
       - Intervention: "Study for [Exam Name]"
       - Reason: "Exam approaching in [N] days. Immediate focus required."
    2. SLEEP & DOPAMINE CHECK: If Sleep < 6h AND the list contains high-dopamine tasks like "Gaming", "Party", "Video Games", or "Tv", you MUST intervene.
       - Intervention: "Prioritize Sleep"
       - Reason: "Restoration is key for peak performance. Get 7-8 hours tonight!"
    3. If neither applies, return null for intervention.

    RULES FOR INSIGHT:
    - If Sleep > 7h AND Study < 4h: "Your neural capacity is high today. Great day to tackle complex problems."
    - If Sleep < 6h: "Cognitive baseline is low. Focus on recovery and low-effort tasks."
    - If Sleep > 7h AND Study > 4h: "Optimal flow state achieved. Maintain this rhythm."
    - Otherwise: Provide a brief, supportive observation in the style of Dr. K.

    RETURN JSON:
    {
      "intervention": "Task text to ADD" (or null),
      "reason": "Reason for intervention" (or null),
      "insight": "Dashboard insight text"
    }
  `;

  try {
    // Use gemini-3-flash-preview as recommended for text tasks replacing 1.5-flash
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    
    const suggestedTask = parsed.intervention 
      ? createAITask(parsed.intervention, parsed.reason || "Cognitive Optimization") 
      : null;

    return {
      suggestedTask,
      insight: parsed.insight || "Systems nominal. Cognitive rhythm is stable."
    };
  } catch (error: any) {
    console.error("Brain connection failed:", error);
    if (error.message?.includes('429')) {
        return {
            suggestedTask: null,
            insight: "Neural network congested (High Traffic). Operating on local heuristics."
        };
    }
    return {
      suggestedTask: null,
      insight: "Offline mode. Trust your intuition."
    };
  }
}