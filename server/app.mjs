// Vision360 API — a thin Express layer over Postgres, exported as an app so it
// can run both as a standalone server (server/index.mjs, local dev) and as a
// Vercel serverless function (api/[...path].mjs, production).
//
// Each module is a JSONB document collection. The frontend stores hydrate from
// GET /api/<module> and write through POST/PATCH/DELETE. Module names are
// allow-listed so the table name can be safely interpolated (no SQL injection).
import express from "express";
import cors from "cors";
import { query, isConfigured, ensureSchema } from "./db.mjs";

const MODULES = new Set(["clients", "jobs", "estimates", "invoices", "payments", "items", "expenses"]);

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));

  const guard = (req, res) => {
    if (!MODULES.has(req.params.module)) { res.status(404).json({ error: "unknown module" }); return false; }
    return true;
  };

  // Run any data route only once the schema exists; on any DB error report 503
  // so the frontend silently falls back to its cache.
  const withDb = (handler) => async (req, res) => {
    if (!guard(req, res)) return;
    try {
      await ensureSchema();
      await handler(req, res);
    } catch (e) {
      res.status(503).json({ error: e.message });
    }
  };

  app.get("/api/health", (_req, res) => res.json({ ok: true, dbConfigured: isConfigured() }));

  // List
  app.get("/api/:module", withDb(async (req, res) => {
    const r = await query(`select data from ${req.params.module} order by created_at asc`);
    res.json(r.rows.map((row) => row.data));
  }));

  // Get one
  app.get("/api/:module/:id", withDb(async (req, res) => {
    const r = await query(`select data from ${req.params.module} where id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0].data);
  }));

  // Create / upsert (body must include id)
  app.post("/api/:module", withDb(async (req, res) => {
    const rec = req.body;
    if (!rec || rec.id == null) return res.status(400).json({ error: "record.id is required" });
    await query(
      `insert into ${req.params.module} (id, data) values ($1, $2::jsonb)
       on conflict (id) do update set data = excluded.data, updated_at = now()`,
      [String(rec.id), JSON.stringify(rec)],
    );
    res.status(201).json(rec);
  }));

  // Patch (shallow top-level merge into the JSONB document)
  app.patch("/api/:module/:id", withDb(async (req, res) => {
    const r = await query(
      `update ${req.params.module} set data = data || $2::jsonb, updated_at = now()
       where id = $1 returning data`,
      [req.params.id, JSON.stringify(req.body || {})],
    );
    if (!r.rows.length) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0].data);
  }));

  // Delete (so bulk-archive / delete in the UI removes the row for good — without
  // this a deleted record would reappear on the next hydrate).
  app.delete("/api/:module/:id", withDb(async (req, res) => {
    await query(`delete from ${req.params.module} where id = $1`, [req.params.id]);
    res.status(204).end();
  }));

  return app;
}
