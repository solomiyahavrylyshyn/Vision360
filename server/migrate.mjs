// Applies schema.sql and seeds the demo clients (idempotent).
// Run with:  npm run db:migrate   (reads .env for DATABASE_URL)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { query, isConfigured, getPool } from "./db.mjs";
import { seedClients } from "./seed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!isConfigured()) {
    console.error("✗ DATABASE_URL is not set. Copy .env.example to .env and fill in your Postgres connection string.");
    process.exit(1);
  }
  const sql = await readFile(path.join(__dirname, "schema.sql"), "utf8");
  console.log("→ Applying schema…");
  await query(sql);
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
