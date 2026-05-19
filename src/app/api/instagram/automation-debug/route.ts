import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAccounts, automations, automationActions, automationLogs } from "@/db/schema";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { success, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    const accounts = await db
        .select()
        .from(socialAccounts)
        .where(
            and(
                eq(socialAccounts.userId, session.user.id),
                eq(socialAccounts.platform, "instagram")
            )
        );

    const accountDetails = await Promise.all(
        accounts.map(async (account) => {
            const autoList = await db
                .select()
                .from(automations)
                .where(eq(automations.socialAccountId, account.id))
                .orderBy(desc(automations.createdAt));

            const automationDetails = await Promise.all(
                autoList.map(async (auto) => {
                    const actions = await db
                        .select()
                        .from(automationActions)
                        .where(eq(automationActions.automationId, auto.id))
                        .orderBy(automationActions.order);

                    const logs = await db
                        .select()
                        .from(automationLogs)
                        .where(eq(automationLogs.automationId, auto.id))
                        .orderBy(desc(automationLogs.executedAt))
                        .limit(5);

                    return {
                        ...auto,
                        actions: actions.map(a => ({
                            id: a.id,
                            type: a.type,
                            config: a.config,
                            isActive: a.isActive,
                            order: a.order,
                        })),
                        recentLogs: logs.map(l => ({
                            id: l.id,
                            status: l.status,
                            executedAt: l.executedAt,
                            triggerEvent: l.triggerEvent,
                            actionResults: l.actionResults,
                        })),
                    };
                })
            );

            return {
                id: account.id,
                providerAccountId: account.providerAccountId,
                username: account.username,
                displayName: account.displayName,
                isActive: account.isActive,
                hasAccessToken: !!account.accessToken,
                expiresAt: account.expiresAt,
                automations: automationDetails,
            };
        })
    );

    return success({
        instagramAccounts: accountDetails,
        webhookUrl: "https://somedia.techbe.me/api/instagram/webhook",
        testWebhookUrl: "https://somedia.techbe.me/api/instagram/webhook/test",
        tips: [
            "1. Check if providerAccountId matches the Instagram Business Account ID",
            "2. Ensure automations are active and have actions configured",
            "3. Verify webhook is subscribed in Meta Developer Dashboard",
            "4. Use test endpoint to simulate webhook without Meta signature",
        ],
    });
}
