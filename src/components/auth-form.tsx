"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (mode === "login") payload.remember = form.get("remember") === "on" ? "true" : "false";
    else payload.acceptTerms = form.get("acceptTerms") === "on" ? "true" : "false";
    const normalized = { ...payload, remember: payload.remember === "true", acceptTerms: payload.acceptTerms === "true" };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(normalized) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message ?? "Permintaan gagal");
      toast.success(mode === "login" ? "Login berhasil" : "Akun berhasil dibuat");
      router.push("/dashboard"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Terjadi kesalahan"); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    {mode === "register" && <><div><Label htmlFor="name">Nama lengkap</Label><Input id="name" name="name" required minLength={2}/></div><div><Label htmlFor="username">Username</Label><Input id="username" name="username" required minLength={3}/></div><input name="website" className="hidden" tabIndex={-1} autoComplete="off"/></>}
    <div><Label htmlFor={mode === "login" ? "identifier" : "email"}>{mode === "login" ? "Email atau username" : "Email"}</Label><Input id={mode === "login" ? "identifier" : "email"} name={mode === "login" ? "identifier" : "email"} type={mode === "login" ? "text" : "email"} required/></div>
    {mode === "register" && <div><Label htmlFor="whatsapp">Nomor WhatsApp (opsional)</Label><Input id="whatsapp" name="whatsapp" inputMode="tel" placeholder="62812..."/></div>}
    <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8}/></div>
    {mode === "register" && <div><Label htmlFor="confirmPassword">Konfirmasi password</Label><Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8}/></div>}
    {mode === "login" ? <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="remember"/> Ingat saya</label><a href="/forgot-password" className="font-semibold text-indigo-500">Lupa password?</a></div> : <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="acceptTerms" className="mt-1" required/><span>Saya menyetujui <a href="/terms" className="text-indigo-500">syarat layanan</a> dan hanya menggunakan layanan untuk aktivitas yang sah.</span></label>}
    <Button className="w-full" disabled={loading}>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}</Button>
  </form>;
}
