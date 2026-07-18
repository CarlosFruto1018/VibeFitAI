import { logger } from "@/lib/logger";

// Envío de correo vía Brevo (API REST, sin SDK). Sigue el mismo patrón de
// env-guard que R2/QStash/Redis: si no está configurado, en desarrollo se
// registra el código en el log para poder probar el flujo igualmente.
const brevoAvailable =
  process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.includes("...");

// EMAIL_FROM admite el formato "Nombre <correo@dominio.com>" (compatible con
// el valor que ya usaba Resend) o solo el correo — Brevo necesita nombre y
// dirección por separado en el payload.
function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM ?? "VibeFitAI <no-reply@vibefitai.app>";
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1].trim() || "VibeFitAI", email: match[2].trim() };
  return { name: "VibeFitAI", email: raw.trim() };
}

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  if (!brevoAvailable) {
    logger.warn("email", "BREVO_API_KEY no configurada; código de restablecimiento solo en log", {
      to,
      code,
    });
    return;
  }

  const sender = parseSender();

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject: `${code} es tu código para restablecer tu contraseña`,
      htmlContent: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0f172a;margin-bottom:8px">Restablece tu contraseña</h2>
          <p style="color:#475569;line-height:1.6">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta de VibeFitAI.
            Escribe este código en la pantalla donde lo pidió. Caduca en 15 minutos.
          </p>
          <p style="font-family:ui-monospace,monospace;font-size:32px;font-weight:700;
                     letter-spacing:8px;color:#131b2e;background:#f7f9fb;border-radius:12px;
                     padding:16px 20px;text-align:center;margin:20px 0">
            ${code}
          </p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6">
            Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo respondió HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}
