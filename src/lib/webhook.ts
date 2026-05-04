import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export type WebhookPlatform = "instagram" | "youtube" | "tiktok" | "x" | "facebook" | "threads";
export type WebhookEventType = "post.published" | "post.failed" | "comment.received" | "mention.received" | "account.disconnected" | "token.refreshed";
export type WebhookStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

interface StoreWebhookEventInput {
    eventId: string;
    platform: WebhookPlatform;
    eventType: WebhookEventType;
    payload: Record<string, unknown>;
}

export async function storeWebhookEvent(input: StoreWebhookEventInput) {
    const result = await db
        .insert(webhookEvents)
        .values({
            eventId: input.eventId,
            platform: input.platform,
            eventType: input.eventType,
            payload: input.payload,
            status: "pending",
            retryCount: 0,
        })
        .onConflictDoNothing({ target: webhookEvents.eventId })
        .returning();

    return result[0] || null;
}

export async function getWebhookEvent(eventId: string) {
    const result = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.eventId, eventId))
        .limit(1);

    return result[0] || null;
}

export async function updateWebhookStatus(
    eventId: string,
    status: WebhookStatus,
    errorMessage?: string
) {
    const update: Record<string, unknown> = { status };
    if (status === "completed") {
        update.processedAt = new Date();
    }
    if (errorMessage) {
        update.errorMessage = errorMessage;
    }

    const result = await db
        .update(webhookEvents)
        .set(update)
        .where(eq(webhookEvents.eventId, eventId))
        .returning();

    return result[0] || null;
}

export async function incrementRetryCount(eventId: string) {
    const event = await getWebhookEvent(eventId);
    if (!event) return null;

    const result = await db
        .update(webhookEvents)
        .set({
            retryCount: event.retryCount + 1,
            status: "retrying",
        })
        .where(eq(webhookEvents.eventId, eventId))
        .returning();

    return result[0] || null;
}

export async function listPendingEvents(limit = 50) {
    return db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.status, "pending"))
        .limit(limit);
}

export async function listFailedEvents(limit = 50) {
    return db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.status, "failed"))
        .limit(limit);
}
