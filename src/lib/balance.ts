import { Prisma, type LedgerType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http";
import { createReference } from "@/lib/utils";

export type BalanceChange = {
  userId: string;
  amount: bigint;
  direction: "CREDIT" | "DEBIT";
  type: LedgerType;
  description: string;
  orderId?: string;
  depositId?: string;
  adminId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  transactionId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function mutateBalance(tx: Prisma.TransactionClient, input: BalanceChange) {
  if (input.amount <= 0n) throw new AppError("INVALID_AMOUNT", "Nominal harus lebih dari nol", 422);
  const current = await tx.userBalance.findUnique({ where: { userId: input.userId } });
  if (!current) throw new AppError("BALANCE_NOT_FOUND", "Saldo pengguna tidak ditemukan", 404);
  if (input.direction === "DEBIT" && current.balance < input.amount) {
    throw new AppError("INSUFFICIENT_BALANCE", "Saldo tidak mencukupi", 409);
  }
  const next = input.direction === "CREDIT" ? current.balance + input.amount : current.balance - input.amount;
  const updated = await tx.userBalance.updateMany({
    where: { userId: input.userId, version: current.version, ...(input.direction === "DEBIT" ? { balance: { gte: input.amount } } : {}) },
    data: { balance: next, version: { increment: 1 } },
  });
  if (updated.count !== 1) throw new AppError("BALANCE_CONFLICT", "Saldo berubah oleh transaksi lain. Silakan ulangi.", 409);
  const ledger = await tx.balanceLedger.create({
    data: {
      transactionId: input.transactionId ?? createReference("LED"),
      userId: input.userId,
      type: input.type,
      debit: input.direction === "DEBIT" ? input.amount : 0n,
      credit: input.direction === "CREDIT" ? input.amount : 0n,
      balanceBefore: current.balance,
      balanceAfter: next,
      orderId: input.orderId,
      depositId: input.depositId,
      description: input.description,
      adminId: input.adminId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata,
    },
  });
  return { before: current.balance, after: next, ledger };
}

export function adjustBalance(input: BalanceChange) {
  return prisma.$transaction((tx) => mutateBalance(tx, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
