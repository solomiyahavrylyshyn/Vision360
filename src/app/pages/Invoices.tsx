import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus =
  | "Unpaid"
  | "Unpaid - Overdue"
  | "Unpaid - Not Due"
  | "Paid"
  | "Paid - Deposited"
  | "Paid - Not Deposited"
  | "Void";

type InvoiceType = "Standard" | "Recurring" | "Progress" | "Final" | "Credit Memo";

interface Invoice {
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

const statusColors: Record<InvoiceStatus, { text: string; bg: string }> = {
  "Unpaid":               { text: "#546478", bg: "#F3F4F6" },
  "Unpaid - Not Due":     { text: "#3B82F6", bg: "#DBEAFE" },
  "Unpaid - Overdue":     { text: "#EF4444", bg: "#FEE2E2" },
  "Paid":                 { text: "#22C55E", bg: "#DCFCE7" },
  "Paid - Deposited":     { text: "#15803D", bg: "#DCFCE7" },
  "Paid - Not Deposited": { text: "#F59E0B", bg: "#FEF3C7" },
  "Void":                 { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = [
  "Unpaid",
  "Unpaid - Not Due",
  "Unpaid - Overdue",
  "Paid",
  "Paid - Deposited",
  "Paid - Not Deposited",
  "Void",
];

const timeFilters = [
  "All time", "Today", "Yesterday", "Last 7 days", "Last 30 days",
  "This month", "Last month", "This year", "Last year",
];

// Days between two YYYY-MM-DD dates (b - a, positive when b is after a)
function daysBetween(a: string, b: string) {
  const da = new Date(a + "T12:00:00").getTime();
  const db = new Date(b + "T12:00:00").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

// "today" used for past-due calc — keeps mock data deterministic
const TODAY = "2026-04-27";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const initialInvoices: Invoice[] = [
  {
    id: 1, number: "10245-I01", type: "Standard", date: "2026-03-02",
    status: "Paid - Deposited",
    clientName: "Travis Jones", customerEmail: "travis.j@email.com", phone: "(512) 555-0142",
    jobNumber: "10245", jobName: "Kitchen Renovation",
    total: 10502.00, balance: 0,
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
    status: "Unpaid - Overdue",
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
    id: 3, number: "10250-I01", type: "Standard", date: "2026-03-25",
    status: "Unpaid",
    clientName: "John Doe", customerEmail: "john.d@email.com", phone: "(214) 555-0188",
    jobNumber: "10250", jobName: "HVAC Install",
    total: 1250.00, balance: 1250.00,
    linkedEstimate: "EST-007", poNumber: "", memo: "",
    billingAddress: "789 Oak Ave", billingCity: "Dallas", billingCounty: "Dallas", billingState: "TX", billingZip: "75201",
    serviceAddress: "789 Oak Ave", serviceCity: "Dallas", serviceCounty: "Dallas", serviceState: "TX", serviceZip: "75201",
    leadSource: "Repeat Customer", salesRep: "Marek Stroz",
    estimateStatus: "Approved", paymentTerms: "Net 30",
    checkNumber: "", paymentMethod: "",
    dueDate: "2026-04-24", department: "Field Service", toBePrinted: true,
    dateCreated: "2026-03-25", createdBy: "Marek Stroz", stage: "Draft",
    customField1: "", customField2: "",
    noteToCustomer: "", dateSent: "",
  },
  {
    id: 4, number: "10248-I02", type: "Progress", date: "2026-02-28",
    status: "Paid - Not Deposited",
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
    status: "Unpaid - Not Due",
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
    status: "Paid - Deposited",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");

  // Quick filters
  const [qfStatus, setQfStatus] = useState<string>("All");
  const [qfDate, setQfDate] = useState("All time");
  const [qfBalance, setQfBalance] = useState("All");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const perPage = 10;


  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Summary cards
  const summary = useMemo(() => {
    const unpaid = invoices.filter(i => i.status === "Unpaid" || i.status === "Unpaid - Not Due");
    const overdue = invoices.filter(i => i.status === "Unpaid - Overdue");
    const paid = invoices.filter(i => i.status === "Paid" || i.status === "Paid - Deposited" || i.status === "Paid - Not Deposited");
    const notDeposited = invoices.filter(i => i.status === "Paid - Not Deposited");
    const voided = invoices.filter(i => i.status === "Void");
    return {
      unpaid: { count: unpaid.length, total: unpaid.reduce((s, i) => s + i.balance, 0) },
      overdue: { count: overdue.length, total: overdue.reduce((s, i) => s + i.balance, 0) },
      paid: { count: paid.length, total: paid.reduce((s, i) => s + i.total, 0) },
      notDeposited: { count: notDeposited.length, total: notDeposited.reduce((s, i) => s + i.total, 0) },
      voided: { count: voided.length },
    };
  }, [invoices]);

  // Filter
  const filtered = useMemo(() => {
    let result = [...invoices];
    if (qfStatus !== "All") {
      // Group filters
      if (qfStatus === "Unpaid (all)") {
        result = result.filter(i => i.status === "Unpaid" || i.status === "Unpaid - Not Due" || i.status === "Unpaid - Overdue");
      } else if (qfStatus === "Paid (all)") {
        result = result.filter(i => i.status === "Paid" || i.status === "Paid - Deposited" || i.status === "Paid - Not Deposited");
      } else {
        result = result.filter(i => i.status === qfStatus);
      }
    }
    if (qfBalance === "With Balance") result = result.filter(i => i.balance > 0);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.number.toLowerCase().includes(q) ||
        i.clientName.toLowerCase().includes(q) ||
        i.customerEmail.toLowerCase().includes(q) ||
        i.jobNumber.toLowerCase().includes(q) ||
        i.jobName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [invoices, qfStatus, qfBalance, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const allSelected = paginated.length > 0 && paginated.every(i => selectedIds.has(i.id));

  const handleBulkDelete = () => {
    setInvoices(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setDeleteConfirm(false);
  };

  const summaryCards: { label: string; value: string; sub: string; filterVal: string; color: string }[] = [
    { label: "Unpaid",         value: `$${fmt(summary.unpaid.total)}`,       sub: `${summary.unpaid.count} invoices`,       filterVal: "Unpaid (all)",         color: "#3B82F6" },
    { label: "Overdue",        value: `$${fmt(summary.overdue.total)}`,      sub: `${summary.overdue.count} invoices`,      filterVal: "Unpaid - Overdue",     color: "#EF4444" },
    { label: "Paid",           value: `$${fmt(summary.paid.total)}`,         sub: `${summary.paid.count} invoices`,         filterVal: "Paid (all)",           color: "#22C55E" },
    { label: "Not Deposited",  value: `$${fmt(summary.notDeposited.total)}`, sub: `${summary.notDeposited.count} invoices`, filterVal: "Paid - Not Deposited", color: "#F59E0B" },
    { label: "Void",           value: `${summary.voided.count}`,             sub: "invoices",                                filterVal: "Void",                 color: "#9CA3AF" },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Invoices"
        count={selectedIds.size > 0 ? `${filtered.length} records · ${selectedIds.size} selected` : `${filtered.length} records`}
        actions={
          <>
            <button
              onClick={() => navigate("/invoices/new")}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              Create Invoice
            </button>
            <KebabMenu triggerClassName="w-9 h-9 border border-[#DDE3EE] rounded-lg bg-white">
              <KebabItem icon="view_column">Edit Columns</KebabItem>
              <KebabItem icon="swap_horiz">Change Status</KebabItem>
              <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
              <KebabSeparator />
              {selectedIds.size > 0 && <>
                <KebabItem icon="deselect" onClick={() => setSelectedIds(new Set())}>Deselect All</KebabItem>
                <KebabItem icon="archive" destructive onClick={() => setDeleteConfirm(true)}>Archive Selected</KebabItem>
                <KebabSeparator />
              </>}
              <KebabItem icon="file_upload">Import</KebabItem>
              <KebabItem icon="file_download">Export</KebabItem>
            </KebabMenu>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-5 mb-8">
        {summaryCards.map(c => (
          <Card
            key={c.label}
            onClick={() => { setQfStatus(qfStatus === c.filterVal ? "All" : c.filterVal); setPage(1); }}
            className={`px-4 py-3 border bg-white hover:shadow-sm transition-shadow h-[110.5px] cursor-pointer ${qfStatus === c.filterVal ? "border-[#4A6FA5] ring-1 ring-[#4A6FA5]/20" : "border-[#DDE3EE]"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332", fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="text-[12px]" style={{ fontWeight: 500, color: "#546478" }}>{c.label}</div>
                </div>
                <div className="text-[11px] text-[#546478]">{c.sub}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#DDE3EE]">
          <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>{filtered.length} results</span>
          <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
          <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
            <option value="All">All statuses</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "All time")}>
            {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={qfBalance} onChange={e => { setQfBalance(e.target.value); setPage(1); }} className={qfClass(qfBalance !== "All")}>
            <option value="All">All invoices</option>
            <option value="With Balance">With balance</option>
          </select>
          <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
          <button className="h-8 px-3 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5 bg-white" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>tune</span>
            Filter
          </button>
          <div className="flex-1" />
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-[260px] h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
          </div>
        </div>
        <SelectionBar
          count={selectedIds.size}
          onDeselect={() => setSelectedIds(new Set())}
          onDelete={() => {
            if (confirm(`Delete ${selectedIds.size} invoice(s)?`)) {
              handleBulkDelete();
            }
          }}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginated.map(i => i.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
                </th>
                {["Number", "Type", "Date", "Client", "Job", "Status", "Total", "Balance", "Due Date"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>receipt</span>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No invoices found</div>
                    <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters or create a new invoice</div>
                  </td>
                </tr>
              ) : paginated.map((inv, idx) => {
                const overdueDays = inv.status === "Unpaid - Overdue" ? daysBetween(inv.dueDate, TODAY) : 0;
                return (
                <tr
                  key={inv.id}
                  className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer ${selectedIds.has(inv.id) ? "bg-[#EBF0F8]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(inv.id)}
                      onChange={(e) => {
                        const s = new Set(selectedIds);
                        e.target.checked ? s.add(inv.id) : s.delete(inv.id);
                        setSelectedIds(s);
                      }}
                      className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#4A6FA5] whitespace-nowrap" style={{ fontWeight: 600 }}>{inv.number}</td>
                  <td className="px-3 py-3 text-[13px] text-[#546478] whitespace-nowrap">{inv.type}</td>
                  <td className="px-3 py-3 text-[13px] text-[#546478] whitespace-nowrap">{fmtDate(inv.date)}</td>
                  <td className="px-3 py-3">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{inv.clientName}</div>
                    <div className="text-[12px] text-[#8899AA]">{inv.customerEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{inv.jobNumber}</div>
                    <div className="text-[12px] text-[#8899AA]">{inv.jobName}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <span className="px-2.5 py-1 rounded-full text-[12px]"
                      style={{ fontWeight: 600, color: statusColors[inv.status].text, backgroundColor: statusColors[inv.status].bg }}>
                      {inv.status}
                    </span>
                    {overdueDays > 0 && (
                      <div className="text-[11px] text-[#EF4444] mt-0.5" style={{ fontWeight: 500 }}>Past due {overdueDays} days</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(inv.total)}</td>
                  <td className="px-3 py-3 text-[13px] whitespace-nowrap" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    <span className={inv.balance > 0 ? "text-[#EF4444]" : "text-[#22C55E]"}>${fmt(inv.balance)}</span>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#546478] whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <span className="text-[13px] text-[#546478]">
            Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <span className="text-[13px] text-[#1A2332] min-w-[80px] text-center" style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>warning</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Archive invoices?</h3>
            </div>
            <p className="text-[14px] text-[#546478] mb-6">
              Archive {selectedIds.size} invoice(s)? They can be restored later.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
