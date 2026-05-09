"use client";

import { useState, useEffect, startTransition } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
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
    ExternalLink,
    Hash,
    ImageIcon,
    QrCode,
    Folder,
    Check,
    ArrowRight,
    Sparkles,
    Lock,
    Timer,
    Target,
    ChevronRight,
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

export function CreateLinkModal({ open, onOpenChange, onSuccess }: CreateLinkModalProps) {
    const t = useTranslations("links");
    const tc = useTranslations("common");

    const [originalUrl, setOriginalUrl] = useState("");
    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [domain, setDomain] = useState("");
    const [folderId, setFolderId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [maxClicks, setMaxClicks] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [deviceRules, setDeviceRules] = useState<DeviceRule[]>([]);
    const [ogTitle, setOgTitle] = useState("");
    const [ogDescription, setOgDescription] = useState("");
    const [ogImageUrl, setOgImageUrl] = useState("");
    const [expiredRedirectUrl, setExpiredRedirectUrl] = useState("");
    const [comments, setComments] = useState("");
    const [conversionTracking, setConversionTracking] = useState(false);

    const [domains, setDomains] = useState<DomainOption[]>([]);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeSection, setActiveSection] = useState<"basic" | "utm" | "targeting" | "password" | "expiration">("basic");

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
        setTags([]);
        setTagIds([]);
        setPassword("");
        setDomain("");
        setFolderId("");
        setStartsAt("");
        setExpiresAt("");
        setMaxClicks("");
        setIsActive(true);
        setDeviceRules([]);
        setOgTitle("");
        setOgDescription("");
        setOgImageUrl("");
        setExpiredRedirectUrl("");
        setComments("");
        setConversionTracking(false);
        setActiveSection("basic");
    }

    function toggleTagId(tagId: string) {
        setTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    }

    function handleAddDeviceRule() {
        setDeviceRules([...deviceRules, { os: "android", url: "", priority: 0 }]);
    }

    function handleUpdateDeviceRule(index: number, field: keyof DeviceRule, value: string | number) {
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
            const body: Record<string, unknown> = {
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
                maxClicks: maxClicks ? parseInt(maxClicks, 10) : undefined,
                isActive,
                deviceRules: deviceRules.filter((r) => r.url.trim()),
                ogTitle: ogTitle.trim(),
                ogDescription: ogDescription.trim(),
                ogImageUrl: ogImageUrl.trim(),
                expiredRedirectUrl: expiredRedirectUrl.trim(),
            };

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
        { id: "utm" as const, label: "UTM", icon: ExternalLink },
        { id: "targeting" as const, label: "Targeting", icon: Target },
        { id: "password" as const, label: "Password", icon: Lock },
        { id: "expiration" as const, label: "Expiration", icon: Timer },
    ];

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent showCloseButton={false} className="w-full max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[95vh] overflow-y-auto overflow-x-hidden p-0 gap-0 border-none shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Links</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5" />
                            New link
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Draft saved
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
                    {/* Left column - Main form */}
                    <div className="flex-1 p-6 space-y-5 min-w-0">
                        {/* Destination URL */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="url" className="text-sm font-medium text-foreground">
                                    Destination URL
                                </Label>
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://dub.co/help/article/dub-links"
                                value={originalUrl}
                                onChange={(e) => setOriginalUrl(e.target.value)}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>

                        {/* Short Link */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Short Link</Label>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-0 rounded-xl border overflow-hidden">
                                <Select value={domain} onValueChange={(v) => setDomain(v ?? "")}>
                                    <SelectTrigger className="w-[140px] rounded-none border-0 border-r bg-muted/30 h-11">
                                        <SelectValue placeholder="dub.sh" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">dub.sh</SelectItem>
                                        {domains.map((d) => (
                                            <SelectItem key={d.id} value={d.domain}>
                                                {d.domain}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="0xYCDaA"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="rounded-none border-0 h-11 flex-1"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Label className="text-sm font-medium">Tags</Label>
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                                    Manage
                                </Button>
                            </div>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Select onValueChange={(v) => toggleTagId(v as string)}>
                                    <SelectTrigger className="rounded-xl h-11 pl-9">
                                        <SelectValue placeholder="Select tags..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTags.map((tag) => (
                                            <SelectItem key={tag.id} value={tag.id}>
                                                <div className="flex items-center gap-2">
                                                    {tagIds.includes(tag.id) && <Check className="h-3.5 w-3.5" />}
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: tag.color || "#888" }}
                                                    />
                                                    {tag.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {tagIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {tagIds.map((id) => {
                                        const tag = availableTags.find((t) => t.id === id);
                                        return tag ? (
                                            <Badge
                                                key={id}
                                                variant="secondary"
                                                className="rounded-md text-xs gap-1 cursor-pointer"
                                                style={tag.color ? { backgroundColor: tag.color + "20", borderColor: tag.color + "40", color: tag.color } : undefined}
                                                onClick={() => toggleTagId(id)}
                                            >
                                                {tag.name}
                                                <X className="h-2.5 w-2.5" />
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium">Comments</Label>
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <Textarea
                                placeholder="Add comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="rounded-xl min-h-[80px] resize-none"
                            />
                        </div>

                        {/* Conversion Tracking */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium">Conversion Tracking</Label>
                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <Switch checked={conversionTracking} onCheckedChange={setConversionTracking} />
                        </div>

                        {/* Section tabs at bottom */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {sectionButtons.map((btn) => (
                                <Button
                                    key={btn.id}
                                    type="button"
                                    variant={activeSection === btn.id ? "secondary" : "outline"}
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
                                    className="space-y-4 border rounded-xl p-4 bg-muted/20"
                                >
                                    {activeSection === "utm" && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">Open Graph / Social Preview</Label>
                                            <Input placeholder="OG Title" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} className="rounded-lg h-10" />
                                            <Textarea placeholder="OG Description" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} className="rounded-lg min-h-[60px]" />
                                            <Input type="url" placeholder="OG Image URL" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} className="rounded-lg h-10" />
                                        </div>
                                    )}

                                    {activeSection === "targeting" && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">{t("deviceRules")}</Label>
                                            {deviceRules.map((rule, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Select value={rule.os} onValueChange={(v) => handleUpdateDeviceRule(index, "os", v ?? "")}>
                                                        <SelectTrigger className="w-[140px] rounded-lg h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {OS_OPTIONS.map((os) => (
                                                                <SelectItem key={os.key} value={os.key}>
                                                                    <div className="flex items-center gap-2">
                                                                        <os.icon className="h-3.5 w-3.5" />
                                                                        {os.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input placeholder={t("deviceUrlPlaceholder")} value={rule.url} onChange={(e) => handleUpdateDeviceRule(index, "url", e.target.value)} className="rounded-lg flex-1 h-9" />
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleRemoveDeviceRule(index)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1 h-8" onClick={handleAddDeviceRule}>
                                                <Plus className="h-3.5 w-3.5" />
                                                {t("addDeviceRule")}
                                            </Button>
                                        </div>
                                    )}

                                    {activeSection === "password" && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">{t("password")}</Label>
                                            <Input id="password" type="password" placeholder={t("passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg h-10" />
                                        </div>
                                    )}

                                    {activeSection === "expiration" && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">{t("startsAt")}</Label>
                                                    <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="rounded-lg h-10" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">{t("expiresAt")}</Label>
                                                    <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded-lg h-10" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">{t("maxClicks")}</Label>
                                                <Input type="number" placeholder={t("maxClicksPlaceholder")} value={maxClicks} onChange={(e) => setMaxClicks(e.target.value)} className="rounded-lg h-10" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">{t("expiredRedirectUrl")}</Label>
                                                <Input type="url" placeholder="https://example.com/expired" value={expiredRedirectUrl} onChange={(e) => setExpiredRedirectUrl(e.target.value)} className="rounded-lg h-10" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right column - Sidebar */}
                    <div className="w-72 border-l bg-muted/20 p-5 space-y-5 hidden md:block">
                        {/* Folder */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium">Folder</Label>
                                <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <Select value={folderId} onValueChange={(v) => setFolderId(v ?? "")}>
                                <SelectTrigger className="rounded-xl h-10 bg-background">
                                    <SelectValue placeholder="Links" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Links</SelectItem>
                                    {folders.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* QR Code */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium">QR Code</Label>
                                <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="border rounded-xl bg-background p-4 flex items-center justify-center h-36">
                                <div className="text-center space-y-2">
                                    <QrCode className="h-10 w-10 text-muted-foreground mx-auto" />
                                    <p className="text-xs text-muted-foreground">QR code will be generated</p>
                                </div>
                            </div>
                        </div>

                        {/* Custom Link Preview */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Label className="text-sm font-medium">Custom Link Preview</Label>
                                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <Switch checked={!!ogTitle || !!ogDescription || !!ogImageUrl} onCheckedChange={() => { }} className="scale-75" />
                            </div>
                            <div className="border rounded-xl bg-background p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <X className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">in</span>
                                    <span className="text-xs text-muted-foreground">fb</span>
                                </div>
                                <div className="border rounded-lg bg-muted/30 h-24 flex items-center justify-center">
                                    {ogImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ogImageUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="text-center space-y-1">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto" />
                                            <p className="text-[10px] text-muted-foreground">Enter a link to generate a preview</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium truncate">{ogTitle || "Add a title..."}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{ogDescription || "Add a description..."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                    <div className="flex items-center gap-2">
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                        <Label className="text-xs cursor-pointer">{isActive ? "Active" : "Inactive"}</Label>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !originalUrl.trim()}
                        className="rounded-xl gap-2 h-10 px-5"
                        onClick={handleSubmit}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                Create link
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
