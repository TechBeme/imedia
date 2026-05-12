# Roadmap: somedia

**Created:** 2026-05-04
**Project:** somedia — Social Media Management Platform
**Granularity:** Standard (10 phases)
**Execution:** Parallel where possible

---

## Phase 1: Foundation & Auth Hardening

**Goal:** Secure the application foundation, harden authentication, and ensure all infrastructure is production-ready before building features.

**Requirements:** AUTH-01 through AUTH-08, I18N-01 through I18N-05, DB-01 through DB-05

**Plans:**
1. **Auth Security** — Implement password reset flow, rate limiting on auth endpoints, CSRF protection validation
2. **Token Encryption** — Add AES-256 encryption for social account tokens in database; update schema
3. **Database Schema Expansion** — Add tables: posts, scheduledJobs, mediaAssets, platformTokens; ensure migrations
4. **i18n Completion** — Audit all components for hardcoded strings; complete missing translations in all 3 locales
5. **API Foundation** — Standardize API error response format (machine-readable codes); add input validation middleware

**Success Criteria:**
- All auth flows (signup, login, Google OAuth, password reset) work end-to-end
- Social account tokens are encrypted in the database
- API returns consistent error codes
- Zero hardcoded strings in UI components
- All new tables have Drizzle migrations

**Estimated:** 3-5 days

---

## Phase 2: Frontend UI/UX (Mock Data)

**Goal:** Build complete dashboard interfaces with mock data so the owner can validate the look, feel, and flow before any backend integrations.

**Requirements:** UI-01 through UI-12

**Plans:**
1. **Dashboard Overview** — KPI cards (total posts, reach, engagement), recent activity feed, quick action buttons
2. **Accounts Page** — Platform cards (Instagram, YouTube, TikTok, X) with connect/disconnect UI, account preview
3. **Compose Page** — Rich text editor, platform multi-selector, media upload preview, scheduling date/time picker, character counters per platform
4. **Scheduled Posts** — Calendar view (month/week/day), list view with status badges, edit/cancel actions
5. **History Page** — Filterable table with platform filter, date range, search, sortable columns
6. **Analytics Page** — Recharts line chart (views over time), bar chart (engagement by platform), pie chart (content type distribution)
7. **Media Library** — Grid layout with preview cards, drag-and-drop upload zone, folder/tag filters
8. **Settings Page** — Profile form (name, email, avatar), password change, theme toggle, language selector
9. **Responsive Polish** — Mobile sidebar sheet, touch-friendly controls, breakpoint testing
10. **UX Micro-interactions** — Skeleton loaders, empty states, error states, toast notifications, form validation feedback

**Status:** PARTIALLY COMPLETE
- Accounts page is real (Instagram profile + media grid from Graph API)
- Compose page is real (publishes to Instagram)
- Settings page is real (profile + short URL + domains settings)
- Dashboard shows real link analytics data
- Scheduled, history, analytics pages are mock-only (real data deferred to Phases 3 and 4)
- Media Library removed (deferred out of scope)

**Plans:**
- [ ] **02-01-PLAN.md** — Media Library Removal (delete page, sidebar nav, i18n keys)
- [ ] **02-02-PLAN.md** — Skeleton Loaders, Empty States, Error States, Responsive Polish
- [ ] **02-03-PLAN.md** — i18n Audit, Build Verification, Final Commit

**Wave Structure:**
- Wave 1: 02-01 (Media Library removal)
- Wave 2: 02-02 (Skeletons, empty/error states, responsive polish)
- Wave 3: 02-03 (i18n audit, build verification)

**Success Criteria:**
- Media Library completely removed from codebase
- All mock pages have skeleton loaders, empty states, and error states
- All pages are responsive on mobile, tablet, and desktop
- All UI text is translatable via next-intl
- No hardcoded strings in modified components
- Application builds successfully

**Estimated:** 2-3 days

---

## Phase 2.1: Link Shortener (INSERTED)

**Goal:** Build a full-featured link shortening tool with custom slugs, QR codes, advanced click analytics, and custom domain support.

**Requirements:** LNK-01 through LNK-12

**Plans:**
- [x] **02.1-01-PLAN.md** — Database Schema & Core API (shortLinks/linkClicks tables, POST /api/links, GET /[slug] redirect with click tracking)
- [x] **02.1-02-PLAN.md** — Link Management UI & Public Shorten Page (dashboard links page, link card/form components, public /s page, password prompt)
- [x] **02.1-03-PLAN.md** — Analytics Dashboard & QR Codes (analytics API with aggregations, charts with recharts, QR code generation PNG/SVG)
- [x] **02.1-04-PLAN.md** — Custom Domains (customDomains table, DNS TXT verification, domain management UI, middleware routing)
- [x] **02.1-05-PLAN.md** — Integration & Finalization (sidebar nav, migrations, build verification)

**Wave Structure:**
- Wave 1: 02.1-01 (schema + core API)
- Wave 2: 02.1-02, 02.1-03 (UI + analytics/QR in parallel)
- Wave 3: 02.1-04, 02.1-05 (custom domains + integration in parallel, both depend on Wave 1)

**Success Criteria:**
- Users can create short links with custom or random slugs
- Short links redirect correctly and record detailed analytics
- QR codes can be generated and downloaded for any link
- Analytics dashboard shows clicks by time, location, device, browser, and referrer
- Custom domains can be connected and serve short links
- Links can be password-protected and set to expire
- Public shorten page works for anonymous users
- All endpoints are rate-limited

**Status:** COMPLETED — all success criteria met. Extra features delivered: device rules, OG metadata preview, CSV export, folders, tags.

**Estimated:** 5-7 days

---

## Phase 3: Instagram Integration

**Goal:** Full Instagram Business/Creator account integration via Meta Graph API — publishing, insights, and comment management.

**Requirements:** IG-01 through IG-14

**Plans:**
- [x] **03-01-PLAN.md** — OAuth Refinement: per-user platform credentials, token refresh, token revocation on disconnect
- [x] **03-02-PLAN.md** — Account Info & Post Listing: rich profile display (bio, followers, profile pic), posts grid with engagement, full i18n
- [x] **03-03-PLAN.md** — Image & Carousel Publishing: single image and multi-image carousel posts via Meta Graph API
- [x] **03-04-PLAN.md** — Reels & Stories Publishing: Reels and Stories upload with media type selector in compose UI
- [ ] **03-05-PLAN.md** — Insights & Comment Management: post-level insights, list/reply/delete comments
- [ ] **03-06-PLAN.md** — Rate Limiting: 100 posts/24h enforcement with user-facing warnings and server-side blocking

**Wave Structure:**
- Wave 1: 03-01 (OAuth refinement), 03-02 (Account info + posts) — parallel, no file overlap
- Wave 2: 03-03 (Image + Carousel publishing), 03-04 (Reels + Stories publishing) — 03-04 depends on 03-03 publishing library
- Wave 3: 03-05 (Insights + comments), 03-06 (Rate limiting) — both depend on earlier waves

**Success Criteria:**
- User can connect Instagram Business account using per-user credentials
- User can publish images, carousels, reels, and stories
- User can view published posts and their insights
- User can manage comments (reply, hide, delete)
- Rate limits are enforced and communicated to user
- All errors show helpful messages
- All UI text is translatable via next-intl

**Status:** IN PROGRESS — OAuth, account info, media listing, and all publishing types (image, carousel, reel, story) are implemented. Insights, comments, and rate limiting remain.

**Estimated:** 7-10 days (remaining: ~3 days for insights, comments, rate limiting)

---

## Phase 3.1: Social Automations (INSERTED)

**Goal:** Build a ManyChat-like automation system where users create rules that trigger on social media interactions (starting with Instagram comments) and execute actions like replying to comments or sending DMs, with randomized responses to appear human.

**Requirements:** AUTO-01 through AUTO-17

**Plans:**
- [x] **03.1-01-PLAN.md** — Database Schema & Core Engine (automations, automation_actions, automation_logs, comment_watch_state tables; trigger matching, random response selection, cooldown logic)
- [x] **03.1-02-PLAN.md** — Instagram Adapter & Comment Polling Cron (fetch comments, reply to comments, DM placeholder; Vercel cron every 2 minutes)
- [x] **03.1-03-PLAN.md** — Automation CRUD REST API (POST/GET/PATCH/DELETE /api/automations, toggle, actions, logs endpoints with Zod validation)
- [x] **03.1-04-PLAN.md** — Automation Builder UI (trigger config with keywords/match mode, action config with randomized responses, create/edit pages)
- [x] **03.1-05-PLAN.md** — Activity Log UI (execution history page with expandable details, status badges, trigger info)
- [x] **03.1-06-PLAN.md** — Finalization (schema push, unit tests, build verification, env documentation)

**Status:** COMPLETED — all success criteria met. 6 plans executed across 4 waves. 13 unit tests passing.

**Wave Structure:**
- Wave 1: 03.1-01 (schema + engine)
- Wave 2: 03.1-02 (adapter + cron, depends on engine)
- Wave 3: 03.1-03 (API), 03.1-04 (UI builder), 03.1-05 (activity log) — all depend on engine, API and UI can run in parallel
- Wave 4: 03.1-06 (finalization, depends on all prior)

**Success Criteria:**
- User can create an automation with trigger keywords and action responses
- Automation matches comments containing configured keywords (case-insensitive by default)
- Matched comments trigger reply actions with a randomly selected response
- DM action is modeled but shows graceful "not available" for Instagram
- Vercel cron polls Instagram comments every 2 minutes and executes matching automations
- Activity log shows every execution with trigger details, action results, and status
- All automations are scoped to a specific social account
- Cooldown prevents the same user from triggering the same automation repeatedly
- All UI text is translatable via next-intl
- Unit tests pass for engine functions
- TypeScript build succeeds with zero errors

**Estimated:** 5-7 days

---

## Phase 4: Scheduled Posts

**Goal:** Build a complete scheduled posts system. User schedules posts from compose, views them on a dashboard, and a cron executor publishes them at the right time.

**Requirements:** SCH-01 through SCH-06

**Plans:**
- [x] **04-01-PLAN.md** — Cleanup & API Foundation (remove Media Library page/sidebar/i18n; create `/api/scheduled-posts` CRUD)
- [x] **04-02-PLAN.md** — Compose Integration & Scheduled Dashboard (add schedule toggle/date picker to compose; build real `/scheduled` page with list, filters, actions)
- [x] **04-03-PLAN.md** — Cron Executor & Finalization (Vercel cron job, publish pending Instagram posts, status updates, build verification)

**Wave Structure:**
- Wave 1: 04-01 (cleanup + API)
- Wave 2: 04-02 (compose + scheduled page, depends on API)
- Wave 3: 04-03 (cron + finalization, depends on API)

**Success Criteria:**
- User can schedule an Instagram post from the compose page with a future date/time
- Scheduled posts are saved to the database with `status: pending`
- `/scheduled` page shows all posts with platform, content preview, scheduled time, and status
- User can edit or cancel a pending scheduled post
- User can "publish now" to bypass scheduling
- Vercel cron executes pending Instagram posts at the scheduled time
- Executed posts update status to `published` or `failed` with error message
- All UI text is translatable via next-intl

**Estimated:** 3-4 days

---

## Phase 5: Scheduling Engine

**Goal:** Implement a robust scheduling system that uses native APIs where available and falls back to an internal cron executor.

**Requirements:** SCH-01 through SCH-08

**Plans:**
1. **Scheduler Schema** — Database table for scheduled jobs (post data, platform, scheduledAt, status, retryCount, error)
2. **Compose Integration** — Add scheduling picker to compose page; validate scheduled time is in the future
3. **Native Scheduling** — YouTube `publishAt` integration, TikTok `publish_time` integration
4. **Cron Executor** — Vercel Cron job (every minute) that checks pending jobs and executes them
5. **Fallback Scheduler** — For Instagram and X, store job and execute at scheduled time via cron
6. **Job Management** — Edit scheduled posts, cancel before execution, view job history
7. **Retry Logic** — Failed jobs retried up to 3 times with exponential backoff
8. **Notifications** — Toast + in-app notification on job success/failure

**Success Criteria:**
- User can schedule posts for any platform from the compose page
- YouTube and TikTok use native scheduling APIs
- Instagram and X posts execute via internal cron at the scheduled time
- Scheduled posts can be edited or cancelled before execution
- Failed posts are retried and user is notified
- Job status is visible in the scheduled posts page

**Estimated:** 5-7 days

---

## Phase 6: YouTube Integration

**Goal:** Full YouTube channel integration via Data API v3 — video upload, captions, metadata management, and analytics.

**Requirements:** YT-01 through YT-10

**Plans:**
1. **OAuth Flow** — Google OAuth for YouTube channel access
2. **Channel Info** — Fetch and display channel details (name, subscribers, thumbnail)
3. **Video Upload** — Implement resumable video upload with metadata (title, description, tags, category, privacy)
4. **Caption Upload** — Upload SRT caption files to videos
5. **Video Management** — List videos, update metadata, delete videos
6. **Native Scheduling** — Schedule video publish via `publishAt` field
7. **Analytics** — Fetch video metrics (views, likes, comments, watch time)
8. **Token Management** — Handle Google token refresh

**Success Criteria:**
- User can connect YouTube channel
- User can upload videos with full metadata
- User can upload caption files
- User can schedule video publishes
- User can view video analytics
- Token refresh works automatically

**Estimated:** 5-7 days

---

## Phase 7: TikTok Integration

**Goal:** Full TikTok account integration via Content Posting API — video upload, scheduling, and comment management.

**Requirements:** TK-01 through TK-09

**Plans:**
1. **OAuth Flow** — TikTok OAuth 2.0 authorization
2. **Account Info** — Fetch and display TikTok account details
3. **Video Upload** — Upload and publish videos with caption and privacy settings
4. **Native Scheduling** — Schedule video publish via `publish_time` parameter
5. **Video Listing** — List published videos with metrics
6. **Comment Management** — List and reply to comments
7. **Token Management** — Handle TikTok token refresh

**Success Criteria:**
- User can connect TikTok account
- User can upload and publish videos
- User can schedule TikTok posts natively
- User can view and manage comments
- Token refresh works automatically

**Estimated:** 4-6 days

---

## Phase 8: X (Twitter) Integration

**Goal:** Full X account integration via API v2 — tweet creation, media upload, and timeline management.

**Requirements:** X-01 through X-08

**Plans:**
1. **OAuth Flow** — X OAuth 2.0 with PKCE
2. **Account Info** — Fetch and display X account details (handle, followers, avatar)
3. **Tweet Creation** — Create text tweets with optional media attachments
4. **Media Upload** — Implement chunked media upload for images and videos
5. **Timeline** — List recent tweets with engagement metrics
6. **Tweet Deletion** — Delete tweets from the app
7. **Token Management** — Handle X token refresh

**Success Criteria:**
- User can connect X account
- User can create tweets with text and media
- User can view recent tweets and their metrics
- User can delete tweets
- Token refresh works automatically

**Estimated:** 4-5 days

---

## Phase 9: Analytics Aggregation

**Goal:** Build a unified analytics dashboard that aggregates data from all connected platforms.

**Requirements:** ANL-01 through ANL-05

**Plans:**
1. **Cross-Platform Metrics** — Aggregate total posts, total reach, total engagement across all platforms
2. **Per-Platform Cards** — Breakdown cards for each connected platform
3. **Time-Series Charts** — Line charts for views, likes, comments, shares over selectable date ranges
4. **Top Posts** — Table of top performing posts across all platforms with sortable metrics
5. **Data Caching** — Cache analytics data to reduce API calls and improve performance

**Success Criteria:**
- Analytics dashboard shows unified metrics from all platforms
- Charts are interactive with date range selection
- Top posts table is sortable and filterable
- Data is cached and refreshes on demand

**Estimated:** 3-4 days

---

## Phase 10: Production Hardening & CI/CD

**Goal:** Prepare the application for production deployment with tests, security, monitoring, and automated deployment.

**Requirements:** PROD-01 through PROD-08

**Plans:**
1. **Lint & Type Check** — Ensure zero ESLint errors and zero TypeScript errors in strict mode
2. **Unit Tests** — Vitest setup; tests for utilities, API handlers, database queries
3. **Integration Tests** — Playwright E2E tests for auth flows and critical user journeys
4. **CI/CD Pipeline** — GitHub Actions workflow: lint → type-check → test → build
5. **Security Headers** — Configure Next.js security headers (CSP, HSTS, X-Frame-Options)
6. **Error Monitoring** — Sentry integration for production error tracking
7. **Vercel Deployment** — Deploy to Vercel via CLI without GitHub repo linking
8. **Documentation** — API documentation, environment variable guide, deployment runbook

**Success Criteria:**
- Zero lint and type errors
- Unit test coverage > 70%
- E2E tests pass for auth and core flows
- CI/CD pipeline runs successfully on every push
- Security headers pass audit
- Application deploys and runs on Vercel
- Error monitoring captures production issues

**Estimated:** 4-5 days

---

## Timeline Summary

| Phase | Name | Est. Duration | Cumulative |
|-------|------|---------------|------------|
| 1 | Foundation & Auth Hardening | 3-5 days | 3-5 days |
| 2 | Frontend UI/UX (Mock Data) | 5-7 days | 8-12 days |
| 2.1 | Link Shortener | 5-7 days | 13-19 days |
| 3 | Instagram Integration | 7-10 days | 20-29 days |
| 4 | Scheduled Posts | 3-4 days | 23-33 days |
| 5 | Scheduling Engine | 5-7 days | 28-40 days |
| 6 | YouTube Integration | 5-7 days | 33-47 days |
| 7 | TikTok Integration | 4-6 days | 37-53 days |
| 8 | X (Twitter) Integration | 4-5 days | 41-58 days |
| 9 | Analytics Aggregation | 3-4 days | 44-62 days |
| 10 | Production Hardening & CI/CD | 4-5 days | 48-67 days |

**Total Estimated:** 6-9 weeks (depending on parallelization and complexity)

---

## Dependencies

```
Phase 1 (Foundation)
  └── Phase 2 (Frontend UI)
        └── Phase 3 (Instagram)
              └── Phase 4 (Scheduled Posts) ──> Phase 5 (Scheduling Engine)
                                                  └── Phase 6 (YouTube)
                                                  └── Phase 7 (TikTok)
                                                  └── Phase 8 (X)
                                                        └── Phase 9 (Analytics)
                                                              └── Phase 10 (Production)
```

**Parallelizable groups:**
- Phases 6, 7, 8 can run in parallel after Phase 5
- Phase 9 can start as soon as any two of Phases 6-8 are complete

---

## Next Steps

After this roadmap is approved, run `/gsd-plan-phase 1` to create the detailed plan for Phase 1.

---
*Roadmap created: 2026-05-04*
*Last updated: 2026-05-11*
