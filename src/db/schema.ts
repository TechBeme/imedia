import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    uuid,
    index,
} from "drizzle-orm/pg-core";

// Better Auth tables
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

// Domain tables
export const socialAccounts = pgTable(
    "social_accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        platform: text("platform").notNull(), // instagram, facebook, threads, youtube, tiktok, x
        providerAccountId: text("provider_account_id").notNull(),
        username: text("username"),
        displayName: text("display_name"),
        profilePicture: text("profile_picture"),
        accessToken: text("access_token"), // encrypted
        refreshToken: text("refresh_token"), // encrypted
        expiresAt: timestamp("expires_at"),
        metadata: jsonb("metadata"), // follower_count, etc.
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("social_accounts_user_idx").on(table.userId),
        index("social_accounts_platform_idx").on(table.platform),
    ]
);

export const mediaAssets = pgTable(
    "media_assets",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        filename: text("filename").notNull(),
        url: text("url").notNull(),
        mimeType: text("mime_type").notNull(),
        size: integer("size"),
        dimensions: jsonb("dimensions"), // { width, height }
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [index("media_assets_user_idx").on(table.userId)]
);

export const posts = pgTable(
    "posts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        mediaUrls: text("media_urls").array(),
        platforms: text("platforms").array().notNull(), // ["instagram", "facebook"]
        status: text("status").notNull().default("draft"), // draft, scheduled, published, failed
        publishedAt: timestamp("published_at"),
        externalIds: jsonb("external_ids"), // { instagram: "123", facebook: "456" }
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [index("posts_user_idx").on(table.userId)]
);

export const scheduledPosts = pgTable(
    "scheduled_posts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
        platform: text("platform").notNull(),
        content: text("content").notNull(),
        mediaUrls: text("media_urls").array(),
        scheduledAt: timestamp("scheduled_at").notNull(),
        status: text("status").notNull().default("pending"), // pending, published, failed, cancelled
        errorMessage: text("error_message"),
        executedAt: timestamp("executed_at"),
        externalPostId: text("external_post_id"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("scheduled_posts_user_idx").on(table.userId),
        index("scheduled_posts_status_idx").on(table.status),
        index("scheduled_posts_scheduled_at_idx").on(table.scheduledAt),
    ]
);

export const platformPosts = pgTable(
    "platform_posts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        postId: uuid("post_id")
            .notNull()
            .references(() => posts.id, { onDelete: "cascade" }),
        platform: text("platform").notNull(),
        externalId: text("external_id").notNull(),
        permalink: text("permalink"),
        metrics: jsonb("metrics"), // { likes, comments, shares, views }
        fetchedAt: timestamp("fetched_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("platform_posts_post_idx").on(table.postId),
        index("platform_posts_platform_idx").on(table.platform),
    ]
);

// Webhook events for idempotency and audit trail
// Stores all received webhook events to prevent duplicate processing
export const webhookEvents = pgTable(
    "webhook_events",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        eventId: text("event_id").notNull().unique(), // Platform event ID (Stripe: evt_xxx, Meta: id from payload)
        platform: text("platform").notNull(), // stripe, instagram, youtube, tiktok, x, facebook
        eventType: text("event_type").notNull(), // checkout.completed, message.received, etc.
        payload: jsonb("payload").notNull(), // Full event payload
        status: text("status").notNull().default("pending"), // pending, processing, completed, failed, skipped
        processedAt: timestamp("processed_at"),
        errorMessage: text("error_message"),
        retryCount: integer("retry_count").notNull().default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("webhook_events_event_id_idx").on(table.eventId),
        index("webhook_events_platform_idx").on(table.platform),
        index("webhook_events_status_idx").on(table.status),
        index("webhook_events_created_at_idx").on(table.createdAt),
    ]
);

// Per-user platform API credentials (App ID / Client ID + Secret)
// Each user configures their own developer app credentials per platform
export const platformCredentials = pgTable(
    "platform_credentials",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        platform: text("platform").notNull(), // instagram, youtube, tiktok, x, facebook, threads
        appId: text("app_id").notNull(), // Client ID / App ID (encrypted)
        appSecret: text("app_secret").notNull(), // Client Secret / App Secret (encrypted)
        redirectUri: text("redirect_uri"), // Optional override per platform
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("platform_credentials_user_idx").on(table.userId),
        index("platform_credentials_platform_idx").on(table.platform),
        index("platform_credentials_user_platform_idx").on(table.userId, table.platform),
    ]
);

// Link shortener tables
export const shortLinks = pgTable(
    "short_links",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        originalUrl: text("original_url").notNull(),
        slug: text("slug").notNull().unique(),
        customSlug: boolean("custom_slug").notNull().default(false),
        domain: text("domain").notNull().default(""),
        title: text("title"),
        description: text("description"),
        ogTitle: text("og_title"),
        ogDescription: text("og_description"),
        ogImageUrl: text("og_image_url"),
        password: text("password"),
        tags: text("tags").array(),
        folderId: uuid("folder_id"),
        startsAt: timestamp("starts_at"),
        expiresAt: timestamp("expires_at"),
        maxClicks: integer("max_clicks"),
        expiredRedirectUrl: text("expired_redirect_url"),
        isActive: boolean("is_active").notNull().default(true),
        clickCount: integer("click_count").notNull().default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("short_links_slug_idx").on(table.slug),
        index("short_links_user_idx").on(table.userId),
        index("short_links_domain_idx").on(table.domain),
        index("short_links_active_idx").on(table.isActive),
        index("short_links_folder_idx").on(table.folderId),
    ]
);

export const linkDeviceRules = pgTable(
    "link_device_rules",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        linkId: uuid("link_id")
            .notNull()
            .references(() => shortLinks.id, { onDelete: "cascade" }),
        os: text("os").notNull(), // android, ios, windows, macos, linux, other
        url: text("url").notNull(),
        priority: integer("priority").notNull().default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("link_device_rules_link_idx").on(table.linkId),
        index("link_device_rules_os_idx").on(table.os),
    ]
);

export const linkClicks = pgTable(
    "link_clicks",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        linkId: uuid("link_id")
            .notNull()
            .references(() => shortLinks.id, { onDelete: "cascade" }),
        ip: text("ip"),
        country: text("country"),
        city: text("city"),
        region: text("region"),
        userAgent: text("user_agent"),
        device: text("device"),
        deviceModel: text("device_model"),
        browser: text("browser"),
        browserVersion: text("browser_version"),
        os: text("os"),
        osVersion: text("os_version"),
        language: text("language"),
        timezone: text("timezone"),
        referrer: text("referrer"),
        fingerprint: text("fingerprint"),
        clickedAt: timestamp("clicked_at").notNull().defaultNow(),
    },
    (table) => [
        index("link_clicks_link_idx").on(table.linkId),
        index("link_clicks_clicked_at_idx").on(table.clickedAt),
        index("link_clicks_country_idx").on(table.country),
        index("link_clicks_fingerprint_idx").on(table.fingerprint),
    ]
);

export const linkFolders = pgTable(
    "link_folders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        color: text("color").notNull().default("#3b82f6"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("link_folders_user_idx").on(table.userId),
    ]
);

export const linkTags = pgTable(
    "link_tags",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        color: text("color").notNull().default("#8b5cf6"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("link_tags_user_idx").on(table.userId),
        index("link_tags_name_idx").on(table.name),
    ]
);

export const shortLinkTags = pgTable(
    "short_link_tags",
    {
        linkId: uuid("link_id")
            .notNull()
            .references(() => shortLinks.id, { onDelete: "cascade" }),
        tagId: uuid("tag_id")
            .notNull()
            .references(() => linkTags.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("short_link_tags_link_idx").on(table.linkId),
        index("short_link_tags_tag_idx").on(table.tagId),
    ]
);

export const userSettings = pgTable(
    "user_settings",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: "cascade" }),
        defaultExpiredRedirectUrl: text("default_expired_redirect_url"),
        notFoundRedirectUrl: text("not_found_redirect_url"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [index("user_settings_user_idx").on(table.userId)]
);

export const customDomains = pgTable(
    "custom_domains",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        domain: text("domain").notNull().unique(),
        verificationToken: text("verification_token").notNull(),
        isVerified: boolean("is_verified").notNull().default(false),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("custom_domains_user_idx").on(table.userId),
        index("custom_domains_domain_idx").on(table.domain),
    ]
);

// Automation tables
export const automations = pgTable(
    "automations",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        socialAccountId: uuid("social_account_id")
            .notNull()
            .references(() => socialAccounts.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        platform: text("platform").notNull(),
        triggerType: text("trigger_type").notNull().default("comment_keyword"),
        triggerConfig: jsonb("trigger_config").notNull(),
        scope: jsonb("scope").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("automations_user_idx").on(table.userId),
        index("automations_social_account_idx").on(table.socialAccountId),
        index("automations_platform_idx").on(table.platform),
        index("automations_is_active_idx").on(table.isActive),
    ]
);

export const automationActions = pgTable(
    "automation_actions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        automationId: uuid("automation_id")
            .notNull()
            .references(() => automations.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        config: jsonb("config").notNull(),
        order: integer("order").notNull().default(0),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("automation_actions_automation_idx").on(table.automationId),
    ]
);

export const automationLogs = pgTable(
    "automation_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        automationId: uuid("automation_id")
            .notNull()
            .references(() => automations.id, { onDelete: "cascade" }),
        triggerEvent: jsonb("trigger_event").notNull(),
        actionResults: jsonb("action_results").notNull(),
        status: text("status").notNull(),
        executedAt: timestamp("executed_at").notNull().defaultNow(),
    },
    (table) => [
        index("automation_logs_automation_idx").on(table.automationId),
        index("automation_logs_status_idx").on(table.status),
        index("automation_logs_executed_at_idx").on(table.executedAt),
    ]
);

export const commentWatchState = pgTable(
    "comment_watch_state",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        socialAccountId: uuid("social_account_id")
            .notNull()
            .references(() => socialAccounts.id, { onDelete: "cascade" }),
        postId: text("post_id").notNull(),
        lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
        lastCommentId: text("last_comment_id"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("comment_watch_state_social_account_idx").on(table.socialAccountId),
        index("comment_watch_state_post_idx").on(table.postId),
    ]
);
