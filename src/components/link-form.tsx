"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DomainOption {
    id: string;
    domain: string;
    isVerified: boolean;
}

interface LinkFormData {
    id?: string;
    originalUrl: string;
    slug: string;
    password: string;
    expiresAt: string;
    isActive: boolean;
    domain: string;
}

interface LinkFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<LinkFormData>;
    onSubmit: (data: LinkFormData) => Promise<void>;
}

export function LinkForm({ open, onOpenChange, initialData, onSubmit }: LinkFormProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const isEditing = !!initialData?.id;

    const [originalUrl, setOriginalUrl] = useState(initialData?.originalUrl || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [password, setPassword] = useState(initialData?.password || "");
    const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt || "");
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [domain, setDomain] = useState(initialData?.domain || "");
    const [domains, setDomains] = useState<DomainOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [domainsLoading, setDomainsLoading] = useState(false);

    useEffect(() => {
        if (!open || isEditing) return;
        let cancelled = false;
        setDomainsLoading(true);
        fetch("/api/domains")
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (data.data?.domains) {
                    setDomains(
                        data.data.domains.filter((d: DomainOption) => d.isVerified)
                    );
                }
            })
            .catch(() => {
                // silently fail - domains are optional
            })
            .finally(() => {
                if (!cancelled) setDomainsLoading(false);
            });
        return () => { cancelled = true; };
    }, [open, isEditing]);

    // Initialize form from initialData using a ref to avoid setState in effect
    const initialDataRef = React.useRef(initialData);
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (initialData && !initialized) {
            initialDataRef.current = initialData;
            setOriginalUrl(initialData.originalUrl || "");
            setSlug(initialData.slug || "");
            setPassword(initialData.password || "");
            setExpiresAt(initialData.expiresAt || "");
            setIsActive(initialData.isActive ?? true);
            setDomain(initialData.domain || "");
            setInitialized(true);
        }
    }, [initialData, initialized]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!originalUrl.trim()) {
            toast.error(t("urlRequired"));
            return;
        }
        setLoading(true);
        try {
            await onSubmit({
                id: initialData?.id,
                originalUrl: originalUrl.trim(),
                slug: slug.trim(),
                password: password.trim(),
                expiresAt,
                isActive,
                domain,
            });
            if (!isEditing) {
                setOriginalUrl("");
                setSlug("");
                setPassword("");
                setExpiresAt("");
                setIsActive(true);
                setDomain("");
            }
            onOpenChange(false);
        } catch {
            // error handled by caller
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? t("edit") : t("create")}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">{t("originalUrl")}</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={originalUrl}
                            onChange={(e) => setOriginalUrl(e.target.value)}
                            required
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="slug">{t("slug")}</Label>
                            <Input
                                id="slug"
                                placeholder={t("slugPlaceholder")}
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>
                    )}

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t("passwordPlaceholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="domain">{t("domain")}</Label>
                            <Select
                                value={domain}
                                onValueChange={(val) => setDomain(val || "")}
                                disabled={domainsLoading}
                            >
                                <SelectTrigger id="domain" className="w-full">
                                    <SelectValue placeholder={t("domainPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t("defaultDomain")}</SelectItem>
                                    {domains.map((d) => (
                                        <SelectItem key={d.id} value={d.domain}>
                                            {d.domain}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="expires">{t("expiresAt")}</Label>
                        <Input
                            id="expires"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                    </div>

                    {isEditing && (
                        <div className="flex items-center justify-between">
                            <Label htmlFor="active">{t("status")}</Label>
                            <Switch
                                id="active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {tc("cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isEditing ? (
                                tc("save")
                            ) : (
                                t("create")
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
