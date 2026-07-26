import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,30}$/),
  email: z.string().trim().toLowerCase().email(),
  whatsapp: z.string().trim().regex(/^\+?\d{8,16}$/).optional().or(z.literal("")),
  password: z.string().min(8).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true),
  website: z.string().max(0).optional()
}).refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama" });
export const loginSchema = z.object({ identifier: z.string().trim().min(3).max(120), password: z.string().min(1).max(128), remember: z.boolean().default(false) });
export const orderSchema = z.object({ serviceCode: z.coerce.number().int().positive(), serviceName: z.string().min(1).max(100), country: z.string().min(1).max(100), countryIso: z.string().min(2).max(10).optional(), numberId: z.coerce.number().int().positive(), providerId: z.string().min(1).max(50), operatorId: z.coerce.number().int().positive(), operatorName: z.string().min(1).max(100), idempotencyKey: z.string().uuid() });
export const pricingSchema = z.object({ name: z.string().min(3).max(100), scope: z.enum(["GLOBAL", "SERVICE", "COUNTRY", "PROVIDER"]), profitType: z.enum(["FIXED", "PERCENTAGE", "COMBINED"]), fixedAmount: z.coerce.bigint().min(0n), percentage: z.coerce.number().min(0).max(1000), minimumSelling: z.coerce.bigint().min(0n).nullable().optional(), maximumSelling: z.coerce.bigint().min(0n).nullable().optional(), roundingIncrement: z.coerce.number().int().refine(value => [1, 100, 500, 1000].includes(value)), priority: z.coerce.number().int().min(0).max(10000), active: z.boolean().default(true), serviceId: z.string().cuid().nullable().optional(), countryId: z.string().cuid().nullable().optional(), providerId: z.string().cuid().nullable().optional() });
