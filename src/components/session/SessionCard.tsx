"use client";

import { formatDate, formatDuration, formatWeight, displayWeight, type WeightUnit } from "@/lib/utils";
import type { Session, WorkoutSet, Exercise } from "@/lib/db/schema";
import { Card } from "@/components/ui/Card";
import { Dumbbell, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

type SetWithExercise = WorkoutSet & { exercise: Exercise | null };
type SessionWithSets = Session & { workoutSets: SetWithExercise[] };

interface SessionCardProps {
  session: SessionWithSets;
  unit?: WeightUnit;
}

export function SessionCard({ session, unit = "kg" }: SessionCardProps) {
  const byExercise = session.workoutSets.reduce<Record<string, SetWithExercise[]>>(
    (acc, s) => {
      const name = s.exercise?.displayName ?? s.exerciseName ?? "Ejercicio";
      acc[name] = [...(acc[name] ?? []), s];
      return acc;
    },
    {}
  );

  const exercises = Object.entries(byExercise);

  return (
    <Link href={`/session/${session.id}`} className="block group">
      <Card className="p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:shadow-slate-200/60 hover:border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">{formatDate(session.startedAt)}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session.totalVolumeKg && (
              <Chip icon={<Dumbbell size={11} />} label={formatWeight(session.totalVolumeKg, unit)} sublabel="vol." />
            )}
            {session.durationMin && (
              <Chip icon={<Clock size={11} />} label={formatDuration(session.durationMin)} sublabel="min" />
            )}
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-400 transition-colors ml-1" />
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-1.5">
          {exercises.slice(0, 5).map(([name, sets]) => {
            const maxWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));
            const totalReps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
            return (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 truncate max-w-[60%]">{name}</span>
                <span className="text-xs text-slate-400">
                  {sets.length} series
                  {maxWeight > 0 && ` · ${displayWeight(maxWeight, unit)} ${unit}`}
                  {totalReps > 0 && ` · ${totalReps} reps`}
                </span>
              </div>
            );
          })}
          {exercises.length > 5 && (
            <p className="text-xs text-slate-400">+{exercises.length - 5} más</p>
          )}
        </div>

        {/* Summary */}
        {session.summaryText && (
          <p className="text-xs text-slate-400 border-t border-slate-50 pt-2 line-clamp-2">
            {session.summaryText}
          </p>
        )}
      </Card>
    </Link>
  );
}

function Chip({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2.5 py-1.5">
      <span className="text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-slate-700 leading-none">{label}</p>
        <p className="text-[9px] text-slate-400 leading-none mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
