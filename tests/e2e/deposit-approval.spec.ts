import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

const prisma = new PrismaClient();
const password = "SecurePass123";

async function login(page: Page, identifier: string, loginPassword: string) {
  await page.goto("/login");
  await page.getByLabel("Email atau username").fill(identifier);
  await page.getByLabel("Password").fill(loginPassword);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Masuk" }).click();
  const response = await responsePromise;
  expect(response.ok(), await response.text()).toBeTruthy();
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test(
  "manual WhatsApp deposit can be approved only once by admin",
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Deposit flow runs once on desktop Chromium",
    );

    const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    const username = `dep${unique}`;
    const email = `${username}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Nama lengkap").fill("Deposit E2E User");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Konfirmasi password").fill(password);
    await page.getByLabel(/Saya menyetujui/).check();

    const registerResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/register") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Buat akun" }).click();
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.ok(), await registerResponse.text()).toBeTruthy();

    const created = await page.evaluate(async () => {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "50000" }),
      });
      return {
        ok: response.ok,
        body: await response.json(),
      };
    });

    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();
    expect(created.body.data.whatsappUrl).toContain(
      "https://wa.me/6282141218134",
    );

    const whatsappText =
      new URL(created.body.data.whatsappUrl).searchParams.get("text") ?? "";
    expect(whatsappText).toMatch(/Rp\s*50\.000/);

    const depositId = created.body.data.deposit.id as string;
    const depositReference = created.body.data.deposit
      .internalDepositNumber as string;
    const userId = created.body.data.deposit.userId as string;

    await page.getByRole("button", { name: "Keluar" }).click();
    await login(
      page,
      process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
    );

    await page.goto("/admin/deposits");
    await page
      .getByRole("button", {
        name: `Setujui deposit ${depositReference}`,
      })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByLabel("Catatan verifikasi opsional")
      .fill("Pembayaran pengujian sudah diverifikasi");
    await page.getByRole("button", { name: "Ya, tambahkan saldo" }).click();
    await expect(page.getByText(/berhasil disetujui/i)).toBeVisible();

    const [approvedDeposit, balance] = await Promise.all([
      prisma.deposit.findUnique({ where: { id: depositId } }),
      prisma.userBalance.findUnique({ where: { userId } }),
    ]);

    expect(approvedDeposit?.status).toBe("SUCCESS");
    expect(approvedDeposit?.creditedTransactionId).toBeTruthy();
    expect(balance?.balance).toBe(50_000n);

    const repeat = await page.evaluate(async (id) => {
      const response = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Percobaan approval kedua" }),
      });
      return {
        ok: response.ok,
        body: await response.json(),
      };
    }, depositId);

    expect(repeat.ok, JSON.stringify(repeat.body)).toBeTruthy();

    const balanceAfterRepeat = await prisma.userBalance.findUnique({
      where: { userId },
    });
    const depositLedgers = await prisma.balanceLedger.count({
      where: { depositId, type: "DEPOSIT" },
    });

    expect(balanceAfterRepeat?.balance).toBe(50_000n);
    expect(depositLedgers).toBe(1);
  },
);
