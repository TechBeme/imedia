import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { authRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    return withRateLimit(req, authRateLimit, async () => {
        try {
            const requestHeaders = await headers();
            const session = await auth.api.getSession({ headers: requestHeaders });

            if (!session) {
                return unauthorized();
            }

            const appId = process.env.INSTAGRAM_APP_ID;
            const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

            if (!appId || !redirectUri) {
                console.error("[Instagram Auth] Missing env vars:", { appId: !!appId, redirectUri: !!redirectUri });
                return internalError("Instagram not configured");
            }

            const state = Buffer.from(
                JSON.stringify({ userId: session.user.id, nonce: crypto.randomUUID() })
            ).toString("base64");

            const scope = "instagram_business_basic,instagram_business_content_publish";

            const authUrl = new URL("https://www.instagram.com/oauth/authorize");
            authUrl.searchParams.set("client_id", appId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("scope", scope);
            authUrl.searchParams.set("state", state);
            authUrl.searchParams.set("response_type", "code");

            return success({ url: authUrl.toString() });
        } catch (error) {
            console.error("[Instagram Auth] Error:", error);
            return internalError("Failed to generate auth URL");
        }
    });
}
