
import { GoogleGenAI, Type } from "@google/genai";
import { Caption, AIModel } from "../types";

/**
 * PRODUCTION NOTE:
 * To hide your API_KEY from users, you should call a backend proxy 
 * (like a Supabase Edge Function) instead of calling GoogleGenAI directly here.
 * For this demo, we use the environment variable, but for cPanel, 
 * you'd move this logic to the server side.
 */

export const transcribeVideo = async (
  videoBase64: string, 
  mimeType: string, 
  settings: { language: string; model: AIModel } = { language: 'English', model: 'gemini-3-flash-preview' }
): Promise<Caption[]> => {
  // Creating instance right before call as per guidelines for key safety
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Transcribe audio to ${settings.language} captions. 
  Rules: Punchy segments (max 3 words), zero gaps, synced to millisecond.
  Return JSON array only: [{"id": string, "startTime": number, "endTime": number, "text": string}]`;

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: videoBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              startTime: { type: Type.NUMBER },
              endTime: { type: Type.NUMBER },
              text: { type: Type.STRING },
            },
            required: ["id", "startTime", "endTime", "text"]
          }
        },
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Transcription failed", error);
    // Log this to your Admin Panel via a 'logs' table in Supabase
    return [];
  }
};

export const refineCaptionTimings = async (
  videoBase64: string,
  mimeType: string,
  captionsToSync: Caption[]
): Promise<Caption[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Refine timings for these captions. Do not change text. 
  Captions: ${JSON.stringify(captionsToSync)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: videoBase64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return captionsToSync;
  }
};
