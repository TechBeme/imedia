# iMedia

A modern social media management and link shortening platform built with Next.js, TypeScript, and PostgreSQL.

## Features

- **Link Shortening** - Create short links with custom slugs, track clicks, and generate QR codes
- **Social Media Management** - Connect Instagram, YouTube, TikTok, X (Twitter), Facebook, and Threads accounts
- **Analytics Dashboard** - Real-time click analytics with device, browser, and geographic breakdowns
- **Scheduled Posts** - Compose and schedule posts across multiple platforms
- **Media Library** - Upload and manage media assets with Vercel Blob
- **Multi-language** - Full i18n support for pt-BR, en, and es
- **Authentication** - Email/password and Google OAuth via better-auth
- **Platform Credentials** - Securely store API credentials for social platforms

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Animations | Motion (Framer Motion) |
| Charts | Recharts |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL |
| Auth | better-auth |
| i18n | next-intl |
| Testing | Vitest + Playwright |
| Rate Limiting | Upstash Redis |
| File Storage | Vercel Blob |

## Project Structure

```
src/
  app/                    # Next.js App Router
    [locale]/             # i18n route segments
      (dashboard)/        # Dashboard layout group
        dashboard/        # Analytics dashboard
        links/            # Link management
        accounts/         # Social accounts
        compose/          # Post composer
        scheduled/        # Scheduled posts
        history/          # Post history
        analytics/        # Link analytics
        media/            # Media library
        settings/         # User settings
      login/              # Authentication pages
      register/
      forgot-password/
      reset-password/
    api/                  # API routes
      auth/               # better-auth handler
      links/              # Link CRUD + analytics
      social-accounts/    # OAuth connections
      platform-credentials/ # API credential storage
      webhooks/           # Platform webhooks
  components/             # React components
    ui/                   # shadcn/ui components
  db/                     # Database config + schema
  lib/                    # Utilities + business logic
    __tests__/            # Unit tests
  i18n/                   # i18n routing config
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Upstash Redis instance (for rate limiting)
- Google OAuth credentials (optional)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd imedia

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random secret for auth tokens |
| `BETTER_AUTH_URL` | Yes | App base URL (e.g., http://localhost:3000) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token for media storage |

## Database Schema

### Core Tables

- **user** - better-auth managed users
- **session** - Active sessions
- **account** - OAuth account links
- **verification** - Email verification tokens

### Domain Tables

- **short_links** - Shortened URLs with metadata
- **link_clicks** - Click tracking with full device/geo data
- **social_accounts** - Connected social media accounts
- **platform_credentials** - Encrypted API credentials
- **scheduled_posts** - Posts queued for publishing
- **post_history** - Published post records
- **domains** - Custom domains for short links

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | ALL | better-auth endpoints |
| `/api/links` | GET/POST | List/create short links |
| `/api/links/[id]` | GET/PATCH/DELETE | Link CRUD |
| `/api/links/[id]/analytics` | GET | Link analytics data |
| `/api/analytics/dashboard` | GET | Dashboard KPIs |
| `/api/social-accounts` | GET/POST | Manage connected accounts |
| `/api/platform-credentials` | GET/POST | Store API credentials |
| `/api/webhooks/[platform]` | POST | Platform webhooks |

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npx playwright test

# Run with coverage
npm test -- --coverage
```

### Test Structure

- `src/lib/__tests__/` - Unit tests for utilities
  - `links.test.ts` - Slug generation/validation
  - `click-tracker.test.ts` - UA parsing and click recording
  - `api-response.test.ts` - Response helpers
  - `api-guard.test.ts` - Rate limit middleware
  - `rate-limit.test.ts` - Redis rate limiting

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## Security

- Input validation via Zod schemas
- Rate limiting on API routes (Upstash Redis)
- Encrypted platform credentials at rest
- httpOnly session cookies
- CSRF protection via better-auth
- SQL injection prevention via Drizzle ORM parameterized queries

## License

MIT
