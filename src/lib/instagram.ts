/**
 * Instagram Graph API publishing utilities
 * Uses graph.instagram.com for Business/Creator accounts
 */

const GRAPH_API_BASE = "https://graph.instagram.com";
const API_VERSION = "v22.0";

interface PublishImageOptions {
    accessToken: string;
    igUserId: string;
    caption: string;
    imageUrl: string;
}

interface PublishCarouselOptions {
    accessToken: string;
    igUserId: string;
    caption: string;
    imageUrls: string[];
}

interface PublishReelOptions {
    accessToken: string;
    igUserId: string;
    caption: string;
    videoUrl: string;
    coverUrl?: string;
}

interface PublishStoryOptions {
    accessToken: string;
    igUserId: string;
    imageUrl: string;
}

interface ContainerResponse {
    id: string;
}

interface PublishResponse {
    id: string;
}

/**
 * Publish a single image to Instagram feed
 */
export async function publishImage({
    accessToken,
    igUserId,
    caption,
    imageUrl,
}: PublishImageOptions): Promise<PublishResponse> {
    // Step 1: Create media container
    const containerUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media`);
    containerUrl.searchParams.set("image_url", imageUrl);
    containerUrl.searchParams.set("caption", caption);
    containerUrl.searchParams.set("access_token", accessToken);

    const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
    const containerData = await containerRes.json();

    if (containerData.error) {
        throw new Error(`Container creation failed: ${containerData.error.message}`);
    }

    const creationId = containerData.id;

    // Step 2: Publish the container
    const publishUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", creationId);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();

    if (publishData.error) {
        throw new Error(`Publish failed: ${publishData.error.message}`);
    }

    return { id: publishData.id };
}

/**
 * Publish a carousel (multiple images) to Instagram feed
 */
export async function publishCarousel({
    accessToken,
    igUserId,
    caption,
    imageUrls,
}: PublishCarouselOptions): Promise<PublishResponse> {
    if (imageUrls.length < 2 || imageUrls.length > 10) {
        throw new Error("Carousel must have between 2 and 10 images");
    }

    // Step 1: Create item containers for each image
    const itemIds: string[] = [];
    for (const imageUrl of imageUrls) {
        const containerUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media`);
        containerUrl.searchParams.set("image_url", imageUrl);
        containerUrl.searchParams.set("is_carousel_item", "true");
        containerUrl.searchParams.set("access_token", accessToken);

        const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
        const containerData = await containerRes.json();

        if (containerData.error) {
            throw new Error(`Carousel item creation failed: ${containerData.error.message}`);
        }

        itemIds.push(containerData.id);
    }

    // Step 2: Create carousel container
    const carouselUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media`);
    carouselUrl.searchParams.set("media_type", "CAROUSEL");
    carouselUrl.searchParams.set("caption", caption);
    carouselUrl.searchParams.set("children", itemIds.join(","));
    carouselUrl.searchParams.set("access_token", accessToken);

    const carouselRes = await fetch(carouselUrl.toString(), { method: "POST" });
    const carouselData = await carouselRes.json();

    if (carouselData.error) {
        throw new Error(`Carousel container creation failed: ${carouselData.error.message}`);
    }

    // Step 3: Publish the carousel
    const publishUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", carouselData.id);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();

    if (publishData.error) {
        throw new Error(`Carousel publish failed: ${publishData.error.message}`);
    }

    return { id: publishData.id };
}

/**
 * Publish a Reel to Instagram
 */
export async function publishReel({
    accessToken,
    igUserId,
    caption,
    videoUrl,
    coverUrl,
}: PublishReelOptions): Promise<PublishResponse> {
    // Step 1: Create reel container
    const containerUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media`);
    containerUrl.searchParams.set("media_type", "REELS");
    containerUrl.searchParams.set("video_url", videoUrl);
    containerUrl.searchParams.set("caption", caption);
    if (coverUrl) {
        containerUrl.searchParams.set("cover_url", coverUrl);
    }
    containerUrl.searchParams.set("share_to_feed", "true");
    containerUrl.searchParams.set("access_token", accessToken);

    const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
    const containerData = await containerRes.json();

    if (containerData.error) {
        throw new Error(`Reel container creation failed: ${containerData.error.message}`);
    }

    // Step 2: Publish the reel
    const publishUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", containerData.id);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();

    if (publishData.error) {
        throw new Error(`Reel publish failed: ${publishData.error.message}`);
    }

    return { id: publishData.id };
}

/**
 * Publish a Story to Instagram
 */
export async function publishStory({
    accessToken,
    igUserId,
    imageUrl,
}: PublishStoryOptions): Promise<PublishResponse> {
    // Step 1: Create story container
    const containerUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media`);
    containerUrl.searchParams.set("media_type", "STORIES");
    containerUrl.searchParams.set("image_url", imageUrl);
    containerUrl.searchParams.set("access_token", accessToken);

    const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
    const containerData = await containerRes.json();

    if (containerData.error) {
        throw new Error(`Story container creation failed: ${containerData.error.message}`);
    }

    // Step 2: Publish the story
    const publishUrl = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", containerData.id);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();

    if (publishData.error) {
        throw new Error(`Story publish failed: ${publishData.error.message}`);
    }

    return { id: publishData.id };
}

/**
 * Check the status of a media container
 */
export async function checkContainerStatus(
    containerId: string,
    accessToken: string
): Promise<{ status: string; status_code?: string }> {
    const url = new URL(`${GRAPH_API_BASE}/${API_VERSION}/${containerId}`);
    url.searchParams.set("fields", "status,status_code");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
        throw new Error(`Status check failed: ${data.error.message}`);
    }

    return {
        status: data.status,
        status_code: data.status_code,
    };
}
