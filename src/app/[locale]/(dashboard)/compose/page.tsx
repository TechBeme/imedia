"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Loader2, X, ImageIcon, Film, Layers, Square } from "lucide-react";
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

type MediaType = "image" | "carousel" | "reel" | "story";

interface UploadedFile {
    file: File;
    preview: string;
    url?: string;
    uploading: boolean;
}

const platforms = [
    { key: "instagram", icon: RiInstagramLine, color: "text-pink-500", label: "Instagram" },
    { key: "facebook", icon: RiFacebookCircleLine, color: "text-blue-600", label: "Facebook" },
    { key: "threads", icon: RiThreadsLine, color: "text-foreground", label: "Threads" },
    { key: "youtube", icon: RiYoutubeLine, color: "text-red-500", label: "YouTube" },
    { key: "tiktok", icon: RiTiktokLine, color: "text-foreground", label: "TikTok" },
    { key: "x", icon: RiTwitterXLine, color: "text-foreground", label: "X" },
];

const mediaTypes: { key: MediaType; label: string; icon: typeof ImageIcon; maxFiles: number; accept: string }[] = [
    { key: "image", label: "Imagem", icon: ImageIcon, maxFiles: 1, accept: "image/*" },
    { key: "carousel", label: "Carrossel", icon: Layers, maxFiles: 10, accept: "image/*" },
    { key: "reel", label: "Reel", icon: Film, maxFiles: 1, accept: "video/*" },
    { key: "story", label: "Story", icon: Square, maxFiles: 1, accept: "image/*,video/*" },
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
    const [mediaType, setMediaType] = useState<MediaType>("image");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const composeSchema = getComposeSchema(t);
    const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<ComposeForm>({
        resolver: zodResolver(composeSchema),
    });

    const content = watch("content") || "";

    const currentMediaType = mediaTypes.find((m) => m.key === mediaType)!;

    function togglePlatform(key: string) {
        setSelectedPlatforms((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    }

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, currentMediaType.maxFiles));

        // Upload each file
        for (let i = 0; i < newFiles.length; i++) {
            const uploadedFile = newFiles[i];
            const formData = new FormData();
            formData.append("file", uploadedFile.file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (data.data?.url) {
                    setUploadedFiles((prev) =>
                        prev.map((f, idx) =>
                            f.preview === uploadedFile.preview
                                ? { ...f, url: data.data.url, uploading: false }
                                : f
                        )
                    );
                } else {
                    toast.error(`Falha ao enviar ${uploadedFile.file.name}`);
                    setUploadedFiles((prev) =>
                        prev.filter((f) => f.preview !== uploadedFile.preview)
                    );
                }
            } catch {
                toast.error(`Falha ao enviar ${uploadedFile.file.name}`);
                setUploadedFiles((prev) =>
                    prev.filter((f) => f.preview !== uploadedFile.preview)
                );
            }
        }
    }, [currentMediaType.maxFiles]);

    function removeFile(preview: string) {
        setUploadedFiles((prev) => prev.filter((f) => f.preview !== preview));
        URL.revokeObjectURL(preview);
    }

    async function handlePublish(data: ComposeForm) {
        if (uploadedFiles.length === 0) {
            toast.error("Adicione pelo menos uma mídia");
            return;
        }

        const readyFiles = uploadedFiles.filter((f) => f.url && !f.uploading);
        if (readyFiles.length !== uploadedFiles.length) {
            toast.error("Aguarde o upload de todas as mídias");
            return;
        }

        setPublishing(true);
        try {
            const res = await fetch("/api/instagram/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: data.content,
                    mediaType,
                    mediaUrls: readyFiles.map((f) => f.url!),
                }),
            });

            const result = await res.json();

            if (result.data) {
                toast.success("Publicado com sucesso!");
                reset();
                setUploadedFiles([]);
            } else {
                toast.error(result.error?.message || "Falha ao publicar");
            }
        } catch {
            toast.error("Falha ao publicar");
        } finally {
            setPublishing(false);
        }
    }

    function onSubmit(data: ComposeForm) {
        toast.success(t("draftSaved"));
        console.log({ ...data, platforms: selectedPlatforms, mediaFiles: uploadedFiles });
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
                        <CardContent className="space-y-4">
                            {/* Media type selector */}
                            <div className="flex gap-2">
                                {mediaTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isActive = mediaType === type.key;
                                    return (
                                        <button
                                            key={type.key}
                                            type="button"
                                            onClick={() => {
                                                setMediaType(type.key);
                                                setUploadedFiles([]);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                                                isActive
                                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {type.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Upload area */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={currentMediaType.accept}
                                multiple={currentMediaType.maxFiles > 1}
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />

                            {uploadedFiles.length === 0 ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center rounded-xl border border-dashed border-border/60 p-8 hover:bg-accent/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <RiImageAddLine className="h-8 w-8" />
                                        <span className="text-sm">{t("clickOrDrag")}</span>
                                        <span className="text-xs">
                                            {currentMediaType.maxFiles > 1
                                                ? `Até ${currentMediaType.maxFiles} imagens`
                                                : "1 arquivo"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {uploadedFiles.map((file) => (
                                        <div key={file.preview} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                                            {file.file.type.startsWith("video/") ? (
                                                <video
                                                    src={file.preview}
                                                    className="h-full w-full object-cover"
                                                    controls
                                                />
                                            ) : (
                                                <img
                                                    src={file.preview}
                                                    alt={file.file.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                            {file.uploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.preview)}
                                                className="absolute top-1 right-1 h-6 w-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {uploadedFiles.length < currentMediaType.maxFiles && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-xl border border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
                                        >
                                            <RiImageAddLine className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            )}
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
                        onClick={handleSubmit(handlePublish)}
                        disabled={publishing || uploadedFiles.some((f) => f.uploading)}
                    >
                        {publishing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RiSendPlaneLine className="h-4 w-4" />
                        )}
                        {publishing ? "Publicando..." : isScheduling ? t("schedule") : t("publishNow")}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );
}
