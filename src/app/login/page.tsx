import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Login | OTPMarket",
  description: "Masuk ke akun OTPMarket Anda.",
};

export default function LoginPage() {
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
            <CardTitle className="text-2xl">Selamat datang kembali</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Masuk untuk mengelola saldo dan pesanan OTP.
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" />
            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              Belum punya akun?{" "}
              <Link href="/register" className="font-semibold text-indigo-500">
                Daftar sekarang
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
