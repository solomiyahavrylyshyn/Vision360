// Expense categories (FR-16.8) — managed in Settings → Finance center →
// Payments ("Expense settings"), feeding the category dropdown on the expense
// form and the Categories quick filter on the Expenses list.
//
// Labor and Commission ship pre-coded and cannot be renamed or removed (Marek,
// Sep 10 call): every home service business pays for both, and they are the two
// categories the job's Compensation tile is built from — see
// utils/jobFinancials. Labor covers work that does not fit inside a line item
// (overtime, a second visit, a subcontractor); Commission is the cut of the
// sale a salesperson or technician earns.

type Listener = () => void;

const LS_KEY = "vision360.expenseCategories.v1";

/** Built in with the product — always present, never editable. */
export const PRE_CODED_CATEGORIES = ["Labor", "Commission"] as const;

const preCoded = new Set<string>(PRE_CODED_CATEGORIES.map((c) => c.toLowerCase()));

export const isPreCodedCategory = (name: string): boolean =>
  preCoded.has((name ?? "").trim().toLowerCase());

const SEED = [
  ...PRE_CODED_CATEGORIES,
  "Materials",
  "Fuel",
  "Tools",
  "Software",
  "Meals",
  "Travel",
  "Subcontractor",
  "Office Supplies",
  "Equipment Rental",
  "Other",
];

// The pre-coded pair leads the list, in a fixed order, whatever the cache holds.
const withPreCoded = (list: string[]): string[] => [
  ...PRE_CODED_CATEGORIES,
  ...list.filter((c) => !isPreCodedCategory(c)),
];

let categories: string[] = [...SEED];
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    // Browsers cached before Labor/Commission were pre-coded get them added
    // without losing the categories the company set up itself.
    if (Array.isArray(parsed) && parsed.length) categories = withPreCoded(parsed);
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(categories)); } catch { /* quota */ }
};

export const expenseCategoriesStore = {
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
    if (isPreCodedCategory(prev)) return;
    categories = categories.map((c) => (c === prev ? next : c));
    saveLS();
    notify();
  },
  remove: (name: string) => {
    if (isPreCodedCategory(name)) return;
    categories = categories.filter((c) => c !== name);
    saveLS();
    notify();
  },
};
