import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { authRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    return withRateLimit(req, authRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return NextResponse.redirect(new URL("/pt-BR/login", req.url));
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            return NextResponse.redirect(
                new URL(`/pt-BR/accounts?error=${encodeURIComponent(errorParam)}`, req.url)
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL("/pt-BR/accounts?error=missing_params", req.url)
            );
        }

        try {
            const appId = process.env.INSTAGRAM_APP_ID!;
            const appSecret = process.env.INSTAGRAM_APP_SECRET!;
            const redirectUri = process.env.INSTAGRAM_REDIRECT_URI!;

            // 1. Exchange code for access token
            const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
            tokenUrl.searchParams.set("client_id", appId);
            tokenUrl.searchParams.set("client_secret", appSecret);
            tokenUrl.searchParams.set("redirect_uri", redirectUri);
            tokenUrl.searchParams.set("code", code);

            const tokenResponse = await fetch(tokenUrl.toString());
            const tokenData = await tokenResponse.json();

            if (!tokenData.access_token) {
                throw new Error(tokenData.error?.message || "Failed to get access token");
            }

            const accessToken = tokenData.access_token;

            // 2. Get user's Facebook pages
            const pagesRes = await fetch(
                `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
            );
            const pagesData = await pagesRes.json();

            if (!pagesData.data || pagesData.data.length === 0) {
                throw new Error("No Facebook pages found");
            }

            const page = pagesData.data[0];
            const pageAccessToken = page.access_token;
            const pageId = page.id;

            // 3. Get Instagram Business Account connected to the page
            const igRes = await fetch(
                `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
            );
            const igData = await igRes.json();

            if (!igData.instagram_business_account) {
                throw new Error("No Instagram Business Account connected to this page");
            }

            const igBusinessId = igData.instagram_business_account.id;

            // 4. Get Instagram account info
            const igInfoRes = await fetch(
                `https://graph.facebook.com/v18.0/${igBusinessId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
            );
            const igInfo = await igInfoRes.json();

            // 5. Save to database
            const existing = await db
                .select()
                .from(socialAccounts)
                .where(
                    and(
                        eq(socialAccounts.userId, session.user.id),
                        eq(socialAccounts.platform, "instagram")
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                await db
                    .update(socialAccounts)
                    .set({
                        providerAccountId: igBusinessId,
                        username: igInfo.username,
                        displayName: igInfo.username,
                        profilePicture: igInfo.profile_picture_url,
                        accessToken: pageAccessToken,
                        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
                        isActive: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(socialAccounts.id, existing[0].id));
            } else {
                await db.insert(socialAccounts).values({
                    userId: session.user.id,
                    platform: "instagram",
                    providerAccountId: igBusinessId,
                    username: igInfo.username,
                    displayName: igInfo.username,
                    profilePicture: igInfo.profile_picture_url,
                    accessToken: pageAccessToken,
                    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    isActive: true,
                });
            }

            return NextResponse.redirect(
                new URL("/pt-BR/accounts?success=instagram_connected", req.url)
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return NextResponse.redirect(
                new URL(`/pt-BR/accounts?error=${encodeURIComponent(message)}`, req.url)
            );
        }
    });
}
