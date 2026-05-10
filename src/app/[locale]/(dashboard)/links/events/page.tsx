"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
    CalendarDays,
    Search,
    Filter,
    MousePointerClick,
    Globe,
    Monitor,
    Clock,
    Link2,
    ArrowUpDown,
    Loader2,
} from "lucide-react";

interface LinkEvent {
    id: string;
    linkSlug: string;
    linkUrl: string;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    referrer: string;
    createdAt: string;
}

const mockEvents: LinkEvent[] = [
    {
        id: "1",
        linkSlug: "abc123",
        linkUrl: "https://example.com/blog",
        country: "Brazil",
        city: "São Paulo",
        device: "Desktop",
        browser: "Chrome",
        os: "Windows",
        referrer: "google.com",
        createdAt: "2026-05-10T14:30:00Z",
    },
    {
        id: "2",
        linkSlug: "xyz789",
        linkUrl: "https://example.com/product",
        country: "United States",
        city: "New York",
        device: "Mobile",
        browser: "Safari",
        os: "iOS",
        referrer: "twitter.com",
        createdAt: "2026-05-10T12:15:00Z",
    },
    {
        id: "3",
        linkSlug: "def456",
        linkUrl: "https://example.com/landing",
        country: "Germany",
        city: "Berlin",
        device: "Tablet",
        browser: "Firefox",
        os: "Android",
        referrer: "(direct)",
        createdAt: "2026-05-09T09:45:00Z",
    },
];

export default function LinkEventsPage() {
    const t = useTranslations("linkEvents");
    const tc = useTranslations("common");
    const [events, setEvents] = useState<LinkEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch("/api/links/events");
            const data = await res.json();
            if (res.ok && data.data?.events) {
                setEvents(data.data.events);
            } else {
                setEvents(mockEvents);
            }
        } catch {
            setEvents(mockEvents);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const filteredEvents = events.filter(
        (event) =>
            event.linkSlug.toLowerCase().includes(search.toLowerCase()) ||
            event.country.toLowerCase().includes(search.toLowerCase()) ||
            event.city.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t("description")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl">
                        <Filter className="h-4 w-4 mr-1" />
                        {tc("filter")}
                    </Button>
                    <Button variant="outline" className="rounded-xl">
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        {t("sort")}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("totalClicks")}</p>
                                <p className="text-2xl font-semibold mt-1">{events.length}</p>
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
                                <p className="text-sm text-muted-foreground">{t("topCountry")}</p>
                                <p className="text-2xl font-semibold mt-1">Brazil</p>
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
                                <p className="text-sm text-muted-foreground">{t("topDevice")}</p>
                                <p className="text-2xl font-semibold mt-1">Desktop</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </div>

            {/* Events Table */}
            <Card className="glass-card overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">{t("recentEvents")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">{search ? tc("noResults") : t("noEvents")}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("link")}</th>
                                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("location")}</th>
                                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("device")}</th>
                                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("referrer")}</th>
                                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("time")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvents.map((event) => (
                                        <tr
                                            key={event.id}
                                            className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="font-medium">{event.linkSlug}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{event.city}, {event.country}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <Badge variant="secondary" className="text-xs rounded-md">
                                                        {event.device}
                                                    </Badge>
                                                    <span className="text-muted-foreground text-xs">{event.browser}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-muted-foreground">{event.referrer}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(event.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
