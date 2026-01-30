
import { GoogleGenAI } from "@google/genai";
import { UserData, Task, Course } from "../types";

// Initialize the Google GenAI SDK using named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BrainAnalysisResult {
  suggestedTask: Task | null;
  insight: string;
}

interface ScheduleResult {
  schedule: Task[];
  advice: string;
}

// Helper function to create the AI task object
function createAITask(text: string, reason: string, pillar: 'academics' | 'recovery' | 'vitality' | 'digital' = 'academics'): Task {
  return {
    id: Date.now() + Math.random(), // Ensure unique ID
    text: text,
    done: false,
    isAI: true,
    aiReason: reason,
    pillar: pillar
  };
}

export async function generateHolisticSchedule(
  energyLevel: string,
  wakeTime: string,
  priorities: string[],
  courses: Course[],
  userName: string
): Promise<ScheduleResult> {
  
  const upcomingExams = courses.flatMap(c => c.exams.map(e => `${e.title} (${c.name})`)).join(", ");

  const prompt = `
    You are a Circadian Rhythm Architect & Cognitive Psychologist. 
    User: ${userName}. 
    Current Energy (Spoon Theory): ${energyLevel}.
    Wake Up Time: ${wakeTime}.
    User Priorities: ${priorities.join(", ")}.
    Academic Context: ${upcomingExams}.

    GOAL: Create a "Holistic Daily Schedule" adhering to Self-Determination Theory (SDT).
    
    RULES:
    1. **Autonomy (Flexible Buckets):** Do NOT use rigid timestamps like "9:00 AM". Use "Phase" buckets (e.g., "Morning Peak", "Afternoon Dip", "Evening Reset").
    2. **Competence (Small Wins):** Break the User Priorities into MICRO-TASKS. If priority is "Study Math", generate "Do 3 Calc Problems".
    3. **Relatedness (Parallel Play):** Include 1 task for social connection (e.g., "Study at library with friend", "Call mom", "Co-working session").
    4. **Circadian Optimization:** 
       - High energy tasks approx 2-4 hours after wake time.
       - Low energy/creative tasks in the afternoon slump.
       - No heavy cognition in the evening.

    OUTPUT JSON FORMAT:
    {
      "tasks": [
        { "text": "Task Name", "reason": "Why this fits here (Circadian/SDT)", "pillar": "academics" | "recovery" | "vitality" | "digital" }
      ],
      "advice": "A short, motivating summary of the day's flow."
    }
    Return ONLY valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    
    const schedule = (parsed.tasks || []).map((t: any) => createAITask(t.text, t.reason, t.pillar));

    return {
      schedule,
      advice: parsed.advice || "Your rhythm is set. Flow with it."
    };
  } catch (error: any) {
    console.error("Schedule generation failed:", error);
    return {
      schedule: [],
      advice: "Connection interrupted. Focus on one small thing for now."
    };
  }
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

  // RESEARCH-BASED PROMPT: Empathetic JITAI (Just-in-Time Adaptive Intervention)
  const prompt = `
    You are Dexter, a "Digital Sanctuary" wellness engine. Your goal is NOT maximizing output, but scaffolding executive function and regulating the user's nervous system.
    
    USER BIOMETRICS (Passive Sensing):
    - Name: ${userName}
    - Sleep: ${metrics.sleep}h (Sanctuary Baseline: 7h)
    - Deep Work: ${metrics.study}h (Capacity: 4h)
    - Digital Strain: ${metrics.screenTime}h (Threshold: 6h)
    - Academic Load: ${examsContext}
    - Internal State: ${journalContext}
    - Current Queue: ${currentTasks || "Empty"}

    PROTOCOL (Self-Determination Theory):
    1. BURNOUT DETECTION (Safety): If Sleep < 6 OR Screen Time > 6 OR Journal indicates anxiety, trigger a "Restorative Intervention". Suggest low-dopamine recovery (e.g., "Step outside for 5m", "Drink water", "20s Eye Break"). Do NOT suggest work.
    2. SCAFFOLDING (Competence): If Academic Load is high but Deep Work is 0, provide a "Micro-Step". Break the barrier to entry (e.g., "Open the textbook", "Read just 1 page").
    3. FLOW STATE (Autonomy): If biometrics are good (Sleep > 7, Screen Time < 4), suggest a "Deep Dive" or "Creative Challenge".
    4. TONE: Warm, grounding, and non-judgmental. Use "Calm Technology" language (e.g., "Restore," "Align," "Nourish"). Avoid "Grind," "Hustle," or punitive language.

    OUTPUT JSON:
    {
      "intervention": "Short Task Name (Max 5 words)",
      "reason": "1 sentence validating the user's state (Max 15 words)",
      "insight": "1 calming observation about their rhythm."
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
      ? createAITask(parsed.intervention, parsed.reason || "Alignment") 
      : null;

    return {
      suggestedTask,
      insight: parsed.insight || "Sanctuary state nominal."
    };
  } catch (error: any) {
    console.error("Brain connection failed:", error);
    return {
      suggestedTask: null,
      insight: "Offline mode. Focus on breath."
    };
  }
}
