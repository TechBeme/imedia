import { db } from "@/db";
import { linkClicks } from "@/db/schema";
import { eq, sql, gte, lte, desc, count, and } from "drizzle-orm";

export interface AnalyticsData {
    totalClicks: number;
    uniqueClicks: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksOverTime: { date: string; clicks: number }[];
    topCountries: { country: string; clicks: number }[];
    devices: { device: string; clicks: number }[];
    browsers: { browser: string; clicks: number }[];
    operatingSystems: { os: string; clicks: number }[];
    referrers: { referrer: string; clicks: number }[];
    recentClicks: {
        ip: string | null;
        country: string | null;
        city: string | null;
        device: string | null;
        browser: string | null;
        os: string | null;
        referrer: string | null;
        clickedAt: Date;
    }[];
}

export async function getLinkAnalytics(
    linkId: string,
    dateRange?: { from: Date; to: Date }
): Promise<AnalyticsData> {
    const conditions = [eq(linkClicks.linkId, linkId)];
    if (dateRange) {
        conditions.push(gte(linkClicks.clickedAt, dateRange.from));
        conditions.push(lte(linkClicks.clickedAt, dateRange.to));
    }
    const whereClause = and(...conditions);

    // Total clicks
    const totalResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(whereClause);
    const totalClicks = totalResult[0]?.count ?? 0;

    // Unique clicks (distinct IP)
    const uniqueResult = await db
        .select({ count: sql<number>`count(distinct ${linkClicks.ip})` })
        .from(linkClicks)
        .where(whereClause);
    const uniqueClicks = uniqueResult[0]?.count ?? 0;

    // Clicks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(
            and(
                eq(linkClicks.linkId, linkId),
                gte(linkClicks.clickedAt, today)
            )
        );
    const clicksToday = todayResult[0]?.count ?? 0;

    // Clicks this week (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(
            and(
                eq(linkClicks.linkId, linkId),
                gte(linkClicks.clickedAt, weekAgo)
            )
        );
    const clicksThisWeek = weekResult[0]?.count ?? 0;

    // Clicks over time (group by day)
    const timeResult = await db
        .select({
            date: sql<string>`date(${linkClicks.clickedAt})`,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(sql`date(${linkClicks.clickedAt})`)
        .orderBy(sql`date(${linkClicks.clickedAt})`);

    const clicksOverTime = timeResult.map((row) => ({
        date: row.date,
        clicks: row.clicks,
    }));

    // Top countries
    const countryResult = await db
        .select({
            country: linkClicks.country,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.country)
        .orderBy(desc(count()))
        .limit(10);

    const topCountries = countryResult
        .filter((r) => r.country !== null)
        .map((row) => ({
            country: row.country!,
            clicks: row.clicks,
        }));

    // Devices
    const deviceResult = await db
        .select({
            device: linkClicks.device,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.device)
        .orderBy(desc(count()));

    const devices = deviceResult
        .filter((r) => r.device !== null)
        .map((row) => ({
            device: row.device!,
            clicks: row.clicks,
        }));

    // Browsers
    const browserResult = await db
        .select({
            browser: linkClicks.browser,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.browser)
        .orderBy(desc(count()));

    const browsers = browserResult
        .filter((r) => r.browser !== null)
        .map((row) => ({
            browser: row.browser!,
            clicks: row.clicks,
        }));

    // Operating systems
    const osResult = await db
        .select({
            os: linkClicks.os,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.os)
        .orderBy(desc(count()));

    const operatingSystems = osResult
        .filter((r) => r.os !== null)
        .map((row) => ({
            os: row.os!,
            clicks: row.clicks,
        }));

    // Referrers
    const referrerResult = await db
        .select({
            referrer: linkClicks.referrer,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.referrer)
        .orderBy(desc(count()))
        .limit(10);

    const referrers = referrerResult
        .filter((r) => r.referrer !== null && r.referrer !== "")
        .map((row) => ({
            referrer: row.referrer!,
            clicks: row.clicks,
        }));

    // Recent clicks
    const recentResult = await db
        .select({
            ip: linkClicks.ip,
            country: linkClicks.country,
            city: linkClicks.city,
            device: linkClicks.device,
            browser: linkClicks.browser,
            os: linkClicks.os,
            referrer: linkClicks.referrer,
            clickedAt: linkClicks.clickedAt,
        })
        .from(linkClicks)
        .where(whereClause)
        .orderBy(desc(linkClicks.clickedAt))
        .limit(50);

    return {
        totalClicks,
        uniqueClicks,
        clicksToday,
        clicksThisWeek,
        clicksOverTime,
        topCountries,
        devices,
        browsers,
        operatingSystems,
        referrers,
        recentClicks: recentResult,
    };
}
