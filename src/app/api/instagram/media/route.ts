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

            // Try Basic Display API first
            const profileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
            profileUrl.searchParams.set("fields", "username,account_type,media_count");
            profileUrl.searchParams.set("access_token", accessToken);

            const profileRes = await fetch(profileUrl.toString(), { next: { revalidate: 60 } });
            const profileData = await profileRes.json();
            console.log("[instagram/media] profile response:", JSON.stringify(profileData));

            const mediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
            mediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
            mediaUrl.searchParams.set("limit", "18");
            mediaUrl.searchParams.set("access_token", accessToken);

            const mediaRes = await fetch(mediaUrl.toString(), { next: { revalidate: 60 } });
            const mediaData = await mediaRes.json();
            console.log("[instagram/media] media response:", JSON.stringify({ count: mediaData.data?.length, error: mediaData.error }));

            // If Basic Display API fails, try Facebook Graph API
            let finalProfileData = profileData;
            let finalMediaData = mediaData;

            if (profileData.error || mediaData.error) {
                console.log("[instagram/media] Basic Display API failed, trying Facebook Graph API...");

                const graphProfileUrl = new URL(`https://graph.facebook.com/v22.0/${providerAccountId}`);
                graphProfileUrl.searchParams.set("fields", "username,name,profile_picture_url,biography,followers_count,follows_count,media_count,website");
                graphProfileUrl.searchParams.set("access_token", accessToken);

                const graphProfileRes = await fetch(graphProfileUrl.toString(), { next: { revalidate: 60 } });
                const graphProfileData = await graphProfileRes.json();
                console.log("[instagram/media] Graph API profile:", JSON.stringify(graphProfileData));

                const graphMediaUrl = new URL(`https://graph.facebook.com/v22.0/${providerAccountId}/media`);
                graphMediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count");
                graphMediaUrl.searchParams.set("limit", "18");
                graphMediaUrl.searchParams.set("access_token", accessToken);

                const graphMediaRes = await fetch(graphMediaUrl.toString(), { next: { revalidate: 60 } });
                const graphMediaData = await graphMediaRes.json();
                console.log("[instagram/media] Graph API media:", JSON.stringify({ count: graphMediaData.data?.length, error: graphMediaData.error }));

                if (!graphProfileData.error) finalProfileData = graphProfileData;
                if (!graphMediaData.error) finalMediaData = graphMediaData;
            }

            const media: InstagramMedia[] = (finalMediaData.data || []).map((item: any) => ({
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
                    username: finalProfileData.username || account.username,
                    name: finalProfileData.name || account.displayName || finalProfileData.username || null,
                    mediaCount: finalProfileData.media_count || 0,
                    followersCount: finalProfileData.followers_count || 0,
                    followsCount: finalProfileData.follows_count || 0,
                    biography: finalProfileData.biography || "",
                    website: finalProfileData.website || "",
                    profilePictureUrl: finalProfileData.profile_picture_url || account.profilePicture || null,
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
