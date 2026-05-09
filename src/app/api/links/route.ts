import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { shortLinks, customDomains, linkDeviceRules, linkFolders, linkTags, shortLinkTags, linkClicks } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import {
    validateCustomSlug,
    isSlugAvailable,
    generateUniqueSlug,
} from "@/lib/links";
import { eq, desc, and, sql, inArray, asc } from "drizzle-orm";

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
    ogTitle: z.string().max(200).optional(),
    ogDescription: z.string().max(500).optional(),
    ogImageUrl: z.string().url().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    tagIds: z.array(z.string().uuid()).max(20).optional(),
    folderId: z.string().uuid().optional(),
    password: z.string().min(4).max(100).optional(),
    domain: z.string().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    maxClicks: z.number().int().min(1).optional(),
    expiredRedirectUrl: z.string().url().optional(),
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
            ogTitle,
            ogDescription,
            ogImageUrl,
            tags,
            tagIds,
            folderId,
            password,
            domain: customDomain,
            startsAt,
            expiresAt,
            maxClicks,
            expiredRedirectUrl,
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
                ogTitle: ogTitle || null,
                ogDescription: ogDescription || null,
                ogImageUrl: ogImageUrl || null,
                tags: tags || null,
                folderId: folderId || null,
                password: hashedPassword,
                startsAt: startsAt ? new Date(startsAt) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                maxClicks: maxClicks || null,
                expiredRedirectUrl: expiredRedirectUrl || null,
            })
            .returning();

        // Insert tag associations if provided
        if (tagIds && tagIds.length > 0) {
            await db.insert(shortLinkTags).values(
                tagIds.map((tagId) => ({
                    linkId: link.id,
                    tagId,
                }))
            );
        }

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
            ogTitle: link.ogTitle,
            ogDescription: link.ogDescription,
            ogImageUrl: link.ogImageUrl,
            tags: link.tags,
            folderId: link.folderId,
            startsAt: link.startsAt,
            expiresAt: link.expiresAt,
            maxClicks: link.maxClicks,
            expiredRedirectUrl: link.expiredRedirectUrl,
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

        const { searchParams } = new URL(req.url);
        const sort = searchParams.get("sort") || "createdAt_desc";
        const folderId = searchParams.get("folderId");
        const tagIdsParam = searchParams.get("tagIds");
        const status = searchParams.get("status");

        // Build conditions
        const conditions = [eq(shortLinks.userId, session.user.id)];

        if (folderId) {
            conditions.push(eq(shortLinks.folderId, folderId));
        }

        if (status) {
            const now = new Date();
            switch (status) {
                case "active":
                    conditions.push(eq(shortLinks.isActive, true));
                    conditions.push(
                        sql`(${shortLinks.expiresAt} IS NULL OR ${shortLinks.expiresAt} > ${now})`
                    );
                    break;
                case "inactive":
                    conditions.push(eq(shortLinks.isActive, false));
                    break;
                case "expired":
                    conditions.push(
                        sql`${shortLinks.expiresAt} IS NOT NULL AND ${shortLinks.expiresAt} < ${now}`
                    );
                    break;
                case "scheduled":
                    conditions.push(
                        sql`${shortLinks.startsAt} IS NOT NULL AND ${shortLinks.startsAt} > ${now}`
                    );
                    break;
            }
        }

        const whereClause = and(...conditions);

        // Determine order by
        let orderBy;
        switch (sort) {
            case "slug_asc":
                orderBy = asc(shortLinks.slug);
                break;
            case "slug_desc":
                orderBy = desc(shortLinks.slug);
                break;
            case "createdAt_asc":
                orderBy = asc(shortLinks.createdAt);
                break;
            case "clicks_desc":
                orderBy = desc(shortLinks.clickCount);
                break;
            case "clicks_asc":
                orderBy = asc(shortLinks.clickCount);
                break;
            case "visitors_desc":
                // Will sort after fetching
                orderBy = desc(shortLinks.createdAt);
                break;
            default:
                orderBy = desc(shortLinks.createdAt);
        }

        const links = await db
            .select()
            .from(shortLinks)
            .where(whereClause)
            .orderBy(orderBy);

        const linkIds = links.map((l) => l.id);

        // Fetch folders
        const folderIds = links.map((l) => l.folderId).filter(Boolean) as string[];
        const folders = folderIds.length > 0
            ? await db
                .select()
                .from(linkFolders)
                .where(inArray(linkFolders.id, folderIds))
            : [];
        const folderMap = new Map(folders.map((f) => [f.id, f]));

        // Fetch tags
        const allTags = linkIds.length > 0
            ? await db
                .select({
                    linkId: shortLinkTags.linkId,
                    tagId: shortLinkTags.tagId,
                    tagName: linkTags.name,
                    tagColor: linkTags.color,
                })
                .from(shortLinkTags)
                .innerJoin(linkTags, eq(shortLinkTags.tagId, linkTags.id))
                .where(inArray(shortLinkTags.linkId, linkIds))
            : [];

        const tagsByLink = new Map<string, { id: string; name: string; color: string }[]>();
        for (const t of allTags) {
            const existing = tagsByLink.get(t.linkId) || [];
            existing.push({ id: t.tagId, name: t.tagName, color: t.tagColor });
            tagsByLink.set(t.linkId, existing);
        }

        // Fetch unique visitors per link
        const uniqueVisitorsMap = new Map<string, number>();
        if (linkIds.length > 0) {
            const visitorCounts = await db
                .select({
                    linkId: linkClicks.linkId,
                    uniqueVisitors: sql<number>`count(distinct ${linkClicks.fingerprint})`,
                })
                .from(linkClicks)
                .where(inArray(linkClicks.linkId, linkIds))
                .groupBy(linkClicks.linkId);

            for (const v of visitorCounts) {
                uniqueVisitorsMap.set(v.linkId, v.uniqueVisitors);
            }
        }

        // Filter by tagIds if specified
        let filteredLinks = links;
        if (tagIdsParam) {
            const tagIds = tagIdsParam.split(",");
            filteredLinks = links.filter((l) => {
                const linkTagIds = tagsByLink.get(l.id)?.map((t) => t.id) || [];
                return tagIds.some((tid) => linkTagIds.includes(tid));
            });
        }

        // Sort by visitors if requested
        if (sort === "visitors_desc") {
            filteredLinks.sort((a, b) => {
                const va = uniqueVisitorsMap.get(a.id) || 0;
                const vb = uniqueVisitorsMap.get(b.id) || 0;
                return vb - va;
            });
        }

        const enrichedLinks = filteredLinks.map((link) => ({
            ...link,
            folder: link.folderId ? folderMap.get(link.folderId) || null : null,
            tags: tagsByLink.get(link.id) || [],
            uniqueVisitors: uniqueVisitorsMap.get(link.id) || 0,
        }));

        return success({ links: enrichedLinks });
    });
}
