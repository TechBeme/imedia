"use client";

import { useState, useEffect, startTransition } from "react";
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
  Calendar,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Laptop,
  Link2,
  ExternalLink,
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
  const [tagInput, setTagInput] = useState("");
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
        .catch(() => {});
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
    setTagInput("");
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
    setActiveSection("basic");
  }

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
    { id: "basic" as const, label: "Basic", icon: Link2 },
    { id: "utm" as const, label: "UTM", icon: ExternalLink },
    { id: "targeting" as const, label: "Targeting", icon: Smartphone },
    { id: "password" as const, label: "Password", icon: Shield },
    { id: "expiration" as const, label: "Expiration", icon: Calendar },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {t("createNewLink")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Destination URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              {t("originalUrl")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              className="rounded-lg"
            />
          </div>

          {/* Short Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("shortUrl")}</Label>
            </div>
            <div className="flex gap-2">
              <Select value={domain} onValueChange={(v) => setDomain(v ?? "")}>
                <SelectTrigger className="w-[140px] rounded-lg">
                  <SelectValue placeholder={t("defaultDomain")} />
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
              <span className="flex items-center text-muted-foreground">/</span>
              <Input
                placeholder={t("slugPlaceholder")}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-lg flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {sectionButtons.map((btn) => (
              <Button
                key={btn.id}
                type="button"
                variant={activeSection === btn.id ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs gap-1.5"
                onClick={() => setActiveSection(btn.id)}
              >
                <btn.icon className="h-3.5 w-3.5" />
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Section Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {activeSection === "basic" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t("title")}</Label>
                      <Input
                        id="title"
                        placeholder={t("titlePlaceholder")}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folder">{t("folder")}</Label>
                      <Select value={folderId} onValueChange={(v) => setFolderId(v ?? "")}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder={t("noFolder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("noFolder")}</SelectItem>
                          {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("description")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t("descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-lg min-h-[60px]"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>{t("tags")}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={tagIds.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer rounded-md text-xs gap-1"
                          style={
                            tagIds.includes(tag.id) && tag.color
                              ? { backgroundColor: tag.color, borderColor: tag.color }
                              : tag.color
                              ? { borderColor: tag.color + "60", color: tag.color }
                              : undefined
                          }
                          onClick={() => toggleTagId(tag.id)}
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder={t("tagsPlaceholder")}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">{t("tagsHelp")}</p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-md text-xs gap-1">
                            {tag}
                            <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label className="text-sm cursor-pointer">{t("active")}</Label>
                  </div>
                </>
              )}

              {activeSection === "utm" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>OG Title</Label>
                    <Input
                      placeholder="Title for social sharing"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Description</Label>
                    <Textarea
                      placeholder="Description for social sharing"
                      value={ogDescription}
                      onChange={(e) => setOgDescription(e.target.value)}
                      className="rounded-lg min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeSection === "targeting" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("deviceRules")}</Label>
                    {deviceRules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={rule.os}
                            onValueChange={(v) => handleUpdateDeviceRule(index, "os", v ?? "")}
                          >
                            <SelectTrigger className="w-[140px] rounded-lg">
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
                          <Input
                            placeholder={t("deviceUrlPlaceholder")}
                            value={rule.url}
                            onChange={(e) => handleUpdateDeviceRule(index, "url", e.target.value)}
                            className="rounded-lg flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleRemoveDeviceRule(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-1"
                      onClick={handleAddDeviceRule}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("addDeviceRule")}
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "password" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeSection === "expiration" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startsAt">{t("startsAt")}</Label>
                      <Input
                        id="startsAt"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">{t("expiresAt")}</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxClicks">{t("maxClicks")}</Label>
                    <Input
                      id="maxClicks"
                      type="number"
                      placeholder={t("maxClicksPlaceholder")}
                      value={maxClicks}
                      onChange={(e) => setMaxClicks(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiredRedirect">{t("expiredRedirectUrl")}</Label>
                    <Input
                      id="expiredRedirect"
                      type="url"
                      placeholder={t("expiredRedirectUrlPlaceholder")}
                      value={expiredRedirectUrl}
                      onChange={(e) => setExpiredRedirectUrl(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => { resetForm(); onOpenChange(false); }}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="rounded-lg gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
