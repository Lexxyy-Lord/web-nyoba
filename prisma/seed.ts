import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({ where: { key: "USER" }, update: {}, create: { key: "USER", name: "User" } }),
    prisma.role.upsert({ where: { key: "ADMIN" }, update: {}, create: { key: "ADMIN", name: "Admin" } }),
    prisma.role.upsert({ where: { key: "SUPER_ADMIN" }, update: {}, create: { key: "SUPER_ADMIN", name: "Super Admin" } }),
  ]);
  const superRole = roles.find((role) => role.key === "SUPER_ADMIN")!;
  const email = process.env.SEED_ADMIN_EMAIL;
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !username || !password) throw new Error("SEED_ADMIN_EMAIL, SEED_ADMIN_USERNAME, dan SEED_ADMIN_PASSWORD wajib diisi");
  const admin = await prisma.user.upsert({
    where: { email },
    update: { roleId: superRole.id, status: "ACTIVE" },
    create: {
      email,
      username,
      name: "Super Administrator",
      passwordHash: await hashPassword(password),
      roleId: superRole.id,
      termsAcceptedAt: new Date(),
      balance: { create: { balance: 0n } },
      profile: { create: {} },
    },
  });
  await prisma.appSetting.upsert({
    where: { key: "website" },
    update: {},
    create: {
      key: "website",
      value: {
        name: process.env.APP_NAME ?? "OTPMarket",
        description: process.env.APP_DESCRIPTION ?? "Layanan nomor virtual dan OTP",
        supportWhatsapp: process.env.SUPER_ADMIN_WHATSAPP ?? "6282141218134",
        primaryColor: "indigo",
        maintenanceMode: false,
      },
      isPublic: true,
    },
  });
  await prisma.pricingRule.upsert({
    where: { id: "default-global-pricing" },
    update: {},
    create: {
      id: "default-global-pricing",
      name: "Keuntungan global awal",
      scope: "GLOBAL",
      profitType: "FIXED",
      fixedAmount: BigInt(process.env.OTP_DEFAULT_PROFIT ?? "10000"),
      roundingIncrement: Number(process.env.OTP_PRICE_ROUNDING ?? 100),
      active: true,
      priority: 0,
      createdBy: admin.id,
    },
  });
  console.log(`Seed selesai. Super admin: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());
