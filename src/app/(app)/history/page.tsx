import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SessionCard } from "@/components/session/SessionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getWeightUnit } from "@/lib/get-weight-unit";
import { getTranslations } from "next-intl/server";
import { History, Dumbbell } from "lucide-react";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [unit, t] = await Promise.all([getWeightUnit(userId), getTranslations("history")]);

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
          <History size={16} className="text-inverse-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">{t("title")}</h1>
          {allSessions.length > 0 && (
            <p className="text-xs text-slate-400">{t("sessionsRegistered", { count: allSessions.length })}</p>
          )}
        </div>
      </div>

      {allSessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={24} className="text-slate-400" />}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          actionHref="/record"
          actionLabel={t("emptyAction")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {allSessions.map((s) => (
            <SessionCard key={s.id} session={s} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}
