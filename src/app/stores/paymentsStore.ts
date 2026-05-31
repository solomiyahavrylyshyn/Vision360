// Payments store — in-memory + localStorage so newly created payments
// survive a refresh. Mirrors clientsStore / estimatesStore pattern.

import type { Payment } from "../pages/Payments";

type Listener = () => void;

const LS_KEY = "vision360.payments.v1";

const SEED: Payment[] = [
  { id: 1, date: "2026-03-10", amount: 5000.00, method: "Bank Transfer", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "First installment", createdBy: "Marek Stroz", createdAt: "2026-03-10 14:22" },
  { id: 2, date: "2026-03-25", amount: 5502.00, method: "Check", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Final payment", createdBy: "Marek Stroz", createdAt: "2026-03-25 11:45" },
  { id: 3, date: "2026-03-15", amount: 1000.00, method: "Credit Card", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 4, invoiceNumber: "10248-I02", jobId: "10248-J01", note: "Partial payment", createdBy: "Marek Stroz", createdAt: "2026-03-15 13:30" },
  { id: 4, date: "2026-04-01", amount: 913.75, method: "Check", status: "Pending", clientName: "Mike Rodriguez", clientEmail: "mike.r@email.com", invoiceId: 5, invoiceNumber: "10247-I01", jobId: "10247-J01", note: "", createdBy: "Marek Stroz", createdAt: "2026-04-01 09:15" },
  { id: 5, date: "2026-02-21", amount: 326.25, method: "Cash", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 6, invoiceNumber: "10249-I01", jobId: "10249-J01", note: "Paid in full", createdBy: "Marek Stroz", createdAt: "2026-02-21 16:00" },
  { id: 6, date: "2026-03-28", amount: 200.00, method: "Credit Card", status: "Refunded", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Partial refund — overcharge adjustment", createdBy: "Marek Stroz", createdAt: "2026-03-28 10:20" },
  { id: 7, date: "2026-04-03", amount: 2800.00, method: "Bank Transfer", status: "Completed", clientName: "John Doe", clientEmail: "john.d@email.com", invoiceId: 2, invoiceNumber: "10246-I01", jobId: "10246-J01", note: "Partial payment on overdue invoice", createdBy: "Marek Stroz", createdAt: "2026-04-03 11:00" },
];

let payments: Payment[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) payments = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());

const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(payments)); } catch { /* quota */ }
};

const nextId = () =>
  payments.length ? Math.max(...payments.map((p) => p.id)) + 1 : 1;

export const paymentsStore = {
  getSnapshot: (): Payment[] => payments,
  getById: (id: number): Payment | undefined => payments.find((p) => p.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Omit<Payment, "id" | "createdAt">): Payment => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const record: Payment = { id: nextId(), ...partial, createdAt };
    payments = [record, ...payments];
    saveLS();
    notify();
    return record;
  },
  update: (id: number, patch: Partial<Payment>) => {
    payments = payments.map((p) => (p.id === id ? { ...p, ...patch } : p));
    saveLS();
    notify();
  },
};
