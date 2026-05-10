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
            if (account.accessToken) {
                try {
                    accessToken = decrypt(account.accessToken);
                } catch {
                    // Token might be stored unencrypted (legacy) - try using directly
                    accessToken = account.accessToken;
                }
            }
            if (!accessToken) {
                return success({ media: [], profile: null });
            }

            const providerAccountId = account.providerAccountId;

            // Fetch profile info (Basic Display API fields only)
            const profileUrl = new URL(`https://graph.instagram.com/${providerAccountId}`);
            profileUrl.searchParams.set("fields", "username,account_type,media_count");
            profileUrl.searchParams.set("access_token", accessToken);

            const profileRes = await fetch(profileUrl.toString(), { next: { revalidate: 60 } });
            const profileData = await profileRes.json();
            console.log("[instagram/media] profile response:", JSON.stringify(profileData));

            // Fetch media (Basic Display API fields only - no like_count/comments_count)
            const mediaUrl = new URL(`https://graph.instagram.com/${providerAccountId}/media`);
            mediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
            mediaUrl.searchParams.set("limit", "18");
            mediaUrl.searchParams.set("access_token", accessToken);

            const mediaRes = await fetch(mediaUrl.toString(), { next: { revalidate: 60 } });
            const mediaData = await mediaRes.json();
            console.log("[instagram/media] media response:", JSON.stringify({ count: mediaData.data?.length, error: mediaData.error }));

            const media: InstagramMedia[] = (mediaData.data || []).map((item: any) => ({
                id: item.id,
                caption: item.caption || null,
                media_type: item.media_type,
                media_url: item.media_url,
                thumbnail_url: item.thumbnail_url,
                permalink: item.permalink,
                timestamp: item.timestamp,
                like_count: 0,
                comments_count: 0,
            }));

            return success({
                media,
                profile: {
                    username: profileData.username || account.username,
                    name: account.displayName || profileData.username || null,
                    mediaCount: profileData.media_count || 0,
                    followersCount: 0,
                    followsCount: 0,
                    biography: "",
                    website: "",
                    profilePictureUrl: account.profilePicture || null,
                },
            });
        } catch (err) {
            console.error("[instagram/media GET] error:", err);
            return internalError("Failed to fetch Instagram media");
        }
    });
}
