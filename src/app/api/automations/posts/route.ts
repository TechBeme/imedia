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

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get("accountId");

        if (!accountId) {
            return success({ media: [] });
        }

        try {
            const [account] = await db
                .select()
                .from(socialAccounts)
                .where(
                    and(
                        eq(socialAccounts.id, accountId),
                        eq(socialAccounts.userId, session.user.id),
                        eq(socialAccounts.isActive, true)
                    )
                )
                .limit(1);

            if (!account) {
                return success({ media: [] });
            }

            const accessToken = account.accessToken ? decrypt(account.accessToken) : null;
            if (!accessToken) {
                return success({ media: [] });
            }
            const igUserId = account.providerAccountId;

            const mediaRes = await fetch(
                `https://graph.instagram.com/v22.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${accessToken}`
            );

            if (!mediaRes.ok) {
                return success({ media: [] });
            }

            const mediaData = await mediaRes.json();
            const media = (mediaData.data || []).map((item: Record<string, unknown>) => ({
                id: String(item.id),
                caption: item.caption ? String(item.caption) : null,
                media_type: String(item.media_type) as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM",
                media_url: String(item.media_url || ""),
                thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : undefined,
                permalink: String(item.permalink || ""),
                timestamp: String(item.timestamp || ""),
            }));

            return success({ media });
        } catch (err) {
            console.error("[automations/posts] error:", err);
            return internalError();
        }
    });
}
