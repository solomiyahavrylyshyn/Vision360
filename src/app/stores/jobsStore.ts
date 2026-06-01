// Jobs store — localStorage-backed so newly created jobs survive refresh.
// Mirrors clientsStore / estimatesStore / paymentsStore pattern.

type Listener = () => void;

export interface JobRecord {
  id: number;
  jobNumber: string;
  title: string;
  client: string;
  clientId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gateCode: string;
  assignedTo: string;
  jobType: string;
  jobCategory: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  notes: string;
  fieldNotes: string;
  privateNotes: string;
  taxRate: number;
  estimateId?: number;
  estimateNumber?: string;
  createdAt: string;
}

const LS_KEY = "vision360.jobs.v1";

// A handful of seed records so the Jobs list isn't empty on first load.
// These are intentionally minimal — the real demo data lives in the
// Calendar mock arrays and JobDetail mock. This store is the persistence
// layer for newly created jobs.
const SEED: JobRecord[] = [];

let jobs: JobRecord[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) jobs = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());

const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(jobs)); } catch { /* quota */ }
};

const nextId = () =>
  jobs.length ? Math.max(...jobs.map((j) => j.id)) + 1 : 1;

const pad2 = (n: number) => String(n).padStart(2, "0");

export const jobsStore = {
  getSnapshot: (): JobRecord[] => jobs,
  getById: (id: number): JobRecord | undefined => jobs.find((j) => j.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Omit<JobRecord, "id" | "createdAt">): JobRecord => {
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const record: JobRecord = { id: nextId(), ...partial, createdAt };
    jobs = [record, ...jobs];
    saveLS();
    notify();
    return record;
  },
  update: (id: number, patch: Partial<JobRecord>) => {
    jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    saveLS();
    notify();
  },
  count: () => jobs.length,
};
