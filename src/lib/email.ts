import { logger } from "@/lib/logger";

// Envío de correo vía Resend (API REST, sin SDK). Sigue el mismo patrón de
// env-guard que R2/QStash/Redis: si no está configurado, en desarrollo se
// registra el enlace en el log para poder probar el flujo igualmente.
const resendAvailable =
  process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("...");

const FROM = process.env.EMAIL_FROM ?? "VibeFitAI <onboarding@resend.dev>";

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  if (!resendAvailable) {
    logger.warn("email", "RESEND_API_KEY no configurada; código de restablecimiento solo en log", {
      to,
      code,
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: `${code} es tu código para restablecer tu contraseña`,
      html: `
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
    throw new Error(`Resend respondió HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}
