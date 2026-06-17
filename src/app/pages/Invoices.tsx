import { useState, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";
import { formatRegionalDate, regionalSettingsStore } from "../stores/regionalSettingsStore";
import { AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";
import { clientsStore } from "../stores/clientsStore";
import { invoicesStore, type Invoice, type InvoiceStatus } from "../stores/invoicesStore";

const statusColors: Record<InvoiceStatus, { text: string; bg: string }> = {
  "Unpaid":          { text: "#DC2626", bg: "#FEE2E2" },
  "Overdue":  { text: "#EF4444", bg: "#FEE2E2" },
  "Paid":            { text: "#16A34A", bg: "#DCFCE7" },
  "Partially Paid":  { text: "#D97706", bg: "#FEF3C7" },
  "Void":            { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = [
  "Unpaid",
  "Overdue",
  "Paid",
  "Partially Paid",
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

// Invoice records (type + seed) now live in stores/invoicesStore.ts so created
// invoices persist and show up here, on JobDetail and in CreatePayment.

// Figma column order (node 645:64301): Number · Client name · Job · Status ·
// Date · Due date · Total · Balance · Note.
const INVOICES_COLS = [
  { key: "number", label: "Number" },
  { key: "client", label: "Client name" },
  { key: "job", label: "Job" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "dueDate", label: "Due date" },
  { key: "total", label: "Total" },
  { key: "balance", label: "Balance" },
  { key: "memo", label: "Note" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-7 pl-2.5 pr-6 border rounded-md text-[12px] bg-white cursor-pointer focus:outline-none transition-colors ${
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
export function Invoices() {
  const navigate = useNavigate();
  const regionalSettings = useSyncExternalStore(regionalSettingsStore.subscribe, regionalSettingsStore.getSnapshot);
  const [cols, moveCol] = useDraggableColumns([...INVOICES_COLS]);
  const [editColsOpen, setEditColsOpen] = useState(false);
  const [colVis, setColVis] = useState<Set<string>>(() => new Set(INVOICES_COLS.map((c) => c.key)));
  const shownCols = cols.filter((c) => colVis.has(c.key));
  const invoices = useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot);
  const [search, setSearch] = useState("");

  // Quick filters
  const [qfStatus, setQfStatus] = useState<string>("All");
  const [qfDate, setQfDate] = useState("All time");
  const [qfBalance, setQfBalance] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [totalMin, setTotalMin] = useState("");
  const [totalMax, setTotalMax] = useState("");
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [termsFilter, setTermsFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [perPage, setPerPage] = useState(10);


  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d: string) => {
    return formatRegionalDate(d, regionalSettings);
  };

  // Summary cards
  const summary = useMemo(() => {
    const unpaid = invoices.filter(i => i.status === "Unpaid");
    const overdue = invoices.filter(i => i.status === "Overdue");
    const paid = invoices.filter(i => i.status === "Paid");
    const partiallyPaid = invoices.filter(i => i.status === "Partially Paid");
    const voided = invoices.filter(i => i.status === "Void");
    return {
      unpaid: { count: unpaid.length, total: unpaid.reduce((s, i) => s + i.balance, 0) },
      overdue: { count: overdue.length, total: overdue.reduce((s, i) => s + i.balance, 0) },
      paid: { count: paid.length, total: paid.reduce((s, i) => s + i.total, 0) },
      partiallyPaid: { count: partiallyPaid.length, total: partiallyPaid.reduce((s, i) => s + i.balance, 0) },
      voided: { count: voided.length },
    };
  }, [invoices]);

  // Live clients back the advanced "Client name" filter, which matches first
  // name, last name and company name on the client record.
  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);

  // Filter
  const filtered = useMemo(() => {
    let result = [...invoices];
    if (qfStatus !== "All") {
      result = result.filter(i => i.status === qfStatus);
    }
    result = result.filter(i => matchesDatePreset(i.date, qfDate));
    if (qfBalance === "With Balance") result = result.filter(i => i.balance > 0);
    if (createdFrom) result = result.filter(i => i.date >= createdFrom);
    if (createdTo) result = result.filter(i => i.date <= createdTo);
    if (dueFrom) result = result.filter(i => i.dueDate >= dueFrom);
    if (dueTo) result = result.filter(i => i.dueDate <= dueTo);
    if (totalMin) result = result.filter(i => i.total >= Number(totalMin));
    if (totalMax) result = result.filter(i => i.total <= Number(totalMax));
    if (balanceMin) result = result.filter(i => i.balance >= Number(balanceMin));
    if (balanceMax) result = result.filter(i => i.balance <= Number(balanceMax));
    if (createdByFilter !== "All") result = result.filter(i => i.createdBy === createdByFilter);
    if (termsFilter !== "All") result = result.filter(i => i.paymentTerms === termsFilter);
    if (clientFilter) {
      // One text query matched against first name, last name AND company name.
      const q = clientFilter.toLowerCase();
      result = result.filter(i => {
        const rec = liveClients.find(c => c.name === i.clientName);
        if (rec) {
          return (
            (rec.firstName || "").toLowerCase().includes(q) ||
            (rec.lastName || "").toLowerCase().includes(q) ||
            (rec.company || "").toLowerCase().includes(q) ||
            rec.name.toLowerCase().includes(q)
          );
        }
        return i.clientName.toLowerCase().includes(q);
      });
    }
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
  }, [invoices, qfStatus, qfDate, qfBalance, createdFrom, createdTo, dueFrom, dueTo, totalMin, totalMax, balanceMin, balanceMax, createdByFilter, termsFilter, clientFilter, liveClients, search]);

  const creators = useMemo(() => Array.from(new Set(invoices.map(i => i.createdBy))), [invoices]);
  const terms = useMemo(() => Array.from(new Set(invoices.map(i => i.paymentTerms).filter(Boolean))), [invoices]);
  const activeFilterCount = [clientFilter, createdFrom, createdTo, dueFrom, dueTo, totalMin, totalMax, balanceMin, balanceMax, createdByFilter !== "All", termsFilter !== "All"].filter(Boolean).length;
  const advancedActive = activeFilterCount > 0;
  const resetAdvancedFilters = () => {
    setClientFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setDueFrom("");
    setDueTo("");
    setTotalMin("");
    setTotalMax("");
    setBalanceMin("");
    setBalanceMax("");
    setCreatedByFilter("All");
    setTermsFilter("All");
    setPage(1);
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const allSelected = paginated.length > 0 && paginated.every(i => selectedIds.has(i.id));

  const handleBulkDelete = () => {
    invoicesStore.removeMany(selectedIds);
    setSelectedIds(new Set());
    setDeleteConfirm(false);
  };

  const summaryCards: { label: string; value: string; sub: string; filterVal: string; color: string }[] = [
    { label: "Unpaid",        value: `$${fmt(summary.unpaid.total)}`,        sub: `${summary.unpaid.count} invoices`,        filterVal: "Unpaid",         color: "#3B82F6" },
    { label: "Overdue",       value: `$${fmt(summary.overdue.total)}`,       sub: `${summary.overdue.count} invoices`,       filterVal: "Overdue", color: "#EF4444" },
    { label: "Paid",          value: `$${fmt(summary.paid.total)}`,          sub: `${summary.paid.count} invoices`,          filterVal: "Paid",           color: "#22C55E" },
    { label: "Partially Paid", value: `$${fmt(summary.partiallyPaid.total)}`, sub: `${summary.partiallyPaid.count} invoices`, filterVal: "Partially Paid", color: "#F59E0B" },
    { label: "Void",          value: `${summary.voided.count}`,              sub: "invoices",                                filterVal: "Void",           color: "#9CA3AF" },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Invoices"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
      />

      {/* ── Stats Cards (Clients-template style) ── */}
      <div className="mb-4 grid grid-flow-col auto-cols-[200px] gap-3 overflow-x-auto pb-1 lg:grid-flow-row lg:grid-cols-4 lg:auto-cols-auto lg:overflow-visible lg:pb-0">
        <StatCard
          value={`$${fmt(summary.unpaid.total)}`}
          label="Unpaid"
          sub={`${summary.unpaid.count} invoices`}
          change="+5%"
          changeUp={false}
          period="vs prev. period"
          data={[2, 3, 2, 4, 3, 5, 4]}
          sparklineColor="#3B82F6"
        />
        <StatCard
          value={`$${fmt(summary.overdue.total)}`}
          label="Overdue"
          sub={`${summary.overdue.count} invoices`}
          change="-3%"
          changeUp={false}
          period="vs prev. period"
          data={[1, 2, 1, 3, 2, 2, 1]}
          sparklineColor="#EF4444"
        />
        <StatCard
          value={`$${fmt(summary.paid.total)}`}
          label="Paid"
          sub={`${summary.paid.count} invoices`}
          change="+18%"
          changeUp
          period="vs prev. period"
          data={[3, 4, 4, 5, 6, 6, 7]}
          sparklineColor="#16A34A"
        />
        <StatCard
          value={`$${fmt(summary.partiallyPaid.total)}`}
          label="Partially paid"
          sub={`${summary.partiallyPaid.count} invoices`}
          change="+11%"
          changeUp
          period="vs prev. period"
          data={[2, 3, 3, 4, 4, 5, 5]}
          sparklineColor="#F59E0B"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
          <div className="relative w-full sm:w-auto">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search invoices..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full sm:w-[220px] h-8 pl-9 pr-3 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
          </div>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
            <option value="All">Status: All</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={qfDate} onChange={e => { setQfDate(e.target.value); setPage(1); }} className={qfClass(qfDate !== "All time")}>
            {timeFilters.map(t => <option key={t} value={t}>{t === "All time" ? "Date: All time" : t}</option>)}
          </select>
          <select value={qfBalance} onChange={e => { setQfBalance(e.target.value); setPage(1); }} className={qfClass(qfBalance !== "All")}>
            <option value="All">All invoices</option>
            <option value="With Balance">With balance</option>
          </select>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <button
            onClick={() => setFilterOpen(true)}
            className={`h-7 px-2.5 border rounded-md text-[12px] flex items-center gap-1.5 transition-colors ${
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
            <CreateActionButton onClick={() => navigate("/invoices/new")}>
              Create invoice
            </CreateActionButton>
            <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
              <KebabItem icon="view_column" onSelect={() => setEditColsOpen(true)}>Edit Columns</KebabItem>
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
            <AdvancedFilterField label="Client name">
              <input value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} placeholder="First, last or company name" className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Created from">
              <input type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Created to">
              <input type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Due from">
              <input type="date" value={dueFrom} onChange={(e) => { setDueFrom(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Due to">
              <input type="date" value={dueTo} onChange={(e) => { setDueTo(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Total min">
              <input type="number" min="0" placeholder="$0" value={totalMin} onChange={(e) => { setTotalMin(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Total max">
              <input type="number" min="0" placeholder="Any" value={totalMax} onChange={(e) => { setTotalMax(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Balance min">
              <input type="number" min="0" placeholder="$0" value={balanceMin} onChange={(e) => { setBalanceMin(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Balance max">
              <input type="number" min="0" placeholder="Any" value={balanceMax} onChange={(e) => { setBalanceMax(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Created by">
              <select value={createdByFilter} onChange={(e) => { setCreatedByFilter(e.target.value); setPage(1); }} className={advancedSelectClass}>
                <option>All</option>
                {creators.map((creator) => <option key={creator}>{creator}</option>)}
              </select>
            </AdvancedFilterField>
            <AdvancedFilterField label="Terms">
              <select value={termsFilter} onChange={(e) => { setTermsFilter(e.target.value); setPage(1); }} className={advancedSelectClass}>
                <option>All</option>
                {terms.map((term) => <option key={term}>{term}</option>)}
              </select>
            </AdvancedFilterField>
          </AdvancedFilterPanel>
        )}
        <SelectionBar
          count={selectedIds.size}
          onDeselect={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Archive",
              icon: "archive",
              destructive: true,
              onClick: () => setDeleteConfirm(true),
            },
            { label: "Export", icon: "file_download", onClick: () => {} },
          ]}
        />
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginated.map(i => i.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                </th>
                {shownCols.map(col => (
                  <DraggableTh key={col.key} colKey={col.key} onMove={moveCol}
                    className={`px-4 py-3 text-[14px] text-[#1A2332] whitespace-nowrap ${col.key === "total" || col.key === "balance" ? "text-right" : "text-left"}`}
                    style={{ fontFamily: "Geist", fontWeight: 500 }}
                  >
                    {col.label}
                  </DraggableTh>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>receipt</span>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No invoices found</div>
                    <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters or create a new invoice</div>
                  </td>
                </tr>
              ) : paginated.map((inv, idx) => {
                const overdueDays = inv.status === "Overdue" ? daysBetween(inv.dueDate, TODAY) : 0;
                return (
                <tr
                  key={inv.id}
                  className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer ${selectedIds.has(inv.id) ? "bg-[#EBF0F8]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(inv.id)}
                      onChange={(e) => {
                        const s = new Set(selectedIds);
                        e.target.checked ? s.add(inv.id) : s.delete(inv.id);
                        setSelectedIds(s);
                      }}
                      className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                  </td>
                  {shownCols.map(col => {
                    switch (col.key) {
                      case "number": return <td key={col.key} className="px-4 py-4 text-[14px] text-[#4A6FA5] whitespace-nowrap" style={{ fontWeight: 600 }}>{inv.number}</td>;
                      case "type": return <td key={col.key} className="px-4 py-4 text-[14px] text-[#546478] whitespace-nowrap">{inv.type}</td>;
                      case "date": return <td key={col.key} className="px-4 py-4 text-[14px] text-[#546478] whitespace-nowrap">{fmtDate(inv.date)}</td>;
                      case "client": return (
                        <td key={col.key} className="px-3 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/clients/${inv.number.split('-')[0]}`)}
                            className="text-[14px] text-[#4A6FA5] hover:underline hover:text-[#3d5a85] transition-colors text-left"
                            style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}
                          >
                            {inv.clientName}
                          </button>
                        </td>
                      );
                      case "job": return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {inv.jobNumber ? (
                            <button onClick={() => navigate(`/jobs/${inv.jobNumber}`)} className="text-left">
                              <div className="text-[14px] text-[#4A6FA5] hover:underline" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>
                                {inv.jobNumber}{inv.jobName && inv.jobName !== "—" ? <span className="text-[#546478]"> · {inv.jobName}</span> : ""}
                              </div>
                            </button>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                      );
                      case "status": return (
                        <td key={col.key} className="px-3 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[12px]"
                            style={{ fontWeight: 600, color: statusColors[inv.status].text, backgroundColor: statusColors[inv.status].bg }}>
                            {inv.status}
                          </span>
                          {overdueDays > 0 && (
                            <div className="text-[11px] text-[#EF4444] mt-0.5" style={{ fontWeight: 500 }}>Past due {overdueDays} days</div>
                          )}
                        </td>
                      );
                      case "total": return <td key={col.key} className="px-4 py-4 text-[14px] text-[#1A2332] whitespace-nowrap text-right" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(inv.total)}</td>;
                      case "balance": return (
                        <td key={col.key} className="px-4 py-4 text-[14px] whitespace-nowrap text-right" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                          <span className={inv.balance > 0 ? "text-[#EF4444]" : "text-[#22C55E]"}>${fmt(inv.balance)}</span>
                        </td>
                      );
                      case "dueDate": return <td key={col.key} className="px-4 py-4 text-[14px] text-[#546478] whitespace-nowrap">{fmtDate(inv.dueDate)}</td>;
                      case "memo": return (
                        <td key={col.key} className="px-4 py-4 text-[14px] text-[#546478] max-w-[220px] truncate" title={inv.memo}>
                          {inv.memo || <span className="text-[#C8D5E8]">—</span>}
                        </td>
                      );
                      default: return null;
                    }
                  })}
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <KebabMenu>
                      <KebabItem icon="edit" onSelect={() => navigate(`/invoices/${inv.id}`)}>Edit</KebabItem>
                      <KebabItem icon="content_copy">Duplicate</KebabItem>
                      <KebabItem icon="send">Send to Client</KebabItem>
                      <KebabSeparator />
                      <KebabItem icon="block">Void</KebabItem>
                      <KebabItem icon="archive" destructive>Archive</KebabItem>
                    </KebabMenu>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list — replaces the table below the md breakpoint */}
        <div className="md:hidden divide-y divide-[#EDF0F5]">
          {paginated.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>receipt</span>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No invoices found</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters or create a new invoice</div>
            </div>
          ) : paginated.map((inv) => {
            const overdueDays = inv.status === "Overdue" ? daysBetween(inv.dueDate, TODAY) : 0;
            return (
              <div
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className={`px-4 py-3.5 cursor-pointer active:bg-[#F0F4F9] ${selectedIds.has(inv.id) ? "bg-[#EBF0F8]" : "bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input type="checkbox" checked={selectedIds.has(inv.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { const s = new Set(selectedIds); e.target.checked ? s.add(inv.id) : s.delete(inv.id); setSelectedIds(s); }}
                      className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5] shrink-0" />
                    <span className="text-[14px] text-[#4A6FA5] truncate" style={{ fontWeight: 600 }}>{inv.number}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] shrink-0" style={{ fontWeight: 600, color: statusColors[inv.status].text, backgroundColor: statusColors[inv.status].bg }}>{inv.status}</span>
                </div>
                <div className="mt-1 ml-[26px] text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{inv.clientName}</div>
                <div className="mt-0.5 ml-[26px] text-[12px] text-[#8899AA]">
                  {fmtDate(inv.date)} · Due {fmtDate(inv.dueDate)}{overdueDays > 0 ? ` · ${overdueDays}d past due` : ""}
                </div>
                <div className="mt-1.5 ml-[26px] flex items-center gap-4 text-[12px] text-[#6B7280]">
                  <span>Total <span className="text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(inv.total)}</span></span>
                  <span>Balance <span className={inv.balance > 0 ? "text-[#EF4444]" : "text-[#22C55E]"} style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(inv.balance)}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination (Figma: "Rows per page: N   X-Y of Z   ‹ ›") */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-[#FAFBFC]">
          <div className="flex items-center gap-5 text-[13px] text-[#546478]">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white pl-2.5 pr-7 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5] cursor-pointer"
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit columns — toggle which columns the invoice table shows */}
      {editColsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditColsOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit columns</h3>
              <button onClick={() => setEditColsOpen(false)} aria-label="Close" className="text-[#9CA3AF] hover:text-[#1A2332]"><span className="material-icons" style={{ fontSize: "20px" }}>close</span></button>
            </div>
            <div className="px-5 py-2 max-h-[360px] overflow-y-auto">
              {INVOICES_COLS.map((c) => {
                const locked = c.key === "number";
                const checked = colVis.has(c.key);
                return (
                  <label key={c.key} className={`flex items-center gap-2.5 py-2 text-[14px] text-[#1A2332] ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input type="checkbox" checked={checked} disabled={locked}
                      onChange={() => setColVis((prev) => { const n = new Set(prev); if (n.has(c.key)) n.delete(c.key); else n.add(c.key); return n; })}
                      className="h-4 w-4 rounded border-[#CBD5E1] accent-[#4A6FA5]" />
                    <span>{c.label}</span>
                    {locked && <span className="text-[11px] text-[#9CA3AF]">always shown</span>}
                  </label>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-[#E5E7EB] flex justify-end">
              <button onClick={() => setEditColsOpen(false)} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Done</button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DndProvider>
  );
}
