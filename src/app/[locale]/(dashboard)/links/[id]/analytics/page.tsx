"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LinkAnalytics } from "@/components/link-analytics";
import { ArrowLeft, ExternalLink, Download, Loader2 } from "lucide-react";

interface LinkInfo {
    id: string;
    originalUrl: string;
    slug: string;
    clickCount: number;
    createdAt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

type Preset = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export default function LinkAnalyticsPage() {
    const t = useTranslations("linkAnalytics");
    const tc = useTranslations("common");
    const router = useRouter();
    const params = useParams();
    const linkId = params.id as string;

    const [link, setLink] = useState<LinkInfo | null>(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("30d");
    const [downloading, setDownloading] = useState(false);

    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/l/${link?.slug || ""}`;

    useEffect(() => {
        if (!linkId) return;
        let cancelled = false;

        async function loadLink() {
            try {
                const res = await fetch(`/api/links/${linkId}`);
                const data = await res.json();
                if (!cancelled && data.data?.link) {
                    setLink(data.data.link);
                }
            } catch {
                // silently fail
            }
        }

        async function loadAnalytics() {
            if (!cancelled) setLoading(true);
            try {
                const url = `/api/links/${linkId}/analytics?preset=${preset}`;
                const res = await fetch(url);
                const data = await res.json();
                if (!cancelled && data.data?.analytics) {
                    setAnalytics(data.data.analytics);
                }
            } catch {
                if (!cancelled) toast.error(tc("error"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadLink();
        loadAnalytics();

        return () => { cancelled = true; };
    }, [linkId, preset, tc]);

    async function handleDownload() {
        setDownloading(true);
        try {
            const url = `/api/links/export?linkId=${linkId}&preset=${preset}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `analytics-${link?.slug || linkId}-${preset}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success(t("downloadSuccess"));
        } catch {
            toast.error(t("downloadError"));
        } finally {
            setDownloading(false);
        }
    }

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
                <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => router.push("/links")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">
                        {t("title")}
                    </h1>
                    {link && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <a
                                href={shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                                {shortUrl.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {link.originalUrl}
                            </span>
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-2"
                    onClick={handleDownload}
                    disabled={downloading || loading}
                >
                    {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {t("downloadCsv")}
                </Button>
            </motion.div>

            {/* Date Range */}
            <motion.div variants={itemVariants}>
                <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
                    <TabsList className="rounded-xl flex-wrap h-auto gap-1">
                        <TabsTrigger value="24h" className="rounded-lg cursor-pointer">
                            {t("last24h")}
                        </TabsTrigger>
                        <TabsTrigger value="7d" className="rounded-lg cursor-pointer">
                            {t("last7Days")}
                        </TabsTrigger>
                        <TabsTrigger value="30d" className="rounded-lg cursor-pointer">
                            {t("last30Days")}
                        </TabsTrigger>
                        <TabsTrigger value="90d" className="rounded-lg cursor-pointer">
                            {t("last90Days")}
                        </TabsTrigger>
                        <TabsTrigger value="1y" className="rounded-lg cursor-pointer">
                            {t("lastYear")}
                        </TabsTrigger>
                        <TabsTrigger value="all" className="rounded-lg cursor-pointer">
                            {t("allTime")}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Analytics */}
            <motion.div variants={itemVariants}>
                <LinkAnalytics analytics={analytics} loading={loading} />
            </motion.div>
        </motion.div>
    );
}
