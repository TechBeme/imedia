"use client";

import { useEffect } from "react";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
}

function getLocaleFromBrowser(): Locale {
    const navLang = typeof navigator !== "undefined" ? navigator.language : null;
    if (navLang) {
        const code = navLang.toLowerCase();
        // Exact match
        const exactMatch = locales.find((l) => l.toLowerCase() === code);
        if (exactMatch) return exactMatch;
        // Language-only match
        const langOnly = code.split("-")[0];
        const fuzzyMatch = locales.find((l) => l.toLowerCase().startsWith(langOnly));
        if (fuzzyMatch) return fuzzyMatch;
    }
    return defaultLocale;
}

function getLocale(): Locale {
    // 1. Check cookie first (user manually selected)
    const cookieLocale = getCookie(LOCALE_COOKIE);
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        return cookieLocale as Locale;
    }

    // 2. Check browser language
    return getLocaleFromBrowser();
}

export default function RootPage() {
    useEffect(() => {
        const locale = getLocale();
        window.location.href = `/${locale}/dashboard`;
    }, []);

    return null;
}
