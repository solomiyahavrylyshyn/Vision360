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

// ─── Types ───────────────────────────────────────────────────────────────────
// PaymentMethod is loose (string) so legacy seed values (e.g. "ACH") still
// render; the canonical options come from PAYMENT_METHODS.
export type PaymentMethod = string;
export type PaymentStatus = "Completed" | "Pending" | "Refunded";

export interface Payment {
  id: number;
  date: string;
  amount: number;
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
}

export const paymentStatusColors: Record<PaymentStatus, { text: string; bg: string }> = {
  Completed: { text: "#22C55E", bg: "#DCFCE7" },
  Pending: { text: "#F59E0B", bg: "#FEF3C7" },
  Refunded: { text: "#8B5CF6", bg: "#EDE9FE" },
};
const statusColors = paymentStatusColors;

// Re-exported for any consumers that imported the old name; backed by the
// shared canonical icon helper.
export const paymentMethodIcons = new Proxy({}, { get: (_t, k) => paymentMethodIcon(String(k)) }) as Record<string, string>;
const methodIcons = paymentMethodIcons;

const timeFilters = [
  "All time", "Today", "Yesterday", "Last 7 days", "Last 30 days",
  "This month", "Last month", "This year", "Last year",
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const mockPayments: Payment[] = [
  { id: 1, date: "2026-03-10", amount: 5000.00, method: "Bank Transfer", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "First installment", createdBy: "Marek Stroz", createdAt: "2026-03-10 14:22" },
  { id: 2, date: "2026-03-25", amount: 5502.00, method: "Check", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Final payment", createdBy: "Marek Stroz", createdAt: "2026-03-25 11:45" },
  { id: 3, date: "2026-03-15", amount: 1000.00, method: "Credit Card", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 4, invoiceNumber: "10248-I02", jobId: "10248-J01", note: "Partial payment", createdBy: "Marek Stroz", createdAt: "2026-03-15 13:30" },
  { id: 4, date: "2026-04-01", amount: 913.75, method: "Check", status: "Pending", clientName: "Mike Rodriguez", clientEmail: "mike.r@email.com", invoiceId: 5, invoiceNumber: "10247-I01", jobId: "10247-J01", note: "", createdBy: "Marek Stroz", createdAt: "2026-04-01 09:15" },
  { id: 5, date: "2026-02-21", amount: 326.25, method: "Cash", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 6, invoiceNumber: "10249-I01", jobId: "10249-J01", note: "Paid in full", createdBy: "Marek Stroz", createdAt: "2026-02-21 16:00" },
  { id: 6, date: "2026-03-28", amount: 200.00, method: "Credit Card", status: "Refunded", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "10245-I01", jobId: "10245-J01", note: "Partial refund — overcharge adjustment", createdBy: "Marek Stroz", createdAt: "2026-03-28 10:20" },
  { id: 7, date: "2026-04-03", amount: 2800.00, method: "Bank Transfer", status: "Completed", clientName: "John Doe", clientEmail: "john.d@email.com", invoiceId: 2, invoiceNumber: "10246-I01", jobId: "10246-J01", note: "Partial payment on overdue invoice", createdBy: "Marek Stroz", createdAt: "2026-04-03 11:00" },
];

const PAYMENTS_COLS = [
  { key: "date", label: "Date" },
  { key: "client", label: "Client" },
  { key: "invoice", label: "Invoice" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
  { key: "note", label: "Note" },
] as const;

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);



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
    if (dateFrom) result = result.filter(p => p.date >= dateFrom);
    if (dateTo) result = result.filter(p => p.date <= dateTo);
    if (amountMin) result = result.filter(p => p.amount >= Number(amountMin));
    if (amountMax) result = result.filter(p => p.amount <= Number(amountMax));
    if (createdByFilter !== "All") result = result.filter(p => p.createdBy === createdByFilter);
    if (invoiceFilter) {
      const q = invoiceFilter.toLowerCase();
      result = result.filter(p => p.invoiceNumber.toLowerCase().includes(q));
    }
    if (jobFilter) {
      const q = jobFilter.toLowerCase();
      result = result.filter(p => (p.jobId || "").toLowerCase().includes(q));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.clientName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        p.note.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [payments, search, qfStatus, qfMethod, qfDate, dateFrom, dateTo, amountMin, amountMax, createdByFilter, invoiceFilter, jobFilter]);

  const creators = useMemo(() => Array.from(new Set(payments.map(p => p.createdBy))), [payments]);
  const activeFilterCount = [dateFrom, dateTo, amountMin, amountMax, createdByFilter !== "All", invoiceFilter, jobFilter].filter(Boolean).length;
  const advancedActive = activeFilterCount > 0;
  const resetAdvancedFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setCreatedByFilter("All");
    setInvoiceFilter("");
    setJobFilter("");
    setPage(1);
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id));

  const summaryCards = [
    { label: "Collected", value: `$${fmt(summary.totalCollected)}`, sub: `${summary.completedCount} payments`, color: "#22C55E", filterVal: "Completed" },
    { label: "Pending", value: `$${fmt(summary.pendingTotal)}`, sub: `${summary.pendingCount} payments`, color: "#F59E0B", filterVal: "Pending" },
    { label: "Refunded", value: `$${fmt(summary.refundedTotal)}`, sub: `${summary.refundedCount} payments`, color: "#8B5CF6", filterVal: "Refunded" },
    { label: "Total", value: `${summary.totalPayments}`, sub: "all payments", color: "#4A6FA5", filterVal: "All" },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Payments"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
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
          value={`$${fmt(summary.refundedTotal)}`}
          label="Refunded"
          sub={`${summary.refundedCount} payments`}
          change="-3%"
          changeUp={false}
          period="vs prev. period"
          data={[2, 1, 1, 1, 0, 1, 1]}
          sparklineColor="#8B5CF6"
        />
        <StatCard
          value={String(summary.totalPayments)}
          label="Total"
          sub="all payments"
          change="+15%"
          changeUp
          period="vs prev. period"
          data={[4, 5, 5, 6, 7, 7, 8]}
        />
      </div>

      <div className={`flex gap-6`}>
        {/* Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden w-full">
          {/* Filter bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
              <input type="text" placeholder="Search payments..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-[220px] h-9 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
            </div>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
              <option value="All">All statuses</option>
              {(["Completed", "Pending", "Refunded"] as PaymentStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={qfDate} onChange={e => { setQfDate(e.target.value); setPage(1); }} className={qfClass(qfDate !== "All time")}>
              {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={qfMethod} onChange={e => { setQfMethod(e.target.value); setPage(1); }} className={qfClass(qfMethod !== "All")}>
              <option value="All">All methods</option>
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
              <CreateActionButton>
                Record Payment
              </CreateActionButton>
              <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
                <KebabItem icon="view_column">Edit Columns</KebabItem>
                <KebabItem icon="swap_horiz">Change Status</KebabItem>
                <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
                <KebabSeparator />
                <KebabItem icon="file_upload">Import</KebabItem>
                <KebabItem icon="file_download">Export</KebabItem>
              </KebabMenu>
            </div>
          </div>
          {filterOpen && (
            <AdvancedFilterPanel
              onClose={() => setFilterOpen(false)}
              onClear={() => { resetAdvancedFilters(); setFilterOpen(false); }}
              onApply={() => setFilterOpen(false)}
            >
              <AdvancedFilterField label="Date from">
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Date to">
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Amount min">
                <input type="number" min="0" placeholder="$0" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Amount max">
                <input type="number" min="0" placeholder="Any" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Created by">
                <select value={createdByFilter} onChange={(e) => { setCreatedByFilter(e.target.value); setPage(1); }} className={advancedSelectClass}>
                  <option>All</option>
                  {creators.map((creator) => <option key={creator}>{creator}</option>)}
                </select>
              </AdvancedFilterField>
              <AdvancedFilterField label="Invoice #">
                <input value={invoiceFilter} onChange={(e) => { setInvoiceFilter(e.target.value); setPage(1); }} placeholder="10245-I01" className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Job #">
                <input value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1); }} placeholder="10245-J01" className={advancedInputClass} />
              </AdvancedFilterField>
            </AdvancedFilterPanel>
          )}
          <SelectionBar
            count={selectedIds.size}
            onDeselect={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "Refund selected",
                icon: "undo",
                destructive: true,
                onClick: () => {
                  selectedIds.forEach(id => paymentsStore.update(id, { status: "Refunded" }));
                  setSelectedIds(new Set());
                },
              },
              { label: "Export", icon: "file_download", onClick: () => {} },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
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
                  {cols.map(col => (
                    <DraggableTh key={col.key} colKey={col.key} onMove={moveCol}
                      className="px-4 py-3 text-left text-[14px] text-[#1A2332]"
                      style={{ fontFamily: "Geist", fontWeight: 500 }}
                    >
                      {col.label}
                    </DraggableTh>
                  ))}
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
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
                      className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer ${idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}
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
                      {cols.map(col => {
                        switch (col.key) {
                          case "date": return <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478]">{fmtDate(p.date)}</td>;
                          case "client": return (
                            <td key={col.key} className="px-4 py-4" onClick={e => e.stopPropagation()}>
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
                          case "amount": return (
                            <td key={col.key} className="px-4 py-4 text-[13px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              <span className={p.status === "Refunded" ? "text-[#8B5CF6]" : "text-[#1A2332]"}>
                                {p.status === "Refunded" ? "−" : ""}${fmt(p.amount)}
                              </span>
                            </td>
                          );
                          case "method": return (
                            <td key={col.key} className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="material-icons text-[#546478]" style={{ fontSize: "15px" }}>{methodIcons[p.method]}</span>
                                <span className="text-[13px] text-[#546478]">{p.method}</span>
                              </div>
                            </td>
                          );
                          case "status": return (
                            <td key={col.key} className="px-4 py-4">
                              <span className="px-2.5 py-1 rounded-md text-[12px]" style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}>
                                {p.status}
                              </span>
                            </td>
                          );
                          case "note": return <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] max-w-[160px] truncate">{p.note || "—"}</td>;
                          default: return null;
                        }
                      })}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <KebabMenu>
                          <KebabItem icon="visibility" onSelect={() => navigate(`/payments/${p.id}`)}>View details</KebabItem>
                          <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${p.invoiceId}`)}>Open invoice</KebabItem>
                          <KebabSeparator />
                          <KebabItem icon="undo" destructive onSelect={() => {
                            paymentsStore.update(p.id, { status: "Refunded" });
                          }}>Refund</KebabItem>
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
                <SelectTrigger className="h-9 w-[59px] border-[#E5E7EB] text-[14px] text-[#1A2332]" style={{ fontWeight: 400, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
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
    </div>
    </DndProvider>
  );
}
