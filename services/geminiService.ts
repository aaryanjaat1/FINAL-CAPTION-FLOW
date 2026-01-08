
import { GoogleGenAI, Type } from "@google/genai";
import { Caption, AIModel } from "../types";

/**
 * PRODUCTION-READY KEY HANDLING
 * This function retrieves the best available API Key.
 * 1. Checks environment variables (Standard)
 * 2. Checks platform-managed keys (Managed hosting)
 */
const getApiKey = async (): Promise<string> => {
  // 1. Check if key is in process.env
  const envKey = process.env.API_KEY;
  if (envKey && envKey.length > 5) return envKey;

  // 2. Check for Platform-Managed Key Selection (window.aistudio)
  const anyWin = window as any;
  if (anyWin.aistudio) {
    const hasKey = await anyWin.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await anyWin.aistudio.openSelectKey();
        // After dialog, process.env.API_KEY is usually updated by the platform
        return process.env.API_KEY || "";
      } catch (e) {
        console.error("Key selection cancelled or failed");
      }
    }
  }

  return "";
};

export const transcribeVideo = async (
  videoBase64: string, 
  mimeType: string, 
  settings: { language: string; model: AIModel } = { language: 'English', model: 'gemini-3-flash-preview' }
): Promise<Caption[]> => {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error("AI_OFFLINE: Please configure your Gemini API Key in the settings or environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    if (error.message?.includes("entity was not found")) {
        // Platform specific error handling for expired/invalid keys
        const anyWin = window as any;
        if (anyWin.aistudio) await anyWin.aistudio.openSelectKey();
    }
    return [];
  }
};

export const refineCaptionTimings = async (
  videoBase64: string,
  mimeType: string,
  captionsToSync: Caption[]
): Promise<Caption[]> => {
  const apiKey = await getApiKey();
  if (!apiKey) return captionsToSync;

  const ai = new GoogleGenAI({ apiKey });
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
