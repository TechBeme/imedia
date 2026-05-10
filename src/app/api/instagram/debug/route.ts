import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { success, unauthorized } from "@/lib/api-response";
import { decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

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
        return success({ hasAccount: false });
    }

    let accessToken: string | null = null;
    let tokenSource = "none";
    if (account.accessToken) {
        try {
            accessToken = decrypt(account.accessToken);
            tokenSource = "decrypted";
        } catch {
            accessToken = account.accessToken;
            tokenSource = "raw";
        }
    }

    if (!accessToken) {
        return success({ hasAccount: true, hasToken: false });
    }

    const providerAccountId = account.providerAccountId;

    // Test: Instagram Graph API v22.0
    const igProfileUrl = `https://graph.instagram.com/v22.0/${providerAccountId}?fields=account_type,username,media_count&access_token=${accessToken}`;
    const igMediaUrl = `https://graph.instagram.com/v22.0/${providerAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=3&access_token=${accessToken}`;

    const [igProfileRes, igMediaRes] = await Promise.all([
        fetch(igProfileUrl),
        fetch(igMediaUrl),
    ]);

    const igProfile = await igProfileRes.json();
    const igMedia = await igMediaRes.json();

    return success({
        account: {
            id: account.id,
            providerAccountId: account.providerAccountId,
            username: account.username,
            displayName: account.displayName,
            hasAccessToken: !!account.accessToken,
            tokenSource,
            tokenPrefix: accessToken ? accessToken.substring(0, 20) + "..." : null,
        },
        instagramGraph: {
            profile: igProfile,
            media: igMedia,
        },
    });
}
