"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

const platforms = [
    { key: "instagram", label: "Instagram" },
    { key: "youtube", label: "YouTube" },
    { key: "tiktok", label: "TikTok" },
    { key: "x", label: "X (Twitter)" },
    { key: "facebook", label: "Facebook" },
    { key: "threads", label: "Threads" },
] as const;

const formSchema = z.object({
    platform: z.enum(platforms.map((p) => p.key) as [string, ...string[]]),
    appId: z.string().min(1, "App ID is required"),
    appSecret: z.string().min(1, "App Secret is required"),
    redirectUri: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface PlatformCredentialFormProps {
    onSuccess?: () => void;
}

export default function PlatformCredentialForm({ onSuccess }: PlatformCredentialFormProps) {
    const t = useTranslations("credentials");
    const tc = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const selectedPlatform = watch("platform");

    async function onSubmit(data: FormData) {
        setSubmitting(true);
        try {
            const payload: Record<string, string> = {
                platform: data.platform,
                appId: data.appId,
                appSecret: data.appSecret,
            };
            if (data.redirectUri) {
                payload.redirectUri = data.redirectUri;
            }

            const res = await fetch("/api/platform-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                toast.error(result.error?.message || tc("error"));
                return;
            }

            toast.success(t("saveSuccess"));
            reset();
            setOpen(false);
            onSuccess?.();
        } catch {
            toast.error(tc("error"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t("addCredentials")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading">{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="platform">{t("platform")}</Label>
                        <Select
                            value={selectedPlatform}
                            onValueChange={(value) => {
                                if (value) setValue("platform", value);
                            }}
                        >
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={t("selectPlatform")} />
                            </SelectTrigger>
                            <SelectContent>
                                {platforms.map((p) => (
                                    <SelectItem key={p.key} value={p.key}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.platform && (
                            <p className="text-xs text-red-500">{errors.platform.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="appId">{t("appId")}</Label>
                        <Input
                            id="appId"
                            {...register("appId")}
                            placeholder={t("appIdPlaceholder")}
                            className="rounded-xl"
                        />
                        {errors.appId && (
                            <p className="text-xs text-red-500">{errors.appId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="appSecret">{t("appSecret")}</Label>
                        <Input
                            id="appSecret"
                            type="password"
                            {...register("appSecret")}
                            placeholder={t("appSecretPlaceholder")}
                            className="rounded-xl"
                        />
                        {errors.appSecret && (
                            <p className="text-xs text-red-500">{errors.appSecret.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="redirectUri">{t("redirectUri")}</Label>
                        <Input
                            id="redirectUri"
                            {...register("redirectUri")}
                            placeholder={t("redirectUriPlaceholder")}
                            className="rounded-xl"
                        />
                        {errors.redirectUri && (
                            <p className="text-xs text-red-500">{errors.redirectUri.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl w-full"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t("save")
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
