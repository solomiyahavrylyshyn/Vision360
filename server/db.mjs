// Postgres connection pool. Reads DATABASE_URL from the environment (.env).
// If DATABASE_URL is absent the API stays up but data routes report 503 so the
// frontend can fall back to its in-memory seed.
import pg from "pg";

let pool = null;

export function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!isConfigured()) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
      max: 10,
    });
    pool.on("error", (err) => console.error("[db] pool error:", err.message));
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not configured");
  return p.query(text, params);
}
