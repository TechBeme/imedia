import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const RESERVED_SLUGS = new Set([
    "admin", "api", "login", "register", "dashboard", "settings", "profile",
    "logout", "auth", "webhook", "health", "ping", "robots", "sitemap",
    "favicon", "assets", "static", "public", "private", "www", "mail",
    "ftp", "smtp", "imap", "pop", "ns", "dns", "test", "dev", "staging",
    "prod", "production", "localhost", "root", "user", "users", "account",
    "accounts", "link", "links", "short", "url", "urls", "go", "to", "app",
    "home", "about", "contact", "help", "support", "terms", "privacy",
    "policy", "blog", "news", "feed", "rss", "atom", "search", "find",
    "create", "edit", "delete", "update", "new", "old", "temp", "tmp",
    "cache", "cdn", "img", "image", "images", "video", "videos", "media",
    "file", "files", "doc", "docs", "document", "documents", "download",
    "downloads", "upload", "uploads", "share", "shared", "embed", "iframe",
    "js", "css", "html", "json", "xml", "txt", "pdf", "zip", "rar",
    "exe", "bin", "sh", "bat", "cmd", "php", "asp", "aspx", "jsp",
    "cgi", "pl", "py", "rb", "java", "jar", "war", "ear", "sql",
    "db", "database", "data", "backup", "bak", "old", "orig", "copy",
    "clone", "fork", "mirror", "sync", "replicate", "replica", "slave",
    "master", "primary", "secondary", "tertiary", "quaternary",
]);

const ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateRandomSlug(length = 7): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
    }
    return result;
}

export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function validateCustomSlug(slug: string): { valid: boolean; error?: string } {
    if (!slug || slug.length < 3) {
        return { valid: false, error: "Slug must be at least 3 characters" };
    }
    if (slug.length > 50) {
        return { valid: false, error: "Slug must be at most 50 characters" };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return { valid: false, error: "Slug can only contain letters, numbers, hyphens, and underscores" };
    }
    if (isReservedSlug(slug)) {
        return { valid: false, error: "This slug is reserved" };
    }
    return { valid: true };
}

export async function isSlugAvailable(slug: string, domain = ""): Promise<boolean> {
    const existing = await db
        .select({ id: shortLinks.id })
        .from(shortLinks)
        .where(and(eq(shortLinks.slug, slug), eq(shortLinks.domain, domain)))
        .limit(1);
    return existing.length === 0;
}

export async function generateUniqueSlug(retries = 5): Promise<string> {
    for (let i = 0; i < retries; i++) {
        const slug = generateRandomSlug();
        if (await isSlugAvailable(slug)) {
            return slug;
        }
    }
    // Fallback: longer slug if collisions persist
    const slug = generateRandomSlug(10);
    if (await isSlugAvailable(slug)) {
        return slug;
    }
    throw new Error("Could not generate a unique slug after multiple attempts");
}
