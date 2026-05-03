import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicPaths = ["/", "/login", "/register", "/forgot-password"];

function isPublicPath(path: string): boolean {
    return publicPaths.some(
        (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`/en${p}`) || path.startsWith(`/es${p}`)
    );
}

export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const response = intlMiddleware(request);

    if (isPublicPath(pathname)) {
        return response;
    }

    const sessionCookie =
        request.cookies.get("better-auth.session_token")?.value ??
        request.cookies.get("session_token")?.value;

    if (!sessionCookie) {
        const locale = pathname.startsWith("/en")
            ? "en"
            : pathname.startsWith("/es")
                ? "es"
                : "pt-BR";
        const loginUrl = new URL(`/${locale}/login`, request.url);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
