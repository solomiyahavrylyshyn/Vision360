// Item categories store — the single source of truth for the category list used
// by the Create-item form, the Item-detail edit modal and the
// Settings > Items > Categories card.
//
// FR-16.6: categories are "a single customizable list, NOT scoped to item type".
// (An earlier build kept a separate list per item type; the v1 → v2 migration
// below flattens those into one list.)

import { TYPE_CATEGORIES } from "../pages/Items";

type Listener = () => void;

const LS_KEY = "vision360.itemCategories.v2";
const LS_KEY_V1 = "vision360.itemCategories.v1";

// Seeded from the canonical per-type taxonomy, flattened and de-duplicated.
const seed = (): string[] =>
  Array.from(new Set(Object.values(TYPE_CATEGORIES).flat()));

const flatten = (perType: Record<string, string[]>): string[] =>
  Array.from(new Set(Object.values(perType).flat().filter(Boolean)));

let categories: string[] = seed();
try {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) categories = parsed;
    } else {
      // Migrate the v1 per-type shape into one flat list.
      const rawV1 = localStorage.getItem(LS_KEY_V1);
      if (rawV1) {
        const parsedV1 = JSON.parse(rawV1);
        if (parsedV1 && typeof parsedV1 === "object" && !Array.isArray(parsedV1)) {
          categories = Array.from(new Set([...flatten(parsedV1), ...seed()]));
        }
        localStorage.removeItem(LS_KEY_V1);
      }
    }
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(categories)); } catch { /* quota */ }
};

export const categoriesStore = {
  getSnapshot: (): string[] => categories,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (name: string) => {
    const v = name.trim();
    if (!v || categories.some((c) => c.toLowerCase() === v.toLowerCase())) return;
    categories = [...categories, v];
    saveLS();
    notify();
  },
  rename: (prev: string, next: string) => {
    categories = categories.map((c) => (c === prev ? next : c));
    saveLS();
    notify();
  },
  remove: (name: string) => {
    categories = categories.filter((c) => c !== name);
    saveLS();
    notify();
  },
};
