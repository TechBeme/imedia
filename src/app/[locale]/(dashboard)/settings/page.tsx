"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "motion/react";
import { User, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const t = useTranslations("settings");
    const tc = useTranslations("common");

    return (
        <motion.div
            className="space-y-6 max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
        >
            <div>
                <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
            </div>

            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold font-heading">{t("profile")}</CardTitle>
                            <CardDescription>{t("profileDescription")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">{t("name")}</Label>
                        <Input id="name" defaultValue="Your Name" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
                        <Input id="email" type="email" defaultValue="you@example.com" className="rounded-xl h-11" />
                    </div>
                    <Button
                        onClick={() => toast.success(tc("success"))}
                        className="rounded-xl h-11 cursor-pointer shadow-sm shadow-primary/20 gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {t("saveChanges")}
                    </Button>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold font-heading">{t("notifications")}</CardTitle>
                            <CardDescription>{t("notificationsDescription")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{t("emailNotifications")}</p>
                            <p className="text-xs text-muted-foreground">{t("emailNotificationsDesc")}</p>
                        </div>
                        <Switch checked={notifications} onCheckedChange={setNotifications} className="cursor-pointer" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{t("postPublished")}</p>
                            <p className="text-xs text-muted-foreground">{t("postPublishedDesc")}</p>
                        </div>
                        <Switch defaultChecked className="cursor-pointer" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{t("scheduledFailed")}</p>
                            <p className="text-xs text-muted-foreground">{t("scheduledFailedDesc")}</p>
                        </div>
                        <Switch defaultChecked className="cursor-pointer" />
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold font-heading">{t("security")}</CardTitle>
                            <CardDescription>{t("securityDescription")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current" className="text-sm font-medium">{t("currentPassword")}</Label>
                        <Input id="current" type="password" placeholder="••••••••" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new" className="text-sm font-medium">{t("newPassword")}</Label>
                        <Input id="new" type="password" placeholder="••••••••" className="rounded-xl h-11" />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => toast.success(tc("success"))}
                        className="rounded-xl h-11 cursor-pointer"
                    >
                        {t("updatePassword")}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
