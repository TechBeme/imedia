# Phase 1: Foundation & Auth Hardening — Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Source:** Brownfield codebase analysis + user requirements

## Phase Boundary

This phase secures the application foundation before any feature work begins. It delivers:
- Complete authentication flows (email/password, Google OAuth, password reset)
- Encrypted storage for social media access tokens (AES-256)
- Expanded database schema with all tables needed for future phases
- Complete i18n coverage (zero hardcoded strings)
- Standardized API error format (machine-readable codes)
- Input validation middleware for all API routes

**What this phase does NOT deliver:**
- Frontend dashboard pages (Phase 2)
- Social media publishing (Phase 3+)
- Media upload (Phase 4)
- Scheduling (Phase 5)

## Implementation Decisions

### Authentication
- **Locked:** Use better-auth for all auth flows (already configured)
- **Locked:** Password reset via email link using better-auth's built-in reset flow
- **Locked:** Rate limiting on auth endpoints using Upstash Redis or Vercel KV
- **Locked:** OAuth state parameter validation already present in Instagram callback; enforce same pattern for all future OAuth flows
- **Locked:** Server-side auth guard on dashboard routes via `getSession()` in layout.tsx

### Token Encryption
- **Locked:** AES-256-GCM encryption for social account tokens AND platform app credentials
- **Locked:** Encryption key from `SOCIAL_TOKEN_ENCRYPTION_KEY` env var
- **Locked:** Encrypt both `accessToken` and `refreshToken` in `socialAccounts` table
- **Locked:** Encrypt both `appId` and `appSecret` in `platformCredentials` table
- **Locked:** Decrypt on read, encrypt on write — transparent wrapper around DB queries

### Database Schema
- **Locked:** Use Drizzle ORM with existing Neon PostgreSQL setup
- **Locked:** Add `platformCredentials` table: userId, platform, appId (encrypted), appSecret (encrypted), redirectUri, isActive
- **Locked:** All new tables must have `createdAt`, `updatedAt`, indexes on foreign keys
- **Locked:** Use `uuid` primary keys with `defaultRandom()`
- **Locked:** Migrations via `drizzle-kit generate` + `drizzle-kit migrate`

### i18n
- **Locked:** next-intl with pt-BR (default), en, es
- **Locked:** All UI text must use `useTranslations()` or `getTranslations()`
- **Locked:** API errors return machine-readable codes (e.g., `AUTH_UNAUTHORIZED`, `RATE_LIMIT_EXCEEDED`)
- **Locked:** Frontend translates error codes using messages files

### API Foundation
- **Locked:** All API routes return `{ error?: { code: string, message?: string }, data?: T }`
- **Locked:** Zod schemas for all request bodies
- **Locked:** Centralized error handler middleware

### the agent's Discretion
- Choice of rate limiting library (Upstash vs Vercel KV vs custom)
- Exact structure of encryption wrapper (utility functions vs Drizzle custom types)
- Whether to use better-auth's email verification or defer
- Exact error code naming convention (as long as consistent)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `AGENTS.md` — Tech stack decisions and implementation rules
- `.planning/PROJECT.md` — Project context and scope
- `.planning/REQUIREMENTS.md` — Full requirement traceability

### Database
- `src/db/schema.ts` — Existing schema (user, session, account, verification, socialAccounts, mediaAssets, posts, scheduledPosts, platformPosts)
- `drizzle.config.ts` — Drizzle configuration

### Auth
- `src/lib/auth.ts` — better-auth configuration
- `src/lib/session.ts` — Session helper
- `src/app/api/auth/[...all]/route.ts` — Auth API routes

### i18n
- `src/i18n/routing.ts` — Locale routing config
- `src/middleware.ts` — next-intl middleware
- `messages/pt-BR.json`, `messages/en.json`, `messages/es.json` — Translation files

### Existing API Patterns
- `src/app/api/social-accounts/route.ts` — GET pattern with auth check
- `src/app/api/instagram/auth/route.ts` — OAuth initiation pattern (CURRENTLY reads from env vars — MUST be refactored)
- `src/app/api/instagram/callback/route.ts` — OAuth callback pattern (CURRENTLY reads from env vars — MUST be refactored)
- `src/app/api/instagram/disconnect/route.ts` — DELETE pattern

### New API Patterns Needed
- `src/app/api/platform-credentials/route.ts` — CRUD for per-user platform credentials
- Credential-aware OAuth flows — read App ID/Secret from DB per user

### Design System
- `design-system/imedia/MASTER.md` — Color palette, typography, spacing

## Specific Ideas

### Token Encryption Approach
Create a utility module `src/lib/encryption.ts` with:
- `encrypt(text: string): string` — returns base64-encoded `iv:ciphertext:authTag`
- `decrypt(encrypted: string): string` — reverses the above
- Use Node.js `crypto` module with `aes-256-gcm`

Wrap social account DB queries in `src/lib/social-accounts.ts`:
- `getSocialAccounts(userId)` — decrypts tokens after fetch
- `saveSocialAccount(data)` — encrypts tokens before insert/update

### Rate Limiting Approach
Use Upstash Redis (free tier sufficient) with `@upstash/redis`:
- Middleware at `src/middleware.ts` or route-level
- Separate limits: auth endpoints (5 attempts/minute), API endpoints (100/minute)
- Return `429` with `RATE_LIMIT_EXCEEDED` code

### API Error Format
```typescript
// Standard response shape
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message?: string;
  };
}

// Error codes
const ErrorCodes = {
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  // ... etc
} as const;
```

### Schema Verification
Existing schema already has:
- `user`, `session`, `account`, `verification` (better-auth)
- `socialAccounts` (with token fields)
- `mediaAssets`
- `posts`
- `scheduledPosts`
- `platformPosts`
- `platformCredentials` (NEW — per-user App ID/Secret per platform)

Verify these cover all Phase 2-10 needs. Add any missing columns (e.g., `followerCount` on socialAccounts, `errorDetails` on scheduledPosts).

## Deferred Ideas

- Email verification flow (better-auth supports it, but not required for v1)
- Two-factor authentication (deferred to v2)
- Audit log table (deferred to v2)
- API versioning (deferred until needed)
- Credential sharing between users (not applicable — single-user app)

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-05-04*
