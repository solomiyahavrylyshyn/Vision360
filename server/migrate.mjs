// Applies the schema and seeds the demo clients (idempotent).
// Run with:  npm run db:migrate   (reads .env for DATABASE_URL)
//
// NOTE: this is OPTIONAL. The API creates its tables lazily on first request
// (ensureSchema), and the frontend self-seeds any empty table from its built-in
// demo data. Run this only if you want to pre-create/seed the DB from a terminal.
import { query, isConfigured, getPool } from "./db.mjs";
import { SCHEMA_SQL } from "./schema.mjs";
import { seedClients } from "./seed.mjs";

async function main() {
  if (!isConfigured()) {
    console.error("✗ DATABASE_URL is not set. Copy .env.example to .env and fill in your Postgres connection string.");
    process.exit(1);
  }
  console.log("→ Applying schema…");
  await query(SCHEMA_SQL);
  console.log("✓ Schema applied.");

  console.log("→ Seeding clients (idempotent)…");
  let inserted = 0;
  for (const c of seedClients) {
    const r = await query(
      "insert into clients (id, data) values ($1, $2::jsonb) on conflict (id) do nothing",
      [String(c.id), JSON.stringify(c)],
    );
    inserted += r.rowCount;
  }
  console.log(`✓ Seed complete (${inserted} new client row(s); existing rows left untouched).`);
  await getPool().end();
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ Migration failed:", e.message);
  process.exit(1);
});
