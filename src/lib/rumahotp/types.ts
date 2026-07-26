export type RumahOtpEnvelope<T> = { success: true; data: T } | { success: false; error?: { message?: string } };
export type RumahOtpService = { service_code: number; service_name: string; service_img: string };
export type RumahOtpPrice = { provider_id: string; server_id: number; stock: number; rate: number; price: number; price_format: string; available: boolean };
export type RumahOtpCountry = { number_id: number; name: string; img: string; prefix: string; iso_code: string; rate: number; stock_total: number; pricelist: RumahOtpPrice[] };
export type RumahOtpOperator = { id: number; name: string; image: string };
export type RumahOtpCreatedOrder = { order_id: string; phone_number: string; service: string; country: string; operator: string; price: number; price_formated: string; created_at: number; expired_at: number };
export type RumahOtpOrderStatus = { order_id: string; status: string; phone_number: string; service: string; country: string; created_at: number; expired_at: number; otp_code?: string; otp_msg?: string };
export type RumahOtpBalance = { balance: number; formated: string; username: string; first_name: string; last_name: string; email: string };
