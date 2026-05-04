"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Copy, Check, ExternalLink, Trash2, Pencil } from "lucide-react";

interface LinkItem {
    id: string;
    originalUrl: string;
    slug: string;
    customSlug: boolean;
    isActive: boolean;
    clickCount: number;
    expiresAt: string | null;
    createdAt: string;
}

interface LinkCardProps {
    link: LinkItem;
    onDelete: (id: string) => void;
    onEdit: (link: LinkItem) => void;
    onToggle: (id: string, isActive: boolean) => void;
}

export function LinkCard({ link, onDelete, onEdit, onToggle }: LinkCardProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const [copied, setCopied] = useState(false);

    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${link.slug}`;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            toast.success(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(tc("error"));
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
        >
            <Card className="glass-card transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <a
                                    href={shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-primary hover:underline truncate inline-flex items-center gap-1"
                                >
                                    {shortUrl.replace(/^https?:\/\//, "")}
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
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
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {link.originalUrl}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="cursor-pointer"
                                onClick={handleCopy}
                                title={t("copy")}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="cursor-pointer"
                                onClick={() => onEdit(link)}
                                title={tc("edit")}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="cursor-pointer text-destructive hover:text-destructive"
                                onClick={() => onDelete(link.id)}
                                title={tc("delete")}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                                {t("clicks")}: <strong className="text-foreground">{link.clickCount}</strong>
                            </span>
                            {link.expiresAt && (
                                <span>
                                    {t("expiresAt")}: {new Date(link.expiresAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t("status")}</span>
                            <Switch
                                size="sm"
                                checked={link.isActive}
                                onCheckedChange={(checked) => onToggle(link.id, checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
