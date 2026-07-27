import { NextRequest } from "next/server";
import { z } from "zod";
import { auditAdmin } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import {
  assertSameOrigin,
  fail,
  getClientMeta,
  ok,
} from "@/lib/http";
import { approveManualDeposit } from "@/services/deposit-service";

const bodySchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const meta = getClientMeta(request);
    const { id } = await params;
    const { note } = bodySchema.parse(await request.json().catch(() => ({})));
    const deposit = await approveManualDeposit(id, admin.id, note);

    await auditAdmin({
      adminId: admin.id,
      action: "DEPOSIT_APPROVED",
      entityType: "Deposit",
      entityId: deposit.id,
      description: `Deposit ${deposit.internalDepositNumber} disetujui`,
      ...meta,
      afterData: {
        status: deposit.status,
        userId: deposit.userId,
        amount: deposit.amountReceived.toString(),
        creditedTransactionId: deposit.creditedTransactionId,
      },
    });

    return ok(deposit);
  } catch (error) {
    return fail(error);
  }
}
