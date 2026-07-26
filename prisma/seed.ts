import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
const prisma = new PrismaClient();
async function main() {
  const [userRole, adminRole, superRole] = await Promise.all([
    prisma.role.upsert({ where: { key: "USER" }, update: {}, create: { key: "USER", name: "User" } }),
    prisma.role.upsert({ where: { key: "ADMIN" }, update: {}, create: { key: "ADMIN", name: "Admin" } }),
    prisma.role.upsert({ where: { key: "SUPER_ADMIN" }, update: {}, create: { key: "SUPER_ADMIN", name: "Super Admin" } })
  ]);
  void userRole; void adminRole;
  const email = process.env.SEED_ADMIN_EMAIL;
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !username || !password) throw new Error("Credential seed admin wajib diisi melalui .env");
  const admin = await prisma.user.upsert({
    where: { email },
    update: { roleId: superRole.id, status: "ACTIVE" },
    create: {
      email, username, name: "Super Administrator",
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      roleId: superRole.id, termsAcceptedAt: new Date(),
      balance: { create: { balance: 0n } }, profile: { create: {} }
    }
  });
  await prisma.appSetting.upsert({
    where: { key: "website" },
    update: {},
    create: { key: "website", isPublic: true, value: { name: process.env.APP_NAME ?? "OTPMarket", description: process.env.APP_DESCRIPTION ?? "Layanan nomor virtual dan OTP", supportWhatsapp: "6282141218134", maintenanceMode: false } }
  });
  await prisma.pricingRule.upsert({
    where: { id: "default-global-pricing" },
    update: {},
    create: { id: "default-global-pricing", name: "Keuntungan global awal", scope: "GLOBAL", profitType: "FIXED", fixedAmount: BigInt(process.env.OTP_DEFAULT_PROFIT ?? "10000"), roundingIncrement: Number(process.env.OTP_PRICE_ROUNDING ?? 100), priority: 0, active: true, createdBy: admin.id }
  });
  console.log(`Seed selesai: ${admin.email}`);
}
main().finally(() => prisma.$disconnect());
