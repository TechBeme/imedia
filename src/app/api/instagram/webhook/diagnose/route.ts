import { NextResponse } from "next/server";
import { db } from "@/db";
import { socialAccounts, automations, automationActions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/instagram/webhook/diagnose
 * Public diagnostic endpoint - checks webhook configuration and account matching
 */
export async function GET() {
    // Check environment variables
    const hasVerifyToken = !!process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    const hasAppSecret = !!process.env.INSTAGRAM_APP_SECRET;
    const hasAppId = !!process.env.INSTAGRAM_APP_ID;

    // Get all Instagram accounts
    const accounts = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.platform, "instagram"));

    const activeAccounts = accounts.filter(a => a.isActive);
    const accountsWithToken = accounts.filter(a => !!a.accessToken);

    // Get automations for Instagram
    const allAutomations = await db
        .select()
        .from(automations)
        .where(eq(automations.platform, "instagram"));

    const activeAutomations = allAutomations.filter(a => a.isActive);

    // Get actions for active automations
    const automationDetails = await Promise.all(
        activeAutomations.map(async (auto) => {
            const actions = await db
                .select()
                .from(automationActions)
                .where(
                    and(
                        eq(automationActions.automationId, auto.id),
                        eq(automationActions.isActive, true)
                    )
                )
                .orderBy(automationActions.order);

            return {
                automationId: auto.id,
                name: auto.name,
                socialAccountId: auto.socialAccountId,
                triggerConfig: auto.triggerConfig,
                scope: auto.scope,
                actionsCount: actions.length,
                actions: actions.map(a => ({
                    type: a.type,
                    hasMessages: !!(a.config as Record<string, unknown>)?.messages,
                    messagesCount: ((a.config as Record<string, unknown>)?.messages as string[] | undefined)?.length || 0,
                })),
            };
        })
    );

    // Check account-automation linkage
    const orphanedAutomations = automationDetails.filter(
        a => !activeAccounts.some(acc => acc.id === a.socialAccountId)
    );

    const issues: string[] = [];
    if (!hasVerifyToken) issues.push("INSTAGRAM_WEBHOOK_VERIFY_TOKEN not set");
    if (!hasAppSecret) issues.push("INSTAGRAM_APP_SECRET not set");
    if (!hasAppId) issues.push("INSTAGRAM_APP_ID not set");
    if (accounts.length === 0) issues.push("No Instagram accounts connected");
    if (activeAccounts.length === 0 && accounts.length > 0) issues.push("All Instagram accounts are inactive");
    if (accountsWithToken.length === 0 && accounts.length > 0) issues.push("No Instagram accounts have access tokens");
    if (allAutomations.length === 0) issues.push("No automations created for Instagram");
    if (activeAutomations.length === 0 && allAutomations.length > 0) issues.push("All automations are inactive");
    if (orphanedAutomations.length > 0) issues.push(`${orphanedAutomations.length} automations linked to inactive/missing accounts`);

    const webhookUrl = "https://somedia.techbe.me/api/instagram/webhook";

    return NextResponse.json({
        status: issues.length === 0 ? "healthy" : "issues_found",
        issues,
        config: {
            webhookUrl,
            hasVerifyToken,
            hasAppSecret,
            hasAppId,
        },
        accounts: {
            total: accounts.length,
            active: activeAccounts.length,
            withToken: accountsWithToken.length,
            details: accounts.map(a => ({
                id: a.id,
                providerAccountId: a.providerAccountId,
                username: a.username,
                isActive: a.isActive,
                hasToken: !!a.accessToken,
                expiresAt: a.expiresAt,
            })),
        },
        automations: {
            total: allAutomations.length,
            active: activeAutomations.length,
            details: automationDetails,
            orphaned: orphanedAutomations.map(a => a.automationId),
        },
        metaDashboardInstructions: {
            url: "https://developers.facebook.com/apps/",
            steps: [
                "Go to your app → Instagram → API Setup",
                "Check Webhooks section",
                `Set Callback URL to: ${webhookUrl}`,
                `Set Verify Token to match your INSTAGRAM_WEBHOOK_VERIFY_TOKEN env var`,
                "Subscribe to 'comments' and 'mentions' fields",
                "Test webhook subscription",
            ],
        },
        testCommands: {
            testWebhook: `curl -X POST https://somedia.techbe.me/api/instagram/webhook/test -H "Content-Type: application/json" -d '{"object":"instagram","entry":[{"id":"YOUR_PROVIDER_ACCOUNT_ID","changes":[{"field":"comments","value":{"id":"test","text":"hello","from":{"id":"user1","username":"test"},"media":{"id":"media1"}}}]}]}'`,
            checkStatus: "curl https://somedia.techbe.me/api/instagram/webhook/status",
            checkDiagnose: "curl https://somedia.techbe.me/api/instagram/webhook/diagnose",
        },
    });
}
