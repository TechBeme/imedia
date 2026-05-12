# Phase 2: Frontend UI/UX - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the remaining frontend UI/UX improvements for the dashboard:
- Responsive polish across all dashboard pages
- UX micro-interactions (skeleton loaders, empty states, error states)
- Complete removal of the Media Library page and all its references
- Dashboard stays focused on link analytics only (social KPIs deferred)
- Scheduled page stays mock-only (integration deferred to Phase 4)

Pages already real (out of scope): accounts, compose, settings, links, domains, analytics (links)
Pages mock-only (staying mock): scheduled, history, social-analytics

</domain>

<decisions>
## Implementation Decisions

### Dashboard Scope
- **D-01:** Dashboard remains focused on link shortener analytics only. Social media KPIs (total posts, reach, engagement) are deferred until Phase 3 (Instagram insights) and Phase 9 (cross-platform analytics) deliver real data.
- **D-02:** No mock social KPIs will be added to the dashboard. The current `getDashboardAnalytics` from `link-analytics.ts` is the single source of truth.

### Scheduled Page
- **D-03:** The `/scheduled` page stays mock-only in this phase. Real integration with the `scheduledJobs` table and API (built in Phase 4) is explicitly deferred to Phase 4's own plan.
- **D-04:** Phase 4 documentation (ROADMAP.md) must be updated to state that Phase 4 is responsible for wiring the real scheduled posts data into the `/scheduled` page.

### Responsive Polish
- **D-05:** Audit and fix responsive layout issues across all dashboard pages: mobile sidebar sheet already exists, but pages may have overflow, cramped grids, or missing breakpoints.
- **D-06:** Ensure touch-friendly controls on all interactive elements (buttons min 44px, adequate tap targets).
- **D-07:** Test and fix breakpoint behavior for sm/md/lg/xl on: dashboard, scheduled, history, analytics, media (before removal), settings, accounts, compose, links, domains.

### UX Micro-interactions
- **D-08:** Add skeleton loaders to all pages that fetch data: dashboard (already has some), scheduled, history, analytics.
- **D-09:** Add empty states to all data-driven pages: show friendly illustration/message when no data exists instead of blank or broken UI.
- **D-10:** Add error states to all data-driven pages: show retry button and friendly error message when API calls fail.
- **D-11:** Ensure all form validation feedback uses consistent patterns (shadcn form + zod + next-intl error messages).
- **D-12:** Ensure toast notifications are used consistently for success/error feedback on all user actions.

### Media Library Removal
- **D-13:** Completely remove the Media Library feature: delete `/src/app/[locale]/(dashboard)/media/page.tsx`, remove `media` from sidebar navigation, remove all `media.*` i18n keys from `messages/en.json`, `messages/es.json`, `messages/pt-BR.json`.
- **D-14:** Remove any other Media Library references (routes, components, types) if they exist.

</decisions>

<specifics>
## Specific Ideas

- Use the existing `containerVariants` / `itemVariants` pattern from `motion/react` for page-level stagger animations (already established in codebase).
- Skeleton loaders should match the layout structure of the real content (e.g., if a page has a 4-column grid, skeleton should show 4 placeholder cards).
- Empty states should use a consistent illustration style — Lucide icon + heading + description + optional CTA button.
- Error states should use a red-tinted card with `AlertTriangle` icon, error message, and a "Try again" button that re-fetches data.

</specifics>

<canonical_refs>
## Canonical References

### UI Patterns
- `src/components/ui/skeleton.tsx` — shadcn Skeleton component for loading states
- `src/components/link-analytics.tsx` §465-500 — Existing `AnalyticsSkeleton` pattern to replicate
- `src/app/[locale]/(dashboard)/dashboard/dashboard-content.tsx` — Current dashboard with real link analytics

### Phase Dependencies
- `.planning/ROADMAP.md` §Phase 4 — Scheduled posts system (will integrate `/scheduled` page)
- `.planning/ROADMAP.md` §Phase 3 — Instagram insights (will feed social analytics)
- `.planning/ROADMAP.md` §Phase 9 — Cross-platform analytics (will feed dashboard social KPIs)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/skeleton.tsx` — shadcn Skeleton component
- `src/components/link-analytics.tsx` — Has `AnalyticsSkeleton` function as reference pattern
- `src/components/sidebar.tsx` — Mobile sheet already implemented; needs media item removal
- `src/app/[locale]/(dashboard)/layout.tsx` — Dashboard shell with sidebar

### Established Patterns
- Motion animations: `containerVariants` + `itemVariants` with staggerChildren 0.06, duration 0.35
- i18n: All UI text via `useTranslations` from next-intl, keys in `messages/*.json`
- Cards: `glass-card` class for dashboard cards
- Charts: recharts with `tooltipStyle` object for consistent tooltips

### Integration Points
- Dashboard data comes from `getDashboardAnalytics(session.user.id)` in `src/lib/link-analytics.ts`
- Scheduled page is disconnected from API — purely client-side mock
- History page is disconnected from API — purely client-side mock
- Analytics page is disconnected from API — purely client-side mock charts

</code_context>

<deferred>
## Deferred Ideas

- **Social KPIs on dashboard:** Will be implemented when Phase 3 (Instagram insights) and Phase 9 deliver real social analytics data.
- **Scheduled page real data:** Phase 4 will wire the `/scheduled` page to the real `scheduledJobs` API.
- **History page real data:** Phase 3 plan 03-05 will implement post history with real Instagram posts.
- **Social analytics real data:** Phase 3 plan 03-05 will implement insights with real data from Meta Graph API.
- **Media Library:** Feature removed; if needed in the future, it will be built from scratch with a different scope.

</deferred>

---

*Phase: 02-frontend-uiux*
