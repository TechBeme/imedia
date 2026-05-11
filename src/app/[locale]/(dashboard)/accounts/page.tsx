"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Loader2, Heart, MessageCircle, Pencil, Eye } from "lucide-react";
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiThreadsLine,
    RiYoutubeLine,
    RiTiktokLine,
    RiTwitterXLine,
} from "react-icons/ri";

interface InstagramProfile {
    username: string | null;
    name: string | null;
    mediaCount: number;
    followersCount: number;
    followsCount: number;
    biography: string;
    website: string;
    profilePictureUrl: string | null;
}

interface InstagramMediaItem {
    id: string;
    caption: string | null;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    view_count?: number;
}

interface SocialAccount {
    id: string;
    platform: string;
    username: string | null;
    displayName: string | null;
    profilePicture: string | null;
    isActive: boolean;
}

const platformDefs = [
    {
        key: "instagram",
        name: "Instagram",
        icon: RiInstagramLine,
        color: "text-pink-500",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
    },
    {
        key: "facebook",
        name: "Facebook",
        icon: RiFacebookCircleLine,
        color: "text-blue-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
    {
        key: "threads",
        name: "Threads",
        icon: RiThreadsLine,
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
    {
        key: "youtube",
        name: "YouTube",
        icon: RiYoutubeLine,
        color: "text-red-500",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
    {
        key: "tiktok",
        name: "TikTok",
        icon: RiTiktokLine,
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
    {
        key: "x",
        name: "X (Twitter)",
        icon: RiTwitterXLine,
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
];

export default function AccountsPage() {
    const t = useTranslations("accounts");
    const tc = useTranslations("common");
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [media, setMedia] = useState<InstagramMediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
        fetchInstagramMedia();

        function handleMessage(event: MessageEvent) {
            if (event.data?.type === "INSTAGRAM_CONNECTED") {
                if (event.data.success) {
                    toast.success(t("connectSuccess") || "Instagram conectado com sucesso!");
                } else {
                    toast.error(event.data.error || "Erro ao conectar Instagram");
                }
                fetchAccounts();
                fetchInstagramMedia();
                setConnecting(false);
            }
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchAccounts() {
        try {
            const res = await fetch("/api/social-accounts");
            const data = await res.json();
            const list = data.data?.accounts || data.accounts || [];
            setAccounts(list);
        } catch {
            toast.error(tc("error"));
        } finally {
            setLoading(false);
        }
    }

    async function fetchInstagramMedia() {
        try {
            const res = await fetch("/api/instagram/media");
            const data = await res.json();
            console.log("[fetchInstagramMedia] response:", data);
            if (data.data) {
                setProfile(data.data.profile);
                setMedia(data.data.media || []);
                setApiError(null);
            } else if (data.error) {
                setApiError(data.error.message || "Erro ao buscar dados do Instagram");
                console.error("[fetchInstagramMedia] API error:", data.error);
            }
        } catch (err) {
            console.error("Failed to fetch Instagram media:", err);
            setApiError("Falha na conexao com o Instagram");
        }
    }

    async function handleConnect() {
        setConnecting(true);
        try {
            const res = await fetch("/api/instagram/auth");
            const data = await res.json();
            const url = data.data?.url;

            if (url) {
                const popup = window.open(
                    url,
                    "instagram_oauth",
                    "width=600,height=700,scrollbars=yes,resizable=yes"
                );

                if (!popup) {
                    toast.error("Popup bloqueado. Permita popups para este site.");
                    setConnecting(false);
                    return;
                }

                const interval = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(interval);
                        fetchAccounts();
                        fetchInstagramMedia();
                        setConnecting(false);
                    }
                }, 1000);
            } else {
                toast.error(data.error?.message || tc("error"));
                setConnecting(false);
            }
        } catch {
            toast.error(tc("error"));
            setConnecting(false);
        }
    }

    async function handleDisconnect() {
        setDisconnecting(true);
        try {
            const res = await fetch("/api/instagram/disconnect", { method: "POST" });
            if (res.ok) {
                toast.success(t("disconnectSuccess"));
                setProfile(null);
                setMedia([]);
                fetchAccounts();
            } else {
                toast.error(t("disconnectFailed"));
            }
        } catch {
            toast.error(tc("error"));
        } finally {
            setDisconnecting(false);
        }
    }

    const instagramAccount = accounts.find((a) => a.platform === "instagram" && a.isActive);
    const isConnected = !!instagramAccount;

    const displayProfile: InstagramProfile = profile || {
        username: instagramAccount?.username || null,
        name: instagramAccount?.displayName || null,
        mediaCount: 0,
        followersCount: 0,
        followsCount: 0,
        biography: "",
        website: "",
        profilePictureUrl: instagramAccount?.profilePicture || null,
    };

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
            </div>

            <div className="flex gap-6 items-start">
                {/* Sidebar - Platform List */}
                <div className="w-56 shrink-0">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3 px-2">Plataformas</h2>
                    <div className="space-y-1">
                        {platformDefs.map((platform) => {
                            const Icon = platform.icon;
                            const isActive = platform.key === "instagram";
                            const account = accounts.find((a) => a.platform === platform.key);
                            const connected = !!account && account.isActive;

                            return (
                                <button
                                    key={platform.key}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? `${platform.bgColor} ${platform.color} ${platform.borderColor} border`
                                        : "text-slate-500 hover:bg-slate-100"
                                        } ${!isActive ? "opacity-60" : ""}`}
                                    disabled={!isActive}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{platform.name}</span>
                                    {connected && (
                                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Detail Panel - Instagram Profile */}
                <div className="flex-1">
                    {!isConnected ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                                <RiInstagramLine className="h-8 w-8 text-pink-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Conecte seu Instagram
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Conecte sua conta do Instagram para gerenciar posts, visualizar analytics e publicar conteudo.
                            </p>
                            <Button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white"
                            >
                                {connecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RiInstagramLine className="h-4 w-4 mr-2" />
                                )}
                                {connecting ? "Conectando..." : "Conectar Instagram"}
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Profile Header */}
                            <div className="p-8 border-b border-slate-100">
                                {apiError && (
                                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                        <strong>Erro ao carregar dados:</strong> {apiError}. Tente reconectar sua conta.
                                    </div>
                                )}
                                <div className="flex items-start gap-8">
                                    {/* Avatar with gradient ring */}
                                    <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1 shrink-0">
                                        <div className="h-full w-full rounded-full bg-white p-0.5">
                                            {displayProfile.profilePictureUrl ? (
                                                <img
                                                    src={displayProfile.profilePictureUrl}
                                                    alt={displayProfile.username || "Profile"}
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-pink-500">
                                                        {(displayProfile.name || displayProfile.username || "U")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Username + Disconnect button */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-xl font-normal text-slate-800">
                                                {displayProfile.username || instagramAccount?.username || "—"}
                                            </h2>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDisconnect}
                                                disabled={disconnecting}
                                                className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                            >
                                                {disconnecting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                Desconectar conta
                                            </Button>
                                        </div>

                                        {/* Name */}
                                        <p className="font-semibold text-slate-800 mb-3">
                                            {displayProfile.name || displayProfile.username || instagramAccount?.displayName || "—"}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex gap-8 mb-4">
                                            <div className="text-center">
                                                <span className="font-bold text-slate-800">
                                                    {displayProfile.mediaCount || 0}
                                                </span>{" "}
                                                <span className="text-slate-500">posts</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="font-bold text-slate-800">
                                                    {formatCount(displayProfile.followersCount || 0)}
                                                </span>{" "}
                                                <span className="text-slate-500">seguidores</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="font-bold text-slate-800">
                                                    {displayProfile.followsCount || 0}
                                                </span>{" "}
                                                <span className="text-slate-500">seguindo</span>
                                            </div>
                                        </div>

                                        {/* Bio, website */}
                                        <div>
                                            {displayProfile.biography && (
                                                <p className="text-sm text-slate-600 whitespace-pre-line">
                                                    {displayProfile.biography}
                                                </p>
                                            )}
                                            {displayProfile.website && (
                                                <a
                                                    href={displayProfile.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline mt-1 block"
                                                >
                                                    {displayProfile.website}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Posts Grid */}
                            <div className="p-8">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    Publicacoes
                                </h3>

                                {media.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <RiInstagramLine className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">Nenhuma publicacao encontrada</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-0">
                                        {media.map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
                                            >
                                                <img
                                                    src={item.media_type === "VIDEO" && item.thumbnail_url
                                                        ? item.thumbnail_url
                                                        : item.media_url}
                                                    alt={item.caption || "Post"}
                                                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                {/* Video indicator */}
                                                {item.media_type === "VIDEO" && (
                                                    <div className="absolute top-2 right-2">
                                                        <svg className="h-5 w-5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </div>
                                                )}

                                                {/* Carousel indicator */}
                                                {item.media_type === "CAROUSEL_ALBUM" && (
                                                    <div className="absolute top-2 right-2">
                                                        <svg className="h-5 w-5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" />
                                                        </svg>
                                                    </div>
                                                )}

                                                {/* Views count - bottom left (like Instagram) */}
                                                {item.media_type === "VIDEO" && (
                                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white drop-shadow-md">
                                                        <Eye className="h-5 w-5" />
                                                        <span className="text-sm font-semibold">
                                                            {formatCount(item.view_count || item.like_count)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                                    <div className="flex items-center gap-1.5">
                                                        <Heart className="h-5 w-5 fill-white" />
                                                        <span className="font-semibold">{item.like_count}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageCircle className="h-5 w-5 fill-white" />
                                                        <span className="font-semibold">{item.comments_count}</span>
                                                    </div>
                                                </div>

                                                {/* Edit button - bottom right */}
                                                <button
                                                    className="absolute bottom-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    title="Editar"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toast.info("Edicao de posts em breve!");
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-600" />
                                                </button>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>


                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}
