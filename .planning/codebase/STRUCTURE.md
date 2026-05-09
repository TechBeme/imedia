---
last_mapped: 2026-05-04
---

# Directory Structure

```
somedia/
├── .planning/codebase/          ← This codebase map
├── design-system/
│   └── somedia/
│       ├── MASTER.md            ← Design system spec (colors, typography, spacing)
│       └── pages/               ← Per-page design overrides (empty)
├── messages/
│   ├── pt-BR.json               ← Portuguese (default) translations
│   ├── en.json                  ← English translations
│   └── es.json                  ← Spanish translations
├── public/                      ← Static assets
├── src/
│   ├── app/
│   │   ├── globals.css          ← Tailwind v4 theme + CSS variables
│   │   ├── layout.tsx           ← Root layout (fonts, metadata, viewport)
│   │   ├── [locale]/
│   │   │   ├── layout.tsx       ← Locale layout (i18n provider, theme, toaster)
│   │   │   ├── page.tsx         ← Landing page (redirects to /dashboard)
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx   ← Dashboard shell (auth guard, sidebar, header)
│   │   │   │   ├── accounts/
│   │   │   │   │   └── page.tsx ← Social account connections
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx ← Performance charts
│   │   │   │   ├── compose/
│   │   │   │   │   └── page.tsx ← Create post form
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx ← Main dashboard (mock data)
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx ← Post history table
│   │   │   │   ├── media/
│   │   │   │   │   └── page.tsx ← Media library grid
│   │   │   │   ├── scheduled/
│   │   │   │   │   └── page.tsx ← Scheduled posts list
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx ← User settings form
│   │   │   ├── login/
│   │   │   │   ├── page.tsx     ← Login page (server, redirects if auth)
│   │   │   │   └── login-form.tsx ← Login form component (client)
│   │   │   └── register/
│   │   │       ├── page.tsx     ← Register page (server)
│   │   │       └── register-form.tsx ← Register form component (client)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...all]/
│   │       │       └── route.ts ← better-auth catch-all handler
│   │       ├── instagram/
│   │       │   ├── auth/
│   │       │   │   └── route.ts ← Initiate Instagram OAuth
│   │       │   ├── callback/
│   │       │   │   └── route.ts ← Instagram OAuth callback
│   │       │   └── disconnect/
│   │       │       └── route.ts ← Disconnect Instagram
│   │       └── social-accounts/
│   │           └── route.ts     ← List connected accounts
│   ├── components/
│   │   ├── header.tsx           ← Dashboard header (search, lang, theme, notif)
│   │   ├── language-switcher.tsx ← Locale dropdown with flags
│   │   ├── sidebar.tsx          ← Dashboard sidebar + mobile nav + logout
│   │   ├── theme-toggle.tsx     ← Dark/light mode toggle
│   │   └── ui/                  ← shadcn/ui components (22 components)
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       └── tooltip.tsx
│   ├── db/
│   │   ├── index.ts             ← Neon connection + Drizzle client
│   │   └── schema.ts            ← Database schema (8 tables)
│   ├── i18n/
│   │   └── routing.ts           ← next-intl navigation helpers
│   ├── lib/
│   │   ├── auth-client.ts       ← Client-side better-auth instance
│   │   ├── auth.ts              ← Server-side better-auth config
│   │   ├── i18n.ts              ← next-intl config (locales, messages loader)
│   │   ├── session.ts           ← Server session getter
│   │   └── utils.ts             ← cn() utility (clsx + tailwind-merge)
│   └── middleware.ts            ← next-intl middleware (locale routing)
├── components.json              ← shadcn/ui configuration
├── drizzle.config.ts            ← Drizzle Kit configuration
├── eslint.config.mjs            ← ESLint config (Next.js presets)
├── next.config.ts               ← Next.js config + next-intl plugin
├── package.json                 ← Dependencies & scripts
├── postcss.config.mjs           ← PostCSS config (Tailwind v4)
└── tsconfig.json                ← TypeScript config (strict, path aliases)
```

## Naming Conventions

| Pattern | Example | Location |
|---------|---------|----------|
| Pages | `page.tsx` | Inside route segment folder |
| Layouts | `layout.tsx` | Inside route segment folder |
| API routes | `route.ts` | Inside API segment folder |
| Client components | `*.tsx` with `"use client"` | Pages, forms, interactive UI |
| Server components | `*.tsx` (no directive) | Layouts, auth guards |
| UI components | `kebab-case.tsx` | `src/components/ui/` |
| App components | `kebab-case.tsx` | `src/components/` |
| Lib utilities | `kebab-case.ts` | `src/lib/` |
| Database schema | `schema.ts` | `src/db/` |
| Path alias | `@/components/ui/button` | — |

## Key Locations

| Concern | Location |
|---------|----------|
| Add a new page | `src/app/[locale]/(dashboard)/{page}/page.tsx` |
| Add a new API endpoint | `src/app/api/{resource}/route.ts` |
| Add a database table | `src/db/schema.ts` |
| Add i18n strings | `messages/{locale}.json` |
| Add a UI component | `src/components/ui/` (via shadcn CLI) |
| Configure auth | `src/lib/auth.ts` |
| Configure theme colors | `src/app/globals.css` |
| Configure routing/locales | `src/lib/i18n.ts`, `src/i18n/routing.ts` |
