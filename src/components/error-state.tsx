import { AlertTriangle } from "lucide-react";
export function ErrorState({ message = "Data gagal dimuat. Silakan coba lagi." }: { message?: string }) { return <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-800 dark:bg-red-950"><AlertTriangle className="mb-2 size-5"/><p className="font-semibold">{message}</p></div>; }
