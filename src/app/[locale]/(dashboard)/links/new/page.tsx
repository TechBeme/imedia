"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LinkCreateForm } from "@/components/link-create-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

export default function NewLinkPage() {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();

    async function handleCreate(data: {
        originalUrl: string;
        slug: string;
        title: string;
        description: string;
        tags: string[];
        password: string;
        domain: string;
        startsAt: string;
        expiresAt: string;
        maxClicks: string;
        isActive: boolean;
        deviceRules: { os: string; url: string; priority: number }[];
    }) {
        const body: Record<string, unknown> = {
            originalUrl: data.originalUrl,
        };
        if (data.slug) body.slug = data.slug;
        if (data.title) body.title = data.title;
        if (data.description) body.description = data.description;
        if (data.tags.length > 0) body.tags = data.tags;
        if (data.password) body.password = data.password;
        if (data.domain) body.domain = data.domain;
        if (data.startsAt) body.startsAt = data.startsAt;
        if (data.expiresAt) body.expiresAt = data.expiresAt;
        if (data.maxClicks) body.maxClicks = parseInt(data.maxClicks, 10);
        if (data.deviceRules.length > 0) body.deviceRules = data.deviceRules;

        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await res.json();
        if (res.ok) {
            toast.success(t("createSuccess"));
        } else {
            toast.error(result.error?.message || tc("error"));
            throw new Error(result.error?.message);
        }
    }

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => router.push("/links")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight font-heading">
                    {t("createNewLink")}
                </h1>
            </div>
            <LinkCreateForm onSubmit={handleCreate} />
        </motion.div>
    );
}
