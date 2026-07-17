import { logger } from "@/lib/logger";

// Envío de correo vía Resend (API REST, sin SDK). Sigue el mismo patrón de
// env-guard que R2/QStash/Redis: si no está configurado, en desarrollo se
// registra el enlace en el log para poder probar el flujo igualmente.
const resendAvailable =
  process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("...");

const FROM = process.env.EMAIL_FROM ?? "VibeFitAI <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resendAvailable) {
    logger.warn("email", "RESEND_API_KEY no configurada; enlace de restablecimiento solo en log", {
      to,
      resetUrl,
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
      subject: "Restablece tu contraseña de VibeFitAI",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0f172a;margin-bottom:8px">Restablece tu contraseña</h2>
          <p style="color:#475569;line-height:1.6">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta de VibeFitAI.
            Si fuiste tú, haz clic en el botón para elegir una nueva. El enlace caduca en 1 hora.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#131b2e;color:#ffffff;font-weight:600;
                    padding:12px 24px;border-radius:12px;text-decoration:none;margin:16px 0">
            Elegir nueva contraseña
          </a>
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
