"use client";

import { useState } from "react";
import { Sliders, Scale, LogOut, Trash2, CheckCircle, XCircle } from "lucide-react";
import { cn, convertWeight, toKg, type WeightUnit } from "@/lib/utils";

interface Props {
  profile: {
    preferredUnits: WeightUnit;
    bodyWeightKg: number | null;
  };
  signOutAction: () => Promise<void>;
}

export function SettingsClient({ profile, signOutAction }: Props) {
  const [preferredUnits, setPreferredUnits] = useState<WeightUnit>(profile.preferredUnits);
  // El campo se edita siempre en la unidad seleccionada; el valor guardado
  // en profile.bodyWeightKg es kg canónico, se convierte solo al mostrarlo.
  const [bodyWeight, setBodyWeight] = useState(
    profile.bodyWeightKg != null
      ? String(Math.round(convertWeight(profile.bodyWeightKg, profile.preferredUnits) * 10) / 10)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"ok" | "error" | null>(null);
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
      return String(Math.round(convertWeight(kg, next) * 10) / 10);
    });
    setPreferredUnits(next);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredUnits,
          bodyWeightKg: bodyWeight ? toKg(parseFloat(bodyWeight), preferredUnits) : undefined,
        }),
      });
      setSaveStatus(res.ok ? "ok" : "error");
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
      {/* Preferences */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <Sliders size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Preferencias de Entrenamiento</h2>
            <p className="text-[11px] text-on-surface-variant">Unidades y peso corporal</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Units */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-on-surface-variant">Unidades de peso</label>
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
            <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
              <Scale size={12} />
              Peso corporal ({preferredUnits})
            </label>
            <input
              type="number"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="Ej: 75"
              className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
              "flex items-center justify-center gap-2 text-sm rounded-xl py-2",
              saveStatus === "ok" ? "text-on-primary-container bg-primary-container/70" : "text-error bg-error-container/60"
            )}>
              {saveStatus === "ok"
                ? <><CheckCircle size={14} /> Cambios guardados</>
                : <><XCircle size={14} /> Error al guardar</>
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
