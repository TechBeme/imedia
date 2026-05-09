import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { shortLinks, customDomains, linkDeviceRules } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import {
    validateCustomSlug,
    isSlugAvailable,
    generateUniqueSlug,
} from "@/lib/links";
import { eq, desc, and } from "drizzle-orm";

const deviceRuleSchema = z.object({
    os: z.enum(["android", "ios", "windows", "macos", "linux", "other"]),
    url: z.string().url("Invalid device URL"),
    priority: z.number().int().min(0).max(100).optional(),
});

const createLinkSchema = z.object({
    originalUrl: z.string().url("Invalid URL"),
    slug: z
        .string()
        .regex(/^[a-zA-Z0-9_-]+$/, "Invalid slug format")
        .min(3)
        .max(50)
        .optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    password: z.string().min(4).max(100).optional(),
    domain: z.string().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    maxClicks: z.number().int().min(1).optional(),
    deviceRules: z.array(deviceRuleSchema).max(10).optional(),
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

        const {
            originalUrl,
            slug: customSlug,
            title,
            description,
            tags,
            password,
            domain: customDomain,
            startsAt,
            expiresAt,
            maxClicks,
            deviceRules: rules,
        } = parsed.data;

        const session = await getSession();

        let domainValue = "";
        if (customDomain && session) {
            const normalizedDomain = customDomain.toLowerCase().trim();
            const owned = await db
                .select()
                .from(customDomains)
                .where(
                    and(
                        eq(customDomains.domain, normalizedDomain),
                        eq(customDomains.userId, session.user.id),
                        eq(customDomains.isVerified, true),
                        eq(customDomains.isActive, true)
                    )
                )
                .limit(1);
            if (owned.length === 0) {
                return error("DOMAIN_NOT_VERIFIED", "Domain not verified or not owned by you", 403);
            }
            domainValue = normalizedDomain;
        }

        let slug: string;
        let isCustom = false;

        if (customSlug) {
            const validation = validateCustomSlug(customSlug);
            if (!validation.valid) {
                return error("LINK_INVALID_SLUG", validation.error, 400);
            }
            const available = await isSlugAvailable(customSlug, domainValue);
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
                domain: domainValue,
                title: title || null,
                description: description || null,
                tags: tags || null,
                password: hashedPassword,
                startsAt: startsAt ? new Date(startsAt) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                maxClicks: maxClicks || null,
            })
            .returning();

        // Insert device rules if provided
        if (rules && rules.length > 0) {
            await db.insert(linkDeviceRules).values(
                rules.map((rule) => ({
                    linkId: link.id,
                    os: rule.os,
                    url: rule.url,
                    priority: rule.priority ?? 0,
                }))
            );
        }

        const baseUrl = domainValue
            ? `https://${domainValue}`
            : (process.env.NEXT_PUBLIC_APP_URL || "");
        const shortUrl = `${baseUrl}/l/${link.slug}`;

        return success({
            id: link.id,
            slug: link.slug,
            originalUrl: link.originalUrl,
            shortUrl,
            customSlug: link.customSlug,
            domain: link.domain,
            title: link.title,
            description: link.description,
            tags: link.tags,
            startsAt: link.startsAt,
            expiresAt: link.expiresAt,
            maxClicks: link.maxClicks,
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

        // Fetch device rules for each link
        const linkIds = links.map((l) => l.id);
        const rules = linkIds.length > 0
            ? await db.select().from(linkDeviceRules).where(
                eq(linkDeviceRules.linkId, linkIds[0])
            )
            : [];

        // Group rules by linkId
        const rulesByLink = new Map<string, typeof rules>();
        for (const rule of rules) {
            const existing = rulesByLink.get(rule.linkId) || [];
            existing.push(rule);
            rulesByLink.set(rule.linkId, existing);
        }

        const linksWithRules = links.map((link) => ({
            ...link,
            deviceRules: rulesByLink.get(link.id) || [],
        }));

        return success({ links: linksWithRules });
    });
}
