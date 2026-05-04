import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { db } from "@/db";
import { customDomains } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/accounts", "/compose", "/scheduled", "/history", "/analytics", "/media", "/settings"];

function getAppHost(): string {
    try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host;
    } catch {
        return "localhost:3000";
    }
}

async function isCustomDomain(host: string): Promise<boolean> {
    try {
        const domains = await db
            .select()
            .from(customDomains)
            .where(
                and(
                    eq(customDomains.domain, host),
                    eq(customDomains.isVerified, true),
                    eq(customDomains.isActive, true)
                )
            )
            .limit(1);
        return domains.length > 0;
    } catch {
        return false;
    }
}

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const host = req.headers.get("host") || "";
    const appHost = getAppHost();

    // Custom domain routing: rewrite to /l/[slug] and skip locale/auth middleware
    if (host && host !== appHost && !host.startsWith("localhost")) {
        const custom = await isCustomDomain(host);
        if (custom) {
            // Rewrite /slug to /l/slug so the redirect handler catches it
            const slugMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
            if (slugMatch && !pathname.startsWith("/l/")) {
                const url = req.nextUrl.clone();
                url.pathname = `/l${pathname}`;
                return NextResponse.rewrite(url);
            }
            return NextResponse.next();
        }
    }

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
