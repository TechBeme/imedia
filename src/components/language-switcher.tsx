"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
// Globe icon imported but used via localeFlags
// import { Globe } from "lucide-react";

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

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const t = useTranslations("common");

    function switchLocale(locale: Locale) {
        const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`);
        router.push(newPath);
        router.refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-2 rounded-xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 px-3"
                    aria-label={t("switchLanguage")}
                >
                    <span className="text-base leading-none">{localeFlags[currentLocale as Locale]}</span>
                    <span className="hidden sm:inline text-sm">{localeLabels[currentLocale as Locale]}</span>
                </Button>
            </DropdownMenuTrigger>
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
