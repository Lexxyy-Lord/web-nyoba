import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { safeJson } from "@/lib/utils";

export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) {
    super(message);
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data: safeJson(data) }, { status });
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: (error as ZodError).flatten() } }, { status: 422 });
  }
  console.error(error);
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server" } }, { status: 500 });
}

export function getClientMeta(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: forwarded ?? request.headers.get("x-real-ip") ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new AppError("CSRF_REJECTED", "Origin permintaan tidak diizinkan", 403);
}
