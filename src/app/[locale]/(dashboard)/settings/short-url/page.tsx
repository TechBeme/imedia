"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ExternalLink, Link2, AlertTriangle } from "lucide-react";

interface UserSettings {
    defaultExpiredRedirectUrl: string;
    notFoundRedirectUrl: string;
}

export default function ShortUrlSettingsPage() {
    const t = useTranslations("links.settings");
    const tc = useTranslations("common");
    const [settings, setSettings] = useState<UserSettings>({
        defaultExpiredRedirectUrl: "",
        notFoundRedirectUrl: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/user/settings");
            const data = await res.json();
            if (res.ok && data.data) {
                setSettings({
                    defaultExpiredRedirectUrl: data.data.defaultExpiredRedirectUrl || "",
                    notFoundRedirectUrl: data.data.notFoundRedirectUrl || "",
                });
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }, [tc]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            const body: Record<string, unknown> = {};
            if (settings.defaultExpiredRedirectUrl.trim()) {
                body.defaultExpiredRedirectUrl = settings.defaultExpiredRedirectUrl.trim();
            } else {
                body.defaultExpiredRedirectUrl = null;
            }
            if (settings.notFoundRedirectUrl.trim()) {
                body.notFoundRedirectUrl = settings.notFoundRedirectUrl.trim();
            } else {
                body.notFoundRedirectUrl = null;
            }

            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(t("saveSuccess"));
            } else {
                toast.error(result.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-6 max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <div>
                <h1 className="text-2xl font-semibold tracking-tight font-heading flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    {t("title")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("description")}</p>
            </div>

            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        {t("redirects")}
                    </CardTitle>
                    <CardDescription>{t("redirectsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="defaultExpiredRedirectUrl" className="flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            {t("defaultExpiredRedirectUrl")}
                        </Label>
                        <Input
                            id="defaultExpiredRedirectUrl"
                            type="url"
                            placeholder="https://example.com/expired"
                            value={settings.defaultExpiredRedirectUrl}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    defaultExpiredRedirectUrl: e.target.value,
                                }))
                            }
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("defaultExpiredRedirectUrlHelp")}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notFoundRedirectUrl" className="flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("notFoundRedirectUrl")}
                        </Label>
                        <Input
                            id="notFoundRedirectUrl"
                            type="url"
                            placeholder="https://example.com/not-found"
                            value={settings.notFoundRedirectUrl}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    notFoundRedirectUrl: e.target.value,
                                }))
                            }
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("notFoundRedirectUrlHelp")}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() =>
                        setSettings({
                            defaultExpiredRedirectUrl: "",
                            notFoundRedirectUrl: "",
                        })
                    }
                    disabled={saving}
                    className="rounded-xl"
                >
                    {tc("reset")}
                </Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl shadow-sm">
                    {saving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                        tc("save")
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
