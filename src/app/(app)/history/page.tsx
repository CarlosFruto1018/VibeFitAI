import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SessionCard } from "@/components/session/SessionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { History, Dumbbell } from "lucide-react";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Si la consulta falla, el error.tsx de la ruta muestra un estado amigable.
  const allSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    with: {
      workoutSets: { with: { exercise: true }, orderBy: (s, { asc }) => asc(s.createdAt) },
    },
    orderBy: desc(sessions.startedAt),
    limit: 50,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
          <History size={16} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Historial</h1>
          {allSessions.length > 0 && (
            <p className="text-xs text-slate-400">{allSessions.length} sesión{allSessions.length !== 1 ? "es" : ""} registradas</p>
          )}
        </div>
      </div>

      {allSessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={24} className="text-slate-400" />}
          title="Sin sesiones aún"
          description="Registra tu primer entrenamiento para verlo aquí."
          actionHref="/record"
          actionLabel="+ Registrar entrenamiento"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {allSessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
