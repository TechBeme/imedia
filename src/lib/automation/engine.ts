import { db } from "@/db";
import {
    automations,
    automationActions,
    automationLogs,
    commentWatchState,
} from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import type {
    TriggerConfig,
    TriggerEvent,
    AutomationActionResult,
    LogStatus,
    PlatformComment,
} from "./types";

/**
 * Check if a comment text matches the trigger configuration
 */
export function matchesKeyword(
    commentText: string,
    triggerConfig: TriggerConfig
): boolean {
    if (!triggerConfig.keywords || triggerConfig.keywords.length === 0) {
        return false;
    }

    const text = triggerConfig.caseSensitive
        ? commentText
        : commentText.toLowerCase();

    return triggerConfig.keywords.some((keyword) => {
        const kw = triggerConfig.caseSensitive
            ? keyword
            : keyword.toLowerCase();

        if (triggerConfig.matchMode === "exact") {
            return text.trim() === kw.trim();
        }

        // contains mode
        return text.includes(kw);
    });
}

/**
 * Select a random response from a list of messages
 */
export function selectRandomResponse(messages: string[]): string {
    if (!messages || messages.length === 0) {
        return "";
    }
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
}

/**
 * Find all active automations that match a given comment
 */
export async function matchCommentToAutomations(
    socialAccountId: string,
    commentText: string,
    postId?: string
) {
    const activeAutomations = await db
        .select()
        .from(automations)
        .where(
            and(
                eq(automations.socialAccountId, socialAccountId),
                eq(automations.isActive, true)
            )
        );

    const matched: Array<{
        automation: typeof automations.$inferSelect;
        actions: Array<typeof automationActions.$inferSelect>;
    }> = [];

    for (const automation of activeAutomations) {
        const triggerConfig = automation.triggerConfig as TriggerConfig;

        // Check scope
        const scope = automation.scope as { posts: "all" | "specific"; postIds?: string[] };
        if (scope.posts === "specific" && postId) {
            if (!scope.postIds || !scope.postIds.includes(postId)) {
                continue;
            }
        }

        // Check keyword match
        if (matchesKeyword(commentText, triggerConfig)) {
            const actions = await db
                .select()
                .from(automationActions)
                .where(
                    and(
                        eq(automationActions.automationId, automation.id),
                        eq(automationActions.isActive, true)
                    )
                )
                .orderBy(automationActions.order);

            matched.push({ automation, actions });
        }
    }

    return matched;
}

/**
 * Log an automation execution
 */
export async function logAutomationExecution(
    automationId: string,
    triggerEvent: TriggerEvent,
    actionResults: AutomationActionResult[]
): Promise<void> {
    const hasSuccess = actionResults.some((r) => r.status === "success");
    const hasFailed = actionResults.some((r) => r.status === "failed");

    let status: LogStatus = "success";
    if (hasFailed && hasSuccess) {
        status = "partial";
    } else if (hasFailed && !hasSuccess) {
        status = "failed";
    }

    await db.insert(automationLogs).values({
        automationId,
        triggerEvent,
        actionResults,
        status,
    });
}

/**
 * Check if a user identifier is within cooldown for an automation
 * Default cooldown: 60 minutes
 */
export async function checkCooldown(
    automationId: string,
    userIdentifier: string,
    cooldownMinutes = 60
): Promise<boolean> {
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recentLogs = await db
        .select()
        .from(automationLogs)
        .where(
            and(
                eq(automationLogs.automationId, automationId),
                gte(automationLogs.executedAt, cutoff)
            )
        )
        .orderBy(desc(automationLogs.executedAt));

    // Check if this user triggered recently
    return recentLogs.some((log) => {
        const payload = log.triggerEvent.payload as {
            username?: string;
            userId?: string;
        };
        return (
            payload.username === userIdentifier ||
            payload.userId === userIdentifier
        );
    });
}

/**
 * Execute an automation against a comment
 */
export async function executeAutomation(
    automationId: string,
    comment: PlatformComment,
    postId: string,
    actionHandlers: Record<
        string,
        (
            action: typeof automationActions.$inferSelect,
            comment: PlatformComment
        ) => Promise<AutomationActionResult>
    >
): Promise<AutomationActionResult[]> {
    const actions = await db
        .select()
        .from(automationActions)
        .where(
            and(
                eq(automationActions.automationId, automationId),
                eq(automationActions.isActive, true)
            )
        )
        .orderBy(automationActions.order);

    const results: AutomationActionResult[] = [];

    for (const action of actions) {
        const handler = actionHandlers[action.type];
        if (!handler) {
            results.push({
                actionId: action.id,
                status: "skipped",
                error: `No handler for action type: ${action.type}`,
            });
            continue;
        }

        try {
            const result = await handler(action, comment);
            results.push(result);
        } catch (err) {
            results.push({
                actionId: action.id,
                status: "failed",
                error: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }

    // Log execution
    await logAutomationExecution(automationId, {
        type: "comment.received",
        payload: {
            commentId: comment.id,
            text: comment.text,
            username: comment.username,
            userId: comment.userId,
            postId,
            timestamp: comment.timestamp,
        },

    });

    return results;
}

/**
 * Update or create comment watch state for a post
 */
export async function updateCommentWatchState(
    socialAccountId: string,
    postId: string,
    lastCommentId?: string
): Promise<void> {
    const existing = await db
        .select()
        .from(commentWatchState)
        .where(
            and(
                eq(commentWatchState.socialAccountId, socialAccountId),
                eq(commentWatchState.postId, postId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(commentWatchState)
            .set({
                lastCheckedAt: new Date(),
                lastCommentId: lastCommentId ?? existing[0].lastCommentId,
            })
            .where(eq(commentWatchState.id, existing[0].id));
    } else {
        await db.insert(commentWatchState).values({
            socialAccountId,
            postId,
            lastCheckedAt: new Date(),
            lastCommentId,
        });
    }
}
