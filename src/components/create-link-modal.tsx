"use client";

import { useState, useEffect, startTransition } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
    Loader2,
    Plus,
    X,
    Tag,
    Globe,
    Smartphone,
    Monitor,
    Laptop,
    Link2,
    Lock,
    Timer,
    ChevronRight,
    Copy,
    Sparkles,
    Settings2,
    Folder,
    QrCode,
    ImageIcon,
    Check,
    ArrowRight,
} from "lucide-react";
import { FaRandom } from "react-icons/fa";

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

interface DeviceRule {
    os: "android" | "ios" | "windows" | "macos" | "linux" | "other";
    url: string;
    priority: number;
}

interface CreateLinkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const OS_OPTIONS = [
    { key: "android", label: "Android", icon: Smartphone },
    { key: "ios", label: "iOS", icon: Smartphone },
    { key: "windows", label: "Windows", icon: Monitor },
    { key: "macos", label: "macOS", icon: Laptop },
    { key: "linux", label: "Linux", icon: Laptop },
    { key: "other", label: "Other", icon: Globe },
] as const;

const DEFAULT_DOMAIN = "somedia.techbe.me";

function generateRandomSlug(length = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function CreateLinkModal({ open, onOpenChange, onSuccess }: CreateLinkModalProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");
    const tm = useTranslations("links.createLinkModal");

    const [originalUrl, setOriginalUrl] = useState("");
    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [domain, setDomain] = useState("");
    const [folderId, setFolderId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [maxClicks, setMaxClicks] = useState("");
    const [deviceRules, setDeviceRules] = useState<DeviceRule[]>([]);
    const [ogTitle, setOgTitle] = useState("");
    const [ogDescription, setOgDescription] = useState("");
    const [ogImageUrl, setOgImageUrl] = useState("");
    const [expiredRedirectUrl, setExpiredRedirectUrl] = useState("");

    const [domains, setDomains] = useState<DomainOption[]>([]);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeSection, setActiveSection] = useState<"basic" | "password" | "expiration">("basic");
    const [showDeviceRules, setShowDeviceRules] = useState(false);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [showCreateTag, setShowCreateTag] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showEditPreview, setShowEditPreview] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [newDomain, setNewDomain] = useState("");
    const [addingDomain, setAddingDomain] = useState(false);
    const [creatingTag, setCreatingTag] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        startTransition(() => {
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
                .catch(() => { });
        });
        return () => { cancelled = true; };
    }, [open]);

    function resetForm() {
        setOriginalUrl("");
        setSlug("");
        setTitle("");
        setDescription("");
        setTagIds([]);
        setPassword("");
        setDomain("");
        setFolderId("");
        setStartsAt("");
        setExpiresAt("");
        setMaxClicks("");
        setDeviceRules([]);
        setOgTitle("");
        setOgDescription("");
        setOgImageUrl("");
        setExpiredRedirectUrl("");
        setActiveSection("basic");
        setShowDeviceRules(false);
        setShowAddDomain(false);
        setShowCreateTag(false);
        setShowCreateFolder(false);
        setShowEditPreview(false);
        setNewTagName("");
        setNewFolderName("");
        setNewDomain("");
    }

    function toggleTagId(tagId: string) {
        setTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    }

    function handleGenerateSlug() {
        setSlug(generateRandomSlug());
    }

    function handleClearSlug() {
        setSlug("");
    }

    function handleAddDeviceRule() {
        const usedOs = new Set(deviceRules.map((r) => r.os));
        const available = OS_OPTIONS.find((os) => !usedOs.has(os.key));
        if (!available) return;
        setDeviceRules([...deviceRules, { os: available.key, url: "", priority: 0 }]);
    }

    function handleUpdateDeviceRule(index: number, field: keyof DeviceRule, value: string | number) {
        const updated = [...deviceRules];
        updated[index] = { ...updated[index], [field]: value };
        setDeviceRules(updated);
    }

    function handleRemoveDeviceRule(index: number) {
        setDeviceRules(deviceRules.filter((_, i) => i !== index));
    }

    async function handleCreateTag(e: React.FormEvent) {
        e.preventDefault();
        if (!newTagName.trim()) return;
        setCreatingTag(true);
        try {
            const res = await fetch("/api/links/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.data?.tag) {
                setAvailableTags((prev) => [...prev, data.data.tag].sort((a, b) => a.name.localeCompare(b.name)));
                setTagIds((prev) => [...prev, data.data.tag.id]);
                setNewTagName("");
                setShowCreateTag(false);
                toast.success(t("createSuccess"));
            } else {
                toast.error(data.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setCreatingTag(false);
        }
    }

    async function handleCreateFolder(e: React.FormEvent) {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            const res = await fetch("/api/links/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newFolderName.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.data?.folder) {
                setFolders((prev) => [...prev, data.data.folder].sort((a, b) => a.name.localeCompare(b.name)));
                setFolderId(data.data.folder.id);
                setNewFolderName("");
                setShowCreateFolder(false);
                toast.success(t("createSuccess"));
            } else {
                toast.error(data.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setCreatingFolder(false);
        }
    }

    async function handleAddDomain(e: React.FormEvent) {
        e.preventDefault();
        if (!newDomain.trim()) return;
        setAddingDomain(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: newDomain.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.data?.domain) {
                setDomains((prev) => [...prev, data.data.domain]);
                setDomain(data.data.domain.domain);
                setNewDomain("");
                setShowAddDomain(false);
                toast.success(t("createSuccess"));
            } else {
                toast.error(data.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setAddingDomain(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!originalUrl.trim()) {
            toast.error(t("urlRequired"));
            return;
        }
        setLoading(true);
        try {
            const body: Record<string, unknown> = {
                originalUrl: originalUrl.trim(),
                isActive: true,
            };
            if (slug.trim()) body.slug = slug.trim();
            if (title.trim()) body.title = title.trim();
            if (description.trim()) body.description = description.trim();
            if (tagIds.length > 0) body.tagIds = tagIds;
            if (password.trim()) body.password = password.trim();
            if (domain) body.domain = domain;
            if (folderId) body.folderId = folderId;
            if (startsAt) body.startsAt = startsAt;
            if (expiresAt) body.expiresAt = expiresAt;
            if (maxClicks) body.maxClicks = parseInt(maxClicks, 10);
            const filteredDeviceRules = deviceRules.filter((r) => r.url.trim());
            if (filteredDeviceRules.length > 0) body.deviceRules = filteredDeviceRules;
            if (ogTitle.trim()) body.ogTitle = ogTitle.trim();
            if (ogDescription.trim()) body.ogDescription = ogDescription.trim();
            if (ogImageUrl.trim()) body.ogImageUrl = ogImageUrl.trim();
            if (expiredRedirectUrl.trim()) body.expiredRedirectUrl = expiredRedirectUrl.trim();

            const res = await fetch("/api/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(t("createSuccess"));
                resetForm();
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(result.error?.message || tc("error"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    const sectionButtons = [
        { id: "password" as const, label: tm("password"), icon: Lock },
        { id: "expiration" as const, label: tm("expiration"), icon: Timer },
    ];

    const shortLink = domain
        ? `https://${domain}/${slug || "..."}`
        : `https://${DEFAULT_DOMAIN}/${slug || "..."}`;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent
                showCloseButton={false}
                className="w-full md:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl"
            >
                <DialogTitle className="sr-only">{tm("newLink")}</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">{tm("title")}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                            <Link2 className="h-3.5 w-3.5 shrink-0" />
                            {tm("newLink")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {tm("draftSaved")}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg shrink-0"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_280px] flex-1 overflow-hidden min-h-0">
                    {/* Left column - Main form */}
                    <div className="p-5 space-y-4 min-w-0 overflow-y-auto h-full">
                        {/* Destination URL */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="url" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {tm("destinationUrl")}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground gap-1 px-2"
                                    onClick={() => setShowDeviceRules(!showDeviceRules)}
                                >
                                    <Settings2 className="h-3 w-3" />
                                    {tm("advancedConfig")}
                                </Button>
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="url"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={originalUrl}
                                    onChange={(e) => setOriginalUrl(e.target.value)}
                                    required
                                    className="rounded-lg h-10 pl-9"
                                />
                            </div>
                        </div>

                        {/* Device Rules (Advanced) */}
                        <AnimatePresence>
                            {showDeviceRules && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("deviceRules")}</Label>
                                        {deviceRules.map((rule, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Select value={rule.os} onValueChange={(v) => handleUpdateDeviceRule(index, "os", v ?? "")}>
                                                    <SelectTrigger className="w-[120px] rounded-lg h-9 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {OS_OPTIONS.filter((os) => os.key === rule.os || !deviceRules.some((r, ri) => ri !== index && r.os === os.key)).map((os) => (
                                                            <SelectItem key={os.key} value={os.key}>
                                                                <div className="flex items-center gap-2">
                                                                    <os.icon className="h-3.5 w-3.5" />
                                                                    {os.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input placeholder={t("deviceUrlPlaceholder")} value={rule.url} onChange={(e) => handleUpdateDeviceRule(index, "url", e.target.value)} className="rounded-lg flex-1 h-9 text-sm" />
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleRemoveDeviceRule(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {deviceRules.length < OS_OPTIONS.length && (
                                            <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1 h-8 text-xs" onClick={handleAddDeviceRule}>
                                                <Plus className="h-3.5 w-3.5" />
                                                {t("addDeviceRule")}
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Short Link */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("shortLink")}</Label>
                                <div className="flex items-center gap-0.5">
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md" title={tm("generateRandom")} onClick={handleGenerateSlug}>
                                        <FaRandom className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-ring/50">
                                <Select value={domain} onValueChange={(v) => setDomain(v ?? "")}>
                                    <SelectTrigger className="w-[150px] rounded-none border-0 border-r bg-muted/40 h-10 text-sm">
                                        <SelectValue placeholder={DEFAULT_DOMAIN} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{DEFAULT_DOMAIN}</SelectItem>
                                        {domains.map((d) => (
                                            <SelectItem key={d.id} value={d.domain}>{d.domain}</SelectItem>
                                        ))}
                                        <div className="border-t pt-1 mt-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 text-xs h-8 rounded-none"
                                                onClick={() => setShowAddDomain(true)}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                {tm("addDomain")}
                                            </Button>
                                        </div>
                                    </SelectContent>
                                </Select>
                                <span className="flex items-center px-2 text-muted-foreground text-sm bg-muted/40 border-r">/</span>
                                <Input
                                    placeholder="short-link"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="rounded-none border-0 h-10 flex-1 text-sm"
                                />
                            </div>
                            {slug && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Copy className="h-3 w-3" />
                                    <span className="truncate">{shortLink}</span>
                                </div>
                            )}
                        </div>

                        {/* Tags + Folder row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Tags */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("tags")}</Label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Select onValueChange={(v) => {
                                        const value = (v ?? "") as string;
                                        if (!value) return;
                                        if (value === "__create_tag__") {
                                            setShowCreateTag(true);
                                        } else {
                                            toggleTagId(value);
                                        }
                                    }}>
                                        <SelectTrigger className="rounded-lg h-10 pl-9 text-sm">
                                            <SelectValue placeholder={tm("tags")} />
                                        </SelectTrigger>
                                        <SelectContent side="bottom" align="start" sideOffset={4} alignItemWithTrigger={false}>
                                            {availableTags.map((tag) => (
                                                <SelectItem key={tag.id} value={tag.id}>
                                                    <div className="flex items-center gap-2">
                                                        {tagIds.includes(tag.id) && <Check className="h-3.5 w-3.5" />}
                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || "#888" }} />
                                                        {tag.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {availableTags.length > 0 && <div className="border-t my-1" />}
                                            <SelectItem value="__create_tag__">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    {tm("createTag")}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {tagIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {tagIds.map((id) => {
                                            const tag = availableTags.find((t) => t.id === id);
                                            return tag ? (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="rounded-md text-xs gap-1 cursor-pointer h-6"
                                                    style={tag.color ? { backgroundColor: tag.color + "18", borderColor: tag.color + "30", color: tag.color } : undefined}
                                                    onClick={() => toggleTagId(id)}
                                                >
                                                    {tag.name}
                                                    <X className="h-3 w-3" />
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Folder */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("folder")}</Label>
                                <div className="relative">
                                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Select value={folderId} onValueChange={(v) => {
                                        const value = (v ?? "") as string;
                                        if (value === "__create_folder__") {
                                            setShowCreateFolder(true);
                                        } else {
                                            setFolderId(value);
                                        }
                                    }}>
                                        <SelectTrigger className="rounded-lg h-10 pl-9 text-sm bg-background">
                                            <SelectValue placeholder={tm("folder")} />
                                        </SelectTrigger>
                                        <SelectContent side="bottom" align="start" sideOffset={4} alignItemWithTrigger={false}>
                                            <SelectItem value="">{tm("noFolder")}</SelectItem>
                                            {folders.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                            {folders.length > 0 && <div className="border-t my-1" />}
                                            <SelectItem value="__create_folder__">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    {tm("createFolder")}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("description")}</Label>
                            <Textarea
                                placeholder={tm("description")}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-lg min-h-[60px] resize-none text-sm"
                            />
                        </div>

                        {/* Feature buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {sectionButtons.map((btn) => (
                                <Button
                                    key={btn.id}
                                    type="button"
                                    variant={activeSection === btn.id ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-lg text-xs gap-1.5 h-8"
                                    onClick={() => setActiveSection(activeSection === btn.id ? "basic" : btn.id)}
                                >
                                    <btn.icon className="h-3.5 w-3.5" />
                                    {btn.label}
                                </Button>
                            ))}
                        </div>

                        {/* Section Content */}
                        <AnimatePresence mode="wait">
                            {activeSection !== "basic" && (
                                <motion.div
                                    key={activeSection}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-3 border rounded-lg p-4 bg-muted/20"
                                >
                                    {activeSection === "password" && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">{t("password")}</Label>
                                            <Input id="password" type="password" placeholder={t("passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg h-9 text-sm" />
                                        </div>
                                    )}

                                    {activeSection === "expiration" && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{t("startsAt")}</Label>
                                                    <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="rounded-lg h-9 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{t("expiresAt")}</Label>
                                                    <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded-lg h-9 text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">{t("maxClicks")}</Label>
                                                <Input type="number" placeholder={t("maxClicksPlaceholder")} value={maxClicks} onChange={(e) => setMaxClicks(e.target.value)} className="rounded-lg h-9 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">{t("expiredRedirectUrl")}</Label>
                                                <Input type="url" placeholder="https://example.com/expired" value={expiredRedirectUrl} onChange={(e) => setExpiredRedirectUrl(e.target.value)} className="rounded-lg h-9 text-sm" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right column - Sidebar */}
                    <div className="border-l border-border/50 bg-muted/30 p-5 space-y-5 hidden md:block overflow-y-auto h-full">
                        {/* QR Code */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("qrCode")}</Label>
                            <div className="border rounded-lg bg-background p-4 flex items-center justify-center h-32">
                                <div className="text-center space-y-2">
                                    <QrCode className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <p className="text-xs text-muted-foreground">{tm("qrCode")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Link Preview */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("linkPreview")}</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs gap-1 px-2"
                                    onClick={() => setShowEditPreview(true)}
                                >
                                    <Settings2 className="h-3 w-3" />
                                    {tc("edit")}
                                </Button>
                            </div>
                            <div className="border rounded-lg bg-background overflow-hidden cursor-pointer" onClick={() => setShowEditPreview(true)}>
                                <div className="p-3 space-y-3">
                                    <div className="border rounded-md bg-muted/30 h-28 flex items-center justify-center overflow-hidden">
                                        {ogImageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ogImageUrl} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="text-center space-y-1">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground mx-auto" />
                                                <p className="text-[10px] text-muted-foreground">{tm("linkPreview")}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium truncate">{ogTitle || title || "..."}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{ogDescription || description || "..."}</p>
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{shortLink}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/50 bg-muted/20">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8 text-sm"
                        onClick={() => onOpenChange(false)}
                    >
                        {tm("cancel")}
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || !originalUrl.trim()}
                        className="rounded-lg gap-2 h-8 px-4 text-sm"
                        onClick={handleSubmit}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                {tm("createLink")}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>

            {/* Add Domain Modal */}
            <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle>{tm("addDomain")}</DialogTitle>
                    <form onSubmit={handleAddDomain} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("domain")}</Label>
                            <Input
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                className="rounded-lg h-10"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="rounded-lg h-8" onClick={() => setShowAddDomain(false)}>
                                {tm("cancel")}
                            </Button>
                            <Button type="submit" disabled={addingDomain || !newDomain.trim()} className="rounded-lg h-8">
                                {addingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : tm("addDomain")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Tag Modal */}
            <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle>{tm("createTag")}</DialogTitle>
                    <form onSubmit={handleCreateTag} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("tags")}</Label>
                            <Input
                                placeholder={tm("tags")}
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="rounded-lg h-10"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="rounded-lg h-8" onClick={() => setShowCreateTag(false)}>
                                {tm("cancel")}
                            </Button>
                            <Button type="submit" disabled={creatingTag || !newTagName.trim()} className="rounded-lg h-8">
                                {creatingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : tm("createTag")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Folder Modal */}
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle>{tm("createFolder")}</DialogTitle>
                    <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("folder")}</Label>
                            <Input
                                placeholder={tm("folder")}
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="rounded-lg h-10"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="rounded-lg h-8" onClick={() => setShowCreateFolder(false)}>
                                {tm("cancel")}
                            </Button>
                            <Button type="submit" disabled={creatingFolder || !newFolderName.trim()} className="rounded-lg h-8">
                                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : tm("createFolder")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Preview Modal */}
            <Dialog open={showEditPreview} onOpenChange={setShowEditPreview}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle>{tm("linkPreview")}</DialogTitle>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("ogTitle")}</Label>
                            <Input
                                placeholder={tm("ogTitle")}
                                value={ogTitle}
                                onChange={(e) => setOgTitle(e.target.value)}
                                className="rounded-lg h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("ogDescription")}</Label>
                            <Textarea
                                placeholder={tm("ogDescription")}
                                value={ogDescription}
                                onChange={(e) => setOgDescription(e.target.value)}
                                className="rounded-lg min-h-[80px] resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tm("ogImageUrl")}</Label>
                            <Input
                                type="url"
                                placeholder={tm("ogImageUrl")}
                                value={ogImageUrl}
                                onChange={(e) => setOgImageUrl(e.target.value)}
                                className="rounded-lg h-10"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="rounded-lg h-8" onClick={() => setShowEditPreview(false)}>
                                {tm("cancel")}
                            </Button>
                            <Button type="button" className="rounded-lg h-8" onClick={() => setShowEditPreview(false)}>
                                {tc("save")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
