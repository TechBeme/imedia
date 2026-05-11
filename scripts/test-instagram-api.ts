/**
 * Script to test Instagram API endpoints
 * Usage: npx tsx scripts/test-instagram-api.ts <access_token>
 */

async function testInstagramAPI(accessToken: string) {
    console.log("=== Testing Instagram API ===\n");
    console.log("Token prefix:", accessToken.substring(0, 10) + "...");

    // 1. Test /me endpoint
    console.log("\n1. Testing /me endpoint...");
    const meUrl = new URL("https://graph.instagram.com/me");
    meUrl.searchParams.set("fields", "user_id,username,account_type,media_count");
    meUrl.searchParams.set("access_token", accessToken);

    console.log("URL:", meUrl.toString());
    const meRes = await fetch(meUrl.toString());
    const meData = await meRes.json();
    console.log("Response:", JSON.stringify(meData, null, 2));

    const userId = meData.data?.[0]?.user_id || meData.user_id || meData.id;
    const username = meData.data?.[0]?.username || meData.username;

    if (!userId) {
        console.error("❌ Failed to get user ID from /me endpoint");
        return;
    }

    console.log(`✅ User ID: ${userId}, Username: ${username}`);

    // 2. Test /{userId} endpoint
    console.log("\n2. Testing /{userId} endpoint...");
    const profileUrl = new URL(`https://graph.instagram.com/${userId}`);
    profileUrl.searchParams.set("fields", "username,account_type,media_count");
    profileUrl.searchParams.set("access_token", accessToken);

    console.log("URL:", profileUrl.toString());
    const profileRes = await fetch(profileUrl.toString());
    const profileData = await profileRes.json();
    console.log("Response:", JSON.stringify(profileData, null, 2));

    // 3. Test /{userId}/media endpoint
    console.log("\n3. Testing /{userId}/media endpoint...");
    const mediaUrl = new URL(`https://graph.instagram.com/${userId}/media`);
    mediaUrl.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
    mediaUrl.searchParams.set("limit", "5");
    mediaUrl.searchParams.set("access_token", accessToken);

    console.log("URL:", mediaUrl.toString());
    const mediaRes = await fetch(mediaUrl.toString());
    const mediaData = await mediaRes.json();
    console.log("Response:", JSON.stringify(mediaData, null, 2));

    if (mediaData.data && mediaData.data.length > 0) {
        console.log(`✅ Found ${mediaData.data.length} media items`);
    } else {
        console.log("⚠️ No media found or error occurred");
    }

    // 4. Test Facebook Graph API as fallback
    console.log("\n4. Testing Facebook Graph API /me endpoint...");
    const fbMeUrl = new URL("https://graph.facebook.com/v22.0/me");
    fbMeUrl.searchParams.set("fields", "id,name,instagram_business_account");
    fbMeUrl.searchParams.set("access_token", accessToken);

    console.log("URL:", fbMeUrl.toString());
    const fbMeRes = await fetch(fbMeUrl.toString());
    const fbMeData = await fbMeRes.json();
    console.log("Response:", JSON.stringify(fbMeData, null, 2));

    if (fbMeData.instagram_business_account) {
        console.log(`✅ Found Instagram Business Account: ${fbMeData.instagram_business_account.id}`);
    } else {
        console.log("ℹ️ No Instagram Business Account linked (this is normal for personal accounts)");
    }
}

// Get token from command line or environment
const testApiToken = process.argv[2] || process.env.INSTAGRAM_TEST_TOKEN;

if (!testApiToken) {
    console.error("Usage: npx tsx scripts/test-instagram-api.ts <access_token>");
    console.error("Or set INSTAGRAM_TEST_TOKEN environment variable");
    process.exit(1);
}

testInstagramAPI(testApiToken).catch(console.error);
