import { describe, it, expect } from "vitest";
import { SessionPatchSchema, uploadExtensionFor, isOwnedStorageKey } from "./validation";

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

describe("uploadExtensionFor", () => {
  it("acepta MIME de la allowlist", () => {
    expect(uploadExtensionFor("image", "image/jpeg")).toBe("jpg");
    expect(uploadExtensionFor("audio", "audio/webm")).toBe("webm");
  });

  it("ignora parámetros codecs de MediaRecorder", () => {
    expect(uploadExtensionFor("audio", "audio/webm;codecs=opus")).toBe("webm");
    expect(uploadExtensionFor("audio", "AUDIO/WEBM; codecs=opus")).toBe("webm");
  });

  it("rechaza MIME peligrosos o fuera de la allowlist", () => {
    expect(uploadExtensionFor("image", "text/html")).toBeNull();
    expect(uploadExtensionFor("image", "application/javascript")).toBeNull();
    expect(uploadExtensionFor("image", "image/svg+xml")).toBeNull();
    expect(uploadExtensionFor("audio", "image/png")).toBeNull();
  });
});

describe("isOwnedStorageKey", () => {
  const uid = "3f2b8c1d-aaaa-bbbb-cccc-1234567890ab";

  it("acepta una key propia con el formato del presign", () => {
    expect(isOwnedStorageKey(`${uid}/image/1760000000000-Ab_9xY-z.jpg`, uid, "image")).toBe(true);
  });

  it("rechaza keys de otro usuario", () => {
    expect(isOwnedStorageKey("otro-usuario/image/1-abc.jpg", uid, "image")).toBe(false);
  });

  it("rechaza tipo distinto al declarado", () => {
    expect(isOwnedStorageKey(`${uid}/audio/1-abc.webm`, uid, "image")).toBe(false);
  });

  it("rechaza path traversal y caracteres raros", () => {
    expect(isOwnedStorageKey(`${uid}/image/../secreto.jpg`, uid, "image")).toBe(false);
    expect(isOwnedStorageKey(`${uid}/image/a/b.jpg`, uid, "image")).toBe(false);
    expect(isOwnedStorageKey(`${uid}/image/x.jpg?x=1`, uid, "image")).toBe(false);
  });
});
