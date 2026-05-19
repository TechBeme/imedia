"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Inbox, AlertTriangle } from "lucide-react";
import {
    RiInstagramLine,
    RiYoutubeLine,
    RiFacebookCircleLine,
} from "react-icons/ri";

const mockHistory = [
    { id: 1, content: "Summer collection drop!", platform: "instagram", date: "2026-05-01", likes: 245, comments: 32, shares: 12, views: 1200 },
    { id: 2, content: "How to style your outfits", platform: "youtube", date: "2026-04-30", likes: 890, comments: 120, shares: 45, views: 5600 },
    { id: 3, content: "Quick tip of the day", platform: "instagram", date: "2026-04-29", likes: 180, comments: 18, shares: 8, views: 900 },
    { id: 4, content: "Weekly vlog is live", platform: "youtube", date: "2026-04-28", likes: 1200, comments: 200, shares: 80, views: 8900 },
    { id: 5, content: "New blog post", platform: "facebook", date: "2026-04-27", likes: 95, comments: 14, shares: 22, views: 600 },
];

const platformColors: Record<string, string> = {
    instagram: "text-pink-500",
    youtube: "text-red-500",
    facebook: "text-blue-600",
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function HistorySkeleton() {
    return (
        <Card className="glass-card">
            <CardContent className="p-0">
                <div className="p-4 space-y-3">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-10 ml-auto" />
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-4 w-10" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function HistoryEmpty() {
    const t = useTranslations("history");
    return (
        <Card className="glass-card">
            <CardContent className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-1">{t("emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </CardContent>
        </Card>
    );
}

function HistoryError({ onRetry }: { onRetry: () => void }) {
    const t = useTranslations("history");
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

export default function HistoryPage() {
    const t = useTranslations("history");
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [posts, setPosts] = useState<typeof mockHistory>([]);

    function fetchData() {
        setIsLoading(true);
        setIsError(false);
        setTimeout(() => {
            setPosts(mockHistory);
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
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                {isLoading ? (
                    <HistorySkeleton />
                ) : isError ? (
                    <HistoryError onRetry={fetchData} />
                ) : posts.length === 0 ? (
                    <HistoryEmpty />
                ) : (
                    <Card className="glass-card overflow-hidden">
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/60 hover:bg-transparent">
                                        <TableHead className="text-xs text-muted-foreground font-medium">{t("platform")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium">{t("content")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium">{t("date")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium text-right hidden sm:table-cell">{t("likes")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium text-right hidden sm:table-cell">{t("comments")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("views")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {posts.map((post) => {
                                        const PlatformIcon = post.platform === "instagram" ? RiInstagramLine : post.platform === "youtube" ? RiYoutubeLine : RiFacebookCircleLine;
                                        return (
                                            <TableRow key={post.id} className="border-border/40 hover:bg-accent/50 transition-colors cursor-pointer">
                                                <TableCell>
                                                    <div className={cn(platformColors[post.platform])}>
                                                        <PlatformIcon className="h-5 w-5 shrink-0" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">{post.content}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{post.date}</TableCell>
                                                <TableCell className="text-sm text-right hidden sm:table-cell">{post.likes}</TableCell>
                                                <TableCell className="text-sm text-right hidden sm:table-cell">{post.comments}</TableCell>
                                                <TableCell className="text-sm text-right">{post.views}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </motion.div>
    );
}
