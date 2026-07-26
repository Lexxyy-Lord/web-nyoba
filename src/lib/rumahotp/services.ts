import { env } from "@/lib/env";
import { rumahOtpRequest } from "./client";
import { mockBalance, mockCheckOrder, mockCountries, mockCreateOrder, mockOperators, mockServices } from "./mock";
import type { RumahOtpBalance, RumahOtpCountry, RumahOtpCreatedOrder, RumahOtpOperator, RumahOtpOrderStatus, RumahOtpService } from "./types";

export const rumahOtp = {
  getBalance: () => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockBalance) : rumahOtpRequest<RumahOtpBalance>("/v1/user/balance"),
  getServices: () => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockServices) : rumahOtpRequest<RumahOtpService[]>("/v2/services"),
  getCountries: (serviceId: number) => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockCountries) : rumahOtpRequest<RumahOtpCountry[]>("/v2/countries", { service_id: serviceId }),
  getOperators: (country: string, providerId: string) => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockOperators) : rumahOtpRequest<RumahOtpOperator[]>("/v2/operators", { country, provider_id: providerId }),
  createOrder: (numberId: number, providerId: string, operatorId: number, userId?: string) => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockCreateOrder()) : rumahOtpRequest<RumahOtpCreatedOrder>("/v2/orders", { number_id: numberId, provider_id: providerId, operator_id: operatorId }, { userId }),
  checkOrder: (orderId: string, userId?: string) => env().RUMAHOTP_MOCK_MODE ? Promise.resolve(mockCheckOrder(orderId)) : rumahOtpRequest<RumahOtpOrderStatus>("/v1/orders/get_status", { order_id: orderId }, { userId, orderId }),
  setOrderStatus: (orderId: string, status: "cancel" | "done" | "resend", userId?: string) => env().RUMAHOTP_MOCK_MODE ? Promise.resolve({ order_id: orderId, status, server: "mock" }) : rumahOtpRequest<{ order_id: string; status: string; server: string }>("/v1/orders/set_status", { order_id: orderId, status }, { userId, orderId }),
};
