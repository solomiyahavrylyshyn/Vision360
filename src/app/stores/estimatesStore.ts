// Estimates store — single source of truth for Estimates list, EstimateDetail
// and ClientDetail's Estimates tab. Mirrors clientsStore's pattern: in-memory
// cache + localStorage persistence so newly created estimates survive a
// refresh / route change. No /api route exists for estimates today; if/when
// one is added, mirror clientsStore's hydrate() / persistNew() pattern here.

type Listener = () => void;

export type EstimateStatus =
  | "Draft" | "Sent" | "Viewed" | "Approved" | "Rejected" | "Expired" | "Archived";

export interface EstimateRecord {
  id: number;
  estimateNumber: string;
  estimateName: string;
  clientName: string;
  clientEmail: string;
  createdDate: string;
  addedBy: string;
  option?: string;
  amount: number;
  status: EstimateStatus;
  job?: string;
  jobTitle?: string;
  sentDate?: string;
  expirationDate?: string;
  teamMember?: string;
  source: string;
  depositDue: number;
  updatedDate?: string;
}

const LS_KEY = "vision360.estimates.v1";

// Seed used the first time the app boots on a clean browser. Subsequent loads
// rehydrate from localStorage so user-created estimates persist across refresh.
const SEED: EstimateRecord[] = [
  { id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", option: "", amount: 0, status: "Draft", job: "", jobTitle: "", sentDate: "", expirationDate: "", teamMember: "Marek Stroz", source: "", depositDue: 0 },
  { id: 2, estimateNumber: "10246-E04", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", option: "1", amount: 0, status: "Viewed", job: "10246-J04", jobTitle: "Bathroom Remodel", sentDate: "Mar 13, 2026", expirationDate: "Jun 13, 2026", teamMember: "Marek Stroz", source: "10246-J04", depositDue: 0 },
  { id: 3, estimateNumber: "10246-E03", estimateName: "Option C", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "C", amount: 0, status: "Expired", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0 },
  { id: 4, estimateNumber: "10246-E02", estimateName: "Option B", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "B", amount: 0, status: "Sent", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0 },
  { id: 5, estimateNumber: "10246-E01", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "A", amount: 3500, status: "Approved", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, updatedDate: "Mar 02, 2026" },
  { id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", option: "1", amount: 10502, status: "Approved", job: "10248-J01", jobTitle: "HVAC Installation", sentDate: "Mar 01, 2026", expirationDate: "Mar 31, 2026", teamMember: "Marek Stroz", source: "10248-J01", depositDue: 500 },
  { id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", option: "1", amount: 850, status: "Viewed", job: "10247-J01", jobTitle: "Plumbing Fix", sentDate: "Feb 26, 2026", expirationDate: "Mar 27, 2026", teamMember: "Marek Stroz", source: "10247-J01", depositDue: 0 },
];

let estimates: EstimateRecord[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) estimates = parsed;
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

export const estimatesStore = {
  getSnapshot: (): EstimateRecord[] => estimates,
  getById: (id: number): EstimateRecord | undefined => estimates.find((e) => e.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Partial<EstimateRecord> & { clientName: string }): EstimateRecord => {
    const record: EstimateRecord = {
      id: nextId(),
      estimateNumber: partial.estimateNumber || nextEstimateNumber(),
      estimateName: partial.estimateName ?? "",
      clientName: partial.clientName,
      clientEmail: partial.clientEmail ?? "",
      createdDate: partial.createdDate ?? "",
      addedBy: partial.addedBy ?? "You",
      option: partial.option,
      amount: partial.amount ?? 0,
      status: partial.status ?? "Draft",
      job: partial.job ?? "",
      jobTitle: partial.jobTitle ?? "",
      sentDate: partial.sentDate ?? "",
      expirationDate: partial.expirationDate ?? "",
      teamMember: partial.teamMember ?? "Marek Stroz",
      source: partial.source ?? "",
      depositDue: partial.depositDue ?? 0,
      updatedDate: partial.updatedDate,
    };
    estimates = [record, ...estimates];
    saveLS();
    notify();
    return record;
  },
  update: (id: number, patch: Partial<EstimateRecord>) => {
    estimates = estimates.map((e) => (e.id === id ? { ...e, ...patch } : e));
    saveLS();
    notify();
  },
  remove: (id: number) => {
    estimates = estimates.filter((e) => e.id !== id);
    saveLS();
    notify();
  },
  removeMany: (ids: Set<number>) => {
    estimates = estimates.filter((e) => !ids.has(e.id));
    saveLS();
    notify();
  },
  nextEstimateNumber,
};
