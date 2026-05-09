"use client";

import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

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

function getLocaleFromParams(params: Record<string, string | string[]>): Locale {
    const raw = params.locale;
    const locale = Array.isArray(raw) ? raw[0] : raw;
    return locales.includes(locale as Locale) ? (locale as Locale) : "pt-BR";
}

export function LanguageSwitcher() {
    const params = useParams();
    const pathname = usePathname();
    const currentLocale = getLocaleFromParams(params as Record<string, string | string[]>);
    const t = useTranslations("common");

    function switchLocale(newLocale: Locale) {
        const newPath = `/${newLocale}${pathname}`;
        window.location.href = newPath;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-9 px-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-base leading-none">{localeFlags[currentLocale]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span className="text-base leading-none">{localeFlags[locale]}</span>
                        <span className={locale === currentLocale ? "text-primary font-medium" : ""}>
                            {localeLabels[locale]}
                        </span>
                        {locale === currentLocale && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
