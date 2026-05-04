import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
    const key = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is not set");
    }
    const buffer = Buffer.from(key, "base64");
    if (buffer.length !== KEY_LENGTH) {
        throw new Error(
            `SOCIAL_TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes when decoded from base64. Got ${buffer.length} bytes.`
        );
    }
    return buffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string in the format: iv:ciphertext:authTag
 */
export function encrypt(plainText: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, encrypted, authTag]);
    return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded string in the format: iv:ciphertext:authTag
 */
export function decrypt(encrypted: string): string {
    const combined = Buffer.from(encrypted, "base64");

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
        throw new Error("Invalid encrypted data: too short");
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}

/**
 * Generate a cryptographically secure base64-encoded encryption key.
 * Use this to create a new SOCIAL_TOKEN_ENCRYPTION_KEY.
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("base64");
}
