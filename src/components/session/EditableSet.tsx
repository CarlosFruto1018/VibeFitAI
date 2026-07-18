"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { displayWeight, toKg, type WeightUnit } from "@/lib/utils";

interface EditableSetProps {
  set: {
    id: string;
    reps: number | null;
    weightKg: number | null;
    durationSec: number | null;
    distanceM: number | null;
    rpe: number | null;
  };
  index: number;
  unit?: WeightUnit;
}

const GRID = "grid grid-cols-[2rem_1fr_1fr_1fr_4.5rem] px-4 py-2.5 items-center gap-1";

export function EditableSet({ set, index, unit = "kg" }: EditableSetProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  // El campo se edita en la unidad del usuario; set.weightKg (kg canónico)
  // se convierte solo al mostrarlo/editarlo, y se vuelve a kg al guardar.
  const [weight, setWeight] = useState(
    set.weightKg != null ? String(displayWeight(set.weightKg, unit)) : ""
  );
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reps: reps === "" ? null : Number(reps),
          weightKg: weight === "" ? null : toKg(Number(weight), unit),
          rpe: rpe === "" ? null : Number(rpe),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditing(false);
      router.refresh();
    } catch (err) {
      logger.error("EditableSet", "No se pudo guardar el set", err);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("¿Borrar esta serie?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      logger.error("EditableSet", "No se pudo borrar el set", err);
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className={GRID}>
        <span className="text-sm font-medium text-slate-400">{index + 1}</span>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          aria-label="Repeticiones"
          className="w-full max-w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          aria-label={`Peso en ${unit}`}
          className="w-full max-w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="number"
          inputMode="decimal"
          min={1}
          max={10}
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          aria-label="RPE (1 a 10)"
          className="w-full max-w-14 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={save}
            disabled={busy}
            aria-label="Guardar cambios"
            className="w-8 h-8 rounded-lg bg-primary-container hover:bg-primary-container/70 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="text-on-primary-container animate-spin" /> : <Check size={13} className="text-on-primary-container" />}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={busy}
            aria-label="Cancelar edición"
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={13} className="text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={GRID}>
      <span className="text-sm font-medium text-slate-400">{index + 1}</span>
      <span className="text-sm text-slate-700">
        {set.reps ? `${set.reps}` : set.durationSec ? `${Math.round(set.durationSec / 60)}min` : "—"}
      </span>
      <span className="text-sm font-semibold text-slate-900">
        {set.weightKg
          ? `${displayWeight(set.weightKg, unit)} ${unit}`
          : set.distanceM
            ? `${set.distanceM}m`
            : "—"}
      </span>
      <span className="text-xs text-slate-400">{set.rpe ? `${set.rpe}/10` : "—"}</span>
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={() => setEditing(true)}
          disabled={busy}
          aria-label="Editar serie"
          className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors"
        >
          <Pencil size={13} className="text-slate-400" />
        </button>
        <button
          onClick={remove}
          disabled={busy}
          aria-label="Borrar serie"
          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
        >
          {busy ? <Loader2 size={13} className="text-red-400 animate-spin" /> : <Trash2 size={13} className="text-red-400" />}
        </button>
      </div>
    </div>
  );
}
