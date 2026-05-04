import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/db";
import { customDomains } from "@/db/schema";
import { success, error, unauthorized } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

const domainSchema = z.object({
    domain: z
        .string()
        .min(3, "Domain is too short")
        .max(253, "Domain is too long")
        .regex(
            /^[a-zA-Z0-9][a-zA-Z0-9-]{0,62}(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,62})+$/,
            "Invalid domain format"
        ),
});

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const domains = await db
            .select()
            .from(customDomains)
            .where(eq(customDomains.userId, session.user.id))
            .orderBy(desc(customDomains.createdAt));

        return success({ domains });
    });
}

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return error("VALIDATION_ERROR", "Invalid JSON body", 400);
        }

        const parsed = domainSchema.safeParse(body);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            return error("VALIDATION_ERROR", messages.join(", "), 400);
        }

        const { domain } = parsed.data;
        const normalizedDomain = domain.toLowerCase().trim();

        // Check if domain already exists
        const existing = await db
            .select()
            .from(customDomains)
            .where(eq(customDomains.domain, normalizedDomain))
            .limit(1);

        if (existing.length > 0) {
            return error("DOMAIN_ALREADY_EXISTS", "Domain already registered", 409);
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const [record] = await db
            .insert(customDomains)
            .values({
                userId: session.user.id,
                domain: normalizedDomain,
                verificationToken,
            })
            .returning();

        return success({
            domain: {
                id: record.id,
                domain: record.domain,
                verificationToken: record.verificationToken,
                isVerified: record.isVerified,
                isActive: record.isActive,
                createdAt: record.createdAt,
            },
        });
    });
}
