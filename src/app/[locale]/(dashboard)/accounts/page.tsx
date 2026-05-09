"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
} from "react-icons/ri";

interface SocialAccount {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
    isActive: boolean;
}

const platformDefs = [
    {
        key: "instagram",
        name: "Instagram",
        icon: RiInstagramLine,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
    },
    {
        key: "facebook",
        name: "Facebook",
        icon: RiFacebookCircleLine,
        color: "text-blue-600",
        bgColor: "bg-blue-600/10",
    },
    {
        key: "threads",
        name: "Threads",
        icon: RiThreadsLine,
        color: "text-foreground",
        bgColor: "bg-muted",
    },
    {
        key: "youtube",
        name: "YouTube",
        icon: RiYoutubeLine,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
    },
    {
        key: "tiktok",
        name: "TikTok",
        icon: RiTiktokLine,
        color: "text-foreground",
        bgColor: "bg-muted",
    },
    {
        key: "x",
        name: "X (Twitter)",
        icon: RiTwitterXLine,
        color: "text-foreground",
        bgColor: "bg-muted",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccountsPage() {
    const t = useTranslations("accounts");
    const tc = useTranslations("common");
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchAccounts() {
        try {
            const res = await fetch("/api/social-accounts");
            const data = await res.json();
            if (data.accounts) {
                setAccounts(data.accounts);
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    async function handleConnect(platform: string) {
        if (platform !== "instagram") return;
        setConnecting(platform);

        try {
            const res = await fetch("/api/instagram/auth");
            const data = await res.json();
            const url = data.data?.url;
            if (url) {
                window.location.href = url;
            } else {
                toast.error(data.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setConnecting(null);
        }
    }

    async function handleDisconnect(platform: string) {
        if (platform !== "instagram") return;

        try {
            const res = await fetch("/api/instagram/disconnect", { method: "POST" });
            if (res.ok) {
                toast.success(t("disconnectSuccess"));
                fetchAccounts();
            } else {
                toast.error(t("disconnectFailed"));
            }
        } catch {
            toast.error(tc("error"));
        }
    }

    function getAccount(platform: string): SocialAccount | undefined {
        return accounts.find((a) => a.platform === platform);
    }

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {platformDefs.map((platform) => {
                    const Icon = platform.icon;
                    const account = getAccount(platform.key);
                    const connected = !!account && account.isActive;

                    return (
                        <motion.div
                            key={platform.key}
                            variants={itemVariants}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <Card className="glass-card transition-shadow duration-200 hover:shadow-md">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${platform.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold">{platform.name}</p>
                                                {connected && account?.username && (
                                                    <p className="text-xs text-muted-foreground">@{account.username}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={connected ? "default" : "secondary"}
                                            className={connected ? "bg-emerald-500 hover:bg-emerald-600 rounded-lg" : "rounded-lg"}
                                        >
                                            {connected ? t("connected") : t("connect")}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant={connected ? "outline" : "default"}
                                        size="sm"
                                        className="w-full rounded-xl cursor-pointer shadow-sm"
                                        disabled={platform.key !== "instagram" || loading || connecting === platform.key}
                                        onClick={() =>
                                            connected
                                                ? handleDisconnect(platform.key)
                                                : handleConnect(platform.key)
                                        }
                                    >
                                        {connecting === platform.key ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : connected ? (
                                            t("disconnect")
                                        ) : (
                                            t("connect")
                                        )}
                                    </Button>
                                    {platform.key !== "instagram" && (
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            {t("comingSoon")}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>


        </motion.div>
    );
}
