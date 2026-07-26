import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hashValue } from "@/lib/request-hash";

export const SESSION_COOKIE = "otpmarket_session";

export async function createSession(userId: string, remember: boolean, meta: { ipAddress?: string | null; userAgent?: string | null }) {
  const rawToken = randomBytes(32).toString("base64url");
  const maxAge = remember ? env().SESSION_MAX_AGE : 60 * 60 * 24;
  const expires = new Date(Date.now() + maxAge * 1000);
  await prisma.session.create({
    data: {
      userId,
      sessionToken: hashValue(rawToken),
      expires,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
    priority: "high",
  });
}

export async function destroySession() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  if (rawToken) await prisma.session.deleteMany({ where: { sessionToken: hashValue(rawToken) } });
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken: hashValue(rawToken) },
    include: { user: { include: { role: true, balance: true, profile: true } } },
  });
  if (!session || session.expires <= new Date() || session.user.status !== "ACTIVE") {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    void prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return session;
}
