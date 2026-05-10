import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

async function getLocaleFromRequest(): Promise<Locale> {
    // 1. Check cookie first (user manually selected)
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        return cookieLocale as Locale;
    }

    // 2. Check Accept-Language header (browser preference)
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage) {
        const languages = acceptLanguage
            .split(",")
            .map((lang) => {
                const [code, q = "1"] = lang.trim().split(";q=");
                return { code: code.trim().toLowerCase(), q: parseFloat(q) };
            })
            .sort((a, b) => b.q - a.q);

        for (const { code } of languages) {
            // Exact match
            const exactMatch = locales.find((l) => l.toLowerCase() === code);
            if (exactMatch) return exactMatch;

            // Language-only match (e.g., "pt" matches "pt-BR", "en" matches "en")
            const langOnly = code.split("-")[0];
            const fuzzyMatch = locales.find((l) => l.toLowerCase().startsWith(langOnly));
            if (fuzzyMatch) return fuzzyMatch;
        }
    }

    // 3. Fallback to default
    return defaultLocale;
}

export default async function RootPage() {
    const locale = await getLocaleFromRequest();
    redirect(`/${locale}/dashboard`);
}
