# Deploy — Vakansisme

Next.js 16 (App Router) + Supabase + Resend. Host on **Vercel**, DB stays on **Supabase**.

---

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial production build"
git branch -M main
git remote add origin https://github.com/<you>/vakansisme.git
git push -u origin main
```

> `.env.local` is gitignored — secrets are NOT committed. Good.

---

## 2. Run database migrations (Supabase)

Supabase Dashboard → **SQL Editor** → run in order (skip ones already run):

1. `supabase/migrations/001_expeditions.sql`
2. `supabase/migrations/002_stories.sql`
3. `supabase/migrations/003_subscribers.sql`
4. `supabase/migrations/004_chaos.sql`
5. `supabase/migrations/005_crew.sql`
6. `supabase/migrations/006_storage.sql`
7. `supabase/migrations/007_admin.sql`
8. `supabase/migrations/008_expedition_description.sql`
9. `supabase/migrations/009_fixes.sql`

Then make yourself admin:

```sql
UPDATE profiles SET is_admin = true WHERE username = 'your_username';
```

Approve existing seed chaos cards (optional, so the wall isn't empty):

```sql
UPDATE chaos_submissions SET status = 'approved';
```

---

## 3. Import to Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
2. Framework auto-detects **Next.js**. Leave build settings default.
3. Add **Environment Variables** (see `.env.example`):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM` | `VAKANSISME <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (or the `*.vercel.app` URL first) |

4. **Deploy.**

---

## 4. Custom domain (bought from Hostinger)

1. Vercel → project → **Settings → Domains → Add** → enter your domain. Vercel shows the records.
2. Hostinger **hPanel → Domains → [domain] → DNS / Nameservers → DNS Records**:
   - **A** record: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
   - Delete the old parking `@` A record if present.
3. Save → wait for DNS propagation (5 min – 2 h). SSL is issued automatically.

After the domain is live, set `NEXT_PUBLIC_SITE_URL` in Vercel to the real domain and **redeploy**.

---

## 5. Supabase Auth redirect URLs (critical)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: add `https://yourdomain.com/auth/callback`

Without this, email confirmation and login redirects fail in production.

---

## 6. Resend (email delivery)

1. [resend.com](https://resend.com) → **Domains** → add + verify your sending domain (DNS records in Hostinger).
2. Set `RESEND_FROM` to an address on that verified domain.

> Until a domain is verified, `onboarding@resend.dev` only delivers to your own Resend account email (sandbox).

---

## 7. Logo asset

Save the white logo as `public/logo.png`, commit, push. Nav + hero render it.

---

## 8. Smoke test on production

1. Register → check confirmation email → confirm.
2. Sign in → join a trip → button shows JOINED.
3. Submit a story → it stays pending (not public).
4. `/admin` → approve the story → it appears in `/stories`.
5. Submit chaos → approve in `/admin` → appears in `/chaos`.
6. Create an expedition in `/admin` → opens on `/expeditions`.

---

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

`.env.local` for local secrets (copy from `.env.example`, use `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).
