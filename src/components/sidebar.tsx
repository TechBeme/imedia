"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, ChevronUp, ChevronDown, Globe, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { usePathname as useI18nPathname } from "@/i18n/routing";
import { locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Language Switcher (inline, globe + flag) ---
const localeFlags: Record<Locale, string> = {
    "pt-BR": "🇧🇷",
    en: "🇺🇸",
    es: "🇪🇸",
};

const localeNames: Record<Locale, string> = {
    "pt-BR": "Português",
    en: "English",
    es: "Español",
};

function getLocaleFromParams(params: Record<string, string | string[]>): Locale {
    const raw = params.locale;
    const locale = Array.isArray(raw) ? raw[0] : raw;
    return locales.includes(locale as Locale) ? (locale as Locale) : "pt-BR";
}

function LanguageSwitcherInline() {
    const params = useParams();
    const pathname = useI18nPathname();
    const currentLocale = getLocaleFromParams(params as Record<string, string | string[]>);

    function switchLocale(newLocale: Locale) {
        const newPath = `/${newLocale}${pathname}`;
        window.location.href = newPath;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-gray-600 hover:bg-white hover:shadow-sm transition-all cursor-pointer outline-none">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-base leading-none">{localeFlags[currentLocale]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-fit whitespace-nowrap">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span className="text-base leading-none">{localeFlags[locale]}</span>
                        <span className="text-sm">{localeNames[locale]}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// --- Theme Toggle Slide ---
function ThemeToggleSlide() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer outline-none",
                isDark ? "bg-gray-700" : "bg-gray-200"
            )}
            aria-label="Toggle theme"
        >
            <span
                className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-200",
                    isDark ? "translate-x-5" : "translate-x-0"
                )}
            >
                {isDark ? (
                    <Moon className="h-3 w-3 text-violet-500" />
                ) : (
                    <Sun className="h-3 w-3 text-amber-500" />
                )}
            </span>
        </button>
    );
}

// --- Nav Data ---
const linkSubItems = [
    { key: "allLinks", href: "/links", icon: "list" },
    { key: "tags", href: "/links/tags", icon: "tag" },
    { key: "folders", href: "/links/folders", icon: "folder" },
    { key: "events", href: "/links/events", icon: "calendar" },
    { key: "domains", href: "/domains", icon: "globe" },
    { key: "shortUrl", href: "/settings/short-url", icon: "link" },
];

const socialSubItems = [
    { key: "accounts", href: "/accounts", icon: "userPlus" },
    { key: "compose", href: "/compose", icon: "edit" },
    { key: "scheduled", href: "/scheduled", icon: "clock" },
    { key: "history", href: "/history", icon: "history" },
];



// Small icons for sub-items
function SubIcon({ name, colorClass }: { name: string; colorClass: string }) {
    const cls = cn("h-3.5 w-3.5 shrink-0", colorClass);
    switch (name) {
        case "list": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
        case "tag": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
        case "folder": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
        case "globe": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
        case "barChart": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
        case "calendar": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
        case "userPlus": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
        case "edit": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
        case "clock": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
        case "history": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case "link": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
        case "share": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
        default: return null;
    }
}

export function Sidebar({ className }: { className?: string }) {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [linksOpen, setLinksOpen] = useState(true);
    const [socialOpen, setSocialOpen] = useState(true);

    async function handleLogout() {
        await authClient.signOut();
        toast.success(t("logoutSuccess"));
        router.push(`/${locale}/login`);
        router.refresh();
    }

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    const isDashboard = pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/`;

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 hidden lg:flex flex-col border-r border-gray-200 bg-gradient-to-b from-white to-gray-50",
                className
            )}
        >
            {/* Logo */}
            <div className="flex items-center px-5 h-14 border-b border-gray-100">
                <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-3 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
                >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">s</span>
                    </div>
                    <span className="text-base font-semibold text-gray-900">somedia</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {/* Dashboard */}
                <Link
                    href={`/${locale}/dashboard`}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isDashboard
                            ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {t("dashboard")}
                </Link>

                {/* Link Report */}
                <Link
                    href={`/${locale}/analytics/links`}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        pathname.includes("/analytics/links")
                            ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {t("linkReport")}
                </Link>

                {/* Social Report */}
                <Link
                    href={`/${locale}/analytics/social`}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        pathname.includes("/analytics/social")
                            ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {t("socialReport")}
                </Link>

                {/* Redes Sociais Accordion */}
                <div className="pt-1">
                    <button
                        onClick={() => setSocialOpen(!socialOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-[18px] h-[18px] text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>{t("socialMedia")}</span>
                        </div>
                        {socialOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {socialOpen && (
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-purple-100 pl-3">
                            {socialSubItems.map((item) => {
                                const isActive = pathname.includes(item.href);
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/${locale}${item.href}`}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                            isActive
                                                ? "text-purple-700 bg-gradient-to-r from-purple-50 to-transparent"
                                                : "text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent"
                                        )}
                                    >
                                        <SubIcon name={item.icon} colorClass="text-purple-400" />
                                        {t(item.key)}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Links Accordion */}
                <div className="pt-1">
                    <button
                        onClick={() => setLinksOpen(!linksOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-[18px] h-[18px] text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                            </svg>
                            <span>{t("links")}</span>
                        </div>
                        {linksOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {linksOpen && (
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-blue-100 pl-3">
                            {linkSubItems.map((item) => {
                                const isActive = pathname.includes(item.href);
                                return (
                                    <Link
                                        key={item.key}
                                        href={`/${locale}${item.href}`}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                            isActive
                                                ? "text-blue-700 bg-gradient-to-r from-blue-50 to-transparent"
                                                : "text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
                                        )}
                                    >
                                        <SubIcon name={item.icon} colorClass="text-blue-400" />
                                        {t(item.key)}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

            </nav>

            {/* Bottom: Theme Toggle + Language + Profile - ALL IN ONE LINE */}
            <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-2">
                {/* Row 1: Toggle + Globe + Flag */}
                <div className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
                    <ThemeToggleSlide />
                    <div className="w-px h-4 bg-gray-300" />
                    <LanguageSwitcherInline />
                </div>

                {/* Profile */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50 transition-colors cursor-pointer outline-none"
                >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                        {userInitials}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">{session?.user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                    </div>
                    <LogOut className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
            </div>
        </aside>
    );
}

export function MobileSidebar() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [linksOpen, setLinksOpen] = useState(true);
    const [socialOpen, setSocialOpen] = useState(true);

    async function handleLogout() {
        await authClient.signOut();
        toast.success(t("logoutSuccess"));
        router.push(`/${locale}/login`);
        router.refresh();
    }

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    const isDashboard = pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/`;

    return (
        <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-xl h-9 w-9 hover:bg-accent transition-colors lg:hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Menu className="h-5 w-5 text-foreground" />
                <span className="sr-only">{t("openMenu")}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 border-r border-gray-200 bg-gradient-to-b from-white to-gray-50">
                <div className="flex items-center px-5 h-14 border-b border-gray-100">
                    <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">s</span>
                        </div>
                        <span className="text-base font-semibold text-gray-900">somedia</span>
                    </Link>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                    <Link
                        href={`/${locale}/dashboard`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            isDashboard
                                ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {t("dashboard")}
                    </Link>
                    <Link
                        href={`/${locale}/analytics/links`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            pathname.includes("/analytics/links")
                                ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {t("linkReport")}
                    </Link>
                    <Link
                        href={`/${locale}/analytics/social`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            pathname.includes("/analytics/social")
                                ? "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {t("socialReport")}
                    </Link>
                    <div className="pt-1">
                        <button
                            onClick={() => setSocialOpen(!socialOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-[18px] h-[18px] text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>{t("socialMedia")}</span>
                            </div>
                            {socialOpen ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {socialOpen && (
                            <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-purple-100 pl-3">
                                {socialSubItems.map((item) => {
                                    const isActive = pathname.includes(item.href);
                                    return (
                                        <Link
                                            key={item.key}
                                            href={`/${locale}${item.href}`}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                                isActive
                                                    ? "text-purple-700 bg-gradient-to-r from-purple-50 to-transparent"
                                                    : "text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent"
                                            )}
                                        >
                                            <SubIcon name={item.icon} colorClass="text-purple-400" />
                                            {t(item.key)}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="pt-1">
                        <button
                            onClick={() => setLinksOpen(!linksOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-[18px] h-[18px] text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                </svg>
                                <span>{t("links")}</span>
                            </div>
                            {linksOpen ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {linksOpen && (
                            <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-blue-100 pl-3">
                                {linkSubItems.map((item) => {
                                    const isActive = pathname.includes(item.href);
                                    return (
                                        <Link
                                            key={item.key}
                                            href={`/${locale}${item.href}`}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                                isActive
                                                    ? "text-blue-700 bg-gradient-to-r from-blue-50 to-transparent"
                                                    : "text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
                                            )}
                                        >
                                            <SubIcon name={item.icon} colorClass="text-blue-400" />
                                            {t(item.key)}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </nav>
                <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
                        <ThemeToggleSlide />
                        <div className="w-px h-4 bg-gray-300" />
                        <LanguageSwitcherInline />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                            {userInitials}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{session?.user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                        </div>
                        <LogOut className="h-4 w-4 text-gray-400 shrink-0" />
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
