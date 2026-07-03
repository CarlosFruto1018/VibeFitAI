"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { PhotoUpload } from "./PhotoUpload";
import { Mic, Type, Camera, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Tab = "text" | "audio" | "photo";

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
  onResult?: (result: RecordResult) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "text", label: "Texto", icon: <Type size={14} /> },
  { id: "audio", label: "Voz", icon: <Mic size={14} /> },
  { id: "photo", label: "Foto", icon: <Camera size={14} /> },
];

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20; // ~1 minuto

export function RecordPage({ onResult }: RecordPageProps) {
  const [tab, setTab] = useState<Tab>("text");
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
      const { storageKey, publicUrl: storageUrl } = await uploadMedia(file, "image");
      const res = await fetch("/api/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", storageUrl, storageKey, mimeType: file.type }),
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

  const detectedExercises = result?.extracted?.exercises ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Tab selector */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setResult(null); setError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Procesamiento en background (audio/imagen en QStash) */}
      {processing && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Loader2 size={16} className="text-sky-500 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-sky-700">Procesando tu entrenamiento...</p>
            <p className="text-xs text-sky-500 mt-0.5">La IA está analizando tu archivo. Suele tardar unos segundos.</p>
          </div>
        </div>
      )}

      {/* Detected exercises */}
      {detectedExercises.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 animate-fade-in">
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-2.5">
            <Sparkles size={12} />
            FitAI detectó
          </p>
          <div className="flex flex-col gap-2">
            {detectedExercises.map((ex, i) => {
              const setCount = ex.sets.length;
              const firstSet = ex.sets[0];
              const summary = [
                firstSet?.reps ? `${setCount}×${firstSet.reps}` : `${setCount} series`,
                firstSet?.weight_kg ? `${firstSet.weight_kg} kg` : null,
                firstSet?.duration_sec ? `${Math.round(firstSet.duration_sec / 60)} min` : null,
              ].filter(Boolean).join(" · ");
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-800 font-medium">{ex.alias}</span>
                  <span className="text-sm text-slate-500">{summary}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 animate-fade-in">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tab content (keyed para la transición de entrada) */}
      <div key={tab} className="animate-fade-in">
        {tab === "text" && (
          <form onSubmit={handleText} className="flex flex-col gap-4">
            <Textarea
              label="Describe tu entrenamiento"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Hice 4 series de press banca con 60 kg, luego 3 de sentadilla a 80 y cardio 15 min..."
              rows={5}
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !textInput.trim()} className="w-full py-3.5">
              {isPending ? "Guardando..." : "Guardar entrenamiento"}
            </Button>
          </form>
        )}

        {tab === "audio" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <AudioRecorder onRecorded={handleAudio} disabled={busy} />
          </div>
        )}

        {tab === "photo" && (
          <PhotoUpload onSelected={handlePhoto} disabled={busy} uploading={isUploading} />
        )}
      </div>
    </div>
  );
}
