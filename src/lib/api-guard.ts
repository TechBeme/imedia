import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { checkRateLimit } from "@/lib/rate-limit";
import { error } from "@/lib/api-response";

export async function withRateLimit(
    req: NextRequest,
    limiter: Ratelimit,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    const result = await checkRateLimit(ip, limiter);

    if (!result.success) {
        return error("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429, {
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
        });
    }

    const response = await handler();

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));

    return response;
}
