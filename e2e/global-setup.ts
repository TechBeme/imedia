/**
 * Global setup: create a test user via the API before running tests.
 */
import { request } from "@playwright/test";

const TEST_EMAIL = "test@somedia.local";
const TEST_PASSWORD = "TestPassword123!";
const BASE_URL = process.env.TEST_BASE_URL || "https://somedia.techbe.me";

async function globalSetup() {
    const apiContext = await request.newContext({ baseURL: BASE_URL });

    // Try to sign up the test user
    const res = await apiContext.post("/api/auth/sign-up/email", {
        data: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            name: "Test User",
        },
        headers: { "Content-Type": "application/json" },
    });

    if (res.ok()) {
        console.log("[global-setup] Test user created successfully");
    } else {
        const body = await res.text().catch(() => "unknown");
        // User may already exist — that's fine
        if (body.includes("already exists") || body.includes("User already exists")) {
            console.log("[global-setup] Test user already exists");
        } else {
            console.warn("[global-setup] Sign-up response:", res.status(), body);
        }
    }

    await apiContext.dispose();
}

export default globalSetup;
