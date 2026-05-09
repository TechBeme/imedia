import { NextRequest } from "next/server";
import { getDashboardAnalytics } from "@/lib/link-analytics";
import { getSession } from "@/lib/session";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        try {
            const session = await getSession();
            if (!session?.user?.id) {
                return unauthorized();
            }

            const analytics = await getDashboardAnalytics(session.user.id);
            return success(analytics);
        } catch {
            return internalError("Failed to fetch dashboard analytics");
        }
    });
}
