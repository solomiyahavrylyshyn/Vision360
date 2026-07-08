// Postgres connection pool. Reads DATABASE_URL from the environment.
// If DATABASE_URL is absent the API stays up but data routes report 503 so the
// frontend can fall back to its in-memory seed / localStorage cache.
import pg from "pg";
import { SCHEMA_SQL } from "./schema.mjs";

let pool = null;

export function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

// Managed Postgres (Neon, Vercel Postgres, Supabase, Railway…) requires TLS;
// local Postgres does not. Auto-enable SSL for any non-local host so a hosted
// deployment works with just DATABASE_URL set. Override with PGSSL=true/false.
function needsSsl(connectionString) {
  if (process.env.PGSSL === "true") return true;
  if (process.env.PGSSL === "false") return false;
  try {
    const host = new URL(connectionString).hostname;
    return !(host === "localhost" || host === "127.0.0.1" || host.endsWith(".local"));
  } catch {
    return false;
  }
}

export function getPool() {
  if (!isConfigured()) return null;
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new pg.Pool({
      connectionString,
      ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
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

// Create the tables on first use (idempotent). Memoized so it runs once per
// warm serverless instance / process. This lets a hosted deployment work with
// only DATABASE_URL set — no separate migrate step required.
let schemaReady = null;
export function ensureSchema() {
  if (!isConfigured()) return Promise.reject(new Error("DATABASE_URL is not configured"));
  if (!schemaReady) {
    schemaReady = query(SCHEMA_SQL).catch((e) => {
      schemaReady = null; // let a later request retry if the first attempt failed
      throw e;
    });
  }
  return schemaReady;
}
