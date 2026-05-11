/**
 * Test ALL possible fields on graph.instagram.com to see what's available
 * Usage: npx tsx scripts/test-all-fields.ts <access_token> [user_id]
 */

async function testAllFields(accessToken: string, userId?: string) {
    console.log("=== Testing ALL possible fields on graph.instagram.com ===\n");

    // If no userId provided, get it from /me
    if (!userId) {
        const meUrl = new URL("https://graph.instagram.com/me");
        meUrl.searchParams.set("fields", "user_id");
        meUrl.searchParams.set("access_token", accessToken);

        const meRes = await fetch(meUrl.toString());
        const meData = await meRes.json();
        userId = meData.data?.[0]?.user_id || meData.user_id || meData.id;

        if (!userId) {
            console.error("❌ Could not get user ID");
            console.log("Response:", JSON.stringify(meData, null, 2));
            return;
        }
        console.log(`User ID: ${userId}\n`);
    }

    // Test each field individually
    const fields = [
        "username",
        "account_type",
        "media_count",
        "biography",
        "followers_count",
        "follows_count",
        "profile_picture_url",
        "website",
        "name",
        "id",
    ];

    console.log("Testing individual fields on /{userId}:\n");

    for (const field of fields) {
        const url = new URL(`https://graph.instagram.com/${userId}`);
        url.searchParams.set("fields", field);
        url.searchParams.set("access_token", accessToken);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.error) {
            console.log(`❌ ${field}: ${data.error.message}`);
        } else if (data[field] !== undefined) {
            console.log(`✅ ${field}: ${data[field]}`);
        } else {
            console.log(`⚠️ ${field}: not returned`);
        }
    }

    // Test /me endpoint fields
    console.log("\n\nTesting fields on /me endpoint:\n");

    const meFields = [
        "user_id,username",
        "user_id,username,account_type",
        "user_id,username,account_type,media_count",
        "user_id,username,biography",
        "user_id,username,followers_count",
        "user_id,username,profile_picture_url",
    ];

    for (const fields of meFields) {
        const url = new URL("https://graph.instagram.com/me");
        url.searchParams.set("fields", fields);
        url.searchParams.set("access_token", accessToken);

        const res = await fetch(url.toString());
        const data = await res.json();

        console.log(`\nFields: ${fields}`);
        if (data.error) {
            console.log(`❌ Error: ${data.error.message}`);
        } else if (data.data) {
            console.log(`✅ Response: ${JSON.stringify(data.data[0])}`);
        } else {
            console.log(`Response: ${JSON.stringify(data)}`);
        }
    }

    // Test media endpoint
    console.log("\n\nTesting /media endpoint:\n");
    const mediaUrl = new URL(`https://graph.instagram.com/${userId}/media`);
    mediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count");
    mediaUrl.searchParams.set("limit", "2");
    mediaUrl.searchParams.set("access_token", accessToken);

    const mediaRes = await fetch(mediaUrl.toString());
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
        console.log(`❌ Error: ${mediaData.error.message}`);
    } else {
        console.log(`✅ Found ${mediaData.data?.length || 0} media items`);
        if (mediaData.data?.[0]) {
            console.log("First item fields:", Object.keys(mediaData.data[0]).join(", "));
        }
    }
}

const testAllFieldsToken = process.argv[2] || process.env.INSTAGRAM_TEST_TOKEN;
const testAllFieldsUserId = process.argv[3];

if (!testAllFieldsToken) {
    console.error("Usage: npx tsx scripts/test-all-fields.ts <access_token> [user_id]");
    process.exit(1);
}

testAllFields(testAllFieldsToken, testAllFieldsUserId).catch(console.error);
