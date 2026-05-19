import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

// Inline constants to avoid Edge Runtime import issues with @/ aliases
const locales = ["pt-BR", "en", "es"] as const;
const defaultLocale: (typeof locales)[number] = "pt-BR";

export const routing = defineRouting({
    locales,
    defaultLocale,
    localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
