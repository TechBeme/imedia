import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRateLimit } from "../api-guard";
import { Ratelimit } from "@upstash/ratelimit";

// Mock rate-limit module
vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn(),
}));

describe("api-guard.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (ip = "192.168.1.1") =>
        ({
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "x-forwarded-for") return ip;
                    return null;
                }),
            },
        }) as unknown as import("next/server").NextRequest;

    it("should call handler when rate limit passes", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit");
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });

        const handler = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        );
        const mockLimiter = {} as Ratelimit;

        const response = await withRateLimit(createMockRequest(), mockLimiter, handler);

        expect(handler).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it("should return 429 when rate limit exceeded", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit");
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
            success: false,
            limit: 60,
            remaining: 0,
            reset: Date.now() + 60000,
        });

        const handler = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        );
        const mockLimiter = {} as Ratelimit;

        const response = await withRateLimit(createMockRequest(), mockLimiter, handler);

        expect(handler).not.toHaveBeenCalled();
        expect(response.status).toBe(429);

        const body = await response.json();
        expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should add rate limit headers to successful responses", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit");
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
            success: true,
            limit: 60,
            remaining: 55,
            reset: 1234567890,
        });

        const handler = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        );
        const mockLimiter = {} as Ratelimit;

        const response = await withRateLimit(createMockRequest(), mockLimiter, handler);

        expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
        expect(response.headers.get("X-RateLimit-Remaining")).toBe("55");
        expect(response.headers.get("X-RateLimit-Reset")).toBe("1234567890");
    });

    it("should use anonymous IP when x-forwarded-for is missing", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit");
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });

        const handler = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        );
        const mockLimiter = {} as Ratelimit;

        const req = {
            headers: {
                get: vi.fn(() => null),
            },
        } as unknown as import("next/server").NextRequest;

        await withRateLimit(req, mockLimiter, handler);

        expect(checkRateLimit).toHaveBeenCalledWith("anonymous", mockLimiter);
    });

    it("should extract first IP from x-forwarded-for chain", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit");
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });

        const handler = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        );
        const mockLimiter = {} as Ratelimit;

        const req = {
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "x-forwarded-for") return "203.0.113.1, 198.51.100.1, 10.0.0.1";
                    return null;
                }),
            },
        } as unknown as import("next/server").NextRequest;

        await withRateLimit(req, mockLimiter, handler);

        expect(checkRateLimit).toHaveBeenCalledWith("203.0.113.1", mockLimiter);
    });
});
