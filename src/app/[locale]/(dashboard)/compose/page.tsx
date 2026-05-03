export function generateStaticParams() {
    return [{ locale: "pt-BR" }, { locale: "en" }, { locale: "es" }];
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
    RiImageAddLine,
    RiCalendarLine,
    RiSendPlaneLine,
    RiDraftLine,
} from "react-icons/ri";

const composeSchema = z.object({
    content: z.string().min(1, "Content is required").max(2200, "Too long"),
});

type ComposeForm = z.infer<typeof composeSchema>;

const platforms = [
    { key: "instagram", icon: RiInstagramLine, color: "text-pink-500", label: "Instagram" },
    { key: "facebook", icon: RiFacebookCircleLine, color: "text-blue-600", label: "Facebook" },
    { key: "threads", icon: RiThreadsLine, color: "text-foreground", label: "Threads" },
    { key: "youtube", icon: RiYoutubeLine, color: "text-red-500", label: "YouTube" },
    { key: "tiktok", icon: RiTiktokLine, color: "text-foreground", label: "TikTok" },
    { key: "x", icon: RiTwitterXLine, color: "text-foreground", label: "X" },
];

export default function ComposePage() {
    const t = useTranslations("compose");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
    const [mediaFiles, setMediaFiles] = useState<string[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<ComposeForm>({
        resolver: zodResolver(composeSchema),
    });

    const content = watch("content") || "";

    function togglePlatform(key: string) {
        setSelectedPlatforms((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    }

    function onSubmit(data: ComposeForm) {
        toast.success("Post saved as draft (mock)");
        console.log({ ...data, platforms: selectedPlatforms, mediaFiles });
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">Create and schedule your content</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t("selectPlatforms")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {platforms.map((platform) => {
                                const Icon = platform.icon;
                                const isSelected = selectedPlatforms.includes(platform.key);
                                return (
                                    <button
                                        key={platform.key}
                                        type="button"
                                        onClick={() => togglePlatform(platform.key)}
                                        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${isSelected
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-card text-muted-foreground hover:bg-accent"
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${platform.color}`} />
                                        {platform.label}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            {...register("content")}
                            placeholder={t("placeholder")}
                            rows={6}
                            className="resize-none"
                        />
                        {errors.content && (
                            <p className="text-sm text-destructive">{errors.content.message}</p>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{content.length} / 2200</span>
                            <span>{selectedPlatforms.length} platforms selected</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t("addMedia")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-8 hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <RiImageAddLine className="h-8 w-8" />
                                <span className="text-sm">Click or drag files here</span>
                                <span className="text-xs">Images, videos up to 100MB</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t("schedule")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Switch
                                checked={isScheduling}
                                onCheckedChange={setIsScheduling}
                                id="schedule-toggle"
                            />
                            <Label htmlFor="schedule-toggle">
                                {isScheduling ? "Schedule for later" : "Publish immediately"}
                            </Label>
                        </div>
                        {isScheduling && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border p-3">
                                <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Date/time picker coming soon</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" variant="outline" className="gap-2">
                        <RiDraftLine className="h-4 w-4" />
                        {t("saveDraft")}
                    </Button>
                    <Button type="button" className="gap-2 flex-1" onClick={() => toast.success("Published! (mock)")}>
                        <RiSendPlaneLine className="h-4 w-4" />
                        {isScheduling ? t("schedule") : t("publishNow")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
