"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label component available for future form fields
// import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Copy, Check, Globe } from "lucide-react";

interface DomainFormProps {
    onSuccess?: () => void;
}

export function DomainForm({ onSuccess }: DomainFormProps) {
    const t = useTranslations("domains");
    const tc = useTranslations("common");
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        id: string;
        domain: string;
        verificationToken: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!domain.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: domain.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error?.message || tc("error"));
                return;
            }
            setResult(data.data.domain);
            setDomain("");
            toast.success(t("createSuccess"));
            onSuccess?.();
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    function handleCopy(value: string) {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(t("copied"));
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1">
                    <Input
                        placeholder={t("placeholder")}
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="rounded-xl h-11"
                        disabled={loading}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading || !domain.trim()}
                    className="rounded-xl h-11 cursor-pointer shadow-sm shadow-primary/20 gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {t("add")}
                </Button>
            </form>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <Globe className="h-4 w-4" />
                                    <p className="text-sm font-medium">{t("instructions")}</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border">
                                        <div>
                                            <p className="text-xs text-muted-foreground">{t("txtRecord")}</p>
                                            <code className="text-sm font-mono">
                                                imedia-verify={result.verificationToken}
                                            </code>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleCopy(`imedia-verify=${result.verificationToken}`)
                                            }
                                            className="cursor-pointer gap-1"
                                        >
                                            {copied ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t("dnsHint")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
