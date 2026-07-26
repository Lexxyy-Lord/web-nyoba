import { Badge } from "@/components/ui/badge";
const styles: Record<string, string> = {
  WAITING_OTP: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950",
  OTP_RECEIVED: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950",
  COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950",
  CANCELED: "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900",
  EXPIRED: "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950",
  FAILED: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950",
  REFUNDED: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950",
  SUCCESS: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950",
  PENDING: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950",
};
const labels: Record<string, string> = { WAITING_OTP: "Menunggu OTP", OTP_RECEIVED: "OTP diterima", COMPLETED: "Selesai", CANCELED: "Dibatalkan", EXPIRED: "Kedaluwarsa", FAILED: "Gagal", REFUNDED: "Refund", SUCCESS: "Berhasil", PENDING: "Tertunda", ORDERING: "Memesan", WAITING_PAYMENT: "Menunggu pembayaran", MANUAL_REVIEW: "Ditinjau admin" };
export function StatusBadge({ status }: { status: string }) { return <Badge className={styles[status] ?? "bg-[var(--muted)]"}>{labels[status] ?? status}</Badge>; }
