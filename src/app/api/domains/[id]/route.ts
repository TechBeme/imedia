import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customDomains } from "@/db/schema";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
    isActive: z.boolean().optional(),
});

async function getOwnedDomain(domainId: string, userId: string) {
    const results = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, domainId), eq(customDomains.userId, userId)))
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
        const domain = await getOwnedDomain(id, session.user.id);
        if (!domain) {
            return notFound();
        }

        return success({ domain });
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
        const domain = await getOwnedDomain(id, session.user.id);
        if (!domain) {
            return notFound();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (parsed.data.isActive !== undefined) {
            updates.isActive = parsed.data.isActive;
        }

        const [updated] = await db
            .update(customDomains)
            .set(updates)
            .where(eq(customDomains.id, id))
            .returning();

        return success({ domain: updated });
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
        const domain = await getOwnedDomain(id, session.user.id);
        if (!domain) {
            return notFound();
        }

        await db.delete(customDomains).where(eq(customDomains.id, id));
        return success({ deleted: true });
    });
}
