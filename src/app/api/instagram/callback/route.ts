import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { authRateLimit } from "@/lib/rate-limit";
import { encrypt } from "@/lib/encryption";

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

            // 3. Get Instagram account info
            const igInfoUrl = new URL(`https://graph.instagram.com/${igUserId}`);
            igInfoUrl.searchParams.set("fields", "username,account_type,media_count");
            igInfoUrl.searchParams.set("access_token", accessToken);

            const igInfoRes = await fetch(igInfoUrl.toString());
            const igInfo = await igInfoRes.json();

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
                        providerAccountId: String(igUserId),
                        username: igInfo.username,
                        displayName: igInfo.username,
                        accessToken: accessToken,
                        expiresAt: new Date(Date.now() + expiresIn * 1000),
                        isActive: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(socialAccounts.id, existing[0].id));
            } else {
                await db.insert(socialAccounts).values({
                    userId: session.user.id,
                    platform: "instagram",
                    providerAccountId: String(igUserId),
                    username: igInfo.username,
                    displayName: igInfo.username,
                    accessToken: accessToken,
                    expiresAt: new Date(Date.now() + expiresIn * 1000),
                    isActive: true,
                });
            }

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
