"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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

export default function ScheduledPage() {
    const t = useTranslations("scheduled");
    const [view, setView] = useState("list");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">Manage your scheduled content</p>
                </div>
                <Tabs value={view} onValueChange={setView} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="calendar" className="gap-1">
                            <RiCalendarLine className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("calendarView")}</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-1">
                            <RiListCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("listView")}</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <TabsContent value="calendar" className="mt-0">
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <RiCalendarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Calendar view coming soon</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-0 space-y-3">
                {mockScheduled.map((post) => {
                    const Icon = platformIcons[post.platform] || RiInstagramLine;
                    return (
                        <Card key={post.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`mt-0.5 ${platformColors[post.platform]}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{post.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(post.date).toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{post.status}</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Edit coming soon")}>
                                            <RiEditLine className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Publish now (mock)")}>
                                            <RiSendPlaneLine className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast("Cancelled")}>
                                            <RiDeleteBinLine className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </TabsContent>
        </div>
    );
}
