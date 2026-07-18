import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { getUserTimeZone } from "@/lib/timezone";
import { getWeightUnit } from "@/lib/get-weight-unit";
import { formatWeight } from "@/lib/utils";
import { es } from "date-fns/locale";
import { Dumbbell, ChevronRight } from "lucide-react";
import { RecordPage } from "@/components/record/RecordPage";

export default async function RecordRoute() {
  const session = await auth();
  const userId = session!.user!.id!;
  const tz = await getUserTimeZone();
  const unit = await getWeightUnit(userId);

  const recent = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: desc(sessions.startedAt),
    limit: 3,
  });

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-black tracking-tight text-on-surface">Nueva Actividad</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Elige cómo quieres registrar tu entrenamiento hoy.
        </p>
      </section>

      {/* Captura rápida + entrada manual */}
      <RecordPage unit={unit} />

      {/* Historial Reciente */}
      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-on-surface">Historial Reciente</h3>
            <Link href="/history" className="text-xs font-medium text-accent">
              Ver todo
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="bg-white border border-outline-variant/50 p-4 rounded-xl flex items-center justify-between shadow-card hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <Dumbbell size={16} className="text-on-surface-variant" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface capitalize">
                      {format(new TZDate(s.startedAt, tz), "EEEE d MMM", { locale: es })}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {format(new TZDate(s.startedAt, tz), "HH:mm")}
                      {s.totalVolumeKg ? ` • ${formatWeight(s.totalVolumeKg, unit)}` : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-outline" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
