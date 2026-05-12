import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { automations, automationActions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, error, unauthorized, notFound, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { actionSchema } from "@/lib/automation/validation";

async function verifyAutomationOwnership(automationId: string, userId: string) {
    const result = await db
        .select()
        .from(automations)
        .where(
            and(
                eq(automations.id, automationId),
                eq(automations.userId, userId)
            )
        )
        .limit(1);
    return result[0] || null;
}

// GET /api/automations/[id]/actions
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
        const automation = await verifyAutomationOwnership(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        const actions = await db
            .select()
            .from(automationActions)
            .where(eq(automationActions.automationId, id))
            .orderBy(automationActions.order);

        return success({ actions });
    });
}

// POST /api/automations/[id]/actions
export async function POST(
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
        const automation = await verifyAutomationOwnership(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = actionSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        try {
            const result = await db
                .insert(automationActions)
                .values({
                    automationId: id,
                    type: parsed.data.type,
                    config: parsed.data.config,
                    order: parsed.data.order,
                    isActive: parsed.data.isActive,
                })
                .returning();

            return success({ action: result[0] }, 201);
        } catch (err) {
            console.error("[automation actions POST] error:", err);
            return internalError(err instanceof Error ? err.message : "Failed to create action");
        }
    });
}

// PUT /api/automations/[id]/actions
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
        const automation = await verifyAutomationOwnership(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const { actionId, ...updateData } = body as Record<string, unknown>;
        if (!actionId || typeof actionId !== "string") {
            return error("VALIDATION_ERROR", "actionId is required", 400);
        }

        try {
            const result = await db
                .update(automationActions)
                .set({
                    ...(updateData.type !== undefined && { type: String(updateData.type) }),
                    ...(updateData.config !== undefined && { config: updateData.config }),
                    ...(updateData.order !== undefined && { order: Number(updateData.order) }),
                    ...(updateData.isActive !== undefined && { isActive: Boolean(updateData.isActive) }),
                })
                .where(
                    and(
                        eq(automationActions.id, actionId),
                        eq(automationActions.automationId, id)
                    )
                )
                .returning();

            if (!result[0]) return notFound("Action not found");
            return success({ action: result[0] });
        } catch (err) {
            console.error("[automation actions PUT] error:", err);
            return internalError(err instanceof Error ? err.message : "Failed to update action");
        }
    });
}

// DELETE /api/automations/[id]/actions
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
        const automation = await verifyAutomationOwnership(id, session.user.id);
        if (!automation) return notFound("Automation not found");

        const { searchParams } = new URL(req.url);
        const actionId = searchParams.get("actionId");
        if (!actionId) {
            return error("VALIDATION_ERROR", "actionId query param required", 400);
        }

        try {
            await db
                .delete(automationActions)
                .where(
                    and(
                        eq(automationActions.id, actionId),
                        eq(automationActions.automationId, id)
                    )
                );

            return success({ deleted: true });
        } catch (err) {
            console.error("[automation actions DELETE] error:", err);
            return internalError("Failed to delete action");
        }
    });
}
