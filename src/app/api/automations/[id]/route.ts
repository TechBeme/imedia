import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { automations, automationActions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, error, unauthorized, notFound, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { updateAutomationSchema } from "@/lib/automation/validation";

async function getAutomation(id: string, userId: string) {
    const result = await db
        .select()
        .from(automations)
        .where(and(eq(automations.id, id), eq(automations.userId, userId)))
        .limit(1);
    return result[0] || null;
}

// GET /api/automations/[id]
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
        const automation = await getAutomation(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        const actions = await db
            .select()
            .from(automationActions)
            .where(eq(automationActions.automationId, id))
            .orderBy(automationActions.order);

        return success({ automation, actions });
    });
}

// PUT /api/automations/[id]
export async function PUT(
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
        const automation = await getAutomation(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = updateAutomationSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        try {
            const updateData: Record<string, unknown> = {};
            if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
            if (parsed.data.triggerConfig !== undefined) updateData.triggerConfig = parsed.data.triggerConfig;
            if (parsed.data.scope !== undefined) updateData.scope = parsed.data.scope;
            if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
            updateData.updatedAt = new Date();

            const result = await db
                .update(automations)
                .set(updateData)
                .where(eq(automations.id, id))
                .returning();

            return success({ automation: result[0] });
        } catch (err) {
            console.error("[automations PUT] error:", err);
            return internalError(err instanceof Error ? err.message : "Failed to update automation");
        }
    });
}

// DELETE /api/automations/[id]
export async function DELETE(
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
        const automation = await getAutomation(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        try {
            await db.delete(automations).where(eq(automations.id, id));
            return success({ deleted: true });
        } catch (err) {
            console.error("[automations DELETE] error:", err);
            return internalError("Failed to delete automation");
        }
    });
}
