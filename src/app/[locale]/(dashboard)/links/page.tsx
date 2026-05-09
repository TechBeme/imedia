"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
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
    Folder,
    FolderOpen,
    Filter,
    ArrowUpDown,
    Users,
    X,
} from "lucide-react";

interface TagItem {
    id: string;
    name: string;
    color: string | null;
    linkCount: number;
}

interface FolderItem {
    id: string;
    name: string;
    linkCount: number;
}

interface LinkItem {
    id: string;
    originalUrl: string;
    slug: string;
    customSlug: boolean;
    domain: string;
    title: string | null;
    description: string | null;
    tags: { id: string; name: string; color: string | null }[];
    folder: { id: string; name: string } | null;
    isActive: boolean;
    clickCount: number;
    uniqueVisitors: number;
    maxClicks: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

type SortOption = "createdAt_desc" | "createdAt_asc" | "clicks_desc" | "clicks_asc" | "visitors_desc" | "slug_asc";
type StatusFilter = "all" | "active" | "inactive" | "expired" | "scheduled";

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
    const searchParams = useSearchParams();

    const [links, setLinks] = useState<LinkItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [tags, setTags] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filters
    const [selectedFolder, setSelectedFolder] = useState<string | null>(searchParams.get("folder"));
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("createdAt_desc");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadFolders() {
            try {
                const res = await fetch("/api/links/folders");
                const data = await res.json();
                if (!cancelled && data.data?.folders) {
                    setFolders(data.data.folders);
                }
            } catch {
                // silently fail
            }
        }

        async function loadTags() {
            try {
                const res = await fetch("/api/links/tags");
                const data = await res.json();
                if (!cancelled && data.data?.tags) {
                    setTags(data.data.tags);
                }
            } catch {
                // silently fail
            }
        }

        async function loadLinks() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedFolder) params.set("folderId", selectedFolder);
                if (selectedTagIds.length > 0) params.set("tagIds", selectedTagIds.join(","));
                if (statusFilter !== "all") params.set("status", statusFilter);
                params.set("sort", sortBy);

                const res = await fetch(`/api/links?${params.toString()}`);
                const data = await res.json();
                if (!cancelled && data.data?.links) {
                    setLinks(data.data.links);
                }
            } catch {
                if (!cancelled) toast.error(tc("error"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadFolders();
        loadTags();
        loadLinks();

        return () => { cancelled = true; };
    }, [selectedFolder, selectedTagIds, statusFilter, sortBy, tc]);

    // Compute filtered links via useMemo to avoid setState in effect
    const filteredLinks = useMemo(() => {
        let result = [...links];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (l) =>
                    l.slug.toLowerCase().includes(q) ||
                    l.originalUrl.toLowerCase().includes(q) ||
                    l.title?.toLowerCase().includes(q) ||
                    l.tags?.some((tag) => tag.name.toLowerCase().includes(q))
            );
        }
        return result;
    }, [links, search]);

    function toggleTag(tagId: string) {
        setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    }

    function clearFilters() {
        setSearch("");
        setSelectedFolder(null);
        setSelectedTagIds([]);
        setStatusFilter("all");
        setSortBy("createdAt_desc");
    }

    const hasFilters = search || selectedFolder || selectedTagIds.length > 0 || statusFilter !== "all" || sortBy !== "createdAt_desc";

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

            {/* Search + Filter Toggle */}
            <motion.div variants={itemVariants} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                    />
                </div>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    size="icon"
                    className="rounded-xl cursor-pointer shrink-0"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4" />
                </Button>
            </motion.div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="glass-card">
                            <CardContent className="p-4 space-y-4">
                                {/* Sort */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{t("sortBy")}</span>
                                    {([
                                        { value: "createdAt_desc", label: t("sortNewest") },
                                        { value: "createdAt_asc", label: t("sortOldest") },
                                        { value: "clicks_desc", label: t("sortClicksDesc") },
                                        { value: "clicks_asc", label: t("sortClicksAsc") },
                                        { value: "visitors_desc", label: t("sortVisitorsDesc") },
                                        { value: "slug_asc", label: t("sortSlug") },
                                    ] as { value: SortOption; label: string }[]).map((opt) => (
                                        <Badge
                                            key={opt.value}
                                            variant={sortBy === opt.value ? "default" : "outline"}
                                            className="cursor-pointer rounded-lg text-xs"
                                            onClick={() => setSortBy(opt.value)}
                                        >
                                            {opt.label}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-muted-foreground">{t("status")}</span>
                                    {([
                                        { value: "all", label: t("all") },
                                        { value: "active", label: t("active") },
                                        { value: "inactive", label: t("inactive") },
                                        { value: "expired", label: t("expired") },
                                        { value: "scheduled", label: t("scheduled") },
                                    ] as { value: StatusFilter; label: string }[]).map((opt) => (
                                        <Badge
                                            key={opt.value}
                                            variant={statusFilter === opt.value ? "default" : "outline"}
                                            className="cursor-pointer rounded-lg text-xs"
                                            onClick={() => setStatusFilter(opt.value)}
                                        >
                                            {opt.label}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Tags */}
                                {tags.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{t("tags")}</span>
                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                                                className="cursor-pointer rounded-lg text-xs"
                                                style={selectedTagIds.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : undefined}
                                                onClick={() => toggleTag(tag.id)}
                                            >
                                                {tag.name} ({tag.linkCount})
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {hasFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="cursor-pointer text-muted-foreground"
                                        onClick={clearFilters}
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        {t("clearFilters")}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active filter chips */}
            {hasFilters && (
                <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
                    {selectedFolder && (
                        <Badge variant="secondary" className="rounded-lg text-xs gap-1">
                            <Folder className="h-3 w-3" />
                            {folders.find((f) => f.id === selectedFolder)?.name}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedFolder(null)} />
                        </Badge>
                    )}
                    {selectedTagIds.map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId);
                        return tag ? (
                            <Badge key={tagId} variant="secondary" className="rounded-lg text-xs gap-1">
                                <Tag className="h-3 w-3" />
                                {tag.name}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tagId)} />
                            </Badge>
                        ) : null;
                    })}
                    {statusFilter !== "all" && (
                        <Badge variant="secondary" className="rounded-lg text-xs gap-1">
                            {t("status")}: {t(statusFilter)}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                        </Badge>
                    )}
                </motion.div>
            )}

            {/* Main content: sidebar + links */}
            <div className="flex gap-6">
                {/* Folders Sidebar */}
                {folders.length > 0 && (
                    <motion.div variants={itemVariants} className="hidden lg:block w-56 shrink-0">
                        <div className="space-y-1">
                            <button
                                onClick={() => setSelectedFolder(null)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${!selectedFolder
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent"
                                    }`}
                            >
                                <FolderOpen className="h-4 w-4" />
                                {t("allLinks")}
                                <span className="ml-auto text-xs opacity-60">{links.length}</span>
                            </button>
                            {folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selectedFolder === folder.id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent"
                                        }`}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span className="truncate">{folder.name}</span>
                                    <span className="ml-auto text-xs opacity-60 shrink-0">{folder.linkCount}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Links List */}
                <div className="flex-1 min-w-0">
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
                            <h3 className="text-lg font-medium">{search || hasFilters ? t("noSearchResults") : t("noLinks")}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{search || hasFilters ? t("tryDifferentSearch") : t("createFirst")}</p>
                            {!search && !hasFilters && (
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
                                                            {link.folder && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Folder className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-xs text-muted-foreground">{link.folder.name}</span>
                                                                </div>
                                                            )}
                                                            {link.tags && link.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                    {link.tags.map((tag) => (
                                                                        <Badge
                                                                            key={tag.id}
                                                                            variant="secondary"
                                                                            className="text-[10px] rounded-md px-1.5 py-0"
                                                                            style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" } : undefined}
                                                                        >
                                                                            <Tag className="h-2.5 w-2.5 mr-0.5" />
                                                                            {tag.name}
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
                                                            <span className="flex items-center gap-1" title={t("totalClicks")}>
                                                                <BarChart3 className="h-3 w-3" />
                                                                {link.clickCount}
                                                                {link.maxClicks !== null && (
                                                                    <span className="text-muted-foreground/60">/{link.maxClicks}</span>
                                                                )}
                                                            </span>
                                                            <span className="flex items-center gap-1" title={t("uniqueVisitors")}>
                                                                <Users className="h-3 w-3" />
                                                                {link.uniqueVisitors}
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
                </div>
            </div>
        </motion.div>
    );
}
