"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Inbox, AlertTriangle } from "lucide-react";
import {
    RiCalendarLine,
    RiListCheck,
    RiInstagramLine,
    RiYoutubeLine,
    RiEditLine,
    RiDeleteBinLine,
    RiSendPlaneLine,
} from "react-icons/ri";

const mockScheduled = [
    { id: 1, content: "New product launch teaser", platform: "instagram", date: "2026-05-02T15:00:00", status: "pending" },
    { id: 2, content: "Weekly tutorial video", platform: "youtube", date: "2026-05-03T10:00:00", status: "pending" },
    { id: 3, content: "Behind the scenes", platform: "instagram", date: "2026-05-04T18:00:00", status: "pending" },
    { id: 4, content: "Tips and tricks thread", platform: "threads", date: "2026-05-05T09:00:00", status: "pending" },
];

const platformIcons: Record<string, React.ElementType> = {
    instagram: RiInstagramLine,
    youtube: RiYoutubeLine,
};

const platformColors: Record<string, string> = {
    instagram: "text-pink-500",
    youtube: "text-red-500",
    threads: "text-foreground",
    tiktok: "text-foreground",
    facebook: "text-blue-600",
    x: "text-foreground",
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function ScheduledSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <Skeleton className="h-5 w-5 mt-0.5 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Skeleton className="h-6 w-16 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ScheduledEmpty({ onCreate }: { onCreate?: () => void }) {
    const t = useTranslations("scheduled");
    return (
        <Card className="glass-card">
            <CardContent className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-1">{t("emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("emptyDescription")}</p>
                {onCreate && (
                    <Button onClick={onCreate} className="rounded-xl cursor-pointer">
                        {t("createPost")}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function ScheduledError({ onRetry }: { onRetry: () => void }) {
    const t = useTranslations("scheduled");
    return (
        <Card className="glass-card">
            <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-semibold mb-1">{t("errorTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("errorDescription")}</p>
                <Button onClick={onRetry} variant="outline" className="rounded-xl cursor-pointer">
                    {t("retry")}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ScheduledPage() {
    const t = useTranslations("scheduled");
    const locale = useLocale();
    const [view, setView] = useState("list");
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [posts, setPosts] = useState<typeof mockScheduled>([]);

    function fetchData() {
        setIsLoading(true);
        setIsError(false);
        setTimeout(() => {
            setPosts(mockScheduled);
            setIsLoading(false);
        }, 1000);
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                </div>
                <Tabs value={view} onValueChange={setView} className="w-auto">
                    <TabsList className="rounded-xl">
                        <TabsTrigger value="calendar" className="gap-1.5 rounded-lg cursor-pointer">
                            <RiCalendarLine className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("calendarView")}</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-1.5 rounded-lg cursor-pointer">
                            <RiListCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("listView")}</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            <TabsContent value="calendar" className="mt-0">
                <Card className="glass-card">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <RiCalendarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t("calendarComingSoon")}</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-0 space-y-3">
                {isLoading ? (
                    <ScheduledSkeleton />
                ) : isError ? (
                    <ScheduledError onRetry={fetchData} />
                ) : posts.length === 0 ? (
                    <ScheduledEmpty onCreate={() => toast(t("createComingSoon"))} />
                ) : (
                    posts.map((post) => {
                        const Icon = platformIcons[post.platform] || RiInstagramLine;
                        return (
                            <motion.div key={post.id} variants={itemVariants}>
                                <Card className="glass-card transition-shadow duration-200 hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={cn("mt-0.5 shrink-0", platformColors[post.platform])}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{post.content}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(post.date).toLocaleString(locale)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Badge variant="outline" className="rounded-lg text-xs">{t(post.status)}</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                    onClick={() => toast(t("editComingSoon"))}
                                                    aria-label={t("edit")}
                                                >
                                                    <RiEditLine className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                    onClick={() => toast(t("publishNowMock"))}
                                                    aria-label={t("publishNow")}
                                                >
                                                    <RiSendPlaneLine className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-destructive cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                    onClick={() => toast(t("cancelled"))}
                                                    aria-label={t("cancel")}
                                                >
                                                    <RiDeleteBinLine className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </TabsContent>
        </motion.div>
    );
}
