"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  BookOpenText,
  Boxes,
  CircleDollarSign,
  CreditCard,
  FileClock,
  Gauge,
  KeyRound,
  Landmark,
  ListChecks,
  Logs,
  Menu,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const icons = {
  activity: Activity,
  badgeDollarSign: BadgeDollarSign,
  bell: Bell,
  bookOpenText: BookOpenText,
  boxes: Boxes,
  circleDollarSign: CircleDollarSign,
  creditCard: CreditCard,
  fileClock: FileClock,
  gauge: Gauge,
  keyRound: KeyRound,
  landmark: Landmark,
  listChecks: ListChecks,
  logs: Logs,
  packageSearch: PackageSearch,
  receiptText: ReceiptText,
  settings: Settings,
  shieldCheck: ShieldCheck,
  userRound: UserRound,
  users: Users,
  walletCards: WalletCards,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof icons;
export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

type AppShellProps = {
  children: React.ReactNode;
  items: NavItem[];
  user: {
    name: string;
    email: string;
    role: string;
  };
  admin?: boolean;
};

export function AppShell({
  children,
  items,
  user,
  admin = false,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {open && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-[var(--card)] transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b px-6">
          <Link
            href={admin ? "/admin" : "/dashboard"}
            className="flex items-center gap-3 font-black"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              OTPMarket
              <small className="block text-[10px] font-semibold uppercase tracking-[.2em] text-indigo-500">
                {admin ? "Admin Console" : "Secure OTP"}
              </small>
            </span>
          </Link>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            aria-label="Tutup sidebar"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {items.map(({ href, label, icon }) => {
            const Icon = icons[icon];
            const active =
              pathname === href ||
              (href !== "/dashboard" &&
                href !== "/admin" &&
                pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {user.email}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
            {user.role}
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-[var(--background)]/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Button
              className="lg:hidden"
              variant="outline"
              size="icon"
              aria-label="Buka sidebar"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-500">
                {admin ? "Administration" : "Workspace"}
              </p>
              <h1 className="font-bold">
                Selamat datang, {user.name.split(" ")[0]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
