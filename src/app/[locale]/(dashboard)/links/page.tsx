"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { LinkCard } from "@/components/link-card";
import { LinkForm } from "@/components/link-form";
import { Plus, Loader2 } from "lucide-react";

interface LinkItem {
    id: string;
    originalUrl: string;
    slug: string;
    customSlug: boolean;
    domain: string;
    isActive: boolean;
    clickCount: number;
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
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

    useEffect(() => {
        fetchLinks();
    }, []);

    async function fetchLinks() {
        try {
            const res = await fetch("/api/links");
            const data = await res.json();
            if (data.links) {
                setLinks(data.links);
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(data: {
        originalUrl: string;
        slug: string;
        password: string;
        expiresAt: string;
        isActive: boolean;
        domain: string;
    }) {
        const body: Record<string, unknown> = {
            originalUrl: data.originalUrl,
        };
        if (data.slug) body.slug = data.slug;
        if (data.password) body.password = data.password;
        if (data.expiresAt) body.expiresAt = data.expiresAt;
        if (data.domain) body.domain = data.domain;

        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await res.json();
        if (res.ok) {
            toast.success(t("createSuccess"));
            fetchLinks();
        } else {
            toast.error(result.error?.message || tc("error"));
            throw new Error(result.error?.message);
        }
    }

    async function handleUpdate(data: {
        id?: string;
        originalUrl: string;
        slug: string;
        password: string;
        expiresAt: string;
        isActive: boolean;
        domain: string;
    }) {
        if (!data.id) return;
        const body: Record<string, unknown> = {};
        if (data.originalUrl) body.originalUrl = data.originalUrl;
        if (data.isActive !== undefined) body.isActive = data.isActive;
        if (data.expiresAt) body.expiresAt = data.expiresAt;
        else if (data.expiresAt === "") body.expiresAt = null;
        if (data.password) body.password = data.password;
        else if (data.password === "") body.password = null;

        const res = await fetch(`/api/links/${data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await res.json();
        if (res.ok) {
            toast.success(t("updateSuccess"));
            fetchLinks();
        } else {
            toast.error(result.error?.message || tc("error"));
            throw new Error(result.error?.message);
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

    function openEdit(link: LinkItem) {
        setEditingLink(link);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingLink(null);
    }

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                </div>
                <Button
                    onClick={() => setFormOpen(true)}
                    className="rounded-xl cursor-pointer shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("create")}
                </Button>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : links.length === 0 ? (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">{t("noLinks")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("createFirst")}</p>
                    <Button
                        onClick={() => setFormOpen(true)}
                        className="mt-4 rounded-xl cursor-pointer"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("create")}
                    </Button>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {links.map((link) => (
                            <LinkCard
                                key={link.id}
                                link={link}
                                onDelete={handleDelete}
                                onEdit={openEdit}
                                onToggle={handleToggle}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <LinkForm
                open={formOpen}
                onOpenChange={closeForm}
                initialData={
                    editingLink
                        ? {
                            id: editingLink.id,
                            originalUrl: editingLink.originalUrl,
                            slug: editingLink.slug,
                            password: "",
                            expiresAt: editingLink.expiresAt || "",
                            isActive: editingLink.isActive,
                            domain: editingLink.domain,
                        }
                        : undefined
                }
                onSubmit={editingLink ? handleUpdate : handleCreate}
            />
        </motion.div>
    );
}
