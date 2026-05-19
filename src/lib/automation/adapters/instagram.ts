import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import type { AutomationPlatform, PlatformComment } from "../types";

const GRAPH_API_BASE = "https://graph.instagram.com";
const API_VERSION = "v25.0";

export interface InstagramAutomationAdapter {
    platform: AutomationPlatform;
    fetchComments(
        socialAccountId: string,
        postId: string,
        since?: Date
    ): Promise<PlatformComment[]>;
    replyToComment(
        socialAccountId: string,
        commentId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }>;
    sendDM(
        socialAccountId: string,
        userId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }>;
}

export const instagramAdapter: InstagramAutomationAdapter = {
    platform: "instagram",

    async fetchComments(
        socialAccountId: string,
        postId: string,
        since?: Date
    ): Promise<PlatformComment[]> {
        const account = await db
            .select()
            .from(socialAccounts)
            .where(eq(socialAccounts.id, socialAccountId))
            .limit(1);

        if (!account[0]) throw new Error("Social account not found");
        if (!account[0].accessToken) throw new Error("No access token");

        const accessToken = await decrypt(account[0].accessToken);
        const url = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${postId}/comments`);
        url.searchParams.set("fields", "id,text,username,timestamp");
        url.searchParams.set("access_token", accessToken);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.error) {
            throw new Error(`Failed to fetch comments: ${data.error.message}`);
        }

        const comments: PlatformComment[] = (data.data || []).map(
            (c: Record<string, string>) => ({
                id: c.id,
                text: c.text,
                username: c.username,
                timestamp: c.timestamp,
            })
        );

        if (since) {
            return comments.filter((c) => new Date(c.timestamp) > since);
        }
        return comments;
    },

    async replyToComment(
        socialAccountId: string,
        commentId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const account = await db
                .select()
                .from(socialAccounts)
                .where(eq(socialAccounts.id, socialAccountId))
                .limit(1);

            if (!account[0]?.accessToken) {
                return { success: false, error: "No access token" };
            }

            const accessToken = await decrypt(account[0].accessToken);
            const url = new URL(
                `${GRAPH_API_BASE}/${API_VERSION}/${commentId}/replies`
            );
            url.searchParams.set("message", message);
            url.searchParams.set("access_token", accessToken);

            const res = await fetch(url.toString(), { method: "POST" });
            const data = await res.json();

            if (data.error) {
                return { success: false, error: data.error.message };
            }

            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
            };
        }
    },

    async sendDM(
        socialAccountId: string,
        userId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const account = await db
                .select()
                .from(socialAccounts)
                .where(eq(socialAccounts.id, socialAccountId))
                .limit(1);

            if (!account[0]?.accessToken) {
                return { success: false, error: "No access token" };
            }

            const accessToken = await decrypt(account[0].accessToken);
            const url = new URL(
                `${GRAPH_API_BASE}/${API_VERSION}/me/messages`
            );

            const body = {
                recipient: { id: userId },
                message: { text: message },
            };

            const res = await fetch(url.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (data.error) {
                console.error("[instagram DM] API error:", data.error);
                return { success: false, error: data.error.message };
            }

            return { success: true };
        } catch (err) {
            console.error("[instagram DM] Exception:", err);
            return {
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
            };
        }
    },
};
