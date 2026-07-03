import { describe, it, expect } from "vitest";
import { SessionPatchSchema } from "./validation";

describe("SessionPatchSchema", () => {
  it("acepta status válido", () => {
    expect(SessionPatchSchema.safeParse({ status: "closed" }).success).toBe(true);
    expect(SessionPatchSchema.safeParse({ status: "active" }).success).toBe(true);
  });

  it("acepta summaryText solo", () => {
    expect(SessionPatchSchema.safeParse({ summaryText: "Buena sesión" }).success).toBe(true);
  });

  it("rechaza status arbitrario", () => {
    expect(SessionPatchSchema.safeParse({ status: "hacked" }).success).toBe(false);
  });

  it("rechaza body vacío (ningún campo)", () => {
    expect(SessionPatchSchema.safeParse({}).success).toBe(false);
  });

  it("ignora campos extra no permitidos", () => {
    const r = SessionPatchSchema.safeParse({ status: "closed", userId: "otro-usuario" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect("userId" in r.data).toBe(false);
    }
  });

  it("rechaza summaryText demasiado largo", () => {
    expect(SessionPatchSchema.safeParse({ summaryText: "x".repeat(2001) }).success).toBe(false);
  });
});
