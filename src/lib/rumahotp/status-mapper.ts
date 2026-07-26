import type { OtpOrderStatus } from "@prisma/client";

export function mapProviderStatus(status?: string, hasOtp = false): OtpOrderStatus {
  const normalized = status?.toLowerCase().trim();
  if (hasOtp || normalized === "received") return "OTP_RECEIVED";
  if (normalized === "completed" || normalized === "done") return "COMPLETED";
  if (normalized === "canceled" || normalized === "cancel") return "CANCELED";
  if (normalized === "expiring" || normalized === "expired") return "EXPIRED";
  if (normalized === "failed" || normalized === "error") return "FAILED";
  return "WAITING_OTP";
}

export function isFinalOrderStatus(status: OtpOrderStatus) {
  return ["COMPLETED", "CANCELED", "EXPIRED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(status);
}
