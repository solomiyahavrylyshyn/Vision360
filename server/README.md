# Vision360 — Postgres data layer

A small Express + [`pg`](https://node-postgres.com/) API that stores app data in
your **local Postgres**. The frontend stores hydrate from `/api/<module>` and
write through on every change. Each module is a JSONB document collection
(`clients`, `jobs`, `estimates`, `invoices`, `payments`, `items`, `expenses`),
which is lossless for the app's rich records and still queryable.

If the API/DB isn't running, the app **falls back to its built-in seed data**, so
nothing breaks during normal frontend work.

## One-time setup

1. **Create the database** (you already have Postgres running on `localhost:5432`):

   ```sql
   CREATE DATABASE vision360;
   ```

2. **Add your credentials.** Copy the example env file and fill in your Postgres
   password (`.env` is git-ignored — credentials never get committed):

   ```bash
   cp .env.example .env
   # edit .env → DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vision360
   ```

3. **Create the schema + seed demo data** (idempotent — safe to re-run):

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

`:module` is allow-listed (no SQL injection via the table name).

## Status

- **Clients** — wired end-to-end (list, detail, create, edits all persist).
- **Other modules** — tables + API ready; UI wiring rolls out next using the
  same hydrate + write-through pattern in `src/app/stores`.
