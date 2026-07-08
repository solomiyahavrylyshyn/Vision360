// Estimates store — single source of truth for Estimates list, EstimateDetail
// and ClientDetail's Estimates tab. Mirrors clientsStore's pattern: in-memory
// cache + localStorage persistence so newly created estimates survive a
// refresh / route change, with optional Postgres write-through via /api/estimates.
import { createApiSync } from "./apiSync";

type Listener = () => void;

export type EstimateStatus =
  | "Draft" | "Sent" | "Viewed" | "Changes Requested" | "Updated" | "Approved" | "Rejected" | "Expired" | "Archived" | "Converted";

// Line items are stored alongside the record so EstimateDetail can rebuild the
// document without falling back to seed data when the user opens an estimate
// they just created.
export interface EstimateLineItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  cost: number;
  amount: number;
  taxable: boolean;
}

export interface EstimateRecord {
  id: number;
  estimateNumber: string;
  estimateName: string;
  clientName: string;
  clientId?: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  serviceAddress?: string;
  createdDate: string;
  addedBy: string;
  option?: string;
  amount: number;
  status: EstimateStatus;
  job?: string;
  jobTitle?: string;
  jobId?: number;
  sentDate?: string;
  expirationDate?: string;
  teamMember?: string;
  source: string;
  depositDue: number;
  updatedDate?: string;
  // Optional payload so detail pages can rebuild the document.
  items?: EstimateLineItem[];
  taxRate?: number;
  notes?: string;
  internalNotes?: string;
  depositRequired?: boolean;
  depositType?: "amount" | "percentage";
  depositValue?: number;
}

const LS_KEY = "vision360.estimates.v1";

// Seed used the first time the app boots on a clean browser. Subsequent loads
// rehydrate from localStorage so user-created estimates persist across refresh.
const SEED: EstimateRecord[] = [
  { id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", option: "", amount: 228, status: "Draft", job: "", jobTitle: "", sentDate: "", expirationDate: "", teamMember: "Marek Stroz", source: "", depositDue: 0, taxRate: 7.5, items: [
    { id: 1, name: "Diagnostic Visit", description: "Standard diagnostic service call", quantity: 1, price: 99, cost: 0, amount: 99, taxable: true },
    { id: 2, name: "AC Tune-Up", description: "Annual AC maintenance and tune-up", quantity: 1, price: 129, cost: 0, amount: 129, taxable: true },
  ] },
  { id: 2, estimateNumber: "10246-E04", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", option: "1", amount: 1220, status: "Viewed", job: "10246-J04", jobTitle: "Bathroom Remodel", sentDate: "Mar 13, 2026", expirationDate: "Jun 13, 2026", teamMember: "Marek Stroz", source: "10246-J04", depositDue: 0, taxRate: 7.5, items: [
    { id: 1, name: "Vanity & Sink Install", description: "Supply and install bathroom vanity with sink", quantity: 1, price: 650, cost: 320, amount: 650, taxable: true },
    { id: 2, name: "Plumbing Labor", description: "Technician labor (hourly)", quantity: 6, price: 95, cost: 45, amount: 570, taxable: false },
  ] },
  { id: 3, estimateNumber: "10246-E03", estimateName: "Option C", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "C", amount: 1050, status: "Expired", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, taxRate: 7.5, items: [
    { id: 1, name: "Tree Removal Service", description: "Remove large tree, sectional", quantity: 1, price: 800, cost: 300, amount: 800, taxable: true },
    { id: 2, name: "Stump Grinding", description: "Grind stump below grade", quantity: 1, price: 250, cost: 90, amount: 250, taxable: true },
  ] },
  { id: 4, estimateNumber: "10246-E02", estimateName: "Option B", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "B", amount: 800, status: "Sent", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, taxRate: 7.5, items: [
    { id: 1, name: "Tree Removal Service", description: "Remove large tree, sectional", quantity: 1, price: 800, cost: 300, amount: 800, taxable: true },
  ] },
  { id: 5, estimateNumber: "10246-E01", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "A", amount: 3500, status: "Approved", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, updatedDate: "Mar 02, 2026", taxRate: 7.5, items: [
    { id: 1, name: "Large Tree Removal", description: "Remove oak near structure, sectional", quantity: 1, price: 2200, cost: 950, amount: 2200, taxable: true },
    { id: 2, name: "Crane Service", description: "Crane-assisted removal (half day)", quantity: 1, price: 900, cost: 500, amount: 900, taxable: true },
    { id: 3, name: "Cleanup & Hauling", description: "Debris cleanup and haul-away", quantity: 1, price: 400, cost: 150, amount: 400, taxable: false },
  ] },
  // Carries line items so "copy from estimate" on Create Invoice has data to
  // copy even on a fresh browser (user-created estimates always carry items).
  { id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", option: "1", amount: 10502, status: "Approved", job: "10248-J01", jobTitle: "HVAC Installation", sentDate: "Mar 01, 2026", expirationDate: "Mar 31, 2026", teamMember: "Marek Stroz", source: "10248-J01", depositDue: 500, taxRate: 7.5, items: [
    { id: 1, name: "SEER Heat Pump Condenser Unit", description: "SEER Heat Pump Condenser — high efficiency outdoor unit", quantity: 2, price: 3200, cost: 1800, amount: 6400, taxable: true },
    { id: 2, name: "Copper Piping Installation", description: "Professional copper piping installation (per ft)", quantity: 40, price: 18.5, cost: 6.75, amount: 740, taxable: true },
    { id: 3, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 30, price: 95, cost: 45, amount: 2850, taxable: false },
  ] },
  { id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", option: "1", amount: 850, status: "Viewed", job: "10247-J01", jobTitle: "Plumbing Fix", sentDate: "Feb 26, 2026", expirationDate: "Mar 27, 2026", teamMember: "Marek Stroz", source: "10247-J01", depositDue: 0, taxRate: 7.5, items: [
    { id: 1, name: "Drain Cleaning Service", description: "Clear main drain line", quantity: 1, price: 175, cost: 40, amount: 175, taxable: false },
    { id: 2, name: "Pipe Repair Labor", description: "Technician labor", quantity: 3, price: 95, cost: 45, amount: 285, taxable: false },
    { id: 3, name: "PVC Repair Materials", description: "Pipe, fittings, primer, cement", quantity: 1, price: 390, cost: 140, amount: 390, taxable: true },
  ] },
];

let estimates: EstimateRecord[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Backfill line items onto stored estimates that were cached before the
      // seed gained items (older localStorage). Every estimate must carry its
      // items so attaching it to a job/invoice copies them. User-created
      // estimates already have items; this only repairs stale seed rows.
      const seedById = new Map(SEED.map((s) => [s.id, s]));
      estimates = parsed.map((e: EstimateRecord) => {
        if (e && (!e.items || e.items.length === 0)) {
          const seed = seedById.get(e.id);
          if (seed?.items?.length) return { ...e, items: seed.items, taxRate: e.taxRate ?? seed.taxRate, amount: e.amount || seed.amount };
        }
        return e;
      });
    }
  }
} catch {
  /* corrupt cache → keep seed */
}

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());

const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(estimates)); } catch { /* quota */ }
};

const nextId = () => (estimates.length ? Math.max(...estimates.map((e) => e.id)) + 1 : 1);

// Build the next "<base>-EXX" number for a given client/job base. Falls back
// to "10000-EXX" if the caller doesn't supply a base.
const nextEstimateNumber = (base?: string) => {
  const prefix = (base?.trim() || "10000") + "-E";
  const used = estimates
    .filter((e) => e.estimateNumber.startsWith(prefix))
    .map((e) => Number(e.estimateNumber.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(2, "0")}`;
};

const api = createApiSync<EstimateRecord>("estimates", (e) => e.id);

export const estimatesStore = {
  getSnapshot: (): EstimateRecord[] => estimates,
  getById: (id: number): EstimateRecord | undefined => estimates.find((e) => e.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    api.hydrate(estimates, (rows) => { estimates = rows; saveLS(); notify(); });
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Partial<EstimateRecord> & { clientName: string }): EstimateRecord => {
    const record: EstimateRecord = {
      id: nextId(),
      estimateNumber: partial.estimateNumber || nextEstimateNumber(),
      estimateName: partial.estimateName ?? "",
      clientName: partial.clientName,
      clientId: partial.clientId,
      clientEmail: partial.clientEmail ?? "",
      clientPhone: partial.clientPhone,
      clientAddress: partial.clientAddress,
      serviceAddress: partial.serviceAddress,
      createdDate: partial.createdDate ?? "",
      addedBy: partial.addedBy ?? "You",
      option: partial.option,
      amount: partial.amount ?? 0,
      status: partial.status ?? "Draft",
      job: partial.job ?? "",
      jobTitle: partial.jobTitle ?? "",
      jobId: partial.jobId,
      sentDate: partial.sentDate ?? "",
      expirationDate: partial.expirationDate ?? "",
      teamMember: partial.teamMember ?? "Marek Stroz",
      source: partial.source ?? "",
      depositDue: partial.depositDue ?? 0,
      updatedDate: partial.updatedDate,
      items: partial.items,
      taxRate: partial.taxRate,
      notes: partial.notes,
      internalNotes: partial.internalNotes,
      depositRequired: partial.depositRequired,
      depositType: partial.depositType,
      depositValue: partial.depositValue,
    };
    estimates = [record, ...estimates];
    saveLS();
    notify();
    api.persistNew(record);
    return record;
  },
  update: (id: number, patch: Partial<EstimateRecord>) => {
    estimates = estimates.map((e) => (e.id === id ? { ...e, ...patch } : e));
    saveLS();
    notify();
    api.persistPatch(id, patch);
  },
  remove: (id: number) => {
    estimates = estimates.filter((e) => e.id !== id);
    saveLS();
    notify();
    api.persistDelete(id);
  },
  removeMany: (ids: Set<number>) => {
    estimates = estimates.filter((e) => !ids.has(e.id));
    saveLS();
    notify();
    ids.forEach((id) => api.persistDelete(id));
  },
  nextEstimateNumber,
};
