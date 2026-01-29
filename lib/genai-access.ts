
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK using named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for retry logic
async function generateWithRetry(modelName: string, contents: any[], retries = 2, delay = 1500): Promise<string> {
    try {
        const response = await ai.models.generateContent({
          model: modelName,
          // Correctly wrap multiple parts in a parts object for multi-part content
          contents: { parts: contents }
        });
        return response.text || "";
    } catch (error: any) {
        const isQuotaError = error.status === 429 || error.message?.includes('429');
        if (isQuotaError && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(modelName, contents, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function generateAudioExplanation(file: File): Promise<{ text: string }> {
  if (!process.env.API_KEY) return { text: "API Key missing." };
  try {
    let parts: any[] = [];
    if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const textContent = await file.text();
      parts = [{ text: "Read this verbatim for the visually impaired. No intro, no summary: " + textContent }];
    } else {
      const base64Data = await fileToBase64(file);
      parts = [
        { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } },
        { text: "Extract and read the full text verbatim. No commentary." }
      ];
    }
    const text = await generateWithRetry('gemini-3-flash-preview', parts);
    return { text: text || "Extraction failed." };
  } catch (error: any) {
    return { text: `Error: ${error.message}` };
  }
}

export async function convertToDyslexiaFriendly(file: File): Promise<string> {
  if (!process.env.API_KEY) return "API Key missing.";
  try {
    const base64Data = await fileToBase64(file);
    const parts = [
      { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } },
      { text: "Convert this to clean semantic HTML for a dyslexia-friendly reader. Use <h1>, <p>, and <ul>. Use <strong> for core concepts. Be concise." }
    ];
    return await generateWithRetry('gemini-3-flash-preview', parts);
  } catch (error: any) {
    return `<p>Error: ${error.message}</p>`;
  }
}

// THE THERAPIST (Panic Button)
export async function generateCrisisSupport(context: string): Promise<string> {
  if (!process.env.API_KEY) return "Brain offline.";
  try {
    const prompt = `You are a warm, empathetic student counselor. The user says: "${context}". 
      Provide immediate, deeply comforting advice (CBT-style). 
      Give 2-3 specific life advice steps to solve their immediate overwhelm. 
      Speak directly to them ("I hear you", "We can do this"). 
      Max 100 words. Be powerful and concise.`;
    return await generateWithRetry('gemini-3-flash-preview', [{ text: prompt }]);
  } catch (error) {
    return "I'm here for you. Take a deep breath. Focus on one small thing you can control right now.";
  }
}

// ACTION AID (ADHD Task Breakdown)
export async function generateTaskBreakdown(goal: string): Promise<string[]> {
  if (!process.env.API_KEY) return ["API Key missing."];
  try {
    const prompt = `The user has ADHD paralysis for the goal: "${goal}". 
      Break this into exactly 5 micro-steps. Each step must be so small it feels trivial.
      Example: "Pick up the pen", "Write one word".
      Return only the 5 steps separated by newlines. Max 10 words per step.`;
    const text = await generateWithRetry('gemini-3-flash-preview', [{ text: prompt }]);
    return text.split('\n').filter(l => l.trim().length > 0).slice(0, 5);
  } catch (error) {
    return ["Open your workspace.", "Sit down.", "Look at the material.", "Set a 5-min timer.", "Start one tiny part."];
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
}
