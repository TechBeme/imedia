"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Search, Plus, Globe, MoreVertical, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TagItem {
    id: string;
    name: string;
    color: string;
    linkCount: number;
}

const mockTags: TagItem[] = [
    { id: "1", name: "Marketing", color: "#ef4444", linkCount: 12 },
    { id: "2", name: "Social", color: "#8b5cf6", linkCount: 8 },
    { id: "3", name: "Blog", color: "#3b82f6", linkCount: 5 },
    { id: "4", name: "Campaign", color: "#f59e0b", linkCount: 3 },
];

export default function TagsPage() {
    const t = useTranslations("tags");
    const tc = useTranslations("common");
    const [tags, setTags] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [newTagName, setNewTagName] = useState("");

    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch("/api/links/tags");
            const data = await res.json();
            if (res.ok && data.data?.tags) {
                setTags(data.data.tags);
            } else {
                setTags(mockTags);
            }
        } catch {
            setTags(mockTags);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTags();
    }, [fetchTags]);

    async function handleCreateTag() {
        if (!newTagName.trim()) return;
        try {
            const res = await fetch("/api/links/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName.trim(), color: "#3b82f6" }),
            });
            if (res.ok) {
                toast.success(t("createSuccess"));
                setNewTagName("");
                fetchTags();
            } else {
                toast.error(tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        }
    }

    async function handleDeleteTag(id: string) {
        try {
            const res = await fetch(`/api/links/tags/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(t("deleteSuccess"));
                fetchTags();
            } else {
                toast.error(tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        }
    }

    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase())
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t("description")}</p>
                </div>
                <Button
                    onClick={() => document.getElementById("new-tag-input")?.focus()}
                    className="rounded-xl shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("createTag")}
                </Button>
            </div>

            {/* Create Tag Card */}
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Input
                            id="new-tag-input"
                            placeholder={t("newTagPlaceholder")}
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                            className="rounded-xl flex-1"
                        />
                        <Button onClick={handleCreateTag} className="rounded-xl shadow-sm">
                            <Plus className="h-4 w-4 mr-1" />
                            {tc("create")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={tc("search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </div>

            {/* Tags List */}
            {filteredTags.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{search ? tc("noResults") : t("noTags")}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {filteredTags.map((tag) => (
                            <motion.div
                                key={tag.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="glass-card hover:shadow-md transition-shadow">
                                    <CardContent className="py-4 px-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-8 w-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${tag.color}20` }}
                                            >
                                                <Tag className="h-4 w-4" style={{ color: tag.color }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{tag.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    {tag.linkCount} {t("links")}
                                                </p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                    className="text-destructive cursor-pointer"
                                                >
                                                    {tc("delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
