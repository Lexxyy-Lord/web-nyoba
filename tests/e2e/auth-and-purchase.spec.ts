import { expect, test } from "@playwright/test";

const unique = Date.now();
const username = `e2e${unique}`;
const email = `${username}@example.com`;
const password = "SecurePass123";

async function login(page: Parameters<typeof test>[0] extends never ? never : any, identifier: string, loginPassword: string) {
  await page.goto("/login");
  await page.getByLabel("Email atau username").fill(identifier);
  await page.getByLabel("Password").fill(loginPassword);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/dashboard|admin/);
}

test("register, admin credit, mock purchase, and OTP order flow", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nama lengkap").fill("E2E User");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Konfirmasi password").fill(password);
  await page.getByText("Saya menyetujui").click();
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page).toHaveURL(/dashboard/);

  const profileResponse = await page.request.get("/api/test/user-id", {
    headers: { "x-e2e-secret": process.env.WORKER_SECRET ?? "ci-worker-secret" },
    params: { email },
  });
  expect(profileResponse.ok()).toBeTruthy();
  const profileBody = await profileResponse.json();
  const userId = profileBody.data.id as string;

  await page.getByRole("button", { name: "Keluar" }).click();
  await login(
    page,
    process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
  );

  await page.goto("/admin/balances");
  await page.locator('input[name="userId"]').fill(userId);
  await page.locator('input[name="amount"]').fill("50000");
  await page.locator('input[name="reason"]').fill("Saldo pengujian otomatis");
  await page.getByRole("button", { name: "Simpan mutasi saldo" }).click();
  await expect(page.getByText("Saldo berhasil disesuaikan")).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();
  await login(page, email, password);

  await page.goto("/dashboard/buy-number");
  await page.getByRole("button", { name: /WhatsApp/ }).click();
  await page.getByRole("button", { name: /Indonesia/ }).click();
  await page.getByRole("button", { name: /^any$/i }).click();
  await expect(page.getByText(/Rp12\.500/)).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi dan beli" }).click();
  await expect(page.getByText("Nomor berhasil diterima")).toBeVisible();
});
