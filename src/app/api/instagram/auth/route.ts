import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { authRateLimit } from "@/lib/rate-limit";
import { getPlatformCredentials } from "@/lib/platform-credentials";

export async function GET(req: NextRequest) {
    return withRateLimit(req, authRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        // Try per-user credentials first
        const userCreds = await getPlatformCredentials(session.user.id, "instagram");
        const appId = userCreds?.appId || process.env.INSTAGRAM_APP_ID;
        const redirectUri = userCreds?.redirectUri || process.env.INSTAGRAM_REDIRECT_URI;

        if (!appId || !redirectUri) {
            return internalError("Instagram not configured");
        }

        const state = Buffer.from(
            JSON.stringify({ userId: session.user.id, nonce: crypto.randomUUID() })
        ).toString("base64");

        const scope = "instagram_basic,instagram_content_publish,pages_read_engagement";

        const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
        authUrl.searchParams.set("client_id", appId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("scope", scope);
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("response_type", "code");

        return success({ url: authUrl.toString() });
    });
}
