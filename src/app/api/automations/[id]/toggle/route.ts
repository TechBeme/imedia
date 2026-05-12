import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { success, unauthorized, notFound, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/automations/[id]/toggle
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

        try {
            const result = await db
                .select()
                .from(automations)
                .where(
                    and(
                        eq(automations.id, id),
                        eq(automations.userId, session.user.id)
                    )
                )
                .limit(1);

            if (!result[0]) return notFound("Automation not found");

            const updated = await db
                .update(automations)
                .set({
                    isActive: !result[0].isActive,
                    updatedAt: new Date(),
                })
                .where(eq(automations.id, id))
                .returning();

            return success({ automation: updated[0] });
        } catch (err) {
            console.error("[automations toggle POST] error:", err);
            return internalError("Failed to toggle automation");
        }
    });
}
