"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
    MousePointerClick,
    Users,
    Calendar,
    BarChart3,
    Globe,
    TrendingUp,
} from "lucide-react";
import { AnalyticsMap } from "./analytics-map";

interface MapDataPoint {
    country: string;
    clicks: number;
    lat: number;
    lng: number;
}

interface AnalyticsData {
    totalClicks: number;
    uniqueVisitors: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksOverTime: { date: string; clicks: number }[];
    topCountries: { country: string; clicks: number }[];
    topCities: { city: string; clicks: number }[];
    topRegions: { region: string; clicks: number }[];
    deviceTypes: { device: string; clicks: number }[];
    devices: { device: string; model: string | null; clicks: number }[];
    browsers: { browser: string; version: string | null; clicks: number }[];
    operatingSystems: { os: string; version: string | null; clicks: number }[];
    languages: { language: string; clicks: number }[];
    timezones: { timezone: string; clicks: number }[];
    mapData: MapDataPoint[];
    referrers: { referrer: string; clicks: number; uniqueVisitors: number }[];
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

interface LinkAnalyticsProps {
    analytics: AnalyticsData | null;
    loading: boolean;
}

const tooltipStyle = {
    borderRadius: "12px",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    background: "hsl(var(--card))",
};

const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
];

export function LinkAnalytics({ analytics, loading }: LinkAnalyticsProps) {
    const t = useTranslations("linkAnalytics");

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    if (!analytics || analytics.totalClicks === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">{t("noClicks")}</h3>
            </div>
        );
    }

    const stats = [
        {
            label: t("totalClicks"),
            value: analytics.totalClicks,
            icon: MousePointerClick,
        },
        {
            label: t("uniqueVisitors"),
            value: analytics.uniqueVisitors,
            icon: Users,
        },
        {
            label: t("clicksToday"),
            value: analytics.clicksToday,
            icon: Calendar,
        },
        {
            label: t("clicksThisWeek"),
            value: analytics.clicksThisWeek,
            icon: TrendingUp,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="glass-card">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <stat.icon className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="rounded-xl flex-wrap h-auto gap-1">
                    <TabsTrigger value="overview" className="rounded-lg cursor-pointer">
                        {t("overview")}
                    </TabsTrigger>
                    <TabsTrigger value="geography" className="rounded-lg cursor-pointer">
                        {t("geography")}
                    </TabsTrigger>
                    <TabsTrigger value="technology" className="rounded-lg cursor-pointer">
                        {t("technology")}
                    </TabsTrigger>
                    <TabsTrigger value="audience" className="rounded-lg cursor-pointer">
                        {t("audience")}
                    </TabsTrigger>
                    <TabsTrigger value="referrers" className="rounded-lg cursor-pointer">
                        {t("referrers")}
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="rounded-lg cursor-pointer">
                        {t("recentClicks")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">
                                {t("clicksOverTime")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.clicksOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="hsl(var(--chart-1))"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="geography" className="space-y-4 mt-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {t("accessMap")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AnalyticsMap data={analytics.mapData} />
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <BarCard title={t("topCountries")} data={analytics.topCountries} dataKey="country" />
                        <BarCard title={t("topCities")} data={analytics.topCities} dataKey="city" />
                        <BarCard title={t("topRegions")} data={analytics.topRegions} dataKey="region" />
                    </div>
                </TabsContent>

                <TabsContent value="technology" className="space-y-4 mt-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <PieCard title={t("deviceTypes")} data={analytics.deviceTypes} nameKey="device" />
                        <PieCard title={t("browsers")} data={analytics.browsers} nameKey="browser" />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <PieCard title={t("operatingSystems")} data={analytics.operatingSystems} nameKey="os" />
                        <DeviceTable title={t("devices")} data={analytics.devices} />
                    </div>
                </TabsContent>

                <TabsContent value="audience" className="space-y-4 mt-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <BarCard title={t("languages")} data={analytics.languages} dataKey="language" />
                        <BarCard title={t("timezones")} data={analytics.timezones} dataKey="timezone" />
                    </div>
                </TabsContent>

                <TabsContent value="referrers" className="space-y-4 mt-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">
                                {t("referrers")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/40">
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("source")}</th>
                                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">{t("clicks")}</th>
                                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">{t("uniqueVisitors")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.referrers.map((ref, i) => (
                                            <tr key={i} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                                                <td className="py-2 px-3">{ref.referrer || "Direct"}</td>
                                                <td className="py-2 px-3 text-right">{ref.clicks}</td>
                                                <td className="py-2 px-3 text-right">{ref.uniqueVisitors}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4 mt-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">
                                {t("recentClicks")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/40">
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("time")}</th>
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("ip")}</th>
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("country")}</th>
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("device")}</th>
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("browser")}</th>
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("referrer")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.recentClicks.map((click, i) => (
                                            <tr key={i} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    {new Date(click.clickedAt).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3">{click.ip || "-"}</td>
                                                <td className="py-2 px-3">{click.country || "-"}</td>
                                                <td className="py-2 px-3">{click.device || "-"}</td>
                                                <td className="py-2 px-3">{click.browser || "-"}</td>
                                                <td className="py-2 px-3 max-w-[150px] truncate">{click.referrer || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PieCard({
    title,
    data,
    nameKey,
}: {
    title: string;
    data: { device?: string; browser?: string; os?: string; clicks: number }[];
    nameKey: "device" | "browser" | "os";
}) {
    const chartData = data.map((d) => ({
        name: (d[nameKey] || "Unknown") as string,
        value: d.clicks,
    }));

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {chartData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: chartColors[i % chartColors.length] }}
                            />
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function BarCard({
    title,
    data,
    dataKey,
}: {
    title: string;
    data: { country?: string; city?: string; region?: string; language?: string; timezone?: string; clicks: number }[];
    dataKey: "country" | "city" | "region" | "language" | "timezone";
}) {
    const chartData = data.map((d) => ({
        name: (d[dataKey] || "Unknown") as string,
        value: d.clicks,
    }));

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={100}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function DeviceTable({
    title,
    data,
}: {
    title: string;
    data: { device: string; model: string | null; clicks: number }[];
}) {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-base font-semibold font-heading">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
                            <tr className="border-b border-border/40">
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Device</th>
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Model</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Clicks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, i) => (
                                <tr key={i} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                                    <td className="py-2 px-3">{d.device}</td>
                                    <td className="py-2 px-3 text-muted-foreground">{d.model || "-"}</td>
                                    <td className="py-2 px-3 text-right">{d.clicks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="glass-card">
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card className="glass-card">
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
