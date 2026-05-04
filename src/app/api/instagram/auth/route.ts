import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !redirectUri) {
        return NextResponse.json(
            { error: "Instagram not configured" },
            { status: 500 }
        );
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

    return NextResponse.json({ url: authUrl.toString() });
}
