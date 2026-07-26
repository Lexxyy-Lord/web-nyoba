import type { RumahOtpBalance, RumahOtpCountry, RumahOtpCreatedOrder, RumahOtpOperator, RumahOtpOrderStatus, RumahOtpService } from "./types";

const orders = new Map<string, { created: number; status: string }>();
export const mockServices: RumahOtpService[] = [
  { service_code: 13, service_name: "WhatsApp", service_img: "https://assets.cindigital.id/apps/wa.png" },
  { service_code: 4, service_name: "Telegram", service_img: "https://assets.cindigital.id/apps/tg.png" },
  { service_code: 7, service_name: "Facebook", service_img: "https://assets.cindigital.id/apps/fb.png" },
];
export const mockCountries: RumahOtpCountry[] = [
  { number_id: 340437, name: "Indonesia", img: "https://assets.cindigital.id/flags/id.png", prefix: "+62", iso_code: "id", rate: 81.6, stock_total: 103, pricelist: [{ provider_id: "3837", server_id: 3, stock: 103, rate: 81.6, price: 2500, price_format: "Rp2.500", available: true }] },
  { number_id: 340438, name: "Malaysia", img: "https://assets.cindigital.id/flags/my.png", prefix: "+60", iso_code: "my", rate: 75, stock_total: 48, pricelist: [{ provider_id: "4736", server_id: 4, stock: 48, rate: 75, price: 4000, price_format: "Rp4.000", available: true }] },
];
export const mockOperators: RumahOtpOperator[] = [
  { id: 1, name: "any", image: "https://assets.cindigital.id/carriers/indonesia/any.ico" },
  { id: 2, name: "indosat", image: "https://assets.cindigital.id/carriers/indonesia/indosat.jpg" },
  { id: 3, name: "telkomsel", image: "https://assets.cindigital.id/carriers/indonesia/telkomsel.jpg" },
];
export function mockCreateOrder(): RumahOtpCreatedOrder {
  const orderId = `MOCK${Date.now()}`;
  orders.set(orderId, { created: Date.now(), status: "received" });
  return { order_id: orderId, phone_number: "+62 858 4441 4442", service: "WhatsApp", country: "Indonesia", operator: "any", price: 2500, price_formated: "Rp2.500", created_at: Date.now(), expired_at: Date.now() + 20 * 60_000 };
}
export function mockCheckOrder(orderId: string): RumahOtpOrderStatus {
  const order = orders.get(orderId);
  const elapsed = order ? Date.now() - order.created : 9999;
  const withOtp = elapsed > 1500;
  return { order_id: orderId, status: withOtp ? "received" : "waiting", phone_number: "+62 858 4441 4442", service: "WhatsApp", country: "Indonesia", created_at: Date.now() - elapsed, expired_at: Date.now() + 20 * 60_000, otp_code: withOtp ? "949708" : undefined, otp_msg: withOtp ? "Your WhatsApp code: 949-708" : undefined };
}
export const mockBalance: RumahOtpBalance = { balance: 11240116, formated: "Rp11.240.116", username: "mock", first_name: "Mock", last_name: "Provider", email: "mock@example.com" };
