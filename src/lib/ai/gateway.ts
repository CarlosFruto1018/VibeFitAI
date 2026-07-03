import { GoogleGenAI } from "@google/genai";
import { logger } from "@/lib/logger";

const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("...")) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
}

export function aiAvailable(): boolean {
  return getClient() !== null;
}

async function tryModels<T>(
  fn: (ai: GoogleGenAI, model: string) => Promise<T | null>
): Promise<T | null> {
  const ai = getClient();
  if (!ai) return null;

  let lastError: unknown = null;

  for (const model of MODELS) {
    try {
      const result = await fn(ai, model);
      if (result !== null) return result;
    } catch (err) {
      logger.warn("gateway", `Modelo ${model} falló, probando el siguiente`, err);
      lastError = err;
    }
  }

  if (lastError) logger.error("gateway", "Todos los modelos fallaron", lastError);
  return null;
}

export async function aiComplete(system: string, user: string): Promise<string> {
  const result = await tryModels(async (ai, model) => {
    const res = await ai.models.generateContent({
      model,
      contents: user,
      config: { systemInstruction: system, temperature: 0.7 },
    });
    return res?.text ?? null;
  });
  return result ?? "";
}

export async function aiVision(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const result = await tryModels(async (ai, model) => {
    const res = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
      config: { temperature: 0.1 },
    });
    return res?.text ?? null;
  });
  return result ?? "";
}

export async function aiTranscribe(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const result = await tryModels(async (ai, model) => {
    const res = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: audioBuffer.toString("base64") } },
          {
            text: "Transcribe este audio de registro de entrenamiento físico en español. Devuelve solo la transcripción textual, sin comentarios adicionales.",
          },
        ],
      },
      config: { temperature: 0 },
    });
    return res?.text?.trim() ?? null;
  });
  return result ?? "";
}
