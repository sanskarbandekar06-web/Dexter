
import { GoogleGenAI } from "@google/genai";
import { UserData, Task, Course } from "../types";

// Initialize the Google GenAI SDK using named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BrainAnalysisResult {
  suggestedTask: Task | null;
  insight: string;
}

// Helper function to create the AI task object
function createAITask(text: string, reason: string): Task {
  return {
    id: Date.now().toString(), // Ensure string ID for consistency
    text: text,
    done: false,
    isAI: true,
    aiReason: reason
  };
}

export async function consultTheBrain(
  metrics: UserData,
  courses: Course[], // Now using real courses instead of mock events
  tasks: Task[],
  journalEntry: { text: string; mood: string } | null,
  userName: string
): Promise<BrainAnalysisResult> {
  
  // 1. Analyze Academic Pressure from Strategy Map
  const now = new Date();
  const upcomingExams = courses.flatMap(c => c.exams).filter(e => {
    const examDate = new Date(e.date);
    return examDate >= now && examDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).map(e => {
    const diffTime = new Date(e.date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${e.title} in ${diffDays} days`;
  });

  const examsContext = upcomingExams.length > 0 ? upcomingExams.join(", ") : "No immediate exams";
  const currentTasks = tasks.map(t => t.text).join(", ");
  
  // 2. Journal Context
  const journalContext = journalEntry 
    ? `Latest Journal (${journalEntry.mood}): "${journalEntry.text.substring(0, 100)}..."` 
    : "No recent journal entry";

  const prompt = `
    You are Dexter, a Solarpunk cognitive optimizer.
    
    USER STATE:
    - Name: ${userName}
    - Sleep: ${metrics.sleep}h (Target: 7h+)
    - Study: ${metrics.study}h (Target: 4h+)
    - Screen Time: ${metrics.screenTime}h (Target: <4h)
    - Academic Pressure: ${examsContext}
    - Internal State: ${journalContext}
    - Current Tasks: ${currentTasks || "Empty"}

    GOAL:
    Provide a holistic task suggestion to balance performance and well-being.
    
    LOGIC:
    1. BURNOUT CHECK: If (Sleep < 6 OR Screen Time > 6 OR Journal is 'anxious'/'burnout'), suggest RECOVERY (e.g., "15m Nature Walk", "No-Screen Break").
    2. ACADEMIC URGENCY: If there are exams in < 3 days AND no study task exists, suggest DEEP WORK (e.g., "Review [Subject] Notes").
    3. MOMENTUM: If Sleep > 7 and Study > 4, suggest a CHALLENGE (e.g., "Advanced Problem Set").
    4. DEFAULT: Suggest a small clarity task (e.g., "Clear Desk", "Plan Tomorrow").

    OUTPUT JSON:
    {
      "intervention": "Short Task Name (Max 5 words)",
      "reason": "1 sentence explanation (Max 10 words)",
      "insight": "1 sentence observation about their balance."
    }
  `;

  try {
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    
    const suggestedTask = parsed.intervention 
      ? createAITask(parsed.intervention, parsed.reason || "Optimization") 
      : null;

    return {
      suggestedTask,
      insight: parsed.insight || "Cognitive rhythm stable."
    };
  } catch (error: any) {
    console.error("Brain connection failed:", error);
    return {
      suggestedTask: null,
      insight: "Offline mode. Operating on local heuristics."
    };
  }
}
