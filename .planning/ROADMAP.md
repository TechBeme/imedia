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

**Success Criteria:**
- All 8 dashboard pages are visually complete and navigable
- Pages work on mobile, tablet, and desktop
- All interactions have appropriate feedback (loading, success, error)
- Owner can walk through the full user journey with mock data
- No backend API calls beyond existing auth and social-accounts listing

**Estimated:** 5-7 days

---

## Phase 2.1: Link Shortener (INSERTED)

**Goal:** Build a full-featured link shortening tool with custom slugs, QR codes, advanced click analytics, and custom domain support.

**Requirements:** LNK-01 through LNK-12

**Plans:**
- [ ] **02.1-01-PLAN.md** — Database Schema & Core API (shortLinks/linkClicks tables, POST /api/links, GET /[slug] redirect with click tracking)
- [ ] **02.1-02-PLAN.md** — Link Management UI & Public Shorten Page (dashboard links page, link card/form components, public /s page, password prompt)
- [ ] **02.1-03-PLAN.md** — Analytics Dashboard & QR Codes (analytics API with aggregations, charts with recharts, QR code generation PNG/SVG)
- [ ] **02.1-04-PLAN.md** — Custom Domains (customDomains table, DNS TXT verification, domain management UI, middleware routing)
- [ ] **02.1-05-PLAN.md** — Integration & Finalization (sidebar nav, migrations, build verification)

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

**Estimated:** 5-7 days

---

## Phase 3: Instagram Integration

**Goal:** Full Instagram Business/Creator account integration via Meta Graph API — publishing, insights, and comment management.

**Requirements:** IG-01 through IG-14

**Plans:**
1. **OAuth Refinement** — Ensure Instagram OAuth flow handles all edge cases (token refresh, re-auth, multiple accounts)
2. **Account Info** — Fetch and display Instagram account details (username, followers, profile pic, bio)
3. **Image Publishing** — Implement single image post with caption and alt text
4. **Carousel Publishing** — Implement multi-image/video carousel posts (up to 10 items)
5. **Reels Publishing** — Implement Reels upload with caption and cover selection
6. **Stories Publishing** — Implement Stories upload (image and video)
7. **Post Listing** — Fetch and display user's published posts with media preview and metrics
8. **Insights** — Fetch post-level insights (impressions, reach, engagement, saves, shares)
9. **Comment Management** — List comments, reply to comments, hide/delete comments
10. **Rate Limiting** — Client-side enforcement of 100 posts/24h limit with user-facing warnings
11. **Error Handling** — Graceful handling of API errors (token expiry, PPA required, rate limited)

**Success Criteria:**
- User can connect Instagram Business account
- User can publish images, carousels, reels, and stories
- User can view published posts and their insights
- User can manage comments (reply, hide, delete)
- Rate limits are enforced and communicated to user
- All errors show helpful messages

**Estimated:** 7-10 days

---

## Phase 4: Media Library

**Goal:** Build a functional media library for uploading, organizing, and reusing assets across all platforms.

**Requirements:** MED-01 through MED-06

**Plans:**
1. **Upload API** — Vercel Blob integration for image and video uploads with validation
2. **Media Schema** — Database table for media assets with metadata (filename, size, dimensions, mimeType, url, tags)
3. **Media Grid UI** — Display uploaded assets with preview, metadata, and actions
4. **Upload Zone** — Drag-and-drop upload component with progress indicator
5. **Media Selection** — Integrate media picker into compose page for selecting existing assets
6. **Delete & Cleanup** — Delete media from library and Blob storage

**Success Criteria:**
- User can upload images and videos via drag-and-drop
- Uploaded media appears in the library grid with previews
- User can select media from library when composing a post
- User can delete media assets
- File validation prevents invalid formats and oversized files

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
| 4 | Media Library | 3-4 days | 23-33 days |
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
              └── Phase 4 (Media Library) ──> Phase 5 (Scheduling)
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
*Last updated: 2026-05-04*
