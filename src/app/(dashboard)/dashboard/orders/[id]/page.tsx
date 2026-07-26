import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { OrderDetailActions } from "@/components/order-detail-actions";
export default async function OrderDetail({params}:{params:Promise<{id:string}>}){const user=await requireUser();const {id}=await params;const order=await prisma.otpOrder.findFirst({where:{id,userId:user.id}});if(!order)notFound();return <><PageHeader title={order.internalOrderNumber} description={`${order.serviceName} • ${order.countryName} • ${formatRupiah(order.sellingPrice)}`}/><div className="grid gap-6 lg:grid-cols-[1fr_.6fr]"><SectionCard title="Nomor dan OTP"><OrderDetailActions initial={{id:order.id,phoneNumber:order.phoneNumber,otpCode:order.otpCode,otpMessage:order.otpMessage,status:order.status,providerExpiredAt:order.providerExpiredAt?.toISOString()??null}}/></SectionCard><SectionCard title="Ringkasan"><dl className="space-y-4 text-sm">{[["Layanan",order.serviceName],["Negara",order.countryName],["Operator",order.operatorName],["Harga",formatRupiah(order.sellingPrice)],["Dibuat",new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(order.createdAt)]].map(([k,v])=><div key={k} className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">{k}</dt><dd className="text-right font-bold">{v}</dd></div>)}</dl></SectionCard></div></>}
