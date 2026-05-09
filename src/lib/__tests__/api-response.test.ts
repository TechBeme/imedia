import { describe, it, expect } from "vitest";
import {
    ErrorCodes,
    success,
    error,
    unauthorized,
    notFound,
    conflict,
    internalError,
} from "../api-response";

describe("api-response.ts", () => {
    describe("ErrorCodes", () => {
        it("should contain all expected error codes", () => {
            expect(ErrorCodes.AUTH_UNAUTHORIZED).toBe("AUTH_UNAUTHORIZED");
            expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
            expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
            expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
            expect(ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
            expect(ErrorCodes.LINK_NOT_FOUND).toBe("LINK_NOT_FOUND");
            expect(ErrorCodes.LINK_EXPIRED).toBe("LINK_EXPIRED");
        });
    });

    describe("success", () => {
        it("should return 200 with data", async () => {
            const response = success({ id: "123", name: "test" });
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data).toEqual({ id: "123", name: "test" });
        });

        it("should support custom status codes", () => {
            const response = success({ created: true }, 201);
            expect(response.status).toBe(201);
        });

        it("should return JSON content-type", () => {
            const response = success({});
            expect(response.headers.get("content-type")).toContain("application/json");
        });
    });

    describe("error", () => {
        it("should return 400 with error code and message", async () => {
            const response = error("VALIDATION_ERROR", "Invalid input", 400);
            expect(response.status).toBe(400);

            const body = await response.json();
            expect(body.error.code).toBe("VALIDATION_ERROR");
            expect(body.error.message).toBe("Invalid input");
        });

        it("should return 429 with rate limit headers", async () => {
            const headers = {
                "X-RateLimit-Limit": "60",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": "1234567890",
            };
            const response = error("RATE_LIMIT_EXCEEDED", "Too many requests", 429, headers);
            expect(response.status).toBe(429);
            expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
        });

        it("should use default message if not provided", async () => {
            const response = error("NOT_FOUND", undefined, 404);
            const body = await response.json();
            expect(body.error.message).toBeUndefined();
        });
    });

    describe("unauthorized", () => {
        it("should return 401 with default message", async () => {
            const response = unauthorized();
            expect(response.status).toBe(401);

            const body = await response.json();
            expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
            expect(body.error.message).toBe("Unauthorized");
        });

        it("should return 401 with custom message", async () => {
            const response = unauthorized("Session expired");
            const body = await response.json();
            expect(body.error.message).toBe("Session expired");
        });
    });

    describe("notFound", () => {
        it("should return 404", async () => {
            const response = notFound();
            expect(response.status).toBe(404);

            const body = await response.json();
            expect(body.error.code).toBe("NOT_FOUND");
        });
    });

    describe("conflict", () => {
        it("should return 409", async () => {
            const response = conflict("Resource already exists");
            expect(response.status).toBe(409);

            const body = await response.json();
            expect(body.error.code).toBe("CONFLICT");
            expect(body.error.message).toBe("Resource already exists");
        });
    });

    describe("internalError", () => {
        it("should return 500", async () => {
            const response = internalError();
            expect(response.status).toBe(500);

            const body = await response.json();
            expect(body.error.code).toBe("INTERNAL_ERROR");
            expect(body.error.message).toBe("Internal server error");
        });
    });
});
