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
import { Button } from "@/components/ui/button";
import {
    Eye,
    MousePointerClick,
    Users,
    Link2,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    ArrowUpRight,
    CalendarDays,
    Download,
    Plus,
    Globe,
    Monitor,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { DashboardAnalytics } from "@/lib/link-analytics";

interface DashboardContentProps {
    data: DashboardAnalytics;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export default function DashboardContent({ data }: DashboardContentProps) {
    const t = useTranslations("dashboard");

    const kpiData = [
        {
            label: t("totalLinks"),
            value: formatNumber(data.totalLinks),
            change: "+0%",
            trend: "up" as const,
            icon: Link2,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-50 dark:bg-blue-500/10",
        },
        {
            label: t("totalClicks"),
            value: formatNumber(data.totalClicks),
            change: "+0%",
            trend: "up" as const,
            icon: MousePointerClick,
            iconColor: "text-rose-500",
            iconBg: "bg-rose-50 dark:bg-rose-500/10",
        },
        {
            label: t("uniqueVisitors"),
            value: formatNumber(data.uniqueVisitors),
            change: "+0%",
            trend: "up" as const,
            icon: Users,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
        },
        {
            label: t("clicksToday"),
            value: formatNumber(data.clicksToday),
            change: "+0%",
            trend: data.clicksToday > 0 ? ("up" as const) : ("down" as const),
            icon: Eye,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        },
    ];

    const chartData = data.clicksOverTime.length > 0
        ? data.clicksOverTime.map((d) => ({
            name: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
            value: d.clicks,
        }))
        : Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                name: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
                value: 0,
            };
        });

    const dayActiveData = data.deviceTypes.length > 0
        ? data.deviceTypes.map((d) => ({ day: d.type, value: d.clicks }))
        : [
            { day: "Desktop", value: 0 },
            { day: "Mobile", value: 0 },
            { day: "Tablet", value: 0 },
        ];

    const topLinks = data.topLinks.length > 0
        ? data.topLinks.map((l, i) => ({
            id: `#${String(i + 1).padStart(5, "0")}`,
            name: l.title || l.slug,
            slug: l.slug,
            sold: formatNumber(l.clicks),
            revenue: "-",
            rating: "5.0",
        }))
        : [];

    const customerSegments = data.topCountries.length > 0
        ? data.topCountries.slice(0, 3).map((c, i) => ({
            label: c.country,
            value: formatNumber(c.clicks),
            color: ["bg-chart-1", "bg-chart-3", "bg-chart-4"][i],
        }))
        : [
            { label: "-", value: "0", color: "bg-chart-1" },
            { label: "-", value: "0", color: "bg-chart-3" },
            { label: "-", value: "0", color: "bg-chart-4" },
        ];

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t("dateRange")}
                    </span>
                    <Button variant="outline" size="sm" className="rounded-xl cursor-pointer">
                        {t("last30Days")}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 cursor-pointer">
                        <Plus className="h-3.5 w-3.5" />
                        {t("addWidget")}
                    </Button>
                    <Button size="sm" className="rounded-xl gap-1.5 cursor-pointer shadow-sm shadow-primary/20">
                        <Download className="h-3.5 w-3.5" />
                        {t("export")}
                    </Button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpiData.map((kpi) => {
                    const Icon = kpi.icon;
                    const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;
                    return (
                        <motion.div
                            key={kpi.label}
                            variants={itemVariants}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <Card className="glass-card cursor-pointer transition-shadow duration-200 hover:shadow-md">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-muted-foreground">{kpi.label}</span>
                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", kpi.iconBg)}>
                                            <Icon className={cn("h-4 w-4", kpi.iconColor)} />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-semibold tracking-tight font-heading">{kpi.value}</span>
                                        <span className={cn(
                                            "flex items-center text-xs font-medium mb-1 rounded-full px-1.5 py-0.5",
                                            kpi.trend === "up" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400"
                                        )}>
                                            <TrendIcon className="h-3 w-3 mr-0.5" />
                                            {kpi.change}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5">{t("vsLastPeriod")}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
                {/* Total Clicks Chart */}
                <Card className="lg:col-span-2 glass-card">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-semibold font-heading">{t("totalClicksChart")}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-2xl font-semibold font-heading">{formatNumber(data.totalClicks)}</span>
                                    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full px-1.5 py-0.5">
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                        {data.clicksThisWeek > 0 ? "+" : ""}{formatNumber(data.clicksThisWeek)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{t("thisWeek")}</span>
                                </div>
                            </div>
                            <button
                                className="p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                aria-label={t("moreOptions")}
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid hsl(var(--border))",
                                            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                                            background: "hsl(var(--card))",
                                        }}
                                        formatter={(value) => [String(value), t("clicks")]}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#profitGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Top Countries */}
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/60">
                            {customerSegments.map((seg) => (
                                <div key={seg.label} className="flex items-center gap-3">
                                    <div className={cn("h-1.5 w-8 rounded-full", seg.color)} />
                                    <div>
                                        <p className="text-sm font-semibold">{seg.value}</p>
                                        <p className="text-xs text-muted-foreground">{seg.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Device Types */}
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("deviceTypes")}</h3>
                                <button
                                    className="p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    aria-label={t("moreOptions")}
                                >
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dayActiveData}>
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: "12px",
                                                border: "1px solid hsl(var(--border))",
                                                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                                                background: "hsl(var(--card))",
                                            }}
                                            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                                        />
                                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 6, 6]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Browser Share */}
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("topBrowsers")}</h3>
                                <button
                                    className="p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    aria-label={t("moreOptions")}
                                >
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative h-28 w-28">
                                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--chart-3))" strokeWidth="8" strokeDasharray={`${data.totalClicks > 0 ? 68 * 2.64 : 0} ${100 * 2.64}`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold font-heading">{data.browsers[0]?.browser || "-"}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{t("topBrowser")}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Bottom Row */}
            <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
                {/* Top Links Table */}
                <Card className="lg:col-span-2 glass-card">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold font-heading">{t("topLinks")}</h3>
                            <button
                                className="p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                aria-label={t("moreOptions")}
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        {topLinks.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/60 hover:bg-transparent">
                                        <TableHead className="text-xs text-muted-foreground font-medium">{t("rank")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium">{t("link")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("clicks")}</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("slug")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topLinks.map((item) => (
                                        <TableRow key={item.id} className="border-border/40 hover:bg-accent/50 transition-colors cursor-pointer">
                                            <TableCell className="text-sm text-muted-foreground">{item.id}</TableCell>
                                            <TableCell className="text-sm font-medium">{item.name}</TableCell>
                                            <TableCell className="text-sm text-right">{item.sold}</TableCell>
                                            <TableCell className="text-sm text-right text-emerald-600 dark:text-emerald-400">/{item.slug}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>{t("noLinksYet")}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Recent Clicks */}
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("recentClicks")}</h3>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {data.recentClicks.length > 0 ? (
                                <div className="space-y-3">
                                    {data.recentClicks.slice(0, 5).map((click, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">/{click.slug}</p>
                                                <p className="text-xs text-muted-foreground">{click.country || "Unknown"} &middot; {click.device || "Unknown"}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(click.clickedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <MousePointerClick className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t("noClicksYet")}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Assistant */}
                    <Card className="glass-card cursor-pointer transition-shadow duration-200 hover:shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("aiAssistant")}</h3>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-center py-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/60 to-primary shadow-lg shadow-primary/20 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
}
