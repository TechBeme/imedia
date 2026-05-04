import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import {
    validateCustomSlug,
    isSlugAvailable,
    generateUniqueSlug,
} from "@/lib/links";
import { eq, desc } from "drizzle-orm";

const createLinkSchema = z.object({
    originalUrl: z.string().url("Invalid URL"),
    slug: z
        .string()
        .regex(/^[a-zA-Z0-9_-]+$/, "Invalid slug format")
        .min(3)
        .max(50)
        .optional(),
    password: z.string().min(4).max(100).optional(),
    expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = createLinkSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error(
                "VALIDATION_ERROR",
                messages.join(", "),
                400
            );
        }

        const { originalUrl, slug: customSlug, password, expiresAt } = parsed.data;

        // Get session if available (optional auth)
        const session = await getSession();

        let slug: string;
        let isCustom = false;

        if (customSlug) {
            const validation = validateCustomSlug(customSlug);
            if (!validation.valid) {
                return error("LINK_INVALID_SLUG", validation.error, 400);
            }
            const available = await isSlugAvailable(customSlug);
            if (!available) {
                return error("LINK_SLUG_TAKEN", "Slug already in use", 409);
            }
            slug = customSlug;
            isCustom = true;
        } else {
            try {
                slug = await generateUniqueSlug();
            } catch {
                return error("INTERNAL_ERROR", "Could not generate slug", 500);
            }
        }

        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : null;

        const [link] = await db
            .insert(shortLinks)
            .values({
                userId: session?.user?.id ?? null,
                originalUrl,
                slug,
                customSlug: isCustom,
                password: hashedPassword,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            })
            .returning();

        const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${link.slug}`;

        return success({
            id: link.id,
            slug: link.slug,
            originalUrl: link.originalUrl,
            shortUrl,
            customSlug: link.customSlug,
            expiresAt: link.expiresAt,
            createdAt: link.createdAt,
        });
    });
}

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const links = await db
            .select()
            .from(shortLinks)
            .where(eq(shortLinks.userId, session.user.id))
            .orderBy(desc(shortLinks.createdAt));

        return success({ links });
    });
}
