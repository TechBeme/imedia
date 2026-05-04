import { NextRequest } from "next/server";
import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { success, unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getLinkAnalytics } from "@/lib/link-analytics";
import { eq, and } from "drizzle-orm";

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

        // Verify ownership
        const links = await db
            .select()
            .from(shortLinks)
            .where(and(eq(shortLinks.id, id), eq(shortLinks.userId, session.user.id)))
            .limit(1);

        if (links.length === 0) {
            return notFound();
        }

        // Parse date range from query params
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        let dateRange: { from: Date; to: Date } | undefined;
        if (fromParam && toParam) {
            const from = new Date(fromParam);
            const to = new Date(toParam);
            // Limit range to max 365 days
            const maxRange = 365 * 24 * 60 * 60 * 1000;
            if (to.getTime() - from.getTime() <= maxRange) {
                dateRange = { from, to };
            }
        }

        const analytics = await getLinkAnalytics(id, dateRange);
        return success({ analytics });
    });
}
