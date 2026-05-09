import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { shortLinks, linkDeviceRules, linkTags, shortLinkTags, linkFolders } from "@/db/schema";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

const deviceRuleSchema = z.object({
    os: z.enum(["android", "ios", "windows", "macos", "linux", "other"]),
    url: z.string().url("Invalid device URL"),
    priority: z.number().int().min(0).max(100).optional(),
});

const updateLinkSchema = z.object({
    originalUrl: z.string().url("Invalid URL").optional(),
    title: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().nullable(),
    tagIds: z.array(z.string().uuid()).max(20).optional().nullable(),
    isActive: z.boolean().optional(),
    password: z.string().min(4).max(100).optional().nullable(),
    startsAt: z.string().datetime().optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
    maxClicks: z.number().int().min(1).optional().nullable(),
    deviceRules: z.array(deviceRuleSchema).max(10).optional().nullable(),
    folderId: z.string().uuid().optional().nullable(),
    ogTitle: z.string().max(200).optional().nullable(),
    ogDescription: z.string().max(500).optional().nullable(),
    ogImageUrl: z.string().url("Invalid image URL").optional().nullable(),
    expiredRedirectUrl: z.string().url("Invalid redirect URL").optional().nullable(),
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

        const rules = await db
            .select()
            .from(linkDeviceRules)
            .where(eq(linkDeviceRules.linkId, id));

        const tags = await db
            .select({ id: linkTags.id, name: linkTags.name, color: linkTags.color })
            .from(shortLinkTags)
            .innerJoin(linkTags, eq(shortLinkTags.tagId, linkTags.id))
            .where(eq(shortLinkTags.linkId, id));

        const folder = link.folderId
            ? await db
                .select()
                .from(linkFolders)
                .where(eq(linkFolders.id, link.folderId))
                .limit(1)
                .then((rows) => rows[0] || null)
            : null;

        return success({ link: { ...link, deviceRules: rules, tags, folder } });
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
        if (parsed.data.title !== undefined) {
            updates.title = parsed.data.title;
        }
        if (parsed.data.description !== undefined) {
            updates.description = parsed.data.description;
        }
        if (parsed.data.tags !== undefined) {
            updates.tags = parsed.data.tags;
        }
        if (parsed.data.isActive !== undefined) {
            updates.isActive = parsed.data.isActive;
        }
        if (parsed.data.password !== undefined) {
            updates.password = parsed.data.password
                ? await bcrypt.hash(parsed.data.password, 10)
                : null;
        }
        if (parsed.data.startsAt !== undefined) {
            updates.startsAt = parsed.data.startsAt
                ? new Date(parsed.data.startsAt)
                : null;
        }
        if (parsed.data.expiresAt !== undefined) {
            updates.expiresAt = parsed.data.expiresAt
                ? new Date(parsed.data.expiresAt)
                : null;
        }
        if (parsed.data.maxClicks !== undefined) {
            updates.maxClicks = parsed.data.maxClicks;
        }
        if (parsed.data.folderId !== undefined) {
            updates.folderId = parsed.data.folderId;
        }
        if (parsed.data.ogTitle !== undefined) {
            updates.ogTitle = parsed.data.ogTitle;
        }
        if (parsed.data.ogDescription !== undefined) {
            updates.ogDescription = parsed.data.ogDescription;
        }
        if (parsed.data.ogImageUrl !== undefined) {
            updates.ogImageUrl = parsed.data.ogImageUrl;
        }
        if (parsed.data.expiredRedirectUrl !== undefined) {
            updates.expiredRedirectUrl = parsed.data.expiredRedirectUrl;
        }
        updates.updatedAt = new Date();

        const [updated] = await db
            .update(shortLinks)
            .set(updates)
            .where(eq(shortLinks.id, id))
            .returning();

        // Update device rules if provided
        if (parsed.data.deviceRules !== undefined && parsed.data.deviceRules !== null) {
            await db.delete(linkDeviceRules).where(eq(linkDeviceRules.linkId, id));
            if (parsed.data.deviceRules.length > 0) {
                await db.insert(linkDeviceRules).values(
                    parsed.data.deviceRules.map((rule) => ({
                        linkId: id,
                        os: rule.os,
                        url: rule.url,
                        priority: rule.priority ?? 0,
                    }))
                );
            }
        }

        // Update tag associations if provided
        if (parsed.data.tagIds !== undefined && parsed.data.tagIds !== null) {
            await db.delete(shortLinkTags).where(eq(shortLinkTags.linkId, id));
            if (parsed.data.tagIds.length > 0) {
                await db.insert(shortLinkTags).values(
                    parsed.data.tagIds.map((tagId) => ({
                        linkId: id,
                        tagId,
                    }))
                );
            }
        }

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
