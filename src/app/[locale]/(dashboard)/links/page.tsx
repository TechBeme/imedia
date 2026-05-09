"use client";

import { useEffect, useState, useMemo, useCallback, startTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { LinkCardV2, LinkItemV2 } from "@/components/link-card-v2";
import { CreateLinkModal } from "@/components/create-link-modal";
import {
  Plus,
  Loader2,
  Search,
  Link2,
  Folder,
  FolderOpen,
  Tag,
  Filter,
  ArrowUpDown,
  X,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  color: string | null;
  linkCount: number;
}

interface FolderItem {
  id: string;
  name: string;
  color: string | null;
  linkCount: number;
}

type SortOption = "createdAt_desc" | "createdAt_asc" | "clicks_desc" | "clicks_asc" | "visitors_desc" | "slug_asc";
type StatusFilter = "all" | "active" | "inactive" | "expired" | "scheduled";
type ViewMode = "list" | "grid";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export default function LinksPage() {
  const t = useTranslations("links");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();

  const [links, setLinks] = useState<LinkItemV2[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [selectedFolder, setSelectedFolder] = useState<string | null>(searchParams.get("folder"));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt_desc");
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    try {
      const [foldersRes, tagsRes, linksRes] = await Promise.all([
        fetch("/api/links/folders"),
        fetch("/api/links/tags"),
        fetch(`/api/links?sort=${sortBy}${selectedFolder ? `&folderId=${selectedFolder}` : ""}${selectedTagIds.length > 0 ? `&tagIds=${selectedTagIds.join(",")}` : ""}${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`),
      ]);
      const foldersData = await foldersRes.json();
      const tagsData = await tagsRes.json();
      const linksData = await linksRes.json();
      if (!cancelled) {
        if (foldersData.data?.folders) setFolders(foldersData.data.folders);
        if (tagsData.data?.tags) setTags(tagsData.data.tags);
        if (linksData.data?.links) setLinks(linksData.data.links);
      }
    } catch {
      if (!cancelled) toast.error(tc("error"));
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [selectedFolder, selectedTagIds, statusFilter, sortBy, tc]);

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
  }, [loadData]);

  const filteredLinks = useMemo(() => {
    let result = [...links];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.slug.toLowerCase().includes(q) ||
          l.originalUrl.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q) ||
          l.tags?.some((tag) => tag.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [links, search]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedFolder(null);
    setSelectedTagIds([]);
    setStatusFilter("all");
    setSortBy("createdAt_desc");
  }

  const hasFilters = search || selectedFolder || selectedTagIds.length > 0 || statusFilter !== "all" || sortBy !== "createdAt_desc";

  async function handleDelete(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("deleteSuccess"));
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } else {
      toast.error(tc("error"));
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isActive } : l)));
    } else {
      toast.error(tc("error"));
    }
  }

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl cursor-pointer shadow-sm gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("create")}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filter
          <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("sortBy")}</span>
                  {([
                    { value: "createdAt_desc" as SortOption, label: t("sortCreatedAtDesc") },
                    { value: "createdAt_asc" as SortOption, label: t("sortCreatedAtAsc") },
                    { value: "clicks_desc" as SortOption, label: t("sortClicksDesc") },
                    { value: "clicks_asc" as SortOption, label: t("sortClicksAsc") },
                    { value: "visitors_desc" as SortOption, label: t("sortVisitorsDesc") },
                    { value: "slug_asc" as SortOption, label: t("sortSlugAsc") },
                  ]).map((opt) => (
                    <Badge
                      key={opt.value}
                      variant={sortBy === opt.value ? "default" : "outline"}
                      className="cursor-pointer rounded-md text-xs"
                      onClick={() => setSortBy(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">{t("status")}</span>
                  {([
                    { value: "all" as StatusFilter, label: t("all") },
                    { value: "active" as StatusFilter, label: t("active") },
                    { value: "inactive" as StatusFilter, label: t("inactive") },
                    { value: "expired" as StatusFilter, label: t("expired") },
                    { value: "scheduled" as StatusFilter, label: t("scheduled") },
                  ]).map((opt) => (
                    <Badge
                      key={opt.value}
                      variant={statusFilter === opt.value ? "default" : "outline"}
                      className="cursor-pointer rounded-md text-xs"
                      onClick={() => setStatusFilter(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("tags")}</span>
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer rounded-md text-xs gap-1"
                        style={selectedTagIds.includes(tag.id) && tag.color ? { backgroundColor: tag.color, borderColor: tag.color } : tag.color ? { borderColor: tag.color + "60", color: tag.color } : undefined}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-muted-foreground h-7"
                    onClick={clearFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("clearFilters")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {hasFilters && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
          {selectedFolder && (
            <Badge variant="secondary" className="rounded-md text-xs gap-1">
              <Folder className="h-3 w-3" />
              {folders.find((f) => f.id === selectedFolder)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedFolder(null)} />
            </Badge>
          )}
          {selectedTagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return tag ? (
              <Badge key={tagId} variant="secondary" className="rounded-md text-xs gap-1">
                <Tag className="h-3 w-3" />
                {tag.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tagId)} />
              </Badge>
            ) : null;
          })}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="rounded-md text-xs gap-1">
              {t("status")}: {t(statusFilter)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
            </Badge>
          )}
        </motion.div>
      )}

      <div className="flex gap-5">
        {folders.length > 0 && (
          <motion.div variants={itemVariants} className="hidden lg:block w-52 shrink-0">
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${!selectedFolder ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}`}
              >
                <FolderOpen className="h-4 w-4" />
                {t("allLinks")}
                <span className="ml-auto text-xs opacity-60">{links.length}</span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selectedFolder === folder.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Folder className="h-4 w-4" style={folder.color ? { color: folder.color } : undefined} />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-xs opacity-60 shrink-0">{folder.linkCount}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{search || hasFilters ? t("noSearchResults") : t("noLinks")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{search || hasFilters ? t("tryDifferentSearch") : t("createFirst")}</p>
              {!search && !hasFilters && (
                <Button onClick={() => setCreateModalOpen(true)} className="mt-4 rounded-xl cursor-pointer">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("create")}
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2" : "grid gap-2"}>
              <AnimatePresence mode="popLayout">
                {filteredLinks.map((link) => (
                  <LinkCardV2 key={link.id} link={link} onDelete={handleDelete} onToggle={handleToggle} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <CreateLinkModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSuccess={loadData} />
    </motion.div>
  );
}
