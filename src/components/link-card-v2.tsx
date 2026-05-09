"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LinkActionsMenu } from "./link-actions-menu";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
    Copy,
    Check,
    ExternalLink,
    Tag,
    Folder,
    Calendar,
    Globe,
    MousePointerClick,
    Users,
} from "lucide-react";

interface TagItem {
    id: string;
    name: string;
    color: string | null;
}

interface FolderItem {
    id: string;
    name: string;
}

export interface LinkItemV2 {
    id: string;
    originalUrl: string;
    slug: string;
    customSlug: boolean;
    domain: string;
    title: string | null;
    description: string | null;
    tags: TagItem[];
    folder: FolderItem | null;
    isActive: boolean;
    clickCount: number;
    uniqueVisitors: number;
    maxClicks: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    password: string | null;
}

interface LinkCardV2Props {
    link: LinkItemV2;
    onDelete: (id: string) => void;
    onToggle: (id: string, isActive: boolean) => void;
}

export function LinkCardV2({ link, onDelete, onToggle }: LinkCardV2Props) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    const baseUrl = link.domain
        ? `https://${link.domain}`
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const shortUrl = `${baseUrl}/l/${link.slug}`;
    const shortUrlDisplay = shortUrl.replace(/^https?:\/\//, "");

    async function handleCopy(e: React.MouseEvent) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            toast.success(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(tc("error"));
        }
    }

    function getStatusBadge() {
        const now = new Date();
        if (link.expiresAt && new Date(link.expiresAt) < now) {
            return (
                <Badge variant="outline" className="rounded-md text-[10px] border-red-200 text-red-600 bg-red-50">
                    {t("expired")}
                </Badge>
            );
        }
        if (link.startsAt && new Date(link.startsAt) > now) {
            return (
                <Badge variant="outline" className="rounded-md text-[10px] border-amber-200 text-amber-600 bg-amber-50">
                    {t("scheduled")}
                </Badge>
            );
        }
        if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
            return (
                <Badge variant="outline" className="rounded-md text-[10px] border-orange-200 text-orange-600 bg-orange-50">
                    {t("limitReached")}
                </Badge>
            );
        }
        if (link.isActive) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("active")}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                {t("inactive")}
            </span>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="group relative border border-border/60 hover:border-border/90 hover:shadow-sm transition-all duration-200 bg-card/50">
                <div className="p-4">
                    {/* Top row: URL + actions */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                            {/* Short URL */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <a
                                    href={shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {shortUrlDisplay}
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </a>
                                <button
                                    onClick={handleCopy}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                                    title={t("copy")}
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>
                                {getStatusBadge()}
                                {link.customSlug && (
                                    <Badge variant="outline" className="rounded-md text-[10px]">
                                        {t("custom")}
                                    </Badge>
                                )}
                                {link.password && (
                                    <Badge variant="outline" className="rounded-md text-[10px]">
                                        <svg className="h-2.5 w-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Protected
                                    </Badge>
                                )}
                            </div>

                            {/* Original URL */}
                            <p className="text-xs text-muted-foreground truncate">
                                {link.originalUrl}
                            </p>

                            {/* Title */}
                            {link.title && (
                                <p className="text-xs font-medium text-foreground/80 truncate">
                                    {link.title}
                                </p>
                            )}

                            {/* Tags & Folder */}
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {link.folder && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Folder className="h-3 w-3" />
                                        {link.folder.name}
                                    </span>
                                )}
                                {link.tags?.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-md"
                                        style={
                                            tag.color
                                                ? {
                                                    backgroundColor: tag.color + "18",
                                                    color: tag.color,
                                                }
                                                : undefined
                                        }
                                    >
                                        <Tag className="h-2.5 w-2.5" />
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right side: clicks + menu */}
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => router.push(`/links/${link.id}/analytics`)}
                            >
                                <MousePointerClick className="h-3.5 w-3.5" />
                                {link.clickCount}
                            </Button>
                            <LinkActionsMenu
                                link={{
                                    id: link.id,
                                    slug: link.slug,
                                    domain: link.domain,
                                    originalUrl: link.originalUrl,
                                }}
                                onDelete={onDelete}
                            />
                        </div>
                    </div>

                    {/* Bottom row: metadata + toggle */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {link.uniqueVisitors}
                            </span>
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
                            <span>
                                {new Date(link.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <Switch
                            size="sm"
                            checked={link.isActive}
                            onCheckedChange={(checked) => onToggle(link.id, checked)}
                        />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
