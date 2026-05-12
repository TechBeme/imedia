"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { ActivityLog } from "@/components/automation/activity-log";
import { toast } from "sonner";

interface Automation {
    id: string;
    name: string;
}

interface LogEntry {
    id: string;
    automationId: string;
    triggerEvent: {
        type: string;
        payload: {
            commentId?: string;
            text?: string;
            username?: string;
            postId?: string;
            platform?: string;
        };
    };
    actionResults: Array<{
        actionId: string;
        status: "success" | "failed" | "skipped";
        output?: string;
        error?: string;
    }>;
    status: "success" | "partial" | "failed";
    executedAt: string;
}

export default function AutomationLogsPage() {
    const t = useTranslations("automations.logs");
    const params = useParams();
    const id = params.id as string;
    const [automation, setAutomation] = useState<Automation | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [autoRes, logsRes] = await Promise.all([
                    fetch(`/api/automations/${id}`),
                    fetch(`/api/automations/${id}/logs`),
                ]);

                if (autoRes.ok) {
                    const autoData = await autoRes.json();
                    setAutomation(autoData.data?.automation || null);
                }
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    setLogs(logsData.data?.logs || []);
                }
            } catch (err) {
                console.error("[logs page] load error:", err);
                toast.error("Failed to load logs");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-48" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/automations">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{t("title")}</h1>
                    {automation && (
                        <p className="text-sm text-muted-foreground">
                            {automation.name}
                        </p>
                    )}
                </div>
            </div>

            <ActivityLog logs={logs} />
        </div>
    );
}
