import { useState, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
  // Estimates / jobs the payment traces back to via its invoice — shown as
  // reference columns on the list (an invoice can settle several jobs).
  estimateNumbers?: string[];
  jobIds?: string[];
  // Transaction number for external/non-integrated methods (check #, transfer
  // ID, Venmo/Zelle/Cash App confirmation, financing reference).
  reference?: string;
  note: string;
  createdBy: string;
  createdAt: string;
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
const methodIcons = paymentMethodIcons;

const timeFilters = [
  "All time", "Today", "Yesterday", "Last 7 days", "Last 30 days",
  "This month", "Last month", "This year", "Last year",
];

// Column order: Number · Client · Invoice(s) · Method · Status · Total · Note ·
// Estimates · Jobs · Payment date. No Time column, and no Due/Expiry dates —
// a payment simply doesn't have them.
const PAYMENTS_COLS = [
  { key: "number", label: "Number" },
  { key: "client", label: "Client" },
  { key: "invoice", label: "Invoice(s)" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
  { key: "note", label: "Note" },
  { key: "estimates", label: "Estimates" },
  { key: "jobs", label: "Jobs" },
  { key: "paymentDate", label: "Payment date" },
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
  // Advanced filters — exactly: Total (from–to), Client (one or many),
  // Invoice (by number, many), Methods (many), Statuses (one or many).
  // No job filter and no date range here (the quick Date filter covers time).
  const [filterOpen, setFilterOpen] = useState(false);
  const [totalMin, setTotalMin] = useState("");
  const [totalMax, setTotalMax] = useState("");
  const [clientsFilter, setClientsFilter] = useState<string[]>([]);
  const [invoicesFilter, setInvoicesFilter] = useState<string[]>([]);
  const [methodsFilter, setMethodsFilter] = useState<string[]>([]);
  const [statusesFilter, setStatusesFilter] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  // Bulk "Change status" modal (bulk Refund is deliberately NOT offered —
  // refunds are single-payment only and a separate permission).
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>("Completed");
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
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [payments, search, qfStatus, qfMethod, qfDate, totalMin, totalMax, clientsFilter, invoicesFilter, methodsFilter, statusesFilter]);

  const clientOptions = useMemo(() => Array.from(new Set(payments.map(p => p.clientName))).sort(), [payments]);
  const invoiceOptions = useMemo(() => Array.from(new Set(payments.map(p => p.invoiceNumber))).sort(), [payments]);
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
              {/* "New payment" — a payment is initiated, not "created". */}
              <CreateActionButton onClick={() => navigate("/payments/new")}>
                New payment
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
              <AdvancedFilterField label="Total from">
                <input type="number" min="0" placeholder="$0" value={totalMin} onChange={(e) => { setTotalMin(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Total to">
                <input type="number" min="0" placeholder="Any" value={totalMax} onChange={(e) => { setTotalMax(e.target.value); setPage(1); }} className={advancedInputClass} />
              </AdvancedFilterField>
              <AdvancedFilterField label="Client">
                <FilterMultiSelect value={clientsFilter} options={clientOptions} onChange={(v) => { setClientsFilter(v); setPage(1); }} placeholder="All clients" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Invoice">
                <FilterMultiSelect value={invoicesFilter} options={invoiceOptions} onChange={(v) => { setInvoicesFilter(v); setPage(1); }} placeholder="All invoices" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Methods">
                <FilterMultiSelect value={methodsFilter} options={[...PAYMENT_METHODS]} onChange={(v) => { setMethodsFilter(v); setPage(1); }} placeholder="All methods" />
              </AdvancedFilterField>
              <AdvancedFilterField label="Statuses">
                <FilterMultiSelect value={statusesFilter} options={["Completed", "Pending", "Refunded"]} onChange={(v) => { setStatusesFilter(v); setPage(1); }} placeholder="All statuses" />
              </AdvancedFilterField>
            </AdvancedFilterPanel>
          )}
          {/* Bulk actions: ONLY Change status + Download. No bulk Refund (mass
              refunds are a direct financial risk — refund is single-payment and
              its own permission) and no bulk Archive. The X clears the whole
              selection in one click. */}
          <SelectionBar
            count={selectedIds.size}
            onDeselect={() => setSelectedIds(new Set())}
            dismissAsIcon
            actions={[
              { label: "Change status", icon: "swap_horiz", onClick: () => setBulkStatusOpen(true) },
              {
                label: "Download",
                icon: "file_download",
                onClick: () => toast.success(`Downloading ${selectedIds.size} payment${selectedIds.size === 1 ? "" : "s"}…`),
              },
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
                    <td colSpan={cols.length + 2} className="px-4 py-16 text-center">
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
                          case "number": return (
                            <td key={col.key} className="px-4 py-4">
                              <span className="text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>P-{1000 + p.id}</span>
                            </td>
                          );
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
                          case "total": return (
                            <td key={col.key} className="px-4 py-4 text-[13px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              <span className={p.status === "Refunded" ? "text-[#A856F7]" : "text-[#1A2332]"}>
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
                          case "estimates": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478]">
                              {p.estimateNumbers?.length ? p.estimateNumbers.join(", ") : "—"}
                            </td>
                          );
                          case "jobs": return (
                            <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478]">
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
                        {/* Single-row kebab. Refund disappears as soon as several
                            rows are selected — refunds are strictly one-by-one. */}
                        <KebabMenu>
                          {selectedIds.size <= 1 && (
                            <KebabItem icon="undo" destructive onSelect={() => {
                              paymentsStore.update(p.id, { status: "Refunded" });
                              toast.success(`Payment P-${1000 + p.id} refunded`);
                            }}>Refund</KebabItem>
                          )}
                          <KebabItem icon="send" onSelect={() => toast.success(`Receipt sent to ${p.clientEmail}`)}>Send receipt</KebabItem>
                          <KebabItem icon="file_download" onSelect={() => toast.success(`Downloading receipt for P-${1000 + p.id}`)}>Download receipt</KebabItem>
                          <KebabItem icon="account_balance" onSelect={() => setPayoutFor(p)}>View payout</KebabItem>
                          <KebabSeparator />
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

      {/* Bulk "Change status" — Refunded is deliberately not offered here:
          that would be bulk refund through the back door. */}
      {bulkStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setBulkStatusOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Change status</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">
              {selectedIds.size} payment{selectedIds.size === 1 ? "" : "s"} selected. Refunds are issued one payment at a time.
            </p>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as PaymentStatus)}
              className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5] bg-white mb-6"
            >
              {(["Completed", "Pending"] as PaymentStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setBulkStatusOpen(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] hover:bg-[#F3F4F6]" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  selectedIds.forEach(pid => paymentsStore.update(pid, { status: bulkStatus }));
                  toast.success(`Status changed to ${bulkStatus} for ${selectedIds.size} payment${selectedIds.size === 1 ? "" : "s"}`);
                  setSelectedIds(new Set());
                  setBulkStatusOpen(false);
                }}
                className="px-4 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85]"
                style={{ fontWeight: 600 }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View payout — net amount after the processor fee + payout date.
          Figures come from the Stripe integration (mocked at 3% here). */}
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
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Payout · P-{1000 + payoutFor.id}</h3>
                <button onClick={() => setPayoutFor(null)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "22px" }}>close</span>
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
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
                <div className="flex items-center gap-1.5 pt-2 text-[11px] text-[#9CA3AF]">
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
        <span className={`truncate ${value.length ? "text-[#1A2332]" : "text-[#9CA3AF]"}`}>{summary}</span>
        <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "18px" }}>arrow_drop_down</span>
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
