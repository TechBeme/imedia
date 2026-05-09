"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const localeLabels: Record<Locale, string> = {
    "pt-BR": "Português",
    en: "English",
    es: "Español",
};

const localeFlags: Record<Locale, string> = {
    "pt-BR": "🇧🇷",
    en: "🇺🇸",
    es: "🇪🇸",
};

function getLocaleFromPath(pathname: string): Locale {
    const segment = pathname.split("/")[1];
    return locales.includes(segment as Locale) ? (segment as Locale) : "pt-BR";
}

export function LanguageSwitcher() {
    const [currentLocale, setCurrentLocale] = useState<Locale>("pt-BR");
    const t = useTranslations("common");

    useEffect(() => {
        setCurrentLocale(getLocaleFromPath(window.location.pathname));
    }, []);

    function switchLocale(locale: Locale) {
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/(pt-BR|en|es)(\/|$)/, "/") || "/";
        const newPath = `/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
        window.location.href = newPath;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={(props) => (
                    <Button
                        {...props}
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 rounded-xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 px-3"
                        aria-label={t("switchLanguage")}
                    >
                        <span className="text-base leading-none">{localeFlags[currentLocale as Locale]}</span>
                        <span className="hidden sm:inline text-sm">{localeLabels[currentLocale as Locale]}</span>
                    </Button>
                )}
            />
            <DropdownMenuContent align="end" className="rounded-xl">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={`cursor-pointer rounded-lg gap-2 ${locale === currentLocale ? "bg-accent" : ""}`}
                    >
                        <span className="text-base leading-none">{localeFlags[locale]}</span>
                        <span className="text-sm">{localeLabels[locale]}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
