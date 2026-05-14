"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function NewAutomationPage() {
    const t = useTranslations("automations");
    const [accounts, setAccounts] = useState<AutomationSocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/social-accounts");
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data.data?.accounts || []);
                }
            } catch (err) {
                console.error("[new automation] load error:", err);
                toast.error("Failed to load accounts");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

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

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <h1 className="text-2xl font-bold">{t("new")}</h1>
            <AutomationForm accounts={accounts} />
        </div>
    );
}
