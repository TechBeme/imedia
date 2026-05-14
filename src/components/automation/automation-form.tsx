"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
    X,
    Plus,
    Check,
    Loader2,
    ImageIcon,
    Play,
    Grid3x3,
    Sparkles,
    Bot,
    MessageCircle,
    Send,
} from "lucide-react";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
} from "react-icons/ri";

interface SocialAccount {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
}

interface InstagramMedia {
    id: string;
    caption: string | null;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
}

interface AutomationFormProps {
    accounts: SocialAccount[];
    initialData?: {
        id?: string;
        name: string;
        socialAccountId: string;
        triggerConfig: {
            keywords: string[];
        };
        scope: {
            posts: "all" | "specific";
            postIds?: string[];
        };
        actions: Array<{
            type: "reply_comment" | "send_dm";
            config: { messages: string[] };
            isActive: boolean;
        }>;
    };
}

const platformDefs: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    instagram: { icon: RiInstagramLine, color: "text-pink-500", bg: "bg-pink-50", label: "Instagram" },
    facebook: { icon: RiFacebookCircleLine, color: "text-blue-600", bg: "bg-blue-50", label: "Facebook" },
    threads: { icon: RiThreadsLine, color: "text-slate-700", bg: "bg-slate-50", label: "Threads" },
    youtube: { icon: RiYoutubeLine, color: "text-red-500", bg: "bg-red-50", label: "YouTube" },
    tiktok: { icon: RiTiktokLine, color: "text-slate-700", bg: "bg-slate-50", label: "TikTok" },
    x: { icon: RiTwitterXLine, color: "text-slate-700", bg: "bg-slate-50", label: "X" },
};

export function AutomationForm({ accounts, initialData }: AutomationFormProps) {
    const t = useTranslations("automations");
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState(initialData?.name || "");
    const [socialAccountId, setSocialAccountId] = useState(initialData?.socialAccountId || "");
    const [keywords, setKeywords] = useState<string[]>(initialData?.triggerConfig.keywords || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [scopePosts, setScopePosts] = useState<"all" | "specific">(initialData?.scope.posts || "all");
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>(initialData?.scope.postIds || []);
    const [posts, setPosts] = useState<InstagramMedia[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    const replyAction = initialData?.actions.find((a) => a.type === "reply_comment");
    const [replyMessages, setReplyMessages] = useState<string[]>(
        replyAction?.config.messages || [""]
    );
    const [replyEnabled, setReplyEnabled] = useState(replyAction?.isActive ?? true);

    const dmAction = initialData?.actions.find((a) => a.type === "send_dm");
    const [dmMessages, setDmMessages] = useState<string[]>(
        dmAction?.config.messages || [""]
    );
    const [dmEnabled, setDmEnabled] = useState(dmAction?.isActive ?? false);

    const selectedAccount = accounts.find((a) => a.id === socialAccountId);
    const platformDef = selectedAccount ? platformDefs[selectedAccount.platform] : null;

    const fetchPosts = useCallback(async (accountId: string) => {
        setPostsLoading(true);
        try {
            const res = await fetch(`/api/automations/posts?accountId=${accountId}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.data?.media || []);
            }
        } catch {
            // ignore
        } finally {
            setPostsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (socialAccountId && !initialData) {
            fetchPosts(socialAccountId);
        }
    }, [socialAccountId, fetchPosts, initialData]);

    const addKeyword = () => {
        const trimmed = keywordInput.trim().toLowerCase();
        if (trimmed && !keywords.includes(trimmed)) {
            setKeywords([...keywords, trimmed]);
            setKeywordInput("");
        }
    };

    const removeKeyword = (index: number) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const togglePost = (postId: string) => {
        setSelectedPostIds((prev) =>
            prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
    };

    const addReplyVariant = () => setReplyMessages([...replyMessages, ""]);
    const updateReplyVariant = (index: number, value: string) => {
        const updated = [...replyMessages];
        updated[index] = value;
        setReplyMessages(updated);
    };
    const removeReplyVariant = (index: number) => {
        if (replyMessages.length <= 1) return;
        setReplyMessages(replyMessages.filter((_, i) => i !== index));
    };

    const addDmVariant = () => setDmMessages([...dmMessages, ""]);
    const updateDmVariant = (index: number, value: string) => {
        const updated = [...dmMessages];
        updated[index] = value;
        setDmMessages(updated);
    };
    const removeDmVariant = (index: number) => {
        if (dmMessages.length <= 1) return;
        setDmMessages(dmMessages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error(t("nameRequired") || "Digite um nome para a automação");
            return;
        }
        if (!socialAccountId) {
            toast.error(t("selectAccount") || "Selecione uma conta");
            return;
        }
        if (keywords.length === 0) {
            toast.error(t("keywordsRequired") || "Adicione pelo menos uma palavra-chave");
            return;
        }

        const account = accounts.find((a) => a.id === socialAccountId);
        if (!account) return;

        setIsSubmitting(true);

        try {
            const automationPayload = {
                name: name.trim(),
                socialAccountId,
                platform: account.platform,
                triggerType: "comment_keyword" as const,
                triggerConfig: {
                    keywords,
                    matchMode: "contains" as const,
                    caseSensitive: false,
                },
                scope: {
                    posts: scopePosts,
                    postIds: scopePosts === "specific" ? selectedPostIds : undefined,
                },
                isActive: true,
            };

            const url = initialData?.id
                ? `/api/automations/${initialData.id}`
                : "/api/automations";
            const method = initialData?.id ? "PUT" : "POST";

            const autoRes = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(automationPayload),
            });

            const autoData = await autoRes.json();
            if (!autoRes.ok) {
                toast.error(autoData.error?.message || "Erro ao salvar automação");
                setIsSubmitting(false);
                return;
            }

            const automationId = initialData?.id || autoData.data?.automation?.id;

            const actions = [];
            if (replyEnabled && replyMessages.some((m) => m.trim())) {
                actions.push({
                    type: "reply_comment" as const,
                    config: { messages: replyMessages.filter((m) => m.trim()) },
                    order: 0,
                    isActive: true,
                });
            }
            if (dmEnabled && dmMessages.some((m) => m.trim())) {
                actions.push({
                    type: "send_dm" as const,
                    config: { messages: dmMessages.filter((m) => m.trim()) },
                    order: 1,
                    isActive: true,
                });
            }

            if (!initialData?.id && automationId) {
                for (const action of actions) {
                    await fetch(`/api/automations/${automationId}/actions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(action),
                    });
                }
            }

            toast.success(initialData?.id ? "Automação atualizada" : "Automação criada");
            router.push("/automations");
            router.refresh();
        } catch {
            toast.error("Erro inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                        {initialData?.id ? t("edit") : t("new")}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => router.push("/automations")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Main column */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t("name")}
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("namePlaceholder")}
                            className="rounded-lg h-10"
                        />
                    </div>

                    {/* Account Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t("account")}
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {accounts.map((account) => {
                                const def = platformDefs[account.platform];
                                const Icon = def?.icon || RiInstagramLine;
                                const isSelected = account.id === socialAccountId;
                                return (
                                    <button
                                        key={account.id}
                                        type="button"
                                        onClick={() => setSocialAccountId(isSelected ? "" : account.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${isSelected
                                                ? `${def?.bg || "bg-pink-50"} ${def?.color || "text-pink-500"} border-current ring-1 ring-current`
                                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {account.username || account.displayName || "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {def?.label || account.platform}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <Check className="h-4 w-4 ml-auto shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {accounts.length === 0 && (
                            <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">
                                Nenhuma conta conectada. Conecte uma conta primeiro.
                            </div>
                        )}
                    </div>

                    {/* Posts Selection */}
                    {selectedAccount && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Publicações
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={scopePosts === "all" ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 text-xs rounded-lg"
                                        onClick={() => setScopePosts("all")}
                                    >
                                        <Grid3x3 className="h-3 w-3 mr-1" />
                                        Todas
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={scopePosts === "specific" ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 text-xs rounded-lg"
                                        onClick={() => setScopePosts("specific")}
                                    >
                                        <ImageIcon className="h-3 w-3 mr-1" />
                                        Selecionar
                                    </Button>
                                </div>
                            </div>

                            {scopePosts === "specific" && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        {postsLoading ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="aspect-square bg-slate-100 animate-pulse rounded-lg"
                                                    />
                                                ))}
                                            </div>
                                        ) : posts.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {posts.map((post) => {
                                                    const isSelected = selectedPostIds.includes(post.id);
                                                    return (
                                                        <button
                                                            key={post.id}
                                                            type="button"
                                                            onClick={() => togglePost(post.id)}
                                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                                    ? "border-pink-500 ring-2 ring-pink-500/20"
                                                                    : "border-transparent hover:border-slate-300"
                                                                }`}
                                                        >
                                                            <img
                                                                src={post.thumbnail_url || post.media_url}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                                                    <Check className="h-5 w-5 text-white drop-shadow" />
                                                                </div>
                                                            )}
                                                            {post.media_type === "VIDEO" && (
                                                                <div className="absolute top-1 right-1">
                                                                    <Play className="h-3 w-3 text-white drop-shadow" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">
                                                Nenhuma publicação encontrada.
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    )}

                    {/* Keywords - Chips */}
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Palavras-chave
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addKeyword();
                                    }
                                }}
                                placeholder="Digite e pressione Enter"
                                className="rounded-lg h-10"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-lg shrink-0"
                                onClick={addKeyword}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((kw, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="rounded-md text-xs gap-1 cursor-pointer h-7 px-2.5 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                                        onClick={() => removeKeyword(i)}
                                    >
                                        {kw}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            A automação será ativada quando um comentário contiver qualquer uma dessas palavras.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Ações
                        </Label>

                        {/* Reply Comment */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-pink-500" />
                                    <span className="text-sm font-medium">Responder comentário</span>
                                </div>
                                <Switch
                                    checked={replyEnabled}
                                    onCheckedChange={setReplyEnabled}
                                />
                            </div>
                            <AnimatePresence>
                                {replyEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 space-y-3">
                                            <p className="text-xs text-muted-foreground">
                                                Adicione várias respostas. Uma será escolhida aleatoriamente para parecer mais natural.
                                            </p>
                                            {replyMessages.map((msg, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        value={msg}
                                                        placeholder={`Resposta ${index + 1}`}
                                                        onChange={(e) => updateReplyVariant(index, e.target.value)}
                                                        className="rounded-lg h-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-lg shrink-0"
                                                        onClick={() => removeReplyVariant(index)}
                                                        disabled={replyMessages.length <= 1}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg gap-1 h-8 text-xs"
                                                onClick={addReplyVariant}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Adicionar resposta
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Send DM */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">Enviar DM</span>
                                </div>
                                <Switch
                                    checked={dmEnabled}
                                    onCheckedChange={setDmEnabled}
                                />
                            </div>
                            <AnimatePresence>
                                {dmEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 space-y-3">
                                            <p className="text-xs text-muted-foreground">
                                                Adicione várias mensagens. Uma será escolhida aleatoriamente.
                                            </p>
                                            {dmMessages.map((msg, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        value={msg}
                                                        placeholder={`Mensagem ${index + 1}`}
                                                        onChange={(e) => updateDmVariant(index, e.target.value)}
                                                        className="rounded-lg h-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-lg shrink-0"
                                                        onClick={() => removeDmVariant(index)}
                                                        disabled={dmMessages.length <= 1}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg gap-1 h-8 text-xs"
                                                onClick={addDmVariant}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Adicionar mensagem
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Preview Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-pink-500" />
                            <span className="text-sm font-medium">Resumo</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Bot className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Nome</p>
                                    <p className="text-sm font-medium truncate">{name || "—"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                {platformDef ? (
                                    <platformDef.icon className={`h-4 w-4 mt-0.5 shrink-0 ${platformDef.color}`} />
                                ) : (
                                    <RiInstagramLine className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Conta</p>
                                    <p className="text-sm font-medium">
                                        {selectedAccount?.username || "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Palavras-chave</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {keywords.length > 0 ? (
                                            keywords.map((kw, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className="text-[10px] h-5 px-1.5 bg-pink-50 text-pink-600 border-pink-200"
                                                >
                                                    {kw}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Grid3x3 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Publicações</p>
                                    <p className="text-sm font-medium">
                                        {scopePosts === "all"
                                            ? "Todas as publicações"
                                            : `${selectedPostIds.length} selecionada(s)`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Play className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Ações</p>
                                    <div className="space-y-1 mt-1">
                                        {replyEnabled && (
                                            <div className="flex items-center gap-1.5">
                                                <MessageCircle className="h-3 w-3 text-pink-500" />
                                                <span className="text-xs">
                                                    Responder ({replyMessages.filter((m) => m.trim()).length} variantes)
                                                </span>
                                            </div>
                                        )}
                                        {dmEnabled && (
                                            <div className="flex items-center gap-1.5">
                                                <Send className="h-3 w-3 text-blue-500" />
                                                <span className="text-xs">
                                                    DM ({dmMessages.filter((m) => m.trim()).length} variantes)
                                                </span>
                                            </div>
                                        )}
                                        {!replyEnabled && !dmEnabled && (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col gap-2">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl h-10"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isSubmitting ? "Salvando..." : initialData?.id ? "Salvar alterações" : "Criar automação"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-xl h-10"
                            onClick={() => router.push("/automations")}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
