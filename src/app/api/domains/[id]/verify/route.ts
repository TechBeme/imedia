import { NextRequest } from "next/server";
import dns from "dns";
import { promisify } from "util";
import { db } from "@/db";
import { customDomains } from "@/db/schema";
import { success, error, unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

const resolveTxt = promisify(dns.resolveTxt);

async function checkDnsTxt(domain: string, token: string): Promise<boolean> {
    try {
        const records = await resolveTxt(domain);
        const expected = `somedia-verify=${token}`;
        for (const record of records) {
            const txt = Array.isArray(record) ? record.join("") : record;
            if (txt.includes(expected)) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

async function checkDnsViaDoH(domain: string, token: string): Promise<boolean> {
    try {
        const res = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`,
            {
                headers: { Accept: "application/dns-json" },
                cache: "no-store",
            }
        );
        if (!res.ok) return false;
        const data = (await res.json()) as {
            Answer?: Array<{ data: string }>;
        };
        const expected = `somedia-verify=${token}`;
        for (const ans of data.Answer || []) {
            // DNS JSON responses often wrap TXT data in quotes
            const txt = ans.data.replace(/^"|"$/g, "").replace(/" "/g, "");
            if (txt.includes(expected)) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

async function getOwnedDomain(domainId: string, userId: string) {
    const results = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, domainId), eq(customDomains.userId, userId)))
        .limit(1);
    return results[0] || null;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { id } = await params;
        const domain = await getOwnedDomain(id, session.user.id);
        if (!domain) {
            return notFound();
        }

        // Try Node.js DNS first, then Cloudflare DoH fallback
        let verified = await checkDnsTxt(domain.domain, domain.verificationToken);
        if (!verified) {
            verified = await checkDnsViaDoH(domain.domain, domain.verificationToken);
        }

        if (!verified) {
            return error(
                "DOMAIN_VERIFICATION_FAILED",
                "TXT record not found. Ensure you added the DNS TXT record and wait for propagation.",
                400
            );
        }

        const [updated] = await db
            .update(customDomains)
            .set({ isVerified: true, updatedAt: new Date() })
            .where(eq(customDomains.id, id))
            .returning();

        return success({ domain: updated });
    });
}
