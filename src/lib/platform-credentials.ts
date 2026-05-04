import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { platformCredentials } from "@/db/schema";
import { encrypt, decrypt } from "./encryption";

export interface PlatformCredentialData {
    userId: string;
    platform: string;
    appId: string;
    appSecret: string;
    redirectUri?: string;
}

export interface PlatformCredentialPublic {
    id: string;
    platform: string;
    redirectUri: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlatformCredentialWithSecrets extends PlatformCredentialPublic {
    appId: string;
    appSecret: string;
}

/**
 * List all platform credentials for a user.
 * Returns public fields only (no appId/appSecret).
 */
export async function listPlatformCredentials(
    userId: string
): Promise<PlatformCredentialPublic[]> {
    const credentials = await db
        .select({
            id: platformCredentials.id,
            platform: platformCredentials.platform,
            redirectUri: platformCredentials.redirectUri,
            isActive: platformCredentials.isActive,
            createdAt: platformCredentials.createdAt,
            updatedAt: platformCredentials.updatedAt,
        })
        .from(platformCredentials)
        .where(eq(platformCredentials.userId, userId));

    return credentials;
}

/**
 * Get platform credentials for a specific platform with decrypted secrets.
 * Used internally by OAuth flows.
 */
export async function getPlatformCredentials(
    userId: string,
    platform: string
): Promise<PlatformCredentialWithSecrets | null> {
    const [credential] = await db
        .select()
        .from(platformCredentials)
        .where(
            and(
                eq(platformCredentials.userId, userId),
                eq(platformCredentials.platform, platform)
            )
        );

    if (!credential) return null;

    return {
        id: credential.id,
        platform: credential.platform,
        appId: decrypt(credential.appId),
        appSecret: decrypt(credential.appSecret),
        redirectUri: credential.redirectUri,
        isActive: credential.isActive,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
    };
}

/**
 * Save new platform credentials with encrypted secrets.
 */
export async function savePlatformCredential(data: PlatformCredentialData) {
    const [credential] = await db
        .insert(platformCredentials)
        .values({
            userId: data.userId,
            platform: data.platform,
            appId: encrypt(data.appId),
            appSecret: encrypt(data.appSecret),
            redirectUri: data.redirectUri,
            isActive: true,
        })
        .returning();

    return credential;
}

/**
 * Update platform credentials with re-encryption.
 */
export async function updatePlatformCredential(
    credentialId: string,
    userId: string,
    data: Partial<Pick<PlatformCredentialData, "appId" | "appSecret" | "redirectUri" | "platform">>
) {
    const updates: Partial<typeof platformCredentials.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (data.appId !== undefined) {
        updates.appId = encrypt(data.appId);
    }
    if (data.appSecret !== undefined) {
        updates.appSecret = encrypt(data.appSecret);
    }
    if (data.redirectUri !== undefined) {
        updates.redirectUri = data.redirectUri;
    }
    if (data.platform !== undefined) {
        updates.platform = data.platform;
    }

    const [credential] = await db
        .update(platformCredentials)
        .set(updates)
        .where(
            and(
                eq(platformCredentials.id, credentialId),
                eq(platformCredentials.userId, userId)
            )
        )
        .returning();

    return credential;
}

/**
 * Delete platform credentials.
 */
export async function deletePlatformCredential(credentialId: string, userId: string) {
    const [credential] = await db
        .delete(platformCredentials)
        .where(
            and(
                eq(platformCredentials.id, credentialId),
                eq(platformCredentials.userId, userId)
            )
        )
        .returning();

    return credential;
}

/**
 * Check if a user has credentials configured for a platform.
 */
export async function hasPlatformCredential(
    userId: string,
    platform: string
): Promise<boolean> {
    const [credential] = await db
        .select({ id: platformCredentials.id })
        .from(platformCredentials)
        .where(
            and(
                eq(platformCredentials.userId, userId),
                eq(platformCredentials.platform, platform),
                eq(platformCredentials.isActive, true)
            )
        )
        .limit(1);

    return !!credential;
}
