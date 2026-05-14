"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, notFound } from "next/navigation";
import { AutomationForm } from "@/components/automation/automation-form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AutomationSocialAccount {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
}

interface AutomationData {
    automation: {
        id: string;
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
    };
    actions: Array<{
        type: "reply_comment" | "send_dm";
        config: { messages: string[] };
        isActive: boolean;
    }>;
}

export default function EditAutomationPage() {
    const t = useTranslations("automations");
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<AutomationData | null>(null);
    const [accounts, setAccounts] = useState<AutomationSocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [autoRes, accRes] = await Promise.all([
                    fetch(`/api/automations/${id}`),
                    fetch("/api/social-accounts"),
                ]);

                if (!autoRes.ok) {
                    setData(null);
                    return;
                }

                const autoData = await autoRes.json();
                setData(autoData.data);

                if (accRes.ok) {
                    const accData = await accRes.json();
                    setAccounts(accData.data?.accounts || []);
                }
            } catch (err) {
                console.error("[edit automation] load error:", err);
                toast.error("Failed to load automation");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!data?.automation) {
        return notFound();
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <h1 className="text-2xl font-bold">{t("edit")}</h1>
            <AutomationForm
                accounts={accounts}
                initialData={{
                    id: data.automation.id,
                    name: data.automation.name,
                    socialAccountId: data.automation.socialAccountId,
                    triggerConfig: data.automation.triggerConfig,
                    scope: data.automation.scope,
                    actions: data.actions || [],
                }}
            />
        </div>
    );
}
