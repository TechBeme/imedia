import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { automations, automationLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, unauthorized, notFound, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/automations/[id]/logs
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        const { id } = await params;

        try {
            const automation = await db
                .select()
                .from(automations)
                .where(
                    and(
                        eq(automations.id, id),
                        eq(automations.userId, session.user.id)
                    )
                )
                .limit(1);

            if (!automation[0]) return notFound("Automation not found");

            const { searchParams } = new URL(req.url);
            const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
            const offset = parseInt(searchParams.get("offset") || "0", 10);

            const logs = await db
                .select()
                .from(automationLogs)
                .where(eq(automationLogs.automationId, id))
                .orderBy(desc(automationLogs.executedAt))
                .limit(limit)
                .offset(offset);

            return success({ logs });
        } catch (err) {
            console.error("[automation logs GET] error:", err);
            return internalError("Failed to fetch logs");
        }
    });
}
