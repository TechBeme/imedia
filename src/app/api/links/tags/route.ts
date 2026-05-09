import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { linkTags, shortLinkTags } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, count, sql } from "drizzle-orm";

const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateTagSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const tags = await db
            .select()
            .from(linkTags)
            .where(eq(linkTags.userId, session.user.id))
            .orderBy(linkTags.name);

        // Count links per tag
        const tagIds = tags.map((t) => t.id);
        const linkCounts: Record<string, number> = {};

        if (tagIds.length > 0) {
            const counts = await db
                .select({
                    tagId: shortLinkTags.tagId,
                    count: count(),
                })
                .from(shortLinkTags)
                .where(sql`${shortLinkTags.tagId} IN ${tagIds}`)
                .groupBy(shortLinkTags.tagId);

            for (const c of counts) {
                linkCounts[c.tagId] = c.count;
            }
        }

        return success({
            tags: tags.map((t) => ({
                ...t,
                linkCount: linkCounts[t.id] || 0,
            })),
        });
    });
}

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = createTagSchema.safeParse(body);
        if (!parsed.success) {
            return error("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
        }

        const [tag] = await db
            .insert(linkTags)
            .values({
                userId: session.user.id,
                name: parsed.data.name,
                color: parsed.data.color || "#8b5cf6",
            })
            .returning();

        return success({ tag });
    });
}

export async function PUT(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return error("VALIDATION_ERROR", "Tag ID required", 400);
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = updateTagSchema.safeParse(body);
        if (!parsed.success) {
            return error("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
        }

        const updateData: Record<string, unknown> = {};
        if (parsed.data.name) updateData.name = parsed.data.name;
        if (parsed.data.color) updateData.color = parsed.data.color;

        const [tag] = await db
            .update(linkTags)
            .set(updateData)
            .where(eq(linkTags.id, id))
            .returning();

        if (!tag) {
            return error("NOT_FOUND", "Tag not found", 404);
        }

        return success({ tag });
    });
}

export async function DELETE(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return error("VALIDATION_ERROR", "Tag ID required", 400);
        }

        // Unlink tag from all links first
        await db
            .delete(shortLinkTags)
            .where(eq(shortLinkTags.tagId, id));

        await db
            .delete(linkTags)
            .where(eq(linkTags.id, id));

        return success({ deleted: true });
    });
}
