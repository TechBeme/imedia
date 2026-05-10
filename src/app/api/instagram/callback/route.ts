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

            // 1. Exchange code for access token via Instagram Graph API
            const tokenUrl = new URL("https://graph.instagram.com/oauth/access_token");
            tokenUrl.searchParams.set("client_id", appId);
            tokenUrl.searchParams.set("client_secret", appSecret);
            tokenUrl.searchParams.set("grant_type", "authorization_code");
            tokenUrl.searchParams.set("redirect_uri", redirectUri);
            tokenUrl.searchParams.set("code", code);

            const tokenResponse = await fetch(tokenUrl.toString(), { method: "POST" });
            const tokenData = await tokenResponse.json();
            console.log("[instagram/callback] step 1 token response:", JSON.stringify(tokenData));

            if (!tokenData.access_token) {
                throw new Error(tokenData.error_message || tokenData.error?.message || "Failed to get access token");
            }

            const accessToken = tokenData.access_token;
            const userId = tokenData.user_id;
            const expiresIn = 5184000; // Instagram tokens are long-lived, default 60 days

            // 2. Get Instagram account details
            const igInfoUrl = new URL(`https://graph.instagram.com/v22.0/${userId}`);
            igInfoUrl.searchParams.set("fields", "account_type,username,media_count");
            igInfoUrl.searchParams.set("access_token", accessToken);

            const igInfoRes = await fetch(igInfoUrl.toString());
            const igInfo = await igInfoRes.json();
            console.log("[instagram/callback] step 2 profile info:", JSON.stringify(igInfo));

            if (igInfo.error) {
                throw new Error(igInfo.error.message || "Failed to fetch Instagram profile");
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
                        providerAccountId: String(userId),
                        username: igInfo.username,
                        displayName: igInfo.username,
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
                    providerAccountId: String(userId),
                    username: igInfo.username,
                    displayName: igInfo.username,
                    accessToken: encrypt(accessToken),
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
