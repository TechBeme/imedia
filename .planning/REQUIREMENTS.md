# Requirements: iMedia

**Defined:** 2026-05-04
**Core Value:** The owner can compose once and publish or schedule everywhere — with full visibility into performance analytics and account health across all connected platforms.

## v1 Requirements

### Authentication & Security

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign in with Google OAuth
- [ ] **AUTH-03**: User session persists across browser refresh with secure httpOnly cookies
- [ ] **AUTH-04**: Password reset via email link
- [ ] **AUTH-05**: All dashboard routes are protected by server-side auth guard
- [ ] **AUTH-06**: Social media access tokens are encrypted at rest in the database
- [ ] **AUTH-07**: OAuth state parameter validated on callback to prevent CSRF
- [ ] **AUTH-08**: Rate limiting on auth endpoints to prevent brute force

### Internationalization (i18n)

- [ ] **I18N-01**: All UI text is translatable via next-intl (no hardcoded strings)
- [ ] **I18N-02**: Supported locales: pt-BR (default), en, es
- [ ] **I18N-03**: Locale switcher available in header with flag icons
- [ ] **I18N-04**: API error responses return machine-readable codes only (frontend translates)
- [ ] **I18N-05**: Date/time formatting respects user's locale

### Frontend UI/UX (Mock Data Phase)

- [ ] **UI-01**: Dashboard overview page with KPI cards, recent activity, and quick actions (mock data)
- [ ] **UI-02**: Accounts page showing connected platforms with connect/disconnect buttons (mock data)
- [ ] **UI-03**: Compose page with rich post editor, platform selector, media upload preview, and scheduling picker (mock data)
- [ ] **UI-04**: Scheduled posts page with calendar view and list view of upcoming posts (mock data)
- [ ] **UI-05**: History page with filterable table of published posts across all platforms (mock data)
- [ ] **UI-06**: Analytics page with cross-platform charts (line, bar, pie) for views, likes, comments, shares (mock data)
- [ ] **UI-07**: Media library page with grid of uploaded assets, drag-and-drop upload, folders/tags (mock data)
- [ ] **UI-08**: Settings page with profile edit, password change, theme preference, language preference (mock data)
- [ ] **UI-09**: Responsive design: mobile-first, sidebar collapses to sheet on mobile, all pages usable on tablet/phone
- [ ] **UI-10**: Loading states with skeletons, empty states with illustrations, error states with retry actions
- [ ] **UI-11**: Toast notifications for all user actions (success, error, info)
- [ ] **UI-12**: All forms validated with Zod + React Hook Form, showing inline errors

### Instagram Integration (Meta Graph API)

- [ ] **IG-01**: OAuth connection flow for Instagram Business/Creator accounts via Facebook Login
- [ ] **IG-02**: Fetch and display connected Instagram account info (username, follower count, profile picture)
- [ ] **IG-03**: Publish single image posts with caption and alt text
- [ ] **IG-04**: Publish carousel posts (up to 10 images/videos)
- [ ] **IG-05**: Publish Reels with caption
- [ ] **IG-06**: Publish Stories (image and video)
- [ ] **IG-07**: List published posts with media preview, caption, and engagement metrics
- [ ] **IG-08**: Fetch post insights (impressions, reach, engagement, saves, shares)
- [ ] **IG-09**: List comments on posts with author, text, and timestamp
- [ ] **IG-10**: Reply to comments on posts
- [ ] **IG-11**: Hide/delete comments on posts
- [ ] **IG-12**: Disconnect Instagram account and revoke tokens
- [ ] **IG-13**: Handle token refresh on expiry
- [ ] **IG-14**: Respect Instagram rate limits (100 posts/24h) with client-side enforcement

### YouTube Integration (Data API v3)

- [ ] **YT-01**: OAuth connection flow for YouTube channel
- [ ] **YT-02**: Fetch and display connected channel info (name, subscriber count, thumbnail)
- [ ] **YT-03**: Upload videos with title, description, tags, category, privacy status
- [ ] **YT-04**: Upload caption/subtitle files (SRT) to videos
- [ ] **YT-05**: Update video metadata (title, description, tags, thumbnail)
- [ ] **YT-06**: List uploaded videos with thumbnail, title, views, and status
- [ ] **YT-07**: Fetch video analytics (views, likes, comments, watch time)
- [ ] **YT-08**: Schedule video publish via native `publishAt` API
- [ ] **YT-09**: Disconnect YouTube channel and revoke tokens
- [ ] **YT-10**: Handle token refresh on expiry

### TikTok Integration (Content Posting API)

- [ ] **TK-01**: OAuth connection flow for TikTok account
- [ ] **TK-02**: Fetch and display connected account info (username, follower count, avatar)
- [ ] **TK-03**: Upload and publish videos with caption, privacy level, and interaction controls
- [ ] **TK-04**: Schedule video publish via native `publish_time` parameter
- [ ] **TK-05**: List published videos with thumbnail, caption, and metrics
- [ ] **TK-06**: List comments on videos
- [ ] **TK-07**: Reply to comments on videos
- [ ] **TK-08**: Disconnect TikTok account and revoke tokens
- [ ] **TK-09**: Handle token refresh on expiry

### X (Twitter) Integration (API v2)

- [ ] **X-01**: OAuth 2.0 connection flow for X account
- [ ] **X-02**: Fetch and display connected account info (handle, follower count, avatar)
- [ ] **X-03**: Create text posts (tweets) with optional media attachments
- [ ] **X-04**: Upload images and videos via chunked media upload
- [ ] **X-05**: List recent tweets with engagement metrics
- [ ] **X-06**: Delete tweets
- [ ] **X-07**: Disconnect X account and revoke tokens
- [ ] **X-08**: Handle token refresh on expiry

### Scheduling Engine

- [ ] **SCH-01**: User can select date and time when composing a post for any platform
- [ ] **SCH-02**: Native scheduling used for platforms that support it (YouTube, TikTok)
- [ ] **SCH-03**: Internal cron-based scheduler for platforms without native support (Instagram, X)
- [ ] **SCH-04**: Scheduled jobs stored in database with status (pending, processing, completed, failed)
- [ ] **SCH-05**: Vercel Cron job runs every minute to check and execute pending scheduled posts
- [ ] **SCH-06**: User can edit or cancel a scheduled post before it executes
- [ ] **SCH-07**: Failed scheduled posts are retried up to 3 times with exponential backoff
- [ ] **SCH-08**: User receives notification (toast + in-app) when a scheduled post succeeds or fails

### Media Library

- [ ] **MED-01**: User can upload images (JPG, PNG, WebP) and videos (MP4, MOV) to the media library
- [ ] **MED-02**: Uploaded files stored in Vercel Blob with public URLs
- [ ] **MED-03**: Media grid with preview, filename, upload date, file size, and dimensions
- [ ] **MED-04**: User can delete media assets
- [ ] **MED-05**: Media can be selected from library when composing a post
- [ ] **MED-06**: Basic image validation (format, max size 50MB for images, 500MB for videos)

### Analytics Aggregation

- [ ] **ANL-01**: Cross-platform dashboard showing total posts, total reach, total engagement
- [ ] **ANL-02**: Per-platform breakdown cards (Instagram, YouTube, TikTok, X)
- [ ] **ANL-03**: Time-series charts for views, likes, comments, shares over selectable date range
- [ ] **ANL-04**: Top performing posts table across all platforms
- [ ] **ANL-05**: Data fetched from each platform's API and cached for performance

### Database & Backend

- [ ] **DB-01**: Schema supports users, sessions, social accounts, posts, scheduled jobs, media assets, platform credentials
- [ ] **DB-02**: Social account tokens and platform app credentials encrypted with AES-256 before storage
- [ ] **DB-03**: All database migrations managed via Drizzle Kit
- [ ] **DB-04**: API routes follow RESTful patterns with proper HTTP status codes
- [ ] **DB-05**: Input validation on all API endpoints with Zod schemas

### Platform Credentials (Per-User App Configuration)

- [ ] **CRED-01**: User can add platform credentials (App ID + App Secret) for each supported platform (Instagram, YouTube, TikTok, X, Facebook, Threads)
- [ ] **CRED-02**: Credentials are encrypted with AES-256 before storage in the database
- [ ] **CRED-03**: User can view which platforms have credentials configured
- [ ] **CRED-04**: User can update or delete existing platform credentials
- [ ] **CRED-05**: OAuth flows use the user's own configured credentials (not global env vars)
- [ ] **CRED-06**: Validation that credentials are complete before allowing OAuth connection for that platform
- [ ] **CRED-07**: UI guides user on how to create developer apps on each platform (help text, links to developer consoles)

### Webhook Infrastructure (Production-Ready)

- [ ] **WH-01**: Single webhook endpoint per platform (`/api/webhooks/[platform]`) receives all events
- [ ] **WH-02**: Webhook handler responds with HTTP 200 in < 200ms and queues event for background processing
- [ ] **WH-03**: Webhook payload signature verified before processing (HMAC/SHA256 per platform spec)
- [ ] **WH-04**: All events stored in `webhookEvents` table with idempotency check (eventId unique constraint)
- [ ] **WH-05**: Background worker (BullMQ + Redis) processes events with configurable concurrency
- [ ] **WH-06**: Failed events retried with exponential backoff (max 5 retries), dead-letter queue after exhaustion
- [ ] **WH-07**: Event processor identifies user from payload and routes to correct handler
- [ ] **WH-08**: Webhook dashboard shows recent events, status, and retry history (admin view)

### Production Hardening

- [ ] **PROD-01**: ESLint + TypeScript strict mode passes with zero errors
- [ ] **PROD-02**: Unit tests for utility functions, API handlers, and database queries (Vitest)
- [ ] **PROD-03**: Integration tests for auth flows and API endpoints (Playwright)
- [ ] **PROD-04**: CI/CD pipeline via GitHub Actions: lint, type-check, test, build on every push
- [ ] **PROD-05**: Environment variables documented and validated at build time
- [ ] **PROD-06**: Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] **PROD-07**: Error monitoring with Sentry or similar
- [ ] **PROD-08**: Application deploys successfully to Vercel without GitHub repo linking

## v2 Requirements (Deferred)

### AI Features
- **AI-01**: AI-assisted caption generation based on image/video content
- **AI-02**: Content idea suggestions based on trending topics
- **AI-03**: Best time to post recommendations based on audience analytics

### Additional Platforms
- **PLAT-01**: Threads integration (when official API is available)
- **PLAT-02**: Facebook Pages integration
- **PLAT-03**: LinkedIn integration
- **PLAT-04**: Pinterest integration

### Advanced Features
- **ADV-01**: Team collaboration (multi-user access)
- **ADV-02**: Content calendar with drag-and-drop rescheduling
- **ADV-03**: Automated cross-posting rules (e.g., auto-post Instagram to X)
- **ADV-04**: Advanced analytics exports (CSV, PDF reports)
- **ADV-05**: Stripe billing for premium tiers

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / team collaboration | Single-owner app by design for v1 |
| Mobile native app | Web-first; mobile app deferred to v2+ |
| Facebook Page posting (separate from Instagram) | Focus on Instagram first; Pages deferred |
| Threads API | Wait for official API GA |
| AI content generation | Deferred to v2 milestone |
| Stripe billing / subscriptions | Deferred to v2 milestone |
| Real-time chat or live streaming | Not core to publishing workflow |
| LinkedIn, Pinterest, etc. | Future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Pending |
| I18N-01 | Phase 1 | Pending |
| I18N-02 | Phase 1 | Pending |
| I18N-03 | Phase 1 | Pending |
| I18N-04 | Phase 1 | Pending |
| I18N-05 | Phase 1 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |
| UI-06 | Phase 2 | Pending |
| UI-07 | Phase 2 | Pending |
| UI-08 | Phase 2 | Pending |
| UI-09 | Phase 2 | Pending |
| UI-10 | Phase 2 | Pending |
| UI-11 | Phase 2 | Pending |
| UI-12 | Phase 2 | Pending |
| IG-01 | Phase 3 | Pending |
| IG-02 | Phase 3 | Pending |
| IG-03 | Phase 3 | Pending |
| IG-04 | Phase 3 | Pending |
| IG-05 | Phase 3 | Pending |
| IG-06 | Phase 3 | Pending |
| IG-07 | Phase 3 | Pending |
| IG-08 | Phase 3 | Pending |
| IG-09 | Phase 3 | Pending |
| IG-10 | Phase 3 | Pending |
| IG-11 | Phase 3 | Pending |
| IG-12 | Phase 3 | Pending |
| IG-13 | Phase 3 | Pending |
| IG-14 | Phase 3 | Pending |
| MED-01 | Phase 4 | Pending |
| MED-02 | Phase 4 | Pending |
| MED-03 | Phase 4 | Pending |
| MED-04 | Phase 4 | Pending |
| MED-05 | Phase 4 | Pending |
| MED-06 | Phase 4 | Pending |
| SCH-01 | Phase 5 | Pending |
| SCH-02 | Phase 5 | Pending |
| SCH-03 | Phase 5 | Pending |
| SCH-04 | Phase 5 | Pending |
| SCH-05 | Phase 5 | Pending |
| SCH-06 | Phase 5 | Pending |
| SCH-07 | Phase 5 | Pending |
| SCH-08 | Phase 5 | Pending |
| YT-01 | Phase 6 | Pending |
| YT-02 | Phase 6 | Pending |
| YT-03 | Phase 6 | Pending |
| YT-04 | Phase 6 | Pending |
| YT-05 | Phase 6 | Pending |
| YT-06 | Phase 6 | Pending |
| YT-07 | Phase 6 | Pending |
| YT-08 | Phase 6 | Pending |
| YT-09 | Phase 6 | Pending |
| YT-10 | Phase 6 | Pending |
| TK-01 | Phase 7 | Pending |
| TK-02 | Phase 7 | Pending |
| TK-03 | Phase 7 | Pending |
| TK-04 | Phase 7 | Pending |
| TK-05 | Phase 7 | Pending |
| TK-06 | Phase 7 | Pending |
| TK-07 | Phase 7 | Pending |
| TK-08 | Phase 7 | Pending |
| TK-09 | Phase 7 | Pending |
| X-01 | Phase 8 | Pending |
| X-02 | Phase 8 | Pending |
| X-03 | Phase 8 | Pending |
| X-04 | Phase 8 | Pending |
| X-05 | Phase 8 | Pending |
| X-06 | Phase 8 | Pending |
| X-07 | Phase 8 | Pending |
| X-08 | Phase 8 | Pending |
| ANL-01 | Phase 9 | Pending |
| ANL-02 | Phase 9 | Pending |
| ANL-03 | Phase 9 | Pending |
| ANL-04 | Phase 9 | Pending |
| ANL-05 | Phase 9 | Pending |
| PROD-01 | Phase 10 | Pending |
| PROD-02 | Phase 10 | Pending |
| PROD-03 | Phase 10 | Pending |
| PROD-04 | Phase 10 | Pending |
| PROD-05 | Phase 10 | Pending |
| PROD-06 | Phase 10 | Pending |
| PROD-07 | Phase 10 | Pending |
| PROD-08 | Phase 10 | Pending |
| WH-01 | Phase 1 | Pending |
| WH-02 | Phase 1 | Pending |
| WH-03 | Phase 1 | Pending |
| WH-04 | Phase 1 | Pending |
| WH-05 | Phase 1 | Pending |
| WH-06 | Phase 1 | Pending |
| WH-07 | Phase 1 | Pending |
| WH-08 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 89 total
- Mapped to phases: 89
- Unmapped: 0

---
*Requirements defined: 2026-05-04*
*Last updated: 2026-05-04 after project initialization*
