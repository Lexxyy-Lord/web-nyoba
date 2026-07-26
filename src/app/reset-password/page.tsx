import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Password Baru | OTPMarket",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-black">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ShieldCheck className="size-5" />
          </span>
          OTPMarket
        </Link>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="text-2xl">Buat password baru</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Gunakan minimal 8 karakter dan jangan gunakan password yang sama dengan layanan lain.
            </p>
          </CardHeader>
          <CardContent>
            {token ? (
              <form action="/api/auth/reset-password" method="post" className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <Label htmlFor="password">Password baru</Label>
                  <Input id="password" name="password" type="password" minLength={8} required />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
                </div>
                <Button className="w-full" type="submit">
                  Simpan password baru
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                Token reset tidak tersedia. Minta tautan reset password yang baru.
              </div>
            )}
            <p className="mt-6 text-center text-sm">
              <Link href="/login" className="font-semibold text-indigo-500">
                Kembali ke login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
