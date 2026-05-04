import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { error } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { recordClick } from "@/lib/click-tracker";
import bcrypt from "bcryptjs";

function errorHtml(title: string, message: string): string {
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
        <form method="POST" action="/${slug}">
            <input type="password" name="password" placeholder="Enter password" required autofocus />
            <button type="submit">Continue</button>
        </form>
    </div>
</body>
</html>`;
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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const { slug } = await params;
        const host = req.headers.get("host") || "";
        const domain = host.includes("localhost") || !process.env.NEXT_PUBLIC_APP_URL
            ? ""
            : host;

        const link = await getLinkBySlug(slug, domain);

        if (!link) {
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

        if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
            return new NextResponse(
                errorHtml("Link Expired", "This link has expired and is no longer available."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        if (link.password) {
            return new NextResponse(passwordHtml(slug), {
                status: 200,
                headers: { "Content-Type": "text/html" },
            });
        }

        // Record click and redirect
        await recordClick(link.id, req);
        return NextResponse.redirect(link.originalUrl, 302);
    });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const { slug } = await params;
        const host = req.headers.get("host") || "";
        const domain = host.includes("localhost") || !process.env.NEXT_PUBLIC_APP_URL
            ? ""
            : host;

        const link = await getLinkBySlug(slug, domain);

        if (!link) {
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

        if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
            return new NextResponse(
                errorHtml("Link Expired", "This link has expired and is no longer available."),
                { status: 410, headers: { "Content-Type": "text/html" } }
            );
        }

        const formData = await req.formData();
        const password = formData.get("password") as string;

        if (!link.password) {
            await recordClick(link.id, req);
            return NextResponse.redirect(link.originalUrl, 302);
        }

        const valid = await bcrypt.compare(password, link.password);
        if (!valid) {
            return new NextResponse(passwordHtml(slug, "Incorrect password. Please try again."), {
                status: 401,
                headers: { "Content-Type": "text/html" },
            });
        }

        await recordClick(link.id, req);
        return NextResponse.redirect(link.originalUrl, 302);
    });
}
