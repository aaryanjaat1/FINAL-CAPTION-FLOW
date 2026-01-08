
import { GoogleGenAI, Type } from "@google/genai";
import { Caption, AIModel } from "../types";

export const transcribeVideo = async (
  videoBase64: string, 
  mimeType: string, 
  settings: { language: string; model: AIModel } = { language: 'English', model: 'gemini-3-flash-preview' }
): Promise<Caption[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Transcribe the audio from this ${mimeType.includes('audio') ? 'audio' : 'video'} file into ${settings.language} captions. 
  Follow these strict rules:
  1. Break captions into small, punchy phrases.
  2. Return ONLY a JSON array of objects.
  3. Each object must have: "id" (string), "startTime" (number, seconds), "endTime" (number, seconds), and "text" (string).
  4. Ensure timing is accurate to the speech.`;

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
