import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, generateEncryptionKey } from "../encryption";
import { success, error, unauthorized, notFound, internalError } from "../api-response";

describe("Integration Smoke Tests", () => {
    describe("Encryption", () => {
        it("should encrypt and decrypt data correctly", () => {
            const original = "test-token-12345";
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(original);
        });

        it("should generate a valid encryption key", () => {
            const key = generateEncryptionKey();
            expect(key).toBeDefined();
            expect(Buffer.from(key, "base64").length).toBe(32);
        });
    });

    describe("API Response Helpers", () => {
        it("should return success response", () => {
            const response = success({ test: true });
            expect(response.status).toBe(200);
        });

        it("should return error response", () => {
            const response = error("VALIDATION_ERROR", "Test error");
            expect(response.status).toBe(400);
        });

        it("should return unauthorized response", () => {
            const response = unauthorized();
            expect(response.status).toBe(401);
        });

        it("should return notFound response", () => {
            const response = notFound();
            expect(response.status).toBe(404);
        });

        it("should return internalError response", () => {
            const response = internalError();
            expect(response.status).toBe(500);
        });
    });
});
