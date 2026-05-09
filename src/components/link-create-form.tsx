"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
    Loader2,
    Plus,
    X,
    Smartphone,
    Monitor,
    Laptop,
    Globe,
    Tag,
    Link2,
    Calendar,
    Hash,
    Shield,
    Folder,
    Image,
    ExternalLink,
    Share2,
} from "lucide-react";

interface DomainOption {
    id: string;
    domain: string;
    isVerified: boolean;
}

interface FolderOption {
    id: string;
    name: string;
}

interface TagOption {
    id: string;
    name: string;
    color: string | null;
}

export interface DeviceRule {
    os: "android" | "ios" | "windows" | "macos" | "linux" | "other";
    url: string;
    priority: number;
}

interface LinkFormData {
    id?: string;
    originalUrl: string;
    slug: string;
    title: string;
    description: string;
    tags: string[];
    tagIds: string[];
    password: string;
    domain: string;
    folderId: string;
    startsAt: string;
    expiresAt: string;
    maxClicks: string;
    isActive: boolean;
    deviceRules: DeviceRule[];
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
    expiredRedirectUrl: string;
}

interface LinkCreateFormProps {
    initialData?: Partial<LinkFormData>;
    onSubmit: (data: LinkFormData) => Promise<void>;
    isEditing?: boolean;
}

const OS_OPTIONS = [
    { key: "android", label: "Android", icon: Smartphone },
    { key: "ios", label: "iOS", icon: Smartphone },
    { key: "windows", label: "Windows", icon: Monitor },
    { key: "macos", label: "macOS", icon: Laptop },
    { key: "linux", label: "Linux", icon: Laptop },
    { key: "other", label: "Other", icon: Globe },
] as const;

export function LinkCreateForm({ initialData, onSubmit, isEditing = false }: LinkCreateFormProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const router = useRouter();

    const [originalUrl, setOriginalUrl] = useState(initialData?.originalUrl || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagIds, setTagIds] = useState<string[]>(initialData?.tagIds || []);
    const [tagInput, setTagInput] = useState("");
    const [password, setPassword] = useState(initialData?.password || "");
    const [domain, setDomain] = useState(initialData?.domain || "");
    const [folderId, setFolderId] = useState(initialData?.folderId || "");
    const [startsAt, setStartsAt] = useState(initialData?.startsAt || "");
    const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt || "");
    const [maxClicks, setMaxClicks] = useState(initialData?.maxClicks || "");
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [deviceRules, setDeviceRules] = useState<DeviceRule[]>(
        initialData?.deviceRules || []
    );
    const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || "");
    const [ogDescription, setOgDescription] = useState(initialData?.ogDescription || "");
    const [ogImageUrl, setOgImageUrl] = useState(initialData?.ogImageUrl || "");
    const [expiredRedirectUrl, setExpiredRedirectUrl] = useState(initialData?.expiredRedirectUrl || "");

    const [domains, setDomains] = useState<DomainOption[]>([]);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [domainsLoading, setDomainsLoading] = useState(false);

    useEffect(() => {
        if (isEditing) return;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDomainsLoading(true);
        Promise.all([
            fetch("/api/domains").then((r) => r.json()),
            fetch("/api/links/folders").then((r) => r.json()),
            fetch("/api/links/tags").then((r) => r.json()),
        ])
            .then(([domainsData, foldersData, tagsData]) => {
                if (cancelled) return;
                if (domainsData.data?.domains) {
                    setDomains(domainsData.data.domains.filter((d: DomainOption) => d.isVerified));
                }
                if (foldersData.data?.folders) {
                    setFolders(foldersData.data.folders);
                }
                if (tagsData.data?.tags) {
                    setAvailableTags(tagsData.data.tags);
                }
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setDomainsLoading(false);
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load folders/tags for editing mode too
    useEffect(() => {
        if (!isEditing) return;
        let cancelled = false;
        Promise.all([
            fetch("/api/links/folders").then((r) => r.json()),
            fetch("/api/links/tags").then((r) => r.json()),
        ])
            .then(([foldersData, tagsData]) => {
                if (cancelled) return;
                if (foldersData.data?.folders) {
                    setFolders(foldersData.data.folders);
                }
                if (tagsData.data?.tags) {
                    setAvailableTags(tagsData.data.tags);
                }
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [isEditing]);

    function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
            if (!tags.includes(newTag) && tags.length < 20) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        }
    }

    function handleRemoveTag(tag: string) {
        setTags(tags.filter((t) => t !== tag));
    }

    function toggleTagId(tagId: string) {
        setTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    }

    function handleAddDeviceRule() {
        setDeviceRules([...deviceRules, { os: "android", url: "", priority: 0 }]);
    }

    function handleUpdateDeviceRule(index: number, field: keyof DeviceRule, value: string | number | null) {
        if (value === null) return;
        const updated = [...deviceRules];
        updated[index] = { ...updated[index], [field]: value };
        setDeviceRules(updated);
    }

    function handleRemoveDeviceRule(index: number) {
        setDeviceRules(deviceRules.filter((_, i) => i !== index));
    }

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
                title: title.trim(),
                description: description.trim(),
                tags,
                tagIds,
                password: password.trim(),
                domain,
                folderId,
                startsAt,
                expiresAt,
                maxClicks,
                isActive,
                deviceRules: deviceRules.filter((r) => r.url.trim()),
                ogTitle: ogTitle.trim(),
                ogDescription: ogDescription.trim(),
                ogImageUrl: ogImageUrl.trim(),
                expiredRedirectUrl: expiredRedirectUrl.trim(),
            });
            router.push("/links");
        } catch {
            // error handled by caller
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            {/* Basic Info */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary" />
                        {t("basicInfo")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">
                            {t("originalUrl")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={originalUrl}
                            onChange={(e) => setOriginalUrl(e.target.value)}
                            required
                            className="rounded-xl"
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
                                className="rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">{t("title")}</Label>
                        <Input
                            id="title"
                            placeholder={t("titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl"
                            maxLength={200}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">{t("description")}</Label>
                        <Textarea
                            id="description"
                            placeholder={t("descriptionPlaceholder")}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-xl min-h-[80px] resize-none"
                            maxLength={1000}
                        />
                    </div>

                    {/* Folder */}
                    {folders.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="folder" className="flex items-center gap-1">
                                <Folder className="h-3.5 w-3.5" />
                                {t("folder")}
                            </Label>
                            <Select value={folderId} onValueChange={(val) => setFolderId(val || "")}>
                                <SelectTrigger id="folder" className="w-full rounded-xl">
                                    <SelectValue placeholder={t("noFolder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t("noFolder")}</SelectItem>
                                    {folders.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {t("tags")}
                        </Label>
                        {availableTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {availableTags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant={tagIds.includes(tag.id) ? "default" : "outline"}
                                        className="cursor-pointer rounded-md text-xs"
                                        style={tagIds.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : undefined}
                                        onClick={() => toggleTagId(tag.id)}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <AnimatePresence>
                                {tags.map((tag) => (
                                    <motion.div
                                        key={tag}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <Badge
                                            variant="secondary"
                                            className="cursor-pointer gap-1 pr-1 rounded-lg"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            {tag}
                                            <X className="h-3 w-3" />
                                        </Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <Input
                            placeholder={t("tagsPlaceholder")}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("tagsHelp")}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Open Graph */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-primary" />
                        {t("openGraph")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">{t("ogHelp")}</p>
                    <div className="space-y-2">
                        <Label htmlFor="ogTitle">{t("ogTitle")}</Label>
                        <Input
                            id="ogTitle"
                            placeholder={t("ogTitlePlaceholder")}
                            value={ogTitle}
                            onChange={(e) => setOgTitle(e.target.value)}
                            className="rounded-xl"
                            maxLength={200}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ogDescription">{t("ogDescription")}</Label>
                        <Textarea
                            id="ogDescription"
                            placeholder={t("ogDescriptionPlaceholder")}
                            value={ogDescription}
                            onChange={(e) => setOgDescription(e.target.value)}
                            className="rounded-xl min-h-[60px] resize-none"
                            maxLength={500}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ogImageUrl" className="flex items-center gap-1">
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("ogImageUrl")}
                        </Label>
                        <Input
                            id="ogImageUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={ogImageUrl}
                            onChange={(e) => setOgImageUrl(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Domain & Security */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {t("domainAndSecurity")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="domain">{t("domain")}</Label>
                            <Select
                                value={domain}
                                onValueChange={(val) => setDomain(val || "")}
                                disabled={domainsLoading}
                            >
                                <SelectTrigger id="domain" className="w-full rounded-xl">
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
                        <Label htmlFor="password">{t("password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t("passwordPlaceholder")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    {isEditing && (
                        <div className="flex items-center justify-between py-2">
                            <Label htmlFor="active">{t("status")}</Label>
                            <Switch
                                id="active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Scheduling & Limits */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {t("schedulingAndLimits")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startsAt">{t("startsAt")}</Label>
                            <Input
                                id="startsAt"
                                type="datetime-local"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">{t("expiresAt")}</Label>
                            <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxClicks" className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" />
                            {t("maxClicks")}
                        </Label>
                        <Input
                            id="maxClicks"
                            type="number"
                            min={1}
                            placeholder={t("maxClicksPlaceholder")}
                            value={maxClicks}
                            onChange={(e) => setMaxClicks(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiredRedirectUrl" className="flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("expiredRedirectUrl")}
                        </Label>
                        <Input
                            id="expiredRedirectUrl"
                            type="url"
                            placeholder={t("expiredRedirectUrlPlaceholder")}
                            value={expiredRedirectUrl}
                            onChange={(e) => setExpiredRedirectUrl(e.target.value)}
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("expiredRedirectUrlHelp")}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Device Rules */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        {t("deviceRules")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AnimatePresence>
                        {deviceRules.map((rule, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-start gap-3 p-3 rounded-xl border bg-muted/30"
                            >
                                <Select
                                    value={rule.os}
                                    onValueChange={(val) =>
                                        handleUpdateDeviceRule(index, "os", val)
                                    }
                                >
                                    <SelectTrigger className="w-[140px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {OS_OPTIONS.map((os) => (
                                            <SelectItem key={os.key} value={os.key}>
                                                <span className="flex items-center gap-2">
                                                    <os.icon className="h-3.5 w-3.5" />
                                                    {os.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="url"
                                    placeholder={t("deviceUrlPlaceholder")}
                                    value={rule.url}
                                    onChange={(e) =>
                                        handleUpdateDeviceRule(index, "url", e.target.value)
                                    }
                                    className="flex-1 rounded-xl"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-destructive"
                                    onClick={() => handleRemoveDeviceRule(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={handleAddDeviceRule}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("addDeviceRule")}
                    </Button>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/links")}
                    disabled={loading}
                    className="rounded-xl"
                >
                    {tc("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
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
    );
}
