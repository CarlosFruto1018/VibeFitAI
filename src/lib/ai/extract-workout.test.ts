import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock del gateway de IA para controlar la respuesta del modelo.
vi.mock("./gateway", () => ({
  aiAvailable: vi.fn(),
  aiComplete: vi.fn(),
}));

import { extractWorkoutData } from "./extract-workout";
import { aiAvailable, aiComplete } from "./gateway";
import type { UserContext } from "@/lib/memory/user-context";

const ctx: UserContext = {
  preferredUnits: "kg",
  frequentExercises: [],
  lastLoads: {},
  personalRecords: {},
  fitnessLevel: "intermediate",
};

const validPayload = {
  intent: "log",
  exercises: [
    {
      alias: "press banca",
      canonical: "bench_press",
      sets: [{ reps: 10, weight_kg: 80, duration_sec: null, distance_m: null, rpe: null }],
      notes: null,
    },
  ],
  session_metrics: { duration_min: null, calories: null, heart_rate_avg: null },
  query: null,
  raw_message: null,
};

describe("extractWorkoutData", () => {
  beforeEach(() => {
    vi.mocked(aiAvailable).mockReturnValue(true);
    vi.mocked(aiComplete).mockReset();
  });

  it("parsea la respuesta JSON del modelo", async () => {
    vi.mocked(aiComplete).mockResolvedValue(JSON.stringify(validPayload));
    const r = await extractWorkoutData("press banca 1x10 80kg", ctx);
    expect(r.intent).toBe("log");
    expect(r.exercises[0].canonical).toBe("bench_press");
  });

  it("parsea JSON envuelto en bloque de código markdown", async () => {
    vi.mocked(aiComplete).mockResolvedValue("```json\n" + JSON.stringify(validPayload) + "\n```");
    const r = await extractWorkoutData("press banca 1x10 80kg", ctx);
    expect(r.exercises).toHaveLength(1);
  });

  it("cae al extractor local si el modelo devuelve JSON inválido", async () => {
    vi.mocked(aiComplete).mockResolvedValue("esto no es JSON {rompido");
    const r = await extractWorkoutData("sentadilla 3x10 con 100kg", ctx);
    // El fallback local sí entiende el mensaje.
    expect(r.intent).toBe("log");
    expect(r.exercises[0].canonical).toBe("squat");
  });

  it("cae al extractor local si el JSON no cumple el schema", async () => {
    vi.mocked(aiComplete).mockResolvedValue(JSON.stringify({ intent: "algo_invalido" }));
    const r = await extractWorkoutData("terminé", ctx);
    expect(r.intent).toBe("end_session");
  });

  it("usa el extractor local directamente si la IA no está disponible", async () => {
    vi.mocked(aiAvailable).mockReturnValue(false);
    const r = await extractWorkoutData("peso muerto 2x5 con 140kg", ctx);
    expect(aiComplete).not.toHaveBeenCalled();
    expect(r.exercises[0].canonical).toBe("deadlift");
  });
});
