"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
import {
    RiDashboardLine,
    RiLinksLine,
    RiAddCircleLine,
    RiCalendarScheduleLine,
    RiHistoryLine,
    RiBarChartBoxLine,
    RiImageLine,
    RiSettings4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

const navItems = [
    { key: "dashboard", href: "/dashboard", icon: RiDashboardLine },
    { key: "accounts", href: "/accounts", icon: RiLinksLine },
    { key: "compose", href: "/compose", icon: RiAddCircleLine },
    { key: "scheduled", href: "/scheduled", icon: RiCalendarScheduleLine },
    { key: "history", href: "/history", icon: RiHistoryLine },
    { key: "analytics", href: "/analytics", icon: RiBarChartBoxLine },
    { key: "media", href: "/media", icon: RiImageLine },
    { key: "settings", href: "/settings", icon: RiSettings4Line },
];

export function Sidebar({ className }: { className?: string }) {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();

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

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-40 w-60 hidden lg:flex flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl",
                className
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center px-5">
                <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-2.5 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
                >
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
                        <span className="text-primary-foreground font-bold text-sm">i</span>
                    </div>
                    <span className="text-lg font-semibold tracking-tight font-heading">iMedia</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 px-3 py-2">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname.includes(item.href);
                    return (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.3 }}
                        >
                            <Link
                                href={`/${locale}${item.href}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Icon className="h-[18px] w-[18px] shrink-0" />
                                <span className="truncate">{t(item.key)}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-3 border-t border-border/60">
                <DropdownMenu>
                    <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        <Avatar className="h-9 w-9 ring-2 ring-border">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                        </div>
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("logout")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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

    return (
        <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-xl h-9 w-9 hover:bg-accent transition-colors lg:hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Menu className="h-5 w-5 text-foreground" />
                <span className="sr-only">{t("openMenu")}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 border-r border-border/60 bg-sidebar">
                <div className="flex h-16 items-center px-5">
                    <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-primary-foreground font-bold text-sm">i</span>
                        </div>
                        <span className="text-lg font-semibold tracking-tight font-heading">iMedia</span>
                    </Link>
                </div>
                <nav className="flex-1 space-y-0.5 px-3 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.includes(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={`/${locale}${item.href}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {t(item.key)}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-3 border-t border-border/60">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
