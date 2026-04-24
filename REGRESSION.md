# Pulse — Manual Regression Test Plan

## Prerequisites (run before any journey)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Seed the database (REQUIRED — journeys fail without this)
pnpm --filter api seed

# 3. Start dev servers
pnpm dev
```

All steps assume the dev stack is running. Run journeys in order against a freshly seeded database.

**Base URL:** `http://localhost:3000` (web) · `http://localhost:3001` (API)  
**Seed accounts:**

| Role | Email | Password |
|------|-------|----------|
| Org Admin | admin@acme.com | password123 |
| Manager | sarah.chen@acme.com | password123 |
| Learner | liam.johnson@acme.com | password123 |

---

## Journey 1 — Admin Login

1. Go to `http://localhost:3000/login`
2. Enter `admin@acme.com` / `password123`
3. Click **Sign in**

**Expect:** Redirect to `/` (admin dashboard). Sidebar shows org name "Acme Corp". Top bar shows admin user name.

---

## Journey 2 — Admin Dashboard Stats

1. Log in as admin (Journey 1)
2. View the dashboard home page

**Expect:** Four stat cards visible — Active Learners, Workshops, Completions, Avg Score. Numbers are non-zero from seed data.

---

## Journey 3 — Workshop List

1. Log in as admin
2. Click **Workshops** in the sidebar

**Expect:** Table shows at least 5 seed workshops with title, vertical, difficulty, and published status. "New Workshop" button is visible.

---

## Journey 4 — Create Workshop Manually

1. Log in as admin → Workshops
2. Click **New Workshop** — a draft workshop titled "Untitled Workshop" is created immediately and the editor opens
3. Change the title to `Test Workshop`
4. Set Vertical to `Sales` and Difficulty to `Beginner`
5. Click **Save**

**Expect:** Workshop saves with the new title/vertical/difficulty. Status is "Draft". Navigating back to Workshops shows `Test Workshop` in the list.

---

## Journey 5 — Add Steps to Workshop

1. Open the workshop created in Journey 4
2. Click **Add Step** → choose **Content**
3. Enter a title and body text, click **Save**
4. Click **Add Step** → choose **Quiz**
5. Enter a question
6. Fill in the 2 pre-existing options; click **Add option** to add a third
7. Click the circle next to the correct answer to mark it
8. Click **Save**

**Expect:** Steps appear in order with correct step numbers. Total Points counter updates. The remove (trash) icon is disabled when only 2 options remain.

---

## Journey 6 — Publish Workshop

1. Open the draft workshop from Journey 4/5
2. Click **Publish**

**Expect:** Status changes to "Published". Workshop is now visible to learners.

---

## Journey 7 — AI Workshop Generation

1. Log in as admin → Workshops
2. Click **Generate with AI**
3. Enter topic: `Effective Email Communication`, select 3 steps
4. Click **Generate**

**Expect:** Loading state shown. After ~10s, a new workshop draft appears with steps pre-filled. (Requires OpenAI API key — if not configured, expect a "not configured" error message.)

---

## Journey 8 — User Management & Invite

1. Log in as admin → **Users**
2. View the user table — confirm seed users appear with roles
3. Click **Invite User**
4. Fill in Name: `Test User`, Email: `testuser@example.com`, Role: `Learner`
5. Click **Send Invite**

**Expect:** Modal closes. New user appears in table with status "invited". (Email sent if Resend key configured.)

---

## Journey 9 — Accept Invite

1. Copy the invite link from the API response or email
2. Open `http://localhost:3000/invite?token=<TOKEN>` in a new browser / incognito
3. Enter a password and confirm it
4. Click **Activate Account**

**Expect:** Redirect to `/login?invited=1`. Login page shows a success banner. Log in with the new credentials.

---

## Journey 10 — Assignment Creation

1. Log in as admin → **Assignments** (or via the workshop detail page)
2. Click **Assign Workshop**
3. Select workshop: `Phishing Awareness 101`
4. Assign to: Individual → select `Liam Johnson`
5. Set due date to next week, priority: Required
6. Click **Assign**

**Expect:** Assignment appears in the assignments list with status "pending".

---

## Journey 11 — Learner Login & Dashboard

1. Open a new browser / incognito window
2. Go to `http://localhost:3000/login`
3. Log in as `liam.johnson@acme.com` / `password123`

**Expect:** Redirect to `/learn/dashboard`. Shows "My Assignments" section and recent activity. Badges section visible (may be empty initially).

---

## Journey 12 — Learner Browse Workshops

1. Log in as learner
2. Click **Browse** in the sidebar

**Expect:** Workshop catalog shows published workshops. Cards display title, difficulty, estimated time, points.

---

## Journey 13 — Start a Workshop Session

1. Log in as learner → Browse
2. Click on **Phishing Awareness 101**
3. Click **Start Workshop** (or **Continue** if already started)

**Expect:** Redirected to the play page `/learn/workshops/<id>/play`. First step displayed with title and content. Progress bar shows step 1 of N.

---

## Journey 14 — Complete Workshop Steps

1. From the play page (Journey 13):
2. Read the first content step → click **Next**
3. On a quiz step — select an answer → click **Submit**
   - If correct: green feedback shown, points awarded
   - If wrong: red feedback, correct answer revealed
4. On a scenario step — select a choice → click **Submit**
5. Continue through all steps

**Expect:** Progress bar advances each step. Score accumulates in the header. No crashes or blank screens between steps.

---

## Journey 15 — Complete Session & Badges

1. Complete all steps (Journey 14)
2. Click **Finish** on the last step

**Expect:**
- Completion screen shows final score and percentage
- "Well done!" or similar message displayed
- Return to dashboard

Then verify on the dashboard:
- Session appears in **Recent Activity** with status "completed"
- **Badges** section shows at least `First Completion` badge
- Notification bell in the top bar shows an unread badge (red dot)

---

## Journey 16 — Notifications

1. Log in as learner, complete a session (Journey 15)
2. Click the **bell icon** in the top-right

**Expect:** Dropdown opens showing notification(s) — e.g. "Badge awarded: First Completion". Click a notification to mark it read. Unread dot disappears after all are read. **Mark all read** button clears all.

---

## Journey 17 — Leaderboard

1. Log in as admin → Dashboard (or a leaderboard page)
2. View the leaderboard widget / navigate to `/orgs/<orgId>/leaderboard`

**Expect:** Table shows learners ranked by total score. Liam Johnson appears after completing a session in Journey 15.

---

## Journey 18 — Assignment Completion Tracking

1. Log in as admin → Assignments
2. Find the assignment created in Journey 10

**Expect:** Status has updated to "completed" (or "in_progress" if not fully done). Completion rate shows a non-zero percentage.

---

## Journey 19 — Stats & CSV Export

1. Log in as admin → Dashboard or Stats page
2. Click **Export CSV** (or navigate to the export option)

**Expect:** Browser downloads `sessions.csv`. Open it — rows contain sessionId, userId, workshopId, score, completedAt. At least one row for the completed session.

---

## Journey 20 — Billing Page

1. Log in as admin → **Billing** in the sidebar
2. View the three plan cards (Starter, Growth, Enterprise)

**Expect:** Current plan is highlighted. Upgrade buttons present. Clicking **Upgrade** initiates a Stripe checkout redirect. (Mock mode if no Stripe key — redirects to a success/cancel URL.)

---

## Journey 21 — Sign Out

1. Log in as any user
2. Click the **Sign out** button at the bottom of the sidebar

**Expect:** Redirected to `/login`. Session cookie/token cleared. Navigating to a protected page redirects back to login.

---

## Journey 22 — Role Guards

### 22a — Learner cannot access admin routes

1. Log in as learner (`liam.johnson@acme.com`)
2. In the address bar, navigate directly to each of the following URLs one at a time:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/workshops`
   - `http://localhost:3000/assignments`
   - `http://localhost:3000/users`
   - `http://localhost:3000/departments`
   - `http://localhost:3000/leaderboard`
   - `http://localhost:3000/reports`
   - `http://localhost:3000/settings`
   - `http://localhost:3000/billing`

**Expect:** Every URL immediately redirects to `/learn/dashboard`. The admin sidebar is never visible. No admin data is rendered even momentarily.

### 22b — Admin cannot access learner routes

1. Log in as admin (`admin@acme.com`)
2. In the address bar, navigate directly to:
   - `http://localhost:3000/learn/dashboard`
   - `http://localhost:3000/learn/browse`

**Expect:** Both URLs immediately redirect to `/dashboard`. The learner layout is never shown.

### 22c — Unauthenticated user cannot access protected routes

1. Sign out (or open a private/incognito window with no session)
2. Navigate directly to `http://localhost:3000/dashboard`
3. Navigate directly to `http://localhost:3000/learn/dashboard`

**Expect:** Both redirect to `/login`. After logging in as a learner, redirect lands on `/learn/dashboard`; as admin, on `/dashboard`.

---

## Quick Smoke Check (API)

Run these curl commands to verify the API layer independently:

```bash
# Login
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' | jq .user.role
# Expected: "org_admin"

# Health check
curl -s http://localhost:3001/health | jq .status
# Expected: "ok"

# Workshop list (replace TOKEN and ORG_ID)
curl -s --compressed http://localhost:3001/orgs/<ORG_ID>/workshops \
  -H "Authorization: Bearer <TOKEN>" | jq 'length'
# Expected: 5 or more
```

---

## Known Non-Issues

- **Compression:** API responses are gzip-compressed. Add `--compressed` to curl or use a browser/Postman — raw curl output will look like binary garbage.
- **AI generation:** Requires a valid `OPENAI_API_KEY` in `.env`. Without it, the generate endpoint returns a 400 — this is expected.
- **Email sending:** Requires a valid `RESEND_API_KEY`. Without it, invite links are returned in the API response but no email is sent — this is expected.
- **Stripe checkout:** Without a real `STRIPE_SECRET_KEY`, billing runs in mock mode and redirects to `?success=1` — this is expected.
