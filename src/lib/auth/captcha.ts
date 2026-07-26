import { env } from "@/lib/env";
import { AppError } from "@/lib/http";

export async function verifyCaptcha(token?: string) {
  if (!env().TURNSTILE_ENABLED) return;
  if (!token || !env().TURNSTILE_SECRET_KEY) throw new AppError("CAPTCHA_REQUIRED", "Verifikasi anti-bot diperlukan", 422);
  const body = new URLSearchParams({ secret: env().TURNSTILE_SECRET_KEY, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
  const data = (await response.json()) as { success?: boolean };
  if (!data.success) throw new AppError("CAPTCHA_INVALID", "Verifikasi anti-bot gagal", 422);
}
