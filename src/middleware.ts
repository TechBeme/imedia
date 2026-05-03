import { NextRequest, NextResponse } from "next/server";

const locales = ["pt-BR", "en", "es"];
const defaultLocale = "pt-BR";

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if pathname already has a locale
    const hasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (hasLocale) {
        return NextResponse.next();
    }

    // Redirect to default locale
    const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
}

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
