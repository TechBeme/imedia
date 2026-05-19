"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Folder, Search, Plus, Globe, MoreVertical, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderItem {
    id: string;
    name: string;
    color: string;
    linkCount: number;
}

const mockFolders: FolderItem[] = [
    { id: "1", name: "Marketing", color: "#3b82f6", linkCount: 8 },
    { id: "2", name: "Social Media", color: "#8b5cf6", linkCount: 5 },
    { id: "3", name: "Blog Posts", color: "#10b981", linkCount: 3 },
];

export default function FoldersPage() {
    const t = useTranslations("folders");
    const tc = useTranslations("common");
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [newFolderName, setNewFolderName] = useState("");

    const fetchFolders = useCallback(async () => {
        try {
            const res = await fetch("/api/links/folders");
            const data = await res.json();
            if (res.ok && data.data?.folders) {
                setFolders(data.data.folders);
            } else {
                setFolders(mockFolders);
            }
        } catch {
            setFolders(mockFolders);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchFolders();
    }, [fetchFolders]);

    async function handleCreateFolder() {
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch("/api/links/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newFolderName.trim(), color: "#3b82f6" }),
            });
            if (res.ok) {
                toast.success(t("createSuccess"));
                setNewFolderName("");
                fetchFolders();
            } else {
                toast.error(tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        }
    }

    async function handleDeleteFolder(id: string) {
        try {
            const res = await fetch(`/api/links/folders/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(t("deleteSuccess"));
                fetchFolders();
            } else {
                toast.error(tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        }
    }

    const filteredFolders = folders.filter((folder) =>
        folder.name.toLowerCase().includes(search.toLowerCase())
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
                        <Folder className="h-5 w-5 text-primary" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t("description")}</p>
                </div>
                <Button
                    onClick={() => document.getElementById("new-folder-input")?.focus()}
                    className="rounded-xl shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("createFolder")}
                </Button>
            </div>

            {/* Create Folder Card */}
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Input
                            id="new-folder-input"
                            placeholder={t("newFolderPlaceholder")}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                            className="rounded-xl flex-1"
                        />
                        <Button onClick={handleCreateFolder} className="rounded-xl shadow-sm">
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

            {/* Folders List */}
            {filteredFolders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{search ? tc("noResults") : t("noFolders")}</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredFolders.map((folder) => (
                            <motion.div
                                key={folder.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="glass-card hover:shadow-md transition-shadow">
                                    <CardContent className="py-5 px-5">
                                        <div className="flex items-start justify-between">
                                            <div
                                                className="h-10 w-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${folder.color}20` }}
                                            >
                                                <Folder className="h-5 w-5" style={{ color: folder.color }} />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg -mt-1 -mr-1">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteFolder(folder.id)}
                                                        className="text-destructive cursor-pointer"
                                                    >
                                                        {tc("delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm font-medium">{folder.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Globe className="h-3 w-3" />
                                                {folder.linkCount} {t("links")}
                                            </p>
                                        </div>
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
