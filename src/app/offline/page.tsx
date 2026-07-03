export const metadata = { title: "Sin conexión — FitAI" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <span className="text-5xl" role="img" aria-label="Sin conexión">
        📡
      </span>
      <h1 className="text-xl font-semibold text-slate-900">Sin conexión</h1>
      <p className="max-w-xs text-sm text-slate-500">
        No hay conexión a internet. Tus datos siguen a salvo — vuelve a intentarlo cuando
        recuperes la señal.
      </p>
    </main>
  );
}
