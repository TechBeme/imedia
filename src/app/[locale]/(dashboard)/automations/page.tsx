"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
    Plus,
    Pencil,
    Activity,
    Bot,
    MessageCircle,
    Send,
    Power,
    PowerOff,
    ChevronDown,
    ChevronUp,
    BarChart3,
    CheckCircle2,
    Trash2,
    FileText,
} from "lucide-react";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
} from "react-icons/ri";

interface Automation {
    id: string;
    name: string;
    socialAccountId: string;
    platform: string;
    triggerType: string;
    triggerConfig: {
        keywords: string[];
        matchMode: string;
        caseSensitive: boolean;
    };
    scope: {
        posts: "all" | "specific";
        postIds?: string[];
    };
    isActive: boolean;
    createdAt: string;
}

interface AutomationStats {
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
}

interface AutomationAction {
    type: string;
    config: { messages: string[] };
    isActive: boolean;
}

interface AutomationSocialAccount {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
}

const platformDefs: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    instagram: { icon: RiInstagramLine, color: "text-pink-500", bg: "bg-pink-50", label: "Instagram" },
    facebook: { icon: RiFacebookCircleLine, color: "text-blue-600", bg: "bg-blue-50", label: "Facebook" },
    threads: { icon: RiThreadsLine, color: "text-slate-700", bg: "bg-slate-50", label: "Threads" },
    youtube: { icon: RiYoutubeLine, color: "text-red-500", bg: "bg-red-50", label: "YouTube" },
    tiktok: { icon: RiTiktokLine, color: "text-slate-700", bg: "bg-slate-50", label: "TikTok" },
    x: { icon: RiTwitterXLine, color: "text-slate-700", bg: "bg-slate-50", label: "X" },
};

export default function AutomationsPage() {
    const t = useTranslations("automations");
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [accounts, setAccounts] = useState<AutomationSocialAccount[]>([]);
    const [stats, setStats] = useState<Record<string, AutomationStats>>({});
    const [actions, setActions] = useState<Record<string, AutomationAction[]>>({});
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [autoRes, accRes] = await Promise.all([
                    fetch("/api/automations"),
                    fetch("/api/social-accounts"),
                ]);

                if (autoRes.ok) {
                    const autoData = await autoRes.json();
                    setAutomations(autoData.data?.automations || []);
                    setStats(autoData.data?.stats || {});
                    setActions(autoData.data?.actions || {});
                } else {
                    const errData = await autoRes.json().catch(() => ({}));
                    console.error("[automations] API error:", autoRes.status, errData);
                    toast.error(errData.error?.message || "Erro ao carregar automações");
                }
                if (accRes.ok) {
                    const accData = await accRes.json();
                    setAccounts(accData.data?.accounts || []);
                }
            } catch (err) {
                console.error("[automations page] load error:", err);
                toast.error("Failed to load automations");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const getAccount = (accountId: string) => {
        return accounts.find((a) => a.id === accountId);
    };

    async function toggleAutomation(id: string, current: boolean) {
        try {
            const res = await fetch(`/api/automations/${id}/toggle`, {
                method: "POST",
            });
            if (res.ok) {
                setAutomations((prev) =>
                    prev.map((a) =>
                        a.id === id ? { ...a, isActive: !current } : a
                    )
                );
                toast.success(!current ? "Automação ativada" : "Automação desativada");
            }
        } catch {
            toast.error("Erro ao alterar status");
        }
    }

    async function deleteAutomation(id: string) {
        setDeleting(true);
        try {
            const res = await fetch(`/api/automations/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setAutomations((prev) => prev.filter((a) => a.id !== id));
                toast.success("Automação excluída");
                setDeleteId(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error?.message || "Erro ao excluir automação");
            }
        } catch {
            toast.error("Erro ao excluir automação");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4 animate-pulse">
                                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-48 bg-slate-200 rounded" />
                                    <div className="h-4 w-32 bg-slate-200 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">{t("title")}</h1>
                </div>
                <Link href="/automations/new">
                    <Button className="rounded-xl gap-2">
                        <Plus className="h-4 w-4" />
                        {t("new")}
                    </Button>
                </Link>
            </div>

            {automations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                        <Bot className="h-8 w-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma automação</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                        Crie automações para responder comentários automaticamente com base em palavras-chave.
                    </p>
                    <Link href="/automations/new">
                        <Button className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Criar primeira automação
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {automations.map((automation) => {
                        const account = getAccount(automation.socialAccountId);
                        const def = account ? platformDefs[account.platform] : null;
                        const Icon = def?.icon || RiInstagramLine;
                        const autoStats = stats[automation.id];
                        const autoActions = actions[automation.id] || [];
                        const isExpanded = expandedId === automation.id;

                        const dmAction = autoActions.find((a) => a.type === "send_dm");
                        const commentAction = autoActions.find((a) => a.type === "reply_comment");

                        return (
                            <div
                                key={automation.id}
                                className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow"
                            >
                                {/* Clickable header — expands on click */}
                                <button
                                    type="button"
                                    className="w-full text-left p-5 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : automation.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Platform Icon */}
                                        <div className={`h-12 w-12 rounded-xl ${def?.bg || "bg-pink-50"} flex items-center justify-center shrink-0`}>
                                            <Icon className={`h-6 w-6 ${def?.color || "text-pink-500"}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-slate-800 truncate">
                                                    {automation.name}
                                                </h3>
                                                <Badge
                                                    variant={automation.isActive ? "default" : "secondary"}
                                                    className={`text-[10px] h-5 px-1.5 rounded-md ${automation.isActive
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                        : "bg-slate-100 text-slate-500 border-slate-200"
                                                        }`}
                                                >
                                                    {automation.isActive ? t("active") : t("inactive")}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {account?.username || account?.platform || "—"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    {automation.triggerConfig?.keywords?.length || 0} palavras
                                                </span>
                                                {autoStats && (
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="h-3.5 w-3.5" />
                                                        {autoStats.totalRuns} ativações
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {automation.triggerConfig?.keywords?.slice(0, 5).map((kw, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="secondary"
                                                        className="text-[10px] h-5 px-1.5 bg-pink-50 text-pink-600 border-pink-200 rounded-md"
                                                    >
                                                        {kw}
                                                    </Badge>
                                                ))}
                                                {(automation.triggerConfig?.keywords?.length || 0) > 5 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] h-5 px-1.5 rounded-md"
                                                    >
                                                        +{(automation.triggerConfig?.keywords?.length || 0) - 5}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions + Chevron */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <div
                                                className="flex items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => toggleAutomation(automation.id, automation.isActive)}
                                                    title={automation.isActive ? "Desativar" : "Ativar"}
                                                >
                                                    {automation.isActive ? (
                                                        <Power className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <PowerOff className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </Button>
                                                <Link href={`/automations/${automation.id}/logs`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <Activity className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/automations/${automation.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <Pencil className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => setDeleteId(automation.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </div>
                                            <div className="ml-1">
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Expandable Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                                    {/* Stats */}
                                                    {autoStats && (
                                                        <div className="bg-slate-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                                <BarChart3 className="h-3.5 w-3.5" />
                                                                Estatísticas
                                                            </h4>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-slate-800">{autoStats.totalRuns}</div>
                                                                    <div className="text-[10px] text-slate-500">Total</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-emerald-600">{autoStats.successRuns}</div>
                                                                    <div className="text-[10px] text-slate-500">Sucesso</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-red-500">{autoStats.failedRuns}</div>
                                                                    <div className="text-[10px] text-slate-500">Falhas</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Scope / Posts */}
                                                    <div className="bg-slate-50 rounded-xl p-4">
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            Posts
                                                        </h4>
                                                        {automation.scope?.posts === "all" ? (
                                                            <p className="text-sm text-slate-600">Todas as publicações</p>
                                                        ) : (
                                                            <p className="text-sm text-slate-600">
                                                                {automation.scope?.postIds?.length || 0} publicações selecionadas
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Keywords */}
                                                    <div className="bg-slate-50 rounded-xl p-4">
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                            <MessageCircle className="h-3.5 w-3.5" />
                                                            Palavras-chave
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {automation.triggerConfig?.keywords?.map((kw, i) => (
                                                                <Badge
                                                                    key={i}
                                                                    variant="secondary"
                                                                    className="text-[10px] h-5 px-1.5 bg-pink-50 text-pink-600 border-pink-200 rounded-md"
                                                                >
                                                                    {kw}
                                                                </Badge>
                                                            ))}
                                                            {(!automation.triggerConfig?.keywords?.length) && (
                                                                <span className="text-sm text-slate-400">Nenhuma palavra-chave</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* DM Responses */}
                                                    {dmAction && (
                                                        <div className="bg-slate-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                                <Send className="h-3.5 w-3.5" />
                                                                Respostas em DM
                                                            </h4>
                                                            <ul className="space-y-1.5">
                                                                {dmAction.config?.messages?.map((msg, i) => (
                                                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                                        <span className="text-pink-400 mt-0.5">•</span>
                                                                        {msg}
                                                                    </li>
                                                                ))}
                                                                {(!dmAction.config?.messages?.length) && (
                                                                    <span className="text-sm text-slate-400">Nenhuma resposta configurada</span>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Comment Responses */}
                                                    {commentAction && (
                                                        <div className="bg-slate-50 rounded-xl p-4">
                                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Respostas em comentários
                                                            </h4>
                                                            <ul className="space-y-1.5">
                                                                {commentAction.config?.messages?.map((msg, i) => (
                                                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                                        <span className="text-pink-400 mt-0.5">•</span>
                                                                        {msg}
                                                                    </li>
                                                                ))}
                                                                {(!commentAction.config?.messages?.length) && (
                                                                    <span className="text-sm text-slate-400">Nenhuma resposta configurada</span>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Excluir automação</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteAutomation(deleteId)}
                            disabled={deleting}
                        >
                            {deleting ? "Excluindo..." : "Excluir"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
