import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./i18n-config";

export { locales, defaultLocale, type Locale } from "./i18n-config";

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
