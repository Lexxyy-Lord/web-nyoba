import type { NavItem } from "@/components/app-shell";

export const userNavigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "gauge" },
  {
    href: "/dashboard/buy-number",
    label: "Beli Nomor",
    icon: "packageSearch",
  },
  {
    href: "/dashboard/orders",
    label: "Pesanan Aktif",
    icon: "listChecks",
  },
  {
    href: "/dashboard/order-history",
    label: "Riwayat Pesanan",
    icon: "fileClock",
  },
  {
    href: "/dashboard/balance-history",
    label: "Riwayat Saldo",
    icon: "walletCards",
  },
  { href: "/dashboard/deposit", label: "Deposit", icon: "creditCard" },
  {
    href: "/dashboard/notifications",
    label: "Notifikasi",
    icon: "bell",
  },
  { href: "/dashboard/profile", label: "Profil", icon: "userRound" },
  { href: "/dashboard/security", label: "Keamanan", icon: "keyRound" },
  {
    href: "/dashboard/help",
    label: "Bantuan",
    icon: "bookOpenText",
  },
];

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "gauge" },
  { href: "/admin/users", label: "Pengguna", icon: "users" },
  {
    href: "/admin/balances",
    label: "Saldo Pengguna",
    icon: "circleDollarSign",
  },
  {
    href: "/admin/orders",
    label: "Pesanan OTP",
    icon: "receiptText",
  },
  { href: "/admin/deposits", label: "Deposit", icon: "landmark" },
  {
    href: "/admin/ledger",
    label: "Mutasi Saldo",
    icon: "walletCards",
  },
  {
    href: "/admin/pricing",
    label: "Pengaturan Harga",
    icon: "badgeDollarSign",
  },
  { href: "/admin/services", label: "Layanan", icon: "boxes" },
  {
    href: "/admin/providers",
    label: "Negara & Provider",
    icon: "packageSearch",
  },
  {
    href: "/admin/reports",
    label: "Laporan Keuntungan",
    icon: "activity",
  },
  { href: "/admin/api-logs", label: "Log API", icon: "logs" },
  {
    href: "/admin/activity-logs",
    label: "Log Aktivitas",
    icon: "fileClock",
  },
  {
    href: "/admin/notifications",
    label: "Notifikasi",
    icon: "bell",
  },
  {
    href: "/admin/settings",
    label: "Pengaturan Website",
    icon: "settings",
  },
  {
    href: "/admin/security",
    label: "Pengaturan Keamanan",
    icon: "shieldCheck",
  },
  {
    href: "/admin/profile",
    label: "Profil Admin",
    icon: "userRound",
  },
];
