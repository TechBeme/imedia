import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/accounts", "/compose", "/scheduled", "/history", "/analytics", "/media", "/settings"];

export default function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Strip locale prefix to check path
    const localeMatch = pathname.match(/^\/(pt-BR|en|es)(\/.*)?$/);
    const pathWithoutLocale = localeMatch ? localeMatch[2] || "/" : pathname;

    const isPublic = PUBLIC_PATHS.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`));
    const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`));
    const isApi = pathname.startsWith("/api/");

    // Check auth cookie for protected routes
    if (isProtected) {
        const sessionCookie = req.cookies.get("better-auth.session_token")?.value;
        if (!sessionCookie) {
            const locale = localeMatch ? localeMatch[1] : "pt-BR";
            return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
        }
    }

    // Redirect authenticated users away from public auth pages
    if (isPublic && !isApi) {
        const sessionCookie = req.cookies.get("better-auth.session_token")?.value;
        if (sessionCookie) {
            const locale = localeMatch ? localeMatch[1] : "pt-BR";
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
        }
    }

    return intlMiddleware(req);
}

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
