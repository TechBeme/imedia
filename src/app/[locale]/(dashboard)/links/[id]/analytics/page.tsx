"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LinkAnalytics } from "@/components/link-analytics";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

interface LinkInfo {
    id: string;
    originalUrl: string;
    slug: string;
    clickCount: number;
    createdAt: string;
}

interface AnalyticsData {
    totalClicks: number;
    uniqueClicks: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksOverTime: { date: string; clicks: number }[];
    topCountries: { country: string; clicks: number }[];
    devices: { device: string; clicks: number }[];
    browsers: { browser: string; clicks: number }[];
    operatingSystems: { os: string; clicks: number }[];
    referrers: { referrer: string; clicks: number }[];
    recentClicks: {
        ip: string | null;
        country: string | null;
        city: string | null;
        device: string | null;
        browser: string | null;
        os: string | null;
        referrer: string | null;
        clickedAt: Date;
    }[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function LinkAnalyticsPage() {
    const t = useTranslations("linkAnalytics");
    const tl = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();
    const params = useParams();
    const linkId = params.id as string;

    const [link, setLink] = useState<LinkInfo | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${link?.slug || ""}`;

    useEffect(() => {
        if (linkId) {
            fetchLink();
            fetchAnalytics();
        }
    }, [linkId, dateRange]);

    async function fetchLink() {
        try {
            const res = await fetch(`/api/links/${linkId}`);
            const data = await res.json();
            if (data.data?.link) {
                setLink(data.data.link);
            }
        } catch {
            // silently fail
        }
    }

    async function fetchAnalytics() {
        setLoading(true);
        try {
            let url = `/api/links/${linkId}/analytics`;
            if (dateRange !== "all") {
                const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - days);
                url += `?from=${from.toISOString()}&to=${to.toISOString()}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.data?.analytics) {
                setAnalytics(data.data.analytics);
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
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
            <motion.div variants={itemVariants} className="flex items-center gap-3">
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
                        <div className="flex items-center gap-2 mt-1">
                            <a
                                href={shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                                {shortUrl.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="text-xs text-muted-foreground truncate">
                                {link.originalUrl}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Date Range */}
            <motion.div variants={itemVariants}>
                <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                    <TabsList className="rounded-xl">
                        <TabsTrigger value="7d" className="rounded-lg cursor-pointer">
                            {t("last7Days")}
                        </TabsTrigger>
                        <TabsTrigger value="30d" className="rounded-lg cursor-pointer">
                            {t("last30Days")}
                        </TabsTrigger>
                        <TabsTrigger value="90d" className="rounded-lg cursor-pointer">
                            {t("last90Days")}
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
