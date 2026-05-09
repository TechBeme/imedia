import { describe, it, expect, vi } from "vitest";

// Mock Upstash Redis
vi.mock("@upstash/redis", () => ({
    Redis: vi.fn().mockImplementation(function MockRedis() {
        return {
            get: vi.fn(),
            set: vi.fn(),
        };
    }),
}));

vi.mock("@upstash/ratelimit", () => ({
    Ratelimit: Object.assign(
        vi.fn().mockImplementation(function MockRatelimit() {
            return {
                limit: vi.fn(),
            };
        }),
        {
            slidingWindow: vi.fn(() => ({})),
        }
    ),
}));

describe("rate-limit.ts", () => {
    describe("checkRateLimit", () => {
        it("should return success true when under limit", async () => {
            const { checkRateLimit } = await import("../rate-limit");
            const mockLimiter = {
                limit: vi.fn(() =>
                    Promise.resolve({
                        success: true,
                        limit: 60,
                        remaining: 59,
                        reset: Date.now() + 60000,
                    })
                ),
            } as unknown as import("@upstash/ratelimit").Ratelimit;

            const result = await checkRateLimit("user-123", mockLimiter);

            expect(result.success).toBe(true);
            expect(result.limit).toBe(60);
            expect(result.remaining).toBe(59);
        });

        it("should return success false when over limit", async () => {
            const { checkRateLimit } = await import("../rate-limit");
            const mockLimiter = {
                limit: vi.fn(() =>
                    Promise.resolve({
                        success: false,
                        limit: 60,
                        remaining: 0,
                        reset: Date.now() + 60000,
                    })
                ),
            } as unknown as import("@upstash/ratelimit").Ratelimit;

            const result = await checkRateLimit("user-123", mockLimiter);

            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it("should pass identifier to limiter", async () => {
            const { checkRateLimit } = await import("../rate-limit");
            const limitMock = vi.fn(() =>
                Promise.resolve({
                    success: true,
                    limit: 60,
                    remaining: 59,
                    reset: Date.now() + 60000,
                })
            );
            const mockLimiter = {
                limit: limitMock,
            } as unknown as import("@upstash/ratelimit").Ratelimit;

            await checkRateLimit("ip-192-168-1-1", mockLimiter);

            expect(limitMock).toHaveBeenCalledWith("ip-192-168-1-1");
        });
    });
});
