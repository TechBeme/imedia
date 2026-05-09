import { db } from "@/db";
import { linkClicks, shortLinks } from "@/db/schema";
import { eq, sql, gte, lte, desc, count, and, inArray } from "drizzle-orm";

export interface AnalyticsData {
    totalClicks: number;
    uniqueVisitors: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksOverTime: { date: string; clicks: number; uniqueVisitors: number }[];
    topCountries: { country: string; clicks: number; uniqueVisitors: number }[];
    topCities: { city: string; country: string; clicks: number }[];
    topRegions: { region: string; country: string; clicks: number }[];
    deviceTypes: { type: string; clicks: number }[];
    devices: { device: string; model: string; clicks: number }[];
    browsers: { browser: string; version: string; clicks: number }[];
    operatingSystems: { os: string; version: string; clicks: number }[];
    languages: { language: string; clicks: number }[];
    timezones: { timezone: string; clicks: number }[];
    referrers: { referrer: string; clicks: number; uniqueVisitors: number }[];
    mapData: { country: string; clicks: number; lat: number; lng: number }[];
    recentClicks: {
        ip: string | null;
        country: string | null;
        city: string | null;
        region: string | null;
        device: string | null;
        deviceModel: string | null;
        browser: string | null;
        os: string | null;
        language: string | null;
        referrer: string | null;
        clickedAt: Date;
    }[];
}

// Simple country coordinate map for the heatmap
const countryCoords: Record<string, { lat: number; lng: number }> = {
    "brazil": { lat: -14.235, lng: -51.925 },
    "united states": { lat: 37.09, lng: -95.71 },
    "united kingdom": { lat: 55.378, lng: -3.436 },
    "germany": { lat: 51.165, lng: 10.451 },
    "france": { lat: 46.227, lng: 2.213 },
    "spain": { lat: 40.463, lng: -3.749 },
    "portugal": { lat: 39.399, lng: -8.224 },
    "italy": { lat: 41.871, lng: 12.567 },
    "canada": { lat: 56.13, lng: -106.346 },
    "mexico": { lat: 23.634, lng: -102.552 },
    "argentina": { lat: -38.416, lng: -63.616 },
    "chile": { lat: -35.675, lng: -71.543 },
    "colombia": { lat: 4.57, lng: -74.297 },
    "peru": { lat: -9.19, lng: -75.015 },
    "japan": { lat: 36.204, lng: 138.252 },
    "china": { lat: 35.861, lng: 104.195 },
    "india": { lat: 20.593, lng: 78.962 },
    "australia": { lat: -25.274, lng: 133.775 },
    "russia": { lat: 61.524, lng: 105.318 },
    "south korea": { lat: 35.907, lng: 127.766 },
    "indonesia": { lat: -0.789, lng: 113.921 },
    "turkey": { lat: 38.963, lng: 35.243 },
    "saudi arabia": { lat: 23.885, lng: 45.079 },
    "south africa": { lat: -30.559, lng: 22.937 },
    "egypt": { lat: 26.82, lng: 30.802 },
    "nigeria": { lat: 9.081, lng: 8.675 },
    "kenya": { lat: -0.023, lng: 37.906 },
    "poland": { lat: 51.919, lng: 19.145 },
    "netherlands": { lat: 52.132, lng: 5.291 },
    "belgium": { lat: 50.503, lng: 4.469 },
    "sweden": { lat: 60.128, lng: 18.643 },
    "norway": { lat: 60.472, lng: 8.468 },
    "finland": { lat: 61.924, lng: 25.748 },
    "denmark": { lat: 56.263, lng: 9.501 },
    "switzerland": { lat: 46.818, lng: 8.227 },
    "austria": { lat: 47.516, lng: 14.55 },
    "czech republic": { lat: 49.817, lng: 15.472 },
    "hungary": { lat: 47.162, lng: 19.503 },
    "romania": { lat: 45.943, lng: 24.966 },
    "ukraine": { lat: 48.379, lng: 31.165 },
    "greece": { lat: 39.074, lng: 21.824 },
    "israel": { lat: 31.046, lng: 34.851 },
    "uae": { lat: 23.424, lng: 53.847 },
    "thailand": { lat: 15.87, lng: 100.992 },
    "vietnam": { lat: 14.058, lng: 108.277 },
    "malaysia": { lat: 4.21, lng: 101.975 },
    "philippines": { lat: 12.879, lng: 121.774 },
    "taiwan": { lat: 23.697, lng: 120.96 },
    "hong kong": { lat: 22.319, lng: 114.169 },
    "singapore": { lat: 1.352, lng: 103.819 },
    "new zealand": { lat: -40.9, lng: 174.886 },
    "ireland": { lat: 53.412, lng: -8.243 },
    "unknown": { lat: 0, lng: 0 },
};

function getCountryCoords(country: string): { lat: number; lng: number } {
    const key = country.toLowerCase().trim();
    return countryCoords[key] || { lat: 0, lng: 0 };
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

    // Unique visitors (distinct fingerprint)
    const uniqueResult = await db
        .select({ count: sql<number>`count(distinct ${linkClicks.fingerprint})` })
        .from(linkClicks)
        .where(whereClause);
    const uniqueVisitors = uniqueResult[0]?.count ?? 0;

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

    // Clicks over time (group by day) with unique visitors
    const timeResult = await db
        .select({
            date: sql<string>`date(${linkClicks.clickedAt})`,
            clicks: count(),
            uniqueVisitors: sql<number>`count(distinct ${linkClicks.fingerprint})`,
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(sql`date(${linkClicks.clickedAt})`)
        .orderBy(sql`date(${linkClicks.clickedAt})`);

    const clicksOverTime = timeResult.map((row) => ({
        date: row.date,
        clicks: row.clicks,
        uniqueVisitors: row.uniqueVisitors,
    }));

    // Top countries with unique visitors
    const countryResult = await db
        .select({
            country: linkClicks.country,
            clicks: count(),
            uniqueVisitors: sql<number>`count(distinct ${linkClicks.fingerprint})`,
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
            uniqueVisitors: row.uniqueVisitors,
        }));

    // Top cities
    const cityResult = await db
        .select({
            city: linkClicks.city,
            country: linkClicks.country,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.city, linkClicks.country)
        .orderBy(desc(count()))
        .limit(10);

    const topCities = cityResult
        .filter((r) => r.city !== null)
        .map((row) => ({
            city: row.city!,
            country: row.country || "",
            clicks: row.clicks,
        }));

    // Top regions
    const regionResult = await db
        .select({
            region: linkClicks.region,
            country: linkClicks.country,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.region, linkClicks.country)
        .orderBy(desc(count()))
        .limit(10);

    const topRegions = regionResult
        .filter((r) => r.region !== null)
        .map((row) => ({
            region: row.region!,
            country: row.country || "",
            clicks: row.clicks,
        }));

    // Device types (mobile/tablet/desktop)
    const deviceTypeResult = await db
        .select({
            type: linkClicks.device,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.device)
        .orderBy(desc(count()));

    const deviceTypes = deviceTypeResult
        .filter((r) => r.type !== null)
        .map((row) => ({
            type: row.type!,
            clicks: row.clicks,
        }));

    // Device models
    const deviceModelResult = await db
        .select({
            device: linkClicks.device,
            model: linkClicks.deviceModel,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.device, linkClicks.deviceModel)
        .orderBy(desc(count()))
        .limit(15);

    const devices = deviceModelResult
        .filter((r) => r.device !== null)
        .map((row) => ({
            device: row.device!,
            model: row.model || "unknown",
            clicks: row.clicks,
        }));

    // Browsers with version
    const browserResult = await db
        .select({
            browser: linkClicks.browser,
            version: linkClicks.browserVersion,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.browser, linkClicks.browserVersion)
        .orderBy(desc(count()))
        .limit(15);

    const browsers = browserResult
        .filter((r) => r.browser !== null)
        .map((row) => ({
            browser: row.browser!,
            version: row.version || "unknown",
            clicks: row.clicks,
        }));

    // Operating systems with version
    const osResult = await db
        .select({
            os: linkClicks.os,
            version: linkClicks.osVersion,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.os, linkClicks.osVersion)
        .orderBy(desc(count()))
        .limit(15);

    const operatingSystems = osResult
        .filter((r) => r.os !== null)
        .map((row) => ({
            os: row.os!,
            version: row.version || "unknown",
            clicks: row.clicks,
        }));

    // Languages
    const languageResult = await db
        .select({
            language: linkClicks.language,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.language)
        .orderBy(desc(count()))
        .limit(10);

    const languages = languageResult
        .filter((r) => r.language !== null && r.language !== "")
        .map((row) => ({
            language: row.language!,
            clicks: row.clicks,
        }));

    // Timezones
    const timezoneResult = await db
        .select({
            timezone: linkClicks.timezone,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.timezone)
        .orderBy(desc(count()))
        .limit(10);

    const timezones = timezoneResult
        .filter((r) => r.timezone !== null && r.timezone !== "")
        .map((row) => ({
            timezone: row.timezone!,
            clicks: row.clicks,
        }));

    // Referrers with unique visitors
    const referrerResult = await db
        .select({
            referrer: linkClicks.referrer,
            clicks: count(),
            uniqueVisitors: sql<number>`count(distinct ${linkClicks.fingerprint})`,
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
            uniqueVisitors: row.uniqueVisitors,
        }));

    // Map data for heatmap
    const mapResult = await db
        .select({
            country: linkClicks.country,
            clicks: count(),
        })
        .from(linkClicks)
        .where(whereClause)
        .groupBy(linkClicks.country)
        .orderBy(desc(count()));

    const mapData = mapResult
        .filter((r) => r.country !== null)
        .map((row) => {
            const coords = getCountryCoords(row.country!);
            return {
                country: row.country!,
                clicks: row.clicks,
                lat: coords.lat,
                lng: coords.lng,
            };
        });

    // Recent clicks
    const recentResult = await db
        .select({
            ip: linkClicks.ip,
            country: linkClicks.country,
            city: linkClicks.city,
            region: linkClicks.region,
            device: linkClicks.device,
            deviceModel: linkClicks.deviceModel,
            browser: linkClicks.browser,
            os: linkClicks.os,
            language: linkClicks.language,
            referrer: linkClicks.referrer,
            clickedAt: linkClicks.clickedAt,
        })
        .from(linkClicks)
        .where(whereClause)
        .orderBy(desc(linkClicks.clickedAt))
        .limit(50);

    return {
        totalClicks,
        uniqueVisitors,
        clicksToday,
        clicksThisWeek,
        clicksOverTime,
        topCountries,
        topCities,
        topRegions,
        deviceTypes,
        devices,
        browsers,
        operatingSystems,
        languages,
        timezones,
        referrers,
        mapData,
        recentClicks: recentResult,
    };
}

export interface DashboardAnalytics {
    totalLinks: number;
    totalClicks: number;
    uniqueVisitors: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksOverTime: { date: string; clicks: number; uniqueVisitors: number }[];
    topLinks: { id: string; slug: string; title: string | null; clicks: number; createdAt: Date }[];
    deviceTypes: { type: string; clicks: number }[];
    topCountries: { country: string; clicks: number }[];
    browsers: { browser: string; clicks: number }[];
    recentClicks: { slug: string; country: string | null; device: string | null; browser: string | null; clickedAt: Date }[];
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
    // Total links
    const linksResult = await db
        .select({ count: count() })
        .from(shortLinks)
        .where(eq(shortLinks.userId, userId));
    const totalLinks = linksResult[0]?.count ?? 0;

    // Get all link IDs for this user
    const userLinks = await db
        .select({ id: shortLinks.id, slug: shortLinks.slug, title: shortLinks.title, clickCount: shortLinks.clickCount, createdAt: shortLinks.createdAt })
        .from(shortLinks)
        .where(eq(shortLinks.userId, userId))
        .orderBy(desc(shortLinks.clickCount))
        .limit(5);

    const linkIds = userLinks.map((l) => l.id);

    if (linkIds.length === 0) {
        return {
            totalLinks: 0,
            totalClicks: 0,
            uniqueVisitors: 0,
            clicksToday: 0,
            clicksThisWeek: 0,
            clicksOverTime: [],
            topLinks: [],
            deviceTypes: [],
            topCountries: [],
            browsers: [],
            recentClicks: [],
        };
    }

    const linkIdCondition = inArray(linkClicks.linkId, linkIds);

    // Total clicks across all links
    const totalClicksResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(linkIdCondition);
    const totalClicks = totalClicksResult[0]?.count ?? 0;

    // Unique visitors
    const uniqueResult = await db
        .select({ count: sql<number>`count(distinct ${linkClicks.fingerprint})` })
        .from(linkClicks)
        .where(linkIdCondition);
    const uniqueVisitors = uniqueResult[0]?.count ?? 0;

    // Clicks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(and(linkIdCondition, gte(linkClicks.clickedAt, today)));
    const clicksToday = todayResult[0]?.count ?? 0;

    // Clicks this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekResult = await db
        .select({ count: count() })
        .from(linkClicks)
        .where(and(linkIdCondition, gte(linkClicks.clickedAt, weekAgo)));
    const clicksThisWeek = weekResult[0]?.count ?? 0;

    // Clicks over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timeResult = await db
        .select({
            date: sql<string>`date(${linkClicks.clickedAt})`,
            clicks: count(),
            uniqueVisitors: sql<number>`count(distinct ${linkClicks.fingerprint})`,
        })
        .from(linkClicks)
        .where(and(linkIdCondition, gte(linkClicks.clickedAt, thirtyDaysAgo)))
        .groupBy(sql`date(${linkClicks.clickedAt})`)
        .orderBy(sql`date(${linkClicks.clickedAt})`);

    const clicksOverTime = timeResult.map((row) => ({
        date: row.date,
        clicks: row.clicks,
        uniqueVisitors: row.uniqueVisitors,
    }));

    // Device types
    const deviceResult = await db
        .select({
            type: linkClicks.device,
            clicks: count(),
        })
        .from(linkClicks)
        .where(linkIdCondition)
        .groupBy(linkClicks.device)
        .orderBy(desc(count()));

    const deviceTypes = deviceResult
        .filter((r) => r.type !== null)
        .map((row) => ({ type: row.type!, clicks: row.clicks }));

    // Top countries
    const countryResult = await db
        .select({
            country: linkClicks.country,
            clicks: count(),
        })
        .from(linkClicks)
        .where(linkIdCondition)
        .groupBy(linkClicks.country)
        .orderBy(desc(count()))
        .limit(5);

    const topCountries = countryResult
        .filter((r) => r.country !== null)
        .map((row) => ({ country: row.country!, clicks: row.clicks }));

    // Browsers
    const browserResult = await db
        .select({
            browser: linkClicks.browser,
            clicks: count(),
        })
        .from(linkClicks)
        .where(linkIdCondition)
        .groupBy(linkClicks.browser)
        .orderBy(desc(count()))
        .limit(5);

    const browsers = browserResult
        .filter((r) => r.browser !== null)
        .map((row) => ({ browser: row.browser!, clicks: row.clicks }));

    // Recent clicks with slug
    const recentResult = await db
        .select({
            slug: shortLinks.slug,
            country: linkClicks.country,
            device: linkClicks.device,
            browser: linkClicks.browser,
            clickedAt: linkClicks.clickedAt,
        })
        .from(linkClicks)
        .innerJoin(shortLinks, eq(linkClicks.linkId, shortLinks.id))
        .where(linkIdCondition)
        .orderBy(desc(linkClicks.clickedAt))
        .limit(10);

    return {
        totalLinks,
        totalClicks,
        uniqueVisitors,
        clicksToday,
        clicksThisWeek,
        clicksOverTime,
        topLinks: userLinks.map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            clicks: l.clickCount,
            createdAt: l.createdAt,
        })),
        deviceTypes,
        topCountries,
        browsers,
        recentClicks: recentResult,
    };
}
