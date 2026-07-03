import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserContext } from "@/lib/memory/user-context";
import { answerQuery } from "@/lib/ai/query-engine";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const QuerySchema = z.object({
  question: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(session.user.id, "query", 10);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const body = await req.json();
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const ctx = await getUserContext(session.user.id);
    const answer = await answerQuery(parsed.data.question, session.user.id, ctx);
    return NextResponse.json({ answer });
  } catch (e) {
    logger.error("POST /api/query", "Error al procesar la consulta", e);
    return NextResponse.json({
      answer: "No pude procesar tu consulta en este momento. Intenta de nuevo en unos segundos.",
    });
  }
}
