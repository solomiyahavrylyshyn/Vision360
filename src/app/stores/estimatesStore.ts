// Estimates store — single source of truth for Estimates list, EstimateDetail
// and ClientDetail's Estimates tab. Mirrors clientsStore's pattern: in-memory
// cache + localStorage persistence so newly created estimates survive a
// refresh / route change, with optional Postgres write-through via /api/estimates.
import { createApiSync } from "./apiSync";

type Listener = () => void;

export type EstimateStatus =
  | "Draft" | "Sent" | "Viewed" | "Changes Requested" | "Updated" | "Approved" | "Declined" | "Expired" | "Archived" | "Converted";

// FR-5.19 / FR-16.5 — estimate types are company-editable and live in
// estimateTypesStore (Settings → Estimates). Import from there; this re-export
// keeps older call sites working.
export { estimateTypesStore } from "./estimateTypesStore";

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
  /** FR-4.8 — kept off the customer's copy; totals still include it. */
  hideOnCustomerDocs?: boolean;
  /** Carried from the catalog item so the job the estimate turns into knows
   *  whether the cost is technician pay or a supplier price. */
  itemType?: string;
  /** Per-unit labor / materials split, carried so the job keeps the shares of
   *  what was actually sold — see utils/itemCost. */
  costBreakdown?: { labor: number; materials: number };
}

// Good / better / best. An estimate carries up to four options; the client picks
// one. The count decides which document layout the estimate prints as — one
// option is a plain sheet, two to four is the side-by-side comparison sheet.
export interface EstimateOption {
  name: string;
  /** One line under the option name on the comparison sheet. */
  summary?: string;
  items: EstimateLineItem[];
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
  /** FR-5.19 — classification (Repair / Installation / Replacement …). */
  estimateType?: string;
  /** Good/Better/Best (FR-5.12) — persisted only when the estimate has more
   *  than one option; single-option estimates keep the flat `items` list. */
  options?: { name: string; items: EstimateLineItem[] }[];
  // Optional payload so detail pages can rebuild the document.
  items?: EstimateLineItem[];
  options?: EstimateOption[];
  /** Set once the client accepts — the document then shows only this option. */
  selectedOptionName?: string;
  /** Note the client left with "Request changes". */
  changeRequest?: string;
  /** Link token minted when the estimate is sent; the client page reads it. */
  publicToken?: string;
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
  { id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", option: "", amount: 228, status: "Draft", job: "", jobTitle: "", sentDate: "", expirationDate: "", teamMember: "Marek Stroz", source: "", depositDue: 0, estimateType: "Diagnostic", taxRate: 7.5, items: [
    { id: 1, name: "Diagnostic Visit", description: "Standard diagnostic service call", quantity: 1, price: 99, cost: 0, amount: 99, taxable: true },
    { id: 2, name: "AC Tune-Up", description: "Annual AC maintenance and tune-up", quantity: 1, price: 129, cost: 0, amount: 129, taxable: true },
  ] },
  { id: 2, estimateNumber: "10246-E04", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", option: "1", amount: 1220, status: "Viewed", job: "10246-J04", jobTitle: "Bathroom Remodel", sentDate: "Mar 13, 2026", expirationDate: "Jun 13, 2026", teamMember: "Marek Stroz", source: "10246-J04", depositDue: 0, estimateType: "Installation", taxRate: 7.5, items: [
    { id: 1, name: "Vanity & Sink Install", description: "Supply and install bathroom vanity with sink", quantity: 1, price: 650, cost: 320, amount: 650, taxable: true },
    { id: 2, name: "Plumbing Labor", description: "Technician labor (hourly)", quantity: 6, price: 95, cost: 45, amount: 570, taxable: false },
  ] },
  // Good/Better/Best (FR-5.12): ONE estimate with three options — the customer
  // approved Option A. Replaces the old modeling where Options A/B/C were three
  // separate records (10246-E01/-E02/-E03); the hydrate migration below merges
  // stale localStorage rows into this shape.
  { id: 5, estimateNumber: "10246-E01", estimateName: "Tree Removal", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "A", amount: 3500, status: "Approved", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, estimateType: "Repair", updatedDate: "Mar 02, 2026", taxRate: 7.5, items: [
    { id: 1, name: "Large Tree Removal", description: "Remove oak near structure, sectional", quantity: 1, price: 2200, cost: 950, amount: 2200, taxable: true },
    { id: 2, name: "Crane Service", description: "Crane-assisted removal (half day)", quantity: 1, price: 900, cost: 500, amount: 900, taxable: true },
    { id: 3, name: "Cleanup & Hauling", description: "Debris cleanup and haul-away", quantity: 1, price: 400, cost: 150, amount: 400, taxable: false },
  ], options: [
    { name: "Option A", items: [
      { id: 1, name: "Large Tree Removal", description: "Remove oak near structure, sectional", quantity: 1, price: 2200, cost: 950, amount: 2200, taxable: true },
      { id: 2, name: "Crane Service", description: "Crane-assisted removal (half day)", quantity: 1, price: 900, cost: 500, amount: 900, taxable: true },
      { id: 3, name: "Cleanup & Hauling", description: "Debris cleanup and haul-away", quantity: 1, price: 400, cost: 150, amount: 400, taxable: false },
    ] },
    { name: "Option B", items: [
      { id: 1, name: "Tree Removal Service", description: "Remove large tree, sectional", quantity: 1, price: 800, cost: 300, amount: 800, taxable: true },
    ] },
    { name: "Option C", items: [
      { id: 1, name: "Tree Removal Service", description: "Remove large tree, sectional", quantity: 1, price: 800, cost: 300, amount: 800, taxable: true },
      { id: 2, name: "Stump Grinding", description: "Grind stump below grade", quantity: 1, price: 250, cost: 90, amount: 250, taxable: true },
    ] },
  ] },
  // Carries line items so "copy from estimate" on Create Invoice has data to
  // copy even on a fresh browser (user-created estimates always carry items).
  { id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", option: "1", amount: 10502, status: "Approved", job: "10248-J01", jobTitle: "HVAC Installation", sentDate: "Mar 01, 2026", expirationDate: "Mar 31, 2026", teamMember: "Marek Stroz", source: "10248-J01", depositDue: 500, estimateType: "Replacement", taxRate: 7.5, items: [
    { id: 1, name: "SEER Heat Pump Condenser Unit", description: "SEER Heat Pump Condenser — high efficiency outdoor unit", quantity: 2, price: 3200, cost: 1800, amount: 6400, taxable: true },
    { id: 2, name: "Copper Piping Installation", description: "Professional copper piping installation (per ft)", quantity: 40, price: 18.5, cost: 6.75, amount: 740, taxable: true },
    { id: 3, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 30, price: 95, cost: 45, amount: 2850, taxable: false },
  ] },
  // Good / better / best — the estimate that prints as the comparison sheet and
  // is the one to open from the client link. Tax-free so the option totals read
  // as the round numbers the options were quoted at.
  { id: 8, estimateNumber: "10245-E10", estimateName: "AC Repair or Replace", clientName: "John Smith", clientId: "10245", clientEmail: "john.smith@email.com", clientPhone: "(512) 555-0142", clientAddress: "123 Main St\nAustin, TX 78701", serviceAddress: "123 Main St\nAustin, TX 78701", createdDate: "Mon Sep 07, 2026", addedBy: "Peter Novak", amount: 309, status: "Sent", job: "", jobTitle: "", sentDate: "Sep 07, 2026", expirationDate: "Oct 07, 2026", teamMember: "Peter Novak", source: "Manual", depositDue: 0, estimateType: "Replacement", taxRate: 0, depositRequired: true, depositType: "percentage", depositValue: 10, publicToken: "ZTNiMGM0NDItOThmYy00YTNhLTgzMGEtNzMxMWI0NDI5Y2M2",
    items: [
      { id: 1, name: "Capacitor 45/5 MFD", description: "Dual run capacitor replacement", quantity: 1, price: 120, cost: 40, amount: 120, taxable: true },
      { id: 2, name: "R-410A Refrigerant", description: "Refrigerant recharge (per lb)", quantity: 2, price: 50, cost: 20, amount: 100, taxable: true },
      { id: 3, name: "Diagnostic & Repair", description: "Diagnose the fault and complete the repair", quantity: 1, price: 89, cost: 45, amount: 89, taxable: false },
    ],
    options: [
      { name: "Repair", summary: "Fix the system you have now.", items: [
        { id: 1, name: "Capacitor 45/5 MFD", description: "Dual run capacitor replacement", quantity: 1, price: 120, cost: 40, amount: 120, taxable: true },
        { id: 2, name: "R-410A Refrigerant", description: "Refrigerant recharge (per lb)", quantity: 2, price: 50, cost: 20, amount: 100, taxable: true },
        { id: 3, name: "Diagnostic & Repair", description: "Diagnose the fault and complete the repair", quantity: 1, price: 89, cost: 45, amount: 89, taxable: false },
      ] },
      { name: "Replace, standard unit", summary: "New 3-ton system, standard efficiency, 5-year parts warranty.", items: [
        { id: 1, name: "3 Ton Condensing Unit", description: "Standard-efficiency outdoor unit", quantity: 1, price: 2600, cost: 1450, amount: 2600, taxable: true },
        { id: 2, name: "Standard Air Handler", description: "Matched indoor air handler", quantity: 1, price: 1500, cost: 820, amount: 1500, taxable: true },
        { id: 3, name: "Line Set & Materials", description: "Line set, pad, disconnect and fittings", quantity: 1, price: 400, cost: 180, amount: 400, taxable: true },
        { id: 4, name: "System Installation Labor", description: "Removal of the old system and full install", quantity: 1, price: 1300, cost: 900, amount: 1300, taxable: false },
      ] },
      { name: "Replace, high-efficiency unit", summary: "New 3-ton high-SEER system with a smart thermostat, 10-year parts warranty.", items: [
        { id: 1, name: "High-Efficiency Condensing Unit", description: "High-SEER outdoor unit", quantity: 1, price: 4200, cost: 2350, amount: 4200, taxable: true },
        { id: 2, name: "Variable Speed Air Handler", description: "Variable-speed indoor air handler", quantity: 1, price: 2350, cost: 1290, amount: 2350, taxable: true },
        { id: 3, name: "Smart WiFi Thermostat", description: "Smart thermostat, installed and configured", quantity: 1, price: 250, cost: 110, amount: 250, taxable: true },
        { id: 4, name: "Line Set & Materials", description: "Line set, pad, disconnect and fittings", quantity: 1, price: 400, cost: 180, amount: 400, taxable: true },
        { id: 5, name: "System Installation Labor", description: "Removal of the old system and full install", quantity: 1, price: 1200, cost: 830, amount: 1200, taxable: false },
      ] },
    ] },
  { id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", option: "1", amount: 850, status: "Viewed", job: "10247-J01", jobTitle: "Plumbing Fix", sentDate: "Feb 26, 2026", expirationDate: "Mar 27, 2026", teamMember: "Marek Stroz", source: "10247-J01", depositDue: 0, estimateType: "Repair", taxRate: 7.5, items: [
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
        // FR-5.13 migration — the status was renamed Rejected → Declined.
        if (e && (e.status as string) === "Rejected") e = { ...e, status: "Declined" };
        if (e && (!e.items || e.items.length === 0)) {
          const seed = seedById.get(e.id);
          if (seed?.items?.length) return { ...e, items: seed.items, taxRate: e.taxRate ?? seed.taxRate, amount: e.amount || seed.amount };
        }
        return e;
      });
      // FR-5.12 migration — Options A/B/C used to be three separate seed
      // records (10246-E01/-E02/-E03); they are now ONE estimate with an
      // options array. Fold stale cached copies into the merged seed shape.
      const legacyOptionRows = ["10246-E02", "10246-E03"];
      if (estimates.some((e) => legacyOptionRows.includes(e.estimateNumber))) {
        const mergedSeed = SEED.find((s) => s.estimateNumber === "10246-E01");
        estimates = estimates
          .filter((e) => !legacyOptionRows.includes(e.estimateNumber))
          .map((e) => e.estimateNumber === "10246-E01" && !e.options && mergedSeed
            ? { ...e, estimateName: mergedSeed.estimateName, options: mergedSeed.options }
            : e);
      }
      // Seed rows added since this browser last cached (the multi-option demo
      // estimate, for one) still need to appear, without dropping estimates the
      // user created themselves.
      const cachedIds = new Set(estimates.map((e) => e?.id));
      const missing = SEED.filter((s) => !cachedIds.has(s.id));
      if (missing.length) estimates = [...missing, ...estimates];
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

// Link token for the client-facing page. Minted when the estimate is sent, then
// stored on the estimate — the client page is anonymous and the token is all
// that identifies which estimate the visitor is looking at. Base64url so it
// survives being pasted into a URL.
export const makePublicToken = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return btoa(uuid).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const api = createApiSync<EstimateRecord>("estimates", (e) => e.id);

export const estimatesStore = {
  getSnapshot: (): EstimateRecord[] => estimates,
  getById: (id: number): EstimateRecord | undefined => estimates.find((e) => e.id === id),
  getByPublicToken: (token: string | undefined): EstimateRecord | undefined =>
    token ? estimates.find((e) => e.publicToken === token) : undefined,
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
      estimateType: partial.estimateType,
      items: partial.items,
      options: partial.options,
      selectedOptionName: partial.selectedOptionName,
      publicToken: partial.publicToken,
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
