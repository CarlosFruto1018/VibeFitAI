import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // Whisper accepts these formats; WebM/Opus from browsers works natively
  const extension = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4") || mimeType.includes("m4a")
    ? "m4a"
    : mimeType.includes("ogg")
    ? "ogg"
    : "wav";

  const file = new File([new Uint8Array(audioBuffer)], `audio.${extension}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
    prompt:
      "Registro de entrenamiento físico. Pueden mencionarse ejercicios, series, repeticiones, kilos, pesos, press banca, sentadilla, peso muerto, dominadas, curl, remo, etc.",
  });

  return response.text.trim();
}
