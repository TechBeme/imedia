"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TriggerConfig } from "./trigger-config";
import { ActionConfig } from "./action-config";
import { toast } from "sonner";

interface SocialAccount {
    id: string;
    platform: string;
    username: string | null;
}

interface AutomationFormProps {
    accounts: SocialAccount[];
    initialData?: {
        id?: string;
        name: string;
        socialAccountId: string;
        triggerConfig: {
            keywords: string[];
            matchMode: "exact" | "contains";
            caseSensitive: boolean;
        };
        scope: {
            posts: "all" | "specific";
            postIds?: string[];
        };
        actions: Array<{
            type: "reply_comment" | "send_dm";
            config: { messages: string[] };
            isActive: boolean;
        }>;
    };
}

export function AutomationForm({
    accounts,
    initialData,
}: AutomationFormProps) {
    const t = useTranslations("automations");
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState(initialData?.name || "");
    const [socialAccountId, setSocialAccountId] = useState(
        initialData?.socialAccountId || ""
    );
    const [keywords, setKeywords] = useState<string[]>(
        initialData?.triggerConfig.keywords || []
    );
    const [matchMode, setMatchMode] = useState<"exact" | "contains">(
        initialData?.triggerConfig.matchMode || "contains"
    );
    const [caseSensitive, setCaseSensitive] = useState(
        initialData?.triggerConfig.caseSensitive || false
    );

    const replyAction = initialData?.actions.find(
        (a) => a.type === "reply_comment"
    );
    const [replyMessages, setReplyMessages] = useState<string[]>(
        replyAction?.config.messages || [""]
    );
    const [replyEnabled, setReplyEnabled] = useState(
        replyAction?.isActive ?? true
    );

    const dmAction = initialData?.actions.find((a) => a.type === "send_dm");
    const [dmMessages, setDmMessages] = useState<string[]>(
        dmAction?.config.messages || [""]
    );
    const [dmEnabled, setDmEnabled] = useState(dmAction?.isActive ?? false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const account = accounts.find((a) => a.id === socialAccountId);
            if (!account) {
                toast.error(t("selectAccount"));
                setIsSubmitting(false);
                return;
            }

            const automationPayload = {
                name,
                socialAccountId,
                platform: account.platform,
                triggerType: "comment_keyword" as const,
                triggerConfig: {
                    keywords,
                    matchMode,
                    caseSensitive,
                },
                scope: {
                    posts: "all" as const,
                },
                isActive: true,
            };

            const url = initialData?.id
                ? `/api/automations/${initialData.id}`
                : "/api/automations";
            const method = initialData?.id ? "PUT" : "POST";

            const autoRes = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(automationPayload),
            });

            const autoData = await autoRes.json();
            if (!autoRes.ok) {
                toast.error(
                    autoData.error?.message || "Failed to save automation"
                );
                setIsSubmitting(false);
                return;
            }

            const automationId = initialData?.id || autoData.data?.automation?.id;

            // Build actions list
            const actions = [];
            if (replyEnabled && replyMessages.some((m) => m.trim())) {
                actions.push({
                    type: "reply_comment" as const,
                    config: { messages: replyMessages.filter((m) => m.trim()) },
                    order: 0,
                    isActive: true,
                });
            }
            if (dmEnabled && dmMessages.some((m) => m.trim())) {
                actions.push({
                    type: "send_dm" as const,
                    config: { messages: dmMessages.filter((m) => m.trim()) },
                    order: 1,
                    isActive: true,
                });
            }

            // For new automations, create actions
            if (!initialData?.id && automationId) {
                for (const action of actions) {
                    await fetch(`/api/automations/${automationId}/actions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(action),
                    });
                }
            }

            toast.success(
                initialData?.id ? "Automation updated" : "Automation created"
            );
            router.push("/automations");
            router.refresh();
        } catch (err) {
            toast.error("Something went wrong");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>{t("account")}</Label>
                <Select
                    value={socialAccountId}
                    onValueChange={(v) => setSocialAccountId(v || "")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t("selectAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.username || account.platform} (
                                {account.platform})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <TriggerConfig
                keywords={keywords}
                onKeywordsChange={setKeywords}
                matchMode={matchMode}
                onMatchModeChange={setMatchMode}
                caseSensitive={caseSensitive}
                onCaseSensitiveChange={setCaseSensitive}
            />

            <div className="space-y-4">
                <h3 className="font-semibold">{t("actions.title")}</h3>
                <ActionConfig
                    type="reply_comment"
                    title={t("actions.replyComment")}
                    messages={replyMessages}
                    onMessagesChange={setReplyMessages}
                    isActive={replyEnabled}
                    onIsActiveChange={setReplyEnabled}
                />
                <ActionConfig
                    type="send_dm"
                    title={t("actions.sendDM")}
                    messages={dmMessages}
                    onMessagesChange={setDmMessages}
                    isActive={dmEnabled}
                    onIsActiveChange={setDmEnabled}
                />
            </div>

            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("saving") : t("save")}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/automations")}
                >
                    {t("cancel")}
                </Button>
            </div>
        </form>
    );
}
