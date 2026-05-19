import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { decrypt } from "@/lib/encryption";
import {
    updateSocialAccountMetrics,
    replaceSocialAccountMedia,
} from "@/lib/social-accounts";

export interface InstagramMedia {
    id: string;
    caption: string | null;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    view_count?: number;
}

type InstagramProfileResponse = {
    username?: string;
    name?: string;
    account_type?: string;
    profile_picture_url?: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    website?: string;
    error?: unknown;
};

type InstagramMediaItem = {
    id: string;
    caption?: string;
    media_type: InstagramMedia["media_type"];
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    view_count?: number;
};

type InstagramMediaResponse = {
    data?: InstagramMediaItem[];
    error?: unknown;
};

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        try {
            // Get Instagram account for user
            const [account] = await db
                .select()
                .from(socialAccounts)
                .where(
                    and(
                        eq(socialAccounts.userId, session.user.id),
                        eq(socialAccounts.platform, "instagram"),
                        eq(socialAccounts.isActive, true)
                    )
                )
                .limit(1);

            if (!account) {
                return success({ media: [], profile: null });
            }

            let accessToken: string | null = null;
            let tokenSource = "none";
            if (account.accessToken) {
                try {
                    accessToken = decrypt(account.accessToken);
                    tokenSource = "decrypted";
                } catch (e) {
                    console.log("[instagram/media] decrypt failed, trying raw token:", e);
                    accessToken = account.accessToken;
                    tokenSource = "raw";
                }
            }
            console.log("[instagram/media] account:", {
                providerAccountId: account.providerAccountId,
                hasToken: !!account.accessToken,
                tokenSource,
                tokenPrefix: accessToken?.substring(0, 10),
            });
            if (!accessToken) {
                return success({ media: [], profile: null, debug: { error: "no_token" } });
            }

            const providerAccountId = account.providerAccountId;

            // ── Fetch from Instagram Graph API ───────────────────────────────
            let profileData: InstagramProfileResponse = {};
            let mediaData: InstagramMediaResponse = {};

            console.log("[instagram/media] Fetching from Instagram Graph API...");

            // Try full fields for Business/Creator accounts
            const profileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
            profileUrl.searchParams.set(
                "fields",
                "username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count,website"
            );
            profileUrl.searchParams.set("access_token", accessToken);

            const profileRes = await fetch(profileUrl.toString(), { cache: "no-store" });
            profileData = await profileRes.json();
            console.log("[instagram/media] Profile:", JSON.stringify(profileData));

            const mediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
            mediaUrl.searchParams.set(
                "fields",
                "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,view_count"
            );
            mediaUrl.searchParams.set("limit", "18");
            mediaUrl.searchParams.set("access_token", accessToken);

            const mediaRes = await fetch(mediaUrl.toString(), { cache: "no-store" });
            mediaData = await mediaRes.json();
            console.log("[instagram/media] Media:", JSON.stringify({ count: mediaData.data?.length, error: mediaData.error }));

            // Fallback to minimal fields if full fields failed (personal accounts)
            // IMPORTANT: only fallback each endpoint individually — don't overwrite
            // working media data just because profile failed (or vice versa).
            if (profileData.error) {
                console.log("[instagram/media] Profile full fields failed, falling back to basic profile...");

                const basicProfileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
                basicProfileUrl.searchParams.set("fields", "username,account_type,media_count");
                basicProfileUrl.searchParams.set("access_token", accessToken);

                const basicProfileRes = await fetch(basicProfileUrl.toString(), { cache: "no-store" });
                const basicProfileData = await basicProfileRes.json();
                console.log("[instagram/media] Basic profile:", JSON.stringify(basicProfileData));

                if (!basicProfileData.error) profileData = basicProfileData;
            }

            if (mediaData.error) {
                console.log("[instagram/media] Media full fields failed, falling back to basic media...");

                const basicMediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
                // Still request engagement fields — personal accounts may support them
                basicMediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,view_count");
                basicMediaUrl.searchParams.set("limit", "18");
                basicMediaUrl.searchParams.set("access_token", accessToken);

                const basicMediaRes = await fetch(basicMediaUrl.toString(), { cache: "no-store" });
                const basicMediaData = await basicMediaRes.json();
                console.log("[instagram/media] Basic media:", JSON.stringify({ count: basicMediaData.data?.length, error: basicMediaData.error }));

                if (!basicMediaData.error) mediaData = basicMediaData;
            }

            // Log raw engagement data from API for debugging
            console.log("[instagram/media] Raw media items (first 3):");
            (mediaData.data || []).slice(0, 3).forEach((item, i: number) => {
                console.log(`  [${i}] id=${item.id?.slice(-8)} type=${item.media_type} likes=${item.like_count} comments=${item.comments_count} views=${item.view_count}`);
            });

            const media: InstagramMedia[] = (mediaData.data || []).map((item) => ({
                id: item.id,
                caption: item.caption || null,
                media_type: item.media_type,
                media_url: item.media_url,
                thumbnail_url: item.thumbnail_url,
                permalink: item.permalink,
                timestamp: item.timestamp,
                like_count: item.like_count ?? 0,
                comments_count: item.comments_count ?? 0,
                view_count: item.view_count ?? 0,
            }));

            // ── Persist to database (async, non-blocking) ────────────────────
            try {
                await updateSocialAccountMetrics(account.id, {
                    followersCount: profileData.followers_count || 0,
                    followsCount: profileData.follows_count || 0,
                    mediaCount: profileData.media_count || 0,
                    biography: profileData.biography || undefined,
                    website: profileData.website || undefined,
                });

                await replaceSocialAccountMedia(
                    account.id,
                    media.map((item) => ({
                        externalId: item.id,
                        caption: item.caption,
                        mediaType: item.media_type,
                        mediaUrl: item.media_url,
                        thumbnailUrl: item.thumbnail_url,
                        permalink: item.permalink,
                        timestamp: item.timestamp ? new Date(item.timestamp) : null,
                        likeCount: item.like_count,
                        commentsCount: item.comments_count,
                        viewCount: item.view_count,
                    }))
                );
                console.log("[instagram/media] Saved metrics + media to DB for account", account.id);
            } catch (dbErr) {
                // Don't fail the request if DB save fails — user still gets fresh data
                console.error("[instagram/media] DB save failed:", dbErr);
            }

            const accountType = profileData.account_type || "UNKNOWN";
            const isPersonal = accountType === "PERSONAL";

            return success({
                media,
                profile: {
                    username: profileData.username || account.username,
                    name: profileData.name || account.displayName || profileData.username || null,
                    mediaCount: profileData.media_count || 0,
                    followersCount: profileData.followers_count || 0,
                    followsCount: profileData.follows_count || 0,
                    biography: profileData.biography || "",
                    website: profileData.website || "",
                    profilePictureUrl: profileData.profile_picture_url || account.profilePicture || null,
                },
                debug: {
                    providerAccountId,
                    tokenSource,
                    accountType,
                    isPersonal,
                    profileError: profileData.error,
                    mediaError: mediaData.error,
                    engagementAvailable: !isPersonal,
                },
            });
        } catch (err) {
            console.error("[instagram/media GET] error:", err);
            return internalError("Failed to fetch Instagram media");
        }
    });
}
