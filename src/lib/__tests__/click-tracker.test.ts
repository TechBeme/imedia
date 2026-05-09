import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseUserAgent, recordClick } from "../click-tracker";

// Mock the db module before any imports
vi.mock("@/db", () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => Promise.resolve()),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve()),
            })),
        })),
    },
}));

vi.mock("@/db/schema", () => ({
    shortLinks: { id: {}, clickCount: {} },
    linkClicks: { id: {}, linkId: {}, clickedAt: {} },
}));

describe("click-tracker.ts", () => {
    describe("hashFingerprint (via recordClick)", () => {
        it("should generate consistent fingerprints for same input", async () => {
            const { db } = await import("@/db");
            const insertMock = vi.fn(() => Promise.resolve());
            vi.mocked(db.insert).mockReturnValueOnce({ values: insertMock } as unknown as ReturnType<typeof db.insert>);

            const mockReq = {
                headers: {
                    get: vi.fn((name: string) => {
                        const headers: Record<string, string> = {
                            "x-forwarded-for": "192.168.1.1",
                            "user-agent": "Mozilla/5.0",
                            "accept-language": "en-US",
                        };
                        return headers[name] || null;
                    }),
                },
            } as unknown as import("next/server").NextRequest;

            await recordClick("link-1", mockReq);
            const call1 = insertMock.mock.calls[0][0];

            vi.mocked(db.insert).mockReturnValueOnce({ values: insertMock } as unknown as ReturnType<typeof db.insert>);
            await recordClick("link-1", mockReq);
            const call2 = insertMock.mock.calls[1][0];

            expect(call1.fingerprint).toBe(call2.fingerprint);
            expect(call1.fingerprint).toHaveLength(8);
        });
    });

    describe("parseUserAgent", () => {
        it("should parse Chrome on Windows correctly", () => {
            const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
            const result = parseUserAgent(ua);

            expect(result.device).toBe("desktop");
            expect(result.browser).toBe("chrome");
            expect(result.os).toBe("windows");
            expect(result.osVersion).toBe("10");
        });

        it("should parse Safari on macOS correctly", () => {
            const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";
            const result = parseUserAgent(ua);

            expect(result.device).toBe("desktop");
            expect(result.browser).toBe("safari");
            expect(result.os).toBe("macos");
        });

        it("should parse iPhone correctly", () => {
            const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
            const result = parseUserAgent(ua);

            expect(result.device).toBe("mobile");
            expect(result.deviceModel).toContain("Apple");
            expect(result.browser).toBe("mobile safari");
            expect(result.os).toBe("ios");
        });

        it("should parse Android correctly", () => {
            const ua = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
            const result = parseUserAgent(ua);

            expect(result.device).toBe("mobile");
            expect(result.browser).toBe("mobile chrome");
            expect(result.os).toBe("android");
        });

        it("should handle empty user agent", () => {
            const result = parseUserAgent("");
            expect(result.device).toBe("desktop");
            expect(result.browser).toBe("unknown");
            expect(result.os).toBe("unknown");
        });

        it("should handle unknown user agent", () => {
            const result = parseUserAgent("SomeBot/1.0");
            expect(result.device).toBe("desktop");
            expect(result.browser).toBeDefined();
            expect(result.os).toBeDefined();
        });
    });

    describe("recordClick", () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should record a click with all metadata", async () => {
            const { db } = await import("@/db");
            const mockReq = {
                headers: {
                    get: vi.fn((name: string) => {
                        const headers: Record<string, string> = {
                            "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
                            "referer": "https://google.com",
                            "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8",
                        };
                        return headers[name] || null;
                    }),
                },
            } as unknown as import("next/server").NextRequest;

            await recordClick("link-id-123", mockReq);

            expect(db.insert).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
        });

        it("should handle missing headers gracefully", async () => {
            const { db } = await import("@/db");
            const mockReq = {
                headers: {
                    get: vi.fn(() => null),
                },
            } as unknown as import("next/server").NextRequest;

            await recordClick("link-id-123", mockReq);

            expect(db.insert).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
        });

        it("should extract first IP from x-forwarded-for", async () => {
            const { db } = await import("@/db");
            const insertMock = vi.fn(() => Promise.resolve());
            vi.mocked(db.insert).mockReturnValueOnce({ values: insertMock } as unknown as ReturnType<typeof db.insert>);

            const mockReq = {
                headers: {
                    get: vi.fn((name: string) => {
                        if (name === "x-forwarded-for") return "203.0.113.1, 198.51.100.1";
                        if (name === "user-agent") return "Mozilla/5.0";
                        return null;
                    }),
                },
            } as unknown as import("next/server").NextRequest;

            await recordClick("link-id-123", mockReq);

            const callArgs = insertMock.mock.calls[0][0];
            expect(callArgs.ip).toBe("203.0.113.1");
        });
    });
});
