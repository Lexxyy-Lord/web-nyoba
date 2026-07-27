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
  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  await page.goto(identifier.includes("admin") ? "/admin" : "/dashboard");
  await expect(page).not.toHaveURL(/\/login/);
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test(
  "register, admin credit, mock purchase, and OTP order flow",
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Main purchase flow runs once on desktop Chromium",
    );

    const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    const username = `e2e${unique}`;
    const email = `${username}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Nama lengkap").fill("E2E User");
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
    const registerBody = await registerResponse.json();
    expect(registerResponse.ok(), JSON.stringify(registerBody)).toBeTruthy();

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    await page.getByRole("button", { name: "Keluar" }).click();
    await login(
      page,
      process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
    );

    await page.goto("/admin/balances");
    await page.locator('input[name="userId"]').fill(user!.id);
    await page.locator('input[name="amount"]').fill("50000");
    await page
      .locator('input[name="reason"]')
      .fill("Saldo pengujian otomatis");
    await page.getByRole("button", { name: "Simpan mutasi saldo" }).click();
    await expect(page.getByText("Saldo berhasil disesuaikan")).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await login(page, email, password);

    await page.goto("/dashboard/buy-number");
    await page.getByRole("button", { name: /WhatsApp/ }).click();
    await page.getByRole("button", { name: /Indonesia/ }).click();
    await page.getByRole("button", { name: /^any$/i }).click();
    await expect(page.getByText(/Rp\s*12\.500/)).toBeVisible();
    await page.getByRole("button", { name: "Konfirmasi dan beli" }).click();
    await expect(page.getByText("Nomor berhasil diterima")).toBeVisible();
  },
);
