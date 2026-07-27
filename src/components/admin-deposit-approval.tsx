"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminDepositApproval({
  depositId,
  reference,
  user,
  amount,
}: {
  depositId: string;
  reference: string;
  user: string;
  amount: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function approve() {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/deposits/${depositId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Deposit gagal disetujui");
      }

      toast.success(`Deposit ${reference} berhasil disetujui`);
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Deposit gagal disetujui",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Setujui deposit ${reference}`}
      >
        <CheckCircle2 className="size-4" />
        Setujui
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`approve-title-${depositId}`}
        >
          <div className="w-full max-w-md rounded-2xl border bg-[var(--card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`approve-title-${depositId}`}
                  className="text-lg font-black"
                >
                  Konfirmasi deposit
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Pastikan pembayaran sudah benar-benar diterima sebelum saldo
                  ditambahkan.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup konfirmasi"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <dl className="mt-5 space-y-3 rounded-xl bg-[var(--muted)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">ID Deposit</dt>
                <dd className="font-bold">{reference}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Pengguna</dt>
                <dd className="font-bold">{user}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Nominal</dt>
                <dd className="font-black">{amount}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <Label htmlFor={`deposit-note-${depositId}`}>
                Catatan verifikasi opsional
              </Label>
              <Input
                id={`deposit-note-${depositId}`}
                value={note}
                maxLength={1000}
                placeholder="Contoh: Pembayaran QRIS sudah diterima"
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="button" disabled={loading} onClick={approve}>
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Ya, tambahkan saldo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
