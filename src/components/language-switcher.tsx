"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const localeLabels: Record<Locale, string> = {
    "pt-BR": "Portugues",
    en: "English",
    es: "Espanol",
};

const localeFlags: Record<Locale, string> = {
    "pt-BR": "BR",
    en: "US",
    es: "ES",
};

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();

    function switchLocale(locale: Locale) {
        const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`);
        router.push(newPath);
        router.refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
                <span className="text-xs">{localeFlags[currentLocale as Locale]}</span>
                <span className="hidden sm:inline text-sm">{localeLabels[currentLocale as Locale]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={locale === currentLocale ? "bg-accent" : ""}
                    >
                        <span className="mr-2 text-xs">{localeFlags[locale]}</span>
                        {localeLabels[locale]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
