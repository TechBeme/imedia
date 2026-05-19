import { NextResponse } from "next/server";

/**
 * GET /api/instagram/webhook/status
 * Public endpoint to check webhook configuration status
 */
export async function GET() {
    const webhookUrl = "https://somedia.techbe.me/api/instagram/webhook";
    const testWebhookUrl = "https://somedia.techbe.me/api/instagram/webhook/test";

    const hasVerifyToken = !!process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    const hasAppSecret = !!process.env.INSTAGRAM_APP_SECRET;
    const hasAppId = !!process.env.INSTAGRAM_APP_ID;

    return NextResponse.json({
        status: "ok",
        webhook: {
            url: webhookUrl,
            testUrl: testWebhookUrl,
            hasVerifyToken,
            hasAppSecret,
            hasAppId,
            verifyTokenLength: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN?.length || 0,
            appSecretLength: process.env.INSTAGRAM_APP_SECRET?.length || 0,
        },
        instructions: {
            metaDashboard: "https://developers.facebook.com/apps/",
            webhookConfig: {
                callbackUrl: webhookUrl,
                verifyToken: hasVerifyToken ? "configured" : "missing",
                fields: ["comments", "mentions"],
            },
            test: `curl -X POST ${testWebhookUrl} -H "Content-Type: application/json" -d '{"object":"instagram","entry":[{"id":"YOUR_ACCOUNT_ID","changes":[{"field":"comments","value":{"id":"test","text":"hello","from":{"id":"user1","username":"test"},"media":{"id":"media1"}}}]}]}'`,
        },
    });
}
