"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainForm } from "@/components/domain-form";
import { DomainCard } from "@/components/domain-card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Globe } from "lucide-react";

interface DomainItem {
    id: string;
    domain: string;
    isVerified: boolean;
    isActive: boolean;
    verificationToken: string;
    createdAt: string;
}

export default function DomainsPage() {
    const t = useTranslations("domains");
    const tc = useTranslations("common");
    const [domains, setDomains] = useState<DomainItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await fetch("/api/domains");
            const data = await res.json();
            if (res.ok) {
                setDomains(data.data.domains);
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }, [tc]);

    useEffect(() => {
        let cancelled = false;
        fetchDomains().then(() => {
            if (cancelled) return;
        });
        return () => { cancelled = true; };
    }, [fetchDomains]);

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/domains/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error?.message || tc("error"));
                return;
            }
            setDomains((prev) => prev.filter((d) => d.id !== id));
            toast.success(t("deleteSuccess"));
        } catch {
            toast.error(tc("error"));
        }
    }

    async function handleToggle(id: string, isActive: boolean) {
        try {
            const res = await fetch(`/api/domains/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error?.message || tc("error"));
                return;
            }
            setDomains((prev) =>
                prev.map((d) => (d.id === id ? { ...d, isActive } : d))
            );
            toast.success(tc("success"));
        } catch {
            toast.error(tc("error"));
        }
    }

    function handleVerify(id: string) {
        setDomains((prev) =>
            prev.map((d) => (d.id === id ? { ...d, isVerified: true } : d))
        );
    }

    return (
        <motion.div
            className="space-y-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
        >
            <div>
                <h1 className="text-2xl font-semibold tracking-tight font-heading flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {t("title")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("addDescription")}</p>
            </div>

            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold font-heading">{t("add")}</CardTitle>
                            <CardDescription>{t("addDescription")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DomainForm onSuccess={fetchDomains} />
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">{t("yourDomains")}</h2>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : domains.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{t("noDomains")}</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {domains.map((domain) => (
                            <DomainCard
                                key={domain.id}
                                domain={domain}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                onVerify={handleVerify}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}
