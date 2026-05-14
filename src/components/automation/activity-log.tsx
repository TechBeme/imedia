"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

interface ActionResult {
    actionId: string;
    status: "success" | "failed" | "skipped";
    output?: string;
    error?: string;
}

interface TriggerEvent {
    type: string;
    payload: {
        commentId?: string;
        text?: string;
        username?: string;
        postId?: string;
        platform?: string;
    };
}

interface LogEntry {
    id: string;
    automationId: string;
    triggerEvent: TriggerEvent;
    actionResults: ActionResult[];
    status: "success" | "partial" | "failed";
    executedAt: string;
}

interface ActivityLogProps {
    logs: LogEntry[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
    const t = useTranslations("automations.logs");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "success":
                return "default";
            case "partial":
                return "secondary";
            case "failed":
                return "destructive";
            default:
                return "secondary";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "success":
                return t("success");
            case "partial":
                return t("partial");
            case "failed":
                return t("failed");
            default:
                return status;
        }
    };

    if (logs.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">{t("noLogs")}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <Card key={log.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium">
                                    {t("commentFrom")} @
                                    {log.triggerEvent.payload.username ||
                                        "unknown"}
                                </CardTitle>
                                <Badge variant={getStatusVariant(log.status)}>
                                    {getStatusLabel(log.status)}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(log.executedAt), "PPp")}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            &ldquo;{log.triggerEvent.payload.text || ""}&rdquo;
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                setExpandedId(
                                    expandedId === log.id ? null : log.id
                                )
                            }
                        >
                            {expandedId === log.id ? (
                                <>
                                    <ChevronUp className="mr-1 h-4 w-4" />
                                    {t("hideDetails")}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="mr-1 h-4 w-4" />
                                    {t("viewDetails")}
                                </>
                            )}
                        </Button>

                        {expandedId === log.id && (
                            <div className="mt-4 space-y-3">
                                <div className="text-sm">
                                    <span className="font-medium">
                                        {t("trigger")}:
                                    </span>{" "}
                                    {log.triggerEvent.type}
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">
                                        {t("actions")}:
                                    </span>
                                    {log.actionResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2 rounded-md border p-3"
                                        >
                                            <div className="mt-0.5">
                                                <MessageCircle className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {result.actionId}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            result.status ===
                                                                "success"
                                                                ? "default"
                                                                : result.status ===
                                                                    "skipped"
                                                                    ? "secondary"
                                                                    : "destructive"
                                                        }
                                                    >
                                                        {result.status}
                                                    </Badge>
                                                </div>
                                                {result.error && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {result.error}
                                                    </p>
                                                )}
                                                {result.output && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {result.output}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
