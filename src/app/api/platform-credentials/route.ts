import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { success, error, unauthorized } from "@/lib/api-response";
import {
    listPlatformCredentials,
    savePlatformCredential,
    hasPlatformCredential,
} from "@/lib/platform-credentials";

const credentialSchema = z.object({
    platform: z.enum([
        "instagram",
        "youtube",
        "tiktok",
        "x",
        "facebook",
        "threads",
    ]),
    appId: z.string().min(1, "App ID is required"),
    appSecret: z.string().min(1, "App Secret is required"),
    redirectUri: z.string().url().optional(),
});

export async function GET() {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    try {
        const credentials = await listPlatformCredentials(session.user.id);
        return success({ credentials });
    } catch (err) {
        console.error("[platform-credentials GET] error:", err);
        return error("INTERNAL_ERROR", "Failed to fetch credentials", 500);
    }
}

export async function POST(req: NextRequest) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return error("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const parsed = credentialSchema.safeParse(body);
    if (!parsed.success) {
        return error(
            "VALIDATION_ERROR",
            parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
            400
        );
    }

    const { platform, appId, appSecret, redirectUri } = parsed.data;

    try {
        // Check if credential already exists for this platform
        const exists = await hasPlatformCredential(session.user.id, platform);
        if (exists) {
            return error(
                "CREDENTIALS_EXISTS",
                `Credentials for ${platform} already exist. Update or delete the existing credential.`,
                409
            );
        }

        const credential = await savePlatformCredential({
            userId: session.user.id,
            platform,
            appId,
            appSecret,
            redirectUri,
        });

        return success(
            {
                credential: {
                    id: credential.id,
                    platform: credential.platform,
                    redirectUri: credential.redirectUri,
                    isActive: credential.isActive,
                    createdAt: credential.createdAt,
                    updatedAt: credential.updatedAt,
                },
            },
            201
        );
    } catch (err) {
        console.error("[platform-credentials POST] error:", err);
        return error("INTERNAL_ERROR", "Failed to save credential", 500);
    }
}
