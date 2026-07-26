import { AppShell } from "@/components/app-shell";
import { userNavigation } from "@/data/navigation";
import { requireUser } from "@/lib/auth/guards";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) { const user = await requireUser(); return <AppShell items={userNavigation} user={{name:user.name,email:user.email,role:user.role.key}}>{children}</AppShell>; }
