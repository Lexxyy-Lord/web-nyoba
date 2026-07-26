import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
export default async function ActiveOrders(){const user=await requireUser();const orders=await prisma.otpOrder.findMany({where:{userId:user.id,status:{in:["ORDERING","WAITING_OTP","OTP_RECEIVED","CANCEL_REQUESTED"]}},orderBy:{createdAt:"desc"}});return <><PageHeader title="Pesanan Aktif" description="Status OTP disinkronkan melalui backend dan berhenti saat status final."/><DataTable headers={["Order","Nomor","Layanan","Negara","Harga","Status","Aksi"]} rows={orders.map(o=>[o.internalOrderNumber,o.phoneNumber??"Menunggu nomor",o.serviceName,o.countryName,formatRupiah(o.sellingPrice),<StatusBadge key={o.id} status={o.status}/>,<Link key={`${o.id}-a`} href={`/dashboard/orders/${o.id}`} className="font-bold text-indigo-500">Detail</Link>])}/></>}
