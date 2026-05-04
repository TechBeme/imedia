import { NextRequest } from "next/server";
import { db } from "@/db";
import { shortLinks, linkClicks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export function parseUserAgent(ua: string): {
    device: string;
    browser: string;
    os: string;
} {
    const lower = ua.toLowerCase();

    // Device
    let device = "desktop";
    if (/mobile|android|iphone|ipad|ipod|windows phone/.test(lower)) {
        device = /ipad|tablet/.test(lower) ? "tablet" : "mobile";
    }

    // Browser
    let browser = "unknown";
    if (/chrome\/|chromium\//.test(lower) && !/edg\//.test(lower)) {
        browser = "chrome";
    } else if (/safari\//.test(lower) && !/chrome\/|chromium\//.test(lower)) {
        browser = "safari";
    } else if (/firefox\//.test(lower)) {
        browser = "firefox";
    } else if (/edg\//.test(lower)) {
        browser = "edge";
    } else if (/opera|opr\//.test(lower)) {
        browser = "opera";
    }

    // OS
    let os = "unknown";
    if (/windows nt/.test(lower)) {
        os = "windows";
    } else if (/macintosh|mac os/.test(lower)) {
        os = "macos";
    } else if (/linux/.test(lower)) {
        os = "linux";
    } else if (/android/.test(lower)) {
        os = "android";
    } else if (/iphone|ipad|ipod/.test(lower)) {
        os = "ios";
    }

    return { device, browser, os };
}

export async function recordClick(
    linkId: string,
    req: NextRequest
): Promise<void> {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    const { device, browser, os } = parseUserAgent(userAgent);

    // Insert click record
    await db.insert(linkClicks).values({
        linkId,
        ip,
        userAgent,
        device,
        browser,
        os,
        referrer,
    });

    // Increment click count atomically
    await db
        .update(shortLinks)
        .set({
            clickCount: sql`${shortLinks.clickCount} + 1`,
        })
        .where(eq(shortLinks.id, linkId));
}
