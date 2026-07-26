import { prisma } from "@/lib/db";

export function auditAdmin(input: {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  return prisma.adminActivityLog.create({
    data: {
      ...input,
      beforeData: input.beforeData as never,
      afterData: input.afterData as never,
    },
  });
}
