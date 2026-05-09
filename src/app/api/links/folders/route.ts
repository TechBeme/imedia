import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { linkFolders, shortLinks } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, count, sql } from "drizzle-orm";

const createFolderSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateFolderSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const folders = await db
            .select()
            .from(linkFolders)
            .where(eq(linkFolders.userId, session.user.id))
            .orderBy(linkFolders.name);

        // Count links per folder
        const folderIds = folders.map((f) => f.id);
        const linkCounts: Record<string, number> = {};

        if (folderIds.length > 0) {
            const counts = await db
                .select({
                    folderId: shortLinks.folderId,
                    count: count(),
                })
                .from(shortLinks)
                .where(sql`${shortLinks.folderId} IN ${folderIds}`)
                .groupBy(shortLinks.folderId);

            for (const c of counts) {
                if (c.folderId) linkCounts[c.folderId] = c.count;
            }
        }

        return success({
            folders: folders.map((f) => ({
                ...f,
                linkCount: linkCounts[f.id] || 0,
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

        const parsed = createFolderSchema.safeParse(body);
        if (!parsed.success) {
            return error("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
        }

        const [folder] = await db
            .insert(linkFolders)
            .values({
                userId: session.user.id,
                name: parsed.data.name,
                color: parsed.data.color || "#3b82f6",
            })
            .returning();

        return success({ folder });
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
            return error("VALIDATION_ERROR", "Folder ID required", 400);
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = updateFolderSchema.safeParse(body);
        if (!parsed.success) {
            return error("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
        }

        const updateData: Record<string, unknown> = {};
        if (parsed.data.name) updateData.name = parsed.data.name;
        if (parsed.data.color) updateData.color = parsed.data.color;

        const [folder] = await db
            .update(linkFolders)
            .set(updateData)
            .where(eq(linkFolders.id, id))
            .returning();

        if (!folder) {
            return error("NOT_FOUND", "Folder not found", 404);
        }

        return success({ folder });
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
            return error("VALIDATION_ERROR", "Folder ID required", 400);
        }

        // Unlink links from this folder first
        await db
            .update(shortLinks)
            .set({ folderId: null })
            .where(eq(shortLinks.folderId, id));

        await db
            .delete(linkFolders)
            .where(eq(linkFolders.id, id));

        return success({ deleted: true });
    });
}
