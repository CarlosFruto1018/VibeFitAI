"use client";

import { Mic, Square, RotateCcw } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AudioRecorderProps {
  onRecorded: (transcript: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const t = useTranslations("record.audioRecorder");
  const { state, transcript, start, stop, reset, error, supported } =
    useSpeechRecognition("es-ES");

  function handleToggle() {
    if (state === "idle" || state === "done") {
      reset();
      start();
    } else if (state === "recording") {
      stop();
    }
  }

  function handleConfirm() {
    if (transcript.trim()) {
      onRecorded(transcript.trim());
      reset();
    }
  }

  if (!supported) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
        <p className="text-sm text-amber-700">{t("unsupported")}</p>
      </div>
    );
  }

  const isRecording = state === "recording";
  const isDone = state === "done";

  return (
    <div className="flex flex-col items-center gap-6 w-full py-4">
      {/* Mic button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="absolute w-28 h-28 rounded-full bg-red-100 animate-ping opacity-50" />
            <span className="absolute w-24 h-24 rounded-full bg-red-100 animate-ping opacity-30" style={{ animationDelay: "150ms" }} />
          </>
        )}
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent",
            isRecording
              ? "bg-error shadow-lg shadow-error/30 scale-110"
              : "bg-primary hover:bg-primary/85 shadow-lg shadow-primary/20",
            disabled && "opacity-40 cursor-not-allowed"
          )}
          aria-label={isRecording ? t("stopRecording") : isDone ? t("recordAgain") : t("startRecording")}
        >
          {isRecording
            ? <Square size={22} className="text-white" fill="white" />
            : <Mic size={22} className="text-white" />
          }
        </button>
      </div>

      <p className="text-sm text-slate-500 text-center">
        {state === "idle" && t("tapToSpeak")}
        {state === "recording" && <span className="text-red-500 font-medium">{t("listening")}</span>}
        {state === "done" && !transcript && t("processing")}
        {state === "done" && !transcript && t("notDetected")}
      </p>

      {transcript && isDone && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full rounded-2xl bg-surface-container-low border border-outline-variant px-4 py-3 text-sm text-on-surface leading-relaxed">
            {transcript}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={disabled}
              className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm shadow-primary/15"
            >
              {t("saveWorkout")}
            </button>
            <button
              onClick={reset}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center"
              aria-label={t("repeat")}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-center w-full">{error}</p>
      )}
    </div>
  );
}
