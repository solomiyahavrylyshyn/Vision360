// Unified clients store — the single source of truth for BOTH the Clients list
// and the Client detail page. Reactive via useSyncExternalStore.
type Listener = () => void;

export interface NoteEntry {
  id: number;
  text: string;
  date: string;
}

export interface AdditionalContact {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface ServiceAddress {
  id: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  notes: string;
  isPrimary: boolean;
}

export type ClientStatus = "Prospect" | "Active" | "Inactive";

/**
 * Derive a client's status from the work we've done for them. The rule:
 *  - an explicit "Inactive" flag (manual deactivation / merge loser) always wins;
 *  - otherwise a client with at least one job (done OR scheduled) is "Active";
 *  - a client we have never created a job for is a "Prospect" (a new prospect).
 * Active vs Prospect is therefore automatic — it follows the jobs, not a manual toggle.
 */
export function deriveClientStatus(status: ClientStatus | undefined, jobCount: number): ClientStatus {
  if (status === "Inactive") return "Inactive";
  return jobCount > 0 ? "Active" : "Prospect";
}

export interface ClientRecord {
  // identity
  id: string;
  customerId: string;
  initials: string;
  avatarColor: string;
  name: string;
  title: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  preferredName: string;
  company: string;
  role: string;
  customerType: string;
  type: string;
  status: ClientStatus;
  customerSince: string;
  lastActivity: string;
  lastService: string;
  // contact
  mobilePhone: string;
  mobilePhoneExt: string;
  workPhone: string;
  workPhoneExt: string;
  phone: string;
  email: string;
  website: string;
  // service address
  address: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  county: string;
  addressNotes: string;
  // billing
  isBillingSameAsService: boolean;
  billingAddress: string;
  billingUnit: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCounty: string;
  gateCode: string;
  // finance
  isTaxable: boolean;
  paymentTerms: string;
  paymentMethod: string;
  creditLimit: number;
  totalJobs: number;
  openJobs: number;
  totalRevenue: number;
  estimatesTotal: number;
  openBalance: number;
  pastDueBalance: number;
  balance: number;
  totalBilled: number;
  pastDue: number;
  daysOverdue: number;
  // misc
  department: string;
  salesRep: string;
  accManager: string;
  marketingSource: string;
  membership: string;
  membershipExpiry: string;
  notes: string;
  notesArray: NoteEntry[];
  additionalContacts: AdditionalContact[];
  serviceAddresses: ServiceAddress[];
  customFields: Record<string, string>;
  tags: string[];
  // Deduplication lifecycle fields
  mergedIntoId?: string;   // set on the losing record after a merge
  archivedAt?: string;     // ISO timestamp when soft-archived
}

type ClientSeed = Partial<ClientRecord> &
  Pick<ClientRecord, "id" | "name" | "firstName" | "lastName" | "initials" | "avatarColor" | "email" | "mobilePhone" | "address" | "city" | "state" | "zip">;

// Build a complete record from a sparse seed so no displayed field is ever undefined.
const mk = (s: ClientSeed): ClientRecord => {
  const base: ClientRecord = {
    id: s.id,
    customerId: s.id,
    initials: s.initials,
    avatarColor: s.avatarColor,
    name: s.name,
    title: "",
    firstName: s.firstName,
    middleInitial: "",
    lastName: s.lastName,
    preferredName: "",
    company: "",
    role: "Property Owner",
    customerType: "homeowner",
    type: "Residential",
    status: "Active",
    customerSince: "Jan 1, 2023",
    lastActivity: "",
    lastService: "",
    mobilePhone: s.mobilePhone,
    mobilePhoneExt: "",
    workPhone: "",
    workPhoneExt: "",
    phone: s.mobilePhone,
    email: s.email,
    website: "",
    address: s.address,
    unit: "",
    city: s.city,
    state: s.state,
    zip: s.zip,
    country: "United States",
    county: "",
    addressNotes: "",
    isBillingSameAsService: true,
    billingAddress: s.address,
    billingUnit: "",
    billingCity: s.city,
    billingState: s.state,
    billingZip: s.zip,
    billingCounty: "",
    gateCode: "",
    isTaxable: true,
    paymentTerms: "Due on receipt",
    paymentMethod: "Credit card on file",
    creditLimit: 5000,
    totalJobs: 0,
    openJobs: 0,
    totalRevenue: 0,
    estimatesTotal: 0,
    openBalance: 0,
    pastDueBalance: 0,
    balance: 0,
    totalBilled: 0,
    pastDue: 0,
    daysOverdue: 0,
    department: "",
    salesRep: "",
    accManager: "",
    marketingSource: "",
    membership: "",
    membershipExpiry: "",
    notes: "",
    notesArray: [],
    additionalContacts: [],
    serviceAddresses: [
      {
        id: "1",
        street: s.address,
        unit: s.unit ?? "",
        city: s.city,
        state: s.state,
        zip: s.zip,
        county: s.county ?? "",
        notes: s.gateCode ? `Gate code: ${s.gateCode}` : "",
        isPrimary: true,
      },
    ],
    customFields: {},
    tags: [],
  };
  return {
    ...base,
    ...s,
    customerId: s.customerId ?? s.id,
    phone: s.phone ?? s.mobilePhone,
    // isTaxable defaults to true for new/legacy records that don't carry the field.
    // Without this, clients created before this field existed render as "Exempt".
    isTaxable: s.isTaxable ?? true,
  };
};

let clients: ClientRecord[] = [
  mk({
    id: "10245", initials: "JS", avatarColor: "#4A6FA5", name: "John Smith", firstName: "John", lastName: "Smith",
    role: "Property Owner", email: "john.smith@email.com", mobilePhone: "(555) 123-4567",
    address: "123 Main St", city: "Austin", state: "TX", zip: "78701", county: "Travis",
    tags: ["Residential", "VIP"], status: "Active", customerSince: "Apr 12, 2022", lastActivity: "Invoice Sent • 2 days ago",
    totalJobs: 5, openJobs: 2, totalRevenue: 12450, totalBilled: 12450, estimatesTotal: 3400, openBalance: 1200, balance: 1200,
    gateCode: "1145",
    notesArray: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 10, 2026" },
      { id: 2, text: "Large back yard — bring extra hose.", date: "Feb 2, 2026" },
    ],
    additionalContacts: [
      { id: 1, firstName: "Jane", lastName: "Smith", phone: "(555) 123-0000", email: "jane.smith@email.com", relationship: "Spouse" },
    ],
  }),
  mk({
    id: "10246", initials: "SJ", avatarColor: "#3B82F6", name: "Sarah Johnson", firstName: "Sarah", lastName: "Johnson",
    company: "Johnson & Partners", role: "Operations Manager", type: "Commercial", customerType: "business",
    email: "sarah.j@email.com", mobilePhone: "(555) 234-5678", website: "https://johnsonpartners.com",
    address: "456 Oak Ave", city: "Dallas", state: "TX", zip: "75201", county: "Dallas",
    tags: ["Commercial"], status: "Active", customerSince: "Sep 3, 2023", lastActivity: "Estimate Sent • 5 days ago",
    totalJobs: 0, openJobs: 0, totalRevenue: 0, estimatesTotal: 1800,
  }),
  mk({
    id: "10247", initials: "MD", avatarColor: "#8B5CF6", name: "Mike Davis", firstName: "Mike", lastName: "Davis",
    company: "Davis Construction", role: "Owner", type: "Commercial", customerType: "business",
    email: "mike@davis.com", mobilePhone: "(555) 345-6789", website: "https://davisconstruction.com",
    address: "789 Pine Rd", city: "Houston", state: "TX", zip: "77001", county: "Harris",
    tags: ["Residential", "Repeat"], status: "Inactive", customerSince: "Jun 18, 2021", lastActivity: "Invoice Overdue • 18 days",
    totalJobs: 3, openJobs: 1, totalRevenue: 8750.5, totalBilled: 8750.5, openBalance: 1250, pastDueBalance: 1250, balance: 1250, pastDue: 1250, daysOverdue: 18,
    gateCode: "0042",
    notesArray: [{ id: 1, text: "Net 30 terms agreed.", date: "Jan 15, 2026" }],
  }),
  mk({
    id: "10248", initials: "RL", avatarColor: "#D97706", name: "Robert Lee", firstName: "Robert", lastName: "Lee",
    company: "Lee & Associates", role: "Principal", type: "Commercial", customerType: "business",
    email: "robert.l@email.com", mobilePhone: "(555) 456-7890",
    address: "321 Elm St", city: "San Antonio", state: "TX", zip: "78201", county: "Bexar",
    tags: ["Commercial", "New"], status: "Prospect", customerSince: "Apr 2, 2026", lastActivity: "Contacted • 3 days ago",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),
  mk({
    id: "10249", initials: "EP", avatarColor: "#10B981", name: "Emily Parker", firstName: "Emily", lastName: "Parker",
    role: "Homeowner", email: "e.parker@email.com", mobilePhone: "(555) 567-8901",
    address: "654 Maple Dr", city: "Fort Worth", state: "TX", zip: "76101", county: "Tarrant",
    tags: ["Residential"], status: "Active", customerSince: "Nov 20, 2024", lastActivity: "Payment Received • 4 days ago",
    totalJobs: 2, openJobs: 1, totalRevenue: 5320, totalBilled: 5320,
    notesArray: [{ id: 1, text: "Gate code changes monthly — call ahead.", date: "Mar 1, 2026" }],
  }),
  mk({
    id: "10250", initials: "TC", avatarColor: "#DC2626", name: "Tom Carter", firstName: "Tom", lastName: "Carter",
    company: "Carter Facilities", role: "Facilities Lead", type: "Commercial", customerType: "business",
    email: "tom.c@email.com", mobilePhone: "(555) 678-9012",
    address: "987 Cedar Ln", city: "Plano", state: "TX", zip: "75023", county: "Collin",
    tags: ["Commercial", "Priority"], status: "Prospect", customerSince: "May 30, 2026", lastActivity: "Quote Requested • today",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),

  // ── Manage Duplicates test data ──────────────────────────────────────────
  // Group 1: same phone (likely same person, different spellings of name)
  mk({
    id: "10261", initials: "MJ", avatarColor: "#7C3AED", name: "Michael Johnson", firstName: "Michael", lastName: "Johnson",
    email: "mjohnson@gmail.com", mobilePhone: "(813) 555-0191",
    address: "1402 Bayshore Blvd", city: "Tampa", state: "FL", zip: "33606",
    status: "Active", customerSince: "Jan 5, 2025", lastActivity: "Invoice Sent • 1 week ago",
    totalJobs: 2, openJobs: 0, totalRevenue: 3200, totalBilled: 3200,
  }),
  mk({
    id: "10262", initials: "MJ", avatarColor: "#6D28D9", name: "Mike Johnson", firstName: "Mike", lastName: "Johnson",
    email: "", mobilePhone: "(813) 555-0191",  // same phone — definite duplicate
    address: "1402 Bayshore Blvd", city: "Tampa", state: "FL", zip: "33606",
    status: "Prospect", customerSince: "Mar 12, 2025", lastActivity: "Created • Mar 12",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),

  // Group 2: same email (two accounts for the same person)
  mk({
    id: "10263", initials: "LC", avatarColor: "#0891B2", name: "Laura Chen", firstName: "Laura", lastName: "Chen",
    company: "Chen Consulting", email: "laura.chen@outlook.com", mobilePhone: "(407) 612-3340",
    address: "55 Orange Ave", city: "Orlando", state: "FL", zip: "32801",
    status: "Active", customerSince: "Jun 2024", lastActivity: "Estimate Sent • 3 days ago",
    totalJobs: 1, openJobs: 1, totalRevenue: 1800, totalBilled: 1800,
  }),
  mk({
    id: "10264", initials: "LC", avatarColor: "#0E7490", name: "L. Chen", firstName: "L.", lastName: "Chen",
    company: "", email: "laura.chen@outlook.com",  // same email — duplicate
    mobilePhone: "(407) 612-3341",
    address: "55 Orange Avenue", city: "Orlando", state: "FL", zip: "32801",
    status: "Prospect", customerSince: "Sep 2024", lastActivity: "Created • Sep 3",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),

  // Group 3: same company name (different contacts at the same company — could be intentional)
  mk({
    id: "10265", initials: "PB", avatarColor: "#16A34A", name: "Patricia Burns", firstName: "Patricia", lastName: "Burns",
    company: "Sunrise Properties LLC", role: "Owner", type: "Commercial", customerType: "business",
    email: "p.burns@sunriseprops.com", mobilePhone: "(305) 900-1234",
    address: "800 Brickell Ave", city: "Miami", state: "FL", zip: "33131",
    status: "Active", customerSince: "Feb 2024", lastActivity: "Payment Received • 5 days ago",
    totalJobs: 4, openJobs: 1, totalRevenue: 9500, totalBilled: 9500,
  }),
  mk({
    id: "10266", initials: "DS", avatarColor: "#15803D", name: "David Stern", firstName: "David", lastName: "Stern",
    company: "Sunrise Properties LLC", role: "Property Manager", type: "Commercial", customerType: "business",
    email: "d.stern@sunriseprops.com", mobilePhone: "(305) 900-5678",
    address: "800 Brickell Ave", city: "Miami", state: "FL", zip: "33131",
    status: "Active", customerSince: "Feb 2024", lastActivity: "Job Scheduled • 2 days ago",
    totalJobs: 2, openJobs: 1, totalRevenue: 4200, totalBilled: 4200,
  }),
  mk({
    id: "10267", initials: "SR", avatarColor: "#166534", name: "Sunrise Properties", firstName: "Sunrise", lastName: "Properties",
    company: "Sunrise Properties LLC", type: "Commercial", customerType: "business",
    email: "info@sunriseprops.com", mobilePhone: "(305) 900-0000",
    address: "800 Brickell Avenue", city: "Miami", state: "FL", zip: "33131",
    status: "Prospect", customerSince: "Jan 2026", lastActivity: "Created • Jan 10",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),

  // Group 4: similar name + phone (fuzzy match — probably the same person)
  mk({
    id: "10268", initials: "RG", avatarColor: "#B45309", name: "Robert Garcia", firstName: "Robert", lastName: "Garcia",
    email: "rgarcia@yahoo.com", mobilePhone: "(727) 488-2200",
    address: "341 Gulf Blvd", city: "St. Petersburg", state: "FL", zip: "33706",
    status: "Active", customerSince: "Oct 2023", lastActivity: "Invoice Overdue • 12 days",
    totalJobs: 3, openJobs: 0, totalRevenue: 6750, totalBilled: 6750, openBalance: 875, pastDueBalance: 875,
  }),
  mk({
    id: "10269", initials: "BG", avatarColor: "#92400E", name: "Bob Garcia", firstName: "Bob", lastName: "Garcia",
    email: "", mobilePhone: "(727) 488-2200",  // same phone, shortened first name
    address: "341 Gulf Boulevard", city: "St. Pete", state: "FL", zip: "33706",
    status: "Prospect", customerSince: "Mar 2024", lastActivity: "Created • Mar 2024",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),
];

/* ── Browser durability cache ─────────────────────────────────────────────
   Mirror the store to localStorage so a user's work (new clients, edits,
   notes, status changes) survives a page reload even when the API/DB server
   isn't running. Postgres stays the source of truth when configured — a
   successful API hydrate overrides this cache and re-saves it. This is a
   resilience cache, NOT the data model. */
const LS_KEY = "vision360.clients.v1";
function saveLS() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(clients));
  } catch {
    /* storage unavailable / quota exceeded → ignore */
  }
}
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    // Re-run mk() so any newly-added schema fields get sane defaults.
    if (Array.isArray(parsed) && parsed.length) clients = parsed.map((r) => mk(r as ClientSeed));
  }
} catch {
  /* corrupt cache → keep the seed above */
}

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());

/* ──────────────────────────────────────────────────────────────────────
   Postgres-backed persistence (via the /api proxy → Express + pg server).
   The store keeps a SYNCHRONOUS in-memory cache so the UI never blocks and
   needs no loading states. On first mount it hydrates from the API; every
   mutation writes through. If the API/DB is unavailable it silently falls
   back to the seed data above, so the app keeps working without the DB.
   ────────────────────────────────────────────────────────────────────── */
const API = "/api/clients";
let hydrated = false;

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const res = await fetch(API, { headers: { Accept: "application/json" } });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("application/json")) return; // no server/proxy → keep seed
    const rows = (await res.json()) as ClientRecord[];
    if (Array.isArray(rows) && rows.length) {
      clients = rows.map((r) => mk(r as unknown as ClientSeed));
      saveLS();
      notify();
    }
  } catch {
    /* DB not running / not configured → keep seed */
  }
}

function persistNew(record: ClientRecord) {
  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }).catch(() => {
    /* best-effort; record stays in the in-memory cache */
  });
}

function persistPatch(id: string, patch: Partial<ClientRecord>) {
  fetch(`${API}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {
    /* best-effort */
  });
}

export const clientsStore = {
  getSnapshot: (): ClientRecord[] => clients,
  getClient: (id: string | undefined): ClientRecord | undefined => clients.find((c) => c.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    hydrate(); // lazy: pull from Postgres the first time any view mounts
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addClient: (record: ClientRecord) => {
    clients = [record, ...clients];
    saveLS();
    notify();
    persistNew(record);
  },
  updateClient: (id: string, patch: Partial<ClientRecord>) => {
    clients = clients.map((c) => (c.id === id ? { ...c, ...patch } : c));
    saveLS();
    notify();
    persistPatch(id, patch);
  },
  makeRecord: mk,
};
