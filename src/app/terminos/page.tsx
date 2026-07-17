import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeScript } from "@/components/landing/ThemeScript";

export const metadata: Metadata = {
  title: "Términos de Servicio — VibeFitAI",
  description: "Condiciones de uso del servicio VibeFitAI.",
};

const SECTIONS = [
  {
    title: "1. El servicio",
    body: "VibeFitAI es una aplicación web para registrar y analizar entrenamientos mediante inteligencia artificial. Puedes registrar sesiones por voz, foto o texto, consultar tu historial y recibir análisis de progresión.",
  },
  {
    title: "2. Tu cuenta",
    body: "Necesitas una cuenta de Google para usar VibeFitAI. Eres responsable de la actividad que ocurra bajo tu cuenta. Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde los ajustes.",
  },
  {
    title: "3. Uso aceptable",
    body: "No puedes usar VibeFitAI para actividades ilegales, intentar acceder a datos de otros usuarios ni sobrecargar deliberadamente el servicio. Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.",
  },
  {
    title: "4. Contenido y datos",
    body: "Los datos de entrenamiento que registras son tuyos. Nos concedes permiso para procesarlos con el único fin de prestarte el servicio: extraer ejercicios, calcular progresiones y responder a tus consultas.",
  },
  {
    title: "5. Disponibilidad",
    body: "VibeFitAI se ofrece tal cual, sin garantía de disponibilidad continua. Los análisis generados por IA pueden contener errores; verifica los datos importantes antes de tomar decisiones de entrenamiento basadas en ellos.",
  },
  {
    title: "6. Cambios",
    body: "Podemos actualizar estos términos. Si el cambio es sustancial, te lo notificaremos dentro de la aplicación antes de que entre en vigor.",
  },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <ThemeScript />
      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-24">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors mb-10"
        >
          <ArrowLeft size={15} />
          Volver
        </Link>

        <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">Términos de Servicio</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mb-12">Última actualización: 7 de julio de 2026</p>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold mb-2">{s.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed [text-wrap:pretty]">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="text-slate-500 dark:text-slate-500 text-sm mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
          ¿Dudas? Escríbenos y te respondemos. Consulta también la{" "}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Política de Privacidad
          </Link>.
        </p>
      </div>
    </div>
  );
}
