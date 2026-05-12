# Phase 4: Scheduled Posts — Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Source:** User directive — replace Media Library with Scheduled Posts system

<domain>
## Phase Boundary

This phase delivers a complete scheduled posts system:
- User can schedule posts from the compose page (instead of publishing immediately)
- Scheduled posts are stored in the existing `scheduled_posts` table
- A real-time dashboard shows all scheduled posts with status, countdown, and actions
- For Instagram (no native scheduling API), a cron executor publishes at the scheduled time
- Posts can be edited or cancelled before execution

Out of scope for this phase:
- Native scheduling for YouTube/TikTok (Phase 5/6/7)
- Retry logic with exponential backoff (Phase 5)
- Cross-platform scheduling in one action (future)

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions (D-01 through D-06)

**D-01: Remove Media Library entirely**
- Delete `/media` page, sidebar link, i18n keys, and `mediaAssets` table references
- No migration to drop table needed now; just stop using it

**D-02: Reuse existing `scheduled_posts` table**
- Table already exists with all needed fields: id, userId, postId, platform, content, mediaUrls, scheduledAt, status, errorMessage, executedAt, externalPostId
- No schema changes required

**D-03: Instagram-only scheduling for now**
- Only Instagram has publishing API implemented
- Schedule picker shows only when Instagram is selected
- Future phases add YouTube/TikTok/X scheduling

**D-04: Vercel Cron for execution**
- Use `vercel.json` cron job every 5 minutes
- Query `scheduled_posts` where `status = 'pending'` and `scheduledAt <= now()`
- Publish via existing `/api/instagram/publish` logic

**D-05: Immediate publish bypass**
- "Publish Now" button on scheduled posts to bypass the wait
- Reuses the same publish flow as compose

**D-06: Status lifecycle**
- `pending` → `published` (on successful execution)
- `pending` → `failed` (on error, with errorMessage)
- `pending` → `cancelled` (user action)
- No auto-retry in this phase

### the agent's Discretion

- UI design for the schedule picker (date + time input style)
- Whether to show a countdown timer on the scheduled page
- Sort order default (soonest first)
- How many posts to show per page (if pagination needed)

</decisions>

<canonical_refs>
## Canonical References

### Database Schema
- `src/db/schema.ts` — `scheduled_posts` table definition

### Existing APIs
- `src/app/api/instagram/publish/route.ts` — Publishing endpoint to reuse
- `src/app/api/upload/route.ts` — File upload endpoint

### Existing Pages
- `src/app/[locale]/(dashboard)/compose/page.tsx` — Compose page to modify
- `src/app/[locale]/(dashboard)/scheduled/page.tsx` — Scheduled page to make real

### Components
- `src/components/sidebar.tsx` — Remove media link

### i18n
- `messages/en.json`, `messages/pt-BR.json`, `messages/es.json` — Remove media keys, add scheduled keys

</canonical_refs>

<specifics>
## User Preferences

- Portuguese (pt-BR) is the default locale
- Dark/light theme support required
- Mobile-responsive required
- Use shadcn/ui components
- All text must be i18n-ready

</specifics>
