// Logger mínimo y consistente para toda la app.
// Centraliza el formato para poder conectar Sentry u otro servicio en un solo lugar.

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, scope: string, message: string, extra?: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(extra !== undefined && { extra: serializeExtra(extra) }),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function serializeExtra(extra: unknown): unknown {
  if (extra instanceof Error) {
    return { name: extra.name, message: extra.message, stack: extra.stack };
  }
  return extra;
}

export const logger = {
  info: (scope: string, message: string, extra?: unknown) => log("info", scope, message, extra),
  warn: (scope: string, message: string, extra?: unknown) => log("warn", scope, message, extra),
  error: (scope: string, message: string, extra?: unknown) => log("error", scope, message, extra),
};
