import { NextRequest, NextResponse } from "next/server";
import { processInstagramWebhookPayload } from "@/lib/instagram-webhook";

/**
 * POST /api/instagram/webhook/test
 * Test endpoint for Instagram webhook - NO signature verification
 * Use this to test automation flow without Meta signature
 */
export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: { code: "INVALID_JSON" } },
            { status: 400 }
        );
    }

    console.log("[Instagram Webhook Test] Event received:", JSON.stringify(body).slice(0, 2000));

    try {
        const result = await processInstagramWebhookPayload(body);

        return NextResponse.json({
            success: true,
            received: true,
            commentsProcessed: result.commentsProcessed,
            results: result.results,
        });
    } catch (error) {
        console.error("[Instagram Webhook Test] Error processing event:", error);
        return NextResponse.json(
            { error: { code: "WEBHOOK_PROCESSING_FAILED", message: error instanceof Error ? error.message : "Unknown" } },
            { status: 500 }
        );
    }
}
