// Optional Postgres write-through for the module stores.
//
// Every store keeps its synchronous in-memory + localStorage cache as the
// PRIMARY data model, so the UI never blocks and needs no loading states. This
// layer adds a backend when one is configured:
//   • on first mount it hydrates the store from GET /api/<module>;
//   • every create/update/delete writes through to the API.
// When no backend is reachable (no DATABASE_URL on the server → 503, or the API
// isn't deployed → the SPA returns HTML), the fetches fail quietly and the
// store stays on localStorage — identical to the app's offline behaviour.
//
// Empty-table bootstrap: if the backend is reachable but the table is empty
// (a freshly provisioned database), the store seeds it from its current
// snapshot. That makes the built-in demo data the shared baseline and stops it
// from vanishing the moment the first real record is created, and it migrates
// any work a user already did offline into the new database.

type Id = string | number;

export interface ApiSync<T> {
  /** Pull from the API once; `applyRows` replaces the store's collection. */
  hydrate: (current: T[], applyRows: (rows: T[]) => void) => void;
  persistNew: (record: T) => void;
  persistPatch: (id: Id, patch: Partial<T>) => void;
  persistDelete: (id: Id) => void;
}

export function createApiSync<T>(module: string, getId: (record: T) => Id): ApiSync<T> {
  const API = `/api/${module}`;
  const canFetch = typeof fetch !== "undefined";
  let hydrated = false;

  const persistNew: ApiSync<T>["persistNew"] = (record) => {
    if (!canFetch) return;
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch(() => { /* best-effort; the record stays in the local cache */ });
  };

  const persistPatch: ApiSync<T>["persistPatch"] = (id, patch) => {
    if (!canFetch) return;
    fetch(`${API}/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => { /* best-effort */ });
  };

  const persistDelete: ApiSync<T>["persistDelete"] = (id) => {
    if (!canFetch) return;
    fetch(`${API}/${encodeURIComponent(String(id))}`, { method: "DELETE" })
      .catch(() => { /* best-effort */ });
  };

  const hydrate: ApiSync<T>["hydrate"] = (current, applyRows) => {
    if (hydrated || !canFetch) return;
    hydrated = true;
    (async () => {
      try {
        const res = await fetch(API, { headers: { Accept: "application/json" } });
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) return; // no backend → keep cache
        const rows = await res.json();
        if (!Array.isArray(rows)) return;
        if (rows.length) {
          applyRows(rows as T[]);
        } else {
          // Reachable but empty → seed the database from the current snapshot.
          current.forEach((record) => persistNew(record));
        }
      } catch {
        /* backend unreachable → keep cache */
      }
    })();
  };

  // getId is part of the contract (callers pass it for clarity / future use);
  // referenced here so unused-parameter lint stays quiet.
  void getId;

  return { hydrate, persistNew, persistPatch, persistDelete };
}
