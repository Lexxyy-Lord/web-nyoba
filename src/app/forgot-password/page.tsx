import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Lupa Password | OTPMarket",
};

export default function ForgotPasswordPage() {
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
              <Mail className="size-5" />
            </div>
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Masukkan email akun. Instruksi reset akan dikirim bila akun ditemukan.
            </p>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/forgot-password" method="post" className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <Button className="w-full" type="submit">
                Kirim tautan reset
              </Button>
            </form>
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
