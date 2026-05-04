"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Link2, Copy, Check, Loader2, ExternalLink } from "lucide-react";

export default function ShortenPage() {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const [url, setUrl] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        shortUrl: string;
        slug: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim()) {
            toast.error(t("urlRequired"));
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const body: Record<string, unknown> = { originalUrl: url.trim() };
            if (slug.trim()) body.slug = slug.trim();

            const res = await fetch("/api/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setResult({
                    shortUrl: data.data.shortUrl,
                    slug: data.data.slug,
                });
                toast.success(t("shortenSuccess"));
            } else {
                toast.error(data.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.shortUrl);
            setCopied(true);
            toast.success(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(tc("error"));
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
            <motion.div
                className="w-full max-w-md space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="text-center space-y-2">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Link2 className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">
                        {t("publicTitle")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("publicSubtitle")}
                    </p>
                </div>

                <Card className="glass-card">
                    <CardContent className="p-5 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    required
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    placeholder={t("slugPlaceholder")}
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full rounded-xl cursor-pointer"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4 mr-1.5" />
                                        {t("shorten")}
                                    </>
                                )}
                            </Button>
                        </form>

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pt-2 border-t border-border/40"
                            >
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={result.shortUrl}
                                        readOnly
                                        className="h-9 text-sm font-medium"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 cursor-pointer"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 cursor-pointer"
                                        onClick={() => window.open(result.shortUrl, "_blank")}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
