export function generateStaticParams() {
    return [{ locale: "pt-BR" }, { locale: "en" }, { locale: "es" }];
}

"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
} from "react-icons/ri";

const platforms = [
    {
        key: "instagram",
        name: "Instagram",
        icon: RiInstagramLine,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        connected: true,
        username: "@yourhandle",
    },
    {
        key: "facebook",
        name: "Facebook",
        icon: RiFacebookCircleLine,
        color: "text-blue-600",
        bgColor: "bg-blue-600/10",
        connected: false,
    },
    {
        key: "threads",
        name: "Threads",
        icon: RiThreadsLine,
        color: "text-foreground",
        bgColor: "bg-muted",
        connected: false,
    },
    {
        key: "youtube",
        name: "YouTube",
        icon: RiYoutubeLine,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        connected: false,
    },
    {
        key: "tiktok",
        name: "TikTok",
        icon: RiTiktokLine,
        color: "text-foreground",
        bgColor: "bg-muted",
        connected: false,
    },
    {
        key: "x",
        name: "X (Twitter)",
        icon: RiTwitterXLine,
        color: "text-foreground",
        bgColor: "bg-muted",
        connected: false,
    },
];

export default function AccountsPage() {
    const t = useTranslations("accounts");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">Manage your social media connections</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                        <Card key={platform.key} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg ${platform.bgColor} flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 ${platform.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{platform.name}</CardTitle>
                                            {platform.connected && platform.username && (
                                                <CardDescription>{platform.username}</CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={platform.connected ? "default" : "secondary"}>
                                        {platform.connected ? t("connected") : t("connect")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant={platform.connected ? "outline" : "default"}
                                    size="sm"
                                    className="w-full"
                                    disabled={platform.key !== "instagram"}
                                >
                                    {platform.connected ? t("disconnect") : t("connect")}
                                </Button>
                                {platform.key !== "instagram" && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Coming soon
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
