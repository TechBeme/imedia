import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

// Mocks
vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(),
}));

vi.mock("@/lib/api-guard", () => ({
    withRateLimit: vi.fn((_req, _limit, handler) => handler()),
}));

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

describe("GET /api/instagram/auth", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env = {
            ...originalEnv,
            INSTAGRAM_APP_ID: "test-app-id",
            INSTAGRAM_REDIRECT_URI: "https://somedia.techbe.me/api/instagram/callback",
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns 401 when user is not authenticated", async () => {
        (headers as any).mockResolvedValue(new Headers());
        (auth.api.getSession as any).mockResolvedValue(null);

        const req = new Request("https://somedia.techbe.me/api/instagram/auth");
        const res = await GET(req as any);

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("returns 500 when env vars are missing", async () => {
        delete process.env.INSTAGRAM_APP_ID;
        delete process.env.INSTAGRAM_REDIRECT_URI;

        (headers as any).mockResolvedValue(new Headers());
        (auth.api.getSession as any).mockResolvedValue({ user: { id: "user-123" } });

        const req = new Request("https://somedia.techbe.me/api/instagram/auth");
        const res = await GET(req as any);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    it("returns 200 with a valid Instagram OAuth URL", async () => {
        (headers as any).mockResolvedValue(new Headers());
        (auth.api.getSession as any).mockResolvedValue({ user: { id: "user-123" } });

        const req = new Request("https://somedia.techbe.me/api/instagram/auth");
        const res = await GET(req as any);

        expect(res.status).toBe(200);
        const body = await res.json();

        // CRITICAL: response shape must be { data: { url: string } }
        expect(body).toHaveProperty("data");
        expect(body.data).toHaveProperty("url");
        expect(typeof body.data.url).toBe("string");

        const url = new URL(body.data.url);
        expect(url.hostname).toBe("www.instagram.com");
        expect(url.pathname).toBe("/oauth/authorize");
        expect(url.searchParams.get("client_id")).toBe("test-app-id");
        expect(url.searchParams.get("redirect_uri")).toBe("https://somedia.techbe.me/api/instagram/callback");
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.get("scope")).toContain("instagram_business_basic");
        expect(url.searchParams.get("state")).toBeTruthy();
    });
});
