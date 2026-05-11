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
}

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
                    // Token might be stored unencrypted (legacy) - try using directly
                    console.log("[instagram/media] decrypt failed, trying raw token:", e);
                    accessToken = account.accessToken;
                    tokenSource = "raw";
                }
            }
            console.log("[instagram/media] account:", { providerAccountId: account.providerAccountId, hasToken: !!account.accessToken, tokenSource, tokenPrefix: accessToken?.substring(0, 10) });
            if (!accessToken) {
                return success({ media: [], profile: null, debug: { error: "no_token" } });
            }

            const providerAccountId = account.providerAccountId;

            // Use Instagram Graph API (graph.instagram.com) - works with Instagram Login tokens
            // for Business/Creator accounts with extended fields
            let profileData: any = {};
            let mediaData: any = {};

            console.log("[instagram/media] Fetching from Instagram Graph API...");

            // Try full fields for Business/Creator accounts
            const profileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
            profileUrl.searchParams.set(
                "fields",
                "username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count,website"
            );
            profileUrl.searchParams.set("access_token", accessToken);

            const profileRes = await fetch(profileUrl.toString(), { next: { revalidate: 60 } });
            profileData = await profileRes.json();
            console.log("[instagram/media] Profile:", JSON.stringify(profileData));

            const mediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
            mediaUrl.searchParams.set(
                "fields",
                "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
            );
            mediaUrl.searchParams.set("limit", "18");
            mediaUrl.searchParams.set("access_token", accessToken);

            const mediaRes = await fetch(mediaUrl.toString(), { next: { revalidate: 60 } });
            mediaData = await mediaRes.json();
            console.log("[instagram/media] Media:", JSON.stringify({ count: mediaData.data?.length, error: mediaData.error }));

            // Fallback to minimal fields if full fields failed (personal accounts)
            if (profileData.error || mediaData.error) {
                console.log("[instagram/media] Full fields failed, falling back to basic fields...");

                const basicProfileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
                basicProfileUrl.searchParams.set("fields", "username,account_type,media_count");
                basicProfileUrl.searchParams.set("access_token", accessToken);

                const basicProfileRes = await fetch(basicProfileUrl.toString(), { next: { revalidate: 60 } });
                const basicProfileData = await basicProfileRes.json();

                const basicMediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
                basicMediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
                basicMediaUrl.searchParams.set("limit", "18");
                basicMediaUrl.searchParams.set("access_token", accessToken);

                const basicMediaRes = await fetch(basicMediaUrl.toString(), { next: { revalidate: 60 } });
                const basicMediaData = await basicMediaRes.json();

                if (!basicProfileData.error) profileData = basicProfileData;
                if (!basicMediaData.error) mediaData = basicMediaData;
            }

            const media: InstagramMedia[] = (mediaData.data || []).map((item: any) => ({
                id: item.id,
                caption: item.caption || null,
                media_type: item.media_type,
                media_url: item.media_url,
                thumbnail_url: item.thumbnail_url,
                permalink: item.permalink,
                timestamp: item.timestamp,
                like_count: item.like_count || 0,
                comments_count: item.comments_count || 0,
            }));

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
                    profileError: profileData.error,
                    mediaError: mediaData.error,
                },
            });
        } catch (err) {
            console.error("[instagram/media GET] error:", err);
            return internalError("Failed to fetch Instagram media");
        }
    });
}
