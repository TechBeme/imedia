"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "motion/react";
import { User, Mail, Lock, Loader2 } from "lucide-react";

export function RegisterForm() {
    const t = useTranslations("auth");
    const locale = useLocale();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const { error } = await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: `/${locale}/dashboard`,
        });

        setLoading(false);

        if (error) {
            toast.error(error.message || t("registerFailed") || "Registration failed");
            return;
        }

        toast.success(t("registerSuccess") || "Account created!");
        router.push(`/${locale}/dashboard`);
        router.refresh();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
        >
            <Card className="w-full max-w-md glass-card border-0">
                <CardHeader className="space-y-2 text-center pb-6">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                        <span className="text-primary-foreground font-bold text-lg">i</span>
                    </div>
                    <CardTitle className="text-2xl font-bold font-heading">{t("registerTitle")}</CardTitle>
                    <CardDescription>{t("registerSubtitle")}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">{t("name")}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder={t("namePlaceholder") || "Your name"}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="pl-10 h-11 rounded-xl"
                                    autoComplete="name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-11 rounded-xl"
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 h-11 rounded-xl"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl cursor-pointer shadow-sm shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("creatingAccount") || "Creating account..."}
                                </>
                            ) : (
                                t("register")
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            {t("hasAccount")}{" "}
                            <Link href={`/${locale}/login`} className="text-primary hover:underline font-medium">
                                {t("login")}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
}
