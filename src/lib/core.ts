import { Prisma, PrismaClient, type LedgerType, type OtpOrderStatus, type PricingRule } from "@prisma/client";
import argon2 from "argon2";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { z, ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const config = {
  appName: process.env.APP_NAME ?? "OTPMarket",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  providerUrl: process.env.RUMAHOTP_BASE_URL ?? "https://www.rumahotp.io/api",
  providerKey: process.env.RUMAHOTP_API_KEY ?? "",
  providerTimeout: Number(process.env.RUMAHOTP_REQUEST_TIMEOUT ?? 30000),
  providerMax: Number(process.env.RUMAHOTP_MAX_REQUESTS ?? 5),
  providerWindow: Number(process.env.RUMAHOTP_RATE_WINDOW_MS ?? 10000),
  mock: (process.env.RUMAHOTP_MOCK_MODE ?? "true") === "true",
  defaultProfit: BigInt(process.env.OTP_DEFAULT_PROFIT ?? "10000"),
  rounding: Number(process.env.OTP_PRICE_ROUNDING ?? 100),
  minPrice: BigInt(process.env.OTP_MIN_SELLING_PRICE ?? "0"),
  maxActiveOrders: Number(process.env.MAX_ACTIVE_ORDERS_PER_USER ?? 3),
  superAdminWhatsapp: process.env.SUPER_ADMIN_WHATSAPP ?? "6282141218134",
  sessionMaxAge: Number(process.env.SESSION_MAX_AGE ?? 604800)
};

export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) { super(message); }
}
export function safeJson<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item)) as T; }
export function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data: safeJson(data) }, { status }); }
export function fail(error: unknown) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: error.flatten() } }, { status: 422 });
  console.error(error); return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server" } }, { status: 500 });
}
export function assertSameOrigin(request: NextRequest) { const origin = request.headers.get("origin"); if (origin && origin !== new URL(request.url).origin) throw new AppError("CSRF_REJECTED", "Origin permintaan tidak diizinkan", 403); }
export function clientMeta(request: NextRequest) { return { ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"), userAgent: request.headers.get("user-agent") }; }
export function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function reference(prefix: string) { return `${prefix}${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}${randomBytes(4).toString("hex").toUpperCase()}`; }
export function formatRupiah(value: bigint | number | string) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)); }
export function roundMoney(value: bigint, increment: number) { const step = BigInt(Math.max(1, increment)); return ((value + step - 1n) / step) * step; }

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(); const value = buckets.get(key);
  if (!value || value.reset <= now) { buckets.set(key, { count: 1, reset: now + windowMs }); return; }
  if (value.count >= limit) throw new AppError("RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar.", 429);
  value.count += 1;
}

export const SESSION_COOKIE = "otpmarket_session";
export async function hashPassword(password: string) { return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }); }
export async function createSession(userId: string, remember: boolean, meta: { ipAddress?: string | null; userAgent?: string | null }) {
  const raw = randomBytes(32).toString("base64url"); const maxAge = remember ? config.sessionMaxAge : 86400; const expires = new Date(Date.now() + maxAge * 1000);
  await prisma.session.create({ data: { userId, sessionToken: hash(raw), expires, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
  (await cookies()).set(SESSION_COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires, priority: "high" });
}
export async function destroySession() { const store = await cookies(); const raw = store.get(SESSION_COOKIE)?.value; if (raw) await prisma.session.deleteMany({ where: { sessionToken: hash(raw) } }); store.delete(SESSION_COOKIE); }
export async function currentUser() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; if (!raw) return null;
  const session = await prisma.session.findUnique({ where: { sessionToken: hash(raw) }, include: { user: { include: { role: true, balance: true, profile: true } } } });
  if (!session || session.expires <= new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
}
export async function requireApiUser() { const user = await currentUser(); if (!user) throw new AppError("UNAUTHENTICATED", "Silakan login terlebih dahulu", 401); return user; }
export async function requireAdmin() { const user = await requireApiUser(); if (!["ADMIN", "SUPER_ADMIN"].includes(user.role.key)) throw new AppError("FORBIDDEN", "Akses admin diperlukan", 403); return user; }

export type Service = { service_code: number; service_name: string; service_img: string };
export type Price = { provider_id: string; server_id: number; stock: number; rate: number; price: number; price_format: string; available: boolean };
export type Country = { number_id: number; name: string; img: string; prefix: string; iso_code: string; rate: number; stock_total: number; pricelist: Price[] };
export type Operator = { id: number; name: string; image: string };
export type CreatedOrder = { order_id: string; phone_number: string; service: string; country: string; operator: string; price: number; price_formated: string; created_at: number; expired_at: number };
export type ProviderStatus = { order_id: string; status: string; phone_number: string; service: string; country: string; created_at: number; expired_at: number; otp_code?: string; otp_msg?: string };
const mockServices: Service[] = [{ service_code: 13, service_name: "WhatsApp", service_img: "https://assets.cindigital.id/apps/wa.png" }, { service_code: 4, service_name: "Telegram", service_img: "https://assets.cindigital.id/apps/tg.png" }, { service_code: 7, service_name: "Facebook", service_img: "https://assets.cindigital.id/apps/fb.png" }];
const mockCountries: Country[] = [{ number_id: 340437, name: "Indonesia", img: "https://assets.cindigital.id/flags/id.png", prefix: "+62", iso_code: "id", rate: 81.6, stock_total: 103, pricelist: [{ provider_id: "3837", server_id: 3, stock: 103, rate: 81.6, price: 2500, price_format: "Rp2.500", available: true }] }, { number_id: 340438, name: "Malaysia", img: "https://assets.cindigital.id/flags/my.png", prefix: "+60", iso_code: "my", rate: 75, stock_total: 48, pricelist: [{ provider_id: "4736", server_id: 4, stock: 48, rate: 75, price: 4000, price_format: "Rp4.000", available: true }] }];
const mockOperators: Operator[] = [{ id: 1, name: "any", image: "" }, { id: 2, name: "indosat", image: "" }, { id: 3, name: "telkomsel", image: "" }];
const mockOrders = new Map<string, number>();
let providerTimes: number[] = []; let providerQueue = Promise.resolve();
async function providerRequest<T>(path: string, params: Record<string, string | number> = {}, userId?: string, orderId?: string) {
  const run = providerQueue.then(async () => {
    const now = Date.now(); providerTimes = providerTimes.filter(time => now - time < config.providerWindow);
    if (providerTimes.length >= config.providerMax) await new Promise(resolve => setTimeout(resolve, config.providerWindow - (now - providerTimes[0]) + 25));
    providerTimes.push(Date.now()); const started = Date.now();
    const url = new URL(`${config.providerUrl}${path}`); Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.providerTimeout);
    try {
      if (!config.providerKey) throw new AppError("MISSING_API_KEY", "RUMAHOTP_API_KEY belum dikonfigurasi", 500);
      const response = await fetch(url, { method: "GET", headers: { Accept: "application/json", "x-apikey": config.providerKey, "Cache-Control": "no-store" }, cache: "no-store", signal: controller.signal });
      const body = await response.json() as { success: boolean; data?: T; error?: { message?: string } }; clearTimeout(timer);
      void prisma.apiRequestLog.create({ data: { userId, orderId, endpoint: path, method: "GET", statusCode: response.status, responseTimeMs: Date.now() - started, success: response.ok && body.success, errorCode: body.success ? null : "PROVIDER_REJECTED", requestMeta: params } });
      if (!response.ok || !body.success || body.data === undefined) throw new AppError("PROVIDER_REJECTED", body.error?.message ?? "RumahOTP menolak permintaan", response.status || 502);
      return body.data;
    } catch (error) { clearTimeout(timer); if (error instanceof AppError) throw error; throw new AppError("PROVIDER_TIMEOUT", "RumahOTP tidak dapat dihubungi", 504); }
  });
  providerQueue = run.then(() => undefined, () => undefined); return run;
}
export const rumahOtp = {
  services: async () => config.mock ? mockServices : providerRequest<Service[]>("/v2/services"),
  countries: async (serviceId: number) => config.mock ? mockCountries : providerRequest<Country[]>("/v2/countries", { service_id: serviceId }),
  operators: async (country: string, providerId: string) => config.mock ? mockOperators : providerRequest<Operator[]>("/v2/operators", { country, provider_id: providerId }),
  createOrder: async (numberId: number, providerId: string, operatorId: number, userId: string): Promise<CreatedOrder> => {
    if (!config.mock) return providerRequest<CreatedOrder>("/v2/orders", { number_id: numberId, provider_id: providerId, operator_id: operatorId }, userId);
    const id = `MOCK${Date.now()}`; mockOrders.set(id, Date.now()); return { order_id: id, phone_number: "+62 858 4441 4442", service: "WhatsApp", country: "Indonesia", operator: "any", price: 2500, price_formated: "Rp2.500", created_at: Date.now(), expired_at: Date.now() + 20 * 60_000 };
  },
  checkOrder: async (id: string, userId: string): Promise<ProviderStatus> => {
    if (!config.mock) return providerRequest<ProviderStatus>("/v1/orders/get_status", { order_id: id }, userId, id);
    const elapsed = Date.now() - (mockOrders.get(id) ?? 0); return { order_id: id, status: elapsed > 1500 ? "received" : "waiting", phone_number: "+62 858 4441 4442", service: "WhatsApp", country: "Indonesia", created_at: Date.now() - elapsed, expired_at: Date.now() + 20 * 60_000, otp_code: elapsed > 1500 ? "949708" : undefined, otp_msg: elapsed > 1500 ? "Your WhatsApp code: 949-708" : undefined };
  },
  setStatus: async (id: string, status: "cancel" | "done" | "resend", userId: string) => config.mock ? { order_id: id, status } : providerRequest<{ order_id: string; status: string }>("/v1/orders/set_status", { order_id: id, status }, userId, id)
};

export function calculateProfit(cost: bigint, type: "FIXED" | "PERCENTAGE" | "COMBINED", fixed: bigint, percentage: number) { const percentageAmount = BigInt(Math.ceil(Number(cost) * percentage / 100)); return type === "FIXED" ? fixed : type === "PERCENTAGE" ? percentageAmount : fixed + percentageAmount; }
const ranks = { SERVICE: 4, COUNTRY: 3, PROVIDER: 2, GLOBAL: 1 } as const;
export function selectRule(rules: PricingRule[], context: { serviceId?: string | null; countryId?: string | null; providerId?: string | null }, now = new Date()) {
  return rules.filter(rule => rule.active && (!rule.validFrom || rule.validFrom <= now) && (!rule.validUntil || rule.validUntil >= now) && (rule.scope === "GLOBAL" || (rule.scope === "SERVICE" && rule.serviceId === context.serviceId) || (rule.scope === "COUNTRY" && rule.countryId === context.countryId) || (rule.scope === "PROVIDER" && rule.providerId === context.providerId))).sort((a, b) => ranks[b.scope] - ranks[a.scope] || b.priority - a.priority)[0];
}
export function sellingPrice(cost: bigint, rule?: PricingRule | null) {
  const profit = calculateProfit(cost, rule?.profitType ?? "FIXED", rule?.fixedAmount ?? config.defaultProfit, rule ? Number(rule.percentage) : 0);
  let price = cost + profit; const minimum = rule?.minimumSelling ?? config.minPrice; if (price < minimum) price = minimum; if (rule?.maximumSelling && price > rule.maximumSelling) price = rule.maximumSelling;
  price = roundMoney(price, rule?.roundingIncrement ?? config.rounding); return { costPrice: cost, profitAmount: price - cost, sellingPrice: price };
}

export async function mutateBalance(tx: Prisma.TransactionClient, input: { userId: string; amount: bigint; direction: "CREDIT" | "DEBIT"; type: LedgerType; description: string; orderId?: string; depositId?: string; adminId?: string; transactionId?: string }) {
  if (input.amount <= 0n) throw new AppError("INVALID_AMOUNT", "Nominal harus lebih dari nol", 422);
  const current = await tx.userBalance.findUnique({ where: { userId: input.userId } }); if (!current) throw new AppError("BALANCE_NOT_FOUND", "Saldo tidak ditemukan", 404);
  if (input.direction === "DEBIT" && current.balance < input.amount) throw new AppError("INSUFFICIENT_BALANCE", "Saldo tidak mencukupi", 409);
  const next = input.direction === "CREDIT" ? current.balance + input.amount : current.balance - input.amount;
  const changed = await tx.userBalance.updateMany({ where: { userId: input.userId, version: current.version, ...(input.direction === "DEBIT" ? { balance: { gte: input.amount } } : {}) }, data: { balance: next, version: { increment: 1 } } });
  if (changed.count !== 1) throw new AppError("BALANCE_CONFLICT", "Saldo berubah oleh transaksi lain", 409);
  const ledger = await tx.balanceLedger.create({ data: { transactionId: input.transactionId ?? reference("LED"), userId: input.userId, type: input.type, debit: input.direction === "DEBIT" ? input.amount : 0n, credit: input.direction === "CREDIT" ? input.amount : 0n, balanceBefore: current.balance, balanceAfter: next, orderId: input.orderId, depositId: input.depositId, description: input.description, adminId: input.adminId } });
  return { before: current.balance, after: next, ledger };
}

async function priceSelection(input: { serviceCode: number; serviceName: string; country: string; countryIso?: string; numberId: number; providerId: string }) {
  const countries = await rumahOtp.countries(input.serviceCode); const country = countries.find(item => item.number_id === input.numberId && item.name.toLowerCase() === input.country.toLowerCase());
  if (!country) throw new AppError("COUNTRY_UNAVAILABLE", "Negara tidak tersedia", 409); const provider = country.pricelist.find(item => item.provider_id === input.providerId); if (!provider?.available || provider.stock < 1) throw new AppError("OUT_OF_STOCK", "Stok nomor kosong", 409);
  const [serviceDb, countryDb, providerDb, rules] = await Promise.all([prisma.otpService.findUnique({ where: { serviceCode: input.serviceCode } }), prisma.otpCountry.findFirst({ where: { service: { serviceCode: input.serviceCode }, numberId: input.numberId } }), prisma.otpProvider.findFirst({ where: { country: { numberId: input.numberId }, providerExternalId: input.providerId } }), prisma.pricingRule.findMany({ where: { active: true } })]);
  const price = sellingPrice(BigInt(provider.price), selectRule(rules, { serviceId: serviceDb?.id, countryId: countryDb?.id, providerId: providerDb?.id })); return { country, provider, ...price, serviceDb, countryDb, providerDb };
}
export async function previewPrice(input: { serviceCode: number; serviceName: string; country: string; countryIso?: string; numberId: number; providerId: string }) { const price = await priceSelection(input); return { costPrice: price.costPrice, profitAmount: price.profitAmount, sellingPrice: price.sellingPrice, stock: price.provider.stock }; }
export function mapStatus(status?: string, hasOtp = false): OtpOrderStatus { const value = status?.toLowerCase(); if (hasOtp || value === "received") return "OTP_RECEIVED"; if (value === "completed" || value === "done") return "COMPLETED"; if (value === "canceled" || value === "cancel") return "CANCELED"; if (value === "expiring" || value === "expired") return "EXPIRED"; if (value === "failed") return "FAILED"; return "WAITING_OTP"; }
export async function createOtpOrder(input: { userId: string; serviceCode: number; serviceName: string; country: string; countryIso?: string; numberId: number; providerId: string; operatorId: number; operatorName: string; idempotencyKey: string }) {
  const existing = await prisma.otpOrder.findUnique({ where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } } }); if (existing) return existing;
  if (await prisma.otpOrder.count({ where: { userId: input.userId, status: { in: ["ORDERING", "WAITING_OTP", "OTP_RECEIVED", "CANCEL_REQUESTED"] } } }) >= config.maxActiveOrders) throw new AppError("ACTIVE_ORDER_LIMIT", `Maksimal ${config.maxActiveOrders} order aktif`, 409);
  const latest = await priceSelection(input); const pending = await prisma.otpOrder.create({ data: { internalOrderNumber: reference("OTP"), userId: input.userId, serviceCode: input.serviceCode, serviceName: input.serviceName, countryName: input.country, countryIso: input.countryIso, numberId: input.numberId, providerExternalId: input.providerId, operatorExternalId: input.operatorId, operatorName: input.operatorName, serviceId: latest.serviceDb?.id, countryId: latest.countryDb?.id, providerId: latest.providerDb?.id, costPrice: latest.costPrice, profitAmount: latest.profitAmount, sellingPrice: latest.sellingPrice, balanceBefore: 0n, balanceAfter: 0n, status: "ORDERING", idempotencyKey: input.idempotencyKey, statusHistory: { create: { toStatus: "ORDERING", reason: "Checkout dimulai" } } } });
  let providerOrder: CreatedOrder; try { providerOrder = await rumahOtp.createOrder(input.numberId, input.providerId, input.operatorId, input.userId); } catch (error) { await prisma.otpOrder.update({ where: { id: pending.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message : "Provider gagal" } }); throw error; }
  try { return await prisma.$transaction(async tx => { const balance = await mutateBalance(tx, { userId: input.userId, amount: latest.sellingPrice, direction: "DEBIT", type: "OTP_PURCHASE", description: `Pembelian ${input.serviceName} ${input.country}`, orderId: pending.id }); return tx.otpOrder.update({ where: { id: pending.id }, data: { providerOrderId: providerOrder.order_id, phoneNumber: providerOrder.phone_number, costPrice: BigInt(providerOrder.price), profitAmount: latest.sellingPrice - BigInt(providerOrder.price), balanceBefore: balance.before, balanceAfter: balance.after, status: "WAITING_OTP", providerStatus: "received", providerCreatedAt: new Date(providerOrder.created_at), providerExpiredAt: new Date(providerOrder.expired_at), statusHistory: { create: { fromStatus: "ORDERING", toStatus: "WAITING_OTP", providerStatus: "received" } } } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
  catch (error) { await rumahOtp.setStatus(providerOrder.order_id, "cancel", input.userId).catch(() => undefined); await prisma.otpOrder.update({ where: { id: pending.id }, data: { status: "FAILED", providerOrderId: providerOrder.order_id, phoneNumber: providerOrder.phone_number, failureReason: error instanceof Error ? error.message : "Saldo gagal dipotong" } }); throw error; }
}
export async function refundOrder(orderId: string, reason: string, adminId?: string) { return prisma.$transaction(async tx => { const order = await tx.otpOrder.findUnique({ where: { id: orderId } }); if (!order) throw new AppError("ORDER_NOT_FOUND", "Order tidak ditemukan", 404); if (order.refundedAt || order.refundTransactionId) return order; const transactionId = reference("RFD"); await mutateBalance(tx, { userId: order.userId, amount: order.sellingPrice, direction: "CREDIT", type: "OTP_REFUND", description: reason, orderId, adminId, transactionId }); await tx.notification.create({ data: { userId: order.userId, title: "Refund selesai", message: `Saldo ${order.internalOrderNumber} telah dikembalikan`, type: "SUCCESS", actionUrl: "/dashboard/balance-history" } }); return tx.otpOrder.update({ where: { id: orderId }, data: { status: "REFUNDED", refundedAt: new Date(), refundTransactionId: transactionId, statusHistory: { create: { fromStatus: order.status, toStatus: "REFUNDED", reason } } } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
export async function syncOrder(id: string, userId?: string) { const order = await prisma.otpOrder.findFirst({ where: { id, ...(userId ? { userId } : {}) } }); if (!order) throw new AppError("ORDER_NOT_FOUND", "Order tidak ditemukan", 404); if (!order.providerOrderId || ["COMPLETED", "CANCELED", "EXPIRED", "FAILED", "REFUNDED"].includes(order.status)) return order; const response = await rumahOtp.checkOrder(order.providerOrderId, order.userId); const status = mapStatus(response.status, Boolean(response.otp_code)); const updated = await prisma.otpOrder.update({ where: { id }, data: { status, providerStatus: response.status, otpCode: response.otp_code, otpMessage: response.otp_msg, lastPolledAt: new Date(), pollAttempts: { increment: 1 }, statusHistory: status !== order.status ? { create: { fromStatus: order.status, toStatus: status, providerStatus: response.status } } : undefined } }); if (response.otp_code && !order.otpCode) await prisma.notification.create({ data: { userId: order.userId, title: "OTP masuk", message: `Kode OTP ${order.serviceName} telah diterima`, type: "SUCCESS", actionUrl: `/dashboard/orders/${order.id}` } }); if (["CANCELED", "EXPIRED", "FAILED"].includes(status)) return refundOrder(id, `Refund otomatis karena ${status}`); return updated; }
export async function orderAction(id: string, userId: string, action: "cancel" | "done" | "resend") { const order = await prisma.otpOrder.findFirst({ where: { id, userId } }); if (!order?.providerOrderId) throw new AppError("ORDER_NOT_FOUND", "Order tidak ditemukan", 404); if (action === "cancel") { const latest = await rumahOtp.checkOrder(order.providerOrderId, userId); if (latest.otp_code || ["received", "completed"].includes(latest.status.toLowerCase())) throw new AppError("CANNOT_CANCEL", "Order yang sudah menerima OTP tidak dapat dibatalkan", 409); await rumahOtp.setStatus(order.providerOrderId, "cancel", userId); return refundOrder(id, "Refund pembatalan pengguna"); } await rumahOtp.setStatus(order.providerOrderId, action, userId); if (action === "done") return prisma.otpOrder.update({ where: { id }, data: { status: "COMPLETED", statusHistory: { create: { fromStatus: order.status, toStatus: "COMPLETED", reason: "Diselesaikan pengguna" } } } }); return order; }

export async function createDeposit(userId: string, amount: bigint) { if (amount < 10000n) throw new AppError("MINIMUM_DEPOSIT", "Minimum deposit Rp10.000", 422); if (await prisma.deposit.count({ where: { userId, status: { in: ["REQUESTED", "WAITING_PAYMENT", "MANUAL_REVIEW"] } } }) >= 3) throw new AppError("PENDING_DEPOSIT_LIMIT", "Maksimal 3 deposit pending", 409); const ref = reference("DEP"); const deposit = await prisma.deposit.create({ data: { internalDepositNumber: ref, userId, amountRequested: amount, amountReceived: amount, method: "WHATSAPP_ADMIN", status: "WAITING_PAYMENT", expiresAt: new Date(Date.now() + 86400000), statusHistory: { create: { toStatus: "WAITING_PAYMENT", reason: "Diarahkan ke WhatsApp super admin" } } } }); const text = encodeURIComponent(`Halo Admin ${config.appName}, saya ingin deposit saldo.\n\nID Deposit: ${ref}\nNominal: ${formatRupiah(amount)}\nUser ID: ${userId}\n\nMohon instruksi pembayaran.`); return { deposit, whatsappUrl: `https://wa.me/${config.superAdminWhatsapp}?text=${text}` }; }
export async function approveDeposit(id: string, adminId: string, note?: string) { return prisma.$transaction(async tx => { const deposit = await tx.deposit.findUnique({ where: { id } }); if (!deposit) throw new AppError("DEPOSIT_NOT_FOUND", "Deposit tidak ditemukan", 404); if (deposit.creditedTransactionId || deposit.status === "SUCCESS") return deposit; if (!["REQUESTED", "WAITING_PAYMENT", "MANUAL_REVIEW"].includes(deposit.status)) throw new AppError("DEPOSIT_NOT_APPROVABLE", "Deposit tidak dapat disetujui", 409); const transactionId = reference("DCR"); await mutateBalance(tx, { userId: deposit.userId, amount: deposit.amountReceived, direction: "CREDIT", type: "DEPOSIT", description: `Deposit manual ${deposit.internalDepositNumber}`, depositId: id, adminId, transactionId }); await tx.depositStatusHistory.create({ data: { depositId: id, fromStatus: deposit.status, toStatus: "SUCCESS", adminId, reason: note ?? "Diverifikasi admin" } }); return tx.deposit.update({ where: { id }, data: { status: "SUCCESS", approvedBy: adminId, approvedAt: new Date(), creditedTransactionId: transactionId, adminNote: note } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
