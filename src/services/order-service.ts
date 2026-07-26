import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http";
import { mutateBalance } from "@/lib/balance";
import { computeSellingPrice, selectPricingRule } from "@/lib/pricing";
import { rumahOtp } from "@/lib/rumahotp/services";
import { mapProviderStatus } from "@/lib/rumahotp/status-mapper";
import { createReference } from "@/lib/utils";
import { env } from "@/lib/env";

export type CreateOrderInput = {
  userId: string;
  serviceCode: number;
  serviceName: string;
  country: string;
  countryIso?: string;
  numberId: number;
  providerId: string;
  operatorId: number;
  operatorName: string;
  idempotencyKey: string;
};

async function findCurrentPrice(input: CreateOrderInput) {
  const countries = await rumahOtp.getCountries(input.serviceCode);
  const country = countries.find((item) => item.number_id === input.numberId && item.name.toLowerCase() === input.country.toLowerCase());
  if (!country) throw new AppError("COUNTRY_NOT_AVAILABLE", "Negara tidak lagi tersedia", 409);
  const price = country.pricelist.find((item) => String(item.provider_id) === input.providerId);
  if (!price?.available || price.stock <= 0) throw new AppError("OUT_OF_STOCK", "Stok provider sedang kosong", 409);
  return { country, price, costPrice: BigInt(price.price) };
}

export async function previewOrderPrice(input: Omit<CreateOrderInput, "userId" | "operatorId" | "operatorName" | "idempotencyKey">) {
  const current = await findCurrentPrice({ ...input, userId: "preview", operatorId: 1, operatorName: "any", idempotencyKey: crypto.randomUUID() });
  const rules = await prisma.pricingRule.findMany({ where: { active: true } });
  const selected = selectPricingRule(rules, {});
  return { ...computeSellingPrice(current.costPrice, selected), costPrice: current.costPrice, stock: current.price.stock };
}

export async function createOtpOrder(input: CreateOrderInput) {
  const existing = await prisma.otpOrder.findUnique({ where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } } });
  if (existing) return existing;
  const activeCount = await prisma.otpOrder.count({ where: { userId: input.userId, status: { in: ["PENDING", "ORDERING", "WAITING_OTP", "OTP_RECEIVED", "CANCEL_REQUESTED"] } } });
  if (activeCount >= env().MAX_ACTIVE_ORDERS_PER_USER) throw new AppError("ACTIVE_ORDER_LIMIT", `Maksimal ${env().MAX_ACTIVE_ORDERS_PER_USER} pesanan aktif`, 409);
  const current = await findCurrentPrice(input);
  const [serviceRecord, countryRecord, providerRecord, rules] = await Promise.all([
    prisma.otpService.findUnique({ where: { serviceCode: input.serviceCode } }),
    prisma.otpCountry.findFirst({ where: { numberId: input.numberId, service: { serviceCode: input.serviceCode } } }),
    prisma.otpProvider.findFirst({ where: { providerExternalId: input.providerId, country: { numberId: input.numberId } } }),
    prisma.pricingRule.findMany({ where: { active: true } }),
  ]);
  const selectedRule = selectPricingRule(rules, { serviceId: serviceRecord?.id, countryId: countryRecord?.id, providerId: providerRecord?.id });
  const pricing = computeSellingPrice(current.costPrice, selectedRule);
  const internalOrderNumber = createReference("OTP");
  const reserved = await prisma.$transaction(async (tx) => {
    const order = await tx.otpOrder.create({
      data: {
        internalOrderNumber,
        userId: input.userId,
        serviceId: serviceRecord?.id,
        countryId: countryRecord?.id,
        providerId: providerRecord?.id,
        serviceCode: input.serviceCode,
        serviceName: input.serviceName,
        countryName: input.country,
        countryIso: input.countryIso,
        operatorName: input.operatorName,
        providerExternalId: input.providerId,
        numberId: input.numberId,
        operatorExternalId: input.operatorId,
        costPrice: current.costPrice,
        profitAmount: pricing.profitAmount,
        sellingPrice: pricing.sellingPrice,
        balanceBefore: 0n,
        balanceAfter: 0n,
        status: "ORDERING",
        idempotencyKey: input.idempotencyKey,
      },
    });
    const balance = await mutateBalance(tx, {
      userId: input.userId,
      amount: pricing.sellingPrice,
      direction: "DEBIT",
      type: "OTP_PURCHASE",
      description: `Reservasi saldo untuk ${internalOrderNumber}`,
      orderId: order.id,
      transactionId: createReference("PAY"),
    });
    await tx.otpOrder.update({ where: { id: order.id }, data: { balanceBefore: balance.before, balanceAfter: balance.after } });
    await tx.otpOrderStatusHistory.create({ data: { orderId: order.id, toStatus: "ORDERING", reason: "Saldo berhasil direservasi" } });
    return { orderId: order.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  try {
    const providerOrder = await rumahOtp.createOrder(input.numberId, input.providerId, input.operatorId, input.userId);
    if (BigInt(providerOrder.price) !== current.costPrice) {
      throw new AppError("PROVIDER_PRICE_CHANGED", "Harga provider berubah saat pemesanan. Saldo akan dikembalikan.", 409);
    }
    return await prisma.$transaction(async (tx) => {
      await tx.otpOrderStatusHistory.create({ data: { orderId: reserved.orderId, fromStatus: "ORDERING", toStatus: "WAITING_OTP", providerStatus: "received", reason: "Nomor berhasil dipesan" } });
      const updated = await tx.otpOrder.update({
        where: { id: reserved.orderId },
        data: {
          providerOrderId: providerOrder.order_id,
          phoneNumber: providerOrder.phone_number,
          providerCreatedAt: new Date(providerOrder.created_at),
          providerExpiredAt: new Date(providerOrder.expired_at),
          providerStatus: "received",
          status: "WAITING_OTP",
        },
      });
      await tx.notification.create({ data: { userId: input.userId, title: "Nomor berhasil diterima", message: `${providerOrder.service} ${providerOrder.phone_number}`, type: "SUCCESS", actionUrl: `/dashboard/orders/${updated.id}` } });
      return updated;
    });
  } catch (error) {
    await refundOrder(reserved.orderId, error instanceof Error ? error.message : "Provider gagal membuat pesanan");
    throw error;
  }
}

export async function syncOtpOrder(orderId: string, userId?: string) {
  const order = await prisma.otpOrder.findFirst({ where: { id: orderId, ...(userId ? { userId } : {}) } });
  if (!order) throw new AppError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
  if (!order.providerOrderId || ["COMPLETED", "CANCELED", "EXPIRED", "FAILED", "REFUNDED"].includes(order.status)) return order;
  const provider = await rumahOtp.checkOrder(order.providerOrderId, order.userId);
  const nextStatus = mapProviderStatus(provider.status, Boolean(provider.otp_code));
  return prisma.$transaction(async (tx) => {
    if (nextStatus !== order.status) {
      await tx.otpOrderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: nextStatus, providerStatus: provider.status } });
    }
    const updated = await tx.otpOrder.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        providerStatus: provider.status,
        otpCode: provider.otp_code,
        otpMessage: provider.otp_msg,
        phoneNumber: provider.phone_number ?? order.phoneNumber,
        lastPolledAt: new Date(),
        pollAttempts: { increment: 1 },
      },
    });
    if (provider.otp_code && !order.otpCode) {
      await tx.notification.create({ data: { userId: order.userId, title: "OTP telah masuk", message: `Kode OTP ${order.serviceName} siap digunakan`, type: "SUCCESS", actionUrl: `/dashboard/orders/${order.id}` } });
    }
    return updated;
  });
}

export async function setOtpOrderAction(orderId: string, userId: string, action: "cancel" | "done" | "resend") {
  const order = await prisma.otpOrder.findFirst({ where: { id: orderId, userId } });
  if (!order?.providerOrderId) throw new AppError("ORDER_NOT_FOUND", "Pesanan aktif tidak ditemukan", 404);
  if (action === "cancel" && !["WAITING_OTP", "ORDERING", "CANCEL_REQUESTED"].includes(order.status)) throw new AppError("ORDER_NOT_CANCELABLE", "Pesanan tidak dapat dibatalkan", 409);
  await rumahOtp.setOrderStatus(order.providerOrderId, action, userId);
  if (action === "cancel") {
    await prisma.otpOrder.update({ where: { id: order.id }, data: { status: "CANCEL_REQUESTED" } });
    const synced = await syncOtpOrder(order.id, userId);
    if (["CANCELED", "EXPIRED", "FAILED"].includes(synced.status)) return refundOrder(order.id, `Refund karena status ${synced.status}`);
    return synced;
  }
  if (action === "done") return prisma.otpOrder.update({ where: { id: order.id }, data: { status: "COMPLETED", providerStatus: "completed" } });
  return order;
}

export async function refundOrder(orderId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.otpOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    if (order.refundedAt) return order;
    const transactionId = createReference("REF");
    await mutateBalance(tx, { userId: order.userId, amount: order.sellingPrice, direction: "CREDIT", type: "OTP_REFUND", description: reason, orderId: order.id, transactionId });
    await tx.otpOrderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: "REFUNDED", reason } });
    return tx.otpOrder.update({ where: { id: order.id }, data: { status: "REFUNDED", refundedAt: new Date(), refundTransactionId: transactionId, failureReason: reason } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
