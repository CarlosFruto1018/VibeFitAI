"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sliders, Scale, Ruler, Target, CalendarDays, Camera, LogOut, Trash2, CheckCircle, XCircle, Loader2, User } from "lucide-react";
import { cn, displayWeight, toKg, type WeightUnit } from "@/lib/utils";

interface Props {
  profile: {
    name: string;
    image: string | null;
    preferredUnits: WeightUnit;
    bodyWeightKg: number | null;
    birthDate: string | null; // YYYY-MM-DD
    heightCm: number | null;
    weeklyGoal: number;
  };
  signOutAction: () => Promise<void>;
}

const FIELD =
  "bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 w-full";

const LABEL = "text-xs font-medium text-on-surface-variant flex items-center gap-1.5";

export function SettingsClient({ profile, signOutAction }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [heightCm, setHeightCm] = useState(profile.heightCm != null ? String(profile.heightCm) : "");
  const [weeklyGoal, setWeeklyGoal] = useState(profile.weeklyGoal);
  const [preferredUnits, setPreferredUnits] = useState<WeightUnit>(profile.preferredUnits);
  // El campo se edita siempre en la unidad seleccionada; el valor guardado
  // en profile.bodyWeightKg es kg canónico, se convierte solo al mostrarlo.
  const [bodyWeight, setBodyWeight] = useState(
    profile.bodyWeightKg != null ? String(displayWeight(profile.bodyWeightKg, profile.preferredUnits)) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"ok" | "error" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = deleteConfirmText === "ELIMINAR";

  function handleUnitChange(next: WeightUnit) {
    // Convierte el número que ya está en el campo para que siga representando
    // el mismo peso real en la nueva unidad, en vez de reinterpretarlo.
    setBodyWeight((current) => {
      if (current === "") return current;
      const parsed = parseFloat(current);
      if (Number.isNaN(parsed)) return current;
      const kg = toKg(parsed, preferredUnits);
      return String(displayWeight(kg, next));
    });
    setPreferredUnits(next);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La imagen no puede superar 5 MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const presignRes = await fetch(
        `/api/input/presign?type=image&mimeType=${encodeURIComponent(file.type)}`
      );
      const presign = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        setPhotoError(typeof presign.error === "string" ? presign.error : "No pudimos preparar la subida.");
        return;
      }
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) {
        setPhotoError("Error al subir la imagen. Intenta de nuevo.");
        return;
      }
      const patchRes = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey: presign.storageKey }),
      });
      if (!patchRes.ok) {
        setPhotoError("No pudimos guardar tu nueva foto.");
        return;
      }
      router.refresh();
    } catch {
      setPhotoError("Error de conexión al subir la foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          preferredUnits,
          bodyWeightKg: bodyWeight ? toKg(parseFloat(bodyWeight), preferredUnits) : undefined,
          birthDate: birthDate || null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          weeklyGoal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(typeof data.error === "string" ? data.error : null);
        setSaveStatus("error");
        return;
      }
      setSaveStatus("ok");
      router.refresh();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/account", { method: "DELETE" });
      await signOutAction();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-widest px-1 -mb-1">
        Ajustes de Cuenta
      </h3>

      {/* Perfil personal */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <User size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Perfil</h2>
            <p className="text-[11px] text-on-surface-variant">Foto, nombre y datos personales</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-outline-variant/50" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black">
                {profile.name[0]?.toUpperCase() ?? "A"}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {uploadingPhoto ? "Subiendo..." : "Cambiar foto"}
              </button>
              <p className="text-[10px] text-on-surface-variant/70">JPG, PNG o WebP · máx. 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
              aria-label="Elegir foto de perfil"
            />
          </div>

          {photoError && (
            <p className="text-xs text-error bg-error-container/60 rounded-xl px-3 py-2 animate-fade-in">{photoError}</p>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-name" className={LABEL}>Nombre</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
              className={FIELD}
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-birthdate" className={LABEL}>
              <CalendarDays size={12} />
              Fecha de nacimiento
            </label>
            <input
              id="profile-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Preferencias de entrenamiento */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <Sliders size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Preferencias de Entrenamiento</h2>
            <p className="text-[11px] text-on-surface-variant">Meta semanal, unidades y medidas</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Meta semanal */}
          <div className="flex flex-col gap-2">
            <label className={LABEL}>
              <Target size={12} />
              Meta semanal (sesiones)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWeeklyGoal((g) => Math.max(1, g - 1))}
                aria-label="Reducir meta semanal"
                className="w-9 h-9 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-black font-mono text-on-surface">{weeklyGoal}</span>
              <button
                type="button"
                onClick={() => setWeeklyGoal((g) => Math.min(14, g + 1))}
                aria-label="Aumentar meta semanal"
                className="w-9 h-9 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors active:scale-95"
              >
                +
              </button>
              <span className="text-xs text-on-surface-variant">días de entrenamiento por semana</span>
            </div>
          </div>

          {/* Units */}
          <div className="flex flex-col gap-2">
            <label className={LABEL}>Unidades de peso</label>
            <div className="flex gap-1.5">
              {(["kg", "lb"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => handleUnitChange(unit)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    preferredUnits === unit
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Body weight */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-weight" className={LABEL}>
              <Scale size={12} />
              Peso corporal ({preferredUnits})
            </label>
            <input
              id="profile-weight"
              type="number"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="Ej: 75"
              className={FIELD}
            />
          </div>

          {/* Estatura */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-height" className={LABEL}>
              <Ruler size={12} />
              Estatura (cm)
            </label>
            <input
              id="profile-height"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="Ej: 175"
              min={80}
              max={250}
              className={FIELD}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {saveStatus && (
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm rounded-xl py-2 px-3 text-center",
              saveStatus === "ok" ? "text-on-primary-container bg-primary-container/70" : "text-error bg-error-container/60"
            )}>
              {saveStatus === "ok"
                ? <><CheckCircle size={14} /> Cambios guardados</>
                : <><XCircle size={14} className="shrink-0" /> {saveError ?? "Error al guardar"}</>
              }
            </div>
          )}
        </div>
      </section>

      {/* Sign out */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-container/70 hover:bg-error-container text-error text-sm font-semibold transition-colors active:scale-[0.98]"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </form>

      {/* Danger zone */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <Trash2 size={14} className="text-on-surface-variant" />
          <h2 className="text-sm font-semibold text-on-surface">Eliminar cuenta</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Esto borra permanentemente tu cuenta y todos tus datos: sesiones, series, récords y perfil.
            Esta acción no se puede deshacer.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:border-red-200 hover:text-red-500 hover:bg-red-50/50 transition-colors"
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-red-700">Confirma que quieres borrar todo</p>
                <p className="text-xs text-red-500/80">
                  Escribe{" "}
                  <span className="font-mono font-bold tracking-wider">ELIMINAR</span>{" "}
                  en mayúsculas para continuar.
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoComplete="off"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent font-mono tracking-widest transition-all"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium transition-colors hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {deleting ? "Eliminando..." : "Eliminar cuenta"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
