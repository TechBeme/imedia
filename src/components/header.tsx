"use client";

import { MobileSidebar } from "@/components/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function Header() {
    const [searchFocused, setSearchFocused] = useState(false);
    const t = useTranslations("header");

    return (
        <header className="sticky top-0 z-30 bg-background/70 dark:bg-background/70 backdrop-blur-xl border-b border-border/40 px-4 lg:px-6">
            <div className="max-w-6xl mx-auto flex h-16 items-center gap-4">
                <MobileSidebar />

                {/* Search bar */}
                <div className="hidden md:flex items-center flex-1 max-w-md">
                    <div className={cn(
                        "relative w-full transition-all duration-200",
                        searchFocused && "scale-[1.02]"
                    )}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            aria-label={t("searchPlaceholder")}
                        />
                    </div>
                </div>

                <div className="flex-1 md:flex-none" />

                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />

                    <button
                        className="relative h-10 w-10 rounded-xl hover:bg-accent transition-colors flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        aria-label={t("notifications")}
                    >
                        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                    </button>
                </div>
            </div>
        </header>
    );
}
