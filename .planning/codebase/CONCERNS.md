---
last_mapped: 2026-05-04
---

# Concerns & Technical Debt

## Bugs

### Instagram OAuth Token Exchange Bug
**File:** `src/app/api/instagram/callback/route.ts` (lines 45-55)

A `fetch()` call is made to the token endpoint **before** the URL search params are set:
```typescript
const tokenRes = await fetch(
  "https://graph.facebook.com/v18.0/oauth/access_token",  // ← wrong: no params
  { method: "GET", headers: { Accept: "application/json" } }
);

const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
tokenUrl.searchParams.set("client_id", appId);
// ... params set AFTER the fetch
const tokenResponse = await fetch(tokenUrl.toString());  // ← correct fetch
```
The first `fetch()` is dead code and will always fail. The second `fetch()` is correct but the first should be removed.

### Hardcoded Locale in OAuth Callback Redirect
**File:** `src/app/api/instagram/callback/route.ts`

All redirect URLs hardcode `pt-BR`:
```typescript
return NextResponse.redirect(new URL("/pt-BR/accounts?error=...", req.url));
```
This breaks for English and Spanish users. Should use the user's actual locale from state or session.

## Security Concerns

### No Token Encryption
**File:** `src/db/schema.ts`

The `socialAccounts` table has `accessToken` and `refreshToken` columns with a comment "// encrypted", but **no encryption logic is visible anywhere in the codebase**. Tokens are stored in plaintext.

### No Input Validation on API Routes
**Files:** `src/app/api/social-accounts/route.ts`, `src/app/api/instagram/disconnect/route.ts`

API routes only check authentication. There is no:
- Rate limiting
- Input sanitization
- Body validation (for POST endpoints)
- CSRF protection beyond what better-auth provides

### No Error Boundaries
No `error.tsx` or `global-error.tsx` files found. Unhandled errors will crash the app with default Next.js error pages.

### Permissive Image Configuration
**File:** `next.config.ts`

```typescript
images: {
  remotePatterns: [{ protocol: "https", hostname: "**" }],
}
```
This allows loading images from **any** HTTPS domain, which is a potential security risk.

## Data Integrity

### Mock Data in Production Pages
**Files:** `src/app/[locale]/(dashboard)/dashboard/page.tsx`, `analytics/page.tsx`, `scheduled/page.tsx`, `history/page.tsx`, `media/page.tsx`

Dashboard shows e-commerce product data ("Hybrid Active Noise Cancel", "Casio G-Shock") instead of social media metrics. These are clearly placeholder/mock data that should be replaced with real data from the database.

### No Database Constraints on JSONB Fields
**File:** `src/db/schema.ts`

`metadata`, `dimensions`, `externalIds`, `metrics` fields are `jsonb` with no schema validation at the DB level. Invalid shapes can be inserted.

## Architecture Concerns

### Missing Planned Integrations
Per `AGENTS.md`, the following are planned but not implemented:
- **Stripe** — No payment/subscription code exists
- **Vercel AI SDK** — No AI features exist
- **Scheduled post execution** — `scheduled_posts` table exists but no cron/job runner

### No Media Upload Implementation
**File:** `src/app/[locale]/(dashboard)/media/page.tsx`

The "Upload" button is present but not wired to any upload handler. `Vercel Blob` is in dependencies but unused.

### No Post Publishing Pipeline
The `posts` and `scheduled_posts` tables exist, but:
- No API to create/save posts
- No publishing logic to social platforms
- No cron job to execute scheduled posts

## Code Quality

### Unused Import
**File:** `src/app/api/instagram/callback/route.ts`

`NextResponse` is imported but only used for the redirect at the end. The dead `fetch()` call uses a different variable.

### Inconsistent i18n Coverage
**File:** `src/app/[locale]/(dashboard)/media/page.tsx`

The media page has hardcoded English strings ("Media Library", "Upload") while all other pages are fully internationalized.

### Design System Drift
**File:** `design-system/imedia/MASTER.md`

The design system specifies a rose/pink primary color (`#E11D48`) and rose-tinted background (`#FFF1F2`), but the actual CSS in `globals.css` uses blue (`#2563eb`) with neutral grays. The design system is not being followed.

## Performance Concerns

### No Data Fetching Optimization
- No `React.Suspense` boundaries in dashboard layout
- No streaming or partial rendering
- All dashboard pages load data client-side (or use mocks)

### Large Bundle Potential
- `recharts` imported in multiple pages (not tree-shaken optimally)
- `motion/react` used extensively
- No `dynamic` imports for heavy components

## Testing Debt

- Zero tests (see `TESTING.md`)
- No test infrastructure
- No CI/CD pipeline

## Recommended Priority Order

1. **Fix OAuth token exchange bug** — Breaks Instagram connection
2. **Fix hardcoded locale redirects** — Breaks i18n for OAuth flow
3. **Implement token encryption** — Security risk
4. **Add input validation to APIs** — Security risk
5. **Replace mock data with real queries** — Core functionality
6. **Add error boundaries** — Stability
7. **Set up testing infrastructure** — Quality assurance
8. **Implement media upload** — Feature gap
9. **Build post publishing pipeline** — Core feature
10. **Align CSS with design system** — Consistency
