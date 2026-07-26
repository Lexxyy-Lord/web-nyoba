import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!env().SMTP_HOST) {
    if (env().NODE_ENV !== "production") console.info("Password reset URL:", resetUrl);
    return { delivered: false };
  }
  const transport = nodemailer.createTransport({
    host: env().SMTP_HOST,
    port: env().SMTP_PORT,
    secure: env().SMTP_PORT === 465,
    auth: { user: env().SMTP_USER, pass: env().SMTP_PASSWORD },
  });
  await transport.sendMail({
    from: env().SMTP_FROM,
    to,
    subject: `Reset password ${env().APP_NAME}`,
    text: `Gunakan tautan berikut untuk mengatur password baru. Tautan berlaku 30 menit: ${resetUrl}`,
    html: `<p>Gunakan tautan berikut untuk mengatur password baru. Tautan berlaku 30 menit.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
  return { delivered: true };
}
