export type AutomationPlatform = "instagram" | "tiktok" | "youtube" | "x";
export type TriggerType = "comment_keyword";
export type ActionType = "reply_comment" | "send_dm";
export type MatchMode = "exact" | "contains";
export type LogStatus = "success" | "partial" | "failed";
export type ActionResultStatus = "success" | "failed" | "skipped";

export interface TriggerConfig {
    keywords: string[];
    matchMode: MatchMode;
    caseSensitive: boolean;
}

export interface AutomationScope {
    posts: "all" | "specific";
    postIds?: string[];
}

export interface ActionConfig {
    messages: string[];
}

export interface AutomationActionResult {
    actionId: string;
    status: ActionResultStatus;
    output?: string;
    error?: string;
}

export interface TriggerEvent {
    type: string;
    payload: Record<string, unknown>;
}

export interface PlatformComment {
    id: string;
    text: string;
    username: string;
    timestamp: string;
    userId?: string;
}
