// Expense categories (FR-16.8) — managed in Settings → Finance center →
// Payments ("Expense settings"), feeding the category dropdown on the expense
// form and the Categories quick filter on the Expenses list.

type Listener = () => void;

const LS_KEY = "vision360.expenseCategories.v1";

const SEED = [
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

let categories: string[] = [...SEED];
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) categories = parsed;
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
