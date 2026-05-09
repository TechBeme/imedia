import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

const settingsSchema = z.object({
    defaultExpiredRedirectUrl: z.string().url().optional().nullable(),
    notFoundRedirectUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const settings = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, session.user.id))
            .limit(1);

        return success({
            settings: settings[0] || {
                defaultExpiredRedirectUrl: null,
                notFoundRedirectUrl: null,
            },
        });
    });
}

export async function PUT(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = settingsSchema.safeParse(body);
        if (!parsed.success) {
            return error("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
        }

        const existing = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, session.user.id))
            .limit(1);

        let settings;
        if (existing.length > 0) {
            [settings] = await db
                .update(userSettings)
                .set({
                    ...parsed.data,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.userId, session.user.id))
                .returning();
        } else {
            [settings] = await db
                .insert(userSettings)
                .values({
                    userId: session.user.id,
                    defaultExpiredRedirectUrl: parsed.data.defaultExpiredRedirectUrl,
                    notFoundRedirectUrl: parsed.data.notFoundRedirectUrl,
                })
                .returning();
        }

        return success({ settings });
    });
}
