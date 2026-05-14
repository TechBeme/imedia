import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { socialAccounts, socialAccountMedia } from "@/db/schema";
import { encrypt, decrypt } from "./encryption";

export interface SocialAccountData {
    userId: string;
    platform: string;
    providerAccountId: string;
    username?: string;
    displayName?: string;
    profilePicture?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
}

export interface SocialAccountPublic {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
    metadata: Record<string, unknown> | null;
    followersCount: number | null;
    followsCount: number | null;
    mediaCount: number | null;
    biography: string | null;
    website: string | null;
    metricsFetchedAt: Date | null;
    isActive: boolean;
    createdAt: Date;
}

export interface SocialAccountWithTokens extends SocialAccountPublic {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
}

/**
 * Get all social accounts for a user.
 * Returns public fields only (no tokens) by default.
 */
export async function getSocialAccounts(
    userId: string,
    includeTokens = false
): Promise<SocialAccountPublic[] | SocialAccountWithTokens[]> {
    const accounts = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.userId, userId));

    if (includeTokens) {
        return accounts.map((account) => ({
            id: account.id,
            platform: account.platform,
            username: account.username,
            displayName: account.displayName,
            profilePicture: account.profilePicture,
            metadata: (account.metadata as Record<string, unknown>) || null,
            followersCount: account.followersCount,
            followsCount: account.followsCount,
            mediaCount: account.mediaCount,
            biography: account.biography,
            website: account.website,
            metricsFetchedAt: account.metricsFetchedAt,
            isActive: account.isActive,
            createdAt: account.createdAt,
            accessToken: account.accessToken ? decrypt(account.accessToken) : null,
            refreshToken: account.refreshToken ? decrypt(account.refreshToken) : null,
            expiresAt: account.expiresAt,
        })) as SocialAccountWithTokens[];
    }

    return accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        profilePicture: account.profilePicture,
        metadata: (account.metadata as Record<string, unknown>) || null,
        followersCount: account.followersCount,
        followsCount: account.followsCount,
        mediaCount: account.mediaCount,
        biography: account.biography,
        website: account.website,
        metricsFetchedAt: account.metricsFetchedAt,
        isActive: account.isActive,
        createdAt: account.createdAt,
    })) as SocialAccountPublic[];
}

/**
 * Get a single social account by ID with decrypted tokens.
 */
export async function getSocialAccountById(
    accountId: string,
    userId: string
): Promise<SocialAccountWithTokens | null> {
    const [account] = await db
        .select()
        .from(socialAccounts)
        .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)));

    if (!account) return null;

    return {
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        profilePicture: account.profilePicture,
        metadata: (account.metadata as Record<string, unknown>) || null,
        followersCount: account.followersCount,
        followsCount: account.followsCount,
        mediaCount: account.mediaCount,
        biography: account.biography,
        website: account.website,
        metricsFetchedAt: account.metricsFetchedAt,
        isActive: account.isActive,
        createdAt: account.createdAt,
        accessToken: account.accessToken ? decrypt(account.accessToken) : null,
        refreshToken: account.refreshToken ? decrypt(account.refreshToken) : null,
        expiresAt: account.expiresAt,
    };
}

/**
 * Save a new social account with encrypted tokens.
 */
export async function saveSocialAccount(data: SocialAccountData) {
    const [account] = await db
        .insert(socialAccounts)
        .values({
            userId: data.userId,
            platform: data.platform,
            providerAccountId: data.providerAccountId,
            username: data.username,
            displayName: data.displayName,
            profilePicture: data.profilePicture,
            accessToken: data.accessToken ? encrypt(data.accessToken) : null,
            refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
            expiresAt: data.expiresAt,
            metadata: data.metadata,
            isActive: true,
        })
        .returning();

    return account;
}

/**
 * Update social account tokens (e.g., after refresh).
 */
export async function updateSocialAccountTokens(
    accountId: string,
    userId: string,
    tokens: { accessToken?: string; refreshToken?: string; expiresAt?: Date }
) {
    const updates: Partial<typeof socialAccounts.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (tokens.accessToken !== undefined) {
        updates.accessToken = tokens.accessToken ? encrypt(tokens.accessToken) : null;
    }
    if (tokens.refreshToken !== undefined) {
        updates.refreshToken = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;
    }
    if (tokens.expiresAt !== undefined) {
        updates.expiresAt = tokens.expiresAt;
    }

    const [account] = await db
        .update(socialAccounts)
        .set(updates)
        .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)))
        .returning();

    return account;
}

/**
 * Delete a social account.
 */
export async function deleteSocialAccount(accountId: string, userId: string) {
    const [account] = await db
        .delete(socialAccounts)
        .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)))
        .returning();

    return account;
}

// ── Cached metrics & media ────────────────────────────────────────────────

export interface SocialAccountMetrics {
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    biography?: string;
    website?: string;
}

export interface SocialAccountMediaItem {
    externalId: string;
    caption?: string | null;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl?: string | null;
    permalink: string;
    timestamp?: Date | null;
    likeCount: number;
    commentsCount: number;
    viewCount?: number | null;
}

/**
 * Update cached profile metrics for a social account.
 */
export async function updateSocialAccountMetrics(
    accountId: string,
    metrics: SocialAccountMetrics
) {
    const [account] = await db
        .update(socialAccounts)
        .set({
            followersCount: metrics.followersCount,
            followsCount: metrics.followsCount,
            mediaCount: metrics.mediaCount,
            biography: metrics.biography ?? null,
            website: metrics.website ?? null,
            metricsFetchedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(socialAccounts.id, accountId))
        .returning();

    return account;
}

/**
 * Replace all cached media items for a social account (sync with latest from API).
 */
export async function replaceSocialAccountMedia(
    accountId: string,
    items: SocialAccountMediaItem[]
) {
    await db
        .delete(socialAccountMedia)
        .where(eq(socialAccountMedia.socialAccountId, accountId));

    if (items.length === 0) return [];

    const inserted = await db
        .insert(socialAccountMedia)
        .values(
            items.map((item) => ({
                socialAccountId: accountId,
                externalId: item.externalId,
                caption: item.caption ?? null,
                mediaType: item.mediaType,
                mediaUrl: item.mediaUrl,
                thumbnailUrl: item.thumbnailUrl ?? null,
                permalink: item.permalink,
                timestamp: item.timestamp ?? null,
                likeCount: item.likeCount,
                commentsCount: item.commentsCount,
                viewCount: item.viewCount ?? null,
                fetchedAt: new Date(),
            }))
        )
        .returning();

    return inserted;
}

/**
 * Get cached media items for a social account.
 */
export async function getSocialAccountMedia(accountId: string) {
    return db
        .select()
        .from(socialAccountMedia)
        .where(eq(socialAccountMedia.socialAccountId, accountId))
        .orderBy(socialAccountMedia.timestamp);
}
