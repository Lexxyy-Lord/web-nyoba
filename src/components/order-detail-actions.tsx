"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  phoneNumber: string | null;
  otpCode: string | null;
  otpMessage: string | null;
  status: string;
  providerExpiredAt: string | null;
};

const FINAL_STATUSES = new Set([
  "COMPLETED",
  "CANCELED",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
]);

export function OrderDetailActions({ initial }: { initial: Order }) {
  const [order, setOrder] = useState(initial);
  const final = useMemo(() => FINAL_STATUSES.has(order.status), [order.status]);

  const sync = useCallback(async () => {
    const response = await fetch(`/api/orders/${order.id}`);
    const body = await response.json();

    if (!response.ok || !body.success) {
      throw new Error(body.error?.message ?? "Gagal menyinkronkan pesanan");
    }

    setOrder(body.data);
  }, [order.id]);

  useEffect(() => {
    if (final) return;

    const timer = window.setInterval(() => {
      sync().catch((error: Error) => toast.error(error.message));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [final, sync]);

  async function action(name: "cancel" | "done" | "resend") {
    const response = await fetch(`/api/orders/${order.id}/${name}`, {
      method: "POST",
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      toast.error(body.error?.message ?? "Gagal memperbarui pesanan");
      return;
    }

    setOrder(body.data);
    toast.success("Status diperbarui");
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} disalin`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={order.status} />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            sync().catch((error: Error) => toast.error(error.message))
          }
        >
          <RefreshCw className="size-4" />
          Sinkronkan
        </Button>
      </div>

      <div className="rounded-2xl bg-[var(--muted)] p-5">
        <p className="text-xs text-[var(--muted-foreground)]">Nomor virtual</p>
        <div className="mt-2 flex justify-between gap-4">
          <p className="text-2xl font-black">
            {order.phoneNumber ?? "Menunggu..."}
          </p>
          {order.phoneNumber && (
            <Button
              size="icon"
              variant="outline"
              aria-label="Salin nomor virtual"
              onClick={() => copy(order.phoneNumber!, "Nomor virtual")}
            >
              <Copy className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-5 dark:bg-indigo-950">
        <p className="text-xs text-indigo-600 dark:text-indigo-300">Kode OTP</p>
        <div className="mt-2 flex justify-between gap-4">
          <p className="text-3xl font-black tracking-[.2em]">
            {order.otpCode ?? "------"}
          </p>
          {order.otpCode && (
            <Button
              size="icon"
              variant="outline"
              aria-label="Salin kode OTP"
              onClick={() => copy(order.otpCode!, "Kode OTP")}
            >
              <Copy className="size-4" />
            </Button>
          )}
        </div>
        {order.otpMessage && (
          <p className="mt-4 whitespace-pre-wrap text-sm">{order.otpMessage}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!final && (
          <Button variant="outline" onClick={() => action("resend")}>
            Kirim ulang OTP
          </Button>
        )}
        {["WAITING_OTP", "CANCEL_REQUESTED"].includes(order.status) && (
          <Button variant="destructive" onClick={() => action("cancel")}>
            Batalkan & refund
          </Button>
        )}
        {order.otpCode && order.status !== "COMPLETED" && (
          <Button onClick={() => action("done")}>Tandai selesai</Button>
        )}
      </div>
    </div>
  );
}
