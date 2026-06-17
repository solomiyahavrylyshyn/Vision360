import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { PlusIcon } from "../components/ui/plus-icon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { RecordTab, type RecordColumn, type RecordAction } from "../components/ui/record-tab";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { jobsStore } from "../stores/jobsStore";

// A job linked to the invoice, rendered as one accordion section in the
// Job Details card.
interface LinkedJobInfo {
  jobNumber: string;
  jobName: string;
  serviceAddress: { line: string; city: string; state: string; zip: string };
  linkedEstimate: string;
  estimateStatus?: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus =
  | "Unpaid"
  | "Overdue"
  | "Paid"
  | "Partially Paid"
  | "Void";

type InvoiceType = "Standard" | "Recurring" | "Progress" | "Final" | "Credit Memo";

interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
  checkNumber?: string;
  note: string;
}

interface ActivityEntry {
  id: number;
  date: string;
  action: string;
  detail: string;
  icon: string;
}

const statusColors: Record<InvoiceStatus, { text: string; bg: string }> = {
  "Unpaid":         { text: "#DC2626", bg: "#FEE2E2" },
  "Overdue": { text: "#EF4444", bg: "#FEE2E2" },
  "Paid":           { text: "#16A34A", bg: "#DCFCE7" },
  "Partially Paid": { text: "#D97706", bg: "#FEF3C7" },
  "Void":           { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = [
  "Unpaid",
  "Overdue",
  "Paid",
  "Partially Paid",
  "Void",
];

import { PAYMENT_METHODS } from "../constants/paymentMethods";
const paymentMethods = PAYMENT_METHODS;

const TODAY = "2026-04-27";
function daysBetween(a: string, b: string) {
  const da = new Date(a + "T12:00:00").getTime();
  const db = new Date(b + "T12:00:00").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

// ─── Mock Invoice Data ───────────────────────────────────────────────────────
const mockInvoices: Record<string, any> = {
  "1": {
    number: "10245-I01",
    type: "Standard" as InvoiceType,
    status: "Paid" as InvoiceStatus,
    date: "2026-03-02",
    dueDate: "2026-04-01",
    dateSent: "2026-03-02",
    dateCreated: "2026-03-02",
    createdBy: "Marek Stroz",
    stage: "Closed",
    department: "Field Service",
    toBePrinted: false,

    client: { name: "Travis Jones", email: "travis.j@email.com", phone: "(512) 555-0142" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "123 Main St", city: "Austin", county: "Travis", state: "TX", zip: "78701" },
    serviceAddress: { line: "123 Main St", city: "Austin", county: "Travis", state: "TX", zip: "78701" },

    jobNumber: "10245-J01",
    jobName: "Kitchen Renovation",
    // An invoice can settle several jobs; each entry renders as an accordion
    // section in the Job Details card.
    jobs: [
      { jobNumber: "10245-J01", jobName: "Kitchen Renovation", serviceAddress: { line: "123 Main St", city: "Austin", state: "TX", zip: "78701" }, linkedEstimate: "10245-E01", estimateStatus: "Approved" },
    ],
    linkedEstimate: "10245-E01",
    estimateStatus: "Approved",
    poNumber: "PO-77821",
    memo: "Final billing for kitchen reno",

    leadSource: "Referral",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 30",
    paymentMethod: "Check",
    checkNumber: "4582",

    customField1: "",
    customField2: "",
    noteToCustomer: "Thank you for your business!",

    items: [
      { name: "Heat Pump Repair or Service", description: "Heat pump diagnostic, repair and service", qty: 1, unitPrice: 285, taxable: false },
      { name: "SEER Heat Pump Condenser Unit", description: "SEER Heat Pump Condenser — high efficiency outdoor unit", qty: 2, unitPrice: 3200, taxable: true },
      { name: "Copper Piping Installation", description: "Professional copper piping installation (per ft)", qty: 40, unitPrice: 18.50, taxable: true },
      { name: "General Labor - Technician", description: "Technician labor (hourly)", qty: 16, unitPrice: 95, taxable: false },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [
      { id: 1, date: "2026-03-10", amount: 5000, method: "Bank Transfer", note: "First installment" },
      { id: 2, date: "2026-03-25", amount: 5502, method: "Check", checkNumber: "4582", note: "Final payment" },
    ],
    activity: [
      { id: 1, date: "2026-03-02 09:15", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-02 09:30", action: "Invoice sent", detail: "Sent to travis.j@email.com", icon: "send" },
      { id: 3, date: "2026-03-10 14:22", action: "Payment recorded", detail: "$5,000.00 via Bank Transfer", icon: "payments" },
      { id: 4, date: "2026-03-25 11:45", action: "Payment recorded", detail: "$5,502.00 via Check", icon: "payments" },
      { id: 5, date: "2026-03-25 11:45", action: "Status changed", detail: "Marked as Paid", icon: "check_circle" },
    ],
  },
  "2": {
    number: "10246-I01",
    type: "Standard" as InvoiceType,
    status: "Overdue" as InvoiceStatus,
    date: "2026-03-02",
    dueDate: "2026-03-17",
    dateSent: "2026-03-02",
    dateCreated: "2026-03-02",
    createdBy: "Marek Stroz",
    stage: "Awaiting Payment",
    department: "Field Service",
    toBePrinted: true,

    client: { name: "John Doe", email: "john.d@email.com", phone: "(214) 555-0188" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },
    serviceAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },

    jobNumber: "10246-J01",
    jobName: "Bathroom Remodel",
    jobs: [
      { jobNumber: "10246-J01", jobName: "Bathroom Remodel", serviceAddress: { line: "789 Oak Ave", city: "Dallas", state: "TX", zip: "75201" }, linkedEstimate: "", estimateStatus: "" },
    ],
    linkedEstimate: "",
    estimateStatus: "Approved",
    poNumber: "",
    memo: "Client requested extended payment terms",

    leadSource: "Google Ads",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 15",
    paymentMethod: "",
    checkNumber: "",

    customField1: "",
    customField2: "",
    noteToCustomer: "Please remit payment promptly.",

    items: [
      { name: "SEER Heat Pump Condenser Premium", description: "SEER Premium Heat Pump Condenser — ultra high efficiency", qty: 1, unitPrice: 4800, taxable: true },
      { name: "General Labor - Technician", description: "Technician labor (hourly)", qty: 12, unitPrice: 95, taxable: false },
    ],
    taxRate: 7.5,
    notes: "Client requested extended payment terms",
    terms: "Payment is due within 15 days of invoice date.",
    payments: [],
    activity: [
      { id: 1, date: "2026-03-02 10:00", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-02 10:05", action: "Invoice sent", detail: "Sent to john.d@email.com", icon: "send" },
      { id: 3, date: "2026-03-18 00:00", action: "Status changed", detail: "Automatically marked Overdue", icon: "warning" },
    ],
  },
  "3": {
    // Fully "empty" invoice — no estimate, no job. Valid case: selling used
    // equipment off the shelf, the buyer just asks for an invoice.
    number: "10250-I01",
    type: "Standard" as InvoiceType,
    status: "Unpaid" as InvoiceStatus,
    date: "2026-03-25",
    dueDate: "2026-04-24",
    dateSent: "",
    dateCreated: "2026-03-25",
    createdBy: "Marek Stroz",
    stage: "Draft",
    department: "Field Service",
    toBePrinted: true,

    client: { name: "Bob Garcia", email: "bob.garcia@email.com", phone: "(214) 555-0199" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },
    serviceAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },

    jobNumber: "",
    jobName: "",
    jobs: [],
    linkedEstimate: "",
    estimateStatus: "",
    poNumber: "",
    memo: "Used equipment sale",

    leadSource: "Repeat Customer",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 30",
    paymentMethod: "",
    checkNumber: "",

    customField1: "",
    customField2: "",
    noteToCustomer: "",

    items: [
      { name: "Used equipment", description: "Pre-owned condenser unit — sold as-is", qty: 1, unitPrice: 500, taxable: false },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [],
    activity: [
      { id: 1, date: "2026-03-25 12:10", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
    ],
  },
  "4": {
    number: "10248-I02",
    type: "Progress" as InvoiceType,
    status: "Partially Paid" as InvoiceStatus,
    date: "2026-02-28",
    dueDate: "2026-03-30",
    dateSent: "2026-03-01",
    dateCreated: "2026-02-28",
    createdBy: "Marek Stroz",
    stage: "Awaiting Deposit",
    department: "Field Service",
    toBePrinted: false,

    client: { name: "Sarah Williams", email: "sarah.w@email.com", phone: "(713) 555-0301" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "321 Elm St", city: "Houston", county: "Harris", state: "TX", zip: "77001" },
    serviceAddress: { line: "321 Elm St", city: "Houston", county: "Harris", state: "TX", zip: "77001" },

    jobNumber: "10248-J01",
    jobName: "Electrical Work",
    // Multi-job example: three jobs closed with a single invoice.
    jobs: [
      { jobNumber: "10248-J01", jobName: "Electrical Work", serviceAddress: { line: "321 Elm St", city: "Houston", state: "TX", zip: "77001" }, linkedEstimate: "10248-E01", estimateStatus: "Approved" },
      { jobNumber: "10248-J02", jobName: "Panel Upgrade — Garage", serviceAddress: { line: "321 Elm St", city: "Houston", state: "TX", zip: "77001" }, linkedEstimate: "", estimateStatus: "" },
      { jobNumber: "10248-J03", jobName: "EV Charger Install", serviceAddress: { line: "321 Elm St", city: "Houston", state: "TX", zip: "77001" }, linkedEstimate: "", estimateStatus: "" },
    ],
    linkedEstimate: "10248-E01",
    estimateStatus: "Approved",
    poNumber: "PO-66104",
    memo: "Progress invoice — phase 1",

    leadSource: "Yelp",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 30",
    paymentMethod: "Check",
    checkNumber: "9912",

    customField1: "",
    customField2: "",
    noteToCustomer: "Phase 2 invoice to follow.",

    items: [
      { name: "Electrical Panel Upgrade 200A", description: "200A electrical panel upgrade — parts and labor", qty: 1, unitPrice: 2200, taxable: true },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [
      { id: 1, date: "2026-03-15", amount: 1000, method: "Check", checkNumber: "9912", note: "Partial payment" },
    ],
    activity: [
      { id: 1, date: "2026-02-28 15:00", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-01 09:00", action: "Invoice sent", detail: "Sent to sarah.w@email.com", icon: "send" },
      { id: 3, date: "2026-03-15 13:30", action: "Payment recorded", detail: "$1,000.00 via Check #9912", icon: "payments" },
      { id: 4, date: "2026-03-15 13:30", action: "Status changed", detail: "Marked as Partially Paid", icon: "info" },
    ],
  },
};

// ─── Shared UI helpers (mirror ItemDetail) ───────────────────────────────────
function Field({ label, value, link, accent }: { label: string; value?: React.ReactNode; link?: string; accent?: string }) {
  const empty = value === null || value === undefined || value === "" || value === false;
  const display = empty
    ? <span className="text-[#9CA3AF]">—</span>
    : link
      ? <a href={link} className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>{value}</a>
      : value;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-[#9CA3AF] leading-[16px]">{label}</div>
      <div className="text-[13px] leading-[20px]" style={accent ? { color: accent, fontWeight: 500 } : { color: "#374151" }}>{display}</div>
    </div>
  );
}

function Card({ title, children, onEdit, action }: { title: string; children: React.ReactNode; onEdit?: () => void; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h3>
        <div className="flex items-center gap-2">
          {action}
          {onEdit && (
            <button onClick={onEdit} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

type TabKey = "details" | "jobs" | "payments" | "activity";
type NotesTabKey = "customer" | "internal";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "jobs", label: "Jobs" },
  { key: "payments", label: "Payments" },
  { key: "activity", label: "Activity" },
];

// ═══════════════════════════════════════════════════════════════════════════════
export function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const data = mockInvoices[id || "1"] || mockInvoices["1"];

  // Honor ?tab= so a create round-trip (e.g. Invoice → Collect Payment → back)
  // lands on the tab the user left.
  const [activeTab, setActiveTabState] = useState<TabKey>((searchParams.get("tab") as TabKey) || "details");
  const setActiveTab = (key: TabKey) => {
    setActiveTabState(key);
    const next = new URLSearchParams(searchParams);
    if (key === "details") next.delete("tab"); else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };
  const [status, setStatus] = useState<InvoiceStatus>(data.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>(data.payments);
  const [activity, setActivity] = useState<ActivityEntry[]>(data.activity);

  // Linked jobs — local state so "+ create job" can extend it on this
  // mock-backed page. An invoice can settle several jobs; zero is also valid.
  const [linkedJobs, setLinkedJobs] = useState<LinkedJobInfo[]>(() =>
    data.jobs ?? (data.jobNumber
      ? [{ jobNumber: data.jobNumber, jobName: data.jobName, serviceAddress: data.serviceAddress, linkedEstimate: data.linkedEstimate, estimateStatus: data.estimateStatus }]
      : [])
  );
  // Accordion sections start EXPANDED — the page just gets longer, and the
  // information stays in the place the user expects (no tab, no vanishing box).
  const [collapsedJobs, setCollapsedJobs] = useState<Set<string>>(new Set());
  const toggleJobSection = (num: string) => setCollapsedJobs(prev => {
    const next = new Set(prev);
    if (next.has(num)) next.delete(num); else next.add(num);
    return next;
  });

  const [notesTab, setNotesTab] = useState<NotesTabKey>("customer");

  // Collect payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(TODAY);
  const [payMethod, setPayMethod] = useState("Credit Card");
  const [payTransactionNumber, setPayTransactionNumber] = useState("");
  const [payNote, setPayNote] = useState("");
  // Card methods charge + record in ONE flow; for external methods (check,
  // Venmo, financing…) the money was already received outside the system, so
  // the user enters the transaction number + amount and it's simply recorded.
  const isCardCharge = ["Card", "Credit Card", "Debit Card"].includes(payMethod);

  // Void confirm
  const [voidConfirm, setVoidConfirm] = useState(false);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d: string) => d ? formatRegionalDate(new Date(d + "T12:00:00")) : "";

  // Calculations
  const subtotal = data.items.reduce((s: number, i: any) => s + i.qty * i.unitPrice, 0);
  const taxableAmount = data.items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + i.qty * i.unitPrice, 0);
  const taxAmount = taxableAmount * (data.taxRate / 100);
  const total = subtotal + taxAmount;
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const balance = total - totalPayments;
  const overdueDays = status === "Overdue" ? daysBetween(data.dueDate, TODAY) : 0;
  const isPaid = status === "Paid";
  // Only PAID invoices are locked financial documents — no line-item edits, no
  // adding/creating jobs (Marek, Jun 11: "paid = locked"). Void / unpaid /
  // partially paid / overdue all remain editable (Marek confirmed Void editable).
  const isLocked = status === "Paid";

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    if (newStatus === "Void") {
      setVoidConfirm(true);
      setStatusDropdownOpen(false);
      return;
    }
    setStatus(newStatus);
    setStatusDropdownOpen(false);
    setActivity(prev => [{
      id: prev.length + 1,
      date: TODAY + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      action: "Status changed",
      detail: `Manually set to ${newStatus}`,
      icon: "edit",
    }, ...prev]);
  };

  const confirmVoid = () => {
    setStatus("Void");
    setVoidConfirm(false);
    setActivity(prev => [{
      id: prev.length + 1,
      date: TODAY + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      action: "Invoice voided",
      detail: "Invoice marked as Void",
      icon: "block",
    }, ...prev]);
  };

  const handleCollectPayment = () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;

    const newPayment: Payment = {
      id: payments.length + 1,
      date: payDate,
      amount,
      method: payMethod,
      // Card charges carry the card reference; external methods carry the
      // transaction number the user typed in.
      checkNumber: isCardCharge
        ? "Visa ···· 4242"
        : (payTransactionNumber || undefined),
      note: payNote,
    };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);

    const newTotalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
    const newBalance = total - newTotalPaid;
    const newStatus: InvoiceStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
    setStatus(newStatus);

    const detail = !isCardCharge && payTransactionNumber
      ? `$${fmt(amount)} via ${payMethod} · #${payTransactionNumber}`
      : `$${fmt(amount)} via ${payMethod}`;
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    setActivity(prev => [
      {
        id: prev.length + 2,
        date: `${payDate} ${time}`,
        action: "Status changed",
        detail: `Marked as ${newStatus}`,
        icon: newStatus === "Paid" ? "check_circle" : "info",
      },
      {
        id: prev.length + 1,
        date: `${payDate} ${time}`,
        action: isCardCharge ? "Payment collected" : "Payment recorded",
        detail,
        icon: "payments",
      },
      ...prev,
    ]);

    setPaymentModalOpen(false);
    setPayAmount("");
    setPayTransactionNumber("");
    setPayNote("");
  };

  // "+" on the blank Job Details box — creates a real job from the invoice and
  // links everything up (the job carries the invoice's estimate reference).
  const createJobFromInvoice = () => {
    const base = (data.number || "").split("-")[0] || "10000";
    const prefix = `${base}-J`;
    const usedNumbers = [
      ...jobsStore.getSnapshot().filter(j => j.jobNumber.startsWith(prefix)).map(j => Number(j.jobNumber.slice(prefix.length))),
      ...linkedJobs.filter(j => j.jobNumber.startsWith(prefix)).map(j => Number(j.jobNumber.slice(prefix.length))),
    ].filter(Number.isFinite);
    const jobNumber = `${prefix}${String(Math.max(0, ...usedNumbers) + 1).padStart(2, "0")}`;
    jobsStore.add({
      jobNumber, title: "New Job", client: data.client.name, clientId: "",
      address: data.serviceAddress.line, city: data.serviceAddress.city, state: data.serviceAddress.state, zip: data.serviceAddress.zip,
      gateCode: "", assignedTo: "", jobType: "One-off", jobCategory: "Service",
      startDate: "", endDate: "", startTime: "", endTime: "",
      status: "Scheduled", totalPrice: total, notes: "", fieldNotes: "", privateNotes: "",
      taxRate: data.taxRate, estimateNumber: data.linkedEstimate || undefined,
    });
    setLinkedJobs(prev => [...prev, {
      jobNumber, jobName: "New Job",
      serviceAddress: data.serviceAddress,
      linkedEstimate: data.linkedEstimate || "",
      estimateStatus: data.estimateStatus || "",
    }]);
    toast.success(`Job ${jobNumber} created and linked to this invoice`);
  };

  const renderPaymentsTab = () => {
    // Same clean payments grid as the Client → Payments tab (Figma 1443-110747):
    // a RecordTab with status pills + per-row kebab, replacing the old bespoke
    // "Payment terms / Accept partial payments / totals" block. The invoice header
    // already shows Total + Balance Due, so no totals footer is needed here.
    const payStatusStyle: Record<string, { color: string; backgroundColor: string }> = {
      Completed: { color: "#16A34A", backgroundColor: "rgba(22,163,74,0.15)" },
      Pending:   { color: "#D97706", backgroundColor: "rgba(217,119,6,0.15)" },
      Refunded:  { color: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.15)" },
    };
    const rows = payments.map((p: any) => ({
      id: p.id,
      payNo: `P-${String(p.id).padStart(4, "0")}`,
      date: fmtDate(p.date),
      method: p.method,
      status: p.status || "Completed",
      note: p.note || "",
      amount: `$${fmt(p.amount)}`,
    }));
    type Row = (typeof rows)[number];
    const cols: RecordColumn<Row>[] = [
      { key: "payNo",  label: "Payment", render: (r) => <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{r.payNo}</span> },
      { key: "date",   label: "Date",    render: (r) => <span className="text-[#1A2332]">{r.date}</span> },
      { key: "method", label: "Method",  render: (r) => <span className="text-[#1A2332]">{r.method}</span> },
      { key: "status", label: "Status",  render: (r) => { const s = payStatusStyle[r.status] || payStatusStyle.Completed; return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px] whitespace-nowrap" style={{ fontWeight: 500, ...s }}>{r.status}</span>; } },
      { key: "note",   label: "Note",    render: (r) => <span className="text-[#6B7280]">{r.note || "—"}</span> },
      { key: "amount", label: "Amount",  align: "right", render: (r) => <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{r.amount}</span> },
    ];
    // The blue "+" Collect-payment shows in every state except Paid (Marek):
    // a fully-paid invoice has nothing left to collect.
    const canCollect = !isPaid;
    const goToPayment = (r: Row) => navigate(`/payments/${r.id}?returnTo=${encodeURIComponent(`/invoices/${id}?tab=payments`)}`);
    return (
      <RecordTab<Row>
        rows={rows}
        columns={cols}
        emptyIcon="account_balance_wallet"
        emptyTitle="No payments yet"
        emptySubtitle="Collect a payment to record it against this invoice"
        searchPlaceholder="Search payments…"
        searchMatch={(r, q) => [r.payNo, r.method, r.status, r.note].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))}
        filters={[
          { key: "status", label: "Status", options: [
            { value: "", label: "All" }, { value: "Completed", label: "Completed" }, { value: "Pending", label: "Pending" }, { value: "Refunded", label: "Refunded" },
          ], match: (r, v) => r.status === v },
        ]}
        createLabel={canCollect ? "Collect payment" : undefined}
        onCreate={canCollect ? () => setPaymentModalOpen(true) : undefined}
        onRowClick={goToPayment}
        rowActions={(r) => [
          { label: "View payment", icon: "visibility", onClick: () => goToPayment(r) },
          { label: "Send receipt", icon: "send", onClick: () => toast.success(`Receipt for ${r.payNo} sent`) },
        ] as RecordAction<Row>[]}
      />
    );
  };

  // Per-job accordion sections — shared by the single-job details box and the
  // multi-job Jobs tab (Marek Jun 9: >1 job → the box disappears, jobs live in a tab).
  const renderJobSections = () => (
    <div>
      {linkedJobs.map(job => {
        const collapsed = collapsedJobs.has(job.jobNumber);
        return (
          <div key={job.jobNumber} className="border-b border-[#F3F4F6] last:border-b-0">
            <div
              className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#FAFBFC] transition-colors"
              onClick={() => toggleJobSection(job.jobNumber)}
            >
              <div className="min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.jobNumber}`); }}
                  className="text-[13px] text-[#4A6FA5] hover:underline text-left"
                  style={{ fontWeight: 600 }}
                >
                  {job.jobNumber}
                </button>
                <div className="text-[12px] text-[#374151] truncate">{job.jobName}</div>
              </div>
              <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "20px" }}>
                {collapsed ? "expand_more" : "expand_less"}
              </span>
            </div>
            {!collapsed && (
              <div className="px-4 pb-3 flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] text-[#9CA3AF]">Service Address</div>
                  <span className="text-[13px] text-[#374151] leading-[19px]">
                    {job.serviceAddress.line}<br />
                    {job.serviceAddress.city}, {job.serviceAddress.state} {job.serviceAddress.zip}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] text-[#9CA3AF]">Linked Estimate #</div>
                  {job.linkedEstimate ? (
                    <button onClick={() => navigate(`/estimates/${job.linkedEstimate}`)} className="text-[13px] text-[#4A6FA5] hover:underline text-left" style={{ fontWeight: 500 }}>
                      {job.linkedEstimate}
                    </button>
                  ) : (
                    <span className="text-[13px] text-[#9CA3AF]">—</span>
                  )}
                </div>
                {job.estimateStatus && (
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-[#9CA3AF]">Estimate Status</div>
                    <span className="text-[13px] text-[#374151]">{job.estimateStatus}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Jobs tab — only shown when the invoice settles MORE THAN ONE job.
  const renderJobsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden max-w-[640px]">
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs ({linkedJobs.length})</h3>
      </div>
      {renderJobSections()}
    </div>
  );

  const panelHandle = (
    <ResizableHandle withHandle className="mx-2 w-1 rounded-full bg-transparent transition-colors hover:bg-[#D8DEE8] data-[resize-handle-active]:bg-[#C5D5EC] after:w-3" />
  );

  const renderDetailsTab = () => (
    <ResizablePanelGroup direction="horizontal" className="min-h-[420px] items-stretch">

      {/* ── Left/main: Items list with totals ── */}
      <ResizablePanel defaultSize={44} minSize={28} className="min-w-0">
      <div className="h-full flex flex-col bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
            Items list{isLocked && <span className="ml-2 align-middle text-[11px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>· Locked</span>}
          </h3>
          {/* Same quiet icon-plus as the estimate detail line-items header.
              Hidden on a locked (Paid/Void) invoice — it's a closed financial doc. */}
          {!isLocked && (
            <button
              onClick={() => {}}
              aria-label="Add item"
              title="Add item"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#4A6FA5] hover:bg-[#EEF3FA] transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Item</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[80px]" style={{ fontWeight: 600 }}>Qty</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[120px]" style={{ fontWeight: 600 }}>Unit Price</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[120px]" style={{ fontWeight: 600 }}>Amount</th>
                <th className="px-3 py-2.5 w-[48px]" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#FAFBFC]">
                  <td className="px-5 py-3">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                    <div className="text-[12px] text-[#9CA3AF] mt-0.5">{item.description}</div>
                    {item.taxable && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#16A34A] mt-1 inline-block" style={{ fontWeight: 600 }}>
                        Taxable
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{item.qty}</td>
                  <td className="px-3 py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(item.qty * item.unitPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    {/* Remove-item is hidden on a locked (Paid/Void) invoice — it's a
                        closed financial doc, no line-item editing (Marek, Jun 11). */}
                    {!isLocked && (
                      <button className="w-7 h-7 rounded text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center transition-colors" title="Remove item">
                        <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4 flex justify-end">
          <div className="w-full max-w-[360px]">
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Taxable amount</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Tax ({data.taxRate}%)</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
            </div>
            <div className="flex justify-between py-2 mt-1 border-t border-[#E5E7EB] text-[14px]">
              <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
              <span className="text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
            </div>
            {totalPayments > 0 && (
              <div className="flex justify-between py-1 text-[13px]">
                <span className="text-[#16A34A]">Payments received</span>
                <span className="text-[#16A34A]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt(totalPayments)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-[#E5E7EB]">
              <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Balance Due</span>
              <span className="text-[20px]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: balance > 0 ? "#DC2626" : "#16A34A" }}>
                ${fmt(Math.max(0, balance))}
              </span>
            </div>
          </div>
        </div>
      </div>
      </ResizablePanel>

      {panelHandle}

      {/* ── Right side: Job Details + Notes (side by side) ── */}
      {/* Job Details — one accordion section per linked job, all expanded by
          default (the page gets longer, that's fine). The box stays in the same
          place whatever the job count, so nothing "disappears" on the user. */}
      <ResizablePanel defaultSize={28} minSize={18} className="min-w-0">
        <div className="h-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* ≤1 job: full Job Details box. >1 job (Marek Jun 9): this box
              disappears — the jobs move to the dedicated Jobs tab; only Memo stays. */}
          {linkedJobs.length <= 1 && (
            <>
              <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Details</h3>
                {!isLocked && (
                  <button onClick={() => navigate(`/invoices/${id}/edit`)} className="w-7 h-7 rounded text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] flex items-center justify-center transition-colors" title="Edit job details">
                    <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                  </button>
                )}
              </div>
              {linkedJobs.length === 0 ? (
                /* Blank state — a "+" to create a job (only while the invoice is unlocked). */
                <div className="px-4 py-8 flex flex-col items-center text-center gap-2">
                  <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "30px" }}>work_outline</span>
                  <div className="text-[13px] text-[#9CA3AF]">No job linked to this invoice</div>
                  {!isLocked && (
                    <button
                      onClick={createJobFromInvoice}
                      aria-label="Create job from this invoice"
                      title="Create a job from this invoice"
                      className="mt-1 w-9 h-9 rounded-full bg-[#EEF3FA] text-[#4A6FA5] hover:bg-[#DCE6F5] flex items-center justify-center transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                renderJobSections()
              )}
            </>
          )}
          {linkedJobs.length > 1 && (
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Note</h3>
              <button onClick={() => setActiveTab("jobs")} className="text-[12px] text-[#4A6FA5] hover:underline">View {linkedJobs.length} jobs →</button>
            </div>
          )}

          {/* Invoice-level memo lives outside the per-job sections. */}
          <div className="px-4 py-3 border-t border-[#F3F4F6] flex flex-col gap-0.5">
            <div className="text-[11px] text-[#9CA3AF]">Note</div>
            <span className="text-[13px] text-[#374151] leading-[19px]">{data.memo || <span className="text-[#9CA3AF]">—</span>}</span>
          </div>
        </div>
      </ResizablePanel>

      {panelHandle}

      {/* Notes (Note to Client / Internal) */}
      <ResizablePanel defaultSize={28} minSize={18} className="min-w-0">
        <div className="h-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex border-b border-[#E5E7EB] px-4">
            {([
              { key: "customer" as NotesTabKey, label: "Note to Client" },
              { key: "internal" as NotesTabKey, label: "Internal" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setNotesTab(key)}
                className={`relative py-3 px-1 mr-4 text-[13px] transition-colors ${
                  notesTab === key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
                }`}
                style={{ fontWeight: notesTab === key ? 600 : 500 }}
              >
                {label}
                {notesTab === key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#4A6FA5] rounded-full" />}
              </button>
            ))}
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            {notesTab === "customer" ? (
              <>
                {data.noteToCustomer ? (
                  <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[13px] text-[#1A2332] leading-[19px]">
                    {data.noteToCustomer}
                  </div>
                ) : (
                  <div className="text-[12px] text-[#9CA3AF] py-2">No note yet.</div>
                )}
                <button className="self-start inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "14px" }}>{data.noteToCustomer ? "edit" : "add"}</span>
                  {data.noteToCustomer ? "Edit note" : "Add note"}
                </button>
              </>
            ) : (
              <>
                {data.notes ? (
                  <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[13px] text-[#1A2332] leading-[19px]">
                    {data.notes}
                  </div>
                ) : (
                  <div className="text-[12px] text-[#9CA3AF] py-2">No internal note yet.</div>
                )}
                <button className="self-start inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add note
                </button>
              </>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <h3 className="text-[14px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Activity Log</h3>
      <div className="px-1">
        {activity.map((entry, idx) => (
          <div key={entry.id} className="flex gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>{entry.icon}</span>
              </div>
              {idx < activity.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] mt-1" />}
            </div>
            <div className="pb-4">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{entry.action}</div>
              <div className="text-[12px] text-[#6B7280]">{entry.detail}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{entry.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── PAGE HEADER (back arrow + actions on gray, outside the white card) ── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/invoices")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Invoices
        </button>
      </div>

      {/* ── White card containing header + tabs + content ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
            {/* Left: name + contact info */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontWeight: 600 }}>
                  Invoice
                </h2>
                <span className="text-[16px] text-[#6B7280] leading-[24px]" style={{ fontWeight: 400 }}>
                  ({data.number})
                </span>
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] hover:opacity-80 transition-opacity"
                    style={{ fontWeight: 600, backgroundColor: statusColors[status].bg, color: statusColors[status].text }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[status].text }} />
                    {status}
                    <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
                      {allStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                          style={{ fontWeight: s === status ? 600 : 400, color: s === status ? "#4A6FA5" : "#1A2332" }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s].text }} />
                          {s}
                          {s === status && <span className="material-icons ml-auto" style={{ fontSize: "16px", color: "#4A6FA5" }}>check</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Client + address + job inline row */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button onClick={() => navigate("/clients/1")} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>person</span>
                  {data.client.name}
                </button>
                {data.client.phone && (
                  <a href={`tel:${data.client.phone}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors ml-0.5" title={data.client.phone}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                  </a>
                )}
                {data.client.email && (
                  <a href={`mailto:${data.client.email}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors" title={data.client.email}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>mail</span>
                  </a>
                )}
                <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                <span className="flex items-center gap-1 text-[14px] text-[#374151]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>location_on</span>
                  {data.billingAddress.line}, {data.billingAddress.city}, {data.billingAddress.state} {data.billingAddress.zip}
                </span>
                {linkedJobs.length > 0 && (
                  <>
                    <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                    <button
                      onClick={() => navigate(`/jobs/${linkedJobs[0].jobNumber}`)}
                      className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors"
                      style={{ fontWeight: 500 }}
                      title={linkedJobs.map(j => j.jobNumber).join(", ")}
                    >
                      <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
                      {linkedJobs.length === 1 ? linkedJobs[0].jobName : `${linkedJobs.length} jobs`}
                    </button>
                  </>
                )}
              </div>

              {/* Metadata strip */}
              <div className="flex items-center gap-0.5 flex-wrap pt-2 mt-1 border-t border-[#F3F4F6]">
                <div className="flex items-center gap-1.5 pr-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>calendar_today</span>
                  Created {fmtDate(data.dateCreated)}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px]" style={{ color: overdueDays > 0 ? "#DC2626" : "#6B7280", fontWeight: overdueDays > 0 ? 500 : 400 }}>
                  <span className="material-icons" style={{ fontSize: "14px" }}>schedule</span>
                  Due {fmtDate(data.dueDate)}{overdueDays > 0 ? ` · ${overdueDays}d past` : ""}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>person</span>
                  {data.createdBy}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>mail</span>
                  Sent {fmtDate(data.dateSent)}
                </div>
              </div>
            </div>

            {/* Right: KPI strip — Client-style (borderless, dark value, tinted icon) */}
            <div className="flex items-center gap-4 shrink-0">
              {[
                { label: "Total (USD)",  value: `$${fmt(total)}`,                    icon: "receipt", iconColor: "#4A6FA5" },
                { label: "Balance Due",  value: `$${fmt(Math.max(0, balance))}`,     icon: "paid",    iconColor: balance > 0 ? "#DC2626" : "#16A34A" },
              ].map(({ label, value, icon, iconColor }, i) => (
                <div key={label} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-6 bg-[#E5E7EB] shrink-0" />}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="text-[18px] leading-none tabular-nums text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 600 }}>{value}</div>
                      <div className="text-[14px] leading-[20px] text-[#6B7280] mt-1 whitespace-nowrap">{label}</div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}26` }}>
                      <span className="material-icons" style={{ fontSize: "20px", color: iconColor }}>{icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Divider separating the invoice header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        <DetailTabs
          tabs={TABS
            // The Jobs tab only appears when the invoice settles MORE THAN ONE job
            // (Marek Jun 9). With ≤1 job the single Job Details box covers it.
            .filter(t => t.key !== "jobs" || linkedJobs.length > 1)
            .map(t => ({
              ...t,
              count: t.key === "activity" ? activity.length : t.key === "payments" ? payments.length : t.key === "jobs" ? linkedJobs.length : undefined,
            }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton />}
          trailing={
            <>
            {!isPaid && status !== "Void" && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="h-9 px-3.5 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontWeight: 600 }}
              title="Record a payment for this invoice"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>payments</span>
              Collect Payment
            </button>
            )}
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md bg-white flex items-center justify-center hover:bg-[#F5F7FA]">
              <KebabItem icon="visibility">Preview</KebabItem>
              <KebabItem icon="send">Send</KebabItem>
              <KebabItem icon="file_download">Download</KebabItem>
              <KebabSeparator />
              <KebabItem icon="block" onClick={() => setVoidConfirm(true)}>Void Invoice</KebabItem>
              <KebabItem icon="archive" destructive>Archive Invoice</KebabItem>
            </KebabMenu>
            </>
          }
          className="mt-5"
        />

        {/* ── CONTENT ── */}
        <div className="mt-4">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "jobs" && renderJobsTab()}
          {activeTab === "payments" && renderPaymentsTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>
      </div>

      {/* Collect Payment Modal — card methods charge + record in one flow;
          external methods (check / Venmo / financing) record money already
          received outside the system. */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPaymentModalOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>{isCardCharge ? "Collect payment" : "Record payment"}</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "22px" }}>close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-[#EBF0F8] rounded-lg p-4 flex items-center justify-between">
                <span className="text-[13px] text-[#6B7280]">Balance due</span>
                <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(Math.max(0, balance))}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280]" style={{ fontWeight: 600 }}>Amount</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount((balance / 2).toFixed(2))}
                      className="text-[11px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      50%
                    </button>
                    <span className="text-[#D1D5DB]">·</span>
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.max(0, balance).toFixed(2))}
                      className="text-[11px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      Full balance
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-[14px]">$</span>
                  <input
                    type="number" min="0" step="0.01" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={fmt(Math.max(0, balance))}
                    className="w-full h-11 pl-7 pr-4 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
                {(() => {
                  const entered = parseFloat(payAmount);
                  if (!entered || entered <= 0) return null;
                  const remaining = balance - entered;
                  if (remaining > 0) {
                    return (
                      <div className="mt-1.5 text-[11px] text-[#D97706] flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: "13px" }}>info</span>
                        Partial payment — ${fmt(remaining)} will remain
                      </div>
                    );
                  }
                  if (remaining < 0) {
                    return (
                      <div className="mt-1.5 text-[11px] text-[#DC2626] flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: "13px" }}>warning</span>
                        Exceeds balance by ${fmt(-remaining)}
                      </div>
                    );
                  }
                  return (
                    <div className="mt-1.5 text-[11px] text-[#16A34A] flex items-center gap-1">
                      <span className="material-icons" style={{ fontSize: "13px" }}>check_circle</span>
                      Pays the invoice in full
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Date</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5] bg-white">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {isCardCharge ? (
                /* Card charge — the card is charged and the payment is recorded
                   in one flow. No file uploads here. */
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>credit_card</span>
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Visa ···· 4242</span>
                  <span className="material-icons text-[#16A34A] ml-auto" title="Verified card on file" style={{ fontSize: "16px" }}>verified</span>
                </div>
              ) : (
                /* Money already received outside the system — enter the
                   transaction number and the payment is recorded. */
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Transaction number</label>
                  <input type="text" value={payTransactionNumber} onChange={(e) => setPayTransactionNumber(e.target.value)}
                    placeholder="e.g. check #, Venmo confirmation, financing ref…"
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              )}

              <div>
                <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Note (optional)</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFBFC] flex items-center justify-end gap-3">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] hover:bg-[#F3F4F6]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleCollectPayment}
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] disabled:opacity-40"
                style={{ fontWeight: 600 }}
              >
                {isCardCharge ? "Collect payment" : "Record payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirm */}
      {voidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setVoidConfirm(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>block</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Void Invoice?</h3>
            </div>
            <p className="text-[14px] text-[#6B7280] mb-6">
              This will mark the invoice as void. It will no longer be counted in reports or balances. This action cannot be easily reversed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setVoidConfirm(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] hover:bg-[#F3F4F6]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmVoid} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Void Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
