"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { cn, toKg, type WeightUnit } from "@/lib/utils";

const TOTAL_STEPS = 5;

const GOAL_OPTIONS = [2, 3, 4, 5, 6, 7];

const BIG_FIELD =
  "w-full rounded-2xl border border-outline-variant bg-white px-5 py-4 text-lg text-on-surface placeholder:text-on-surface-variant/50 text-center focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 shadow-sm";

export function OnboardingClient({ defaultName }: { defaultName: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [birthDate, setBirthDate] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La imagen no puede superar 5 MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const presignRes = await fetch(`/api/input/presign?type=image&mimeType=${encodeURIComponent(file.type)}`);
      const presign = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        setPhotoError(typeof presign.error === "string" ? presign.error : "No pudimos preparar la subida.");
        return;
      }
      const putRes = await fetch(presign.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) {
        setPhotoError("Error al subir la imagen. Intenta de nuevo.");
        return;
      }
      setPhotoKey(presign.storageKey);
      setPhotoPreview(URL.createObjectURL(file));
    } catch {
      setPhotoError("Error de conexión al subir la foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // weeklyGoal siempre presente: crea la fila de perfil y evita que el
          // onboarding vuelva a aparecer aunque el resto se haya saltado.
          weeklyGoal,
          preferredUnits: unit,
          ...(name.trim() && { name: name.trim() }),
          ...(birthDate && { birthDate }),
          ...(weight && { bodyWeightKg: toKg(parseFloat(weight), unit) }),
          ...(height && { heightCm: parseFloat(height) }),
          ...(photoKey && { imageKey: photoKey }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(typeof data.error === "string" ? data.error : "No pudimos guardar tu perfil. Intenta de nuevo.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setSaveError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-dvh bg-background text-on-surface flex flex-col">
      {/* Barra de progreso */}
      <div className="pt-6 px-6 max-w-md w-full mx-auto">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button
              onClick={back}
              aria-label="Paso anterior"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
          <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-semibold text-on-surface-variant w-9 text-right">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Contenido del paso — key fuerza la animación de entrada en cada cambio */}
      <div key={step} className="flex-1 flex flex-col items-center justify-center px-6 py-10 animate-fade-in">
        <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
          {step === 0 && (
            <>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-on-primary-container bg-primary-container px-3 py-1.5 rounded-full">
                <Sparkles size={12} />
                Bienvenido a VibeFitAI
              </span>
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance]">
                ¿Cómo quieres que te llamemos?
              </h1>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={100}
                autoFocus
                className={BIG_FIELD}
              />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance]">
                ¿Cuándo naciste{name.trim() ? `, ${name.trim()}` : ""}?
              </h1>
              <p className="text-sm text-on-surface-variant [text-wrap:pretty]">
                Nos ayuda a personalizar tus métricas. Puedes saltarlo si prefieres.
              </p>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={BIG_FIELD}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance]">Tus medidas</h1>
              <p className="text-sm text-on-surface-variant [text-wrap:pretty]">
                Para calcular tu volumen y progresión con más precisión.
              </p>
              <div className="flex gap-1.5 w-full">
                {(["kg", "lb"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]",
                      unit === u
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col gap-1.5">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={unit === "kg" ? "75" : "165"}
                    className={BIG_FIELD}
                  />
                  <span className="text-xs text-on-surface-variant">Peso ({unit})</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    min={80}
                    max={250}
                    className={BIG_FIELD}
                  />
                  <span className="text-xs text-on-surface-variant">Estatura (cm)</span>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance]">
                ¿Cuántos días quieres entrenar por semana?
              </h1>
              <p className="text-sm text-on-surface-variant [text-wrap:pretty]">
                Tu meta semanal. El dashboard te mostrará cómo vas contra ella.
              </p>
              <div className="grid grid-cols-3 gap-3 w-full">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setWeeklyGoal(g)}
                    className={cn(
                      "py-5 rounded-2xl text-2xl font-black font-mono transition-all active:scale-95 border",
                      weeklyGoal === g
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                        : "bg-white text-on-surface border-outline-variant hover:border-accent/50"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance]">Ponle cara a tu perfil</h1>
              <p className="text-sm text-on-surface-variant [text-wrap:pretty]">
                Opcional — siempre puedes añadirla después desde tu perfil.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Elegir foto de perfil"
                className="relative w-32 h-32 rounded-full border-2 border-dashed border-outline-variant hover:border-accent/60 transition-colors flex items-center justify-center overflow-hidden bg-surface-container-low active:scale-95 disabled:opacity-60"
              >
                {photoPreview ? (
                  <Image src={photoPreview} alt="Vista previa" fill className="object-cover" unoptimized />
                ) : uploadingPhoto ? (
                  <Loader2 size={28} className="animate-spin text-on-surface-variant" />
                ) : (
                  <Camera size={28} className="text-on-surface-variant" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                aria-label="Archivo de foto de perfil"
              />
              {photoError && (
                <p className="text-xs text-error bg-error-container/60 rounded-xl px-3 py-2 animate-fade-in">{photoError}</p>
              )}
            </>
          )}

          {saveError && (
            <p className="text-xs text-error bg-error-container/60 rounded-xl px-3 py-2 animate-fade-in">{saveError}</p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="pb-10 px-6 max-w-md w-full mx-auto flex flex-col gap-3">
        <button
          onClick={isLast ? finish : next}
          disabled={saving || (step === 0 && !name.trim())}
          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin inline" />
          ) : isLast ? (
            "¡Empezar a entrenar! 🚀"
          ) : (
            "Continuar"
          )}
        </button>
        {!isLast && step > 0 && (
          <button
            onClick={next}
            className="text-xs text-on-surface-variant hover:text-on-surface underline underline-offset-2 transition-colors self-center"
          >
            Saltar este paso
          </button>
        )}
      </div>
    </div>
  );
}
