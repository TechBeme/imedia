import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { automations, automationLogs, automationActions, socialAccounts } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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

            // Fetch stats for each automation
            const automationIds = list.map((a) => a.id);
            const stats: Record<string, { totalRuns: number; successRuns: number; failedRuns: number }> = {};

            if (automationIds.length > 0) {
                const logCounts = await db
                    .select({
                        automationId: automationLogs.automationId,
                        totalRuns: sql<number>`count(*)::int`,
                        successRuns: sql<number>`count(*) filter (where ${automationLogs.status} = 'success')::int`,
                        failedRuns: sql<number>`count(*) filter (where ${automationLogs.status} = 'failed')::int`,
                    })
                    .from(automationLogs)
                    .where(sql`${automationLogs.automationId} = ANY(${automationIds})`)
                    .groupBy(automationLogs.automationId);

                for (const row of logCounts) {
                    stats[row.automationId] = {
                        totalRuns: row.totalRuns,
                        successRuns: row.successRuns,
                        failedRuns: row.failedRuns,
                    };
                }
            }

            // Fetch actions for each automation
            const actions: Record<string, Array<{ type: string; config: { messages: string[] }; isActive: boolean }>> = {};
            if (automationIds.length > 0) {
                const actionList = await db
                    .select()
                    .from(automationActions)
                    .where(sql`${automationActions.automationId} = ANY(${automationIds})`);

                for (const action of actionList) {
                    if (!actions[action.automationId]) actions[action.automationId] = [];
                    actions[action.automationId].push({
                        type: action.type,
                        config: action.config as { messages: string[] },
                        isActive: action.isActive,
                    });
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
