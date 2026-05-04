import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/db";
import { shortLinks } from "@/db/schema";
import { unauthorized, notFound } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(req, apiRateLimit, async () => {
        const session = await getSession();
        if (!session) {
            return unauthorized();
        }

        const { id } = await params;

        // Verify ownership
        const links = await db
            .select()
            .from(shortLinks)
            .where(and(eq(shortLinks.id, id), eq(shortLinks.userId, session.user.id)))
            .limit(1);

        if (links.length === 0) {
            return notFound();
        }

        const link = links[0];
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format") || "png";
        const sizeParam = searchParams.get("size");
        const size = Math.min(Math.max(parseInt(sizeParam || "256", 10), 64), 2048);

        const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${link.slug}`;

        if (format === "svg") {
            const svg = await QRCode.toString(url, {
                type: "svg",
                width: size,
                margin: 2,
            });
            return new NextResponse(svg, {
                headers: {
                    "Content-Type": "image/svg+xml",
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // Default PNG
        const buffer = await QRCode.toBuffer(url, {
            type: "png",
            width: size,
            margin: 2,
        });
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600",
            },
        });
    });
}
