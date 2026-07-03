import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { rawInputs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Estado de procesamiento de un input (para polling desde la UI
// mientras QStash procesa audio/imagen en background).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = await db.query.rawInputs.findFirst({
      where: and(eq(rawInputs.id, id), eq(rawInputs.userId, session.user.id)),
      columns: {
        id: true,
        type: true,
        processedAt: true,
        processingError: true,
        extractedJson: true,
        sessionId: true,
      },
    });

    if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const status = input.processingError
      ? "error"
      : input.processedAt
        ? "processed"
        : "processing";

    return NextResponse.json({
      id: input.id,
      sessionId: input.sessionId,
      status,
      extracted: status === "processed" ? input.extractedJson : null,
      error: input.processingError
        ? "No pudimos procesar tu archivo. Intenta de nuevo."
        : null,
    });
  } catch (err) {
    logger.error("GET /api/input/[id]", "Error al consultar el estado del input", err);
    return NextResponse.json({ error: "Error al consultar el estado" }, { status: 500 });
  }
}
