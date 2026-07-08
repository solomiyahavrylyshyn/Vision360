// Jobs store — localStorage-backed so newly created jobs survive refresh, with
// optional Postgres write-through. Mirrors clientsStore / estimatesStore.
import { createApiSync } from "./apiSync";

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
  // Frequency (One-off / Recurring) is a SEPARATE dimension from the semantic
  // type in jobCategory (Marek call #21: "recurring/one-off are not job types").
  // Optional so records persisted before this field existed still load.
  frequency?: string;
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

// Seed jobs so client Jobs tabs are populated out-of-the-box (and back the
// job counts advertised on the client KPI strip). These belong to John Smith
// (client 10245), who has no jobs in the Jobs-list mock array, so there are no
// id / jobNumber collisions there. localStorage still overrides this seed for
// anyone who has already created jobs, so it's non-destructive.
const mkSeed = (
  id: number, suffix: string, title: string, status: string,
  startDate: string, total: number, jobType = "One-off",
): JobRecord => ({
  id, jobNumber: `10245-J${suffix}`, title,
  client: "John Smith", clientId: "10245",
  address: "123 Main St", city: "Austin", state: "TX", zip: "78701",
  gateCode: "1145", assignedTo: "Emily Parker", jobType, jobCategory: "Service",
  frequency: jobType, // seed's jobType arg carries the frequency (One-off/Recurring)
  startDate, endDate: startDate, startTime: "09:00", endTime: "11:00",
  status, totalPrice: total, notes: "", fieldNotes: "", privateNotes: "",
  taxRate: 8.25, createdAt: `${startDate} 09:00`,
});
const SEED: JobRecord[] = [
  mkSeed(105, "05", "AC System Tune-Up",       "Scheduled",   "2026-06-08", 189.00),
  mkSeed(104, "04", "Thermostat Replacement",  "In Progress", "2026-06-03", 245.50),
  mkSeed(103, "03", "Spring Maintenance Visit","Completed",   "2026-04-22", 320.00, "Recurring"),
  mkSeed(102, "02", "Ductwork Inspection",     "Completed",   "2026-03-14", 175.00),
  mkSeed(101, "01", "AC Compressor Repair",    "Completed",   "2026-02-28", 540.75),
];

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

const api = createApiSync<JobRecord>("jobs", (j) => j.id);

export const jobsStore = {
  getSnapshot: (): JobRecord[] => jobs,
  getById: (id: number): JobRecord | undefined => jobs.find((j) => j.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    api.hydrate(jobs, (rows) => { jobs = rows; saveLS(); notify(); });
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Omit<JobRecord, "id" | "createdAt">): JobRecord => {
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const record: JobRecord = { id: nextId(), ...partial, createdAt };
    jobs = [record, ...jobs];
    saveLS();
    notify();
    api.persistNew(record);
    return record;
  },
  update: (id: number, patch: Partial<JobRecord>) => {
    jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    saveLS();
    notify();
    api.persistPatch(id, patch);
  },
  count: () => jobs.length,
};
