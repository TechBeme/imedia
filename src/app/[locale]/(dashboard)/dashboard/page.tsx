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
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Sparkles,
    ArrowUpRight,
    Star,
    CalendarDays,
    Download,
    Plus,
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

const profitData = [
    { name: "1 Jan", value: 3200 },
    { name: "8 Jan", value: 4800 },
    { name: "15 Jan", value: 6200 },
    { name: "22 Jan", value: 7800 },
    { name: "29 Jan", value: 9500 },
];

const dayActiveData = [
    { day: "Sun", value: 4200 },
    { day: "Mon", value: 5100 },
    { day: "Tue", value: 8162 },
    { day: "Wed", value: 4800 },
    { day: "Thu", value: 3900 },
    { day: "Fri", value: 5600 },
    { day: "Sat", value: 6100 },
];

const bestSelling = [
    { id: "#83009", name: "Hybrid Active Noise Cancel...", sold: "2,310", revenue: "$124.839", rating: "5.0" },
    { id: "#83001", name: "Casio G-Shock Shock Resi...", sold: "1,230", revenue: "$92.662", rating: "4.8" },
    { id: "#83004", name: "SAMSUNG Galaxy S25 Ultr...", sold: "812", revenue: "$74.048", rating: "4.7" },
];

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

export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const tc = useTranslations("common");

    const kpiData = [
        {
            label: t("pageViews"),
            value: "16.431",
            change: "+15.5%",
            trend: "up" as const,
            icon: Eye,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-50 dark:bg-blue-500/10",
        },
        {
            label: t("visitors"),
            value: "6.225",
            change: "+8.4%",
            trend: "up" as const,
            icon: Users,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
        },
        {
            label: t("clicks"),
            value: "2.832",
            change: "-10.5%",
            trend: "down" as const,
            icon: MousePointerClick,
            iconColor: "text-rose-500",
            iconBg: "bg-rose-50 dark:bg-rose-500/10",
        },
        {
            label: t("orders"),
            value: "1.224",
            change: "+4.4%",
            trend: "up" as const,
            icon: ShoppingCart,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        },
    ];

    const customerSegments = [
        { label: t("retailers"), value: "2.884", color: "bg-chart-1" },
        { label: t("distributors"), value: "1.432", color: "bg-chart-3" },
        { label: t("wholesalers"), value: "562", color: "bg-chart-4" },
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
                {/* Total Profit Chart */}
                <Card className="lg:col-span-2 glass-card">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-semibold font-heading">{t("totalProfit")}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-2xl font-semibold font-heading">$446.7K</span>
                                    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full px-1.5 py-0.5">
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                        +24.4%
                                    </span>
                                    <span className="text-xs text-muted-foreground">{t("vsLastPeriod")}</span>
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
                                <AreaChart data={profitData}>
                                    <defs>
                                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}K`} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid hsl(var(--border))",
                                            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                                            background: "hsl(var(--card))",
                                        }}
                                        formatter={(value) => [`$${Number(value).toLocaleString()}`, t("profit")]}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#profitGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Customer Segments */}
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
                    {/* Most Day Active */}
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("mostDayActive")}</h3>
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

                    {/* Repeat Customer Rate */}
                    <Card className="glass-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold font-heading">{t("repeatCustomerRate")}</h3>
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
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--chart-3))" strokeWidth="8" strokeDasharray={`${68 * 2.64} ${100 * 2.64}`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold font-heading">68%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{t("onTrackTarget")}</p>
                                <Button variant="outline" size="sm" className="mt-3 rounded-xl text-xs cursor-pointer">
                                    {t("showDetails")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Bottom Row */}
            <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
                {/* Best Selling Products */}
                <Card className="lg:col-span-2 glass-card">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold font-heading">{t("bestSellingProducts")}</h3>
                            <button
                                className="p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                aria-label={t("moreOptions")}
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/60 hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground font-medium">{t("id")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium">{t("name")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("sold")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("revenue")}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-medium text-right">{t("rating")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bestSelling.map((item) => (
                                    <TableRow key={item.id} className="border-border/40 hover:bg-accent/50 transition-colors cursor-pointer">
                                        <TableCell className="text-sm text-muted-foreground">{item.id}</TableCell>
                                        <TableCell className="text-sm font-medium">{item.name}</TableCell>
                                        <TableCell className="text-sm text-right">{item.sold}</TableCell>
                                        <TableCell className="text-sm text-right text-emerald-600 dark:text-emerald-400">{item.revenue}</TableCell>
                                        <TableCell className="text-sm text-right">
                                            <span className="inline-flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                {item.rating}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Upgrade Card */}
                    <Card className="glass-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
                        <CardContent className="p-5">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-semibold mb-1 font-heading">{t("upgradePremium")}</h3>
                            <p className="text-sm text-primary-foreground/80 mb-4">{t("upgradeDescription")}</p>
                            <Button className="w-full rounded-xl bg-white text-primary hover:bg-white/90 font-medium cursor-pointer shadow-sm">
                                {t("upgradeNow")}
                            </Button>
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
