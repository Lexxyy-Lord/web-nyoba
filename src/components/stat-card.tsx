import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export function StatCard({ title, value, description, icon: Icon }: { title: string; value: string; description?: string; icon: LucideIcon }) {
  return <Card><CardContent className="flex items-start justify-between pt-6"><div><p className="text-sm text-[var(--muted-foreground)]">{title}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p>{description && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>}</div><div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500"><Icon className="size-5" /></div></CardContent></Card>;
}
