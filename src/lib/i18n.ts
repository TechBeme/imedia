import { getRequestConfig } from "next-intl/server";

export const locales = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-BR";

export default getRequestConfig(async ({ locale }) => {
    let safeLocale: string = defaultLocale;
    if (locale && locales.includes(locale as Locale)) {
        safeLocale = locale;
    }

    return {
        locale: safeLocale,
        messages: (await import(`../../messages/${safeLocale}.json`)).default,
        timeZone: "America/Sao_Paulo",
        now: new Date(),
    };
});
