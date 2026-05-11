import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { success, unauthorized, error } from "@/lib/api-response";
import { withRateLimit } from "@/lib/api-guard";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    return withRateLimit(req, apiRateLimit, async () => {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({ headers: requestHeaders });

        if (!session) {
            return unauthorized();
        }

        try {
            const formData = await req.formData();
            const file = formData.get("file") as File;

            if (!file) {
                return error("VALIDATION_ERROR", "No file provided");
            }

            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
            if (!allowedTypes.includes(file.type)) {
                return error("VALIDATION_ERROR", "Invalid file type. Allowed: JPG, PNG, WebP, MP4");
            }

            // Validate file size (50MB max)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                return error("VALIDATION_ERROR", "File too large. Max 50MB");
            }

            const blob = await put(`uploads/${session.user.id}/${Date.now()}-${file.name}`, file, {
                access: "public",
            });

            return success({
                url: blob.url,
                filename: file.name,
                size: file.size,
                mimeType: file.type,
            });
        } catch (err) {
            console.error("[upload] error:", err);
            return error("INTERNAL_ERROR", "Upload failed");
        }
    });
}
