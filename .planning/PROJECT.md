# iMedia — Social Media Management Platform

## What This Is

iMedia is a unified social media management platform built as a Next.js web application. It allows a single user (the owner) to connect, manage, publish, schedule, and analyze content across multiple social networks — starting with Instagram (Meta), then expanding to YouTube, TikTok, and X (Twitter). The app features a polished dashboard UI, secure authentication, i18n support (pt-BR, en, es), and a robust scheduling engine that falls back to an internal cron-based executor when platforms do not support native scheduling.

## Core Value

The owner can compose once and publish or schedule everywhere — with full visibility into performance analytics and account health across all connected platforms.

## Requirements

### Validated

- ✓ User authentication via email/password and Google OAuth (better-auth) — existing
- ✓ i18n routing with locale prefix (pt-BR, en, es) — existing
- ✓ Dashboard shell with sidebar, header, and auth guard — existing
- ✓ Instagram OAuth connection (connect/disconnect) via Facebook Graph API — existing
- ✓ Social accounts listing API — existing
- ✓ Dark/light theme support — existing
- ✓ Database schema with users, sessions, social accounts (Drizzle + Neon) — existing
- ✓ Responsive UI with shadcn/ui, Tailwind CSS, and Motion animations — existing

### Active

- [ ] **Frontend-First UI/UX**: Complete all dashboard page interfaces (dashboard, accounts, compose, scheduled, history, analytics, media, settings) with mock data and full i18n — no backend integrations beyond existing auth
- [ ] **Instagram Full Integration**: Publish posts (images, carousels, reels, stories), fetch media/insights, comment moderation, reply to DMs via Meta Graph API
- [ ] **YouTube Integration**: OAuth, video upload with metadata (title, description, captions/tags), list videos, analytics via YouTube Data API v3
- [ ] **TikTok Integration**: OAuth, video upload/publish, list videos, comments via TikTok Content Posting API
- [ ] **X (Twitter) Integration**: OAuth 2.0, tweet/post with media, list tweets, analytics via X API v2
- [ ] **Scheduling Engine**: Native scheduling where supported (YouTube `publishAt`, TikTok direct post with schedule); fallback internal cron executor for platforms without native support (Instagram, X)
- [ ] **Media Library**: Upload, organize, and reuse media assets across platforms
- [ ] **Analytics Aggregation**: Cross-platform metrics dashboard (views, likes, comments, shares, reach)
- [ ] **Production Hardening**: CI/CD pipeline, unit/integration tests, security audit, rate-limiting, error monitoring
- [ ] **Vercel Deployment**: Deploy to Vercel without GitHub repo linking; configure all env vars

### Out of Scope

- Multi-user / team collaboration — single-owner app by design
- Mobile native app — web-only for v1
- Facebook Page posting (separate from Instagram) — deferred; Meta integration focuses on Instagram/Threads
- Threads API — wait for official API GA; planned but not in v1
- AI content generation — deferred to v2
- Stripe billing / subscriptions — deferred to v2
- Real-time chat or live streaming management — not core to publishing workflow
- Third-party social networks (LinkedIn, Pinterest, etc.) — future milestone

## Context

- **Brownfield project**: Codebase already initialized with Next.js 16, React 19, TypeScript, Drizzle ORM, Neon Postgres, better-auth, next-intl, shadcn/ui, Tailwind v4, Motion, recharts
- **Instagram OAuth partially implemented**: Auth flow, callback, disconnect, and social-accounts listing API exist — BUT currently uses global env vars for App ID/Secret. Must be refactored to use per-user credentials from the database.
- **Platform credentials architecture**: New `platformCredentials` table stores each user's App ID/Secret per platform, encrypted at rest. OAuth flows read credentials from DB, not env vars.
- **Design system**: `design-system/imedia/MASTER.md` defines colors, typography, spacing
- **Database**: 8 tables defined in `src/db/schema.ts` (user, session, account, verification, socialAccounts, etc.)
- **Deployment target**: Vercel (serverless), Neon (Postgres), no GitHub repo link
- **Security priority**: Owner-only access; all social tokens AND platform app credentials encrypted at rest; OAuth state validation; CSRF protection
- **Per-user platform credentials**: Each user configures their own App ID / Client ID and App Secret / Client Secret for each platform (Instagram, YouTube, TikTok, X, etc.) directly in the UI. No global env vars for platform credentials.
- **API research completed**: Meta Graph API (content publishing, insights, comment moderation), YouTube Data API v3 (videos.insert, captions, analytics), TikTok Content Posting API (direct post, upload), X API v2 (tweets, media upload)

## Constraints

- **Tech stack**: Locked to existing stack (Next.js 16, React 19, TypeScript, Drizzle, Neon, better-auth, Tailwind, shadcn/ui). No framework migrations.
- **Single user**: Architecture assumes one authenticated owner. No RBAC or multi-tenancy needed for v1.
- **Platform API limits**: Must respect rate limits (Instagram 100 posts/24h, X 500 tweets/15min, etc.) and handle token expiry/refresh.
- **Scheduling fallback**: Instagram and X do not support native scheduling via API. Must implement an internal job queue (e.g., Vercel Cron + database table) to execute posts at scheduled times.
- **Vercel serverless**: Long-running uploads (large videos) may need resumable upload patterns or background jobs.
- **i18n**: All UI text must be translatable. API error messages must be machine-readable codes only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frontend-first approach | Validate UI/UX with mock data before investing in backend integrations | — Pending |
| Instagram first, then YouTube, TikTok, X | Instagram has the most mature Graph API; reduces integration risk | — Pending |
| Internal cron scheduler for unsupported platforms | Instagram and X lack native scheduling APIs; owner needs scheduling regardless | — Pending |
| Vercel deployment without GitHub link | User requirement; manual deploy via Vercel CLI | — Pending |
| Per-user platform credentials | Each user is their own developer; configures own App ID/Secret per platform | — Pending |
| Neon Postgres for database | Already configured; serverless-friendly | ✓ Good |
| better-auth for authentication | Already configured; supports OAuth providers needed | ✓ Good |
| next-intl for i18n | Already configured; supports pt-BR/en/es | ✓ Good |

---
*Last updated: 2026-05-04 after project initialization*
