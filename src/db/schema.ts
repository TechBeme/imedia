import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    serial,
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
