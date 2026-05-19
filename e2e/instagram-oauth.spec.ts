import { test, expect, request, type Browser, type Cookie } from "@playwright/test";

const TEST_EMAIL = "test@somedia.local";
const TEST_PASSWORD = "TestPassword123!";
const BASE_URL = process.env.TEST_BASE_URL || "https://somedia.techbe.me";

async function getAuthenticatedContext(browser: Browser) {
    // Login via API to get session cookie
    const apiContext = await request.newContext({ baseURL: BASE_URL });
    const loginRes = await apiContext.post("/api/auth/sign-in/email", {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
        headers: { "Content-Type": "application/json" },
    });

    expect(loginRes.status()).toBe(200);
    const cookies = await apiContext.storageState();
    await apiContext.dispose();

    // Create browser context with cookies
    const context = await browser.newContext();
    if (cookies.cookies?.length > 0) {
        await context.addCookies(cookies.cookies.map((c: Cookie) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expires,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: c.sameSite,
        })));
    }
    return context;
}

test.describe("Instagram OAuth Flow", () => {
    test("auth endpoint returns correct response shape when authenticated", async ({ browser }) => {
        const context = await getAuthenticatedContext(browser);
        const page = await context.newPage();

        // Intercept the auth request
        let responseBody: { data?: { url?: string } } | null = null;
        let responseStatus = 0;

        await page.route("**/api/instagram/auth", async (route) => {
            const response = await route.fetch();
            responseStatus = response.status();
            responseBody = await response.json();
            await route.fulfill({ response });
        });

        // Navigate to accounts page
        await page.goto("/pt-BR/accounts");
        await page.waitForSelector("text=Instagram", { timeout: 10000 });

        // The Instagram card is the first card; find its connect button
        const connectButton = page.locator(".glass-card").first().locator('button:has-text("Conectar")');

        // Wait for button to be enabled (loading finishes)
        await expect(connectButton).toBeEnabled({ timeout: 10000 });

        // Wait a bit for any API call
        await connectButton.click();
        await page.waitForTimeout(3000);

        // Verify the API response
        console.log("\n📡 Auth API Response:");
        console.log(`   Status: ${responseStatus}`);
        console.log(`   Body:`, JSON.stringify(responseBody, null, 2));

        expect(responseStatus).toBe(200);
        expect(responseBody).toHaveProperty("data");
        expect(responseBody.data).toHaveProperty("url");
        expect(typeof responseBody.data.url).toBe("string");

        const url = new URL(responseBody.data.url);
        expect(url.hostname).toBe("www.instagram.com");
        expect(url.pathname).toBe("/oauth/authorize");
        expect(url.searchParams.get("client_id")).toBeTruthy();
        expect(url.searchParams.get("redirect_uri")).toBeTruthy();
        expect(url.searchParams.get("scope")).toContain("instagram_business_basic");
        expect(url.searchParams.get("state")).toBeTruthy();
        expect(url.searchParams.get("response_type")).toBe("code");

        console.log(`\n✅ Auth endpoint response is VALID`);
        console.log(`   Generated URL: ${url.toString()}`);

        await context.close();
    });

    test("connect button opens Instagram OAuth page", async ({ browser }) => {
        const context = await getAuthenticatedContext(browser);
        const page = await context.newPage();

        await page.goto("/pt-BR/accounts");
        await page.waitForSelector("text=Instagram", { timeout: 10000 });

        // The Instagram card is the first card; find its connect button
        const connectButton = page.locator(".glass-card").first().locator('button:has-text("Conectar")');

        // Wait for button to be enabled (loading finishes)
        await expect(connectButton).toBeEnabled({ timeout: 10000 });

        // Click and wait for navigation or popup
        const [newPage] = await Promise.all([
            context.waitForEvent("page", { timeout: 15000 }).catch(() => null),
            connectButton.click(),
        ]);

        if (newPage) {
            // Popup opened
            await newPage.waitForLoadState("domcontentloaded", { timeout: 15000 });
            const popupUrl = newPage.url();
            console.log("\n🌐 Popup URL:", popupUrl);

            // Should be Instagram
            expect(popupUrl).toContain("instagram.com");

            // Check for error text
            const bodyText = await newPage.locator("body").textContent({ timeout: 5000 }).catch(() => "");
            const lowerText = bodyText.toLowerCase();

            const hasError =
                lowerText.includes("ocorreu um erro") ||
                lowerText.includes("an error occurred") ||
                (lowerText.includes("error") && lowerText.includes("sorry"));

            if (hasError) {
                console.error("\n❌ Instagram popup shows ERROR:");
                console.error(bodyText.slice(0, 800));
            }

            expect(hasError, `Instagram shows error page: ${bodyText.slice(0, 200)}`).toBe(false);
            console.log("\n✅ Instagram OAuth page loaded without error");

            await newPage.close();
        } else {
            // No popup - wait for navigation in same page
            try {
                await page.waitForURL(/instagram\.com/, { timeout: 8000 });
                console.log("\n✅ Redirected to Instagram in same tab");
                console.log("   URL:", page.url());
            } catch {
                // No redirect happened - this is the bug!
                const currentUrl = page.url();
                console.log("\n❌ NO REDIRECT HAPPENED");
                console.log("   Current URL:", currentUrl);

                // Check for console errors
                const consoleErrors: string[] = [];
                page.on("console", (msg) => {
                    if (msg.type() === "error") consoleErrors.push(msg.text());
                });
                await page.waitForTimeout(1000);
                if (consoleErrors.length > 0) {
                    console.log("   Console errors:", consoleErrors);
                }

                // Check for error toast
                const toast = await page.locator("[data-sonner-toast]").textContent({ timeout: 3000 }).catch(() => "");
                if (toast) console.log("   Toast:", toast);

                throw new Error(`Expected redirect to instagram.com but stayed at ${currentUrl}`);
            }
        }

        await context.close();
    });
});
