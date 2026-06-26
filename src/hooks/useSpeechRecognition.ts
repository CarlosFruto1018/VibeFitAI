"use client";

import { useState, useRef, useCallback } from "react";

type RecorderState = "idle" | "recording" | "done";

interface UseSpeechRecognitionReturn {
  state: RecorderState;
  transcript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
  supported: boolean;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(lang = "es-ES"): UseSpeechRecognitionReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Keep a mutable ref so onend can read the latest value
  const transcriptRef = useRef("");

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : null;

  const supported = !!SpeechRecognitionAPI;

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }

    setError(null);
    setTranscript("");
    transcriptRef.current = "";

    const rec = new (SpeechRecognitionAPI as SpeechRecognitionConstructor)();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      // Use final if available, otherwise keep accumulating interim
      const best = final.trim() || interim.trim();
      if (best) {
        transcriptRef.current = best;
        setTranscript(best);
      }
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech") return;
      setError(`Error de micrófono: ${e.error}`);
      setState("idle");
    };

    rec.onend = () => {
      // Use whatever we captured (final or interim)
      if (transcriptRef.current) {
        setTranscript(transcriptRef.current);
      }
      setState("done");
    };

    recognitionRef.current = rec;
    rec.start();
    setState("recording");
  }, [SpeechRecognitionAPI, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    // onend will fire and set state to "done"
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    transcriptRef.current = "";
    setTranscript("");
    setError(null);
    setState("idle");
  }, []);

  return { state, transcript, start, stop, reset, error, supported };
}
