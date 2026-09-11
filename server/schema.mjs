// Vision360 data schema as an inlined string so it ships with the serverless
// bundle (a runtime readFile of schema.sql isn't guaranteed to be bundled on
// Vercel). Each module is a JSONB document store keyed by the app's record id.
// schema.sql mirrors this for reference / manual psql use.
export const SCHEMA_SQL = `
create table if not exists clients (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists clients_status_idx on clients ((data->>'status'));
create index if not exists clients_name_idx   on clients ((data->>'name'));

create table if not exists jobs (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists estimates (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists invoices (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists payments (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists items (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists expenses (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Company settings: one row per settings store (item categories, job types, tax
-- and regional settings, terms…), keyed by the store's name. Same document
-- shape as every other module, so the generic routes serve it unchanged.
create table if not exists settings (
  id text primary key, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
`;
