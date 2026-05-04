import { test, expect, request } from "@playwright/test";

const TEST_EMAIL = "test@imedia.local";
const TEST_PASSWORD = "TestPassword123!";
const BASE_URL = process.env.TEST_BASE_URL || "https://imedia.techbe.me";

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

    test("login API returns session cookie and dashboard is accessible", async ({ browser }) => {
        // Step 1: Login via API to get the session cookie
        const apiContext = await request.newContext({ baseURL: BASE_URL });
        const loginRes = await apiContext.post("/api/auth/sign-in/email", {
            data: {
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            },
            headers: { "Content-Type": "application/json" },
        });

        expect(loginRes.status()).toBe(200);
        const loginBody = await loginRes.json();
        expect(loginBody.token).toBeTruthy();
        expect(loginBody.user).toBeTruthy();

        // Extract cookies from API response
        const cookies = await apiContext.storageState();
        await apiContext.dispose();

        // Step 2: Create a new browser context with the session cookie
        const context = await browser.newContext();
        if (cookies.cookies && cookies.cookies.length > 0) {
            await context.addCookies(cookies.cookies.map((c) => ({
                name: c.name,
                value: c.value,
                domain: c.domain,
                path: c.path,
                httpOnly: c.httpOnly,
                secure: c.secure,
                sameSite: c.sameSite as "Strict" | "Lax" | "None",
            })));
        }

        // Step 3: Access dashboard with the authenticated context
        const page = await context.newPage();
        const response = await page.goto("/pt-BR/dashboard");
        expect(response?.status()).toBe(200);

        // Verify dashboard loaded (check for sidebar or header, not just "Dashboard" text)
        await expect(page.locator("text=iMedia").first()).toBeVisible();

        await context.close();
    });

    test("login form submit with callbackURL redirects to dashboard", async ({ page }) => {
        await page.goto("/pt-BR/login");

        await page.locator('input[type="email"]').fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();

        // Wait for redirect to dashboard (better-auth returns redirect=true with callbackURL)
        await page.waitForURL(/\/pt-BR\/dashboard/, { timeout: 10000 });
        await expect(page).toHaveURL(/\/pt-BR\/dashboard/);

        // Verify dashboard loaded
        await expect(page.locator("text=iMedia").first()).toBeVisible();
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
});
