# Vision360 — Postgres data layer

A small Express + [`pg`](https://node-postgres.com/) API that stores app data in
your **local Postgres**. The frontend stores hydrate from `/api/<module>` and
write through on every change. Each module is a JSONB document collection
(`clients`, `jobs`, `estimates`, `invoices`, `payments`, `items`, `expenses`),
which is lossless for the app's rich records and still queryable.

If the API/DB isn't running, the app **falls back to its built-in seed data /
localStorage**, so nothing breaks during normal frontend work.

**Deploying to production?** See [`../DEPLOY.md`](../DEPLOY.md) — on Vercel the
API runs as a serverless function (`api/[...path].mjs`) and you only need to set
`DATABASE_URL`.

## One-time setup (local)

1. **Create the database** (Postgres running on `localhost:5432`):

   ```sql
   CREATE DATABASE vision360;
   ```

2. **Add your credentials.** Copy the example env file and fill in your Postgres
   password (`.env` is git-ignored — credentials never get committed):

   ```bash
   cp .env.example .env
   # edit .env → DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vision360
   ```

3. **(Optional) Pre-create the schema + seed demo clients.** The API creates its
   tables automatically on first request and the frontend self-seeds an empty
   database, so this is only for pre-populating from a terminal:

   ```bash
   npm run db:migrate
   ```

## Running

```bash
npm run dev:all     # Vite (web) + API server together
# — or in two terminals —
npm run dev         # frontend only
npm run server      # API only  → http://localhost:4000
```

Vite proxies `/api/*` to the API server (port `4000`). Verify with:

```bash
curl http://localhost:4000/api/health      # {"ok":true,"dbConfigured":true}
curl http://localhost:4000/api/clients      # seeded clients as JSON
```

## API

| Method | Route                 | Purpose                                  |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/api/health`         | Liveness + whether `DATABASE_URL` is set |
| GET    | `/api/:module`        | List all records                         |
| GET    | `/api/:module/:id`    | One record                               |
| POST   | `/api/:module`        | Create / upsert (body must include `id`) |
| PATCH  | `/api/:module/:id`    | Shallow-merge fields into the record     |
| DELETE | `/api/:module/:id`    | Delete a record                          |

`:module` is allow-listed (no SQL injection via the table name).

## Status

All seven modules — **clients, jobs, estimates, invoices, payments, items,
expenses** — are wired end-to-end: each store hydrates from the API on mount and
writes through on every create/update/delete (see `src/app/stores/apiSync.ts`).
When no database is configured they fall back to `localStorage`.
