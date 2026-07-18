"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { PhotoUpload } from "./PhotoUpload";
import { Mic, Camera, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { cn, formatWeight, type WeightUnit } from "@/lib/utils";
import { Textarea } from "@/components/ui/Input";

type Capture = "audio" | "photo" | null;

interface ExtractedExercise {
  alias: string;
  sets: { reps: number | null; weight_kg: number | null; duration_sec: number | null }[];
}

interface RecordResult {
  rawInputId?: string;
  sessionId: string;
  status: "processed" | "queued";
  extracted?: { exercises: ExtractedExercise[]; intent: string };
}

interface RecordPageProps {
  unit?: WeightUnit;
  onResult?: (result: RecordResult) => void;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20; // ~1 minuto

export function RecordPage({ unit = "kg", onResult }: RecordPageProps) {
  const [capture, setCapture] = useState<Capture>(null);
  const [textInput, setTextInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RecordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const busy = isPending || isUploading;

  async function uploadMedia(blob: Blob, type: "audio" | "image"): Promise<{ storageKey: string; publicUrl: string }> {
    const mimeType = blob.type;
    const presignRes = await fetch(`/api/input/presign?type=${type}&mimeType=${encodeURIComponent(mimeType)}`);
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      throw new Error(typeof presignData.error === "string" ? presignData.error : "Error al obtener URL de subida");
    }
    const { uploadUrl, storageKey, publicUrl } = presignData;
    const putRes = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
    if (!putRes.ok) throw new Error("Error al subir el archivo");
    return { storageKey, publicUrl };
  }

  // Polling del estado cuando el input quedó en cola (audio/imagen via QStash).
  function pollInputStatus(rawInputId: string, attempt = 0) {
    if (attempt >= POLL_MAX_ATTEMPTS) {
      setProcessing(false);
      setError("El procesamiento está tardando más de lo normal. Revisa tu historial en unos minutos.");
      return;
    }
    pollTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/input/${rawInputId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.status === "processed") {
          setProcessing(false);
          const done: RecordResult = {
            rawInputId,
            sessionId: data.sessionId,
            status: "processed",
            extracted: data.extracted ?? undefined,
          };
          setResult(done);
          onResult?.(done);
          return;
        }
        if (data.status === "error") {
          setProcessing(false);
          setError(data.error ?? "No pudimos procesar tu archivo.");
          return;
        }
        pollInputStatus(rawInputId, attempt + 1);
      } catch {
        pollInputStatus(rawInputId, attempt + 1);
      }
    }, POLL_INTERVAL_MS);
  }

  function handleResponse(data: RecordResult) {
    if (data.status === "queued" && data.rawInputId) {
      setProcessing(true);
      pollInputStatus(data.rawInputId);
    } else {
      setResult(data);
      onResult?.(data);
    }
  }

  async function submitText(content: string) {
    setError(null);
    setResult(null);
    const res = await fetch("/api/input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === "string" ? err.error : "Error del servidor");
    }
    return res.json() as Promise<RecordResult>;
  }

  async function handleText(e: React.FormEvent) {
    e.preventDefault();
    if (!textInput.trim()) return;
    startTransition(async () => {
      try {
        const data = await submitText(textInput);
        setTextInput("");
        handleResponse(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    });
  }

  async function handleAudio(transcript: string) {
    if (!transcript.trim()) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const data = await submitText(transcript);
        handleResponse(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al procesar el audio");
      }
    });
  }

  async function handlePhoto(file: File) {
    setError(null);
    setResult(null);
    setIsUploading(true);
    try {
      const { storageKey } = await uploadMedia(file, "image");
      const res = await fetch("/api/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", storageKey, mimeType: file.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err.error === "string" ? err.error : "Error al procesar la imagen");
        return;
      }
      const data = await res.json();
      handleResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar la imagen");
    } finally {
      setIsUploading(false);
    }
  }

  function toggleCapture(next: Exclude<Capture, null>) {
    setCapture((c) => (c === next ? null : next));
    setResult(null);
    setError(null);
  }

  const detectedExercises = result?.extracted?.exercises ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Captura rápida — bento de dos tarjetas, como el diseño de Stitch */}
      <section className="grid grid-cols-2 gap-4">
        <button
          type="button"
          aria-pressed={capture === "audio"}
          onClick={() => toggleCapture("audio")}
          className={cn(
            "bg-white border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-card transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            capture === "audio" ? "border-accent ring-1 ring-accent" : "border-outline-variant/50 hover:border-accent/40"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Mic size={20} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface">Grabar Audio</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">VibeFitAI transcribe tu rutina</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={capture === "photo"}
          onClick={() => toggleCapture("photo")}
          className={cn(
            "bg-white border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-card transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            capture === "photo" ? "border-accent ring-1 ring-accent" : "border-outline-variant/50 hover:border-accent/40"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <Camera size={20} className="text-on-primary-container" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface">Foto del Tablero</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Escanear resultados</p>
          </div>
        </button>
      </section>

      {/* Panel de captura activo */}
      {capture === "audio" && (
        <div className="bg-white border border-outline-variant/50 rounded-2xl p-6 shadow-card animate-fade-in">
          <AudioRecorder onRecorded={handleAudio} disabled={busy} />
        </div>
      )}
      {capture === "photo" && (
        <div className="animate-fade-in">
          <PhotoUpload onSelected={handlePhoto} disabled={busy} uploading={isUploading} />
        </div>
      )}

      {/* Procesamiento en background (audio/imagen en QStash) */}
      {processing && (
        <div className="bg-primary-container/60 border border-primary-container rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Loader2 size={16} className="text-accent animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-on-primary-container">Procesando tu entrenamiento...</p>
            <p className="text-xs text-on-primary-container/70 mt-0.5">La IA está analizando tu archivo. Suele tardar unos segundos.</p>
          </div>
        </div>
      )}

      {/* Ejercicios detectados — tarjeta navy tipo «Sugerencia IA» */}
      {detectedExercises.length > 0 && (
        <div className="relative overflow-hidden bg-primary rounded-2xl p-5 animate-fade-in shadow-lg shadow-primary/15">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/30 blur-3xl rounded-full" />
          <p className="relative text-xs font-semibold text-inverse-primary uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Sparkles size={12} />
            VibeFitAI detectó
          </p>
          <div className="relative flex flex-col gap-2">
            {detectedExercises.map((ex, i) => {
              const setCount = ex.sets.length;
              const firstSet = ex.sets[0];
              const summary = [
                firstSet?.reps ? `${setCount}×${firstSet.reps}` : `${setCount} series`,
                firstSet?.weight_kg ? formatWeight(firstSet.weight_kg, unit, 1) : null,
                firstSet?.duration_sec ? `${Math.round(firstSet.duration_sec / 60)} min` : null,
              ].filter(Boolean).join(" · ");
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{ex.alias}</span>
                  <span className="text-sm font-mono text-inverse-primary">{summary}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error-container/60 border border-error-container rounded-2xl px-4 py-3 animate-fade-in">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Entrada Manual */}
      <form onSubmit={handleText} className="flex flex-col gap-3">
        <span className="text-xs font-medium text-on-surface-variant ml-1">Entrada Manual</span>
        <Textarea
          label="Describe tu entrenamiento"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Ej: 3 series de 10 reps Press de Banca 60kg..."
          rows={4}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !textInput.trim()}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary/15 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isPending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle size={17} />
              Registrar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
