import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialAccounts, platformPosts, automations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { getAdapter } from "@/lib/automation/adapters";
import {
    matchCommentToAutomations,
    executeAutomation,
    updateCommentWatchState,
    checkCooldown,
    selectRandomResponse,
} from "@/lib/automation/engine";
import type {
    AutomationActionResult,
    PlatformComment,
} from "@/lib/automation/types";

/**
 * Vercel Cron: Poll Instagram comments and execute matching automations
 * Schedule: every 2 minutes
 */
export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Array<{
        accountId: string;
        postId: string;
        commentsChecked: number;
        automationsTriggered: number;
        errors: string[];
    }> = [];

    try {
        // Find all active Instagram accounts with automations
        const activeAccounts = await db
            .selectDistinct({
                socialAccountId: automations.socialAccountId,
            })
            .from(automations)
            .where(
                and(
                    eq(automations.platform, "instagram"),
                    eq(automations.isActive, true)
                )
            );

        for (const { socialAccountId } of activeAccounts) {
            const account = await db
                .select()
                .from(socialAccounts)
                .where(eq(socialAccounts.id, socialAccountId))
                .limit(1);

            if (!account[0] || !account[0].isActive || !account[0].accessToken) {
                continue;
            }

            const accessToken = await decrypt(account[0].accessToken);
            const igUserId = account[0].providerAccountId;

            // Fetch user's posts
            const { fetchUserMedia } = await import("@/lib/instagram");
            const media = await fetchUserMedia(accessToken, igUserId, 25);

            const accountResult = {
                accountId: socialAccountId,
                postId: "",
                commentsChecked: 0,
                automationsTriggered: 0,
                errors: [] as string[],
            };

            for (const post of media) {
                accountResult.postId = post.id;

                try {
                    const adapter = getAdapter("instagram");
                    if (!adapter) {
                        accountResult.errors.push("No adapter for instagram");
                        continue;
                    }

                    const comments = await adapter.fetchComments(
                        socialAccountId,
                        post.id
                    );

                    accountResult.commentsChecked += comments.length;

                    for (const comment of comments) {
                        const matched = await matchCommentToAutomations(
                            socialAccountId,
                            comment.text,
                            post.id
                        );

                        for (const { automation, actions } of matched) {
                            // Check cooldown
                            const onCooldown = await checkCooldown(
                                automation.id,
                                comment.username,
                                60
                            );
                            if (onCooldown) {
                                continue;
                            }

                            // Build action handlers
                            const actionHandlers: Record<
                                string,
                                (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    action: any,
                                    cmt: PlatformComment
                                ) => Promise<AutomationActionResult>
                            > = {
                                reply_comment: async (action, cmt) => {
                                    const config = action.config as {
                                        messages: string[];
                                    };
                                    const message = selectRandomResponse(
                                        config.messages
                                    );
                                    const result = await adapter.replyToComment(
                                        socialAccountId,
                                        cmt.id,
                                        message
                                    );
                                    return {
                                        actionId: action.id,
                                        status: result.success
                                            ? "success"
                                            : "failed",
                                        output: result.success
                                            ? message
                                            : undefined,
                                        error: result.error,
                                    };
                                },
                                send_dm: async (action, _cmt) => {
                                    const result = await adapter.sendDM(
                                        socialAccountId,
                                        comment.userId || "",
                                        ""
                                    );
                                    return {
                                        actionId: action.id,
                                        status: "skipped",
                                        error: result.error,
                                    };
                                },
                            };

                            await executeAutomation(
                                automation.id,
                                comment,
                                post.id,
                                actionHandlers
                            );
                            accountResult.automationsTriggered++;
                        }
                    }

                    // Update watch state
                    const lastComment = comments[comments.length - 1];
                    await updateCommentWatchState(
                        socialAccountId,
                        post.id,
                        lastComment?.id
                    );
                } catch (err) {
                    const msg =
                        err instanceof Error ? err.message : String(err);
                    accountResult.errors.push(msg);
                    console.error(
                        `[cron] Error processing post ${post.id}:`,
                        err
                    );
                }
            }

            results.push(accountResult);
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        });
    } catch (err) {
        console.error("[cron] Automation comments error:", err);
        return NextResponse.json(
            { error: "Internal error", details: String(err) },
            { status: 500 }
        );
    }
}
