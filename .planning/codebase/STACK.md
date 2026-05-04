---
last_mapped: 2026-05-04
---

# Technology Stack

## Runtime & Language

| Layer | Technology | Version | File |
|-------|-----------|---------|------|
| Runtime | Node.js (via Next.js) | — | — |
| Language | TypeScript | 5.x | `tsconfig.json` |
| Framework | Next.js | 16.2.4 | `package.json` |
| React | React | 19.2.4 | `package.json` |
| JSX Transform | react-jsx | — | `tsconfig.json` |

## UI & Styling

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| Tailwind CSS | Utility-first styling | 4.x | `postcss.config.mjs`, `src/app/globals.css` |
| tw-animate-css | Tailwind animations | 1.4.0 | `src/app/globals.css` |
| shadcn/ui | Component library (base-nova style) | 4.6.0 | `components.json` |
| @base-ui/react | Headless UI primitives | 1.4.1 | `package.json` |
| lucide-react | Icon library | 1.14.0 | Used across UI |
| react-icons | Additional icons (Remix) | 5.6.0 | `src/components/sidebar.tsx`, pages |
| next-themes | Dark/light mode | 0.4.6 | `src/app/[locale]/layout.tsx` |
| Motion | Animations & transitions | 12.38.0 | Used in most pages |

## State & Forms

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| React Hook Form | Form state management | 7.75.0 | `src/app/[locale]/(dashboard)/compose/page.tsx` |
| Zod | Schema validation | 4.4.2 | Compose form, registration |
| @hookform/resolvers | Zod + RHF bridge | 5.2.2 | Compose form |

## Database & ORM

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| Neon | Serverless PostgreSQL | 1.1.0 | `src/db/index.ts` |
| Drizzle ORM | Type-safe SQL builder | 0.45.2 | `src/db/schema.ts`, `src/db/index.ts` |
| drizzle-kit | Schema migrations | 0.31.10 | `drizzle.config.ts` |

## Authentication

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| better-auth | Auth framework | 1.6.9 | `src/lib/auth.ts` |
| bcryptjs | Password hashing | 3.0.3 | `package.json` |
| jose | JWT handling | 6.2.3 | `package.json` |

## Internationalization

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| next-intl | i18n routing & messages | 4.11.0 | `src/lib/i18n.ts`, `src/middleware.ts` |

## Charts

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| recharts | Data visualization | 3.8.1 | `src/app/[locale]/(dashboard)/dashboard/page.tsx`, `analytics/page.tsx` |

## Date Handling

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| date-fns | Date formatting/manipulation | 4.1.0 | `package.json` |
| react-day-picker | Calendar component | 9.14.0 | `package.json` |

## Utilities

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| clsx | Conditional classes | 2.1.1 | `src/lib/utils.ts` |
| tailwind-merge | Merge Tailwind classes | 3.5.0 | `src/lib/utils.ts` |
| class-variance-authority | Component variants | 0.7.1 | `package.json` |
| sonner | Toast notifications | 2.0.7 | `src/app/[locale]/layout.tsx` |

## Dev Tools

| Technology | Purpose | Version | Key Files |
|-----------|---------|---------|-----------|
| ESLint | Linting | 9.x | `eslint.config.mjs` |
| eslint-config-next | Next.js lint rules | 16.2.4 | `eslint.config.mjs` |
| @tailwindcss/postcss | PostCSS plugin | 4.x | `postcss.config.mjs` |

## Fonts

- **Sans:** Inter (variable, Latin subset) — `src/app/layout.tsx`
- **Heading:** Poppins (400/500/600/700, Latin subset) — `src/app/layout.tsx`
