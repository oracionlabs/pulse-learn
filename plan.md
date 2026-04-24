# Product Plan: Micro-Learning Platform

**Working Name: Pulse** — Short workshops that stick
A white-label micro-learning platform for companies that want to train employees without boring them.

---

## Vision

Replace hour-long SCORM slideshows with 5-minute, chat-driven workshops that drop into people's day and actually change behavior. The platform is vertical-agnostic — security awareness, compliance, onboarding, sales enablement, customer education — same engine, different content.

---

## Target Verticals

| Vertical | Example Content | Buyer |
|----------|----------------|-------|
| Security Awareness | Phishing, password hygiene, social engineering | IT / CISO |
| Compliance | HIPAA, GDPR, SOC2, anti-harassment, workplace safety | Legal / HR |
| Employee Onboarding | Company policies, tools, culture, team intros | HR / People Ops |
| Sales Enablement | Product knowledge, objection handling, pitch practice | Sales Leadership |
| Customer Education | Product onboarding, feature adoption, best practices | Customer Success |

The platform doesn't prescribe a vertical — orgs choose (or mix) when they set up.

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js 15 (App Router), React 19, TypeScript | SSR for SEO (marketing pages), App Router for dashboard |
| Styling | Tailwind v4 + Radix UI | Utility-first + accessible unstyled primitives |
| Animation | Framer Motion | Chat playback needs to feel alive |
| State | Redux Toolkit (global) + TanStack Query (server) | Predictable global state + smart caching |
| Backend | NestJS 11, TypeScript | Modular, testable, enterprise-grade |
| ORM | Mongoose ODM | MongoDB is natural for flexible workshop content |
| Database | MongoDB Atlas (free tier → paid) | Document model fits workshops, steps, responses |
| Cache/Realtime | Redis (Upstash free tier) | Leaderboard sorted sets, session cache, rate limiting |
| Auth | NextAuth v5 + NestJS Passport | Real credentials auth, architected for SSO swap-in |
| Email | Resend (free tier: 100/day) | Real transactional emails, generous free tier |
| File Storage | Cloudinary (free tier: 25 credits/mo) | Workshop media, org logos, user avatars |
| Payments | Stripe (test mode) | Real integration, no charges until you go live |
| SSO | Mock (architected for real) | Google Workspace, Microsoft 365, Okta — mock importers with real interface contracts |
| AI | OpenAI API (pay-per-use) | Workshop generation, content suggestions |
| Analytics | PostHog (free tier: 1M events/mo) | Product analytics, feature flags |
| Testing | Vitest + Testing Library + Supertest | Unit, component, API integration tests |
| CI/CD | GitHub Actions | Lint, test, deploy on push |
| Deploy | Vercel (frontend) + Railway (NestJS + MongoDB + Redis) | Free/cheap tiers, easy scaling later |
| Monitoring | Sentry (free tier) | Error tracking in production |

### Real vs. Mocked Integration Map

| Integration | Status | Cost | Swap Path |
|------------|--------|------|-----------|
| Auth (email/password) | ✅ Real | Free | Already real |
| Email (Resend) | ✅ Real | Free (100/day) | Already real, upgrade tier for volume |
| File uploads (Cloudinary) | ✅ Real | Free (25 credits) | Already real, upgrade or swap to S3 |
| Payments (Stripe) | ✅ Real (test mode) | Free until live | Flip to live mode + add webhook endpoint |
| PostHog analytics | ✅ Real | Free (1M events) | Already real |
| Sentry monitoring | ✅ Real | Free tier | Already real |
| Google Workspace SSO | ⚠️ Mocked | Free (Google Cloud) | Swap mock importer for real Google Admin SDK |
| Microsoft 365 SSO | ⚠️ Mocked | Free (Azure AD) | Swap mock for Microsoft Graph API |
| Okta SSO | ⚠️ Mocked | Paid (Okta dev account free) | Swap mock for Okta SDK |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│         Next.js 15 (App Router)                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Marketing│  │ Learner  │  │    Admin       │  │
│  │  Pages   │  │ Portal   │  │   Dashboard    │  │
│  │ (public) │  │ (auth)   │  │   (auth)       │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ API calls
┌──────────────────────▼──────────────────────────┐
│                   BACKEND                        │
│              NestJS 11 API                       │
│                                                  │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────────┐  │
│  │ Auth │ │Workshop│ │ Org  │ │  Reporting   │  │
│  │Module│ │ Engine │ │Module│ │   Module     │  │
│  └──────┘ └────────┘ └──────┘ └─────────────┘  │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────────┐  │
│  │Assign│ │Billing │ │Notify│ │     AI       │  │
│  │Engine│ │ Module │ │Module│ │   Module     │  │
│  └──────┘ └────────┘ └──────┘ └─────────────┘  │
└───────┬────────────┬────────────┬───────────────┘
        │            │            │
   ┌────▼───┐  ┌─────▼────┐  ┌───▼────┐
   │MongoDB │  │  Redis    │  │External│
   │ Atlas  │  │ (Upstash) │  │Services│
   └────────┘  └──────────┘  └────────┘
                              (Resend, Stripe,
                               Cloudinary, OpenAI,
                               Sentry, PostHog)
```

---

## Database Schema (MongoDB)

### Core

**organizations**
```
_id, name, slug, domain, logo_url, plan (free | starter | pro | enterprise),
verticals[] (security | compliance | onboarding | sales | customer_ed),
settings: {
  ssoProvider (none | google | microsoft | okta),
  ssoConfig: {},
  defaultTimezone,
  brandColor,
  customDomain (pro+),
  workshopReminders (boolean),
  leaderboardEnabled (boolean)
},
subscription: {
  stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd
},
createdAt, updatedAt
```

**users**
```
_id, orgId (ref), email, passwordHash (nullable if SSO), name, avatar_url,
role (super_admin | org_admin | manager | learner),
department, title, ssoId, ssoProvider,
preferences: { timezone, emailNotifications, language },
status (active | invited | deactivated),
lastLoginAt, invitedBy, invitedAt, createdAt, updatedAt
```

**departments**
```
_id, orgId (ref), name, managerId (ref users), parentDepartmentId (nullable — for hierarchy),
memberCount (denormalized), createdAt
```

### Workshop Engine

**workshops**
```
_id, orgId (ref, nullable — null for global templates), title, description,
topic, vertical (security | compliance | onboarding | sales | customer_ed | general),
difficulty (beginner | intermediate | advanced),
estimatedMinutes, tags[],
steps[]: {
  stepId (uuid), order, type (content | quiz | scenario | reflection | video),
  title,
  content: {
    body (markdown/HTML),
    mediaUrl (nullable),
    mediaType (image | video | null)
  },
  quiz: {
    question, options[], correctAnswerIndex, explanation
  },
  scenario: {
    prompt,
    choices[]: { text, nextStepId (for branching), feedback, isCorrect }
  },
  reflection: {
    prompt, minLength, maxLength
  },
  personalization: {
    variables[] (user.name, user.department, org.name, etc.)
  },
  animationType (slide_up | fade_in | bounce | typewriter),
  points (score value for this step)
},
totalPoints (sum of step points),
isTemplate (boolean), isPublished (boolean),
createdBy (ref users), publishedAt,
version, previousVersionId (nullable),
createdAt, updatedAt
```

**workshop_categories**
```
_id, orgId (ref), name, description, icon, color, order, createdAt
```

### Assignment & Progress

**assignments**
```
_id, orgId, workshopId (ref), 
assignedTo: { type (user | department | org), id },
assignedBy (ref users),
dueDate, priority (required | recommended | optional),
status (pending | in_progress | completed | overdue | cancelled),
completionRate (denormalized — % of target users who completed),
createdAt, updatedAt
```

**workshop_sessions**
```
_id, userId (ref), workshopId (ref), assignmentId (ref, nullable),
orgId (ref),
currentStepIndex, status (in_progress | completed | abandoned),
responses[]: {
  stepId, stepType, answer, isCorrect (nullable), points,
  startedAt, completedAt
},
score, maxScore, scorePercent,
startedAt, completedAt, lastActivityAt,
timeSpentSeconds, deviceType (desktop | mobile | tablet),
resumeCount (how many times they came back)
```

### Leaderboard & Gamification

**leaderboard_entries**  *(also cached in Redis sorted sets)*
```
_id, orgId, userId, 
totalScore, workshopsCompleted, questionsCorrect, questionsTotal,
currentStreak, longestStreak, lastActivityAt,
rank (denormalized), previousRank,
badges[]: { type (fast_learner | perfect_score | streak_7 | first_workshop | ...), earnedAt }
```

**badges** *(badge definitions)*
```
_id, name, description, icon, criteria: { type, threshold },
createdAt
```

### Billing

**subscriptions**
```
_id, orgId, plan (free | starter | pro | enterprise),
stripeCustomerId, stripeSubscriptionId, stripePriceId,
status (trialing | active | past_due | cancelled | paused),
trialEndsAt, currentPeriodStart, currentPeriodEnd,
cancelAt, cancelledAt,
seats: { included, used, overage },
createdAt, updatedAt
```

**invoices** *(synced from Stripe webhooks)*
```
_id, orgId, stripeInvoiceId, amountCents, currency, status,
periodStart, periodEnd, paidAt, invoiceUrl, createdAt
```

### Communication

**notifications**
```
_id, userId, orgId, type (assignment | reminder | completion | streak | badge | system),
title, body, link, channel (in_app | email | both),
read, readAt, emailSent, emailSentAt, createdAt
```

**notification_preferences**
```
_id, userId, 
channels: {
  assignment: { inApp, email },
  reminder: { inApp, email },
  completion: { inApp, email },
  streak: { inApp, email },
  badge: { inApp, email },
  system: { inApp, email }
}
```

---

## Feature Breakdown by Phase

### Phase 1: Core Platform (Weeks 1–3)
*Goal: A working platform one person could demo or use internally.*

#### 1.1 Auth & Multi-Tenancy
- [ ] Email/password registration and login (NextAuth v5)
- [ ] JWT tokens with refresh rotation
- [ ] Org creation on signup (auto-create org for first user)
- [ ] Invite users via email (Resend) — generates invite link
- [ ] Role-based access: super_admin, org_admin, manager, learner
- [ ] Role guards on both frontend routes and API endpoints
- [ ] User profile management with avatar upload (Cloudinary)

#### 1.2 Workshop Engine
- [ ] Workshop CRUD with all step types (content, quiz, scenario, reflection, video)
- [ ] Step builder UI with drag-and-drop reordering (dnd-kit)
- [ ] Markdown editor for content steps (MDX or simple markdown)
- [ ] Quiz builder: question, options, correct answer, explanation
- [ ] Scenario builder: branching choices with feedback per choice
- [ ] Reflection step: prompt with min/max length
- [ ] Media upload for steps (images, video embed URLs)
- [ ] Personalization variable insertion (`{{user.name}}`, etc.)
- [ ] Workshop preview mode (admin plays through without saving session)
- [ ] Publish/unpublish toggle
- [ ] Template system: global templates + org-specific workshops
- [ ] Clone template to customize
- [ ] Workshop versioning (edit creates new version, old sessions reference old version)
- [ ] Workshop categories for organization

#### 1.3 Learner Experience
- [ ] Learner dashboard: my assignments, continue where I left off, completed history
- [ ] Chat-driven playback UI with Framer Motion animations
- [ ] Content step: styled markdown rendering with media
- [ ] Quiz step: tappable cards, instant feedback with correct/incorrect animation, explanation reveal
- [ ] Scenario step: choice cards, branching with feedback, path reveal
- [ ] Reflection step: text input with character count and thoughtful prompt
- [ ] Progress bar (steps completed / total)
- [ ] Real-time score tracking visible during workshop
- [ ] Session auto-save on each step completion
- [ ] Resume interrupted workshops
- [ ] Completion screen: score, time, key takeaways, badge earned (if applicable)
- [ ] "Next up" recommendation on completion
- [ ] Mobile-responsive playback (this must work well on phones)

#### 1.4 Assignment Engine
- [ ] Assign workshops to: individual users, departments, entire org
- [ ] Due dates with priority levels (required, recommended, optional)
- [ ] Assignment status tracking: pending → in_progress → completed / overdue
- [ ] Overdue detection via NestJS scheduled cron (runs daily)
- [ ] Overdue notifications (in-app + email via Resend)
- [ ] Bulk assignment from user list with filters
- [ ] Assignment completion rate tracking (% of target who completed)

#### 1.5 Basic Admin Dashboard
- [ ] Overview cards: total users, active workshops, completion rate, avg score
- [ ] Completion trend chart (workshops completed per week)
- [ ] Department engagement breakdown
- [ ] Overdue assignments alert list
- [ ] Recent activity feed

---

### Phase 2: Engagement & Reporting (Weeks 4–5)
*Goal: Make admins love the data and learners want to come back.*

#### 2.1 Leaderboard & Gamification
- [ ] Redis sorted set leaderboard (ZADD on completion, ZREVRANGE for rankings)
- [ ] Leaderboard page: rank, name, score, streak, badges
- [ ] Department-level leaderboard
- [ ] Streak tracking: consecutive days/weeks with completions
- [ ] Badge system: fast_learner, perfect_score, streak_7, streak_30, first_workshop, completionist
- [ ] Badge earned notification with animation
- [ ] Leaderboard opt-out per user (privacy preference)

#### 2.2 Advanced Reporting
- [ ] Per-workshop report: completion rate, avg score, time distribution, drop-off by step
- [ ] Question-level analysis: which questions are missed most, answer distribution
- [ ] User progress report: workshops completed, scores, streaks, last active
- [ ] Department report: completion rates by department, comparison view
- [ ] Time-based trends: weekly/monthly completion and engagement
- [ ] Export all reports to CSV
- [ ] Scheduled report emails (weekly digest to admins via Resend)

#### 2.3 AI Workshop Generator
- [ ] Topic input form with vertical selector and difficulty
- [ ] AI generates complete workshop (5–8 steps) with streaming output
- [ ] Generated content appears in the step builder for editing
- [ ] Admin can accept, edit, add, remove steps before publishing
- [ ] AI content suggestions: "make this more engaging", "add a quiz here", "simplify this"
- [ ] Save AI generation history per org

#### 2.4 Notifications System
- [ ] In-app notification center (bell icon, dropdown, unread count)
- [ ] Notification types: new assignment, due date reminder (3 days, 1 day), overdue, completion confirmation, badge earned, streak milestone
- [ ] Email notifications via Resend (real transactional emails)
- [ ] Per-user notification preferences (which types, which channels)
- [ ] Admin announcements to org/department

---

### Phase 3: Organization & Growth (Weeks 6–8)
*Goal: Make it ready for real organizations to use.*

#### 3.1 Organization Management
- [ ] Org settings page: name, logo, brand color, timezone, defaults
- [ ] Department CRUD with hierarchy (parent/child departments)
- [ ] User management: invite, edit role, deactivate, search/filter
- [ ] Bulk user invite via CSV upload
- [ ] Mock SSO importers (Google Workspace, Microsoft 365)
  - Read from structured JSON simulating real API responses
  - Diff-based sync: add new, deactivate removed, update changed
  - Architected with clear interface so real OAuth can be swapped in
  - Document the swap path in code comments and README
- [ ] User deactivation (soft delete — preserves history)
- [ ] Org-level workshop library (vs global templates)

#### 3.2 Billing & Plans (Stripe Test Mode)
- [ ] Plan tiers:
  - **Free:** 10 users, 3 workshops, basic reporting
  - **Starter ($49/mo):** 50 users, unlimited workshops, full reporting
  - **Pro ($149/mo):** 200 users, AI generator, custom branding, CSV export
  - **Enterprise (custom):** Unlimited, SSO, API access, dedicated support
- [ ] Stripe Checkout integration (test mode — no real charges)
- [ ] Subscription management: upgrade, downgrade, cancel
- [ ] Stripe webhook handling: invoice.paid, subscription.updated, subscription.deleted
- [ ] Usage tracking: seats used vs included
- [ ] Plan limit enforcement (e.g., free plan can't create more than 3 workshops)
- [ ] Billing page: current plan, usage, invoices, payment method

#### 3.3 Marketing Site
- [ ] Landing page with value proposition, features, pricing
- [ ] Pricing page with plan comparison
- [ ] Simple blog (MDX or Strapi for content)
- [ ] SEO basics: meta tags, OG images, sitemap
- [ ] CTA → signup flow

---

### Phase 4: Polish & Production (Weeks 9–10)
*Goal: Production-ready quality.*

#### 4.1 Testing
- [ ] Unit tests for business logic (billing calculations, scoring, streak logic)
- [ ] API integration tests with Supertest (all major endpoints)
- [ ] Component tests with Testing Library (key UI flows)
- [ ] E2E tests for critical paths: signup → create workshop → assign → complete (Playwright)
- [ ] Target: 70%+ coverage on backend, critical path coverage on frontend

#### 4.2 Security
- [ ] Rate limiting on auth endpoints (Redis-based)
- [ ] Input validation on all API endpoints (class-validator in NestJS)
- [ ] CSRF protection
- [ ] Helmet.js security headers
- [ ] MongoDB injection prevention (Mongoose handles most, but audit)
- [ ] File upload validation (type, size limits)
- [ ] API key management for future API access tier

#### 4.3 Performance
- [ ] MongoDB indexes on frequently queried fields (orgId, userId, status, etc.)
- [ ] Redis caching for leaderboard, dashboard stats, session data
- [ ] Image optimization via Cloudinary transforms
- [ ] Next.js ISR for marketing pages
- [ ] Lazy loading for dashboard charts and heavy components
- [ ] Pagination on all list endpoints (cursor-based)
- [ ] Bundle analysis and code splitting

#### 4.4 Observability
- [ ] Sentry integration for error tracking (frontend + backend)
- [ ] PostHog for product analytics (signups, workshop completions, feature usage)
- [ ] Structured logging in NestJS (pino)
- [ ] Health check endpoint
- [ ] Uptime monitoring (free tier: UptimeRobot or similar)

#### 4.5 CI/CD
- [ ] GitHub Actions pipeline: lint → test → build → deploy
- [ ] Separate staging and production environments
- [ ] Environment variable management
- [ ] Database migration strategy (Mongoose doesn't have formal migrations — document schema evolution approach)
- [ ] Seed scripts for development and staging

#### 4.6 Accessibility
- [ ] Keyboard navigation for workshop playback
- [ ] ARIA labels on interactive elements
- [ ] Focus management during chat-style step transitions
- [ ] Color contrast compliance (WCAG AA)
- [ ] Screen reader testing on key flows

---

## API Route Structure

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/invite (admin)

# Organizations
GET    /api/orgs/:orgId
PUT    /api/orgs/:orgId
PUT    /api/orgs/:orgId/settings
PUT    /api/orgs/:orgId/branding
POST   /api/orgs/:orgId/sso/sync (mock)

# Users
GET    /api/orgs/:orgId/users
POST   /api/orgs/:orgId/users
POST   /api/orgs/:orgId/users/bulk-invite
GET    /api/orgs/:orgId/users/:userId
PUT    /api/orgs/:orgId/users/:userId
DELETE /api/orgs/:orgId/users/:userId (soft delete)

# Departments
GET    /api/orgs/:orgId/departments
POST   /api/orgs/:orgId/departments
PUT    /api/orgs/:orgId/departments/:deptId
DELETE /api/orgs/:orgId/departments/:deptId

# Workshops
GET    /api/workshops (global templates)
GET    /api/orgs/:orgId/workshops
POST   /api/orgs/:orgId/workshops
GET    /api/orgs/:orgId/workshops/:workshopId
PUT    /api/orgs/:orgId/workshops/:workshopId
DELETE /api/orgs/:orgId/workshops/:workshopId
POST   /api/orgs/:orgId/workshops/:workshopId/publish
POST   /api/orgs/:orgId/workshops/:workshopId/clone
POST   /api/orgs/:orgId/workshops/:workshopId/steps (add step)
PUT    /api/orgs/:orgId/workshops/:workshopId/steps/:stepId
DELETE /api/orgs/:orgId/workshops/:workshopId/steps/:stepId
PUT    /api/orgs/:orgId/workshops/:workshopId/steps/reorder

# Workshop Categories
GET    /api/orgs/:orgId/categories
POST   /api/orgs/:orgId/categories
PUT    /api/orgs/:orgId/categories/:catId
DELETE /api/orgs/:orgId/categories/:catId

# Assignments
GET    /api/orgs/:orgId/assignments
POST   /api/orgs/:orgId/assignments
GET    /api/orgs/:orgId/assignments/:assignmentId
PUT    /api/orgs/:orgId/assignments/:assignmentId
DELETE /api/orgs/:orgId/assignments/:assignmentId
GET    /api/users/me/assignments (learner's assignments)

# Sessions (Learner Playback)
POST   /api/sessions/start
POST   /api/sessions/:sessionId/respond
GET    /api/sessions/:sessionId
POST   /api/sessions/:sessionId/complete
GET    /api/users/me/sessions (my history)

# Leaderboard
GET    /api/orgs/:orgId/leaderboard
GET    /api/orgs/:orgId/leaderboard/department/:deptId
GET    /api/users/me/rank

# Reporting
GET    /api/orgs/:orgId/reports/overview
GET    /api/orgs/:orgId/reports/workshops/:workshopId
GET    /api/orgs/:orgId/reports/users/:userId
GET    /api/orgs/:orgId/reports/departments/:deptId
GET    /api/orgs/:orgId/reports/trends
GET    /api/orgs/:orgId/reports/export (CSV)

# Notifications
GET    /api/users/me/notifications
PUT    /api/users/me/notifications/:id/read
PUT    /api/users/me/notifications/read-all
GET    /api/users/me/notification-preferences
PUT    /api/users/me/notification-preferences
POST   /api/orgs/:orgId/announcements

# AI
POST   /api/ai/generate-workshop
POST   /api/ai/suggest-content
POST   /api/ai/improve-step

# Billing (Stripe test mode)
GET    /api/orgs/:orgId/billing
POST   /api/orgs/:orgId/billing/checkout
POST   /api/orgs/:orgId/billing/portal (Stripe Customer Portal)
GET    /api/orgs/:orgId/billing/invoices
POST   /api/webhooks/stripe

# Files
POST   /api/upload (Cloudinary)
```

---

## Pricing Model

| | Free | Starter | Pro | Enterprise |
|---|------|---------|-----|------------|
| Price | $0 | $49/mo | $149/mo | Custom |
| Users | 10 | 50 | 200 | Unlimited |
| Workshops | 3 | Unlimited | Unlimited | Unlimited |
| AI Generator | ✗ | 10/mo | Unlimited | Unlimited |
| Reporting | Basic | Full | Full + Export | Full + API |
| Leaderboard | ✓ | ✓ | ✓ | ✓ |
| Custom Branding | ✗ | ✗ | ✓ | ✓ |
| SSO | ✗ | ✗ | ✗ | ✓ |
| Support | Community | Email | Priority | Dedicated |

---

## Week-by-Week Build Plan

### Week 1: Foundation + Auth + Workshop Engine
- [ ] Project scaffolding: Next.js 15 + NestJS 11 monorepo (pnpm workspaces)
- [ ] MongoDB Atlas + Upstash Redis setup
- [ ] All Mongoose schemas defined
- [ ] NextAuth v5 setup with credentials provider
- [ ] NestJS Passport JWT auth with role guards
- [ ] User invite flow with Resend (real emails)
- [ ] Org auto-creation on first signup
- [ ] Workshop CRUD API with all step types
- [ ] Step builder UI with dnd-kit
- [ ] Markdown editor, quiz builder, scenario builder, reflection step
- [ ] Workshop preview mode
- [ ] Publish/unpublish, template cloning
- [ ] Seed script: 2 orgs, 30 users, 8 workshop templates

### Week 2: Learner Playback + Assignments
- [ ] Session API: start, respond, complete, resume
- [ ] Chat-driven playback UI with Framer Motion
- [ ] All step type renderers with animations
- [ ] Quiz feedback with explanation reveal
- [ ] Scenario branching with path tracking
- [ ] Progress bar + real-time score
- [ ] Session persistence (auto-save per step)
- [ ] Completion screen with score summary
- [ ] Learner dashboard: my assignments, in-progress, completed
- [ ] Assignment engine: assign to user/department/org
- [ ] Due dates, priority levels
- [ ] Assignment status tracking
- [ ] Overdue detection cron (NestJS scheduler)
- [ ] Mobile-responsive playback testing

### Week 3: Admin Dashboard + Org Management
- [ ] Admin dashboard: overview cards, completion trends, department breakdown
- [ ] Overdue alerts list
- [ ] Activity feed
- [ ] Org settings page: name, logo (Cloudinary), brand color, timezone
- [ ] Department CRUD with hierarchy
- [ ] User management: invite, edit, deactivate, search/filter
- [ ] Bulk invite via CSV upload
- [ ] Mock SSO importers (Google + Microsoft from seed JSON)
- [ ] Diff-based sync logic with clear interface contracts
- [ ] Workshop categories
- [ ] Org-level workshop library

### Week 4: Leaderboard + Gamification + Notifications
- [ ] Redis sorted set leaderboard implementation
- [ ] Leaderboard page with rank, score, streak, badges
- [ ] Department leaderboard
- [ ] Streak calculation logic
- [ ] Badge definitions and earning logic
- [ ] Badge earned animation/notification
- [ ] In-app notification center (bell icon, dropdown)
- [ ] Notification types: assignment, reminder, overdue, completion, badge, streak
- [ ] Email notifications via Resend
- [ ] Notification preferences per user
- [ ] Admin announcements

### Week 5: AI + Advanced Reporting
- [ ] AI workshop generator: topic → streaming output → editable steps
- [ ] AI content suggestions ("make more engaging", "add quiz", "simplify")
- [ ] Per-workshop report: completion, scores, time, drop-off by step
- [ ] Question-level analysis
- [ ] User progress report
- [ ] Department comparison report
- [ ] Time-based trends (weekly/monthly)
- [ ] CSV export for all reports
- [ ] Weekly digest email to admins

### Week 6: Billing + Marketing Site
- [ ] Stripe test mode integration
- [ ] Plan definitions in code and DB
- [ ] Checkout flow (Stripe Checkout)
- [ ] Stripe Customer Portal for self-service
- [ ] Webhook handling: invoice.paid, subscription.updated/deleted
- [ ] Usage tracking and plan limit enforcement
- [ ] Billing page: current plan, usage, invoices
- [ ] Landing page with hero, features, social proof placeholder
- [ ] Pricing page with plan comparison
- [ ] Signup → onboarding flow

### Week 7: Testing + Security
- [ ] Unit tests: scoring logic, streak calculation, billing limits, proration
- [ ] API integration tests: auth flow, workshop CRUD, session lifecycle, assignments
- [ ] Component tests: playback UI, step builder, dashboard
- [ ] E2E: signup → create workshop → assign → complete → see report (Playwright)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation audit (all endpoints)
- [ ] Security headers (Helmet)
- [ ] File upload validation
- [ ] CSRF protection

### Week 8: Performance + Observability + Polish
- [ ] MongoDB index optimization
- [ ] Redis caching strategy for dashboard stats
- [ ] Image optimization (Cloudinary transforms)
- [ ] Lazy loading for charts and heavy components
- [ ] Cursor-based pagination on all list endpoints
- [ ] Sentry integration (frontend + backend)
- [ ] PostHog setup (key events: signup, workshop_completed, feature_usage)
- [ ] Structured logging (pino)
- [ ] Health check endpoint
- [ ] Accessibility pass: keyboard nav, ARIA, focus management, contrast
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment setup
- [ ] Final README with screenshots, architecture diagram, setup guide

### Weeks 9–10: Buffer + Extras
- [ ] Fix bugs found during testing
- [ ] Performance tuning based on real usage patterns
- [ ] Documentation: API docs (Swagger), contributor guide
- [ ] Real SSO integration for one provider (Google Workspace — free)
- [ ] Custom domain support for pro tier
- [ ] Workshop import/export (JSON format)
- [ ] API access for enterprise tier
- [ ] Demo video for portfolio and marketing site

---

## Folder Structure

```
pulse/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (marketing)/    # Landing, pricing, blog
│   │   │   ├── (auth)/         # Login, register, invite
│   │   │   ├── (learner)/      # Learner dashboard, playback
│   │   │   └── (admin)/        # Admin dashboard, workshops, settings
│   │   ├── components/
│   │   │   ├── ui/             # Radix UI primitives
│   │   │   ├── workshop/       # Step builder, playback components
│   │   │   ├── dashboard/      # Charts, cards, tables
│   │   │   └── layout/         # Nav, sidebar, shells
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   ├── auth.ts         # NextAuth config
│   │   │   └── utils.ts
│   │   └── store/              # Redux Toolkit slices
│   │
│   └── api/                    # NestJS 11 backend
│       ├── src/
│       │   ├── auth/           # Auth module (Passport, guards)
│       │   ├── organizations/  # Org module
│       │   ├── users/          # User module
│       │   ├── departments/    # Department module
│       │   ├── workshops/      # Workshop engine
│       │   ├── assignments/    # Assignment engine
│       │   ├── sessions/       # Playback session management
│       │   ├── leaderboard/    # Redis leaderboard
│       │   ├── notifications/  # In-app + email notifications
│       │   ├── billing/        # Stripe integration
│       │   ├── ai/             # OpenAI integration
│       │   ├── reporting/      # Analytics + exports
│       │   ├── upload/         # Cloudinary file handling
│       │   ├── sso/            # Mock SSO importers
│       │   └── common/         # Guards, filters, interceptors, pipes
│       └── test/               # Integration tests
│
├── packages/
│   └── shared/                 # Shared types, constants, validation schemas
│
├── .github/
│   └── workflows/              # CI/CD
├── docker-compose.yml          # Local dev (MongoDB + Redis)
├── pnpm-workspace.yaml
└── README.md
```

---

## Key Technical Decisions

**Why monorepo?**
Shared types between frontend and backend prevent drift. pnpm workspaces is lightweight — no need for Nx or Turborepo at this scale.

**Why MongoDB over PostgreSQL?**
Workshop content is inherently document-shaped — steps embedded in workshops, responses embedded in sessions. Flexible schema lets you iterate on step types without migrations.

**Why Redis for leaderboard?**
Sorted sets (ZADD/ZREVRANGE) give O(log N) rank updates and O(log N + M) range queries. Calculating ranks in MongoDB on every request would be slow and expensive.

**Why Resend over SendGrid?**
Better DX, simpler API, generous free tier (100 emails/day is plenty for early stage), and React Email for building templates with JSX.

**Why Stripe test mode vs. mocking?**
Real Stripe integration means zero work to go live — just swap API keys. Mocking Stripe means rewriting the integration later. Test mode is free.

**Why not Prisma?**
Prisma's MongoDB support is less mature than Mongoose. For a MongoDB-first project, Mongoose is the better choice.

---

## Portfolio Presentation

Even though this is built to potentially ship, it's still a portfolio piece. Present it as:

**Title:** "Pulse — Micro-Learning Platform | Next.js 15 + NestJS + MongoDB + Redis + Stripe"

**Description:** "A full-stack SaaS platform for delivering short, chat-driven training workshops to employees. Features AI content generation, real-time leaderboards, Stripe billing, org management with SSO, and admin reporting. Built as a production-ready product with real email delivery, payment integration, error monitoring, and CI/CD."

**What makes it stand out:** Most portfolio projects are demos. This one has real emails, real payments (test mode), real error tracking, real analytics, CI/CD, and tests. That's a different level.

---

*Build something worth selling. Even if you never sell it, clients will see the difference.*