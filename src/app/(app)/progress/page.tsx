import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, workoutSets, personalRecords } from "@/lib/db/schema";
import { eq, desc, gte, and, inArray } from "drizzle-orm";
import { subMonths } from "date-fns";
import { LoadChart } from "@/components/progress/LoadChart";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getWeightUnit } from "@/lib/get-weight-unit";
import { formatWeight } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { TrendingUp, Trophy, Dumbbell } from "lucide-react";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [unit, t] = await Promise.all([getWeightUnit(userId), getTranslations("progress")]);

  const threeMonthsAgo = subMonths(new Date(), 3);

  const [userSessions, prs] = await Promise.all([
    db.query.sessions.findMany({
      where: and(eq(sessions.userId, userId), gte(sessions.startedAt, threeMonthsAgo)),
      columns: { id: true, startedAt: true },
    }),
    db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, userId),
      with: { exercise: true },
      orderBy: desc(personalRecords.achievedAt),
    }),
  ]);

  const charts: { name: string; data: { date: string; weightKg: number; reps: number }[] }[] = [];

  if (userSessions.length > 0) {
    const sessionIds = userSessions.map((s) => s.id);
    const sessionDateMap = Object.fromEntries(userSessions.map((s) => [s.id, s.startedAt]));

    const sets = await db.query.workoutSets.findMany({
      where: inArray(workoutSets.sessionId, sessionIds),
      with: { exercise: true },
      columns: { sessionId: true, weightKg: true, reps: true, exerciseId: true, exerciseName: true },
    });

    const byExercise: Record<string, { name: string; byDate: Record<string, { weightKg: number; reps: number }> }> = {};

    for (const s of sets) {
      if (!s.weightKg) continue;
      const name = s.exercise?.displayName ?? s.exerciseName ?? t("exercise");
      const key = s.exerciseId ?? `name:${name.toLowerCase().trim()}`;
      const date = sessionDateMap[s.sessionId]?.toISOString().split("T")[0];
      if (!date) continue;

      if (!byExercise[key]) byExercise[key] = { name, byDate: {} };

      const existing = byExercise[key].byDate[date];
      if (!existing || s.weightKg > existing.weightKg) {
        byExercise[key].byDate[date] = { weightKg: s.weightKg, reps: s.reps ?? 0 };
      }
    }

    for (const { name, byDate } of Object.values(byExercise)) {
      const data = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));
      if (data.length >= 2) charts.push({ name, data });
    }

    charts.sort((a, b) => b.data.length - a.data.length);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
          <TrendingUp size={16} className="text-inverse-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">{t("title")}</h1>
          <p className="text-xs text-slate-400">{t("lastMonths")}</p>
        </div>
      </div>

      {/* PRs */}
      {prs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Trophy size={14} className="text-yellow-500" />
            <h2 className="text-sm font-semibold text-slate-900">{t("personalRecords")}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-slate-700">{pr.exercise?.displayName}</p>
                <p className="text-sm font-black font-mono text-accent">
                  {pr.metric === "weight_kg" ? formatWeight(pr.value, unit, 1) : `${pr.value} ${pr.metric}`}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          {t("loadProgression")}
        </h2>

        {charts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {charts.slice(0, 6).map((e) => (
              <Card key={e.name} className="p-4">
                <LoadChart data={e.data} exerciseName={e.name} unit={unit} />
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Dumbbell size={24} className="text-slate-400" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            actionHref="/record"
            actionLabel={t("emptyAction")}
          />
        )}
      </section>
    </div>
  );
}
