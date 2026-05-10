"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Share2, Heart, MessageCircle, Eye } from "lucide-react";

const engagementData = [
    { name: "Mon", instagram: 120, facebook: 80, youtube: 45, tiktok: 90 },
    { name: "Tue", instagram: 150, facebook: 90, youtube: 60, tiktok: 110 },
    { name: "Wed", instagram: 180, facebook: 110, youtube: 55, tiktok: 140 },
    { name: "Thu", instagram: 140, facebook: 95, youtube: 70, tiktok: 100 },
    { name: "Fri", instagram: 200, facebook: 130, youtube: 80, tiktok: 180 },
    { name: "Sat", instagram: 250, facebook: 150, youtube: 90, tiktok: 220 },
    { name: "Sun", instagram: 220, facebook: 120, youtube: 85, tiktok: 190 },
];

const followersData = [
    { name: "Week 1", instagram: 5200, youtube: 1800, tiktok: 3200 },
    { name: "Week 2", instagram: 5350, youtube: 1900, tiktok: 3450 },
    { name: "Week 3", instagram: 5500, youtube: 2050, tiktok: 3800 },
    { name: "Week 4", instagram: 5800, youtube: 2200, tiktok: 4200 },
];

const platformDistribution = [
    { name: "Instagram", value: 40, color: "hsl(var(--chart-1))" },
    { name: "TikTok", value: 30, color: "hsl(var(--chart-4))" },
    { name: "YouTube", value: 20, color: "hsl(var(--chart-2))" },
    { name: "Facebook", value: 10, color: "hsl(var(--chart-3))" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const tooltipStyle = {
    borderRadius: "12px",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    background: "hsl(var(--card))",
};

export default function SocialAnalyticsPage() {
    const t = useTranslations("socialAnalytics");

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        {t("title")}
                    </h1>
                </div>
                <Tabs defaultValue="7d">
                    <TabsList className="rounded-xl">
                        <TabsTrigger value="7d" className="rounded-lg cursor-pointer">{t("7days")}</TabsTrigger>
                        <TabsTrigger value="30d" className="rounded-lg cursor-pointer">{t("30days")}</TabsTrigger>
                        <TabsTrigger value="90d" className="rounded-lg cursor-pointer">{t("90days")}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("totalEngagement")}</p>
                                <p className="text-2xl font-semibold mt-1">24.5K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Heart className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("totalReach")}</p>
                                <p className="text-2xl font-semibold mt-1">128K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Eye className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("comments")}</p>
                                <p className="text-2xl font-semibold mt-1">1.8K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("shares")}</p>
                                <p className="text-2xl font-semibold mt-1">3.2K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Share2 className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("engagementByPlatform")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="instagram" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="facebook" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="youtube" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="tiktok" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("followerGrowth")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={followersData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line type="monotone" dataKey="instagram" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="youtube" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="tiktok" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("platformDistribution")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={platformDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {platformDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {platformDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs text-muted-foreground">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("topPerformingPosts")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: "Product launch video", platform: "Instagram", engagement: "2.4K" },
                                { title: "Tutorial: How to...", platform: "YouTube", engagement: "1.8K" },
                                { title: "Behind the scenes", platform: "TikTok", engagement: "1.2K" },
                                { title: "Weekly tips", platform: "Facebook", engagement: "890" },
                            ].map((post, i) => (
                                <div key={i} className="flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium">{post.title}</p>
                                        <p className="text-xs text-muted-foreground">{post.platform}</p>
                                    </div>
                                    <span className="text-sm font-semibold">{post.engagement}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
