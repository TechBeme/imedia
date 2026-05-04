---
last_mapped: 2026-05-04
---

# External Integrations

## Database

### Neon PostgreSQL
- **Connection:** `src/db/index.ts` via `@neondatabase/serverless`
- **URL:** `DATABASE_URL` environment variable
- **Dialect:** PostgreSQL via Drizzle ORM
- **Schema:** `src/db/schema.ts`

## Authentication

### better-auth
- **Config:** `src/lib/auth.ts`
- **Adapter:** Drizzle ORM (`drizzleAdapter`)
- **Providers:**
  - Email + Password (enabled, autoSignIn)
  - Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- **Session:** 7-day expiry, 1-day update age
- **API Route:** `src/app/api/auth/[...all]/route.ts` (catch-all handler)

### Session Management
- **Server-side:** `src/lib/session.ts` — `getSession()` using `auth.api.getSession()`
- **Client-side:** `src/lib/auth-client.ts` — `authClient.useSession()`, `signIn`, `signUp`, `signOut`

## Social Media APIs

### Instagram / Facebook Graph API
- **Auth Init:** `src/app/api/instagram/auth/route.ts`
  - OAuth flow via Facebook v18.0 dialog
  - Scopes: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
  - State param encodes `userId` + nonce
- **Callback:** `src/app/api/instagram/callback/route.ts`
  - Exchanges code for access token
  - Fetches Facebook pages, then Instagram Business Account
  - Stores account in `socialAccounts` table
- **Disconnect:** `src/app/api/instagram/disconnect/route.ts`
  - Deletes Instagram account row for current user
- **Env vars:** `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`

### Social Accounts API
- **Endpoint:** `src/app/api/social-accounts/route.ts`
- **Methods:** GET (list connected accounts for authenticated user)

## File Storage

### Vercel Blob
- **Package:** `@vercel/blob` v2.3.3
- **Status:** Listed in dependencies but no usage found in current codebase
- **Intended for:** Media asset uploads

## i18n

### next-intl
- **Config:** `src/lib/i18n.ts`
- **Routing:** `src/i18n/routing.ts`
- **Middleware:** `src/middleware.ts`
- **Locales:** `pt-BR` (default), `en`, `es`
- **Messages:** `messages/pt-BR.json`, `messages/en.json`, `messages/es.json`
- **Pattern:** Locale prefix always (`localePrefix: "always"`)

## Environment Variables (Required)

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Neon / Drizzle | PostgreSQL connection |
| `BETTER_AUTH_SECRET` | better-auth | Auth encryption |
| `BETTER_AUTH_URL` | better-auth | Auth base URL |
| `GOOGLE_CLIENT_ID` | better-auth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | better-auth | Google OAuth |
| `INSTAGRAM_APP_ID` | Instagram API | Facebook app ID |
| `INSTAGRAM_APP_SECRET` | Instagram API | Facebook app secret |
| `INSTAGRAM_REDIRECT_URI` | Instagram API | OAuth callback URL |
| `NEXT_PUBLIC_APP_URL` | auth-client | Client-side auth base URL |

## Planned but Not Yet Implemented

Per `AGENTS.md`, the following integrations are planned but not yet visible in code:
- **Stripe** — Payments and subscriptions
- **Vercel AI SDK** — AI chat/generation features
