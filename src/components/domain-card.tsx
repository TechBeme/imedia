"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Trash2, ShieldCheck, ShieldAlert, Globe, Copy, Check } from "lucide-react";

interface DomainItem {
    id: string;
    domain: string;
    isVerified: boolean;
    isActive: boolean;
    verificationToken: string;
    createdAt: string;
}

interface DomainCardProps {
    domain: DomainItem;
    onDelete: (id: string) => void;
    onToggle: (id: string, isActive: boolean) => void;
    onVerify: (id: string) => void;
}

export function DomainCard({ domain, onDelete, onToggle, onVerify }: DomainCardProps) {
    const t = useTranslations("domains");
    const tc = useTranslations("common");
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleVerify() {
        setVerifying(true);
        try {
            const res = await fetch(`/api/domains/${domain.id}/verify`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error?.message || t("verifyFailed"));
                return;
            }
            toast.success(t("verifySuccess"));
            onVerify(domain.id);
        } catch {
            toast.error(tc("error"));
        } finally {
            setVerifying(false);
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(`somedia-verify=${domain.verificationToken}`);
        setCopied(true);
        toast.success(t("copied"));
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
        >
            <Card className="glass-card">
                <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Globe className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{domain.domain}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {domain.isVerified ? (
                                        <Badge
                                            variant="outline"
                                            className="text-xs gap-1 border-green-200 text-green-600 bg-green-50 dark:bg-green-950/30 dark:border-green-900"
                                        >
                                            <ShieldCheck className="h-3 w-3" />
                                            {t("verified")}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-xs gap-1 border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
                                        >
                                            <ShieldAlert className="h-3 w-3" />
                                            {t("pending")}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {!domain.isVerified && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="cursor-pointer gap-1 h-8"
                                    >
                                        {copied ? (
                                            <Check className="h-3.5 w-3.5" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleVerify}
                                        disabled={verifying}
                                        className="cursor-pointer rounded-lg h-8"
                                    >
                                        {verifying ? tc("loading") : t("verify")}
                                    </Button>
                                </>
                            )}
                            <Switch
                                checked={domain.isActive}
                                onCheckedChange={(checked) => onToggle(domain.id, checked)}
                                className="cursor-pointer"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(domain.id)}
                                className="cursor-pointer text-destructive hover:text-destructive h-8"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
