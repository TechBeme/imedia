import crypto from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { processCommentAutomationEvent } from "@/lib/automation/engine";
import { storeWebhookEvent, updateWebhookStatus } from "@/lib/webhook";
import type { PlatformComment } from "@/lib/automation/types";

type InstagramWebhookPayload = {
    object?: string;
    entry?: Array<{
        id?: string;
        time?: number;
        changes?: Array<{
            field?: string;
            value?: unknown;
        }>;
    }>;
};

type InstagramCommentValue = {
    id?: string;
    comment_id?: string;
    text?: string;
    message?: string;
    username?: string;
    from?: {
        id?: string;
        username?: string;
    };
    media?: {
        id?: string;
        media_product_type?: string;
    };
    media_id?: string;
    recipient_id?: string;
    sender_id?: string;
    user_id?: string;
    parent_id?: string;
    timestamp?: string;
    created_time?: number | string;
};

export type InstagramCommentWebhookEvent = {
    eventId: string;
    entryId?: string;
    field: "comments" | "live_comments";
    recipientId?: string;
    postId: string;
    parentId?: string;
    mediaProductType?: string;
    comment: PlatformComment;
};

export type InstagramWebhookProcessResult = {
    eventId: string;
    status: "completed" | "skipped" | "failed" | "duplicate";
    reason?: string;
    matchedAutomations?: number;
    executedAutomations?: number;
    skippedAutomations?: number;
    error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTimestamp(value: InstagramCommentValue, entryTime?: number) {
    if (typeof value.timestamp === "string" && value.timestamp) {
        return value.timestamp;
    }

    if (typeof value.created_time === "number") {
        return new Date(value.created_time * 1000).toISOString();
    }

    if (typeof value.created_time === "string" && value.created_time) {
        const numeric = Number(value.created_time);
        if (Number.isFinite(numeric)) {
            return new Date(numeric * 1000).toISOString();
        }
        return value.created_time;
    }

    if (entryTime) {
        return new Date(entryTime * 1000).toISOString();
    }

    return new Date().toISOString();
}

function normalizeCommentValue(value: unknown): InstagramCommentValue[] {
    if (Array.isArray(value)) {
        return value.filter(isRecord) as InstagramCommentValue[];
    }

    if (isRecord(value)) {
        return [value as InstagramCommentValue];
    }

    return [];
}

export function verifyMetaSignature(
    body: string,
    signature: string | null,
    appSecret: string
): boolean {
    if (!signature?.startsWith("sha256=")) {
        return false;
    }

    const received = signature.slice("sha256=".length);
    const expected = crypto
        .createHmac("sha256", appSecret)
        .update(body, "utf8")
        .digest("hex");

    const receivedBuffer = Buffer.from(received, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function parseInstagramCommentWebhook(
    payload: unknown
): InstagramCommentWebhookEvent[] {
    if (!isRecord(payload) || payload.object !== "instagram") {
        return [];
    }

    const instagramPayload = payload as InstagramWebhookPayload;
    const events: InstagramCommentWebhookEvent[] = [];

    for (const entry of instagramPayload.entry ?? []) {
        for (const change of entry.changes ?? []) {
            if (change.field !== "comments" && change.field !== "live_comments") {
                continue;
            }

            for (const value of normalizeCommentValue(change.value)) {
                const commentId = value.id || value.comment_id;
                const postId = value.media?.id || value.media_id;
                const text = value.text || value.message;

                if (!commentId || !postId || !text) {
                    console.log("[instagram webhook] Skipping incomplete comment payload", {
                        hasCommentId: Boolean(commentId),
                        hasPostId: Boolean(postId),
                        hasText: Boolean(text),
                        field: change.field,
                    });
                    continue;
                }

                const username = value.from?.username || value.username || "";
                const userId = value.from?.id || value.sender_id || value.user_id;

                events.push({
                    eventId: `instagram-comment-${commentId}`,
                    entryId: entry.id,
                    field: change.field,
                    recipientId: value.recipient_id || entry.id,
                    postId,
                    parentId: value.parent_id,
                    mediaProductType: value.media?.media_product_type,
                    comment: {
                        id: commentId,
                        text,
                        username,
                        userId,
                        timestamp: normalizeTimestamp(value, entry.time),
                    },
                });
            }
        }
    }

    return events;
}

export async function processInstagramCommentWebhookEvent(
    event: InstagramCommentWebhookEvent
) {
    const accountCandidates = [
        event.recipientId,
        event.entryId,
    ].filter((candidate): candidate is string => Boolean(candidate));

    if (accountCandidates.length === 0) {
        return {
            status: "skipped" as const,
            reason: "INSTAGRAM_ACCOUNT_NOT_IDENTIFIED",
        };
    }

    const accounts = await db
        .select()
        .from(socialAccounts)
        .where(
            and(
                eq(socialAccounts.platform, "instagram"),
                eq(socialAccounts.isActive, true),
                inArray(socialAccounts.providerAccountId, accountCandidates)
            )
        )
        .limit(1);

    const account = accounts[0];
    if (!account) {
        console.log("[instagram webhook] No connected account found", {
            accountCandidates,
            postId: event.postId,
            commentId: event.comment.id,
        });
        return {
            status: "skipped" as const,
            reason: "SOCIAL_ACCOUNT_NOT_FOUND",
        };
    }

    if (
        event.comment.userId === account.providerAccountId ||
        (event.comment.username &&
            account.username &&
            event.comment.username.toLowerCase() === account.username.toLowerCase())
    ) {
        return {
            status: "skipped" as const,
            reason: "SELF_COMMENT",
        };
    }

    const result = await processCommentAutomationEvent({
        socialAccountId: account.id,
        platform: "instagram",
        postId: event.postId,
        comment: event.comment,
    });

    return {
        status: "processed" as const,
        socialAccountId: account.id,
        ...result,
    };
}

export async function processInstagramWebhookPayload(payload: unknown): Promise<{
    commentsProcessed: number;
    results: InstagramWebhookProcessResult[];
}> {
    const commentEvents = parseInstagramCommentWebhook(payload);
    const results: InstagramWebhookProcessResult[] = [];

    for (const event of commentEvents) {
        const stored = await storeWebhookEvent({
            eventId: event.eventId,
            platform: "instagram",
            eventType: "comment.received",
            payload: {
                entryId: event.entryId,
                field: event.field,
                recipientId: event.recipientId,
                postId: event.postId,
                parentId: event.parentId,
                mediaProductType: event.mediaProductType,
                comment: event.comment,
            },
        });

        if (!stored) {
            console.log("[Instagram Webhook] Duplicate comment event skipped", {
                eventId: event.eventId,
            });
            results.push({ eventId: event.eventId, status: "duplicate" });
            continue;
        }

        await updateWebhookStatus(event.eventId, "processing");

        try {
            const result = await processInstagramCommentWebhookEvent(event);
            if (result.status === "skipped") {
                await updateWebhookStatus(event.eventId, "skipped", result.reason);
                results.push({
                    eventId: event.eventId,
                    status: "skipped",
                    reason: result.reason,
                });
                continue;
            }

            await updateWebhookStatus(event.eventId, "completed");
            results.push({
                eventId: event.eventId,
                status: "completed",
                matchedAutomations: result.matchedAutomations,
                executedAutomations: result.executedAutomations,
                skippedAutomations: result.skippedAutomations,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
            console.error("[Instagram Webhook] Comment event failed", {
                eventId: event.eventId,
                error: message,
            });
            await updateWebhookStatus(event.eventId, "failed", message);
            results.push({
                eventId: event.eventId,
                status: "failed",
                error: message,
            });
        }
    }

    if (commentEvents.length === 0) {
        console.log("[Instagram Webhook] No comment events to process");
    }

    return {
        commentsProcessed: results.length,
        results,
    };
}
