import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for retry logic
async function generateWithRetry(modelName: string, contents: any[], retries = 3, delay = 2000): Promise<string> {
    try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents
        });
        return response.text || "";
    } catch (error: any) {
        const isQuotaError = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');

        if (isQuotaError && retries > 0) {
            console.warn(`GenAI quota exceeded. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(modelName, contents, retries - 1, delay * 2);
        }
        throw error;
    }
}

// --- 1. VISION/DOC AID (Image/PDF/Text -> Full Reading) ---
export async function generateAudioExplanation(
  file: File, 
  ttsMode: 'browser' | 'gemini'
): Promise<{ text: string, audioData?: string } | null> {
  try {
    let parts: any[] = [];

    if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const textContent = await file.text();
      parts = [
        { text: "You are a reading assistant for the visually impaired. Read the following text content out loud exactly as it is written. Do not summarize. Do not explain. Just read the text content verbatim." },
        { text: textContent }
      ];
    } else {
      const base64Data = await fileToBase64(file);
      const mimeType = file.type || "application/pdf"; 

      parts = [
        { inlineData: { mimeType: mimeType, data: base64Data } },
        { text: "You are a reading assistant. Analyze this document. Extract all the text found in this document and read it out loud exactly as it is written. Do not summarize. Do not add introductory phrases like 'Here is the text'. Read the full content verbatim." }
      ];
    }

    // Use gemini-3-flash-preview instead of 1.5-flash
    const fullText = await generateWithRetry('gemini-3-flash-preview', parts);
    
    return {
      text: fullText || "I couldn't extract text from that document.",
      audioData: undefined // UI will fallback to browser TTS if this is undefined
    };

  } catch (error) {
    console.error("Vision/Doc Aid Error:", error);
    return null;
  }
}

// --- 2. LEXICON AID (Image/PDF -> Semantic HTML) ---
export async function convertToDyslexiaFriendly(file: File): Promise<string> {
  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "application/pdf";

    // Use gemini-3-pro-preview instead of 1.5-pro for complex formatting
    const parts = [
      { inlineData: { mimeType: mimeType, data: base64Data } },
      { text: `
        Analyze this document. Extract the content and format it as clean, semantic HTML.
        
        Rules for Dyslexia-Friendly Output:
        1. Use <h1>, <h2>, <h3> for structure.
        2. Break large text blocks into short paragraphs (<p>).
        3. Use <ul> and <li> for any lists or steps.
        4. Wrap key concepts or important terms in <strong> tags to make them stand out.
        5. Do NOT use <html>, <head>, or <body> tags. Just return the content inside a <div>.
        6. Do NOT summarize. Keep the original meaning but make the structure easier to scan.
        ` 
      }
    ];

    const text = await generateWithRetry('gemini-3-pro-preview', parts);
    return text || "<p>Could not process text.</p>";
  } catch (error) {
    console.error("Lexicon Error:", error);
    return "<p>Error processing document. System traffic is high, please try again.</p>";
  }
}

// --- 3. SERENITY AID (Context -> Grounding Exercise) ---
export async function generateGroundingExercise(context: string): Promise<string[]> {
  try {
    const prompt = `The user is feeling: "${context}". 
      Generate a "5-4-3-2-1" grounding exercise specifically tailored to this situation. 
      Return ONLY 5 short sentences (one for each step 5 down to 1). 
      Example: "Look around and name 5 blue things.", "Touch 4 textures near you."
      Do not add numbering, just the sentences separated by newlines.`;

    const text = await generateWithRetry('gemini-3-flash-preview', [{ text: prompt }]);
    return (text || "").split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    console.error("Serenity Error:", error);
    return [
      "Acknowledge 5 things you see around you.",
      "Acknowledge 4 things you can touch.",
      "Acknowledge 3 things you can hear.",
      "Acknowledge 2 things you can smell.",
      "Acknowledge 1 thing you can taste."
    ];
  }
}

// Helper
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}