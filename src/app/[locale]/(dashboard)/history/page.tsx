"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
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

export default function HistoryPage() {
    const t = useTranslations("history");

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
                <Card className="glass-card">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/60 hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground font-medium">{t("platform")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium">{t("content")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium">{t("date")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("likes")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("comments")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("views")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockHistory.map((post) => {
                                    const PlatformIcon = post.platform === "instagram" ? RiInstagramLine : post.platform === "youtube" ? RiYoutubeLine : RiFacebookCircleLine;
                                    return (
                                        <TableRow key={post.id} className="border-border/40 hover:bg-accent/50 transition-colors cursor-pointer">
                                            <TableCell>
                                                <div className={cn(platformColors[post.platform])}>
                                                    <PlatformIcon className="h-5 w-5" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{post.content}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{post.date}</TableCell>
                                            <TableCell className="text-sm text-right">{post.likes}</TableCell>
                                            <TableCell className="text-sm text-right">{post.comments}</TableCell>
                                            <TableCell className="text-sm text-right">{post.views}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
