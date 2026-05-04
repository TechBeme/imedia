import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storeWebhookEvent, updateWebhookStatus } from "@/lib/webhook";
import { withRateLimit } from "@/lib/api-guard";
import { webhookRateLimit } from "@/lib/rate-limit";
import type { WebhookPlatform } from "@/lib/webhook";

const platformSchema = z.enum(["instagram", "youtube", "tiktok", "x", "facebook", "threads"]);

function verifyInstagramSignature(body: string, signature: string | null, appSecret: string): boolean {
    if (!signature) return false;
    const crypto = require("crypto");
    const expected = crypto
        .createHmac("sha256", appSecret)
        .update(body, "utf8")
        .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    return withRateLimit(req, webhookRateLimit, async () => {
        const { platform } = await params;
        const parsedPlatform = platformSchema.safeParse(platform);
        if (!parsedPlatform.success) {
            return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
        }

        const bodyText = await req.text();
        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(bodyText);
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // Platform-specific signature verification (when available)
        if (platform === "instagram") {
            const signature = req.headers.get("x-hub-signature-256");
            const appSecret = process.env.INSTAGRAM_APP_SECRET;
            if (appSecret && signature) {
                const isValid = verifyInstagramSignature(bodyText, signature, appSecret);
                if (!isValid) {
                    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
                }
            }
        }

        // Generate a stable event ID from platform payload
        const eventId = payload.id as string || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Determine event type from payload
        const eventType = inferEventType(platform as WebhookPlatform, payload);

        try {
            const event = await storeWebhookEvent({
                eventId,
                platform: platform as WebhookPlatform,
                eventType,
                payload,
            });

            if (!event) {
                // Duplicate event, acknowledge to prevent retries
                return NextResponse.json({ received: true, duplicate: true });
            }

            // Process event synchronously for now
            // In production, queue this to BullMQ/Redis for async processing
            await processWebhookEvent(event.id, platform as WebhookPlatform, payload);

            return NextResponse.json({ received: true, eventId: event.id });
        } catch (err) {
            console.error(`[webhook ${platform}] error:`, err);
            return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
        }
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    // Handle platform webhook verification challenges
    const { platform } = await params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && challenge) {
        // In production, validate verify_token against stored value
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
}

function inferEventType(platform: WebhookPlatform, payload: Record<string, unknown>): import("@/lib/webhook").WebhookEventType {
    // Simple inference based on payload structure
    // Each platform will have its own logic
    if (platform === "instagram") {
        if (payload.object === "instagram") {
            const entries = payload.entry as Array<{ changes?: Array<{ value?: { media_id?: string } }> }> | undefined;
            if (entries?.some((e) => e.changes?.some((c) => c.value?.media_id))) {
                return "post.published";
            }
        }
    }

    // Default fallback
    return "post.published";
}

async function processWebhookEvent(
    eventId: string,
    platform: WebhookPlatform,
    payload: Record<string, unknown>
) {
    try {
        console.log(`[webhook] Processing ${platform} event ${eventId}:`, JSON.stringify(payload).slice(0, 200));

        // Platform-specific processing logic goes here
        // e.g., update post status, notify user, refresh metrics

        await updateWebhookStatus(eventId, "completed");
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[webhook] Failed to process ${platform} event ${eventId}:`, message);
        await updateWebhookStatus(eventId, "failed", message);
    }
}
