import { z } from "zod";
import type { UserContext } from "@/lib/memory/user-context";
import { aiComplete, aiAvailable } from "./gateway";

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------
export const ExtractedSetSchema = z.object({
  reps: z.number().int().nullable(),
  weight_kg: z.number().nullable(),
  duration_sec: z.number().int().nullable(),
  distance_m: z.number().nullable(),
  rpe: z.number().nullable(),
});

export const ExtractedExerciseSchema = z.object({
  alias: z.string(),
  canonical: z.string(),
  sets: z.array(ExtractedSetSchema),
  notes: z.string().nullable(),
});

export const ExtractedWorkoutSchema = z.object({
  intent: z.enum(["log", "query", "correction", "end_session", "unknown"]),
  exercises: z.array(ExtractedExerciseSchema),
  session_metrics: z.object({
    duration_min: z.number().int().nullable(),
    calories: z.number().int().nullable(),
    heart_rate_avg: z.number().int().nullable(),
  }),
  query: z.string().nullable(),
  raw_message: z.string().nullable(),
});

export type ExtractedWorkout = z.infer<typeof ExtractedWorkoutSchema>;

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------
import { extractWorkoutLocal } from "./extract-workout-local";

export async function extractWorkoutData(
  input: string,
  userCtx: UserContext
): Promise<ExtractedWorkout> {
  if (!aiAvailable()) {
    return extractWorkoutLocal(input);
  }

  const systemPrompt = buildSystemPrompt(userCtx);
  const text = await aiComplete(systemPrompt, input);

  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(raw);
    return ExtractedWorkoutSchema.parse(parsed);
  } catch {
    // LLM returned something unparseable — fall back to local extractor
    return extractWorkoutLocal(input);
  }
}

function buildSystemPrompt(ctx: UserContext): string {
  return `Eres un asistente especializado en fitness. Extraes datos estructurados de registros de entrenamiento.
El usuario habla en español. Puede usar nombres coloquiales o abreviaturas.

Aliases comunes (usa el canonical correspondiente):
- "press plano", "banca", "bench" → bench_press
- "press inclinado" → incline_bench_press
- "sentadilla", "squat", "cuclillas" → squat
- "peso muerto", "deadlift", "pd" → deadlift
- "dominadas", "pull-up", "jalón" → pull_up
- "remo con barra", "remo" → barbell_row
- "press militar", "hombros", "press hombro" → overhead_press
- "curl bíceps", "curl" → bicep_curl
- "fondos", "dips" → tricep_dip
- "hip thrust", "empuje cadera" → hip_thrust
- "cinta", "correr", "trotadora" → treadmill
- "elíptica" → elliptical
- "bicicleta", "bike" → stationary_bike

Ejercicios frecuentes del usuario: ${ctx.frequentExercises.join(", ") || "desconocidos aún"}
Últimas cargas registradas: ${JSON.stringify(ctx.lastLoads)}
Unidades preferidas: ${ctx.preferredUnits}

IMPORTANTE: Devuelve SOLO un objeto JSON válido con este esquema exacto:
{
  "intent": "log" | "query" | "correction" | "end_session" | "unknown",
  "exercises": [
    {
      "alias": "cómo lo dijo el usuario",
      "canonical": "nombre_en_snake_case",
      "sets": [
        { "reps": número|null, "weight_kg": número|null, "duration_sec": número|null, "distance_m": número|null, "rpe": número|null }
      ],
      "notes": "notas adicionales o null"
    }
  ],
  "session_metrics": { "duration_min": número|null, "calories": número|null, "heart_rate_avg": número|null },
  "query": "si intent=query, la pregunta exacta reformulada, sino null",
  "raw_message": null
}

Ejemplos:
- "hice 4 series de 10 en press banca con 80 kilos" → intent: log, canonical: bench_press, sets: [{reps:10,weight_kg:80}×4]
- "¿cuánto levanté la última vez en sentadilla?" → intent: query
- "terminé" o "listo" o "fin" → intent: end_session`;
}
