import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import {
    updatePlatformCredential,
    deletePlatformCredential,
} from "@/lib/platform-credentials";

const updateSchema = z.object({
    appId: z.string().min(1).optional(),
    appSecret: z.string().min(1).optional(),
    redirectUri: z.string().url().optional().or(z.literal("")),
}).refine(
    (data) => data.appId || data.appSecret || data.redirectUri !== undefined,
    { message: "At least one field must be provided" }
);

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    const { id } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return error("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return error(
            "VALIDATION_ERROR",
            parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
            400
        );
    }

    try {
        const updates: {
            appId?: string;
            appSecret?: string;
            redirectUri?: string;
        } = {};

        if (parsed.data.appId) updates.appId = parsed.data.appId;
        if (parsed.data.appSecret) updates.appSecret = parsed.data.appSecret;
        if (parsed.data.redirectUri !== undefined) {
            updates.redirectUri = parsed.data.redirectUri || undefined;
        }

        const credential = await updatePlatformCredential(
            id,
            session.user.id,
            updates
        );

        if (!credential) {
            return notFound("Credential not found");
        }

        return success({
            credential: {
                id: credential.id,
                platform: credential.platform,
                redirectUri: credential.redirectUri,
                isActive: credential.isActive,
                createdAt: credential.createdAt,
                updatedAt: credential.updatedAt,
            },
        });
    } catch (err) {
        console.error("[platform-credentials PUT] error:", err);
        return error("INTERNAL_ERROR", "Failed to update credential", 500);
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    const { id } = await params;

    try {
        const credential = await deletePlatformCredential(id, session.user.id);

        if (!credential) {
            return notFound("Credential not found");
        }

        return success({ deleted: true });
    } catch (err) {
        console.error("[platform-credentials DELETE] error:", err);
        return error("INTERNAL_ERROR", "Failed to delete credential", 500);
    }
}
