import { Prisma } from "@prisma/client";
import { mutateBalance } from "@/lib/balance";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/http";
import { formatRupiah } from "@/lib/money";
import { createReference } from "@/lib/utils";

const pendingDepositStatuses = [
  "REQUESTED",
  "WAITING_PAYMENT",
  "MANUAL_REVIEW",
] as const;

export async function createManualDeposit(userId: string, amount: bigint) {
  if (amount < 10_000n) {
    throw new AppError(
      "MINIMUM_DEPOSIT",
      "Minimum deposit adalah Rp10.000",
      422,
    );
  }

  const deposit = await prisma.$transaction(
    async (tx) => {
      const pending = await tx.deposit.count({
        where: {
          userId,
          status: { in: [...pendingDepositStatuses] },
        },
      });

      if (pending >= 3) {
        throw new AppError(
          "PENDING_DEPOSIT_LIMIT",
          "Maksimal 3 permintaan deposit tertunda",
          409,
        );
      }

      const reference = createReference("DEP");
      return tx.deposit.create({
        data: {
          internalDepositNumber: reference,
          userId,
          amountRequested: amount,
          amountReceived: amount,
          method: "WHATSAPP_ADMIN",
          status: "WAITING_PAYMENT",
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
          statusHistory: {
            create: {
              toStatus: "WAITING_PAYMENT",
              reason: "Pengguna diarahkan ke WhatsApp super admin",
            },
          },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  const text = encodeURIComponent(
    [
      `Halo Admin ${env().APP_NAME}, saya ingin deposit saldo.`,
      "",
      `ID Deposit: ${deposit.internalDepositNumber}`,
      `Nominal: ${formatRupiah(deposit.amountRequested)}`,
      `User ID: ${userId}`,
      "",
      "Mohon kirim instruksi pembayaran.",
    ].join("\n"),
  );

  return {
    deposit,
    whatsappUrl: `https://wa.me/${env().SUPER_ADMIN_WHATSAPP}?text=${text}`,
  };
}

export async function approveManualDeposit(
  depositId: string,
  adminId: string,
  note?: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: { id: depositId },
      });

      if (!deposit) {
        throw new AppError(
          "DEPOSIT_NOT_FOUND",
          "Deposit tidak ditemukan",
          404,
        );
      }

      if (deposit.creditedTransactionId || deposit.status === "SUCCESS") {
        return deposit;
      }

      if (!pendingDepositStatuses.includes(deposit.status as never)) {
        throw new AppError(
          "DEPOSIT_NOT_APPROVABLE",
          "Status deposit tidak dapat disetujui",
          409,
        );
      }

      const claimed = await tx.deposit.updateMany({
        where: {
          id: deposit.id,
          creditedTransactionId: null,
          status: { in: [...pendingDepositStatuses] },
        },
        data: {
          status: "MANUAL_REVIEW",
          approvedBy: adminId,
          approvedAt: new Date(),
          adminNote: note,
        },
      });

      if (claimed.count !== 1) {
        const current = await tx.deposit.findUnique({
          where: { id: deposit.id },
        });

        if (current?.creditedTransactionId || current?.status === "SUCCESS") {
          return current;
        }

        throw new AppError(
          "DEPOSIT_APPROVAL_CONFLICT",
          "Deposit sedang diproses oleh transaksi lain",
          409,
        );
      }

      const transactionId = createReference("DCR");
      await mutateBalance(tx, {
        userId: deposit.userId,
        amount: deposit.amountReceived,
        direction: "CREDIT",
        type: "DEPOSIT",
        description: `Deposit manual ${deposit.internalDepositNumber}`,
        depositId: deposit.id,
        adminId,
        transactionId,
      });

      await tx.depositStatusHistory.create({
        data: {
          depositId: deposit.id,
          fromStatus: deposit.status,
          toStatus: "SUCCESS",
          adminId,
          reason: note ?? "Disetujui admin",
        },
      });

      await tx.notification.create({
        data: {
          userId: deposit.userId,
          title: "Deposit berhasil",
          message: `Saldo telah ditambahkan untuk ${deposit.internalDepositNumber}`,
          type: "SUCCESS",
          actionUrl: "/dashboard/balance-history",
        },
      });

      return tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: "SUCCESS",
          approvedBy: adminId,
          approvedAt: new Date(),
          creditedTransactionId: transactionId,
          adminNote: note,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
