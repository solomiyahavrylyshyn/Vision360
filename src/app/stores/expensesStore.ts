// Expenses store — the single source of truth for the Expenses list, the
// Expense detail page and the Create-expense flow. Reactive via
// useSyncExternalStore, with an in-memory cache + localStorage persistence so
// newly created expenses survive a refresh (mirrors estimatesStore).

import { createApiSync } from "./apiSync";

type Listener = () => void;

export interface Expense {
  id: string;
  date: string;
  category: string;
  merchant: string;
  amount: number;
  jobId?: string;
  jobTitle?: string;
  invoiceId?: string;
  notes?: string;
  receipts: number;
}

// Demo seed — the rows the module ships with (previously mockExpenses in
// Expenses.tsx; kept here so every consumer shares one collection).
const SEED: Expense[] = [
  { id: "1", date: "Apr 5, 2026", category: "Materials", merchant: "Home Depot", amount: 1245.5, jobId: "J-1234", jobTitle: "HVAC Installation", invoiceId: "INV-0042", notes: "Supplies for commercial HVAC project", receipts: 2 },
  { id: "2", date: "Apr 4, 2026", category: "Fuel", merchant: "Shell Gas Station", amount: 85.3, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "Fleet vehicle fuel", receipts: 1 },
  { id: "3", date: "Apr 4, 2026", category: "Tools", merchant: "Grainger", amount: 567.89, jobId: "J-1236", jobTitle: "Equipment Repair", notes: "Replacement tools and equipment", receipts: 1 },
  { id: "4", date: "Apr 3, 2026", category: "Software", merchant: "Microsoft", amount: 299.0, notes: "Annual subscription renewal", receipts: 1 },
  { id: "5", date: "Apr 2, 2026", category: "Meals", merchant: "Starbucks", amount: 42.15, jobId: "J-1237", jobTitle: "Client Meeting", invoiceId: "INV-0045", notes: "Coffee with prospective client", receipts: 1 },
  { id: "6", date: "Apr 1, 2026", category: "Travel", merchant: "Delta Airlines", amount: 389.0, notes: "Flight to vendor conference", receipts: 1 },
  { id: "7", date: "Mar 31, 2026", category: "Materials", merchant: "Ferguson Plumbing", amount: 723.45, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "PVC pipes and fittings", receipts: 2 },
];

const LS_KEY = "vision360.expenses.v1";

let expenses: Expense[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) expenses = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(expenses)); } catch { /* quota */ }
};

const api = createApiSync<Expense>("expenses", (e) => e.id);

export const expensesStore = {
  getSnapshot: (): Expense[] => expenses,
  getExpense: (id: string | undefined): Expense | undefined => expenses.find((e) => e.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    api.hydrate(expenses, (rows) => { expenses = rows; saveLS(); notify(); });
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  nextId: (): string => String(expenses.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0) + 1),
  // New expenses go on top — the list default-sorts newest first.
  add: (record: Expense) => {
    expenses = [record, ...expenses];
    saveLS();
    notify();
    api.persistNew(record);
    return record;
  },
  update: (id: string, patch: Partial<Expense>) => {
    expenses = expenses.map((e) => (e.id === id ? { ...e, ...patch } : e));
    saveLS();
    notify();
    api.persistPatch(id, patch);
  },
  removeMany: (ids: Set<string>) => {
    expenses = expenses.filter((e) => !ids.has(e.id));
    saveLS();
    notify();
    ids.forEach((id) => api.persistDelete(id));
  },
};
