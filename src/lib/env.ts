import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_NAME: z.string().default("OTPMarket"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_DESCRIPTION: z.string().default("Layanan nomor virtual dan OTP"),
  APP_SUPPORT_EMAIL: z.string().default(""),
  APP_SUPPORT_WHATSAPP: z.string().default("6282141218134"),
  SUPER_ADMIN_WHATSAPP: z.string().default("6282141218134"),
  SESSION_MAX_AGE: z.coerce.number().int().positive().default(604800),
  RUMAHOTP_BASE_URL: z.string().url().default("https://www.rumahotp.io/api"),
  RUMAHOTP_API_KEY: z.string().default(""),
  RUMAHOTP_REQUEST_TIMEOUT: z.coerce.number().int().positive().default(30000),
  RUMAHOTP_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  RUMAHOTP_RATE_WINDOW_MS: z.coerce.number().int().positive().default(10000),
  RUMAHOTP_MOCK_MODE: z.string().default("true").transform((value) => value === "true"),
  OTP_DEFAULT_PROFIT: z.coerce.bigint().default(10000n),
  OTP_PRICE_ROUNDING: z.coerce.number().int().positive().default(100),
  OTP_MIN_SELLING_PRICE: z.coerce.bigint().default(0n),
  MAX_ACTIVE_ORDERS_PER_USER: z.coerce.number().int().positive().default(3),
  MAX_PURCHASES_PER_MINUTE: z.coerce.number().int().positive().default(5),
  TURNSTILE_ENABLED: z.string().default("false").transform((value) => value === "true"),
  TURNSTILE_SECRET_KEY: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM: z.string().default("OTPMarket <no-reply@example.com>"),
});

let cached: z.infer<typeof schema> | undefined;
export function env() {
  cached ??= schema.parse(process.env);
  return cached;
}
