import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { success, unauthorized, internalError } from "@/lib/api-response";
import { getSocialAccounts } from "@/lib/social-accounts";

export async function GET() {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
        return unauthorized();
    }

    try {
        const accounts = await getSocialAccounts(session.user.id, false);
        return success({ accounts });
    } catch (err) {
        console.error("[social-accounts GET] error:", err);
        return internalError("Failed to fetch social accounts");
    }
}
