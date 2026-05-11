import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts, posts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { success, unauthorized, error } from "@/lib/api-response";
import { decrypt } from "@/lib/encryption";
import { publishImage, publishCarousel, publishReel, publishStory } from "@/lib/instagram";
import { z } from "zod";

const publishSchema = z.object({
    content: z.string().min(1).max(2200),
    mediaType: z.enum(["image", "carousel", "reel", "story"]),
    mediaUrls: z.array(z.string().url()).min(1),
});

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        try {
            const body = await req.json();
            const parsed = publishSchema.safeParse(body);

            if (!parsed.success) {
                return error("VALIDATION_ERROR", parsed.error.message);
            }

            const { content, mediaType, mediaUrls } = parsed.data;

            // Get Instagram account
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
                return error("PLATFORM_NOT_CONNECTED", "Instagram account not connected");
            }

            let accessToken: string;
            try {
                accessToken = decrypt(account.accessToken!);
            } catch {
                return error("CREDENTIALS_INVALID", "Failed to decrypt access token");
            }

            const igUserId = account.providerAccountId;

            // Publish based on media type
            let result: { id: string };

            switch (mediaType) {
                case "image":
                    result = await publishImage({
                        accessToken,
                        igUserId,
                        caption: content,
                        imageUrl: mediaUrls[0],
                    });
                    break;
                case "carousel":
                    result = await publishCarousel({
                        accessToken,
                        igUserId,
                        caption: content,
                        imageUrls: mediaUrls,
                    });
                    break;
                case "reel":
                    result = await publishReel({
                        accessToken,
                        igUserId,
                        caption: content,
                        videoUrl: mediaUrls[0],
                    });
                    break;
                case "story":
                    result = await publishStory({
                        accessToken,
                        igUserId,
                        imageUrl: mediaUrls[0],
                    });
                    break;
                default:
                    return error("VALIDATION_ERROR", "Invalid media type");
            }

            // Save post to database
            const [post] = await db
                .insert(posts)
                .values({
                    userId: session.user.id,
                    content,
                    mediaUrls,
                    platforms: ["instagram"],
                    status: "published",
                    publishedAt: new Date(),
                    externalIds: { instagram: result.id },
                })
                .returning();

            return success({
                postId: post.id,
                instagramPostId: result.id,
                mediaType,
            });
        } catch (err) {
            console.error("[instagram/publish] error:", err);
            const message = err instanceof Error ? err.message : "Publish failed";
            return error("PLATFORM_API_ERROR", message);
        }
    });
}
