"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Download, Copy, Check, Loader2 } from "lucide-react";

interface QRCodeGeneratorProps {
    linkId: string;
    slug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const sizes = [128, 256, 512, 1024];

export function QRCodeGenerator({ linkId, slug, open, onOpenChange }: QRCodeGeneratorProps) {
    const t = useTranslations("qrCode");
    const tc = useTranslations("common");
    const [format, setFormat] = useState<"png" | "svg">("png");
    const [size, setSize] = useState(256);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const qrUrl = `/api/links/${linkId}/qr?format=${format}&size=${size}`;
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${slug}`;

    async function handleDownload() {
        setDownloading(true);
        try {
            const res = await fetch(qrUrl);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `qrcode-${slug}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error(tc("error"));
        } finally {
            setDownloading(false);
        }
    }

    async function handleCopy() {
        try {
            const res = await fetch(qrUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob }),
            ]);
            setCopied(true);
            toast.success(t("copy"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(tc("error"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* QR Preview */}
                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="rounded-xl border border-border/40 p-3 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrUrl}
                                alt="QR Code"
                                className="rounded-lg"
                                style={{ width: 192, height: 192 }}
                            />
                        </div>
                    </motion.div>

                    {/* Format Toggle */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{t("format")}</p>
                        <div className="flex gap-2">
                            {(["png", "svg"] as const).map((f) => (
                                <Button
                                    key={f}
                                    variant={format === f ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 rounded-lg cursor-pointer capitalize"
                                    onClick={() => setFormat(f)}
                                >
                                    {f.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Size Selector */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{t("size")}</p>
                        <div className="flex gap-2">
                            {sizes.map((s) => (
                                <Button
                                    key={s}
                                    variant={size === s ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 rounded-lg cursor-pointer"
                                    onClick={() => setSize(s)}
                                >
                                    {s}px
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl cursor-pointer"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-4 w-4 mr-1 text-emerald-500" />
                            ) : (
                                <Copy className="h-4 w-4 mr-1" />
                            )}
                            {t("copy")}
                        </Button>
                        <Button
                            className="flex-1 rounded-xl cursor-pointer"
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-1" />
                            )}
                            {t("download")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
