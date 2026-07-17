"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24" role="status" aria-label="Cargando">
      <div className="w-8 h-8 rounded-full border-[3px] border-surface-container-highest border-t-accent animate-spin" />
      <p className="text-xs text-slate-400">Cargando...</p>
    </div>
  );
}

export function PageError({ reset }: { reset: () => void }) {
  return (
    <Card className="p-10 text-center mt-6">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={24} className="text-red-400" />
      </div>
      <p className="text-sm font-semibold text-slate-900 mb-1">Algo salió mal</p>
      <p className="text-xs text-slate-400 mb-5">
        No pudimos cargar esta pantalla. Revisa tu conexión e intenta de nuevo.
      </p>
      <Button variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </Card>
  );
}
