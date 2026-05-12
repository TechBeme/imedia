"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Activity } from "lucide-react";

interface Automation {
    id: string;
    name: string;
    socialAccountId: string;
    platform: string;
    triggerType: string;
    triggerConfig: {
        keywords: string[];
        matchMode: string;
        caseSensitive: boolean;
    };
    isActive: boolean;
    createdAt: string;
}

interface SocialAccount {
    id: string;
    platform: string;
    username: string | null;
}

export default function AutomationsPage() {
    const t = useTranslations("automations");
    const locale = useLocale();
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [autoRes, accRes] = await Promise.all([
                    fetch("/api/automations"),
                    fetch("/api/social-accounts"),
                ]);

                if (autoRes.ok) {
                    const autoData = await autoRes.json();
                    setAutomations(autoData.data?.automations || []);
                }
                if (accRes.ok) {
                    const accData = await accRes.json();
                    setAccounts(accData.data?.accounts || []);
                }
            } catch (err) {
                console.error("[automations page] load error:", err);
                toast.error("Failed to load automations");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const getAccountName = (accountId: string) => {
        const account = accounts.find((a) => a.id === accountId);
        return account?.username || account?.platform || "Unknown";
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
                <Link href="/automations/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("new")}
                    </Button>
                </Link>
            </div>

            {automations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            {t("noAutomations")}
                        </p>
                        <Link href="/automations/new" className="mt-4">
                            <Button>{t("createFirst")}</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {automations.map((automation) => (
                        <Card key={automation.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">
                                    {automation.name}
                                </CardTitle>
                                <Badge
                                    variant={
                                        automation.isActive
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {automation.isActive
                                        ? t("active")
                                        : t("inactive")}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {getAccountName(
                                            automation.socialAccountId
                                        )}{" "}
                                        ·{" "}
                                        {automation.triggerConfig?.keywords
                                            ?.length || 0}{" "}
                                        keywords
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/automations/${automation.id}/logs`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Activity className="mr-1 h-4 w-4" />
                                                Logs
                                            </Button>
                                        </Link>
                                        <Link
                                            href={`/automations/${automation.id}/edit`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Pencil className="mr-1 h-4 w-4" />
                                                {t("edit")}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
