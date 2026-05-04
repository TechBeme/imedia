# Phase 1: Foundation & Auth Hardening — Plan

**Phase:** 1
**Name:** Foundation & Auth Hardening
**Goal:** Secure the application foundation, harden authentication, and ensure all infrastructure is production-ready before building features.
**Requirements:** AUTH-01..AUTH-08, I18N-01..I18N-05, DB-01..DB-05
**Estimated:** 3-5 days
**Created:** 2026-05-04

---

## Task 1: Token Encryption Utility

**Priority:** P0 (blocks all social account work)
**Requirement:** AUTH-06, DB-02
**Files:** `src/lib/encryption.ts`, `src/lib/social-accounts.ts`

### Description
Implement AES-256-GCM encryption for social media access tokens. All tokens stored in `socialAccounts` table must be encrypted at rest.

### Steps
1. Create `src/lib/encryption.ts`:
   - `encrypt(plainText: string): string` — returns `base64(iv:ciphertext:authTag)`
   - `decrypt(encrypted: string): string` — parses and decrypts
   - Use Node.js `crypto` with `aes-256-gcm`
   - Key from `SOCIAL_TOKEN_ENCRYPTION_KEY` env var (32 bytes)
2. Create `src/lib/social-accounts.ts`:
   - `getSocialAccounts(userId: string)` — query DB, decrypt tokens in results
   - `saveSocialAccount(data)` — encrypt tokens before insert/update
   - `updateSocialAccountTokens(id, tokens)` — encrypt and update
3. Add unit tests for encrypt/decrypt roundtrip

### Verification
- [ ] Encrypt "hello" and decrypt returns "hello"
- [ ] Different IV each encryption (same plaintext produces different ciphertext)
- [ ] Tampered ciphertext throws on decrypt
- [ ] `getSocialAccounts` returns decrypted tokens
- [ ] `saveSocialAccount` stores encrypted tokens

---

## Task 2: Update Instagram OAuth to Use Token Encryption

**Priority:** P0
**Requirement:** AUTH-06, AUTH-07, IG-01
**Files:** `src/app/api/instagram/callback/route.ts`, `src/app/api/instagram/disconnect/route.ts`, `src/app/api/social-accounts/route.ts`

### Description
Refactor existing Instagram OAuth flow to encrypt tokens on save and decrypt on read. Validate state parameter properly.

### Steps
1. Update `src/app/api/instagram/callback/route.ts`:
   - After fetching tokens, encrypt `accessToken` and `refreshToken` before saving
   - Use `saveSocialAccount` from Task 1
   - Validate state parameter: decode base64, verify `userId` matches session, verify `nonce` is not reused
2. Update `src/app/api/social-accounts/route.ts`:
   - Use `getSocialAccounts` to return decrypted account info (but DO NOT return raw tokens to frontend)
   - Return only public fields: id, platform, username, displayName, profilePicture, metadata, isActive
3. Update `src/app/api/instagram/disconnect/route.ts`:
   - Ensure proper auth check
   - Delete account from DB

### Verification
- [ ] Connect Instagram account — tokens stored encrypted in DB
- [ ] GET /api/social-accounts — returns account info without tokens
- [ ] State parameter validated on callback
- [ ] Disconnect removes account from DB

---

## Task 3: Password Reset Flow

**Priority:** P0
**Requirement:** AUTH-04
**Files:** `src/lib/auth.ts`, `src/app/[locale]/login/page.tsx`, `src/app/[locale]/login/login-form.tsx`, new `src/app/[locale]/reset-password/page.tsx`

### Description
Implement password reset via email using better-auth's built-in reset flow.

### Steps
1. Update `src/lib/auth.ts`:
   - Add `emailAndPassword: { resetPasswordTokenExpiresIn: 3600 }` (1 hour)
   - Ensure `sendResetPassword` is configured (use console log for now, or integrate with email provider later)
2. Create `src/app/[locale]/reset-password/page.tsx`:
   - Form with email input
   - Calls `authClient.forgetPassword({ email, redirectTo })`
   - Shows success/error toast
3. Update `src/app/[locale]/login/login-form.tsx`:
   - Add "Esqueceu a senha?" / "Forgot password?" link
   - Link opens reset-password page
4. Create `src/app/[locale]/reset-password/[token]/page.tsx`:
   - Form with new password + confirm password
   - Calls `authClient.resetPassword({ newPassword })`
   - Redirects to login on success
5. Add i18n strings for all reset-password UI text

### Verification
- [ ] User can request password reset from login page
- [ ] Reset token expires after 1 hour
- [ ] User can set new password via reset link
- [ ] New password works for login
- [ ] All text is i18n-translated

---

## Task 4: Rate Limiting on Auth Endpoints

**Priority:** P0
**Requirement:** AUTH-08
**Files:** `src/middleware.ts` (or new `src/lib/rate-limit.ts`), `src/app/api/auth/[...all]/route.ts`

### Description
Add rate limiting to prevent brute force attacks on auth endpoints.

### Steps
1. Install `@upstash/redis` and `@upstash/ratelimit`:
   ```bash
   npm install @upstash/redis @upstash/ratelimit
   ```
2. Create `src/lib/rate-limit.ts`:
   - `createRateLimiter(type: 'auth' | 'api')` — returns Upstash rate limiter
   - Auth limit: 5 requests per minute per IP
   - API limit: 100 requests per minute per IP
3. Update `src/middleware.ts`:
   - Add rate limit check for `/api/auth/*` paths
   - Return 429 with `RATE_LIMIT_EXCEEDED` code if limit hit
   - Skip rate limit for static assets and health checks
4. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env vars

### Verification
- [ ] 6 rapid login attempts from same IP → 429 response
- [ ] Rate limit resets after window expires
- [ ] API endpoints outside auth are not affected (or have separate limit)
- [ ] Error response includes `RATE_LIMIT_EXCEEDED` code

---

## Task 5: Database Schema Completion & Migrations

**Priority:** P0
**Requirement:** DB-01, DB-03
**Files:** `src/db/schema.ts`, `drizzle.config.ts`

### Description
Verify existing schema covers all future needs and add any missing columns/tables. Generate and run migrations.

### Steps
1. Audit existing schema in `src/db/schema.ts`:
   - `user` — OK (better-auth)
   - `session` — OK (better-auth)
   - `account` — OK (better-auth)
   - `verification` — OK (better-auth)
   - `socialAccounts` — Add `followerCount` integer column, `accountType` text (business/creator)
   - `mediaAssets` — OK
   - `posts` — Add `scheduledAt` timestamp (nullable), `errorMessage` text (nullable)
   - `scheduledPosts` — Add `retryCount` integer default 0, `errorDetails` jsonb
   - `platformPosts` — OK
2. Add any missing indexes:
   - `socialAccounts` — index on `isActive`
   - `posts` — index on `status`
3. Run `npm run db:generate` to create migration
4. Run `npm run db:migrate` to apply migration
5. Verify tables in Neon console

### Verification
- [ ] All tables exist in Neon database
- [ ] Foreign key constraints are correct
- [ ] Indexes are created
- [ ] Migration file is committed to git

---

## Task 6: API Error Standardization

**Priority:** P1
**Requirement:** I18N-04, DB-04, DB-05
**Files:** `src/lib/api-response.ts`, all API routes

### Description
Standardize all API responses to use machine-readable error codes. Add Zod validation to all API routes.

### Steps
1. Create `src/lib/api-response.ts`:
   ```typescript
   export const ErrorCodes = {
     AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
     AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
     AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
     RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
     VALIDATION_ERROR: "VALIDATION_ERROR",
     NOT_FOUND: "NOT_FOUND",
     CONFLICT: "CONFLICT",
     INTERNAL_ERROR: "INTERNAL_ERROR",
     PLATFORM_NOT_CONNECTED: "PLATFORM_NOT_CONNECTED",
     PLATFORM_API_ERROR: "PLATFORM_API_ERROR",
   } as const;

   export type ErrorCode = keyof typeof ErrorCodes;

   export function success<T>(data: T, status = 200) {
     return NextResponse.json({ data }, { status });
   }

   export function error(code: string, message?: string, status = 400) {
     return NextResponse.json({ error: { code, message } }, { status });
   }
   ```
2. Refactor existing API routes to use new format:
   - `src/app/api/social-accounts/route.ts`
   - `src/app/api/instagram/auth/route.ts`
   - `src/app/api/instagram/callback/route.ts`
   - `src/app/api/instagram/disconnect/route.ts`
3. Add Zod schemas for request validation in each route
4. Update frontend API calls to handle new error shape

### Verification
- [ ] All API routes return `{ data }` or `{ error: { code, message } }`
- [ ] Invalid request bodies return `VALIDATION_ERROR` with details
- [ ] Unauthorized requests return `AUTH_UNAUTHORIZED`
- [ ] Frontend displays translated error messages based on code

---

## Task 7: i18n Audit & Completion

**Priority:** P1
**Requirement:** I18N-01, I18N-02, I18N-03, I18N-05
**Files:** `messages/*.json`, all component files

### Description
Audit all UI components for hardcoded strings. Complete missing translations in all 3 locales.

### Steps
1. Search for hardcoded strings in `src/components/` and `src/app/`:
   - Look for literal text not wrapped in `t()` or `useTranslations`
   - Check `aria-label`, `placeholder`, `title` attributes
   - Check toast messages
2. Add missing keys to all 3 message files:
   - `pt-BR.json` (source of truth)
   - `en.json`
   - `es.json`
3. Add error code translations:
   ```json
   "errors": {
     "AUTH_UNAUTHORIZED": "Você precisa estar logado",
     "RATE_LIMIT_EXCEEDED": "Muitas tentativas. Tente novamente mais tarde.",
     ...
   }
   ```
4. Add date/time formatting utilities using `date-fns` with locale support
5. Verify locale switcher works and persists preference

### Verification
- [ ] Zero hardcoded strings in all `.tsx` files (grep for `"` and `' ` patterns)
- [ ] All 3 locale files have identical key structure
- [ ] Error codes have translations in all locales
- [ ] Date formatting respects locale (e.g., "4 de maio de 2026" in pt-BR)
- [ ] Language switcher updates UI immediately

---

## Task 8: Auth Guard on Dashboard Routes

**Priority:** P0
**Requirement:** AUTH-05
**Files:** `src/app/[locale]/(dashboard)/layout.tsx`

### Description
Ensure all dashboard routes are protected by server-side auth guard. Already partially implemented — verify and harden.

### Steps
1. Verify `src/app/[locale]/(dashboard)/layout.tsx`:
   - `getSession()` is called and redirects to login if null
   - Redirect preserves locale (`/${locale}/login`)
2. Add `unauthorized` handling:
   - If session exists but is expired, redirect to login with `?expired=1`
   - Show "Sessão expirada" toast on login page
3. Verify API routes also check session (not just dashboard layout)
4. Add `middleware.ts` auth check as secondary guard:
   - Check for auth cookie on dashboard routes
   - Redirect to login if missing (before hitting page)

### Verification
- [ ] Unauthenticated user accessing `/pt-BR/dashboard` → redirected to `/pt-BR/login`
- [ ] Unauthenticated API call → 401 with `AUTH_UNAUTHORIZED`
- [ ] Expired session → redirected to login with expired param
- [ ] Authenticated user → normal access

---

## Task 9: Environment Variables Documentation

**Priority:** P1
**Requirement:** PROD-05
**Files:** `.env.example`, `README.md`

### Description
Document all required environment variables. Create `.env.example` template.

### Steps
1. Create `.env.example`:
   ```
   # Database
   DATABASE_URL=

   # Better Auth
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=

   # Google OAuth
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=

   # Instagram / Meta
   INSTAGRAM_APP_ID=
   INSTAGRAM_APP_SECRET=
   INSTAGRAM_REDIRECT_URI=

   # Token Encryption
   SOCIAL_TOKEN_ENCRYPTION_KEY=

   # Rate Limiting (Upstash)
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=

   # Vercel Blob
   BLOB_READ_WRITE_TOKEN=
   ```
2. Update `README.md` with setup instructions
3. Verify all env vars are validated at runtime (throw if missing required vars)

### Verification
- [ ] `.env.example` exists and lists all required variables
- [ ] App throws clear error on startup if required env var is missing
- [ ] README has setup instructions for new developers

---

## Task 10: Integration Smoke Test

**Priority:** P0
**Requirement:** All Phase 1
**Files:** N/A (manual testing)

### Description
End-to-end smoke test of all Phase 1 deliverables.

### Steps
1. Fresh database migration
2. Sign up with email/password
3. Log in
4. Connect Instagram account
5. Verify tokens are encrypted in DB
6. Verify social accounts list shows connected account (no tokens exposed)
7. Disconnect Instagram
8. Test password reset flow
9. Test rate limiting (rapid login attempts)
10. Switch languages and verify all text updates
11. Verify API error codes are returned correctly

### Verification
- [ ] All auth flows work end-to-end
- [ ] Tokens encrypted in database
- [ ] API returns consistent error codes
- [ ] Zero hardcoded strings
- [ ] All new tables have migrations
- [ ] Rate limiting active

---

## Dependencies

```
Task 1 (Encryption) ──> Task 2 (Instagram OAuth update)
Task 1 (Encryption) ──> Task 5 (Schema) ──> Task 10 (Smoke Test)
Task 3 (Password Reset) ──> Task 10
Task 4 (Rate Limit) ──> Task 10
Task 6 (API Errors) ──> Task 10
Task 7 (i18n) ──> Task 10
Task 8 (Auth Guard) ──> Task 10
Task 9 (Env Docs) ──> Task 10
```

**Parallelizable:** Tasks 1, 3, 4, 6, 7, 8, 9 can run in parallel after initial setup.

---

## Threat Model

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Social tokens leaked in DB | HIGH | AES-256-GCM encryption at rest |
| Brute force auth attacks | HIGH | Rate limiting (5/min per IP) |
| CSRF on OAuth callback | HIGH | State parameter validation |
| Session hijacking | MEDIUM | httpOnly cookies, 7-day expiry |
| API enumeration | MEDIUM | Generic error messages, rate limiting |
| Token decryption key exposure | HIGH | Store in env var, never log |

---

## Success Criteria

- [ ] All auth flows (signup, login, Google OAuth, password reset) work end-to-end
- [ ] Social account tokens are encrypted in the database
- [ ] API returns consistent error codes
- [ ] Zero hardcoded strings in UI components
- [ ] All new tables have Drizzle migrations
- [ ] Rate limiting active on auth endpoints
- [ ] Dashboard routes protected server-side

---

*Plan created: 2026-05-04*
*Phase: 01-foundation-auth*
