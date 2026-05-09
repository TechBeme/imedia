import { NextRequest } from "next/server";
import { db } from "@/db";
import { shortLinks, linkClicks, linkFolders, linkTags, shortLinkTags } from "@/db/schema";
import { unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, gte, lte, and, desc, inArray } from "drizzle-orm";

function escapeCsv(value: string | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { searchParams } = new URL(req.url);
        const linkId = searchParams.get("linkId");
        const preset = searchParams.get("preset") as "24h" | "7d" | "30d" | "90d" | "1y" | "all" | null;
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        // Build date range
        let fromDate: Date | undefined;
        let toDate: Date | undefined;
        const now = new Date();

        if (preset && preset !== "all") {
            toDate = new Date(now);
            fromDate = new Date(now);
            switch (preset) {
                case "24h":
                    fromDate.setHours(fromDate.getHours() - 24);
                    break;
                case "7d":
                    fromDate.setDate(fromDate.getDate() - 7);
                    break;
                case "30d":
                    fromDate.setDate(fromDate.getDate() - 30);
                    break;
                case "90d":
                    fromDate.setDate(fromDate.getDate() - 90);
                    break;
                case "1y":
                    fromDate.setFullYear(fromDate.getFullYear() - 1);
                    break;
            }
        } else if (fromParam && toParam) {
            fromDate = new Date(fromParam);
            toDate = new Date(toParam);
        }

        if (linkId) {
            // Export analytics for a single link
            const conditions = [
                eq(linkClicks.linkId, linkId),
            ];
            if (fromDate) conditions.push(gte(linkClicks.clickedAt, fromDate));
            if (toDate) conditions.push(lte(linkClicks.clickedAt, toDate));

            const clicks = await db
                .select()
                .from(linkClicks)
                .where(and(...conditions))
                .orderBy(desc(linkClicks.clickedAt));

            const headers = [
                "Date", "IP", "Country", "Region", "City",
                "Device", "Device Model", "OS", "OS Version",
                "Browser", "Browser Version", "Language", "Referrer",
            ];

            const rows = clicks.map((c) => [
                c.clickedAt.toISOString(),
                c.ip || "",
                c.country || "",
                c.region || "",
                c.city || "",
                c.device || "",
                c.deviceModel || "",
                c.os || "",
                c.osVersion || "",
                c.browser || "",
                c.browserVersion || "",
                c.language || "",
                c.referrer || "",
            ]);

            const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");

            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="link-analytics-${linkId}.csv"`,
                },
            });
        }

        // Export all links summary
        const links = await db
            .select()
            .from(shortLinks)
            .where(eq(shortLinks.userId, session.user.id))
            .orderBy(desc(shortLinks.createdAt));

        const linkIds = links.map((l) => l.id);

        // Fetch folders
        const folders = await db
            .select()
            .from(linkFolders)
            .where(eq(linkFolders.userId, session.user.id));

        const folderMap = new Map(folders.map((f) => [f.id, f]));

        // Fetch tags
        const allTags = await db
            .select()
            .from(linkTags)
            .where(eq(linkTags.userId, session.user.id));

        const tagMap = new Map(allTags.map((t) => [t.id, t]));

        // Fetch link-tag associations
        const linkTagAssocs = linkIds.length > 0
            ? await db
                .select()
                .from(shortLinkTags)
                .where(inArray(shortLinkTags.linkId, linkIds))
            : [];

        const tagsByLink = new Map<string, typeof allTags>();
        for (const assoc of linkTagAssocs) {
            const tag = tagMap.get(assoc.tagId);
            if (tag) {
                const existing = tagsByLink.get(assoc.linkId) || [];
                existing.push(tag);
                tagsByLink.set(assoc.linkId, existing);
            }
        }

        const headers = [
            "Slug", "Original URL", "Title", "Clicks",
            "Folder", "Tags", "Created At", "Expires At", "Status",
        ];

        const rows = links.map((l) => {
            const folder = l.folderId ? folderMap.get(l.folderId) : null;
            const tags = tagsByLink.get(l.id) || [];
            const now = new Date();
            let status = l.isActive ? "active" : "inactive";
            if (l.expiresAt && new Date(l.expiresAt) < now) status = "expired";
            if (l.startsAt && new Date(l.startsAt) > now) status = "scheduled";

            return [
                l.slug,
                l.originalUrl,
                l.title || "",
                String(l.clickCount),
                folder?.name || "",
                tags.map((t) => t.name).join("; "),
                l.createdAt.toISOString(),
                l.expiresAt?.toISOString() || "",
                status,
            ];
        });

        const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="links-export.csv"`,
            },
        });
    });
}
