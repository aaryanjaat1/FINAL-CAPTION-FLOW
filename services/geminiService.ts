
import { GoogleGenAI, Type } from "@google/genai";
import { Caption, AIModel } from "../types";

export const transcribeVideo = async (
  videoBase64: string, 
  mimeType: string, 
  settings: { language: string; model: AIModel } = { language: 'English', model: 'gemini-3-flash-preview' }
): Promise<Caption[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Transcribe the audio from this file into ${settings.language} captions for viral social media content.
  STRICT TIMING RULES:
  1. MICRO-TIMING: Synchronize EVERY word to the exact millisecond of phonation. The "startTime" must be the absolute start of the first syllable, and "endTime" must be the absolute end of the last syllable.
  2. GRANULARITY: Break captions into short, punchy segments (max 3 words). 
  3. SEAMLESSNESS: Ensure ZERO gaps between consecutive captions unless there is a significant pause (>300ms) in speech.
  4. ACCURACY: If the speaker talks fast, shorten the segments to maintain readability.
  5. Return ONLY a JSON array of objects.
  6. Format: [{"id": string, "startTime": number, "endTime": number, "text": string}]`;

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: videoBase64
            }
          },
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

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const result = JSON.parse(text);
    return result;
  } catch (error: any) {
    console.error("Gemini Transcription failed:", error);
    return [
      { id: '1', startTime: 0.5, endTime: 3.5, text: "Transcription processing error." },
      { id: '2', startTime: 4.0, endTime: 7.0, text: "Check file and try again." }
    ];
  }
};
