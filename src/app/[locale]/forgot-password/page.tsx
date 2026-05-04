"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth");
    const tc = useTranslations("common");
    const locale = useLocale();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: `/${locale}/reset-password`,
        });

        setLoading(false);

        if (error) {
            toast.error(error.message || tc("error"));
            return;
        }

        setSent(true);
        toast.success(t("resetEmailSent"));
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" as const }}
                className="w-full max-w-md"
            >
                <div className="bg-background rounded-2xl border border-border/50 shadow-xl shadow-black/5 p-8">
                    <div className="mb-6">
                        <Link
                            href={`/${locale}/login`}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("backToLogin")}
                        </Link>
                    </div>

                    <div className="space-y-2 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">{t("forgotPasswordTitle")}</h1>
                        <p className="text-sm text-muted-foreground">{t("forgotPasswordSubtitle")}</p>
                    </div>

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4 py-4"
                        >
                            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                            <p className="text-sm text-muted-foreground">{t("resetEmailSent")}</p>
                            <Link href={`/${locale}/login`}>
                                <Button variant="outline" className="rounded-xl mt-2">
                                    {t("backToLogin")}
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold">
                                    {t("email")}
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t("emailPlaceholder")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-12 h-12 rounded-xl"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    t("sendResetLink")
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
