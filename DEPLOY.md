# Deploying Vision360 with a real database

By default the app stores everything in the browser's `localStorage`: data is
per-browser and never shared. To make data **persist for real and be shared
across devices and people**, deploy on Vercel with a managed Postgres database.

The code is already wired for this. You only need to (1) create a database and
(2) give Vercel its connection string. Nothing else changes — until a database
is configured, the app keeps working exactly as before on `localStorage`.

## How it works

- The frontend (static SPA) is served by Vercel.
- `api/[...path].mjs` is a Vercel serverless function that runs the Express API
  in `server/`. All `/api/*` requests go to it.
- The API stores each module (clients, jobs, estimates, invoices, payments,
  items, expenses) as a JSONB document collection in Postgres.
- On first request the API **creates its tables automatically** — no migration
  step required.
- On first load against an empty database, the app **seeds it** from the
  built-in demo data, so you start populated and your work persists from then on.
- If `DATABASE_URL` is missing or the database is unreachable, every store
  silently falls back to `localStorage` — the app never breaks.

## One-time setup

### 1. Create a Postgres database (free tier is fine)

Pick one provider and copy its **connection string**:

- **Vercel Postgres** — Vercel dashboard → Storage → Create Database → Postgres.
  It auto-adds `DATABASE_URL` to your project; skip step 2.
- **Neon** (https://neon.tech) — create a project, copy the **pooled**
  connection string (host contains `-pooler`).
- **Supabase** (https://supabase.com) — Project → Settings → Database → copy the
  connection string (use the connection **pooler** URL).

TLS is enabled automatically for any non-local host, so the string works as-is.

### 2. Add the connection string to Vercel

Vercel project → **Settings → Environment Variables** → add:

| Name           | Value                                   | Environments            |
| -------------- | --------------------------------------- | ----------------------- |
| `DATABASE_URL` | *(the connection string from step 1)*   | Production, Preview      |

(If you used Vercel Postgres, this variable is already there.)

### 3. Redeploy

Trigger a redeploy (push a commit, or Vercel dashboard → Deployments → Redeploy)
so the new environment variable takes effect.

## Verify it worked

After the deploy finishes:

```bash
curl https://YOUR-APP.vercel.app/api/health
# → {"ok":true,"dbConfigured":true}     ← dbConfigured must be true
```

Then create a client (or expense/item) in the app, open the site in a **second
browser or on your phone**, and confirm the record is there. That proves the
data is server-side and shared.

## Local development with the database

```bash
cp server/.env.example server/.env      # fill in DATABASE_URL
npm run dev:all                          # web + API together
curl http://localhost:4000/api/health    # {"ok":true,"dbConfigured":true}
```

Vite proxies `/api/*` to the local API on port 4000. Without `server/.env` the
app still runs — on `localStorage`, exactly like production without a database.

## Notes

- `npm run db:migrate` is **optional** (the API auto-creates tables). Use it
  only to pre-create/seed the DB from a terminal.
- Prefer a **pooled** connection string on serverless (Neon/Supabase poolers,
  Vercel Postgres) to avoid exhausting Postgres connections under load.
