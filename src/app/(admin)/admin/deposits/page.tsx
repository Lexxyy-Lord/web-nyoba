import { AdminDepositApproval } from "@/components/admin-deposit-approval";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/money";

const approvableStatuses = new Set([
  "REQUESTED",
  "WAITING_PAYMENT",
  "MANUAL_REVIEW",
]);

export default async function AdminDepositsPage() {
  const deposits = await prisma.deposit.findMany({
    include: { user: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Deposit Manual"
        description="Permintaan diarahkan ke WhatsApp super admin. Setujui hanya setelah pembayaran benar-benar diverifikasi."
      />
      <DataTable
        headers={[
          "ID",
          "User",
          "Nominal",
          "Metode",
          "Status",
          "Dibuat",
          "Aksi",
        ]}
        rows={deposits.map((deposit) => [
          deposit.internalDepositNumber,
          deposit.user.username,
          formatRupiah(deposit.amountReceived),
          deposit.method,
          <StatusBadge key={`${deposit.id}-status`} status={deposit.status} />,
          deposit.createdAt.toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          }),
          approvableStatuses.has(deposit.status) ? (
            <AdminDepositApproval
              key={`${deposit.id}-action`}
              depositId={deposit.id}
              reference={deposit.internalDepositNumber}
              user={deposit.user.username}
              amount={formatRupiah(deposit.amountReceived)}
            />
          ) : (
            <span
              key={`${deposit.id}-empty-action`}
              className="text-xs text-[var(--muted-foreground)]"
            >
              Tidak ada aksi
            </span>
          ),
        ])}
      />
    </>
  );
}
