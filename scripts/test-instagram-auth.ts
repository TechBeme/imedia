#!/usr/bin/env tsx
/**
 * Test script for Instagram OAuth auth endpoint.
 * Usage:
 *   npx tsx scripts/test-instagram-auth.ts [BASE_URL]
 *
 * Example:
 *   npx tsx scripts/test-instagram-auth.ts https://somedia.techbe.me
 */

const BASE_URL = process.argv[2] || "https://somedia.techbe.me";

async function testAuthEndpoint() {
    console.log(`\n🧪 Testing Instagram Auth Endpoint`);
    console.log(`   URL: ${BASE_URL}/api/instagram/auth\n`);

    try {
        const res = await fetch(`${BASE_URL}/api/instagram/auth`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
        });

        console.log(`   Status: ${res.status} ${res.statusText}`);

        const body = await res.json();
        console.log(`   Response body:`);
        console.log(JSON.stringify(body, null, 4));

        // Validate response shape
        const checks: { name: string; pass: boolean; detail?: string }[] = [];

        checks.push({
            name: "Response has 'data' property",
            pass: body.hasOwnProperty("data"),
            detail: body.hasOwnProperty("data") ? undefined : "Missing 'data' key",
        });

        checks.push({
            name: "data.url is a string",
            pass: typeof body.data?.url === "string",
            detail: typeof body.data?.url === "string" ? undefined : `Got: ${typeof body.data?.url}`,
        });

        let urlObj: URL | null = null;
        if (typeof body.data?.url === "string") {
            try {
                urlObj = new URL(body.data.url);
                checks.push({ name: "URL is valid", pass: true });
            } catch {
                checks.push({ name: "URL is valid", pass: false, detail: "Invalid URL format" });
            }
        }

        if (urlObj) {
            checks.push({
                name: "URL hostname is instagram.com",
                pass: urlObj.hostname === "www.instagram.com",
                detail: urlObj.hostname,
            });
            checks.push({
                name: "URL path is /oauth/authorize",
                pass: urlObj.pathname === "/oauth/authorize",
                detail: urlObj.pathname,
            });
            checks.push({
                name: "Has client_id parameter",
                pass: urlObj.searchParams.has("client_id"),
            });
            checks.push({
                name: "Has redirect_uri parameter",
                pass: urlObj.searchParams.has("redirect_uri"),
                detail: urlObj.searchParams.get("redirect_uri") || undefined,
            });
            checks.push({
                name: "Has scope parameter",
                pass: urlObj.searchParams.has("scope"),
            });
            checks.push({
                name: "Has state parameter",
                pass: urlObj.searchParams.has("state"),
            });
            checks.push({
                name: "Has response_type=code",
                pass: urlObj.searchParams.get("response_type") === "code",
                detail: urlObj.searchParams.get("response_type") || undefined,
            });
        }

        console.log(`\n   Validation Results:`);
        let allPassed = true;
        for (const check of checks) {
            const icon = check.pass ? "✅" : "❌";
            const detail = check.detail ? ` (${check.detail})` : "";
            console.log(`   ${icon} ${check.name}${detail}`);
            if (!check.pass) allPassed = false;
        }

        if (allPassed && urlObj) {
            console.log(`\n✅ ALL CHECKS PASSED`);
            console.log(`\n🔗 Generated URL:`);
            console.log(`   ${urlObj.toString()}`);
            console.log(`\n👉 Copy this URL and paste it in your browser to test manually.`);
        } else {
            console.log(`\n❌ SOME CHECKS FAILED`);
            process.exit(1);
        }
    } catch (err) {
        console.error(`\n❌ Request failed:`, err);
        process.exit(1);
    }
}

testAuthEndpoint();
