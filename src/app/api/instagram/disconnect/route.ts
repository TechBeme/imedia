import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts, automations } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        try {
            // 1. Find the Instagram account to get its ID
            const accounts = await db
                .select({ id: socialAccounts.id })
                .from(socialAccounts)
                .where(
                    and(
                        eq(socialAccounts.userId, session.user.id),
                        eq(socialAccounts.platform, "instagram")
                    )
                );

            if (accounts.length === 0) {
                return success({ deleted: true });
            }

            const accountId = accounts[0].id;

            // 2. Disable all automations linked to this account (orphan them)
            await db
                .update(automations)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(automations.socialAccountId, accountId));

            // 3. Delete the social account
            // Automations will be preserved with socialAccountId = null (onDelete: "set null")
            await db
                .delete(socialAccounts)
                .where(eq(socialAccounts.id, accountId));

            return success({ deleted: true });
        } catch (err) {
            console.error("[instagram/disconnect POST] error:", err);
            return internalError("Failed to disconnect Instagram");
        }
    });
}
