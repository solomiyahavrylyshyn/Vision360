// Catalog store — the single source of truth for items offered in the
// Estimate / Job "Select item from catalog" pickers. The Items module mirrors
// its create / edit / delete into this store so an item created there shows up
// immediately in those pickers. localStorage-backed so it survives refresh.

import type { CatalogItem } from "../components/ItemPicker";

type Listener = () => void;

const LS_KEY = "vision360.catalogItems.v1";

// Seeded to match the Items module's initial catalog (ids align with Items.tsx
// initialItems so mirrored edits/deletes key correctly).
const SEED: CatalogItem[] = [
  { id: 1, name: "Diagnostic Visit",        itemDescription: "Standard diagnostic service call",    salesDescription: "Diagnostic visit — inspects and identifies system issues", brand: "", modelNumber: "SVC-1001", rate: 99,  cost: 0,  taxable: true, category: "Diagnostics", type: "Service" },
  { id: 2, name: "AC Tune-Up",              itemDescription: "Annual AC maintenance and tune-up",   salesDescription: "AC tune-up — cleaning, inspection and performance check", brand: "", modelNumber: "SVC-1002", rate: 129, cost: 0,  taxable: true, category: "Maintenance", type: "Service" },
  { id: 3, name: "R-410A Refrigerant (lb)", itemDescription: "R-410A refrigerant per pound",        salesDescription: "R-410A refrigerant recharge — per pound", brand: "", modelNumber: "MAT-2001", rate: 18,  cost: 9,  taxable: true, category: "Refrigerant", type: "Product" },
  { id: 4, name: "Capacitor 45/5 MFD",      itemDescription: "Dual run capacitor 45/5 MFD 440V",    salesDescription: "Capacitor 45/5 MFD — dual run capacitor replacement", brand: "", modelNumber: "MAT-2002", rate: 25,  cost: 12, taxable: true, category: "Parts", type: "Product" },
  { id: 5, name: "Blower Motor 1/2 HP",     itemDescription: "ECM blower motor 1/2 HP replacement", salesDescription: "Blower motor 1/2 HP — ECM variable speed", brand: "", modelNumber: "EQU-3001", rate: 225, cost: 98, taxable: true, category: "Motors", type: "Equipment" },
  { id: 6, name: "Permit Fee",              itemDescription: "Administrative permit processing fee", salesDescription: "Permit fee — municipal permit filing and processing", brand: "", modelNumber: "FEE-4001", rate: 75,  cost: 0,  taxable: true, category: "Administrative", type: "Service" },
];

let items: CatalogItem[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) items = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* quota */ }
};

// Map the Items module's broad item type onto the picker's narrow set.
export function mapItemTypeToCatalog(t: string): CatalogItem["type"] {
  if (t === "Labor" || t === "Labor Markup" || t === "Labor Discount") return "Labor";
  if (t === "Equipment" || t === "Asset") return "Equipment";
  if (["Inventory Item", "Non-Inventory Item", "Serialized Item"].includes(t)) return "Product";
  return "Service";
}

export const itemsStore = {
  getSnapshot: (): CatalogItem[] => items,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  // Insert or replace by id (used by the Items module on add / edit).
  upsert: (item: CatalogItem) => {
    const idx = items.findIndex((i) => i.id === item.id);
    items = idx >= 0
      ? items.map((i) => (i.id === item.id ? item : i))
      : [...items, item];
    saveLS();
    notify();
  },
  remove: (id: number) => {
    items = items.filter((i) => i.id !== id);
    saveLS();
    notify();
  },
  removeMany: (ids: Set<number>) => {
    items = items.filter((i) => !ids.has(i.id));
    saveLS();
    notify();
  },
};
