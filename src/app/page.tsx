import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Mic, Trophy, MessageCircle, Lock, ArrowRight, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { LandingNav } from "@/components/landing/LandingNav";
import { IPhoneFrame } from "@/components/landing/IPhoneFrame";
import { PhoneDemo } from "@/components/landing/PhoneDemo";

export const metadata: Metadata = {
  title: "VibeFitAI — Registra tu entrenamiento en segundos",
  description:
    "Habla, saca una foto o escribe. VibeFitAI extrae tus series, pesos y reps con IA, detecta tus récords y te deja preguntarle a tu historial.",
};

const FEATURES = [
  {
    icon: Mic,
    title: "Registro inteligente",
    desc: "Habla de forma natural, saca una foto a la pizarra del gym o escríbelo como lo dirías. VibeFitAI extrae series, repeticiones y cargas automáticamente.",
  },
  {
    icon: Trophy,
    title: "Récords al instante",
    desc: "Cada serie que registras se compara con tu historial. En cuanto superas una marca personal, VibeFitAI te avisa en el momento.",
  },
  {
    icon: MessageCircle,
    title: "Chat con tu historial",
    desc: "«¿Cuánto hice en sentadilla el lunes?» — pregúntale a tus datos en lenguaje natural y obtén la respuesta al momento.",
  },
];

export default async function LandingPage() {
  // auth() aquí solo redirige usuarios ya logueados; si falla (p. ej. env
  // mal configurada) la landing debe seguir sirviéndose, no dar 500.
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("landing: auth() falló", err);
  }
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[55fr_45fr] gap-12 lg:gap-20 xl:gap-28 items-center overflow-x-clip">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-on-primary-container bg-primary-container px-3 py-1.5 rounded-full mb-5">
            <Sparkles size={12} />
            Voz · Foto · Texto — tú eliges
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-5 [text-wrap:balance]">
            Registra tu gym
            <br />
            <span className="text-accent">en 5 segundos.</span>
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed mb-8 max-w-md [text-wrap:pretty]">
            Habla, saca una foto o escribe. VibeFitAI extrae tus series, pesos y reps con IA — y te muestra
            exactamente cómo progresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3.5 rounded-xl text-sm shadow-lg shadow-primary/15 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Empezar gratis
              <ArrowRight size={16} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 bg-white border border-outline-variant hover:border-outline text-on-surface font-semibold px-6 py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Ver cómo funciona
            </a>
          </div>
          <p className="text-xs text-on-surface-variant/80 mt-5">
            Sin tarjeta de crédito · Tu cuenta lista en menos de un minuto.
          </p>
        </div>

        <div className="flex justify-center pt-10 lg:pt-0">
          <IPhoneFrame>
            <PhoneDemo />
          </IPhoneFrame>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="caracteristicas" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 lg:py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 [text-wrap:balance]">
            Tecnología diseñada para tu progreso
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">
            Sin formularios, sin fricción. VibeFitAI hace el trabajo pesado para que tú solo entrenes.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-outline-variant/50 rounded-2xl p-6 shadow-card"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center mb-4">
                <f.icon size={19} className="text-on-primary-container" />
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">{f.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA — bento asimétrico ── */}
      <section id="como-funciona" className="bg-surface-container-low border-y border-outline-variant/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 lg:py-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 [text-wrap:balance]">
              El final del registro manual
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">
              Olvídate de las hojas de cálculo y las notas desordenadas. VibeFitAI procesa lenguaje natural.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:auto-rows-[9.5rem]">
            {/* Tarjeta blanca — extracción por IA */}
            <div className="bg-white rounded-2xl p-6 shadow-card flex flex-col justify-between lg:col-start-1 lg:row-start-1 lg:row-span-2">
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2">Habla como lo dirías</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">
                  Sin plantillas ni menús desplegables. Escribe o di tu entrenamiento tal cual te sale, y
                  la IA lo estructura por ti.
                </p>
              </div>
              <div className="mt-6 bg-surface-container-low rounded-xl px-4 py-3">
                <p className="text-xs text-on-surface italic leading-relaxed">
                  «Registra 3 series de press militar con 40 kilos a 12 reps»
                </p>
                <p className="text-[10px] font-semibold text-primary flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Procesado exitosamente
                </p>
              </div>
            </div>

            {/* Tarjeta índigo — récords */}
            <div className="relative overflow-hidden bg-accent rounded-2xl p-6 text-white flex flex-col justify-between lg:col-start-2 lg:col-span-2 lg:row-start-1">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
              <div className="relative">
                <h3 className="text-lg font-bold mb-2">Detecta tus récords al momento</h3>
                <p className="text-sm text-white/70 leading-relaxed max-w-md [text-wrap:pretty]">
                  Cada serie se compara contra tu historial completo. En cuanto superas una marca, VibeFitAI
                  te lo dice en la misma pantalla de registro.
                </p>
              </div>
              <Trophy size={28} className="relative self-end text-white/80" />
            </div>

            {/* Tarjeta navy — posicionamiento */}
            <div className="bg-primary rounded-2xl p-6 flex items-center lg:col-start-2 lg:row-start-2">
              <p className="text-white text-lg font-bold leading-snug [text-wrap:balance]">
                Sin plan de nutrición. Sin distracciones. Solo tu progreso de fuerza.
              </p>
            </div>

            {/* Tarjeta gris — privacidad */}
            <div className="bg-surface-container rounded-2xl p-6 flex flex-col justify-center gap-3 lg:col-start-3 lg:row-start-2">
              <Lock size={20} className="text-on-surface-variant" />
              <p className="text-sm font-medium text-on-surface leading-relaxed [text-wrap:pretty]">
                Privacidad total. Tus datos son tuyos y de nadie más.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 lg:py-20">
        <div className="relative overflow-hidden bg-primary rounded-3xl px-6 py-14 sm:py-16 text-center">
          <div aria-hidden className="absolute -top-16 left-1/4 w-72 h-72 bg-accent/25 rounded-full blur-3xl" />
          <div aria-hidden className="absolute -bottom-16 right-1/4 w-72 h-72 bg-inverse-primary/10 rounded-full blur-3xl" />
          <h2 className="relative text-2xl sm:text-4xl font-black tracking-tight text-white mb-8 [text-wrap:balance]">
            ¿Listo para entrenar con superpoderes?
          </h2>
          <Link
            href="/login?mode=register"
            className="relative inline-flex items-center gap-2 bg-white hover:bg-white/90 text-primary font-semibold px-7 py-3.5 rounded-full text-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Crear cuenta gratuita
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-outline-variant/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-black text-[9px]">F</span>
            </div>
            <span className="text-on-surface-variant text-xs font-medium">
              VibeFitAI · Registro de entrenamientos con IA
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-on-surface-variant/80">
            <Link href="/terminos" className="hover:text-on-surface transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-on-surface transition-colors">Privacidad</Link>
            <span className="text-outline">© 2026 VibeFitAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
