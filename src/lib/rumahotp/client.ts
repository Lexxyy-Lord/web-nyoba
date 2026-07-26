import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { RumahOtpError } from "./errors";
import { rumahOtpRateLimiter } from "./rate-limiter";
import type { RumahOtpEnvelope } from "./types";

const sensitiveKeys = new Set(["x-apikey", "apiKey", "password", "token", "cookie"]);
function sanitize(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 10).map(sanitize);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !sensitiveKeys.has(key)).map(([key, item]) => [key, sanitize(item)]));
}

export async function rumahOtpRequest<T>(path: string, params: Record<string, string | number> = {}, context?: { userId?: string; orderId?: string; auth?: boolean }) {
  return rumahOtpRateLimiter.schedule(async () => {
    const started = Date.now();
    let statusCode: number | undefined;
    try {
      const url = new URL(`${env().RUMAHOTP_BASE_URL}${path}`);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env().RUMAHOTP_REQUEST_TIMEOUT);
      const headers: HeadersInit = { Accept: "application/json", "Cache-Control": "no-store" };
      if (context?.auth !== false) {
        if (!env().RUMAHOTP_API_KEY) throw new RumahOtpError("MISSING_API_KEY", "RUMAHOTP_API_KEY belum dikonfigurasi", 500);
        headers["x-apikey"] = env().RUMAHOTP_API_KEY;
      }
      const response = await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      statusCode = response.status;
      const body = (await response.json()) as RumahOtpEnvelope<T>;
      if (!response.ok || !body || body.success !== true) {
        const message = body && body.success === false ? body.error?.message : undefined;
        throw new RumahOtpError("PROVIDER_REJECTED", message ?? `RumahOTP merespons HTTP ${response.status}`, response.status, response.status >= 500);
      }
      void prisma.apiRequestLog.create({ data: { userId: context?.userId, orderId: context?.orderId, endpoint: path, method: "GET", statusCode, responseTimeMs: Date.now() - started, success: true, requestMeta: sanitize(params) as never } });
      return body.data;
    } catch (error) {
      const normalized = error instanceof RumahOtpError ? error : new RumahOtpError("PROVIDER_TIMEOUT", error instanceof Error ? error.message : "Provider tidak dapat dihubungi", statusCode, true);
      void prisma.apiRequestLog.create({ data: { userId: context?.userId, orderId: context?.orderId, endpoint: path, method: "GET", statusCode, responseTimeMs: Date.now() - started, success: false, errorCode: normalized.code, requestMeta: sanitize(params) as never } });
      throw normalized;
    }
  });
}
