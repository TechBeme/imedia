import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { authRateLimit } from "@/lib/rate-limit";
import { encrypt } from "@/lib/encryption";

/**
 * Subscribe an Instagram account to webhook notifications.
 * This is called automatically after OAuth to ensure webhooks are active
 * without requiring manual activation in Meta dashboard.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/webhooks/
 * Endpoint: POST /{ig-user-id}/subscribed_apps?subscribed_fields=...
 */
async function subscribeInstagramWebhooks(
    igUserId: string,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    const WEBHOOK_FIELDS = ["comments", "mentions", "messages", "message_reactions", "messaging_postbacks"];

    try {
        const url = new URL(`https://graph.instagram.com/v25.0/${igUserId}/subscribed_apps`);
        url.searchParams.set("subscribed_fields", WEBHOOK_FIELDS.join(","));
        url.searchParams.set("access_token", accessToken);

        console.log("[instagram/callback] Subscribing webhooks for user:", igUserId);
        console.log("[instagram/callback] Webhook fields:", WEBHOOK_FIELDS.join(","));

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (data.error) {
            console.error("[instagram/callback] Webhook subscription failed:", {
                code: data.error.code,
                message: data.error.message,
                type: data.error.type,
            });
            return {
                success: false,
                error: `${data.error.type}: ${data.error.message}`,
            };
        }

        if (data.success === true) {
            console.log("[instagram/callback] Webhook subscription successful:", {
                igUserId,
                fields: WEBHOOK_FIELDS,
            });
            return { success: true };
        }

        console.warn("[instagram/callback] Webhook subscription unexpected response:", data);
        return { success: false, error: "Unexpected response from Meta API" };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[instagram/callback] Webhook subscription exception:", message);
        return { success: false, error: message };
    }
}

type InstagramProfileResponse = {
    id?: string;
    user_id?: string;
    username?: string;
    name?: string;
    account_type?: string;
    profile_picture_url?: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    website?: string;
};

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

            // 1. Exchange code for short-lived access token
            const tokenForm = new URLSearchParams();
            tokenForm.set("client_id", appId);
            tokenForm.set("client_secret", appSecret);
            tokenForm.set("grant_type", "authorization_code");
            tokenForm.set("redirect_uri", redirectUri);
            tokenForm.set("code", code);

            const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: tokenForm.toString(),
            });
            const tokenData = await tokenResponse.json();

            if (!tokenData.access_token) {
                throw new Error(tokenData.error_message || "Failed to get access token");
            }

            const shortLivedToken = tokenData.access_token;
            const igUserId = tokenData.user_id;

            // 2. Exchange for long-lived access token
            const longLivedUrl = new URL("https://graph.instagram.com/access_token");
            longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
            longLivedUrl.searchParams.set("client_secret", appSecret);
            longLivedUrl.searchParams.set("access_token", shortLivedToken);

            const longLivedRes = await fetch(longLivedUrl.toString());
            const longLivedData = await longLivedRes.json();

            const accessToken = longLivedData.access_token || shortLivedToken;
            const expiresIn = longLivedData.expires_in || 5184000; // ~60 days default

            // 3. Get Instagram user info using Instagram Graph API (Business/Creator accounts)
            // The token from Instagram Login works on graph.instagram.com for Business accounts
            let finalUserId = igUserId;
            let igInfo: InstagramProfileResponse = {};

            console.log("[instagram/callback] Fetching user info from Instagram Graph API...");
            const igMeUrl = new URL("https://graph.instagram.com/me");
            igMeUrl.searchParams.set(
                "fields",
                "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count,website"
            );
            igMeUrl.searchParams.set("access_token", accessToken);

            const igMeRes = await fetch(igMeUrl.toString());
            const igMe = await igMeRes.json();
            console.log("[instagram/callback] igMe:", JSON.stringify(igMe));

            if (igMe.error) {
                console.log("[instagram/callback] Graph API failed, falling back to Basic Display fields...");
                // Fallback: try with minimal fields (personal accounts)
                const basicUrl = new URL("https://graph.instagram.com/me");
                basicUrl.searchParams.set("fields", "user_id,username,account_type,media_count");
                basicUrl.searchParams.set("access_token", accessToken);

                const basicRes = await fetch(basicUrl.toString());
                const basicData = await basicRes.json();
                console.log("[instagram/callback] basicData:", JSON.stringify(basicData));

                const meData = basicData.data?.[0] || basicData;
                finalUserId = meData.user_id || meData.id || igUserId;
                igInfo = meData;
            } else {
                const meData = igMe.data?.[0] || igMe;
                finalUserId = meData.user_id || meData.id || igUserId;
                igInfo = meData;
            }

            // 4. Save to database
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
                        providerAccountId: String(finalUserId),
                        username: igInfo.username,
                        displayName: igInfo.name || igInfo.username,
                        profilePicture: igInfo.profile_picture_url || null,
                        accessToken: encrypt(accessToken),
                        expiresAt: new Date(Date.now() + expiresIn * 1000),
                        isActive: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(socialAccounts.id, existing[0].id));
            } else {
                await db.insert(socialAccounts).values({
                    userId: session.user.id,
                    platform: "instagram",
                    providerAccountId: String(finalUserId),
                    username: igInfo.username,
                    displayName: igInfo.name || igInfo.username,
                    profilePicture: igInfo.profile_picture_url || null,
                    accessToken: encrypt(accessToken),
                    expiresAt: new Date(Date.now() + expiresIn * 1000),
                    isActive: true,
                });
            }

            // 5. Subscribe account to webhooks (fire-and-forget, non-blocking)
            // This runs independently so OAuth success is not affected by webhook subscription
            subscribeInstagramWebhooks(String(finalUserId), accessToken)
                .then((result) => {
                    if (!result.success) {
                        console.warn("[instagram/callback] Webhook subscription deferred — will need manual activation:", result.error);
                    }
                })
                .catch((err) => {
                    console.error("[instagram/callback] Webhook subscription unexpected error:", err);
                });

            // Return HTML that closes popup and notifies parent window
            return new Response(
                `<!DOCTYPE html>
<html>
<head><title>Conectando Instagram...</title></head>
<body>
  <p style="font-family:sans-serif;text-align:center;margin-top:40px;">Conectado com sucesso! Fechando...</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: "INSTAGRAM_CONNECTED", success: true }, "*");
    }
    setTimeout(function() { window.close(); }, 500);
  </script>
</body>
</html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return new Response(
                `<!DOCTYPE html>
<html>
<head><title>Erro na conexão</title></head>
<body>
  <p style="font-family:sans-serif;text-align:center;margin-top:40px;color:red;">Erro: ${message.replace(/</g, "&lt;")}</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: "INSTAGRAM_CONNECTED", success: false, error: "${message.replace(/"/g, "\\\"").replace(/</g, "&lt;")}" }, "*");
    }
    setTimeout(function() { window.close(); }, 3000);
  </script>
</body>
</html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
            );
        }
    });
}
