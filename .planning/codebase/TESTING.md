---
last_mapped: 2026-05-04
---

# Testing

## Current State: No Tests Configured

The project has **zero test coverage**. No testing framework is installed or configured.

## What's Missing

| Testing Layer | Status | Framework Needed |
|--------------|--------|-----------------|
| Unit tests | Not present | Vitest or Jest |
| Component tests | Not present | Vitest + React Testing Library |
| Integration tests | Not present | Vitest + MSW |
| E2E tests | Not present | Playwright |
| API route tests | Not present | Vitest + node-mocks-http |

## Test-Related Dependencies

None of the following are in `package.json`:
- `vitest`
- `jest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `playwright`
- `msw` (Mock Service Worker)

## Scripts

The `package.json` scripts do not include any test commands:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

## Areas That Would Benefit from Testing

### Critical Paths
1. **Authentication flow** — `login-form.tsx`, `register-form.tsx`, `src/lib/auth.ts`
2. **Session guard** — `src/app/[locale]/(dashboard)/layout.tsx`
3. **Instagram OAuth** — `src/app/api/instagram/callback/route.ts`
4. **Social accounts API** — `src/app/api/social-accounts/route.ts`

### Component Tests
1. **Sidebar navigation** — Active state, mobile menu, logout
2. **Language switcher** — Locale switching, URL rewriting
3. **Theme toggle** — Dark/light mode persistence
4. **Compose form** — Platform selection, validation, media upload

### Integration Tests
1. **Full login → dashboard flow**
2. **Connect Instagram → account appears in list**
3. **Create post → appears in scheduled/history**

## CI/CD

No CI configuration files found (no `.github/workflows/`, no `vercel.json` in repo).

## Recommendations

1. Add **Vitest** for unit/component testing (fast, Vite-native, works well with Next.js)
2. Add **React Testing Library** for component tests
3. Add **Playwright** for E2E tests on critical flows
4. Add **MSW** for mocking API calls in tests
5. Add test script to `package.json`: `"test": "vitest"`
6. Consider testing the Drizzle schema with a test database
