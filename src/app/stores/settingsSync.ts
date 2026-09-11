// Postgres write-through for the settings stores (item categories, job types,
// expense categories, terms, regional and schedule settings…).
//
// The record stores (clients, jobs, estimates…) hold collections and use
// apiSync, one row per record. A settings store instead holds ONE value — a
// list, or a settings object — so it is stored as a single row in the shared
// `settings` collection, keyed by the store's name.
//
// Same contract as apiSync: the in-memory + localStorage cache stays the
// primary model so the UI never blocks or needs loading states; the backend is
// an upgrade that makes the value shared across devices and people. With no
// backend reachable (no DATABASE_URL → 503, or the API not deployed → the SPA
// returns HTML) every call fails quietly and the store keeps working offline.

type Loaded<T> = { value: T };

export interface SettingsSync<T> {
  /** Pull the stored value once; `apply` replaces the store's state. */
  hydrate: (current: T, apply: (value: T) => void) => void;
  /** Write the whole value back. Called after every mutation. */
  persist: (value: T) => void;
}

export function createSettingsSync<T>(key: string): SettingsSync<T> {
  const API = "/api/settings";
  const canFetch = typeof fetch !== "undefined";
  let hydrated = false;

  const persist: SettingsSync<T>["persist"] = (value) => {
    if (!canFetch) return;
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, value }),
    }).catch(() => { /* best-effort; the value stays in the local cache */ });
  };

  const hydrate: SettingsSync<T>["hydrate"] = (current, apply) => {
    if (hydrated || !canFetch) return;
    hydrated = true;
    (async () => {
      try {
        const res = await fetch(`${API}/${encodeURIComponent(key)}`, { headers: { Accept: "application/json" } });
        const ct = res.headers.get("content-type") || "";
        // 404 = nothing stored yet: seed the row from what this browser has, so
        // the first device to load decides the starting point instead of the
        // company ending up with an empty settings list.
        if (res.status === 404) { persist(current); return; }
        if (!res.ok || !ct.includes("application/json")) return; // no backend → keep cache
        const row = (await res.json()) as Loaded<T> | null;
        if (row && row.value !== undefined && row.value !== null) apply(row.value);
      } catch {
        /* backend unreachable → keep cache */
      }
    })();
  };

  return { hydrate, persist };
}
