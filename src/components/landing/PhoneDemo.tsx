import {
  Bell,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Home,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

/* ── Iconos de status bar estilo iOS (los de lucide son de trazo y no se
 * parecen a los glifos reales del sistema; estos son sólidos, como iOS). ── */

function CellularIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 12" fill="currentColor" className={className} aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={className} aria-hidden>
      <path
        d="M1.6 4.8a9.2 9.2 0 0 1 12.8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M4.5 7.6a5.1 5.1 0 0 1 7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="8" cy="10.4" r="1.6" fill="currentColor" />
    </svg>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 12" className={className} aria-hidden>
      <rect x="0" y="0" width="22" height="12" rx="3" fill="currentColor" />
      <path d="M23.5 3.8v4.4c1.2-.25 2-1.1 2-2.2s-.8-1.95-2-2.2Z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/* Altura relativa de las barras L–D. El día activo (V) va en acento;
 * S y D aún no llegan (punteadas), igual que en el dashboard real. */
const DAY_BARS = [
  { label: "L", height: 62, state: "past" },
  { label: "M", height: 38, state: "past" },
  { label: "X", height: 84, state: "past" },
  { label: "J", height: 6, state: "rest" },
  { label: "V", height: 100, state: "today" },
  { label: "S", height: 6, state: "future" },
  { label: "D", height: 6, state: "future" },
] as const;

const RECENT_SESSIONS = [
  { day: "Viernes 17 jul", detail: "4.120 kg levantados" },
  { day: "Miércoles 15 jul", detail: "3.860 kg levantados" },
] as const;

const NAV_ITEMS = [
  { label: "Inicio", icon: Home, active: true },
  { label: "Registrar", icon: PlusCircle, active: false },
  { label: "Chat", icon: MessageCircle, active: false },
  { label: "Perfil", icon: User, active: false },
] as const;

/**
 * Captura ilustrativa del dashboard real de la app — datos de ejemplo.
 * Replica la pantalla de /dashboard (saludo, Actividad Semanal, métricas,
 * VibeFitAI Insight, sesiones recientes y bottom nav) con una semana activa.
 * Dimensionado en `em` sobre la base en `cqw` que fija IPhoneFrame:
 * escala como una captura, sin scroll ni reflow.
 */
export function PhoneDemo() {
  return (
    <div className="flex h-full w-full flex-col bg-background text-on-surface">
      {/* Status bar iOS — hora e iconos centrados verticalmente con la Dynamic Island.
          h-[3.47em] × base 17px ≈ 59px: el centro de la fila coincide con el centro
          de la isla (29.5px), igual que en un iPhone real. */}
      <div className="flex h-[3.47em] items-center justify-between px-[1.6em]">
        <span className="text-[1.1em] font-bold tracking-tight pl-[1.6em]">9:41</span>
        <div className="flex items-center gap-[0.35em]">
          <CellularIcon className="h-[0.9em] w-auto" />
          <WifiIcon className="h-[0.9em] w-auto" />
          <BatteryIcon className="h-[0.95em] w-auto" />
        </div>
      </div>

      {/* Barra superior de la app */}
      <div className="flex items-center justify-between px-[1.1em]">
        <div className="flex items-center gap-[0.4em]">
          <Sparkles className="h-[0.95em] w-[0.95em] text-accent" />
          <span className="text-[0.85em] font-black tracking-tight">VibeFitAI</span>
        </div>
        <Bell className="h-[0.95em] w-[0.95em] text-on-surface-variant" />
      </div>

      {/* Contenido — justify-between reparte el espacio para llenar la pantalla exacta */}
      <div className="flex min-h-0 flex-1 flex-col justify-between px-[1.1em] pb-[0.7em] pt-[0.6em]">
        {/* Saludo */}
        <div>
          <p className="text-[1.3em] font-black leading-tight tracking-tight">¡Hola, Carlos!</p>
          <p className="mt-[0.15em] text-[0.68em] text-on-surface-variant">Buen ritmo. Sigue así esta semana.</p>
        </div>

        {/* Actividad Semanal — barras L–D */}
        <div className="rounded-[1em] border border-outline-variant/50 bg-white p-[0.9em] shadow-sm">
          <div className="mb-[0.7em] flex items-end justify-between">
            <div>
              <p className="text-[0.62em] font-medium text-on-surface-variant">Actividad Semanal</p>
              <p className="mt-[0.1em] font-mono text-[1.1em] font-black">
                12.450 <span className="text-[0.7em] font-bold">kg</span>
              </p>
            </div>
            <span className="rounded-full bg-primary-container px-[0.7em] py-[0.3em] text-[0.55em] font-semibold text-on-primary-container">
              +18% vs semana pasada
            </span>
          </div>
          <div className="flex h-[4.6em] items-end justify-between gap-[0.4em]">
            {DAY_BARS.map((d) => (
              <div
                key={d.label}
                style={{ height: `${d.height}%` }}
                className={`w-full rounded-t-[0.35em] ${
                  d.state === "today"
                    ? "bg-accent"
                    : d.state === "past"
                      ? "bg-inverse-primary/70"
                      : d.state === "future"
                        ? "border border-dashed border-outline/40 bg-surface-container-low"
                        : "bg-surface-container-highest"
                }`}
              />
            ))}
          </div>
          <div className="mt-[0.35em] flex justify-between text-[0.58em] font-medium text-on-surface-variant">
            {DAY_BARS.map((d) => (
              <span key={d.label} className="w-full text-center">
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Métricas — 2 tarjetas bento */}
        <div className="grid grid-cols-2 gap-[0.7em]">
          <div className="flex flex-col justify-between rounded-[1em] border border-outline-variant/50 bg-white p-[0.8em] shadow-sm">
            <Trophy className="h-[0.95em] w-[0.95em] text-accent" />
            <div className="mt-[0.7em]">
              <p className="text-[0.58em] font-medium text-on-surface-variant">Récord · Sentadilla</p>
              <p className="font-mono text-[0.95em] font-black">105 kg</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-[1em] border border-outline-variant/50 bg-white p-[0.8em] shadow-sm">
            <CalendarDays className="h-[0.95em] w-[0.95em] text-accent" />
            <div className="mt-[0.7em]">
              <p className="text-[0.58em] font-medium text-on-surface-variant">Total Mes</p>
              <p className="font-mono text-[0.95em] font-black">
                14 <span className="text-[0.65em] font-bold">ses.</span>
              </p>
            </div>
          </div>
        </div>

        {/* VibeFitAI Insight — tarjeta navy */}
        <div className="relative overflow-hidden rounded-[1em] bg-primary p-[0.9em] text-white">
          <div className="absolute -right-[2em] -top-[2em] h-[7em] w-[7em] rounded-full bg-accent/40 blur-2xl" />
          <div className="relative flex flex-col gap-[0.3em]">
            <div className="flex items-center gap-[0.4em]">
              <Sparkles className="h-[0.8em] w-[0.8em] text-inverse-primary" />
              <span className="text-[0.55em] font-semibold uppercase tracking-widest text-inverse-primary">
                VibeFitAI Insight
              </span>
            </div>
            <p className="text-[0.82em] font-bold leading-tight">Llevas 4 de 5 sesiones esta semana</p>
            <p className="text-[0.6em] leading-snug text-white/70">
              Te falta 1 sesión para tu meta. Registra la próxima y mantén la racha.
            </p>
            <span className="mt-[0.25em] self-start rounded-full bg-white px-[1em] py-[0.4em] text-[0.56em] font-semibold text-primary">
              Ver análisis
            </span>
          </div>
        </div>

        {/* Sesiones Recientes */}
        <div>
          <div className="mb-[0.4em] flex items-center justify-between">
            <p className="text-[0.72em] font-bold">Sesiones Recientes</p>
            <span className="flex items-center gap-[0.15em] text-[0.58em] font-medium text-accent">
              Ver todo <ChevronRight className="h-[0.9em] w-[0.9em]" />
            </span>
          </div>
          <div className="flex flex-col gap-[0.45em]">
            {RECENT_SESSIONS.map((s) => (
              <div
                key={s.day}
                className="flex items-center gap-[0.7em] rounded-[0.8em] border border-outline-variant/50 bg-white p-[0.6em] shadow-sm"
              >
                <div className="flex h-[2em] w-[2em] items-center justify-center rounded-[0.5em] bg-surface-container">
                  <Dumbbell className="h-[0.95em] w-[0.95em]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.68em] font-semibold">{s.day}</p>
                  <p className="text-[0.58em] text-on-surface-variant">{s.detail}</p>
                </div>
                <ChevronRight className="h-[0.9em] w-[0.9em] text-outline" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-outline-variant/50 bg-white px-[1.1em] pt-[0.5em]">
        <div className="flex items-center justify-between">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`flex flex-1 flex-col items-center gap-[0.2em] ${
                item.active ? "text-primary" : "text-on-surface-variant/70"
              }`}
            >
              <item.icon className="h-[1.05em] w-[1.05em]" />
              <span className="text-[0.5em] font-semibold">{item.label}</span>
            </div>
          ))}
        </div>
        {/* Home indicator */}
        <div className="flex items-center justify-center pb-[0.45em] pt-[0.35em]">
          <div className="h-[0.28em] w-[7em] rounded-full bg-on-surface/25" />
        </div>
      </div>
    </div>
  );
}
