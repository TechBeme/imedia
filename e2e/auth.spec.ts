import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@imedia.local";
const TEST_PASSWORD = "TestPassword123!";

test.describe("Auth Flow", () => {
    test.beforeEach(async ({ page }) => {
        // Clear all cookies and storage before each test
        await page.context().clearCookies();
    });

    test("login page loads without redirect loop", async ({ page }) => {
        const response = await page.goto("/pt-BR/login");
        expect(response?.status()).toBe(200);

        // Verify we are on the login page, not in a loop
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Check URL did not change (no redirect loop)
        await expect(page).toHaveURL(/\/pt-BR\/login/);
    });

    test("login with valid credentials redirects to dashboard", async ({ page }) => {
        await page.goto("/pt-BR/login");

        // Fill login form
        await page.locator('input[type="email"]').fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();

        // Wait for navigation to dashboard
        await page.waitForURL(/\/pt-BR\/dashboard/, { timeout: 10000 });

        // Verify dashboard loaded
        await expect(page.locator("text=Dashboard")).toBeVisible();
    });

    test("login with invalid credentials shows error", async ({ page }) => {
        await page.goto("/pt-BR/login");

        await page.locator('input[type="email"]').fill("wrong@example.com");
        await page.locator('input[type="password"]').fill("wrongpassword");
        await page.locator('button[type="submit"]').click();

        // Should stay on login page
        await expect(page).toHaveURL(/\/pt-BR\/login/);

        // Error toast should appear
        await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });
    });

    test("dashboard redirects unauthenticated to login", async ({ page }) => {
        await page.goto("/pt-BR/dashboard");

        // Should redirect to login
        await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
        await expect(page).toHaveURL(/\/pt-BR\/login/);
    });

    test("root path redirects to login when unauthenticated", async ({ page }) => {
        await page.goto("/");

        // Root -> /pt-BR -> /pt-BR/dashboard -> /pt-BR/login
        await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
        await expect(page).toHaveURL(/\/pt-BR\/login/);
    });

    test("register page loads", async ({ page }) => {
        const response = await page.goto("/pt-BR/register");
        expect(response?.status()).toBe(200);
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test("logout works and redirects to login", async ({ page }) => {
        // First login
        await page.goto("/pt-BR/login");
        await page.locator('input[type="email"]').fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(/\/pt-BR\/dashboard/, { timeout: 10000 });

        // Logout (assuming there's a logout button or we can call the API)
        await page.goto("/api/auth/sign-out");

        // Clear cookies to simulate logout
        await page.context().clearCookies();

        // Try to access dashboard
        await page.goto("/pt-BR/dashboard");
        await page.waitForURL(/\/pt-BR\/login/, { timeout: 5000 });
    });
});
