import { describe, it, expect } from "vitest";
import { extractWorkoutLocal } from "./extract-workout-local";

describe("extractWorkoutLocal", () => {
  it("extrae series, reps y peso de un registro típico", () => {
    const r = extractWorkoutLocal("hice 4 series de 10 en press banca con 80 kilos");
    expect(r.intent).toBe("log");
    expect(r.exercises).toHaveLength(1);
    expect(r.exercises[0].canonical).toBe("bench_press");
    expect(r.exercises[0].sets).toHaveLength(4);
    expect(r.exercises[0].sets[0]).toMatchObject({ reps: 10, weight_kg: 80 });
  });

  it("entiende el formato NxM", () => {
    const r = extractWorkoutLocal("sentadilla 3x12 con 100kg");
    expect(r.exercises[0].canonical).toBe("squat");
    expect(r.exercises[0].sets).toHaveLength(3);
    expect(r.exercises[0].sets[0]).toMatchObject({ reps: 12, weight_kg: 100 });
  });

  it("convierte libras a kilos", () => {
    const r = extractWorkoutLocal("press banca 5 reps con 100 libras");
    expect(r.exercises[0].sets[0].weight_kg).toBeCloseTo(45.36, 1);
  });

  it("extrae duración y distancia de cardio", () => {
    // Nota: " y " es separador de segmentos, así que duración y distancia
    // deben venir en el mismo segmento para asociarse al mismo ejercicio.
    const r = extractWorkoutLocal("corrí en la cinta 20 minutos 3 km");
    expect(r.exercises[0].canonical).toBe("treadmill");
    expect(r.exercises[0].sets[0].duration_sec).toBe(1200);
    expect(r.exercises[0].sets[0].distance_m).toBe(3000);
  });

  it("separa múltiples ejercicios en una frase", () => {
    const r = extractWorkoutLocal("press banca 3x10 con 80kg, sentadilla 4x8 con 100kg");
    expect(r.exercises).toHaveLength(2);
    expect(r.exercises.map((e) => e.canonical)).toEqual(["bench_press", "squat"]);
  });

  it("detecta intent query en preguntas", () => {
    const r = extractWorkoutLocal("¿cuánto levanté la última vez en sentadilla?");
    expect(r.intent).toBe("query");
    expect(r.exercises).toHaveLength(0);
    expect(r.query).toBeTruthy();
  });

  it("detecta intent end_session", () => {
    for (const msg of ["terminé", "listo", "fin"]) {
      expect(extractWorkoutLocal(msg).intent).toBe("end_session");
    }
  });

  it("detecta intent correction", () => {
    const r = extractWorkoutLocal("corrijo, era con 85 kilos");
    expect(r.intent).toBe("correction");
  });

  it("devuelve unknown si no hay nada extraíble", () => {
    const r = extractWorkoutLocal("hola qué tal todo bien");
    expect(r.intent).toBe("unknown");
    expect(r.exercises).toHaveLength(0);
    expect(r.raw_message).toBe("hola qué tal todo bien");
  });
});
