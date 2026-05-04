import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

const updateLinkSchema = z.object({
    originalUrl: z.string().url("Invalid URL").optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(4).max(100).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
});

async function getOwnedLink(linkId: string, userId: string) {
    const results = await db
        .select()
        .from(shortLinks)
        .where(and(eq(shortLinks.id, linkId), eq(shortLinks.userId, userId)))
        .limit(1);
    return results[0] || null;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { id } = await params;
        const link = await getOwnedLink(id, session.user.id);
        if (!link) {
            return notFound();
        }

        return success({ link });
    });
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { id } = await params;
        const link = await getOwnedLink(id, session.user.id);
        if (!link) {
            return notFound();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = updateLinkSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        const updates: Record<string, unknown> = {};
        if (parsed.data.originalUrl !== undefined) {
            updates.originalUrl = parsed.data.originalUrl;
        }
        if (parsed.data.isActive !== undefined) {
            updates.isActive = parsed.data.isActive;
        }
        if (parsed.data.password !== undefined) {
            updates.password = parsed.data.password
                ? await bcrypt.hash(parsed.data.password, 10)
                : null;
        }
        if (parsed.data.expiresAt !== undefined) {
            updates.expiresAt = parsed.data.expiresAt
                ? new Date(parsed.data.expiresAt)
                : null;
        }
        updates.updatedAt = new Date();

        const [updated] = await db
            .update(shortLinks)
            .set(updates)
            .where(eq(shortLinks.id, id))
            .returning();

        return success({ link: updated });
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { id } = await params;
        const link = await getOwnedLink(id, session.user.id);
        if (!link) {
            return notFound();
        }

        await db.delete(shortLinks).where(eq(shortLinks.id, id));
        return success({ deleted: true });
    });
}
