import { logger } from "@/lib/logger";

// Rate limiting por usuario con ventana fija (INCR + EXPIRE sobre Upstash Redis).
// Si Redis no está configurado (mismo criterio que session-grouper/user-context),
// no se limita — la app sigue funcionando en desarrollo local.

const redisAvailable =
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("...");

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSec = 60
): Promise<RateLimitResult> {
  if (!redisAvailable) {
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
  }

  try {
    const { redis, keys } = await import("@/lib/redis");
    const key = `${keys.rateLimit(userId)}:${action}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    if (count > limit) {
      const ttl = await redis.ttl(key);
      return { allowed: false, remaining: 0, retryAfterSec: Math.max(ttl, 1) };
    }
    return { allowed: true, remaining: limit - count, retryAfterSec: 0 };
  } catch (err) {
    // Si Redis falla no bloqueamos al usuario, pero lo dejamos registrado.
    logger.error("rate-limit", "Fallo al consultar Redis, se permite la petición", err);
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
  }
}

export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    {
      error: `Demasiadas peticiones. Intenta de nuevo en ${retryAfterSec} segundo${retryAfterSec === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
