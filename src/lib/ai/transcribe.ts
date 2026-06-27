import { aiTranscribe } from "./gateway";

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  return aiTranscribe(audioBuffer, mimeType);
}
