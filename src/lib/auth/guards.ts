import { redirect } from "next/navigation";
import { AppError } from "@/lib/http";
import { getCurrentSession } from "@/lib/auth/session";

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function requireApiUser() {
  const session = await getCurrentSession();
  if (!session) throw new AppError("UNAUTHENTICATED", "Silakan login terlebih dahulu", 401);
  return session.user;
}

export async function requireAdmin() {
  const user = await requireApiUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role.key)) throw new AppError("FORBIDDEN", "Akses admin diperlukan", 403);
  return user;
}

export async function requireAdminPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role.key)) redirect("/dashboard");
  return user;
}
