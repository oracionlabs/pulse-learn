# Pulse — Micro-Learning Platform

> Short, AI-powered workshops that fit in the flow of work.

Pulse is a full-stack SaaS platform for delivering 5-minute training workshops to employees. It supports security awareness, compliance, onboarding, sales enablement, and customer education — all from the same engine.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| Backend | NestJS 11, TypeScript, Mongoose |
| Database | MongoDB |
| Cache | Redis |
| Auth | NextAuth v5 + NestJS Passport JWT |
| Email | Resend |
| Payments | Stripe (test mode) |
| AI | Anthropic claude-opus-4-7 |
| File storage | Cloudinary |
| Analytics | PostHog |
| Monitoring | Sentry |
| CI/CD | GitHub Actions → Vercel (web) + Railway (API) |

---

## Features

- **Workshop engine** — content, quiz, scenario, reflection, and video steps with drag-and-drop reordering
- **AI generator** — describe a topic, get a complete workshop with steps in ~10 seconds
- **Learner portal** — animated step-by-step playback with real-time score tracking
- **Assignment engine** — assign to individuals, departments, or entire org with due dates and priorities
- **Leaderboard & badges** — Redis sorted-set leaderboard, 9 badge types, streak tracking
- **Notifications** — in-app bell with unread count, mark-read, mark-all-read
- **Admin dashboard** — completion trends, overdue alerts, department breakdown, activity feed
- **Reporting** — per-workshop reports, user progress, department comparison, CSV export
- **Billing** — Stripe Checkout, plan tiers (Free / Starter / Pro / Enterprise)
- **User management** — invite by email, role-based access (org_admin, manager, learner)
- **Departments** — CRUD with manager assignment and hierarchy
- **Directory sync** — mock Google Workspace and Microsoft 365 importers (swap-ready for real OAuth)
- **File uploads** — Cloudinary image upload for logos and workshop media
- **Security** — Helmet, rate limiting, input validation, gzip compression

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for MongoDB + Redis)

### 1. Clone and install

```bash
git clone <repo-url>
cd pulse-learn
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts MongoDB on port 27017 and Redis on port 6379.

### 3. Environment variables

Create `apps/api/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/pulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
RESEND_API_KEY=re_xxx            # optional — emails logged to console if missing
CLOUDINARY_CLOUD_NAME=xxx        # optional — returns placeholder if missing
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
ANTHROPIC_API_KEY=sk-ant-xxx     # optional — AI generation disabled if missing
STRIPE_SECRET_KEY=sk_test_xxx    # optional — mock checkout if missing
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:3000
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx  # optional
```

### 4. Seed the database

```bash
pnpm --filter api seed
```

This creates 2 organisations, 30 users, and 5 published workshops.

**Seed accounts:**

| Role | Email | Password |
|------|-------|----------|
| Org Admin | admin@acme.com | password123 |
| Manager | sarah.chen@acme.com | password123 |
| Learner | liam.johnson@acme.com | password123 |

### 5. Start the dev servers

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Project Structure

```
pulse-learn/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (marketing)/  # Landing page, pricing
│   │       │   ├── (auth)/       # Login, register, invite
│   │       │   ├── (learner)/    # /learn/* — learner portal
│   │       │   └── (admin)/      # Dashboard, workshops, users…
│   │       ├── components/
│   │       │   ├── ui/           # Button, Card, Input, Badge…
│   │       │   ├── dashboard/    # Charts, stat cards
│   │       │   └── layout/       # Sidebar, topbar
│   │       └── lib/              # api.ts, auth.ts, posthog.ts, utils.ts
│   │
│   └── api/                    # NestJS backend
│       └── src/
│           ├── auth/           # Passport JWT, login, register, invite
│           ├── users/          # User CRUD, invite service
│           ├── organizations/  # Org CRUD + settings
│           ├── departments/    # Department CRUD
│           ├── workshops/      # Workshop engine + step builder
│           ├── assignments/    # Assignment engine + cron
│           ├── sessions/       # Playback, scoring, streaks
│           ├── badges/         # Badge definitions + award logic
│           ├── notifications/  # In-app notification center
│           ├── leaderboard/    # Redis sorted-set leaderboard
│           ├── stats/          # Reporting + CSV export
│           ├── ai/             # OpenAI workshop generator
│           ├── billing/        # Stripe Checkout + webhooks
│           ├── upload/         # Cloudinary file upload
│           ├── sso/            # Mock Google + Microsoft importers
│           └── health/         # Health check endpoint
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│
├── .github/
│   └── workflows/ci.yml        # Lint → test → build → deploy
├── docker-compose.yml
└── REGRESSION.md               # Manual QA test plan (22 journeys)
```

---

## API Overview

```
POST   /auth/login
POST   /auth/register
POST   /auth/invite
POST   /auth/accept-invite

GET    /orgs/:orgId
PUT    /orgs/:orgId
GET    /orgs/:orgId/workshops         ?page=1&limit=20
POST   /orgs/:orgId/workshops
POST   /orgs/:orgId/workshops/:id/publish
POST   /orgs/:orgId/workshops/:id/steps
GET    /orgs/:orgId/assignments
POST   /orgs/:orgId/assignments
GET    /orgs/:orgId/departments
POST   /orgs/:orgId/departments
GET    /orgs/:orgId/leaderboard
GET    /orgs/:orgId/stats
GET    /orgs/:orgId/stats/export/sessions.csv
POST   /orgs/:orgId/ai/generate-workshop
POST   /orgs/:orgId/billing/checkout
POST   /orgs/:orgId/sso/sync/google
POST   /orgs/:orgId/sso/sync/microsoft

POST   /sessions/start
POST   /sessions/:id/respond
POST   /sessions/:id/complete
GET    /sessions/:id

GET    /users/me/sessions
GET    /users/me/badges
GET    /users/me/notifications
GET    /users/me/notifications/unread-count
PATCH  /users/me/notifications/read-all

POST   /upload
GET    /health
```

---

## Testing

```bash
# Unit tests
pnpm --filter api test

# Watch mode
pnpm --filter api test:watch

# Coverage
pnpm --filter api test:cov
```

Covered:
- Auth service (login, register)
- Workshops service (findOne, recalcTotalPoints, findTemplates)
- Badges service (checkAndAwardBadges, all badge types)

---

## Deployment

### Secrets required (GitHub Actions)

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway deploy token |
| `VERCEL_TOKEN` | Vercel CLI token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `NEXTAUTH_SECRET` | Production NextAuth secret |
| `NEXTAUTH_URL` | Production URL (e.g. https://app.pulse.ai) |
| `NEXT_PUBLIC_API_URL` | Production API URL |

The CI pipeline runs on every push to `main` or `develop`:
1. Lint + type check (both apps)
2. API unit tests
3. Build (both apps)
4. Deploy to Railway (API) + Vercel (web) — main branch only

---

## Real vs Mock integrations

| Integration | Status | Notes |
|------------|--------|-------|
| Auth (email/password) | ✅ Real | JWT + bcrypt |
| Email (Resend) | ✅ Real | 100 emails/day free tier |
| Payments (Stripe) | ✅ Real (test mode) | Flip keys to go live |
| AI (Anthropic) | ✅ Real | claude-opus-4-7, pay per use |
| File uploads (Cloudinary) | ✅ Real | Returns placeholder if no key |
| Analytics (PostHog) | ✅ Real | Skips if no key |
| Google SSO | ⚠️ Mock | Swap `fetchProviderUsers()` for Admin SDK |
| Microsoft SSO | ⚠️ Mock | Swap for Microsoft Graph /users |

---

## Development

This project was built with AI-assisted development using [Claude](https://claude.ai) (Anthropic). Claude was used to accelerate implementation across the full stack — API modules, frontend pages, tests, CI/CD pipeline, and deployment configuration. All product decisions, architecture direction, and quality review were human-led.

**Development time:** Under 1 day (vs. an estimated 10-week manual build)

> **Disclaimer:** This codebase was produced with significant AI assistance. It is provided as-is. Conduct your own security review before deploying to production with real user data.

---

## License

MIT
