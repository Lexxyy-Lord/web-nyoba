import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { safeJson } from "@/lib/utils";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data: safeJson(data) },
    { status },
  );
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data tidak valid",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server",
      },
    },
    { status: 500 },
  );
}

export function getClientMeta(request: NextRequest) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return {
    ipAddress: forwarded ?? request.headers.get("x-real-ip") ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

function originOf(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: NextRequest) {
  const origin = originOf(request.headers.get("origin"));
  if (!origin) return;

  const allowedOrigins = new Set<string>();
  allowedOrigins.add(request.nextUrl.origin);

  const configuredAppOrigin = originOf(env().APP_URL);
  if (configuredAppOrigin) allowedOrigins.add(configuredAppOrigin);

  if (env().TRUST_PROXY) {
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();

    if (forwardedProto && forwardedHost) {
      const proxyOrigin = originOf(`${forwardedProto}://${forwardedHost}`);
      if (proxyOrigin) allowedOrigins.add(proxyOrigin);
    }
  }

  if (!allowedOrigins.has(origin)) {
    throw new AppError(
      "CSRF_REJECTED",
      "Origin permintaan tidak diizinkan",
      403,
    );
  }
}
