import { describe, it, expect, vi } from "vitest";
import {
    generateRandomSlug,
    isReservedSlug,
    validateCustomSlug,
    isSlugAvailable,
    generateUniqueSlug,
} from "../links";

// Mock the db module before any imports
vi.mock("@/db", () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve([])),
                })),
            })),
        })),
    },
}));

vi.mock("@/db/schema", () => ({
    shortLinks: { id: {}, slug: {}, domain: {} },
}));

describe("links.ts", () => {
    describe("generateRandomSlug", () => {
        it("should generate a slug of default length 7", () => {
            const slug = generateRandomSlug();
            expect(slug).toHaveLength(7);
            expect(/^[a-zA-Z0-9]+$/.test(slug)).toBe(true);
        });

        it("should generate a slug of custom length", () => {
            const slug = generateRandomSlug(12);
            expect(slug).toHaveLength(12);
        });

        it("should generate different slugs on multiple calls", () => {
            const slugs = new Set();
            for (let i = 0; i < 50; i++) {
                slugs.add(generateRandomSlug());
            }
            expect(slugs.size).toBeGreaterThan(45); // Very unlikely to collide
        });

        it("should only contain alphanumeric characters", () => {
            for (let i = 0; i < 20; i++) {
                const slug = generateRandomSlug();
                expect(/^[a-zA-Z0-9]+$/.test(slug)).toBe(true);
            }
        });
    });

    describe("isReservedSlug", () => {
        it("should return true for reserved slugs", () => {
            expect(isReservedSlug("admin")).toBe(true);
            expect(isReservedSlug("API")).toBe(true);
            expect(isReservedSlug("Login")).toBe(true);
            expect(isReservedSlug("dashboard")).toBe(true);
        });

        it("should return false for non-reserved slugs", () => {
            expect(isReservedSlug("abc123")).toBe(false);
            expect(isReservedSlug("mylink")).toBe(false);
            expect(isReservedSlug("x7k9m2")).toBe(false);
        });

        it("should be case-insensitive", () => {
            expect(isReservedSlug("ADMIN")).toBe(true);
            expect(isReservedSlug("Admin")).toBe(true);
            expect(isReservedSlug("aDmIn")).toBe(true);
        });
    });

    describe("validateCustomSlug", () => {
        it("should validate a correct slug", () => {
            const result = validateCustomSlug("my-link_123");
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should reject slugs shorter than 3 chars", () => {
            const result = validateCustomSlug("ab");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Slug must be at least 3 characters");
        });

        it("should reject slugs longer than 50 chars", () => {
            const result = validateCustomSlug("a".repeat(51));
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Slug must be at most 50 characters");
        });

        it("should reject slugs with invalid characters", () => {
            const result = validateCustomSlug("my link!");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Slug can only contain letters, numbers, hyphens, and underscores");
        });

        it("should reject reserved slugs", () => {
            const result = validateCustomSlug("admin");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("This slug is reserved");
        });

        it("should reject empty slugs", () => {
            const result = validateCustomSlug("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Slug must be at least 3 characters");
        });

        it("should accept slugs with hyphens and underscores", () => {
            expect(validateCustomSlug("my-link").valid).toBe(true);
            expect(validateCustomSlug("my_link").valid).toBe(true);
            expect(validateCustomSlug("my-link_123").valid).toBe(true);
        });
    });

    describe("isSlugAvailable", () => {
        it("should return true when slug is available", async () => {
            const { db } = await import("@/db");
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([])),
                    })),
                })),
            } as unknown as ReturnType<typeof db.select>);

            const result = await isSlugAvailable("available-slug");
            expect(result).toBe(true);
        });

        it("should return false when slug is taken", async () => {
            const { db } = await import("@/db");
            vi.mocked(db.select).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([{ id: "some-id" }])),
                    })),
                })),
            } as unknown as ReturnType<typeof db.select>);

            const result = await isSlugAvailable("taken-slug");
            expect(result).toBe(false);
        });
    });

    describe("generateUniqueSlug", () => {
        it("should return a unique slug on first try", async () => {
            const { db } = await import("@/db");
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([])),
                    })),
                })),
            } as unknown as ReturnType<typeof db.select>);

            const slug = await generateUniqueSlug();
            expect(slug).toHaveLength(7);
            expect(/^[a-zA-Z0-9]+$/.test(slug)).toBe(true);
        });

        it("should retry and eventually return a unique slug", async () => {
            const { db } = await import("@/db");
            let callCount = 0;
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => {
                            callCount++;
                            return Promise.resolve(callCount < 3 ? [{ id: "x" }] : []);
                        }),
                    })),
                })),
            } as unknown as ReturnType<typeof db.select>);

            const slug = await generateUniqueSlug(5);
            expect(slug).toBeDefined();
            expect(callCount).toBe(3);
        });

        it("should throw when all retries exhausted", async () => {
            const { db } = await import("@/db");
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([{ id: "x" }])),
                    })),
                })),
            } as unknown as ReturnType<typeof db.select>);

            await expect(generateUniqueSlug(1)).rejects.toThrow(
                "Could not generate a unique slug after multiple attempts"
            );
        });
    });
});
