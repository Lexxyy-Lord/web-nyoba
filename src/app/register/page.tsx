import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Daftar | OTPMarket",
  description: "Buat akun OTPMarket untuk membeli nomor virtual dan menerima OTP.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-black">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ShieldCheck className="size-5" />
          </span>
          OTPMarket
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Buat akun baru</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Daftar untuk mulai menggunakan layanan nomor virtual secara aman.
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" />
            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-indigo-500">
                Masuk
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
