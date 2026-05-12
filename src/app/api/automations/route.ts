import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { automations, socialAccounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, error, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { automationSchema } from "@/lib/automation/validation";

// GET /api/automations — list user's automations
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

            return success({ automations: list });
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
