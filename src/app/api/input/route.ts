import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { rawInputs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateSession } from "@/lib/ai/session-grouper";
import { getUserContext } from "@/lib/memory/user-context";
import { extractWorkoutData } from "@/lib/ai/extract-workout";
import { saveWorkoutSets } from "@/lib/db/queries/workout";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const qstashAvailable =
  process.env.QSTASH_TOKEN && !process.env.QSTASH_TOKEN.includes("...");

const r2Available =
  process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.includes("...");

const InputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string().min(1).max(2000),
    locationLat: z.number().optional(),
    locationLon: z.number().optional(),
  }),
  z.object({
    type: z.literal("audio"),
    storageKey: z.string(),
    storageUrl: z.string().url(),
    mimeType: z.string(),
    locationLat: z.number().optional(),
    locationLon: z.number().optional(),
  }),
  z.object({
    type: z.literal("image"),
    storageKey: z.string(),
    storageUrl: z.string().url(),
    mimeType: z.string(),
    locationLat: z.number().optional(),
    locationLon: z.number().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rl = await checkRateLimit(userId, "input", 20);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    const body = await req.json();
    const parsed = InputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;

    // Audio/image require R2 + QStash — reject early if not configured
    if (input.type !== "text" && (!r2Available || !qstashAvailable)) {
      return NextResponse.json(
        { error: "Almacenamiento (R2) y cola (QStash) no están configurados. Solo texto disponible por ahora." },
        { status: 503 }
      );
    }

    const trainingSessionId = await getOrCreateSession(userId, {
      locationLat: input.locationLat,
      locationLon: input.locationLon,
    });

    const [rawInput] = await db
      .insert(rawInputs)
      .values({
        userId,
        type: input.type,
        storageUrl: input.type !== "text" ? input.storageUrl : undefined,
        mimeType: input.type !== "text" ? input.mimeType : "text/plain",
        transcription: input.type === "text" ? input.content : undefined,
        sessionId: trainingSessionId,
      })
      .returning({ id: rawInputs.id });

    if (input.type === "text") {
      const ctx = await getUserContext(userId);
      const extracted = await extractWorkoutData(input.content, ctx);

      if (extracted.intent === "log" && extracted.exercises.length > 0) {
        await saveWorkoutSets(trainingSessionId, rawInput.id, extracted);
      }

      await db
        .update(rawInputs)
        .set({ extractedJson: extracted, processedAt: new Date() })
        .where(eq(rawInputs.id, rawInput.id));

      return NextResponse.json({
        rawInputId: rawInput.id,
        sessionId: trainingSessionId,
        extracted,
        status: "processed",
      });
    }

    // Audio / image → enqueue background job
    const { Client } = await import("@upstash/qstash");
    const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash`,
      body: {
        rawInputId: rawInput.id,
        userId,
        sessionId: trainingSessionId,
        type: input.type,
        storageUrl: input.storageUrl,
        mimeType: input.mimeType,
      },
    });

    return NextResponse.json({
      rawInputId: rawInput.id,
      sessionId: trainingSessionId,
      status: "queued",
    });
  } catch (err) {
    logger.error("POST /api/input", "Error al procesar el registro", err);
    return NextResponse.json(
      { error: "No pudimos procesar tu registro. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
