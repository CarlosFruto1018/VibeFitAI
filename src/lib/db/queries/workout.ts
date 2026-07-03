import { db } from "@/lib/db/client";
import { workoutSets, exercises, exerciseAliases, personalRecords, sessions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ExtractedWorkout } from "@/lib/ai/extract-workout";
import type { VisionExtraction } from "@/lib/ai/extract-vision";

// ---------------------------------------------------------------------------
// Resolve exercise canonical name to DB id (or create custom)
// ---------------------------------------------------------------------------
async function resolveExerciseId(canonical: string, alias: string): Promise<string> {
  // Try canonical match
  const exact = await db.query.exercises.findFirst({
    where: eq(exercises.canonicalName, canonical),
  });
  if (exact) return exact.id;

  // Try alias match
  const aliasMatch = await db.query.exerciseAliases.findFirst({
    where: eq(exerciseAliases.alias, alias.toLowerCase()),
    with: { exercise: true },
  });
  if (aliasMatch) return aliasMatch.exerciseId;

  // Create custom exercise
  const [created] = await db
    .insert(exercises)
    .values({
      canonicalName: canonical,
      displayName: alias || canonical.replace(/_/g, " "),
      isCustom: true,
    })
    .returning({ id: exercises.id });

  return created.id;
}

// ---------------------------------------------------------------------------
// Save sets from text/audio extraction
// ---------------------------------------------------------------------------
export async function saveWorkoutSets(
  sessionId: string,
  rawInputId: string,
  extracted: ExtractedWorkout,
  sourceType: "audio" | "text" = "text"
): Promise<void> {
  for (const ex of extracted.exercises) {
    const exerciseId = await resolveExerciseId(ex.canonical, ex.alias);

    const rows = ex.sets.map((s, i) => ({
      sessionId,
      exerciseId,
      exerciseName: ex.alias,
      setNumber: i + 1,
      reps: s.reps ?? undefined,
      weightKg: s.weight_kg ?? undefined,
      durationSec: s.duration_sec ?? undefined,
      distanceM: s.distance_m ?? undefined,
      rpe: s.rpe ?? undefined,
      notes: ex.notes ?? undefined,
      sourceType: sourceType as string,
      rawInputId,
    }));

    await db.insert(workoutSets).values(rows);
    await checkAndUpdatePR(sessionId, exerciseId, rows);
  }

  // Update session total volume
  await recalculateSessionVolume(sessionId);
}

// ---------------------------------------------------------------------------
// Save sets from vision extraction
// ---------------------------------------------------------------------------
export async function saveVisionWorkoutSets(
  sessionId: string,
  rawInputId: string,
  extracted: VisionExtraction
): Promise<void> {
  for (const ex of extracted.exercises) {
    const exerciseId = await resolveExerciseId(ex.canonical, ex.canonical.replace(/_/g, " "));

    const rows = ex.sets.map((s, i) => ({
      sessionId,
      exerciseId,
      exerciseName: ex.canonical,
      setNumber: i + 1,
      reps: s.reps ?? undefined,
      weightKg: s.weight_kg ?? undefined,
      durationSec: s.duration_sec ?? undefined,
      distanceM: s.distance_m ?? undefined,
      calories: extracted.session_metrics.calories ?? undefined,
      heartRateBpm: extracted.session_metrics.heart_rate_avg ?? undefined,
      sourceType: "image",
      rawInputId,
    }));

    await db.insert(workoutSets).values(rows);
    await checkAndUpdatePR(sessionId, exerciseId, rows);
  }

  await recalculateSessionVolume(sessionId);
}

// ---------------------------------------------------------------------------
// PR detection
// ---------------------------------------------------------------------------
async function checkAndUpdatePR(
  sessionId: string,
  exerciseId: string,
  sets: Array<{ weightKg?: number; reps?: number; sessionId: string }>
) {
  const sess = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { userId: true },
  });
  if (!sess) return;

  const userId = sess.userId;
  const maxWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));
  if (!maxWeight) return;

  const existing = await db.query.personalRecords.findFirst({
    where: and(
      eq(personalRecords.userId, userId),
      eq(personalRecords.exerciseId, exerciseId),
      eq(personalRecords.metric, "weight_kg")
    ),
    orderBy: desc(personalRecords.value),
  });

  if (!existing || maxWeight > existing.value) {
    await db.insert(personalRecords).values({
      userId,
      exerciseId,
      metric: "weight_kg",
      value: maxWeight,
      achievedAt: new Date(),
      sessionId,
    });
  }
}

// ---------------------------------------------------------------------------
// Recalculate session total volume
// ---------------------------------------------------------------------------
export async function recalculateSessionVolume(sessionId: string) {
  const sets = await db.query.workoutSets.findMany({
    where: eq(workoutSets.sessionId, sessionId),
    columns: { weightKg: true, reps: true },
  });

  const totalVolume = sets.reduce((acc, s) => {
    if (s.weightKg && s.reps) return acc + s.weightKg * s.reps;
    return acc;
  }, 0);

  await db
    .update(sessions)
    .set({ totalVolumeKg: totalVolume })
    .where(eq(sessions.id, sessionId));
}
