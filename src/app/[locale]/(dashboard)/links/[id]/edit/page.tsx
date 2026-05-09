"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { LinkCreateForm, DeviceRule } from "@/components/link-create-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";

interface TagItem {
    id: string;
    name: string;
    color: string | null;
}

interface FolderItem {
    id: string;
    name: string;
    color: string;
}

interface LinkData {
    id: string;
    originalUrl: string;
    slug: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
    tagIds?: string[];
    domain: string;
    folderId: string | null;
    folder: FolderItem | null;
    password: string | null;
    startsAt: string | null;
    expiresAt: string | null;
    maxClicks: number | null;
    isActive: boolean;
    deviceRules: { os: string; url: string; priority: number }[];
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageUrl: string | null;
    expiredRedirectUrl: string | null;
}

export default function EditLinkPage() {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [link, setLink] = useState<LinkData | null>(null);
    const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLink = useCallback(async () => {
        try {
            const res = await fetch(`/api/links/${id}`);
            const data = await res.json();
            if (res.ok && data.data?.link) {
                setLink(data.data.link);
            } else {
                toast.error(t("linkNotFound"));
                router.push("/links");
            }
        } catch {
            toast.error(tc("error"));
            router.push("/links");
        } finally {
            setLoading(false);
        }
    }, [id, t, tc, router]);

    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch("/api/links/tags");
            const data = await res.json();
            if (data.data?.tags) {
                setAvailableTags(data.data.tags);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            await fetchLink();
            if (!cancelled) await fetchTags();
        }
        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function handleUpdate(data: {
        originalUrl: string;
        slug: string;
        title: string;
        description: string;
        tags: string[];
        tagIds: string[];
        password: string;
        domain: string;
        folderId: string;
        startsAt: string;
        expiresAt: string;
        maxClicks: string;
        isActive: boolean;
        deviceRules: { os: string; url: string; priority: number }[];
        ogTitle: string;
        ogDescription: string;
        ogImageUrl: string;
        expiredRedirectUrl: string;
    }) {
        const body: Record<string, unknown> = {};
        if (data.originalUrl) body.originalUrl = data.originalUrl;
        if (data.title !== undefined) body.title = data.title || null;
        if (data.description !== undefined) body.description = data.description || null;
        body.tags = data.tags.length > 0 ? data.tags : null;
        body.tagIds = data.tagIds.length > 0 ? data.tagIds : null;
        if (data.password) body.password = data.password;
        else if (data.password === "") body.password = null;
        if (data.folderId) body.folderId = data.folderId;
        else if (data.folderId === "") body.folderId = null;
        if (data.startsAt) body.startsAt = data.startsAt;
        else if (data.startsAt === "") body.startsAt = null;
        if (data.expiresAt) body.expiresAt = data.expiresAt;
        else if (data.expiresAt === "") body.expiresAt = null;
        if (data.maxClicks) body.maxClicks = parseInt(data.maxClicks, 10);
        else if (data.maxClicks === "") body.maxClicks = null;
        body.isActive = data.isActive;
        body.deviceRules = data.deviceRules.length > 0 ? data.deviceRules : null;
        if (data.ogTitle !== undefined) body.ogTitle = data.ogTitle || null;
        if (data.ogDescription !== undefined) body.ogDescription = data.ogDescription || null;
        if (data.ogImageUrl !== undefined) body.ogImageUrl = data.ogImageUrl || null;
        if (data.expiredRedirectUrl !== undefined) body.expiredRedirectUrl = data.expiredRedirectUrl || null;

        const res = await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await res.json();
        if (res.ok) {
            toast.success(t("updateSuccess"));
        } else {
            toast.error(result.error?.message || tc("error"));
            throw new Error(result.error?.message);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!link) return null;

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
                    {t("editLink")}
                </h1>
            </div>
            <LinkCreateForm
                initialData={{
                    id: link.id,
                    originalUrl: link.originalUrl,
                    slug: link.slug,
                    title: link.title || "",
                    description: link.description || "",
                    tags: link.tags || [],
                    tagIds: (link.tags || []).map((t) => {
                        const found = availableTags.find((at) => at.name === t);
                        return found?.id;
                    }).filter(Boolean) as string[],
                    password: "",
                    domain: link.domain,
                    folderId: link.folderId || "",
                    startsAt: link.startsAt || "",
                    expiresAt: link.expiresAt || "",
                    maxClicks: link.maxClicks?.toString() || "",
                    isActive: link.isActive,
                    deviceRules: (link.deviceRules || []).map((r) => ({
                        os: r.os as DeviceRule["os"],
                        url: r.url,
                        priority: r.priority,
                    })),
                    ogTitle: link.ogTitle || "",
                    ogDescription: link.ogDescription || "",
                    ogImageUrl: link.ogImageUrl || "",
                    expiredRedirectUrl: link.expiredRedirectUrl || "",
                }}
                onSubmit={handleUpdate}
                isEditing
            />
        </motion.div>
    );
}
