/**
 * Script to get Instagram token from database and test API
 * Usage: npx tsx scripts/get-token-and-test.ts
 */
import { db } from "../src/db";
import { socialAccounts } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "../src/lib/encryption";

async function getTokenAndTest() {
    console.log("=== Getting Instagram token from database ===\n");

    // Get Instagram account from database
    const accounts = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.platform, "instagram"))
        .limit(1);

    if (accounts.length === 0) {
        console.error("❌ No Instagram account found in database");
        console.log("Please connect your Instagram account first.");
        process.exit(1);
    }

    const account = accounts[0];
    console.log("Account found:");
    console.log("- ID:", account.id);
    console.log("- Username:", account.username);
    console.log("- Provider Account ID:", account.providerAccountId);
    console.log("- Has token:", !!account.accessToken);

    if (!account.accessToken) {
        console.error("❌ No access token found");
        process.exit(1);
    }

    // Decrypt token
    let accessToken: string;
    try {
        accessToken = decrypt(account.accessToken);
        console.log("- Token decrypted successfully");
    } catch (e) {
        console.log("- Decrypt failed, using raw token");
        accessToken = account.accessToken;
    }

    console.log("- Token prefix:", accessToken.substring(0, 10) + "...");

    // Now test the API
    console.log("\n=== Testing Instagram API ===\n");

    // 1. Test /me endpoint
    console.log("1. Testing /me endpoint...");
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

        // Try Facebook Graph API
        console.log("\n2. Trying Facebook Graph API /me...");
        const fbMeUrl = new URL("https://graph.facebook.com/v22.0/me");
        fbMeUrl.searchParams.set("fields", "id,name,instagram_business_account");
        fbMeUrl.searchParams.set("access_token", accessToken);

        console.log("URL:", fbMeUrl.toString());
        const fbMeRes = await fetch(fbMeUrl.toString());
        const fbMeData = await fbMeRes.json();
        console.log("Response:", JSON.stringify(fbMeData, null, 2));

        if (fbMeData.instagram_business_account) {
            const businessId = fbMeData.instagram_business_account.id;
            console.log(`✅ Found Instagram Business Account: ${businessId}`);

            // Test with business account
            console.log("\n3. Testing with Business Account ID...");
            const bizUrl = new URL(`https://graph.facebook.com/v22.0/${businessId}`);
            bizUrl.searchParams.set("fields", "username,name,profile_picture_url,biography,followers_count,follows_count,media_count");
            bizUrl.searchParams.set("access_token", accessToken);

            console.log("URL:", bizUrl.toString());
            const bizRes = await fetch(bizUrl.toString());
            const bizData = await bizRes.json();
            console.log("Response:", JSON.stringify(bizData, null, 2));
        }

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
}

getTokenAndTest().catch(console.error);
