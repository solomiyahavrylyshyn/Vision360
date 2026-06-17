import { useState, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";
import { AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { paymentsStore } from "../stores/paymentsStore";
import { PAYMENT_METHODS, paymentMethodIcon } from "../constants/paymentMethods";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
// PaymentMethod is loose (string) so legacy seed values (e.g. "ACH") still
// render; the canonical options come from PAYMENT_METHODS.
export type PaymentMethod = string;
export type PaymentStatus = "Completed" | "Pending" | "Refunded";

export interface Payment {
  id: number;
  date: string;
  amount: number;
  // Outstanding balance on the linked invoice after this payment. Filter-only
  // (no column) — mirrors the Invoices "Balance" advanced filter for parity.
  balance?: number;
  method: PaymentMethod;
  status: PaymentStatus;
  clientName: string;
  clientEmail: string;
  invoiceId: number;
  invoiceNumber: string;
  jobId?: string;
  // Reference number for external/non-integrated methods (check #, transfer ID,
  // Venmo/Zelle/Cash App confirmation, financing reference).
  reference?: string;
  note: string;
  createdBy: string;
  createdAt: string;
  // Refund details (Marek, Jun 11): a refund records a memo (purpose), a MANUAL
  // amount (full or partial), and how it was returned (cash record vs through the
  // system / Stripe). Present once a refund has been issued against this payment.
  refundAmount?: number;
  refundMemo?: string;
  refundMethod?: "Cash / manual" | "Original payment method";
  refundDate?: string;
}

// Figma badges: semantic-token text colour + the same colour at 15% as bg.
// Completed = success, Pending = warning, Refunded = purple.
export const paymentStatusColors: Record<PaymentStatus, { text: string; bg: string }> = {
  Completed: { text: "#16A34A", bg: "rgba(22,163,74,0.15)" },
  Pending: { text: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  Refunded: { text: "#A856F7", bg: "rgba(168,86,247,0.15)" },
};
const statusColors = paymentStatusColors;

// Re-exported for any consumers that imported the old name; backed by the
// shared canonical icon helper.
export const paymentMethodIcons = new Proxy({}, { get: (_t, k) => paymentMethodIcon(String(k)) }) as Record<string, string>;
// (payment-method icons removed from the table per Figma — method shows as text)

const timeFilters = [
  "All time", "Today", "Yesterday", "Last 7 days", "Last 30 days",
  "This month", "Last month", "This year", "Last year",
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const mockPayments: Payment[] = [
  { id: 1, date: "2026-03-10", amount: 5000.00, balance: 0, method: "Bank transfer", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "First installment", createdBy: "Marek Stroz", createdAt: "2026-03-10 14:22" },
  { id: 2, date: "2026-03-25", amount: 5502.00, balance: 0, method: "Check", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Final payment", createdBy: "Marek Stroz", createdAt: "2026-03-25 11:45" },
  { id: 3, date: "2026-03-15", amount: 1000.00, balance: 1365.00, method: "Credit Card", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 4, invoiceNumber: "10248-I02", jobId: "10248-J01", note: "Partial payment", createdBy: "Marek Stroz", createdAt: "2026-03-15 13:30" },
  { id: 4, date: "2026-04-01", amount: 913.75, balance: 913.75, method: "Check", status: "Pending", clientName: "Mike Rodriguez", clientEmail: "mike.r@email.com", invoiceId: 5, invoiceNumber: "10247-I01", jobId: "10247-J01", note: "", createdBy: "Marek Stroz", createdAt: "2026-04-01 09:15" },
  { id: 5, date: "2026-02-21", amount: 326.25, balance: 0, method: "Cash", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 6, invoiceNumber: "10249-I01", jobId: "10249-J01", note: "Paid in full", createdBy: "Marek Stroz", createdAt: "2026-02-21 16:00" },
  { id: 6, date: "2026-03-28", amount: 200.00, balance: 0, method: "Credit Card", status: "Refunded", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Partial refund — overcharge adjustment", createdBy: "Marek Stroz", createdAt: "2026-03-28 10:20" },
  { id: 7, date: "2026-04-03", amount: 2800.00, balance: 2700.00, method: "Bank transfer", status: "Completed", clientName: "John Doe", clientEmail: "john.d@email.com", invoiceId: 2, invoiceNumber: "10246-I01", jobId: "10246-J01", note: "Partial payment on overdue invoice", createdBy: "Marek Stroz", createdAt: "2026-04-03 11:00" },
];

// Column order: Number · Client · Invoice · Method · Status · Total · Note ·
// Estimate · Job · Payment date (the last three per Marek's Jun 11 call; the
// Figma edit-columns dialog already offers them). No Time / Due / Expiry —
// a payment simply doesn't have them.
const PAYMENTS_COLS = [
  { key: "number", label: "Number" },
  { key: "client", label: "Client" },
  { key: "invoice", label: "Invoice" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
  { key: "note", label: "Note" },
  { key: "estimates", label: "Estimate" },
  { key: "jobs", label: "Job" },
  { key: "paymentDate", label: "Payment date" },
] as const;

// Proportional column widths (%) applied via <colgroup> with table-fixed:
// columns stay uniform across rows AND the table always fits its container
// (responsive — no horizontal scroll at any width). Note gets the widest share
// and truncates. Data columns sum to 90%; checkbox 4% + actions 6% = 100%.
const COL_PCT: Record<string, string> = {
  number: "8%", client: "11%", invoice: "9%", method: "9%", status: "8%", total: "7%", note: "10%",
  estimates: "10%", jobs: "9%", paymentDate: "9%",
};

// Columns offered in the "Edit columns" picker. "number" is locked-on (always shown).
const PAYMENT_TOGGLE_COLS = ["client", "invoice", "method", "status", "total", "note", "estimates", "jobs", "paymentDate"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

function matchesDatePreset(date: string, preset: string) {
  if (preset === "All time") return true;
  if (preset === "Today") return date === "2026-04-27";
  if (preset === "Yesterday") return date === "2026-04-26";
  if (preset === "Last 7 days") return date >= "2026-04-21" && date <= "2026-04-27";
  if (preset === "Last 30 days") return date >= "2026-03-29" && date <= "2026-04-27";
  if (preset === "This month") return date >= "2026-04-01" && date <= "2026-04-30";
  if (preset === "Last month") return date >= "2026-03-01" && date <= "2026-03-31";
  if (preset === "This year") return date >= "2026-01-01" && date <= "2026-12-31";
  if (preset === "Last year") return date >= "2025-01-01" && date <= "2025-12-31";
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
export function Payments() {
  const navigate = useNavigate();
  const [cols, moveCol] = useDraggableColumns([...PAYMENTS_COLS]);
  const payments = useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getSnapshot);
  const [search, setSearch] = useState("");

  // Quick filters
  const [qfStatus, setQfStatus] = useState("All");
  const [qfDate, setQfDate] = useState("All time");
  const [qfMethod, setQfMethod] = useState("All");
  // Advanced filters — exactly the Jun 11 set: Total (from–to), Client (one or
  // many), Invoice (by number, many), Methods (many), Statuses (one or many).
  // No date range (the quick Date filter covers time), no job/created-by/balance.
  const [filterOpen, setFilterOpen] = useState(false);
  const [totalMin, setTotalMin] = useState("");
  const [totalMax, setTotalMax] = useState("");
  const [clientsFilter, setClientsFilter] = useState<string[]>([]);
  const [invoicesFilter, setInvoicesFilter] = useState<string[]>([]);
  const [methodsFilter, setMethodsFilter] = useState<string[]>([]);
  const [statusesFilter, setStatusesFilter] = useState<string[]>([]);

  // Sortable headers (mirrors Estimates): click a column to sort, click again to flip.
  type SortField = "number" | "clientName" | "invoiceNumber" | "method" | "status" | "amount" | "date";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };
  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="material-icons text-[#9AA3AF] ml-0.5" style={{ fontSize: "14px" }}>
      {sortField === field ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Column visibility (Number is always shown) — Figma "Edit columns" dialog
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(PAYMENT_TOGGLE_COLS));
  const [pendingColumns, setPendingColumns] = useState<Set<string>>(new Set(PAYMENT_TOGGLE_COLS));
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);

  // Bulk "Change status" dialog (opened from the selection bar)
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [changeStatusValue, setChangeStatusValue] = useState<PaymentStatus>("Completed");

  // "View payout" modal — payout figures come from the Stripe integration.
  const [payoutFor, setPayoutFor] = useState<Payment | null>(null);



  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d: string) => formatRegionalDate(new Date(d + "T12:00:00"));

  // Summary
  const summary = useMemo(() => {
    const completed = payments.filter(p => p.status === "Completed");
    const pending = payments.filter(p => p.status === "Pending");
    const refunded = payments.filter(p => p.status === "Refunded");
    return {
      totalCollected: completed.reduce((s, p) => s + p.amount, 0),
      completedCount: completed.length,
      pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
      pendingCount: pending.length,
      refundedTotal: refunded.reduce((s, p) => s + p.amount, 0),
      refundedCount: refunded.length,
      totalPayments: payments.length,
    };
  }, [payments]);

  // Filter
  const filtered = useMemo(() => {
    let result = [...payments];
    if (qfStatus !== "All") result = result.filter(p => p.status === qfStatus);
    if (qfMethod !== "All") result = result.filter(p => p.method === qfMethod);
    result = result.filter(p => matchesDatePreset(p.date, qfDate));
    if (totalMin) result = result.filter(p => p.amount >= Number(totalMin));
    if (totalMax) result = result.filter(p => p.amount <= Number(totalMax));
    if (clientsFilter.length) result = result.filter(p => clientsFilter.includes(p.clientName));
    if (invoicesFilter.length) result = result.filter(p => invoicesFilter.includes(p.invoiceNumber));
    if (methodsFilter.length) result = result.filter(p => methodsFilter.includes(p.method));
    if (statusesFilter.length) result = result.filter(p => statusesFilter.includes(p.status));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.clientName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        p.note.toLowerCase().includes(q)
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortField) {
        case "number": return (a.id - b.id) * dir;
        case "amount": return (a.amount - b.amount) * dir;
        case "clientName": return a.clientName.localeCompare(b.clientName) * dir;
        case "invoiceNumber": return a.invoiceNumber.localeCompare(b.invoiceNumber) * dir;
        case "method": return a.method.localeCompare(b.method) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        default: return a.date.localeCompare(b.date) * dir;
      }
    });
    return result;
  }, [payments, search, qfStatus, qfMethod, qfDate, totalMin, totalMax, clientsFilter, invoicesFilter, methodsFilter, statusesFilter, sortField, sortDir]);

  const clientOptions = useMemo(() => Array.from(new Set(payments.map(p => p.clientName))).sort(), [payments]);
  const invoiceOptions = useMemo(() => Array.from(new Set(payments.map(p => p.invoiceNumber).filter(Boolean))).sort(), [payments]);
  const activeFilterCount = [totalMin, totalMax, clientsFilter.length, invoicesFilter.length, methodsFilter.length, statusesFilter.length].filter(Boolean).length;
  const advancedActive = activeFilterCount > 0;
  const resetAdvancedFilters = () => {
    setTotalMin("");
    setTotalMax("");
    setClientsFilter([]);
    setInvoicesFilter([]);
    setMethodsFilter([]);
    setStatusesFilter([]);
    setPage(1);
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id));
  // Number is locked-on; the rest follow the Edit-columns selection.
  const visibleCols = cols.filter(c => c.key === "number" || visibleColumns.has(c.key));


  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Payments"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
        countSuffix="records"
      />

      {/* ── Stats Cards (Clients-template style) ── */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard
          value={`$${fmt(summary.totalCollected)}`}
          label="Collected"
          sub={`${summary.completedCount} payments`}
          change="+22%"
          changeUp
          period="vs prev. period"
          data={[3, 4, 4, 5, 6, 6, 7]}
          sparklineColor="#16A34A"
        />
        <StatCard
          value={`$${fmt(summary.pendingTotal)}`}
          label="Pending"
          sub={`${summary.pendingCount} payments`}
          change="+8%"
          changeUp
          period="vs prev. period"
          data={[1, 2, 2, 3, 3, 4, 3]}
          sparklineColor="#F59E0B"
        />
        <StatCard
          value={String(summary.totalPayments)}
          label="Total"
          sub="all payments"
          change="+15%"
          changeUp
          period="vs prev. period"
          data={[4, 5, 5, 6, 7, 7, 8]}
          sparklineColor="#4A6FA5"
        />
        <StatCard
          value={`$${fmt(summary.refundedTotal)}`}
          label="Refunded"
          sub={`${summary.refundedCount} payments`}
          change="-3%"
          changeUp={false}
          period="vs prev. period"
          data={[2, 1, 1, 1, 0, 1, 1]}
          sparklineColor="#A856F7"
        />
      </div>

      <div className={`flex gap-6`}>
        {/* Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden w-full">
          {/* Toolbar — replaced by the bulk-action bar once one or more rows are
              selected (filter first, then select; only ever one toolbar line).
              Bulk actions: ONLY Change status + Download — no bulk Refund (mass
              refunds are a financial risk; refunds are single-payment and a
              separate permission per Marek). X clears the selection in one click. */}
          {selectedIds.size > 0 ? (
            <SelectionBar
              count={selectedIds.size}
              onDeselect={() => setSelectedIds(new Set())}
              dismissAsIcon
              actions={[
                { label: "Change status", icon: "cached", onClick: () => setChangeStatusOpen(true) },
                { label: "Download", icon: "file_download", onClick: () => toast.success(`Exporting ${selectedIds.size} payment${selectedIds.size === 1 ? "" : "s"}…`) },
              ]}
            />
          ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
              <input type="text" placeholder="Search payments..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-[220px] h-9 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
            </div>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
              <option value="All">Status: All</option>
              {(["Completed", "Pending", "Refunded"] as PaymentStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={qfDate} onChange={e => { setQfDate(e.target.value); setPage(1); }} className={qfClass(qfDate !== "All time")}>
              {timeFilters.map(t => <option key={t} value={t}>{t === "All time" ? "Date: All time" : t}</option>)}
            </select>
            <select value={qfMethod} onChange={e => { setQfMethod(e.target.value); setPage(1); }} className={qfClass(qfMethod !== "All")}>
              <option value="All">Methods: All</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <button
              onClick={() => setFilterOpen(true)}
              className={`h-8 px-3 border rounded-lg text-[13px] flex items-center gap-1.5 transition-colors ${
                filterOpen || advancedActive ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA] bg-white"
              }`}
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>filter_alt</span>
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-[#4A6FA5] text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="ml-auto flex items-center gap-2">
              {/* "New payment" — a payment is initiated, not "created"/"recorded" (Jun 11 call). */}
              <CreateActionButton onClick={() => navigate("/payments/new")}>
                New payment
              </CreateActionButton>
              <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
                <KebabItem icon="view_column" onSelect={() => { setPendingColumns(new Set(visibleColumns)); setEditColumnsOpen(true); }}>Edit columns</KebabItem>
                <KebabSeparator />
                <KebabItem icon="file_upload" onClick={() => toast.info("Import payments — choose a CSV to upload")}>Upload</KebabItem>
                <KebabItem icon="file_download" onClick={() => toast.success(`Exporting ${filtered.length} payment${filtered.length === 1 ? "" : "s"}…`)}>Download</KebabItem>
              </KebabMenu>
            </div>
          </div>
          )}
          {filterOpen && (
            <AdvancedFilterPanel
              title="Filter"
              className="w-[400px]"
              onClose={() => setFilterOpen(false)}
              onClear={() => { resetAdvancedFilters(); setQfStatus("All"); setFilterOpen(false); }}
              onApply={() => setFilterOpen(false)}
            >
              {/* Jun 11 set (matches Figma payments filter frame): Total range,
                  then Client / Invoice / Methods / Statuses — each "one or many". */}
              <AdvancedFilterField label="Total">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" placeholder="min" value={totalMin} onChange={(e) => { setTotalMin(e.target.value); setPage(1); }} className={advancedInputClass} />
                  <input type="number" min="0" placeholder="max" value={totalMax} onChange={(e) => { setTotalMax(e.target.value); setPage(1); }} className={advancedInputClass} />
                </div>
              </AdvancedFilterField>
              <AdvancedFilterField label="Client">
                <FilterMultiSelect value={clientsFilter} options={clientOptions} onChange={(v) => { setClientsFilter(v); setPage(1); }} placeholder="All" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Invoice">
                <FilterMultiSelect value={invoicesFilter} options={invoiceOptions} onChange={(v) => { setInvoicesFilter(v); setPage(1); }} placeholder="All" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Methods">
                <FilterMultiSelect value={methodsFilter} options={[...PAYMENT_METHODS]} onChange={(v) => { setMethodsFilter(v); setPage(1); }} placeholder="All" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Statuses">
                <FilterMultiSelect value={statusesFilter} options={["Completed", "Pending", "Refunded"]} onChange={(v) => { setStatusesFilter(v); setPage(1); }} placeholder="All" />
              </AdvancedFilterField>
            </AdvancedFilterPanel>
          )}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: "4%" }} />
                {visibleCols.map(col => <col key={col.key} style={{ width: COL_PCT[col.key] }} />)}
                <col style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(paginated.map(p => p.id)));
                        else setSelectedIds(new Set());
                      }}
                      className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                  </th>
                  {visibleCols.map(col => {
                    const sortMap: Record<string, SortField> = { number: "number", client: "clientName", invoice: "invoiceNumber", method: "method", status: "status", total: "amount", paymentDate: "date" };
                    const sf = sortMap[col.key];
                    return (
                      <DraggableTh key={col.key} colKey={col.key} onMove={moveCol}
                        className="px-4 py-3 text-left text-[14px] text-[#1A2332] whitespace-nowrap select-none"
                        style={{ fontFamily: "Geist", fontWeight: 500 }}
                        onClick={sf ? () => toggleSort(sf) : undefined}
                      >
                        <div className="flex items-center">{col.label}{sf && <SortIcon field={sf} />}</div>
                      </DraggableTh>
                    );
                  })}
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length + 2} className="px-4 py-16 text-center">
                      <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>credit_card_off</span>
                      <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No payments found</div>
                      <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters</div>
                    </td>
                  </tr>
                ) : paginated.map((p, idx) => {
                  const ss = statusColors[p.status];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/payments/${p.id}`)}
                      className="border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer bg-white"
                    >
                      <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={(e) => {
                            const s = new Set(selectedIds);
                            e.target.checked ? s.add(p.id) : s.delete(p.id);
                            setSelectedIds(s);
                          }}
                          className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                      </td>
                      {visibleCols.map(col => {
                        switch (col.key) {
                          case "number": return (
                            <td key={col.key} className="px-4 py-4">
                              <span className="text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>P-{1000 + p.id}</span>
                            </td>
                          );
                          case "client": return (
                            <td key={col.key} className="px-4 py-4 truncate" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => navigate(`/clients/${p.invoiceNumber.split('-')[0]}`)}
                                className="text-[14px] text-[#4A6FA5] hover:underline hover:text-[#3d5a85] transition-colors text-left"
                                style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}
                              >
                                {p.clientName}
                              </button>
                            </td>
                          );
                          case "invoice": return (
                            <td key={col.key} className="px-4 py-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${p.invoiceId}`); }}
                                className="text-[13px] text-[#4A6FA5] hover:underline"
                                style={{ fontWeight: 500 }}
                              >
                                {p.invoiceNumber}
                              </button>
                            </td>
                          );
                          case "total": return (
                            <td key={col.key} className="px-4 py-4 text-[13px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              <span className={p.status === "Refunded" ? "text-[#A856F7]" : "text-[#1A2332]"}>
                                {p.status === "Refunded" ? "−" : ""}${fmt(p.amount)}
                              </span>
                            </td>
                          );
                          case "method": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] truncate">{p.method}</td>
                          );
                          case "status": return (
                            <td key={col.key} className="px-4 py-4">
                              <span className="px-2.5 py-1 rounded-md text-[12px]" style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}>
                                {p.status}
                              </span>
                            </td>
                          );
                          case "note": return <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] truncate">{p.note || "—"}</td>;
                          case "estimates": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] truncate">
                              {p.estimateNumbers?.length ? p.estimateNumbers.join(", ") : "—"}
                            </td>
                          );
                          case "jobs": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] truncate">
                              {(p.jobIds ?? (p.jobId ? [p.jobId] : [])).join(", ") || "—"}
                            </td>
                          );
                          case "paymentDate": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap">{fmtDate(p.date)}</td>
                          );
                          default: return null;
                        }
                      })}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        {/* Figma order. No "Make invoice" (invoices are never created
                            from a payment), and Refund disappears as soon as several
                            rows are selected — refunds are strictly one-by-one. */}
                        <KebabMenu>
                          <KebabItem icon="send" onSelect={() => toast.success(`Receipt sent to ${p.clientName}`)}>Send receipt</KebabItem>
                          <KebabItem icon="file_download" onSelect={() => toast.success(`Downloading receipt P-${1000 + p.id}…`)}>Download receipt</KebabItem>
                          <KebabItem icon="visibility" onSelect={() => setPayoutFor(p)}>View payout</KebabItem>
                          <KebabSeparator />
                          {selectedIds.size <= 1 && (
                            <KebabItem icon="undo" onSelect={() => {
                              paymentsStore.update(p.id, { status: "Refunded" });
                              toast.success(`Refunded P-${1000 + p.id}`);
                            }}>Refund</KebabItem>
                          )}
                          <KebabItem icon="open_in_new" onSelect={() => window.open(`/payments/${p.id}`, "_blank")}>Open in new tab</KebabItem>
                        </KebabMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-4 py-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>Rows per page:</span>
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[76px] border-[#E5E7EB] text-[14px] text-[#1A2332]" style={{ fontWeight: 400, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>
                {filtered.length === 0 ? "0-0" : `${(page - 1) * perPage + 1}-${Math.min(page * perPage, filtered.length)}`} of {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>chevron_left</span>
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Edit columns modal (Figma "edit-columns") ── */}
      {editColumnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditColumnsOpen(false)} />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[576px] max-w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Edit columns</h2>
              <button onClick={() => setEditColumnsOpen(false)} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
              </button>
            </div>
            <div className="px-4 pb-1 grid grid-rows-4 grid-flow-col gap-x-4 gap-y-2">
              {PAYMENTS_COLS.map(col => {
                const locked = col.key === "number";
                const checked = locked || pendingColumns.has(col.key);
                return (
                  <label key={col.key} className={`flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-[10px] ${locked ? "cursor-default" : "cursor-pointer hover:border-[#C5D5EC]"}`}>
                    <span className="relative inline-flex items-center justify-center w-4 h-4" style={{ opacity: locked ? 0.5 : 1 }}>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        disabled={locked}
                        onChange={(e) => setPendingColumns(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(col.key); else next.delete(col.key);
                          return next;
                        })}
                      />
                      <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${checked ? "bg-[#4A6FA5] border-[#4A6FA5]" : "bg-white border-[#E5E7EB]"}`}>
                        {checked && <span className="material-icons text-white" style={{ fontSize: "12px" }}>check</span>}
                      </span>
                    </span>
                    <span className="text-[14px] text-[#1A2332]">{col.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="px-4 py-4 flex items-center justify-end gap-2">
              <button onClick={() => setEditColumnsOpen(false)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={() => { setVisibleColumns(new Set(pendingColumns)); setEditColumnsOpen(false); toast.success("Columns updated"); }} className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors" style={{ fontWeight: 500 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change status modal (Figma "change-status") ── */}
      {changeStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChangeStatusOpen(false)} />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[448px] max-w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Change status</h2>
              <button onClick={() => setChangeStatusOpen(false)} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
              </button>
            </div>
            {/* Refunded is deliberately NOT offered — that would be bulk refund
                through the back door (refunds are single-payment only). */}
            <div className="px-4 pb-1 flex flex-col gap-2">
              {(["Completed", "Pending"] as PaymentStatus[]).map(s => {
                const sel = changeStatusValue === s;
                return (
                  <label key={s} className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-[10px] cursor-pointer hover:border-[#C5D5EC]">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${sel ? "border-[#4A6FA5]" : "border-[#E5E7EB]"}`}>
                      {sel && <span className="w-2 h-2 rounded-full bg-[#4A6FA5]" />}
                    </span>
                    <input type="radio" name="change-status" className="sr-only" checked={sel} onChange={() => setChangeStatusValue(s)} />
                    <span className="text-[14px] text-[#1A2332]">{s}</span>
                  </label>
                );
              })}
            </div>
            <div className="px-4 py-4 flex items-center justify-end gap-2">
              <button onClick={() => setChangeStatusOpen(false)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  const n = selectedIds.size;
                  selectedIds.forEach(id => paymentsStore.update(id, { status: changeStatusValue }));
                  setSelectedIds(new Set());
                  setChangeStatusOpen(false);
                  toast.success(`Marked ${n} payment${n === 1 ? "" : "s"} as ${changeStatusValue}`);
                }}
                className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View payout — net amount after the processor fee + payout date.
          Figures come from the Stripe integration (mocked at 3% here). ── */}
      {payoutFor && (() => {
        const fee = payoutFor.amount * 0.03;
        const net = payoutFor.amount - fee;
        const payoutDate = (() => {
          const d = new Date(payoutFor.date + "T12:00:00");
          d.setDate(d.getDate() + 2);
          return formatRegionalDate(d);
        })();
        const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPayoutFor(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[400px] max-w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Payout · P-{1000 + payoutFor.id}</h3>
                <button onClick={() => setPayoutFor(null)} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                  <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
                </button>
              </div>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Payment amount</span>
                  <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt2(payoutFor.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Processing fee (3%)</span>
                  <span className="text-[#DC2626]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt2(fee)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Payout</span>
                  <span className="text-[18px] text-[#16A34A]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt2(net)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Payout date</span>
                  <span className="text-[#1A2332]">{payoutDate}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#9CA3AF]">
                  <span className="material-icons" style={{ fontSize: "13px" }}>info</span>
                  Payout data is provided by the Stripe integration.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </DndProvider>
  );
}

// Compact multi-select used by the advanced filter panel (checkbox dropdown —
// "one or many" semantics for Client / Invoice / Methods / Statuses).
function FilterMultiSelect({ value, options, onChange, placeholder }: {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  const summary = value.length === 0
    ? placeholder
    : value.length <= 2 ? value.join(", ") : `${value.length} selected`;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${advancedSelectClass} text-left flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${value.length ? "text-[#1A2332]" : "text-[#6B7280]"}`}>{summary}</span>
        <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "18px" }}>keyboard_arrow_down</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-[#E5E7EB] rounded-md shadow-lg max-h-[220px] overflow-y-auto">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] cursor-pointer">
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} className="accent-[#4A6FA5]" />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
