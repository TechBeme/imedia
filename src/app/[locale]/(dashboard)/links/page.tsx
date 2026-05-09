"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
    Plus,
    Loader2,
    Search,
    ExternalLink,
    Copy,
    Check,
    Pencil,
    Trash2,
    BarChart3,
    Tag,
    Calendar,
    Globe,
    Link2,
} from "lucide-react";

interface LinkItem {
    id: string;
    originalUrl: string;
    slug: string;
    customSlug: boolean;
    domain: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
    isActive: boolean;
    clickCount: number;
    maxClicks: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function LinksPage() {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchLinks();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredLinks(links);
            return;
        }
        const q = search.toLowerCase();
        setFilteredLinks(
            links.filter(
                (l) =>
                    l.slug.toLowerCase().includes(q) ||
                    l.originalUrl.toLowerCase().includes(q) ||
                    l.title?.toLowerCase().includes(q) ||
                    l.tags?.some((tag) => tag.toLowerCase().includes(q))
            )
        );
    }, [search, links]);

    async function fetchLinks() {
        try {
            const res = await fetch("/api/links");
            const data = await res.json();
            if (data.data?.links) {
                setLinks(data.data.links);
                setFilteredLinks(data.data.links);
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy(link: LinkItem) {
        const baseUrl = link.domain
            ? `https://${link.domain}`
            : (process.env.NEXT_PUBLIC_APP_URL || "");
        const shortUrl = `${baseUrl}/l/${link.slug}`;
        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopiedId(link.id);
            toast.success(t("copied"));
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error(tc("error"));
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t("deleteConfirm"))) return;
        const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success(t("deleteSuccess"));
            setLinks((prev) => prev.filter((l) => l.id !== id));
        } else {
            toast.error(tc("error"));
        }
    }

    async function handleToggle(id: string, isActive: boolean) {
        const res = await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive }),
        });
        if (res.ok) {
            setLinks((prev) =>
                prev.map((l) => (l.id === id ? { ...l, isActive } : l))
            );
        } else {
            toast.error(tc("error"));
        }
    }

    function getStatusBadge(link: LinkItem) {
        const now = new Date();
        if (link.expiresAt && new Date(link.expiresAt) < now) {
            return <Badge variant="destructive" className="rounded-lg text-[10px]">{t("expired")}</Badge>;
        }
        if (link.startsAt && new Date(link.startsAt) > now) {
            return <Badge variant="outline" className="rounded-lg text-[10px]">{t("scheduled")}</Badge>;
        }
        if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
            return <Badge variant="secondary" className="rounded-lg text-[10px]">{t("limitReached")}</Badge>;
        }
        return (
            <Badge
                variant={link.isActive ? "default" : "secondary"}
                className={
                    link.isActive
                        ? "bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px]"
                        : "rounded-lg text-[10px]"
                }
            >
                {link.isActive ? t("active") : t("inactive")}
            </Badge>
        );
    }

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
                    <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
                </div>
                <Button
                    onClick={() => router.push("/links/new")}
                    className="rounded-xl cursor-pointer shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("create")}
                </Button>
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </motion.div>

            {/* Links List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredLinks.length === 0 ? (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Link2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">{search ? t("noSearchResults") : t("noLinks")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{search ? t("tryDifferentSearch") : t("createFirst")}</p>
                    {!search && (
                        <Button
                            onClick={() => router.push("/links/new")}
                            className="mt-4 rounded-xl cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("create")}
                        </Button>
                    )}
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredLinks.map((link) => {
                            const baseUrl = link.domain
                                ? `https://${link.domain}`
                                : (process.env.NEXT_PUBLIC_APP_URL || "");
                            const shortUrl = `${baseUrl}/l/${link.slug}`;

                            return (
                                <motion.div
                                    key={link.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Card className="glass-card transition-shadow duration-200 hover:shadow-md">
                                        <CardContent className="p-4 space-y-3">
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <a
                                                            href={shortUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-semibold text-primary hover:underline truncate inline-flex items-center gap-1"
                                                        >
                                                            {shortUrl.replace(/^https?:\/\//, "")}
                                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                                        </a>
                                                        {getStatusBadge(link)}
                                                        {link.customSlug && (
                                                            <Badge variant="outline" className="rounded-lg text-[10px]">
                                                                {t("custom")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {link.title && (
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {link.title}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {link.originalUrl}
                                                    </p>
                                                    {link.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                            {link.description}
                                                        </p>
                                                    )}
                                                    {link.tags && link.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {link.tags.map((tag) => (
                                                                <Badge
                                                                    key={tag}
                                                                    variant="secondary"
                                                                    className="text-[10px] rounded-md px-1.5 py-0"
                                                                >
                                                                    <Tag className="h-2.5 w-2.5 mr-0.5" />
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="cursor-pointer"
                                                        onClick={() => router.push(`/links/${link.id}/analytics`)}
                                                        title={t("analytics")}
                                                    >
                                                        <BarChart3 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="cursor-pointer"
                                                        onClick={() => handleCopy(link)}
                                                        title={t("copy")}
                                                    >
                                                        {copiedId === link.id ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="cursor-pointer"
                                                        onClick={() => router.push(`/links/${link.id}/edit`)}
                                                        title={tc("edit")}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="cursor-pointer text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(link.id)}
                                                        title={tc("delete")}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Bottom row */}
                                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="h-3 w-3" />
                                                        {link.clickCount}
                                                        {link.maxClicks !== null && (
                                                            <span className="text-muted-foreground/60">/{link.maxClicks}</span>
                                                        )}
                                                    </span>
                                                    {link.startsAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(link.startsAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {link.expiresAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(link.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {link.domain && (
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {link.domain}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{t("status")}</span>
                                                    <Switch
                                                        size="sm"
                                                        checked={link.isActive}
                                                        onCheckedChange={(checked) => handleToggle(link.id, checked)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
}
