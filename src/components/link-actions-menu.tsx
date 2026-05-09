"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    MoreVertical,
    Pencil,
    QrCode,
    Copy,
    CopyIcon,
    Trash2,
    BarChart3,
    Archive,
} from "lucide-react";

interface LinkActionsMenuProps {
    link: {
        id: string;
        slug: string;
        domain: string;
        originalUrl: string;
    };
    onDelete?: (id: string) => void;
    onArchive?: (id: string) => void;
    onDuplicate?: (id: string) => void;
}

export function LinkActionsMenu({
    link,
    onDelete,
    onArchive,
    onDuplicate,
}: LinkActionsMenuProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    const baseUrl = link.domain
        ? `https://${link.domain}`
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const shortUrl = `${baseUrl}/l/${link.slug}`;

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

    function handleDelete() {
        if (!onDelete) return;
        if (!confirm(t("deleteConfirm"))) return;
        onDelete(link.id);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                    onClick={() => router.push(`/links/${link.id}/edit`)}
                    className="gap-2 cursor-pointer"
                >
                    <Pencil className="h-4 w-4" />
                    {t("edit")}
                    <span className="ml-auto text-xs text-muted-foreground">E</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => router.push(`/links/${link.id}/analytics`)}
                    className="gap-2 cursor-pointer"
                >
                    <BarChart3 className="h-4 w-4" />
                    {t("analytics")}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => router.push(`/links/${link.id}/qr`)}
                    className="gap-2 cursor-pointer"
                >
                    <QrCode className="h-4 w-4" />
                    {t("qrCode")}
                    <span className="ml-auto text-xs text-muted-foreground">Q</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
                    {copied ? (
                        <CopyIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    {t("copy")}
                </DropdownMenuItem>

                {onDuplicate && (
                    <DropdownMenuItem
                        onClick={() => onDuplicate(link.id)}
                        className="gap-2 cursor-pointer"
                    >
                        <Copy className="h-4 w-4" />
                        Duplicate
                        <span className="ml-auto text-xs text-muted-foreground">D</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {onArchive && (
                    <DropdownMenuItem
                        onClick={() => onArchive(link.id)}
                        className="gap-2 cursor-pointer"
                    >
                        <Archive className="h-4 w-4" />
                        Archive
                        <span className="ml-auto text-xs text-muted-foreground">A</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                    {t("delete")}
                    <span className="ml-auto text-xs text-muted-foreground">X</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
