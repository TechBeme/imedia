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
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
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

function getComposeSchema(t: (key: string) => string) {
    return z.object({
        content: z.string().min(1, t("contentRequired")).max(2200, t("tooLong")),
    });
}

type ComposeForm = z.infer<ReturnType<typeof getComposeSchema>>;

const platforms = [
    { key: "instagram", icon: RiInstagramLine, color: "text-pink-500", label: "Instagram" },
    { key: "facebook", icon: RiFacebookCircleLine, color: "text-blue-600", label: "Facebook" },
    { key: "threads", icon: RiThreadsLine, color: "text-foreground", label: "Threads" },
    { key: "youtube", icon: RiYoutubeLine, color: "text-red-500", label: "YouTube" },
    { key: "tiktok", icon: RiTiktokLine, color: "text-foreground", label: "TikTok" },
    { key: "x", icon: RiTwitterXLine, color: "text-foreground", label: "X" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function ComposePage() {
    const t = useTranslations("compose");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
    const [mediaFiles, setMediaFiles] = useState<string[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);

    const composeSchema = getComposeSchema(t);
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
        toast.success(t("draftSaved"));
        console.log({ ...data, platforms: selectedPlatforms, mediaFiles });
    }

    return (
        <motion.div
            className="space-y-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("selectPlatforms")}</CardTitle>
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
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                                isSelected
                                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                                            )}
                                        >
                                            <Icon className={cn("h-4 w-4", platform.color)} />
                                            {platform.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("content")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                {...register("content")}
                                placeholder={t("placeholder")}
                                rows={6}
                                className="resize-none rounded-xl border-border/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                            />
                            {errors.content && (
                                <p className="text-sm text-destructive">{errors.content.message}</p>
                            )}
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{content.length} / 2200 {t("characters")}</span>
                                <span>{selectedPlatforms.length} {t("platformsSelected")}</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("addMedia")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 p-8 hover:bg-accent/50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <RiImageAddLine className="h-8 w-8" />
                                    <span className="text-sm">{t("clickOrDrag")}</span>
                                    <span className="text-xs">{t("imagesVideos")}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold font-heading">{t("schedule")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={isScheduling}
                                    onCheckedChange={setIsScheduling}
                                    id="schedule-toggle"
                                    className="cursor-pointer"
                                />
                                <Label htmlFor="schedule-toggle" className="cursor-pointer">
                                    {isScheduling ? t("scheduleForLater") : t("publishImmediately")}
                                </Label>
                            </div>
                            {isScheduling && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 p-3 bg-muted/30">
                                    <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{t("dateTimePickerSoon")}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-3">
                    <Button type="submit" variant="outline" className="gap-2 rounded-xl cursor-pointer h-11">
                        <RiDraftLine className="h-4 w-4" />
                        {t("saveDraft")}
                    </Button>
                    <Button
                        type="button"
                        className="gap-2 flex-1 rounded-xl h-11 cursor-pointer shadow-sm shadow-primary/20"
                        onClick={() => toast.success(t("published"))}
                    >
                        <RiSendPlaneLine className="h-4 w-4" />
                        {isScheduling ? t("schedule") : t("publishNow")}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );
}
