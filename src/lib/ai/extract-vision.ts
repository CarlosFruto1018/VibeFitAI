import { z } from "zod";
import { aiVision, aiAvailable } from "./gateway";

export const VisionExtractionSchema = z.object({
  image_type: z.enum([
    "gym_machine",
    "cardio_display",
    "smartwatch",
    "barbell_plates",
    "workout_sheet",
    "progress_selfie",
    "other",
  ]),
  exercises: z
    .array(
      z.object({
        canonical: z.string(),
        sets: z.array(
          z.object({
            reps: z.number().nullable(),
            weight_kg: z.number().nullable(),
            duration_sec: z.number().nullable(),
            distance_m: z.number().nullable(),
          })
        ),
      })
    )
    .default([]),
  session_metrics: z
    .object({
      duration_min: z.number().nullable(),
      calories: z.number().nullable(),
      heart_rate_avg: z.number().nullable(),
      heart_rate_max: z.number().nullable(),
      distance_m: z.number().nullable(),
      speed_kmh: z.number().nullable(),
    })
    .partial()
    .default({}),
  description: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type VisionExtraction = z.infer<typeof VisionExtractionSchema>;

export async function extractFromImage(
  imageBase64: string,
  mimeType: string
): Promise<VisionExtraction> {
  if (!aiAvailable()) {
    return {
      image_type: "other",
      exercises: [],
      session_metrics: {},
      description: "API Key de Gemini no configurada",
      confidence: "low",
    };
  }

  const prompt = `Analiza esta imagen de entrenamiento físico y extrae información estructurada.
Identifica el tipo de imagen y extrae todos los datos visibles (pesos, series, repeticiones, tiempo, distancia, calorías, ritmo cardíaco, velocidad).
Si es una pantalla de máquina cardio, reloj inteligente o hoja de entrenamiento, lee todos los números visibles.
Si es una foto de discos/barras, estima el peso total si es posible.

Devuelve SOLO JSON válido con este esquema:
{
  "image_type": "gym_machine"|"cardio_display"|"smartwatch"|"barbell_plates"|"workout_sheet"|"progress_selfie"|"other",
  "exercises": [{"canonical": "snake_case_name", "sets": [{"reps":n|null,"weight_kg":n|null,"duration_sec":n|null,"distance_m":n|null}]}],
  "session_metrics": {"duration_min":n|null,"calories":n|null,"heart_rate_avg":n|null,"heart_rate_max":n|null,"distance_m":n|null,"speed_kmh":n|null},
  "description": "descripción breve de lo que se ve",
  "confidence": "high"|"medium"|"low"
}`;

  const text = await aiVision(imageBase64, mimeType, prompt);

  if (!text) {
    return {
      image_type: "other",
      exercises: [],
      session_metrics: {},
      description: "No se pudo extraer información estructurada",
      confidence: "low",
    };
  }

  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\})/);
    const raw = jsonMatch ? jsonMatch[1] : text;
    return VisionExtractionSchema.parse(JSON.parse(raw));
  } catch {
    return {
      image_type: "other",
      exercises: [],
      session_metrics: {},
      description: "No se pudo parsear la respuesta",
      confidence: "low",
    };
  }
}
