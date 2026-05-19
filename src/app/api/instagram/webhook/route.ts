import { NextRequest, NextResponse } from "next/server";
import {
    processInstagramWebhookPayload,
    verifyMetaSignature,
} from "@/lib/instagram-webhook";

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

/**
 * GET /api/instagram/webhook
 * Handles Meta webhook verification challenge.
 * Meta sends: hub.mode=subscribe, hub.verify_token, hub.challenge
 * We must verify the token and return the challenge.
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
        console.log("[Instagram Webhook] Verification successful");
        return new NextResponse(challenge, { status: 200 });
    }

    console.error("[Instagram Webhook] Verification failed", { mode, tokenMatch: token === VERIFY_TOKEN, hasChallenge: !!challenge });
    return NextResponse.json(
        { error: { code: "WEBHOOK_VERIFICATION_FAILED" } },
        { status: 403 }
    );
}

/**
 * POST /api/instagram/webhook
 * Receives Instagram webhook events.
 */
export async function POST(req: NextRequest) {
    const bodyText = await req.text();

    if (APP_SECRET) {
        const signature = req.headers.get("x-hub-signature-256");
        if (!verifyMetaSignature(bodyText, signature, APP_SECRET)) {
            console.error("[Instagram Webhook] Invalid signature", {
                hasSignature: Boolean(signature),
            });
            return NextResponse.json(
                { error: { code: "INVALID_WEBHOOK_SIGNATURE" } },
                { status: 401 }
            );
        }
    } else {
        console.warn("[Instagram Webhook] INSTAGRAM_APP_SECRET is not configured; signature verification skipped");
    }

    let body: unknown;
    try {
        body = JSON.parse(bodyText);
    } catch {
        return NextResponse.json(
            { error: { code: "INVALID_JSON" } },
            { status: 400 }
        );
    }

    console.log("[Instagram Webhook] Event received:", JSON.stringify(body).slice(0, 1000));

    try {
        const result = await processInstagramWebhookPayload(body);

        return NextResponse.json({
            success: true,
            received: true,
            commentsProcessed: result.commentsProcessed,
            results: result.results,
        });
    } catch (error) {
        console.error("[Instagram Webhook] Error processing event:", error);
        return NextResponse.json(
            { error: { code: "WEBHOOK_PROCESSING_FAILED" } },
            { status: 500 }
        );
    }
}
