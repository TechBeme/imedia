"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card hidden lg:flex flex-col",
                className
            )}
        >
            <div className="flex h-16 items-center border-b px-6">
                <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">iM</span>
                    </div>
                    <span className="text-lg font-bold">iMedia</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.includes(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {t(item.key)}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export function MobileSidebar() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname();

    return (
        <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent transition-colors lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">iM</span>
                        </div>
                        <span className="text-lg font-bold">iMedia</span>
                    </Link>
                </div>
                <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.includes(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={`/${locale}${item.href}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {t(item.key)}
                            </Link>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
