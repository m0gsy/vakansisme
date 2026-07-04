# Expedition & Admin UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add activity filter to expedition listing, activities DB table with admin CRUD, role-aware Create/Propose Trip button, admin section nav, reminder email fix, and approve/revoke member workflow.

**Architecture:** Six independent (or lightly coupled) improvements. Tasks 1 → 2 are coupled (activities API first, then UI). Task 3 (admin nav + role button) and Task 4 (activity filter) each depend on Task 1's activities table. Tasks 5 and 6 are fully independent. Implement in order: 1 → 2 → 3 → 4 → 5 → 6.

**Tech Stack:** Next.js 16 App Router, Supabase (server client + service client), TypeScript, Tailwind v4 (via class names like `bg-charcoal`, `text-neon-green`), inline CSS for fine-grained layout. No new dependencies.

## Global Constraints

- All inline styles use design system tokens: `#111111` = charcoal bg, `#1a1a1a` = card surface, `#9BFF3C` = neon-green, `#FF6B1A` = chaos-orange, `#F0EDEA` = off-white, `#8B7355` = muted-ink, `rgba(74,59,42,0.4)` = border color
- Font classes: `font-display font-black uppercase` for headings, `font-body font-semibold` for labels/buttons, `font-body` for body text
- Button style constant `BTN.base` in `AdminActions.tsx` (fontSize 0.62rem, letterSpacing 0.1em, padding 5px 12px, border none, cursor pointer, fontWeight 700)
- All admin API routes must verify `is_admin` before acting — copy the `getAdmin()` helper pattern from `app/api/admin/expeditions/[id]/route.ts`
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `VAPID_PRIVATE_KEY`, or `CRON_SECRET` to client

---

## File Map

| File | Action | Task |
|------|--------|------|
| `supabase/migrations/034_activities_table.sql` | CREATE | Task 1 |
| `app/api/admin/activities/route.ts` | CREATE | Task 1 |
| `app/api/admin/activities/[id]/route.ts` | CREATE | Task 1 |
| `components/AdminActions.tsx` | MODIFY — add `AdminActivitiesSection`, update dropdowns | Task 2 |
| `app/(pages)/expeditions/propose/page.tsx` | MODIFY — add activity_category select | Task 2 |
| `app/(pages)/admin/page.tsx` | MODIFY — add section nav + `AdminActivitiesSection` | Tasks 2 & 3 |
| `app/(pages)/expeditions/page.tsx` | MODIFY — role-aware button + activity filter | Tasks 3 & 4 |
| `types/expedition.ts` | MODIFY — add `activity_category` | Task 4 |
| `lib/email.ts` | MODIFY — add `sendReminderEmail` | Task 5 |
| `app/api/admin/reminders/route.ts` | MODIFY — use `sendReminderEmail` | Task 5 |
| `components/MemberManagement.tsx` | CREATE | Task 6 |
| `app/(pages)/expeditions/[id]/page.tsx` | MODIFY — use MemberManagement component | Task 6 |
| `app/api/expeditions/[id]/members/[memberId]/route.ts` | MODIFY — add "pending" action | Task 6 |

---

## Task 1: Activities DB + API Routes

**Files:**
- Create: `supabase/migrations/034_activities_table.sql`
- Create: `app/api/admin/activities/route.ts`
- Create: `app/api/admin/activities/[id]/route.ts`

**Interfaces:**
- Produces: `GET /api/admin/activities` → `{ activities: Activity[] }` where `Activity = { id: string; name: string; archived: boolean }`
- Produces: `POST /api/admin/activities` body `{ name }` → `{ activity: Activity }` or 400/409
- Produces: `PATCH /api/admin/activities/[id]` body `{ name? } | { archived: boolean }` → `{ ok: true }`
- Produces: `DELETE /api/admin/activities/[id]` → `{ ok: true }` or 409 if in use

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/034_activities_table.sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO activities (name) VALUES
  ('Hiking'), ('Mountaineering'), ('Camping'),
  ('Cycling'), ('Diving'), ('Surfing'),
  ('Kayaking'), ('Other');

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities public read"
  ON activities FOR SELECT USING (true);

CREATE POLICY "admins manage activities"
  ON activities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

- [ ] **Step 2: Write GET + POST route**

```typescript
// app/api/admin/activities/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, name, archived")
    .order("archived", { ascending: true })
    .order("name", { ascending: true });
  return NextResponse.json({ activities: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
    return NextResponse.json({ error: "Name must be 2–50 characters" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({ name: name.trim() })
    .select("id, name, archived")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Activity already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data });
}
```

- [ ] **Step 3: Write PATCH + DELETE route**

```typescript
// app/api/admin/activities/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: { name?: string; archived?: boolean } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 50) return NextResponse.json({ error: "Name must be 2–50 characters" }, { status: 400 });
    update.name = name;
  }
  if (typeof body.archived === "boolean") update.archived = body.archived;
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase.from("activities").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Activity name already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Block delete if any expedition uses this activity
  const { data: act } = await supabase.from("activities").select("name").eq("id", id).single();
  if (!act) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { count } = await supabase
    .from("expeditions")
    .select("*", { count: "exact", head: true })
    .eq("activity_category", act.name);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${count} expedition(s) use this activity` }, { status: 409 });
  }

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Smoke test API manually**

Start dev server: `npm run dev`

```
# List activities (should return 8 seeded rows)
curl http://localhost:3000/api/admin/activities

# Create (as admin in browser, or use fetch in dev console)
# POST /api/admin/activities  { "name": "Paragliding" }  → 201 { activity: {...} }
# POST /api/admin/activities  { "name": "Hiking" }       → 409 already exists
# POST /api/admin/activities  { "name": "x" }            → 400 too short

# PATCH /api/admin/activities/[id]  { "archived": true } → { ok: true }
# DELETE /api/admin/activities/[id] (one not used by any expedition) → { ok: true }
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/034_activities_table.sql app/api/admin/activities/route.ts app/api/admin/activities/[id]/route.ts
git commit -m "feat(activities): add activities table, migration, and admin CRUD API"
```

---

## Task 2: Admin Activities UI

**Files:**
- Modify: `components/AdminActions.tsx` — add `AdminActivitiesSection`, update dropdowns in `ExpeditionActions` and `AdminExpeditionForm`
- Modify: `app/(pages)/expeditions/propose/page.tsx` — add activity_category select
- Modify: `app/(pages)/admin/page.tsx` — render `AdminActivitiesSection`

**Interfaces:**
- Consumes: `GET /api/admin/activities` → `{ activities: Activity[] }` (Task 1)
- Produces: exported `AdminActivitiesSection` component

- [ ] **Step 1: Add AdminActivitiesSection to AdminActions.tsx**

Append at the end of `components/AdminActions.tsx` (after line 1251):

```typescript
export function AdminActivitiesSection() {
  const [activities, setActivities] = useState<{ id: string; name: string; archived: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  function load() {
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then(({ activities: a }) => { setActivities(a ?? []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newName.trim()) return;
    setAddLoading(true);
    setError("");
    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed"); setAddLoading(false); return; }
    setNewName("");
    setAddLoading(false);
    load();
  }

  async function toggleArchive(id: string, archived: boolean) {
    setActionId(id);
    await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !archived }),
    });
    setActionId(null);
    load();
  }

  async function rename(id: string) {
    if (!renameName.trim()) return;
    setActionId(id);
    const res = await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to rename"); }
    setRenameId(null);
    setRenameName("");
    setActionId(null);
    load();
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setActionId(id);
    const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to delete"); }
    setActionId(null);
    load();
  }

  if (loading) return <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>;

  const active = activities.filter((a) => !a.archived);
  const archived = activities.filter((a) => a.archived);

  return (
    <div>
      {error && <p className="font-body" style={{ color: "#FF6B1A", fontSize: "0.75rem", marginBottom: "10px" }}>{error}</p>}

      {/* Add form */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New activity name..."
          className="font-body text-off-white"
          style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.8rem", flex: 1, outline: "none", color: "#F0EDEA" }}
        />
        <button
          onClick={add}
          disabled={addLoading}
          style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: addLoading ? 0.6 : 1 }}
        >
          ADD
        </button>
      </div>

      {/* Active activities */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
        {active.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.25)" }}>
            {renameId === a.id ? (
              <>
                <input
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && rename(a.id)}
                  className="font-body text-off-white"
                  style={{ background: "transparent", border: "1px solid rgba(155,255,60,0.4)", padding: "4px 8px", fontSize: "0.78rem", flex: 1, outline: "none", color: "#F0EDEA" }}
                  autoFocus
                />
                <button onClick={() => rename(a.id)} disabled={actionId === a.id} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", opacity: actionId === a.id ? 0.5 : 1 }}>SAVE</button>
                <button onClick={() => { setRenameId(null); setRenameName(""); }} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>CANCEL</button>
              </>
            ) : (
              <>
                <span className="font-body text-off-white" style={{ fontSize: "0.82rem", flex: 1 }}>{a.name}</span>
                <button onClick={() => { setRenameId(a.id); setRenameName(a.name); }} disabled={!!actionId} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>RENAME</button>
                <button onClick={() => toggleArchive(a.id, a.archived)} disabled={actionId === a.id} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", opacity: actionId === a.id ? 0.5 : 1 }}>ARCHIVE</button>
                <button onClick={() => del(a.id, a.name)} disabled={!!actionId} style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.3)" }}>DELETE</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "8px" }}>ARCHIVED ({archived.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {archived.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.25)", opacity: 0.6 }}>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.82rem", flex: 1 }}>{a.name}</span>
                <button onClick={() => toggleArchive(a.id, a.archived)} disabled={actionId === a.id} style={{ ...BTN.base, background: "transparent", color: "#9BFF3C", border: "1px solid rgba(155,255,60,0.3)", opacity: actionId === a.id ? 0.5 : 1 }}>RESTORE</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update both form dropdowns to fetch activities from API**

In `ExpeditionActions` (around line 176), add `activities` state and fetch alongside the existing `adminUsers` fetch:

```typescript
// Add to ExpeditionActions state declarations (after the existing adminUsers state at ~line 176):
const [activities, setActivities] = useState<string[]>([]);

// Add to the existing useEffect that fetches adminUsers (around line ~195):
useEffect(() => {
  fetch("/api/admin/users")
    .then((r) => r.json())
    .then(({ users }) => setAdminUsers((users ?? []).filter((u: { is_admin: boolean }) => u.is_admin)));
  fetch("/api/admin/activities")
    .then((r) => r.json())
    .then(({ activities: a }) => setActivities((a ?? []).filter((x: { archived: boolean }) => !x.archived).map((x: { name: string }) => x.name)));
}, []);
```

Then replace the `ACTIVITY_CATEGORIES.map(...)` in ExpeditionActions (around line 307) with:
```tsx
{(activities.length ? activities : ["Other"]).map((c) => (
  <option key={c} value={c} style={{ background: "#111111" }}>{c}</option>
))}
```

Repeat the same pattern for `AdminExpeditionForm`:
- Add `const [activities, setActivities] = useState<string[]>([]);` (around line 445)
- Add the activities fetch to the existing `useEffect` (around line 460)
- Replace `ACTIVITY_CATEGORIES.map(...)` at line 621 with the same dynamic map

- [ ] **Step 3: Add activity_category to propose page**

In `app/(pages)/expeditions/propose/page.tsx`:

Add `activity_category: "Other"` to the `form` state (line 23, alongside existing fields).

Add `activities` state and fetch:
```typescript
const [activities, setActivities] = useState<string[]>(["Other"]);

useEffect(() => {
  fetch("/api/admin/activities")
    .then((r) => r.json())
    .then(({ activities: a }) => {
      const names = (a ?? []).filter((x: { archived: boolean }) => !x.archived).map((x: { name: string }) => x.name);
      if (names.length) setActivities(names);
    });
}, []);
```

Add select field after the Difficulty select (in the grid at line 105):
```tsx
<div>
  <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>ACTIVITY</p>
  <select value={form.activity_category} onChange={(e) => set("activity_category", e.target.value)} className="font-body"
    style={{ ...INPUT.base, cursor: "pointer" }}>
    {activities.map((c) => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
  </select>
</div>
```

Note: The propose form submits to `POST /api/expeditions/proposals`. Check `app/api/expeditions/proposals/route.ts` — if it doesn't pass `activity_category` to the proposals table, add it. Proposals are reviewed by admin and then created as expeditions, so `activity_category` on proposals is informational; ensure the proposals insert includes it.

- [ ] **Step 4: Add AdminActivitiesSection to admin page**

In `app/(pages)/admin/page.tsx`:

Add import (line 5, alongside existing imports):
```typescript
import { ..., AdminActivitiesSection } from "@/components/AdminActions";
```

Add Section near the end, before the Reminders section:
```tsx
<Section title="ACTIVITY CATEGORIES">
  <AdminActivitiesSection />
</Section>
```

- [ ] **Step 5: Manual smoke test**

1. Go to `/admin`, scroll to "ACTIVITY CATEGORIES"
2. Add "Paragliding" → appears in list
3. Archive "Paragliding" → moves to archived
4. Restore → moves back to active
5. Delete "Paragliding" → gone
6. Open Edit form for an expedition → Activity dropdown shows dynamic list from DB
7. Go to `/expeditions/propose` → Activity select appears in Difficulty row

- [ ] **Step 6: Commit**

```bash
git add components/AdminActions.tsx app/(pages)/expeditions/propose/page.tsx app/(pages)/admin/page.tsx
git commit -m "feat(activities): admin CRUD UI, update dropdowns to DB-driven, propose page activity field"
```

---

## Task 3: Admin Section Nav + Role-Aware Trip Button

**Files:**
- Modify: `app/(pages)/admin/page.tsx` — add `id` anchors + sticky section nav
- Modify: `app/(pages)/expeditions/page.tsx` — detect `is_admin`, conditional button

**Interfaces:**
- Produces: admin page sections have `id` anchors for hash navigation
- Produces: expedition listing page shows "CREATE TRIP" → `/admin#expeditions-section` for admins

- [ ] **Step 1: Update Section component to accept an id prop**

In `app/(pages)/admin/page.tsx`, the `Section` component (line 10) currently takes `{ title, children }`. Extend it:

```typescript
function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: "56px" }}>
      <h2
        className="font-display font-black uppercase text-off-white"
        style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Add id anchors to all sections and a sticky nav**

Add the sticky nav just before the first `<Section>` (after the Header div, around line 121):

```tsx
{/* Section nav */}
<nav style={{ position: "sticky", top: "64px", zIndex: 10, background: "#111111", borderBottom: "1px solid rgba(74,59,42,0.3)", marginBottom: "32px", overflowX: "auto", whiteSpace: "nowrap", padding: "10px 0" }}>
  {[
    { id: "gallery-section", label: "GALLERY" },
    { id: "stories-section", label: "STORIES" },
    { id: "expeditions-section", label: "EXPEDITIONS" },
    { id: "users-section", label: "USERS" },
    { id: "proposals-section", label: "PROPOSALS" },
    { id: "activities-section", label: "ACTIVITIES" },
    { id: "reminders-section", label: "REMINDERS" },
  ].map(({ id, label }) => (
    <a key={id} href={`#${id}`} className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
      style={{ fontSize: "0.58rem", letterSpacing: "0.12em", padding: "4px 16px", textDecoration: "none", display: "inline-block" }}>
      {label}
    </a>
  ))}
</nav>
```

Add matching `id` props to each `<Section>` call:
```tsx
<Section id="gallery-section" title={`GALLERY PENDING (${...})`}>
<Section id="stories-section" title={`STORIES PENDING (${...})`}>
<Section id="expeditions-section" title="EXPEDITIONS">
<Section id="users-section" title="USERS">
<Section id="proposals-section" title="PROPOSALS">
<Section id="activities-section" title="ACTIVITY CATEGORIES">
<Section id="reminders-section" title="REMINDERS">
```

- [ ] **Step 3: Add role detection to expedition listing page**

In `app/(pages)/expeditions/page.tsx`, in `ExpeditionsPage` (currently line 56), add user + profile fetch after `const supabase = await createClient()`:

```typescript
const [{ data: { user } }, locale] = await Promise.all([
  supabase.auth.getUser(),
  getLocale(),
]);

let isAdmin = false;
if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  isAdmin = profile?.is_admin ?? false;
}
```

Remove the existing `const locale = await getLocale();` line (it's now inside the Promise.all).

- [ ] **Step 4: Render conditional button**

Replace the button at lines 123–129 (`+ PROPOSE TRIP`) with:

```tsx
{isAdmin ? (
  <Link
    href="/admin#expeditions-section"
    className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
    style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 20px", whiteSpace: "nowrap", textDecoration: "none" }}
  >
    + CREATE TRIP
  </Link>
) : (
  <Link
    href="/expeditions/propose"
    className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
    style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 20px", whiteSpace: "nowrap", textDecoration: "none" }}
  >
    + PROPOSE TRIP
  </Link>
)}
```

- [ ] **Step 5: Manual smoke test**

1. Visit `/admin` as admin → sticky nav appears at top, links scroll to sections
2. Visit `/expeditions` as admin → button shows "CREATE TRIP", clicking goes to `/admin#expeditions-section`
3. Visit `/expeditions` as non-admin / logged out → button shows "PROPOSE TRIP"

- [ ] **Step 6: Commit**

```bash
git add app/(pages)/admin/page.tsx app/(pages)/expeditions/page.tsx
git commit -m "feat(nav): admin section nav anchors, role-aware Create/Propose Trip button"
```

---

## Task 4: Activity Filter Strip

**Files:**
- Modify: `types/expedition.ts` — add `activity_category`
- Modify: `app/(pages)/expeditions/page.tsx` — query, URL param, filter strip UI

**Interfaces:**
- Consumes: `GET /api/admin/activities` (via direct Supabase query in server component) for chip labels
- Produces: expedition cards expose `activity_category` field; URL param `?activity=X` filters results

- [ ] **Step 1: Update Trip type**

In `types/expedition.ts`, add `activity_category` to the `Trip` type:

```typescript
export type Trip = {
  id: string;
  name: string;
  location: string;
  difficulty: string;
  description: string | null;
  price: string;
  date_start: string;
  date_end: string;
  leader_id: string;
  quota_max: number;
  image_url: string;
  member_count: number;
  featured?: boolean;
  status?: string | null;
  price_amount?: number | null;
  requires_approval?: boolean;
  application_prompt?: string | null;
  activity_category?: string | null;
};
```

- [ ] **Step 2: Update SearchParams type and listing query**

In `app/(pages)/expeditions/page.tsx`:

Update `SearchParams` type (line 33) to include `activity`:
```typescript
type SearchParams = Promise<{ difficulty?: string; page?: string; status?: string; activity?: string }>;
```

Update destructuring (line 57) to extract `activity`:
```typescript
const { difficulty, page: pageStr, status, activity } = await searchParams;
```

Update the main query (line 65–73) to add `activity_category` to select and add filter:
```typescript
let query = supabase
  .from("expeditions")
  .select("id, name, location, difficulty, price, date_start, date_end, quota_max, image_url, status, featured, activity_category, expedition_members(count)", { count: "exact" })
  .order("featured", { ascending: false })
  .order("date_start", { ascending: true });

if (difficulty) query = query.eq("difficulty", difficulty);
if (status) query = query.eq("status", status);
if (activity) query = query.eq("activity_category", activity);
```

Fetch active activities for filter chips (add after the ratings fetch, around line 83):
```typescript
const { data: activityRows } = await supabase
  .from("activities")
  .select("name")
  .eq("archived", false)
  .order("name", { ascending: true });
const activityNames = activityRows?.map((r) => r.name) ?? [];
```

- [ ] **Step 3: Update pillHref to accept activity param**

Replace `pillHref` function (lines 85–90):
```typescript
function pillHref(d?: string, s?: string, a?: string) {
  const p = new URLSearchParams();
  if (d) p.set("difficulty", d);
  if (s) p.set("status", s);
  if (a) p.set("activity", a);
  return `/expeditions${p.size ? "?" + p.toString() : ""}`;
}
```

Update all existing pill links (status and difficulty) to pass the `activity` param through so it's preserved when switching other filters. Status pills: `pillHref(difficulty, sf.value, activity)`. Difficulty pills: `pillHref(d.value, status, activity)` for active, `pillHref(undefined, status, activity)` for "All".

- [ ] **Step 4: Replace the difficulty filter section with a horizontal scroll strip**

Replace lines 153–169 (the difficulty filter `<div>`) with a combined difficulty + activity scrollable strip:

```tsx
{/* Difficulty + Activity horizontal scroll strip */}
<div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", whiteSpace: "nowrap", marginBottom: "48px", paddingBottom: "4px" }}>
  {/* Difficulty section */}
  <span className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", display: "inline-block", verticalAlign: "middle", marginRight: "8px" }}>
    DIFFICULTY
  </span>
  <Link href={pillHref(undefined, status, activity)} className="font-body font-semibold transition-all duration-150"
    style={{ fontSize: "0.66rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid", display: "inline-block", verticalAlign: "middle", marginRight: "6px", textDecoration: "none",
      background: !difficulty ? "#9BFF3C" : "transparent", color: !difficulty ? "#111111" : "#8B7355", borderColor: !difficulty ? "#9BFF3C" : "rgba(74,59,42,0.5)" }}>
    {t(locale, "all_levels")}
  </Link>
  {DIFFICULTIES.map((d) => {
    const active = difficulty === d.value;
    return (
      <Link key={d.value} href={pillHref(d.value, status, activity)} className="font-body font-semibold transition-all duration-150" title={d.desc}
        style={{ fontSize: "0.66rem", letterSpacing: "0.08em", padding: "7px 14px", border: "1px solid", display: "inline-block", verticalAlign: "middle", marginRight: "6px", textDecoration: "none",
          background: active ? "#9BFF3C" : "transparent", color: active ? "#111111" : "#8B7355", borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)" }}>
        {d.label}
      </Link>
    );
  })}

  {/* Separator */}
  <span style={{ display: "inline-block", verticalAlign: "middle", color: "rgba(74,59,42,0.5)", margin: "0 12px", fontSize: "1rem" }}>|</span>

  {/* Activity section */}
  <span className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", display: "inline-block", verticalAlign: "middle", marginRight: "8px" }}>
    ACTIVITY
  </span>
  <Link href={pillHref(difficulty, status, undefined)} className="font-body font-semibold transition-all duration-150"
    style={{ fontSize: "0.66rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid", display: "inline-block", verticalAlign: "middle", marginRight: "6px", textDecoration: "none",
      background: !activity ? "#FF6B1A" : "transparent", color: !activity ? "#111111" : "#8B7355", borderColor: !activity ? "#FF6B1A" : "rgba(74,59,42,0.5)" }}>
    All
  </Link>
  {activityNames.map((name) => {
    const active = activity === name;
    return (
      <Link key={name} href={pillHref(difficulty, status, name)} className="font-body font-semibold transition-all duration-150"
        style={{ fontSize: "0.66rem", letterSpacing: "0.08em", padding: "7px 14px", border: "1px solid", display: "inline-block", verticalAlign: "middle", marginRight: "6px", textDecoration: "none",
          background: active ? "#FF6B1A" : "transparent", color: active ? "#111111" : "#8B7355", borderColor: active ? "#FF6B1A" : "rgba(74,59,42,0.5)" }}>
        {name}
      </Link>
    );
  })}
</div>
```

- [ ] **Step 5: Update pagination links to include activity param**

The pagination links at lines 248 and 258 currently build URLs manually. Update them to use `pillHref` or manually add `activity` param alongside `difficulty` and `status`. Find/replace the pagination href construction:

Replace the `← PREV` href:
```
href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}${status ? `status=${status}&` : ""}${activity ? `activity=${encodeURIComponent(activity)}&` : ""}page=${page - 1}`}
```
Replace the `NEXT →` href:
```
href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}${status ? `status=${status}&` : ""}${activity ? `activity=${encodeURIComponent(activity)}&` : ""}page=${page + 1}`}
```

- [ ] **Step 6: Manual smoke test**

1. `/expeditions` → see Difficulty + Activity in single scrollable row
2. Click "Hiking" → URL has `?activity=Hiking`, cards filter to hiking expeditions
3. Click a difficulty → both filters preserved in URL
4. Paginate → activity param preserved
5. On mobile width → strip scrolls horizontally without wrapping

- [ ] **Step 7: Commit**

```bash
git add types/expedition.ts app/(pages)/expeditions/page.tsx
git commit -m "feat(filter): activity filter strip on expedition listing, preserve params across filters"
```

---

## Task 5: Trip Reminder Email Fix

**Files:**
- Modify: `lib/email.ts` — add `sendReminderEmail`
- Modify: `app/api/admin/reminders/route.ts` — call `sendReminderEmail`

**Interfaces:**
- Consumes: existing `base()` and `resend` singleton in `lib/email.ts`
- Produces: `sendReminderEmail(to, username, tripName, tripId, days)` — sends reminder-specific email

- [ ] **Step 1: Add sendReminderEmail to lib/email.ts**

Append after `sendProposalRejectedEmail` (around line 287), before `sendNewsletterEmail`:

```typescript
export async function sendReminderEmail(
  to: string,
  username: string,
  tripName: string,
  tripId: string,
  days: number
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${tripName} departs in ${days} day${days !== 1 ? "s" : ""}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#FF6B1A;text-transform:uppercase;">TRIP REMINDER</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${tripName}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          Hey @${username}, <strong style="color:#F0EDEA;">${tripName}</strong> departs in <strong style="color:#FF6B1A;">${days} day${days !== 1 ? "s" : ""}</strong>. Make sure you're prepared.
        </p>
        <a href="${SITE_URL}/expeditions/${tripId}" style="display:inline-block;background:#FF6B1A;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">
          VIEW EXPEDITION →
        </a>
      </td></tr>
    `),
  });
}
```

- [ ] **Step 2: Update reminder route to use sendReminderEmail**

In `app/api/admin/reminders/route.ts`, replace the import:
```typescript
import { sendReminderEmail } from "@/lib/email";
```
(Remove `sendExpeditionStatusEmail` from the import if it's no longer needed here.)

Change the email call inside the loop (line 38):
```typescript
await sendReminderEmail(p.email, p.username, exp.name, exp.id, days).catch(() => {});
```

- [ ] **Step 3: Verify**

In admin panel → Reminders section → set to 7 days → SEND REMINDERS.
Check email received (or check Resend dashboard) — subject should be `"Reminder: [tripName] departs in 7 days"` not `"Trip underway — [tripName]"`.

- [ ] **Step 4: Commit**

```bash
git add lib/email.ts app/api/admin/reminders/route.ts
git commit -m "fix(reminders): use correct reminder email template instead of ongoing status email"
```

---

## Task 6: Approve / Revoke Member Workflow

**Files:**
- Modify: `app/api/expeditions/[id]/members/[memberId]/route.ts` — add `"pending"` action
- Create: `components/MemberManagement.tsx` — client component with loading state, confirm dialogs, revoke
- Modify: `app/(pages)/expeditions/[id]/page.tsx` — replace inline member buttons with MemberManagement

**Interfaces:**
- Consumes: `PATCH /api/expeditions/[id]/members/[memberId]` with `{ action: "approve" | "reject" | "pending" }`
- Produces: `MemberManagement` component props: `{ expeditionId: string; isLeader: boolean; initialPending: PendingMember[]; initialApproved: ApprovedMember[] }`

Where:
```typescript
type PendingMember = { user_id: string; profiles: { username: string } | null };
type ApprovedMember = { user_id: string; profiles: { username: string; avatar_url: string | null } | null };
```

- [ ] **Step 1: Add "pending" action to member PATCH route**

In `app/api/expeditions/[id]/members/[memberId]/route.ts`, update the action validation (line 25) and add handler:

```typescript
// Replace the validation line:
if (action !== "approve" && action !== "reject" && action !== "pending") {
  return NextResponse.json({ error: "action must be approve, reject, or pending" }, { status: 400 });
}

// Add before the existing "if (action === 'reject')" block:
if (action === "pending") {
  const { error } = await supabase
    .from("expedition_members")
    .update({ status: "pending" })
    .eq("expedition_id", id)
    .eq("user_id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create MemberManagement client component**

Create `components/MemberManagement.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";

type PendingMember = { user_id: string; profiles: { username: string } | null };
type ApprovedMember = { user_id: string; profiles: { username: string; avatar_url: string | null } | null };

export default function MemberManagement({
  expeditionId,
  currentUserId,
  initialPending,
  initialApproved,
  locale,
}: {
  expeditionId: string;
  currentUserId: string | null;
  initialPending: PendingMember[];
  initialApproved: ApprovedMember[];
  locale: string;
}) {
  const [pending, setPending] = useState<PendingMember[]>(initialPending);
  const [approved, setApproved] = useState<ApprovedMember[]>(initialApproved);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const t = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      en: { approve: "APPROVE", reject: "REJECT", revoke: "REVOKE", pending_members: "PENDING", crew: "CREW" },
      id: { approve: "TERIMA", reject: "TOLAK", revoke: "CABUT", pending_members: "MENUNGGU", crew: "CREW" },
    };
    return map[locale]?.[key] ?? map.en[key] ?? key;
  };

  async function action(userId: string, act: "approve" | "reject" | "pending") {
    setLoadingId(userId);
    await fetch(`/api/expeditions/${expeditionId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    setLoadingId(null);

    if (act === "approve") {
      const member = pending.find((m) => m.user_id === userId);
      if (member) {
        setPending((prev) => prev.filter((m) => m.user_id !== userId));
        setApproved((prev) => [...prev, { ...member, profiles: member.profiles as { username: string; avatar_url: string | null } | null }]);
      }
    } else if (act === "reject") {
      setPending((prev) => prev.filter((m) => m.user_id !== userId));
    } else if (act === "pending") {
      const member = approved.find((m) => m.user_id === userId);
      if (member) {
        setApproved((prev) => prev.filter((m) => m.user_id !== userId));
        setPending((prev) => [...prev, { ...member, profiles: member.profiles as { username: string } | null }]);
      }
    }
  }

  const BTN: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    padding: "5px 12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  };

  return (
    <>
      {/* Pending members */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(155,255,60,0.2)" }}>
          <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "12px" }}>
            {t("pending_members")} ({pending.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pending.map((m) => {
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string } | null;
              if (!profile) return null;
              const busy = loadingId === m.user_id;
              return (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className="font-body font-semibold text-off-white" style={{ fontSize: "0.78rem", letterSpacing: "0.04em", flex: 1 }}>
                    @{profile.username}
                  </span>
                  <button
                    onClick={() => action(m.user_id, "approve")}
                    disabled={busy}
                    className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                    style={{ ...BTN, opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? "…" : t("approve")}
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Remove @${profile.username} from this expedition? This cannot be undone.`)) return;
                      action(m.user_id, "reject");
                    }}
                    disabled={busy}
                    className="font-body font-semibold text-off-white hover:text-chaos-orange transition-colors duration-150"
                    style={{ ...BTN, border: "1px solid rgba(255,107,26,0.4)", background: "transparent", opacity: busy ? 0.5 : 1 }}
                  >
                    {t("reject")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved members */}
      {approved.length > 0 && (
        <div>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "14px" }}>
            {t("crew")} ({approved.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {approved.map((m) => {
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; avatar_url: string | null } | null;
              if (!profile) return null;
              const busy = loadingId === m.user_id;
              const isSelf = m.user_id === currentUserId;
              return (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Link
                    href={`/u/${profile.username}`}
                    className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                    style={{ fontSize: "0.72rem", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid rgba(74,59,42,0.4)", background: "#1a1a1a" }}
                  >
                    @{profile.username}
                  </Link>
                  {!isSelf && (
                    <button
                      onClick={() => {
                        if (!confirm(`Revoke approval for @${profile.username}? They'll return to the pending list.`)) return;
                        action(m.user_id, "pending");
                      }}
                      disabled={busy}
                      className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                      style={{ ...BTN, background: "none", border: "none", fontSize: "0.6rem", padding: "4px 6px", opacity: busy ? 0.5 : 1 }}
                      title="Revoke approval"
                    >
                      {busy ? "…" : "↩"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Replace inline member buttons in expedition detail page**

In `app/(pages)/expeditions/[id]/page.tsx`:

Add import at top:
```typescript
import MemberManagement from "@/components/MemberManagement";
```

Find the section that renders pending members and approved members (lines 328–418). The section currently renders:
1. Pending members block (lines 328–367) — guarded by `isLeader && pendingMembers.length > 0`
2. Approved members block (lines 369–419) — guarded by `approvedMembers.length`

Replace BOTH blocks with a single `<MemberManagement />` component:

```tsx
{isLeader ? (
  <MemberManagement
    expeditionId={id}
    currentUserId={user?.id ?? null}
    initialPending={pendingMembers.map((m) => ({
      user_id: m.user_id,
      profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles as { username: string } | null,
    }))}
    initialApproved={approvedMembers.map((m) => ({
      user_id: m.user_id,
      profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles as { username: string; avatar_url: string | null } | null,
    }))}
    locale={locale}
  />
) : approvedMembers.length > 0 ? (
  <div>
    <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "14px" }}>
      {t(locale, "crew")} ({memberCount ?? 0})
    </p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {approvedMembers.map((m) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; avatar_url: string | null } | null;
        if (!profile) return null;
        return (
          <Link key={m.user_id} href={`/u/${profile.username}`}
            className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
            style={{ fontSize: "0.72rem", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid rgba(74,59,42,0.4)", background: "#1a1a1a" }}>
            @{profile.username}
          </Link>
        );
      })}
    </div>
  </div>
) : null}
```

Note: The existing code had a "EXPORT CSV" link inside the approved section. Move that outside the replaced block, keeping it inside the `{isLeader && (...)}`  guard above the MemberManagement component:

```tsx
{isLeader && (
  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
    <a href={`/api/expeditions/${id}/export`} download
      className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
      style={{ fontSize: "0.58rem", letterSpacing: "0.1em", border: "1px solid rgba(74,59,42,0.4)", padding: "4px 10px", textDecoration: "none" }}>
      {t(locale, "export_csv")}
    </a>
  </div>
)}
```

- [ ] **Step 4: Manual smoke test**

1. As expedition leader, go to `/expeditions/[id]`
2. Pending member row: clicking APPROVE moves member to crew list immediately (no reload)
3. Clicking REJECT shows confirm dialog, on confirm removes from pending (no reload)
4. Approved member: ↩ button shows on hover, clicking shows confirm ("Revoke approval..."), on confirm moves member back to pending
5. While an action is in flight, buttons are disabled (busy state)
6. Non-leader viewing: sees crew list without REVOKE buttons

- [ ] **Step 5: Commit**

```bash
git add app/api/expeditions/[id]/members/[memberId]/route.ts components/MemberManagement.tsx app/(pages)/expeditions/[id]/page.tsx
git commit -m "feat(members): approve/revoke workflow with optimistic UI, confirm dialogs, loading states"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Task 1: Role-aware button (admin → CREATE TRIP → /admin#expeditions-section)
- ✅ Task 2: Activity filter strip (horizontal scroll, difficulty + activity, URL params)
- ✅ Task 3: Admin activities CRUD (migration, API, AdminActivitiesSection, dynamic dropdowns)
- ✅ Task 4: Reminder email template fix (sendReminderEmail replaces sendExpeditionStatusEmail)
- ✅ Task 5: Approve reversible (REVOKE → pending), Reject irreversible with confirm
- ✅ Task 6 written IA recommendation: already in spec file — no implementation needed here

**Note on Task 3's propose page:** Check `app/api/expeditions/proposals/route.ts` to confirm `activity_category` is included in the proposal insert — if not, add it during Task 2 implementation.

**Note on the "Export CSV" link:** In the original code, the CSV export link was inside the `approvedMembers` block alongside the REVOKE button. In the new structure, it must move outside of `MemberManagement` but remain leader-only. The plan above handles this correctly.

**Type consistency:** `PendingMember.profiles` and `ApprovedMember.profiles` match the shapes passed from the server component — both match the Supabase joined query result pattern used throughout this codebase.

---

## Verification Checklist

After all tasks complete:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `/admin` sticky nav appears, all anchor links scroll correctly
- [ ] `/expeditions` — admin sees "CREATE TRIP", non-admin sees "PROPOSE TRIP"
- [ ] `/expeditions?activity=Hiking` — filters to hiking expeditions only
- [ ] `/expeditions?difficulty=Moderate&activity=Hiking` — both filters active simultaneously
- [ ] `/admin` Activities section — CRUD all operations work
- [ ] Admin expedition form → Activity dropdown populated from DB
- [ ] `/expeditions/propose` → Activity select visible
- [ ] Reminder send → correct subject line in email
- [ ] `/expeditions/[id]` as leader → REVOKE button on approved members, confirm before revoke
- [ ] Approve/reject → optimistic update, no page reload
