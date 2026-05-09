import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

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
    return new NextResponse("Verification failed", { status: 403 });
}

/**
 * POST /api/instagram/webhook
 * Receives Instagram webhook events.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log("[Instagram Webhook] Event received:", JSON.stringify(body, null, 2));

        // Handle different webhook events
        if (body.object === "instagram") {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    console.log("[Instagram Webhook] Change:", change.value);
                    // TODO: Process specific events (mentions, messages, etc.)
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Instagram Webhook] Error processing event:", error);
        return NextResponse.json({ success: true }); // Always return 200 to Meta
    }
}
