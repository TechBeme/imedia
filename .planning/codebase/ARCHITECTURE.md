---
last_mapped: 2026-05-04
---

# Architecture

## Pattern: Next.js App Router with Locale Segments

The application follows the Next.js App Router pattern with an internationalized URL structure. Every route is prefixed with a locale (`pt-BR`, `en`, `es`).

```
/[locale]/           → LocaleLayout (i18n + theme provider)
  /login             → LoginPage (server, redirects if authenticated)
  /register          → RegisterPage (server, redirects if authenticated)
  /(dashboard)/      → DashboardLayout (auth guard, sidebar + header)
    /dashboard       → DashboardPage (client, mock data)
    /accounts        → AccountsPage (client, social account management)
    /compose         → ComposePage (client, post creation form)
    /scheduled       → ScheduledPage (client, mock scheduled posts)
    /history         → HistoryPage (client, mock post history)
    /analytics       → AnalyticsPage (client, charts)
    /media           → MediaPage (client, mock media library)
    /settings        → SettingsPage (client, profile settings)
```

## Layer Diagram

```
┌─────────────────────────────────────────┐
│  Presentation Layer (React Components)  │
│  - Pages ("use client")                 │
│  - UI Components (shadcn/ui)            │
│  - Layouts (server + client)            │
├─────────────────────────────────────────┤
│  Auth Layer (better-auth)               │
│  - Session validation (server)          │
│  - Client auth hooks                    │
├─────────────────────────────────────────┤
│  API Layer (Next.js Route Handlers)     │
│  - /api/auth/[...all]                   │
│  - /api/instagram/*                     │
│  - /api/social-accounts                 │
├─────────────────────────────────────────┤
│  Data Layer (Drizzle ORM + Neon)        │
│  - Schema definitions                   │
│  - Typed queries                        │
├─────────────────────────────────────────┤
│  External Services                      │
│  - Facebook Graph API (Instagram)       │
│  - Google OAuth                         │
└─────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
1. User submits credentials on `login-form.tsx` or `register-form.tsx`
2. `authClient.signIn.email()` or `authClient.signUp.email()` called
3. better-auth validates against `user` table via Drizzle adapter
4. Session cookie set, user redirected to dashboard
5. `DashboardLayout` calls `getSession()` server-side to validate access

### Instagram OAuth Flow
1. User clicks "Connect" on `accounts/page.tsx`
2. Frontend fetches `/api/instagram/auth` → returns OAuth URL
3. User redirected to Facebook OAuth dialog
4. Callback hits `/api/instagram/callback` with `code` + `state`
5. Backend exchanges code for token, fetches page + IG account info
6. Account stored in `socialAccounts` table
7. User redirected back to accounts page

### Post Creation Flow (Draft)
1. User fills compose form on `compose/page.tsx`
2. Form validated with Zod + React Hook Form
3. On submit, data logged to console (not yet persisted)
4. Toast confirmation shown

## Key Abstractions

### Session Guard Pattern
```typescript
// src/app/[locale]/(dashboard)/layout.tsx
const session = await getSession();
if (!session) redirect(`/${locale}/login`);
```
All dashboard pages are protected by this server-side check in the group layout.

### i18n Pattern
```typescript
const t = useTranslations("namespace");
// Messages loaded server-side in LocaleLayout via getMessages()
```
All UI text goes through `next-intl`. No hardcoded strings in components (with minor exceptions in mock data).

### Animation Pattern
```typescript
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };
```
Standard Motion animation pattern repeated across most pages.

### API Error Pattern
```typescript
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// or
return NextResponse.json({ error: message }, { status: 500 });
```
APIs return machine-readable error strings (not localized), per project rules.

## Entry Points

| Entry | File | Type |
|-------|------|------|
| App root | `src/app/layout.tsx` | Server layout (fonts, HTML shell) |
| Locale root | `src/app/[locale]/layout.tsx` | Server layout (i18n, theme, toaster) |
| Dashboard shell | `src/app/[locale]/(dashboard)/layout.tsx` | Server layout (auth guard, sidebar, header) |
| Auth API | `src/app/api/auth/[...all]/route.ts` | Route handler (better-auth catch-all) |
| Instagram API | `src/app/api/instagram/auth/route.ts` | Route handler (OAuth init) |
| Social accounts API | `src/app/api/social-accounts/route.ts` | Route handler (CRUD) |
