import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, workoutSets } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell, Hash, Weight, FileText } from "lucide-react";
import { LocalDate } from "@/components/ui/LocalDate";
import { Card } from "@/components/ui/Card";
import { EditableSet } from "@/components/session/EditableSet";
import { getWeightUnit } from "@/lib/get-weight-unit";
import { formatWeight } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await auth();
  const userId = authSession!.user!.id!;
  const [unit, t] = await Promise.all([getWeightUnit(userId), getTranslations("session")]);

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
    with: {
      workoutSets: {
        with: { exercise: true },
        orderBy: asc(workoutSets.createdAt),
      },
    },
  });

  if (!session || session.userId !== userId) notFound();

  const byExercise: Record<string, typeof session.workoutSets> = {};
  for (const s of session.workoutSets) {
    const name = s.exercise?.displayName ?? s.exerciseName ?? t("exercise");
    if (!byExercise[name]) byExercise[name] = [];
    byExercise[name].push(s);
  }

  const exerciseCount = Object.keys(byExercise).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        {t("back")}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
          <Dumbbell size={17} className="text-inverse-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">{t("title")}</h1>
          <LocalDate date={session.startedAt} className="text-xs text-slate-400 mt-0.5" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {session.totalVolumeKg && (
          <StatCard value={formatWeight(session.totalVolumeKg, unit)} label={t("volume")} />
        )}
        <StatCard value={String(exerciseCount)} label={exerciseCount === 1 ? t("exercise") : t("exercisesPlural")} />
        <StatCard value={String(session.workoutSets.length)} label={t("sets")} />
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-3">
        {Object.entries(byExercise).map(([name, sets]) => (
          <Card key={name} className="overflow-hidden">
            {/* Exercise header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-50">
              <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center">
                <Dumbbell size={13} className="text-on-primary-container" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <span className="ml-auto text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {t("setsCount", { count: sets.length })}
              </span>
            </div>

            {/* Sets table header */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_4.5rem] px-4 py-2 bg-slate-50/50 gap-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Hash size={9} />
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{t("reps")}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Weight size={9} /> {t("weight")}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">RPE</span>
              <span />
            </div>

            {/* Sets */}
            <div className="divide-y divide-slate-50">
              {sets.map((s, i) => (
                <EditableSet key={s.id} set={s} index={i} unit={unit} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {session.summaryText && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("summary")}</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{session.summaryText}</p>
        </Card>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{label}</p>
    </Card>
  );
}
