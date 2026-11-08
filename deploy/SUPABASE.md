# Hosting with Supabase (free)

Supabase runs the **database**. It doesn't host Next.js sites, so the website itself runs on a free
git-connected host: **Netlify** (recommended) or **Render**. Every push to `main` rebuilds the site
and applies any new database migrations to Supabase automatically.

```
GitHub (main) ──push──▶ Netlify / Render build
                          ├─ npm run db:migrate  → Supabase Postgres
                          ├─ npm run db:seed     (products, settings, first admin; never overwrites)
                          └─ next build → live site
```

## 1. Create the Supabase project
1. supabase.com → **New project**. Region: **South Asia (Mumbai)**. Save the database password.
2. Open **Connect** (top of the project page) and copy two URIs, replacing `[YOUR-PASSWORD]`:
   - **Transaction pooler** (port **6543**) → used by the website
   - **Session pooler** (port **5432**) → used for migrations

   Use the pooler URIs, not "Direct connection": the direct address is IPv6-only and most build servers can't reach it.

## 2a. Deploy on Netlify (recommended)
1. Push this repo to GitHub.
2. Open `https://app.netlify.com/start/deploy?repository=https://github.com/anthropologist-dev/goshala-store`
   (or Netlify → Add new project → Import from GitHub).
3. Fill in the variables it asks for (from `netlify.toml`):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Transaction pooler URI (port 6543) |
   | `DIRECT_DATABASE_URL` | Session pooler URI (port 5432) |
   | `AUTH_SECRET` | any 40+ character random string |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | your admin login (created on first deploy) |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.srishivasadgurugoshala.com` |

4. Deploy. Then **Domain management → Add a domain** and follow Netlify's DNS steps at Hostinger.

## 2b. Or deploy on Render
1. Open `https://render.com/deploy?repo=https://github.com/anthropologist-dev/goshala-store`.
2. Set `DATABASE_URL` to the **Session pooler** URI (port 5432), plus `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. The free plan sleeps after 15 idle minutes (about a minute to wake). Switch `plan: free` to `starter` in `render.yaml` for an always-on shop.

## 3. After the first deploy
- Log in at `/admin` → **Settings**: add your UPI ID, GSTIN, check the address.
- GitHub → repo **Settings → Secrets and variables → Actions → Variables** → add `SITE_URL` = your site address.
  This turns on the **keep-alive** workflow, which visits the shop every 3 days so Supabase doesn't pause the database.

## What's included
- `netlify.toml`: build, migrations and the one-click deploy prompts
- `render.yaml`: Render Blueprint (free plan, Supabase database)
- `.github/workflows/ci.yml`: typecheck, migrations and build on every push and pull request
- `.github/workflows/keep-alive.yml`: keeps the free Supabase project awake
- `drizzle/0001_enable_rls.sql`: turns on Row Level Security for every table, which shuts off Supabase's
  public REST API for this data. The store connects as the table owner, so it's unaffected.

## Free-tier limits to know
- **Supabase free:** 500 MB database (years of orders for a shop this size), 2 free projects, no automatic daily backups,
  and the project pauses after 7 days of low activity (the keep-alive handles this; a paused project can be resumed from the dashboard).
  Download a backup now and then: Supabase → Database → Backups, or `pg_dump` with the session pooler URI.
- **Netlify free:** 300 credits a month. A production deploy costs 15, bandwidth 20 per GB, requests 2 per 10,000.
  If credits run out, the site shows "not available" until the month resets, so avoid dozens of deploys a month.
