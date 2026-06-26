import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { db } from "@/lib/db/client";
import { rawInputs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { extractWorkoutData } from "@/lib/ai/extract-workout";
import { extractFromImage } from "@/lib/ai/extract-vision";
import { getUserContext, invalidateUserContext } from "@/lib/memory/user-context";
import { saveWorkoutSets, saveVisionWorkoutSets } from "@/lib/db/queries/workout";
import { z } from "zod";

const JobSchema = z.object({
  rawInputId: z.string().uuid(),
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(["audio", "image"]),
  storageUrl: z.string().url(),
  mimeType: z.string(),
});

async function handler(req: NextRequest) {
  const body = await req.json();
  const job = JobSchema.parse(body);

  try {
    if (job.type === "audio") {
      await processAudio(job);
    } else {
      await processImage(job);
    }

    // Invalidate user context cache so next query reflects new data
    await invalidateUserContext(job.userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[qstash-webhook] Processing error:", err);

    await db
      .update(rawInputs)
      .set({ processingError: String(err), processedAt: new Date() })
      .where(eq(rawInputs.id, job.rawInputId));

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function processAudio(job: z.infer<typeof JobSchema>) {
  // Fetch audio from R2
  const audioRes = await fetch(job.storageUrl);
  const buffer = Buffer.from(await audioRes.arrayBuffer());

  // STT via Whisper
  const transcription = await transcribeAudio(buffer, job.mimeType);

  // NLP extraction via Claude
  const ctx = await getUserContext(job.userId);
  const extracted = await extractWorkoutData(transcription, ctx);

  if (extracted.intent === "log" && extracted.exercises.length > 0) {
    await saveWorkoutSets(job.sessionId, job.rawInputId, extracted);
  }

  await db
    .update(rawInputs)
    .set({ transcription, extractedJson: extracted, processedAt: new Date() })
    .where(eq(rawInputs.id, job.rawInputId));
}

async function processImage(job: z.infer<typeof JobSchema>) {
  // Fetch image from R2 and convert to base64
  const imgRes = await fetch(job.storageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const base64 = buffer.toString("base64");

  const extracted = await extractFromImage(base64, job.mimeType);

  if (extracted.exercises.length > 0 || Object.keys(extracted.session_metrics).length > 0) {
    await saveVisionWorkoutSets(job.sessionId, job.rawInputId, extracted);
  }

  await db
    .update(rawInputs)
    .set({ extractedJson: extracted, processedAt: new Date() })
    .where(eq(rawInputs.id, job.rawInputId));
}

export async function POST(req: NextRequest) {
  const verifySignature = verifySignatureAppRouter(handler);

  return verifySignature(req);
}
