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
import { Link2, MousePointerClick, Globe, Monitor } from "lucide-react";

const clicksData = [
    { name: "Mon", clicks: 120, unique: 95 },
    { name: "Tue", clicks: 150, unique: 120 },
    { name: "Wed", clicks: 180, unique: 140 },
    { name: "Thu", clicks: 140, unique: 110 },
    { name: "Fri", clicks: 200, unique: 160 },
    { name: "Sat", clicks: 250, unique: 200 },
    { name: "Sun", clicks: 220, unique: 175 },
];

const deviceData = [
    { name: "Desktop", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Mobile", value: 40, color: "hsl(var(--chart-2))" },
    { name: "Tablet", value: 15, color: "hsl(var(--chart-3))" },
];

const browserData = [
    { name: "Chrome", value: 55, color: "hsl(var(--chart-1))" },
    { name: "Safari", value: 25, color: "hsl(var(--chart-2))" },
    { name: "Firefox", value: 12, color: "hsl(var(--chart-3))" },
    { name: "Edge", value: 8, color: "hsl(var(--chart-4))" },
];

const topLinks = [
    { slug: "abc123", url: "https://example.com/blog", clicks: 1240 },
    { slug: "xyz789", url: "https://example.com/product", clicks: 890 },
    { slug: "def456", url: "https://example.com/landing", clicks: 650 },
    { slug: "ghi012", url: "https://example.com/sale", clicks: 420 },
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

export default function LinkAnalyticsPage() {
    const t = useTranslations("linkAnalytics");

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
                        <Link2 className="h-5 w-5 text-primary" />
                        {t("title")}
                    </h1>
                </div>
                <Tabs defaultValue="7d">
                    <TabsList className="rounded-xl">
                        <TabsTrigger value="24h" className="rounded-lg cursor-pointer">{t("last24h")}</TabsTrigger>
                        <TabsTrigger value="7d" className="rounded-lg cursor-pointer">{t("last7Days")}</TabsTrigger>
                        <TabsTrigger value="30d" className="rounded-lg cursor-pointer">{t("last30Days")}</TabsTrigger>
                        <TabsTrigger value="all" className="rounded-lg cursor-pointer">{t("allTime")}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("totalClicks")}</p>
                                <p className="text-2xl font-semibold mt-1">12.4K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <MousePointerClick className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("uniqueClicks")}</p>
                                <p className="text-2xl font-semibold mt-1">9.8K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("clicksToday")}</p>
                                <p className="text-2xl font-semibold mt-1">342</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <MousePointerClick className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("clicksThisWeek")}</p>
                                <p className="text-2xl font-semibold mt-1">2.1K</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("clicksOverTime")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={clicksData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="clicks" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="unique" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("deviceTypes")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {deviceData.map((item) => (
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
                            <CardTitle className="text-base font-semibold font-heading">{t("browsers")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={browserData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {browserData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {browserData.map((item) => (
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
                            <CardTitle className="text-base font-semibold font-heading">{t("topCountries")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { country: "Brazil", clicks: 4200 },
                                { country: "United States", clicks: 3100 },
                                { country: "Germany", clicks: 1800 },
                                { country: "United Kingdom", clicks: 1200 },
                                { country: "France", clicks: 900 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{item.country}</span>
                                    </div>
                                    <span className="text-sm font-semibold">{item.clicks.toLocaleString()}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Top Links */}
            <motion.div variants={itemVariants}>
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold font-heading">{t("recentClicks")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topLinks.map((link, i) => (
                            <div key={i} className="flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{link.slug}</p>
                                        <p className="text-xs text-muted-foreground">{link.url}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold">{link.clicks.toLocaleString()} clicks</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
