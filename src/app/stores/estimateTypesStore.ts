// Estimate types (FR-16.5) — a company-editable list managed in
// Settings → Estimates, exactly like job types (FR-16.4). Feeds the type picker
// on the estimate form (FR-5.19), the Estimates list quick filter and reports.

type Listener = () => void;
import { createSettingsSync } from "./settingsSync";

const LS_KEY = "vision360.estimateTypes.v1";

const SEED = ["Repair", "Installation", "Replacement", "Maintenance", "Diagnostic"];

let types: string[] = [...SEED];
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) types = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const sync = createSettingsSync<string[]>("estimateTypes");
const cacheLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(types)); } catch { /* quota */ }
};
// Every mutation caches locally AND writes through, so the value is shared
// across devices instead of living in one browser.
const saveLS = () => {
  cacheLS();
  sync.persist(types);
};

export const estimateTypesStore = {
  getSnapshot: (): string[] => types,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(types, (value) => { types = value; cacheLS(); notify(); });
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (name: string) => {
    const v = name.trim();
    if (!v || types.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    types = [...types, v];
    saveLS();
    notify();
  },
  rename: (prev: string, next: string) => {
    types = types.map((t) => (t === prev ? next : t));
    saveLS();
    notify();
  },
  remove: (name: string) => {
    types = types.filter((t) => t !== name);
    saveLS();
    notify();
  },
};
