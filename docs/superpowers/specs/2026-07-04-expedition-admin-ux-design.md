# Expedition & Admin Panel UX Improvements — Design Spec

**Date:** 2026-07-04  
**Status:** Pending implementation

---

## Context

Six UX improvements to the expedition listing page and admin panel. The codebase uses Next.js 16 App Router, Supabase, Tailwind v4, and a custom dark design system (`#111111` background, `#9BFF3C` neon-green, `#FF6B1A` orange).

Key constraint: **no architectural duplication, reuse existing components**.

---

## Task 1 — Role-Aware "Propose / Create Trip" Button

### Current State
`app/(pages)/expeditions/page.tsx` renders `+ PROPOSE TRIP` as a plain `<Link>` with no auth check. Role detection does not happen on this page at all.

### Design
The expeditions page is already an async Server Component. Add `supabase.auth.getUser()` (already called elsewhere) + `is_admin` profile lookup. Based on result:

| User state | Button label | Destination |
|---|---|---|
| Guest / logged-in non-admin | `+ PROPOSE TRIP` | `/expeditions/propose` |
| Admin | `+ CREATE TRIP` | `/admin#expeditions` |

**Destination for admin:** Link to `/admin#expeditions` — reuses the existing `AdminExpeditionForm` with no new page or component. Clicking scrolls/navigates to the expeditions section of the admin panel.

**Dependency:** This requires the admin page expeditions section to have `id="expeditions"` on its heading/wrapper. Adding that anchor is part of Task 6's sticky section nav work — both must land together in the same deploy.

No new pages, no duplicated form logic.

### Files
- `app/(pages)/expeditions/page.tsx` — add user/profile fetch, conditional button
- `app/(pages)/admin/page.tsx` — add `id="expeditions"` anchor (coordinate with Task 6)

---

## Task 2 — Expedition Filter Redesign + Activity Filter

### Current State
- Row 1: Status chips (`<Link>` pills via URL param `?status=X`)
- Row 2: Difficulty chips (`?difficulty=X`)
- `activity_category` column exists in DB but: not selected in listing query, not in `Trip` type, not filtered

### Design

**Row 1 (Status) — unchanged:** `[All] [Upcoming] [Ongoing] [Completed]`

**Row 2 — horizontal scrollable strip:**
```
DIFFICULTY  [All] [Very Chill] [Chill] [Easy Going] [Moderate] [Pretty Chaotic] [Hardcore] [Full Chaos]  |  ACTIVITY  [All] [Hiking] [Mountaineering] [Camping] [Cycling] [Diving] [Surfing] [Kayaking] [Other]
←————————————————————————————— scrollable, no wrap ———————————————————————————————————→
```

Implementation:
- `overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch` on the container
- No JS state — same `<Link>` + URL param pattern as current filters
- New param: `?activity=X`
- Section labels ("DIFFICULTY", "ACTIVITY") are inline `<span>` in muted color, not interactive
- Vertical separator `|` between sections
- Active chip: same active color as corresponding section (neon-green for difficulty, orange for activity — or unified to one accent)

**DB changes:**
- Add `activity_category` to the `SELECT` in listing query
- Add `activity_category` to `Trip` type in `types/expedition.ts`
- Add `.eq("activity_category", activity)` filter when `activity` URL param is present
- Fetch activity list from DB (`activities` table — see Task 3) for rendering chips

**Files:**
- `app/(pages)/expeditions/page.tsx` — query, URL param handling, filter UI
- `types/expedition.ts` — add `activity_category`

---

## Task 3 — Admin Activity CRUD

### Current State
Activities are a hardcoded TypeScript const in `components/AdminActions.tsx`:  
`["Hiking", "Mountaineering", "Camping", "Cycling", "Diving", "Surfing", "Kayaking", "Other"]`

No `activities` table exists.

### Design

**Migration `034_activities_table.sql`:**
```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed with current list
INSERT INTO activities (name) VALUES
  ('Hiking'), ('Mountaineering'), ('Camping'),
  ('Cycling'), ('Diving'), ('Surfing'),
  ('Kayaking'), ('Other');

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities are public"
  ON activities FOR SELECT USING (true);

CREATE POLICY "admins manage activities"
  ON activities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

**API routes:**
- `GET /api/admin/activities` — list all (non-archived) + archived
- `POST /api/admin/activities` — create (validate unique name, 2-50 chars)
- `PATCH /api/admin/activities/[id]` — rename or toggle archived
- `DELETE /api/admin/activities/[id]` — hard delete (only if no expeditions use it)

**`AdminActivitiesSection` component** (added to `AdminActions.tsx`):
- Table: Name | Status (Active/Archived) | Actions
- Actions: [RENAME] [ARCHIVE] or [RESTORE] for archived
- Inline create form: text input + [ADD] button
- Duplicate prevention: 400 from API if name already exists
- Reuses existing `BTN` style and table patterns

**Update dropdowns in forms:**
- `AdminExpeditionForm` and `ExpeditionActions`: fetch activities from `GET /api/admin/activities` in `useEffect` instead of using hardcoded const
- `app/(pages)/expeditions/propose/page.tsx`: add `activity_category` select field (fetch from same API)

**Files:**
- `supabase/migrations/034_activities_table.sql` — NEW
- `app/api/admin/activities/route.ts` — NEW (GET, POST)
- `app/api/admin/activities/[id]/route.ts` — NEW (PATCH, DELETE)
- `components/AdminActions.tsx` — add `AdminActivitiesSection`, update dropdowns
- `app/(pages)/expeditions/propose/page.tsx` — add activity_category field
- `app/(pages)/admin/page.tsx` — add `<AdminActivitiesSection />` render

---

## Task 4 — Trip Reminder Flow Analysis

### Current Behavior
**File:** `app/api/admin/reminders/route.ts`

Admin selects lead time (1/3/7/14 days). API queries all expeditions with `status IN ('upcoming', 'ongoing')` starting exactly N days from today. Sends email + in-app notification to all approved members.

### Assessment: **Mostly correct.**

The behavior is semantically right — it's a batch reminder for all trips departing in N days, not a per-trip selection. This is the expected behavior.

### Issues Found

| # | Issue | Severity | Fix |
|---|---|---|---|
| R1 | Email uses "ongoing" status template (subject: "X is now underway") instead of a reminder-specific message | Medium | Add dedicated reminder email function |
| R2 | Date match uses exact equality (`.eq("date_start", targetDate)`) — if `date_start` is `timestamptz`, timezone edge cases could cause misses | Low | Use `.gte(startOfDay).lt(startOfNextDay)` range |
| R3 | No feedback if 0 trips match (API returns `{ sent: 0, expeditions: 0 }` silently) | Low | Already surfaced in UI via response count |

### Recommendation
Fix R1 (wrong email template) and R2 (date range). R3 is already handled.

**Files:**
- `app/api/admin/reminders/route.ts` — date range fix
- `lib/email.ts` — add `sendReminderEmail` function

---

## Task 5 — Approve/Reject Workflow (Option B)

### Current State
- APPROVE + REJECT buttons always visible for each pending member
- No loading state (both buttons clickable mid-request)
- No confirmation dialog for REJECT
- After action: `window.location.reload()` — full page refresh
- REJECT deletes the row; APPROVE sets `status = 'approved'`

### Design: Option B — Approve reversible, Reject irreversible

**Pending section:**
- Per-row loading state (disable both buttons while request in flight)
- REJECT shows confirmation: "Remove @username from this expedition? This cannot be undone."
- On action: optimistic UI update (remove row immediately), no page reload

**Approved section (new):**
- Each approved member gets a `REVOKE` button
- REVOKE calls `PATCH { action: "pending" }` — returns member to pending list
- REVOKE shows confirmation: "Revoke approval for @username? They'll return to the pending list."

**Why Option B:**
Expedition management is high-stakes. An accidental approve needs recovery. Rejected members are truly disqualified (deleted row already matches current behavior — keeping that intact). Revoke-to-pending is enough flexibility without overcomplicating with full rejected-member tracking.

**API change:**
- `PATCH /api/expeditions/[id]/members/[memberId]` — add `action: "pending"` handler (update `status = 'pending'`)

**Files:**
- `app/(pages)/expeditions/[id]/page.tsx` — loading state, optimistic update, REVOKE button, confirm dialogs
- `app/api/expeditions/[id]/members/[memberId]/route.ts` — add `"pending"` action

---

## Task 6 — Admin Panel UX Audit

### Current State
Single page `app/(pages)/admin/page.tsx` with all sections stacked vertically:
Expeditions → Stories → Gallery → Chaos → Users → Proposals → Reports → Activities (new) → Reminders

As the platform grows, this becomes increasingly hard to scan, navigate, and maintain.

### Recommendation: Split into focused sub-pages (do NOT implement yet)

**Proposed Information Architecture:**

```
/admin                    Dashboard
                          └─ Stats: users, expeditions, pending items
                          └─ Quick-action buttons to each section

/admin/expeditions        Trip Management
                          └─ List + create (AdminExpeditionForm)
                          └─ Per-trip edit/delete

/admin/users              User Management
                          └─ Table: promote, ban, demote

/admin/content            Content Moderation
                          └─ Stories (approve/reject/delete)
                          └─ Chaos wall (approve/reject)
                          └─ Gallery (delete)

/admin/applications       Applications
                          └─ Expedition proposals (approve/reject)
                          └─ Join requests (approve/reject)

/admin/activities         Activity Management  ← NEW (Task 3)
                          └─ CRUD for activity categories

/admin/notifications      Notifications
                          └─ Trip reminders
                          └─ Push notification panel
```

**Navigation:** Sidebar on desktop, bottom-tabs or hamburger on mobile. Each section breadcrumbs back to `/admin`.

**Migration risk:** Medium. All existing data, APIs, and server queries stay the same — only the rendering layer moves. Shared components (`AdminActions.tsx`) remain usable.

**Estimated effort:** 2–3 days for layout + routing. Not recommended in this sprint.

**Immediate UX win (implement in this sprint):** Within the current single-page admin, add `id` anchors on each section heading + a sticky section nav at the top (links: Expeditions | Stories | Gallery | Chaos | Users | Proposals | Activities | Reminders). Required for Task 1's `#expeditions` hash link to work.

---

## Files to Change (Summary)

| File | Change |
|---|---|
| `app/(pages)/expeditions/page.tsx` | Role-aware button, activity filter, query update |
| `types/expedition.ts` | Add `activity_category` |
| `supabase/migrations/034_activities_table.sql` | NEW — activities table + seed |
| `app/api/admin/activities/route.ts` | NEW — GET + POST |
| `app/api/admin/activities/[id]/route.ts` | NEW — PATCH + DELETE |
| `components/AdminActions.tsx` | AdminActivitiesSection, update dropdowns |
| `app/(pages)/expeditions/propose/page.tsx` | Add activity_category field |
| `app/(pages)/admin/page.tsx` | Add AdminActivitiesSection, section nav |
| `app/api/admin/reminders/route.ts` | Date range fix |
| `lib/email.ts` | Add sendReminderEmail |
| `app/(pages)/expeditions/[id]/page.tsx` | Revoke button, loading state, optimistic update, confirm dialogs |
| `app/api/expeditions/[id]/members/[memberId]/route.ts` | Add "pending" action |

---

## UX Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Create Trip button | Link to `/admin#expeditions` | No new page/component; admin already knows where their panel is |
| Filter layout | Horizontal scroll strip | Compact, mobile-friendly, no JS needed, consistent with existing chip pattern |
| Activity storage | DB table | Admin-manageable; survives deploys; consistent with other DB-driven content |
| Approval workflow | Option B (approve reversible) | Error recovery for high-stakes action; reject stays irreversible (row deleted, current behavior) |
| Admin layout | Single page + anchor nav (now); split pages (future) | Low risk now; large refactor deferred |
