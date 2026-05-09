import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { db } from "@/db";
import { shortLinks, linkClicks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

function hashFingerprint(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36).padStart(8, "0");
}

export function parseUserAgent(ua: string): {
    device: string;
    deviceModel: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
} {
    const parser = new UAParser(ua);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    const deviceType = device.type || "desktop";
    const deviceModel = device.model
        ? `${device.vendor || ""} ${device.model}`.trim()
        : deviceType;

    return {
        device: deviceType,
        deviceModel: deviceModel || "unknown",
        browser: browser.name?.toLowerCase() || "unknown",
        browserVersion: browser.version || "unknown",
        os: os.name?.toLowerCase() || "unknown",
        osVersion: os.version || "unknown",
    };
}

export async function recordClick(
    linkId: string,
    req: NextRequest
): Promise<void> {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";

    const {
        device,
        deviceModel,
        browser,
        browserVersion,
        os,
        osVersion,
    } = parseUserAgent(userAgent);

    // Generate fingerprint for unique visitor tracking
    const fingerprint = hashFingerprint(`${ip}:${userAgent}:${acceptLanguage}`);

    // Extract primary language
    const language = acceptLanguage.split(",")[0]?.split(";")[0]?.trim() || "";

    // Insert click record
    await db.insert(linkClicks).values({
        linkId,
        ip,
        userAgent,
        device,
        deviceModel,
        browser,
        browserVersion,
        os,
        osVersion,
        language,
        referrer,
        fingerprint,
    });

    // Increment click count atomically
    await db
        .update(shortLinks)
        .set({
            clickCount: sql`${shortLinks.clickCount} + 1`,
        })
        .where(eq(shortLinks.id, linkId));
}
