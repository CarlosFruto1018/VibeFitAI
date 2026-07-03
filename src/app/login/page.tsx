import { signIn } from "@/lib/auth";
import { Mic, Camera, TrendingUp, MessageCircle, Zap, Shield, CheckCircle } from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);


const FEATURES = [
  {
    icon: Mic,
    color: "bg-red-500/10 text-red-400",
    border: "border-red-500/20",
    title: "Registro por voz",
    desc: "Di «4 series de 10 en press banca con 80 kilos» y FitAI lo guarda automáticamente. Sin tocar la pantalla.",
  },
  {
    icon: Camera,
    color: "bg-blue-500/10 text-blue-400",
    border: "border-blue-500/20",
    title: "Sube una foto",
    desc: "Foto de la pizarra del box, la pantalla de la máquina cardio o tu reloj — la IA lee los números y los registra.",
  },
  {
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-400",
    border: "border-emerald-500/20",
    title: "Progresión real",
    desc: "Gráficas de carga semana a semana. FitAI detecta tus récords personales al instante y te lo notifica.",
  },
  {
    icon: MessageCircle,
    color: "bg-violet-500/10 text-violet-400",
    border: "border-violet-500/20",
    title: "Pregúntale a tu data",
    desc: "«¿Cuánto hice en sentadilla el lunes?» — respuesta inmediata basada en tu historial real.",
  },
  {
    icon: Zap,
    color: "bg-yellow-500/10 text-yellow-400",
    border: "border-yellow-500/20",
    title: "5 segundos por set",
    desc: "Sin formularios, sin menús, sin escribir nada. El registro más rápido que vas a encontrar.",
  },
  {
    icon: Shield,
    color: "bg-slate-500/10 text-slate-400",
    border: "border-slate-500/20",
    title: "Solo tuyo",
    desc: "Tus datos siempre privados. Nunca compartidos. Solo tú tienes acceso a tu historial.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Entra al gym",
    desc: "Abre FitAI en tu móvil antes de empezar. No necesitas instalar nada — funciona desde el navegador.",
    detail: "PWA • Sin instalación • Offline-first",
  },
  {
    num: "02",
    title: "Registra como quieras",
    desc: "Voz, foto o texto — lo que sea más cómodo en ese momento. FitAI entiende español natural.",
    detail: "«Hice 4 de 10 en banca con 80»",
  },
  {
    num: "03",
    title: "FitAI hace el resto",
    desc: "Extrae ejercicios, series, pesos y reps. Detecta PRs, actualiza tu progreso y guarda todo.",
    detail: "IA · Tiempo real · Sin errores",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-black text-base tracking-tight">FitAI</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Entrar gratis
            </button>
          </form>
        </div>
      </nav>

      {/* ── HERO ── */}
      <HeroSection
        signInButton={
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-8 rounded-2xl transition-all shadow-xl text-sm w-full sm:w-auto"
            >
              <GoogleIcon />
              Empezar gratis con Google
            </button>
          </form>
        }
      />

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-3">Funcionalidades</p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4">Todo lo que necesitas,<br />nada de lo que no.</h2>
          <p className="text-slate-400 max-w-md mx-auto">Diseñado para que pases menos tiempo en el teléfono y más tiempo levantando.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className={`bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all group`}>
              <div className={`w-10 h-10 rounded-xl ${f.color} border ${f.border} flex items-center justify-center mb-4`}>
                <f.icon size={18} />
              </div>
              <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-3">Cómo funciona</p>
            <h2 className="text-3xl lg:text-4xl font-black">Tres pasos. Eso es todo.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Connector line — desktop only */}
            <div className="hidden lg:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {STEPS.map((s) => (
              <div key={s.num} className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5 relative z-10">
                  <span className="text-2xl font-black text-slate-600">{s.num}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-3">{s.desc}</p>
                <span className="inline-block bg-slate-800 border border-slate-700 text-slate-500 text-xs px-3 py-1 rounded-full font-mono">
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA / LOGIN ── */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-lg mx-auto px-6 py-20 lg:py-28 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-6">
            <span className="text-white font-black text-xl">F</span>
          </div>

          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Empieza hoy.<br />
            <span className="text-emerald-500">Es gratis.</span>
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Sin tarjeta de crédito. Sin instalación. En 10 segundos tienes tu cuenta lista y puedes registrar tu primera sesión.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all shadow-sm text-sm"
              >
                <GoogleIcon />
                Continuar con Google
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs">incluye</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                "Registro por voz",
                "Registro por foto",
                "Historial ilimitado",
                "Detección de PRs",
                "Chat con tu data",
                "Sin anuncios",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-500 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-6">
            Al continuar aceptas los Términos de Servicio y Política de Privacidad.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-black text-[9px]">F</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">FitAI</span>
          </div>
          <p className="text-slate-400 text-xs">© 2026 FitAI. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
