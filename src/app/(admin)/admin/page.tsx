import {
  CheckCircle2,
  Clock3,
  ReceiptText,
  Server,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { rumahOtp } from "@/lib/rumahotp/services";

export default async function AdminDashboardPage() {
  const [
    users,
    balance,
    orders,
    success,
    failed,
    pending,
    totals,
    latest,
    provider,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userBalance.aggregate({ _sum: { balance: true } }),
    prisma.otpOrder.count(),
    prisma.otpOrder.count({
      where: { status: { in: ["OTP_RECEIVED", "COMPLETED"] } },
    }),
    prisma.otpOrder.count({ where: { status: "FAILED" } }),
    prisma.deposit.count({
      where: {
        status: { in: ["REQUESTED", "WAITING_PAYMENT", "MANUAL_REVIEW"] },
      },
    }),
    prisma.otpOrder.aggregate({
      _sum: { sellingPrice: true, costPrice: true, profitAmount: true },
    }),
    prisma.otpOrder.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    rumahOtp.getBalance().catch(() => null),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard Admin"
        description="Kinerja bisnis, status provider, dan aktivitas terbaru."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total pengguna" value={String(users)} icon={Users} />
        <StatCard
          title="Total saldo user"
          value={formatRupiah(balance._sum.balance ?? 0n)}
          icon={Wallet}
        />
        <StatCard
          title="Total pesanan"
          value={String(orders)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total omzet"
          value={formatRupiah(totals._sum.sellingPrice ?? 0n)}
          icon={ReceiptText}
        />
        <StatCard
          title="Total keuntungan"
          value={formatRupiah(totals._sum.profitAmount ?? 0n)}
          icon={TrendingUp}
        />
        <StatCard
          title="Pesanan berhasil"
          value={String(success)}
          icon={CheckCircle2}
        />
        <StatCard
          title="Pesanan gagal"
          value={String(failed)}
          icon={XCircle}
        />
        <StatCard
          title="Deposit pending"
          value={String(pending)}
          icon={Clock3}
        />
        <StatCard
          title="Saldo RumahOTP"
          value={provider ? formatRupiah(provider.balance) : "Tidak tersedia"}
          icon={Server}
        />
      </div>
      <div className="mt-6">
        <SectionCard title="Transaksi terbaru">
          <DataTable
            headers={[
              "Order",
              "User",
              "Layanan",
              "Modal",
              "Jual",
              "Profit",
              "Status",
            ]}
            rows={latest.map((order) => [
              order.internalOrderNumber,
              order.user.username,
              order.serviceName,
              formatRupiah(order.costPrice),
              formatRupiah(order.sellingPrice),
              formatRupiah(order.profitAmount),
              <StatusBadge key={order.id} status={order.status} />,
            ])}
          />
        </SectionCard>
      </div>
    </>
  );
}
