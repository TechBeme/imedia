import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { automations, automationLogs, automationActions, socialAccounts } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, error, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { automationSchema } from "@/lib/automation/validation";

// GET /api/automations — list user's automations with stats
export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        try {
            const list = await db
                .select()
                .from(automations)
                .where(eq(automations.userId, session.user.id))
                .orderBy(desc(automations.createdAt));

            // Fetch stats per automation using simple SELECT + JS count (Neon-safe)
            const automationIds = list.map((a) => a.id);
            const stats: Record<string, { totalRuns: number; successRuns: number; failedRuns: number }> = {};
            if (automationIds.length > 0) {
                const logs = await db
                    .select({
                        automationId: automationLogs.automationId,
                        status: automationLogs.status,
                    })
                    .from(automationLogs)
                    .where(inArray(automationLogs.automationId, automationIds));

                for (const log of logs) {
                    const s = stats[log.automationId] || { totalRuns: 0, successRuns: 0, failedRuns: 0 };
                    s.totalRuns += 1;
                    if (log.status === "success") s.successRuns += 1;
                    else if (log.status === "failed") s.failedRuns += 1;
                    stats[log.automationId] = s;
                }
            }

            // Fetch actions per automation (Neon-safe)
            const actions: Record<string, Array<{ type: string; config: { messages?: string[] } }>> = {};
            if (automationIds.length > 0) {
                const actionRows = await db
                    .select()
                    .from(automationActions)
                    .where(inArray(automationActions.automationId, automationIds))
                    .orderBy(automationActions.order);

                for (const row of actionRows) {
                    const arr = actions[row.automationId] || [];
                    arr.push({
                        type: row.type,
                        config: row.config as { messages?: string[] },
                    });
                    actions[row.automationId] = arr;
                }
            }

            return success({ automations: list, stats, actions });
        } catch (err) {
            console.error("[automations GET] error:", err);
            return internalError("Failed to fetch automations");
        }
    });
}

// POST /api/automations — create automation
export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = automationSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        const data = parsed.data;

        try {
            // Verify social account belongs to user
            const account = await db
                .select()
                .from(socialAccounts)
                .where(
                    and(
                        eq(socialAccounts.id, data.socialAccountId),
                        eq(socialAccounts.userId, session.user.id)
                    )
                )
                .limit(1);

            if (!account[0]) {
                return error("NOT_FOUND", "Social account not found", 404);
            }

            const result = await db
                .insert(automations)
                .values({
                    userId: session.user.id,
                    socialAccountId: data.socialAccountId,
                    name: data.name,
                    platform: data.platform,
                    triggerType: data.triggerType,
                    triggerConfig: data.triggerConfig,
                    scope: data.scope,
                    isActive: data.isActive,
                })
                .returning();

            return success({ automation: result[0] }, 201);
        } catch (err) {
            console.error("[automations POST] error:", err);
            return internalError(err instanceof Error ? err.message : "Failed to create automation");
        }
    });
}
