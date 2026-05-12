import { z } from "zod";

export const triggerConfigSchema = z.object({
    keywords: z.array(z.string().min(1).max(100)).min(1).max(50),
    matchMode: z.enum(["exact", "contains"]).default("contains"),
    caseSensitive: z.boolean().default(false),
});

export const automationScopeSchema = z.object({
    posts: z.enum(["all", "specific"]).default("all"),
    postIds: z.array(z.string()).optional(),
});

export const actionConfigSchema = z.object({
    messages: z.array(z.string().min(1).max(2000)).min(1).max(20),
});

export const actionSchema = z.object({
    type: z.enum(["reply_comment", "send_dm"]),
    config: actionConfigSchema,
    order: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});

export const automationSchema = z.object({
    name: z.string().min(1).max(100),
    socialAccountId: z.string().uuid(),
    platform: z.enum(["instagram", "tiktok", "youtube", "x"]),
    triggerType: z.enum(["comment_keyword"]).default("comment_keyword"),
    triggerConfig: triggerConfigSchema,
    scope: automationScopeSchema,
    isActive: z.boolean().default(true),
});

export const updateAutomationSchema = automationSchema.partial();

export type AutomationInput = z.infer<typeof automationSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type TriggerConfigInput = z.infer<typeof triggerConfigSchema>;
