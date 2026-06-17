// Invoices store — single source of truth for the Invoices list, CreateInvoice
// (so newly-created invoices persist), JobDetail's Invoices tab and CreatePayment's
// invoice selector. Mirrors estimatesStore / paymentsStore: in-memory cache +
// localStorage so created invoices survive a refresh / route change. No /api
// route exists for invoices today; if one is added, mirror clientsStore's
// hydrate() / persistNew() pattern here.

type Listener = () => void;

export type InvoiceStatus =
  | "Unpaid"
  | "Overdue"
  | "Paid"
  | "Partially Paid"
  | "Void";

export type InvoiceType = "Standard" | "Recurring" | "Progress" | "Final" | "Credit Memo";

export interface Invoice {
  id: number;
  // Identity
  number: string;          // 10245-I02
  type: InvoiceType;
  date: string;
  status: InvoiceStatus;

  // Client / Job
  clientName: string;
  customerEmail: string;
  phone: string;
  jobNumber: string;
  jobName: string;

  // Money
  total: number;
  balance: number;

  // Refs
  linkedEstimate: string;
  poNumber: string;
  memo: string;

  // Billing address
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingState: string;
  billingZip: string;

  // Service address
  serviceAddress: string;
  serviceCity: string;
  serviceCounty: string;
  serviceState: string;
  serviceZip: string;

  // Sales / payment
  leadSource: string;
  salesRep: string;
  estimateStatus: string;
  paymentTerms: string;
  checkNumber: string;
  paymentMethod: string;
  dueDate: string;
  department: string;
  toBePrinted: boolean;

  // Audit
  dateCreated: string;
  createdBy: string;
  stage: string;

  // Custom
  customField1: string;
  customField2: string;

  // Communication
  noteToCustomer: string;
  dateSent: string;
}

const LS_KEY = "vision360.invoices.v1";

// Seed used the first time the app boots on a clean browser. Subsequent loads
// rehydrate from localStorage so user-created invoices persist across refresh.
const SEED: Invoice[] = [
  {
    id: 1, number: "10245-I01", type: "Standard", date: "2026-03-02",
    status: "Paid",
    clientName: "Travis Jones", customerEmail: "travis.j@email.com", phone: "(512) 555-0142",
    jobNumber: "10245", jobName: "Kitchen Renovation",
    total: 9480.50, balance: 0,
    linkedEstimate: "EST-001", poNumber: "PO-77821", memo: "Final billing for kitchen reno",
    billingAddress: "123 Main St", billingCity: "Austin", billingCounty: "Travis", billingState: "TX", billingZip: "78701",
    serviceAddress: "123 Main St", serviceCity: "Austin", serviceCounty: "Travis", serviceState: "TX", serviceZip: "78701",
    leadSource: "Referral", salesRep: "Marek Stroz",
    estimateStatus: "Approved", paymentTerms: "Net 30",
    checkNumber: "4582", paymentMethod: "Check",
    dueDate: "2026-04-01", department: "Field Service", toBePrinted: false,
    dateCreated: "2026-03-02", createdBy: "Marek Stroz", stage: "Closed",
    customField1: "", customField2: "",
    noteToCustomer: "Thank you for your business!", dateSent: "2026-03-02",
  },
  {
    id: 2, number: "10246-I01", type: "Standard", date: "2026-03-02",
    status: "Overdue",
    clientName: "John Doe", customerEmail: "john.d@email.com", phone: "(214) 555-0188",
    jobNumber: "10246", jobName: "Bathroom Remodel",
    total: 5975.50, balance: 5975.50,
    linkedEstimate: "", poNumber: "", memo: "Client requested extended payment terms",
    billingAddress: "789 Oak Ave", billingCity: "Dallas", billingCounty: "Dallas", billingState: "TX", billingZip: "75201",
    serviceAddress: "789 Oak Ave", serviceCity: "Dallas", serviceCounty: "Dallas", serviceState: "TX", serviceZip: "75201",
    leadSource: "Google Ads", salesRep: "Marek Stroz",
    estimateStatus: "Approved", paymentTerms: "Net 15",
    checkNumber: "", paymentMethod: "",
    dueDate: "2026-03-17", department: "Field Service", toBePrinted: true,
    dateCreated: "2026-03-02", createdBy: "Marek Stroz", stage: "Awaiting Payment",
    customField1: "", customField2: "",
    noteToCustomer: "Please remit payment promptly.", dateSent: "2026-03-02",
  },
  {
    // A fully "empty" invoice (no estimate, no job) is a valid case — e.g.
    // selling used equipment off the shelf; the buyer just needs an invoice.
    id: 3, number: "10250-I01", type: "Standard", date: "2026-03-25",
    status: "Unpaid",
    clientName: "Bob Garcia", customerEmail: "bob.garcia@email.com", phone: "(214) 555-0199",
    jobNumber: "", jobName: "",
    total: 500.00, balance: 500.00,
    linkedEstimate: "", poNumber: "", memo: "Used equipment sale",
    billingAddress: "789 Oak Ave", billingCity: "Dallas", billingCounty: "Dallas", billingState: "TX", billingZip: "75201",
    serviceAddress: "789 Oak Ave", serviceCity: "Dallas", serviceCounty: "Dallas", serviceState: "TX", serviceZip: "75201",
    leadSource: "Repeat Customer", salesRep: "Marek Stroz",
    estimateStatus: "", paymentTerms: "Net 30",
    checkNumber: "", paymentMethod: "",
    dueDate: "2026-04-24", department: "Field Service", toBePrinted: true,
    dateCreated: "2026-03-25", createdBy: "Marek Stroz", stage: "Draft",
    customField1: "", customField2: "",
    noteToCustomer: "", dateSent: "",
  },
  {
    id: 4, number: "10248-I02", type: "Progress", date: "2026-02-28",
    status: "Partially Paid",
    clientName: "Sarah Williams", customerEmail: "sarah.w@email.com", phone: "(713) 555-0301",
    jobNumber: "10248", jobName: "Electrical Work",
    total: 2365.00, balance: 1365.00,
    linkedEstimate: "EST-005", poNumber: "PO-66104", memo: "Progress invoice — phase 1",
    billingAddress: "321 Elm St", billingCity: "Houston", billingCounty: "Harris", billingState: "TX", billingZip: "77001",
    serviceAddress: "321 Elm St", serviceCity: "Houston", serviceCounty: "Harris", serviceState: "TX", serviceZip: "77001",
    leadSource: "Yelp", salesRep: "Marek Stroz",
    estimateStatus: "Approved", paymentTerms: "Net 30",
    checkNumber: "9912", paymentMethod: "Check",
    dueDate: "2026-03-30", department: "Field Service", toBePrinted: false,
    dateCreated: "2026-02-28", createdBy: "Marek Stroz", stage: "Awaiting Deposit",
    customField1: "", customField2: "",
    noteToCustomer: "Phase 2 invoice to follow.", dateSent: "2026-03-01",
  },
  {
    id: 5, number: "10247-I01", type: "Standard", date: "2026-02-25",
    status: "Unpaid",
    clientName: "Mike Rodriguez", customerEmail: "mike.r@email.com", phone: "(210) 555-0247",
    jobNumber: "10247", jobName: "Plumbing Fix",
    total: 913.75, balance: 913.75,
    linkedEstimate: "", poNumber: "", memo: "",
    billingAddress: "555 Pine Rd", billingCity: "San Antonio", billingCounty: "Bexar", billingState: "TX", billingZip: "78201",
    serviceAddress: "555 Pine Rd", serviceCity: "San Antonio", serviceCounty: "Bexar", serviceState: "TX", serviceZip: "78201",
    leadSource: "Google Ads", salesRep: "Marek Stroz",
    estimateStatus: "N/A", paymentTerms: "Net 30",
    checkNumber: "", paymentMethod: "",
    dueDate: "2026-05-15", department: "Field Service", toBePrinted: false,
    dateCreated: "2026-02-25", createdBy: "Marek Stroz", stage: "Sent",
    customField1: "", customField2: "",
    noteToCustomer: "", dateSent: "2026-02-26",
  },
  {
    id: 6, number: "10249-I01", type: "Final", date: "2026-02-20",
    status: "Paid",
    clientName: "Sarah Williams", customerEmail: "sarah.w@email.com", phone: "(713) 555-0301",
    jobNumber: "10249", jobName: "Drain Service",
    total: 326.25, balance: 0,
    linkedEstimate: "", poNumber: "", memo: "",
    billingAddress: "321 Elm St", billingCity: "Houston", billingCounty: "Harris", billingState: "TX", billingZip: "77001",
    serviceAddress: "321 Elm St", serviceCity: "Houston", serviceCounty: "Harris", serviceState: "TX", serviceZip: "77001",
    leadSource: "Repeat Customer", salesRep: "Marek Stroz",
    estimateStatus: "N/A", paymentTerms: "Due on Receipt",
    checkNumber: "", paymentMethod: "Credit Card",
    dueDate: "2026-02-27", department: "Field Service", toBePrinted: false,
    dateCreated: "2026-02-20", createdBy: "Marek Stroz", stage: "Closed",
    customField1: "", customField2: "",
    noteToCustomer: "", dateSent: "2026-02-20",
  },
  {
    id: 7, number: "10240-I01", type: "Standard", date: "2026-01-15",
    status: "Void",
    clientName: "Alex Turner", customerEmail: "alex.t@email.com", phone: "(469) 555-0455",
    jobNumber: "10240", jobName: "—",
    total: 450.00, balance: 0,
    linkedEstimate: "", poNumber: "", memo: "Voided — duplicate",
    billingAddress: "44 River Rd", billingCity: "Plano", billingCounty: "Collin", billingState: "TX", billingZip: "75024",
    serviceAddress: "44 River Rd", serviceCity: "Plano", serviceCounty: "Collin", serviceState: "TX", serviceZip: "75024",
    leadSource: "Website", salesRep: "Marek Stroz",
    estimateStatus: "N/A", paymentTerms: "Net 30",
    checkNumber: "", paymentMethod: "",
    dueDate: "2026-02-14", department: "Field Service", toBePrinted: false,
    dateCreated: "2026-01-15", createdBy: "Marek Stroz", stage: "Void",
    customField1: "", customField2: "",
    noteToCustomer: "", dateSent: "",
  },
];

let invoices: Invoice[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) invoices = parsed;
  }
} catch {
  /* corrupt cache → keep seed */
}

// The original seed list, for callers that want the demo data directly (e.g.
// CreatePayment's invoice selector on a clean browser).
export const initialInvoices = SEED;

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());

const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(invoices)); } catch { /* quota */ }
};

const nextId = () => (invoices.length ? Math.max(...invoices.map((i) => i.id)) + 1 : 1);

// Build the next "<base>-IXX" number for a given client/job base. Falls back to
// "10000-IXX" when no base is supplied.
const nextInvoiceNumber = (base?: string) => {
  const prefix = (base?.trim() || "10000") + "-I";
  const used = invoices
    .filter((i) => i.number.startsWith(prefix))
    .map((i) => Number(i.number.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(2, "0")}`;
};

export const invoicesStore = {
  getSnapshot: (): Invoice[] => invoices,
  getById: (id: number): Invoice | undefined => invoices.find((i) => i.id === id),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  add: (partial: Partial<Invoice> & { clientName: string }): Invoice => {
    const record: Invoice = {
      id: nextId(),
      number: partial.number || nextInvoiceNumber(),
      type: partial.type ?? "Standard",
      date: partial.date ?? "",
      status: partial.status ?? "Unpaid",
      clientName: partial.clientName,
      customerEmail: partial.customerEmail ?? "",
      phone: partial.phone ?? "",
      jobNumber: partial.jobNumber ?? "",
      jobName: partial.jobName ?? "",
      total: partial.total ?? 0,
      balance: partial.balance ?? partial.total ?? 0,
      linkedEstimate: partial.linkedEstimate ?? "",
      poNumber: partial.poNumber ?? "",
      memo: partial.memo ?? "",
      billingAddress: partial.billingAddress ?? "",
      billingCity: partial.billingCity ?? "",
      billingCounty: partial.billingCounty ?? "",
      billingState: partial.billingState ?? "",
      billingZip: partial.billingZip ?? "",
      serviceAddress: partial.serviceAddress ?? "",
      serviceCity: partial.serviceCity ?? "",
      serviceCounty: partial.serviceCounty ?? "",
      serviceState: partial.serviceState ?? "",
      serviceZip: partial.serviceZip ?? "",
      leadSource: partial.leadSource ?? "",
      salesRep: partial.salesRep ?? "",
      estimateStatus: partial.estimateStatus ?? "",
      paymentTerms: partial.paymentTerms ?? "Net 30",
      checkNumber: partial.checkNumber ?? "",
      paymentMethod: partial.paymentMethod ?? "",
      dueDate: partial.dueDate ?? "",
      department: partial.department ?? "Field Service",
      toBePrinted: partial.toBePrinted ?? false,
      dateCreated: partial.dateCreated ?? partial.date ?? "",
      createdBy: partial.createdBy ?? "You",
      stage: partial.stage ?? "Draft",
      customField1: partial.customField1 ?? "",
      customField2: partial.customField2 ?? "",
      noteToCustomer: partial.noteToCustomer ?? "",
      dateSent: partial.dateSent ?? "",
    };
    invoices = [record, ...invoices];
    saveLS();
    notify();
    return record;
  },
  update: (id: number, patch: Partial<Invoice>) => {
    invoices = invoices.map((i) => (i.id === id ? { ...i, ...patch } : i));
    saveLS();
    notify();
  },
  remove: (id: number) => {
    invoices = invoices.filter((i) => i.id !== id);
    saveLS();
    notify();
  },
  removeMany: (ids: Set<number>) => {
    invoices = invoices.filter((i) => !ids.has(i.id));
    saveLS();
    notify();
  },
  nextInvoiceNumber,
};
