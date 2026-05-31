-- Vision360 data schema.
-- Each module is a JSONB document store: lossless for the rich records the app
-- uses, while still queryable/indexable through the `data` column. The app's
-- record `id` is the primary key.

create table if not exists clients (
  id         text primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
