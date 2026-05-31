// Vision360 API — a thin Express layer over Postgres.
// Each module is a JSONB document collection. The frontend stores hydrate from
// GET /api/<module> and write through POST/PATCH. Module names are allow-listed
// so the table name can be safely interpolated (no SQL injection surface).
import express from "express";
import cors from "cors";
import { query, isConfigured } from "./db.mjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));

const PORT = process.env.PORT || 4000;
const MODULES = new Set(["clients", "jobs", "estimates", "invoices", "payments", "items", "expenses"]);
const guard = (req, res) => {
  if (!MODULES.has(req.params.module)) { res.status(404).json({ error: "unknown module" }); return false; }
  return true;
};

app.get("/api/health", (_req, res) => res.json({ ok: true, dbConfigured: isConfigured() }));

// List
app.get("/api/:module", async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const r = await query(`select data from ${req.params.module} order by created_at asc`);
    res.json(r.rows.map((row) => row.data));
  } catch (e) { res.status(503).json({ error: e.message }); }
});

// Get one
app.get("/api/:module/:id", async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const r = await query(`select data from ${req.params.module} where id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0].data);
  } catch (e) { res.status(503).json({ error: e.message }); }
});

// Create / upsert
app.post("/api/:module", async (req, res) => {
  if (!guard(req, res)) return;
  const rec = req.body;
  if (!rec || rec.id == null) return res.status(400).json({ error: "record.id is required" });
  try {
    await query(
      `insert into ${req.params.module} (id, data) values ($1, $2::jsonb)
       on conflict (id) do update set data = excluded.data, updated_at = now()`,
      [String(rec.id), JSON.stringify(rec)],
    );
    res.status(201).json(rec);
  } catch (e) { res.status(503).json({ error: e.message }); }
});

// Patch (shallow top-level merge into the JSONB document)
app.patch("/api/:module/:id", async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const r = await query(
      `update ${req.params.module} set data = data || $2::jsonb, updated_at = now()
       where id = $1 returning data`,
      [req.params.id, JSON.stringify(req.body || {})],
    );
    if (!r.rows.length) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0].data);
  } catch (e) { res.status(503).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(
    `[api] http://localhost:${PORT}  ·  db ${isConfigured() ? "configured" : "NOT configured (set DATABASE_URL in .env)"}`,
  );
});
