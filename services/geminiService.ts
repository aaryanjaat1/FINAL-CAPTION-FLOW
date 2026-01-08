
import { GoogleGenAI, Type } from "@google/genai";
import { Caption, AIModel } from "../types";

/**
 * AI KEY DISCOVERY SERVICE
 */
export const getApiKey = async (): Promise<string> => {
  // 1. Check Platform Master Key (Set via Admin Dashboard)
  const platformKey = localStorage.getItem('CF_PLATFORM_API_KEY');
  if (platformKey && platformKey.length > 10) return platformKey;

  // 2. Check Individual User Key (Set via User Settings)
  const userKey = localStorage.getItem('CF_AI_KEY');
  if (userKey && userKey.length > 10) return userKey;

  // 3. Check Environment
  const envKey = process.env.API_KEY;
  if (envKey && envKey.length > 5) return envKey;

  // 4. Check for Platform-Managed Key Selection
  const anyWin = window as any;
  if (anyWin.aistudio) {
    try {
      const hasKey = await anyWin.aistudio.hasSelectedApiKey();
      if (hasKey) return process.env.API_KEY || "";
    } catch (e) {}
  }

  return "";
};

export const savePlatformKey = (key: string) => {
  if (key && key.startsWith('AIza')) {
    localStorage.setItem('CF_PLATFORM_API_KEY', key);
    return true;
  }
  return false;
};

export const saveApiKey = (key: string) => {
  if (key && key.startsWith('AIza')) {
    localStorage.setItem('CF_AI_KEY', key);
    return true;
  }
  return false;
};

export const clearApiKey = () => {
  localStorage.removeItem('CF_AI_KEY');
  localStorage.removeItem('CF_PLATFORM_API_KEY');
};

/**
 * Validates the API key by performing a simple model query
 */
export const testApiKey = async (key: string): Promise<boolean> => {
  if (!key || !key.startsWith('AIza')) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Respond with 'ok' only.",
      config: { maxOutputTokens: 5 }
    });
    return response.text?.toLowerCase().includes('ok') || false;
  } catch (err) {
    console.error("API Key Test Failed", err);
    return false;
  }
};

export const transcribeVideo = async (
  videoBase64: string, 
  mimeType: string, 
  settings: { language: string; model: AIModel } = { language: 'English', model: 'gemini-3-flash-preview' }
): Promise<Caption[]> => {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error("KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Transcribe audio to ${settings.language} captions. 
  Rules: Segments (max 3 words), zero gaps, synced to millisecond.
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
    if (error.message?.includes("API key not valid")) {
      clearApiKey();
      throw new Error("KEY_INVALID");
    }
    throw error;
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
