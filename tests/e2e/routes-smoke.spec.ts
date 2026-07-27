import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
];

const protectedRoutes = [
  "/dashboard",
  "/dashboard/buy-number",
  "/dashboard/orders",
  "/dashboard/order-history",
  "/dashboard/balance-history",
  "/dashboard/deposit",
  "/dashboard/notifications",
  "/dashboard/profile",
  "/dashboard/security",
  "/dashboard/help",
  "/admin",
  "/admin/users",
  "/admin/balances",
  "/admin/orders",
  "/admin/deposits",
  "/admin/ledger",
  "/admin/pricing",
  "/admin/services",
  "/admin/providers",
  "/admin/reports",
  "/admin/api-logs",
  "/admin/activity-logs",
  "/admin/notifications",
  "/admin/settings",
  "/admin/security",
  "/admin/profile",
];

async function expectHealthyPage(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `Tidak menerima response untuk ${route}`).not.toBeNull();
  expect(response!.status(), `${route} mengembalikan HTTP ${response!.status()}`).toBeLessThan(400);
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
  await expect(page.locator("body")).not.toContainText("This page could not be found");
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("Email atau username")
    .fill(process.env.SEED_ADMIN_EMAIL ?? "admin@example.com");
  await page
    .getByLabel("Password")
    .fill(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!");

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Masuk" }).click();
  const response = await loginResponse;
  expect(response.ok(), await response.text()).toBeTruthy();
}

test.describe("route smoke checks", () => {
  test("all public routes render without HTTP or runtime errors", async ({ page }) => {
    for (const route of publicRoutes) {
      await expectHealthyPage(page, route);
    }
  });

  test("all user and admin routes render for super admin", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Protected route smoke test runs once on Chromium",
    );

    await loginAsAdmin(page);

    for (const route of protectedRoutes) {
      await expectHealthyPage(page, route);
      await expect(page).not.toHaveURL(/\/login/);
    }
  });
});
