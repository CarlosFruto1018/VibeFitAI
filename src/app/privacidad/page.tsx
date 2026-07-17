import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeScript } from "@/components/landing/ThemeScript";

export const metadata: Metadata = {
  title: "Política de Privacidad — VibeFitAI",
  description: "Cómo VibeFitAI recopila, usa y protege tus datos.",
};

const SECTIONS = [
  {
    title: "1. Qué datos recopilamos",
    body: "Tu nombre, correo y foto de perfil de Google al crear la cuenta; los entrenamientos que registras (ejercicios, series, pesos, repeticiones); y las notas de voz o fotos que subes para que la IA las procese.",
  },
  {
    title: "2. Para qué los usamos",
    body: "Exclusivamente para prestarte el servicio: extraer tus datos de entrenamiento, calcular tu progresión, detectar récords personales y responder a tus consultas sobre tu historial. No vendemos tus datos ni los compartimos con terceros con fines publicitarios.",
  },
  {
    title: "3. Procesamiento con IA",
    body: "Las notas de voz y fotos se envían a un proveedor de IA para su transcripción y análisis, y no se usan para entrenar modelos. Una vez extraídos los datos estructurados, el archivo original deja de ser necesario para el servicio.",
  },
  {
    title: "4. Dónde se almacenan",
    body: "Tus datos se guardan en infraestructura cloud con cifrado en tránsito y en reposo. El acceso está restringido a tu cuenta: nadie más puede ver tu historial.",
  },
  {
    title: "5. Tus derechos",
    body: "Puedes exportar o eliminar todos tus datos en cualquier momento desde los ajustes de la aplicación. Al eliminar tu cuenta, tus datos se borran de forma permanente.",
  },
  {
    title: "6. Cookies",
    body: "Usamos únicamente cookies esenciales para mantener tu sesión iniciada. No usamos cookies de seguimiento ni de publicidad.",
  },
];

export default function PrivacidadPage() {
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

        <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">Política de Privacidad</h1>
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
          Consulta también los{" "}
          <Link href="/terminos" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Términos de Servicio
          </Link>.
        </p>
      </div>
    </div>
  );
}
