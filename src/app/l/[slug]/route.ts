import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shortLinks, linkDeviceRules, userSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { recordClick } from "@/lib/click-tracker";
import bcrypt from "bcryptjs";

function getAppHost(): string {
    try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host;
    } catch {
        return "localhost:3000";
    }
}

function errorHtml(title: string, message: string, redirectUrl?: string): string {
    const redirectBlock = redirectUrl
        ? `<p style="margin-top: 1rem;"><a href="${redirectUrl}">Continue to destination</a></p>`
        : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        h1 { color: #333; margin-bottom: 0.5rem; }
        p { color: #666; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
        ${redirectBlock}
    </div>
</body>
</html>`;
}

function ogPreviewHtml(link: typeof shortLinks.$inferSelect, slug: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const shortUrl = `${appUrl}/l/${slug}`;
    const ogTitle = link.ogTitle || link.title || "Link Preview";
    const ogDescription = link.ogDescription || link.description || "Click to visit this link";
    const ogImage = link.ogImageUrl || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ogTitle}</title>
    <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${ogDescription.replace(/"/g, '&quot;')}" />
    ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ""}
    <meta property="og:url" content="${shortUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; max-width: 420px; width: 90%; }
        .image { width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 1.5rem; background: #f0f0f0; }
        h1 { color: #1a1a2e; margin-bottom: 0.75rem; font-size: 1.5rem; }
        p { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
        .url { color: #888; font-size: 0.85rem; margin-bottom: 1.5rem; word-break: break-all; }
        button { width: 100%; padding: 0.875rem; background: #0066cc; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #0052a3; }
        .meta { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; color: #888; font-size: 0.8rem; }
        .shield { width: 16px; height: 16px; }
    </style>
</head>
<body>
    <div class="card">
        ${ogImage ? `<img class="image" src="${ogImage}" alt="Preview" onerror="this.style.display='none'" />` : ""}
        <div class="meta">
            <svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Secure link
        </div>
        <h1>${ogTitle}</h1>
        <p>${ogDescription}</p>
        <div class="url">${shortUrl}</div>
        <form method="POST" action="/l/${slug}">
            <button type="submit">Continue to website</button>
        </form>
    </div>
</body>
</html>`;
}

function passwordHtml(slug: string, errorMsg?: string): string {
    const errorBlock = errorMsg
        ? `<p style="color: #dc2626; margin-bottom: 1rem;">${errorMsg}</p>`
        : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Required</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
        h1 { color: #333; margin-bottom: 0.5rem; }
        p { color: #666; margin-bottom: 1.5rem; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; margin-bottom: 1rem; }
        button { width: 100%; padding: 0.75rem; background: #0066cc; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #0052a3; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Password Required</h1>
        <p>This link is password protected.</p>
        ${errorBlock}
        <form method="POST" action="/l/${slug}">
            <input type="password" name="password" placeholder="Enter password" required autofocus />
            <button type="submit">Continue</button>
        </form>
    </div>
</body>
</html>`;
}

function resolveDomain(host: string): string {
    const appHost = getAppHost();
    if (!host || host === appHost || host.startsWith("localhost")) {
        return "";
    }
    return host;
}

async function getLinkBySlug(slug: string, domain: string) {
    const conditions = [eq(shortLinks.slug, slug)];
    if (domain) {
        conditions.push(eq(shortLinks.domain, domain));
    } else {
        conditions.push(eq(shortLinks.domain, ""));
    }

    const results = await db
        .select()
        .from(shortLinks)
        .where(and(...conditions))
        .limit(1);

    return results[0] || null;
}

async function getUserSettings(userId: string | null) {
    if (!userId) return null;
    const results = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
    return results[0] || null;
}

function detectOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    if (ua.includes("windows")) return "windows";
    if (ua.includes("macintosh") || ua.includes("mac os")) return "macos";
    if (ua.includes("linux")) return "linux";
    return "other";
}

async function getDeviceRules(linkId: string) {
    return db
        .select()
        .from(linkDeviceRules)
        .where(eq(linkDeviceRules.linkId, linkId))
        .orderBy(linkDeviceRules.priority);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const { slug } = await params;
        const host = req.headers.get("host") || "";
        const domain = resolveDomain(host);

        const link = await getLinkBySlug(slug, domain);
        const settings = link?.userId ? await getUserSettings(link.userId) : null;

        if (!link) {
            // Check for global not-found redirect
            if (settings?.notFoundRedirectUrl) {
                return NextResponse.redirect(settings.notFoundRedirectUrl, 302);
            }
            return new NextResponse(
                errorHtml("Link Not Found", "The link you are looking for does not exist."),
                { status: 404, headers: { "Content-Type": "text/html" } }
            );
        }

        if (!link.isActive) {
            return new NextResponse(
                errorHtml("Link Disabled", "This link has been disabled by its owner."),
                { status: 403, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.startsAt && new Date() < new Date(link.startsAt)) {
            return new NextResponse(
                errorHtml("Link Not Active Yet", "This link is not active yet. Please check back later."),
                { status: 403, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
            // Check for link-specific expired redirect, then global default
            const redirectUrl = link.expiredRedirectUrl || settings?.defaultExpiredRedirectUrl;
            if (redirectUrl) {
                return NextResponse.redirect(redirectUrl, 302);
            }
            return new NextResponse(
                errorHtml("Link Expired", "This link has expired and is no longer available."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
            return new NextResponse(
                errorHtml("Link Limit Reached", "This link has reached its maximum number of clicks."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.password) {
            return new NextResponse(passwordHtml(slug), {
                status: 200,
                headers: { "Content-Type": "text/html" },
            });
        }

        // If OG metadata exists, show preview page instead of direct redirect
        if (link.ogTitle || link.ogDescription || link.ogImageUrl) {
            return new NextResponse(ogPreviewHtml(link, slug), {
                status: 200,
                headers: { "Content-Type": "text/html" },
            });
        }

        // Resolve device-specific URL
        let redirectUrl = link.originalUrl;
        const userAgent = req.headers.get("user-agent") || "";
        const os = detectOS(userAgent);
        const deviceRules = await getDeviceRules(link.id);
        const matchingRule = deviceRules.find((r) => r.os === os);
        if (matchingRule) {
            redirectUrl = matchingRule.url;
        }

        // Record click and redirect
        await recordClick(link.id, req);
        return NextResponse.redirect(redirectUrl, 302);
    });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const { slug } = await params;
        const host = req.headers.get("host") || "";
        const domain = resolveDomain(host);

        const link = await getLinkBySlug(slug, domain);
        const settings = link?.userId ? await getUserSettings(link.userId) : null;

        if (!link) {
            if (settings?.notFoundRedirectUrl) {
                return NextResponse.redirect(settings.notFoundRedirectUrl, 302);
            }
            return new NextResponse(
                errorHtml("Link Not Found", "The link you are looking for does not exist."),
                { status: 404, headers: { "Content-Type": "text/html" } }
            );
        }

        if (!link.isActive) {
            return new NextResponse(
                errorHtml("Link Disabled", "This link has been disabled by its owner."),
                { status: 403, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.startsAt && new Date() < new Date(link.startsAt)) {
            return new NextResponse(
                errorHtml("Link Not Active Yet", "This link is not active yet. Please check back later."),
                { status: 403, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
            const redirectUrl = link.expiredRedirectUrl || settings?.defaultExpiredRedirectUrl;
            if (redirectUrl) {
                return NextResponse.redirect(redirectUrl, 302);
            }
            return new NextResponse(
                errorHtml("Link Expired", "This link has expired and is no longer available."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
            return new NextResponse(
                errorHtml("Link Limit Reached", "This link has reached its maximum number of clicks."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        const formData = await req.formData();
        const password = formData.get("password") as string;

        // Resolve device-specific URL
        let redirectUrl = link.originalUrl;
        const userAgent = req.headers.get("user-agent") || "";
        const os = detectOS(userAgent);
        const deviceRules = await getDeviceRules(link.id);
        const matchingRule = deviceRules.find((r) => r.os === os);
        if (matchingRule) {
            redirectUrl = matchingRule.url;
        }

        if (!link.password) {
            await recordClick(link.id, req);
            return NextResponse.redirect(redirectUrl, 302);
        }

        const valid = await bcrypt.compare(password, link.password);
        if (!valid) {
            return new NextResponse(passwordHtml(slug, "Incorrect password. Please try again."), {
                status: 401,
                headers: { "Content-Type": "text/html" },
            });
        }

        await recordClick(link.id, req);
        return NextResponse.redirect(redirectUrl, 302);
    });
}
