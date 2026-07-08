import { useState } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { SelectionBar } from "../components/ui/selection-bar";
import { PaginationFooter } from "../components/ui/pagination-footer";
import { CreateActionButton } from "../components/ui/create-action-button";
import { AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";

export interface Expense {
  id: string;
  date: string;
  category: string;
  merchant: string;
  amount: number;
  jobId?: string;
  jobTitle?: string;
  invoiceId?: string;
  notes?: string;
  receipts: number;
}

export const mockExpenses: Expense[] = [
  { id: "1", date: "Apr 5, 2026", category: "Materials", merchant: "Home Depot", amount: 1245.5, jobId: "J-1234", jobTitle: "HVAC Installation", invoiceId: "INV-0042", notes: "Supplies for commercial HVAC project", receipts: 2 },
  { id: "2", date: "Apr 4, 2026", category: "Fuel", merchant: "Shell Gas Station", amount: 85.3, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "Fleet vehicle fuel", receipts: 1 },
  { id: "3", date: "Apr 4, 2026", category: "Tools", merchant: "Grainger", amount: 567.89, jobId: "J-1236", jobTitle: "Equipment Repair", notes: "Replacement tools and equipment", receipts: 1 },
  { id: "4", date: "Apr 3, 2026", category: "Software", merchant: "Microsoft", amount: 299.0, notes: "Annual subscription renewal", receipts: 1 },
  { id: "5", date: "Apr 2, 2026", category: "Meals", merchant: "Starbucks", amount: 42.15, jobId: "J-1237", jobTitle: "Client Meeting", invoiceId: "INV-0045", notes: "Coffee with prospective client", receipts: 1 },
  { id: "6", date: "Apr 1, 2026", category: "Travel", merchant: "Delta Airlines", amount: 389.0, notes: "Flight to vendor conference", receipts: 1 },
  { id: "7", date: "Mar 31, 2026", category: "Materials", merchant: "Ferguson Plumbing", amount: 723.45, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "PVC pipes and fittings", receipts: 2 },
];

export const expenseCategoryColors: Record<string, string> = {
  Materials: "#4A6FA5",
  Fuel: "#059669",
  Tools: "#D97706",
  Software: "#7C3AED",
  Meals: "#DC2626",
  Travel: "#0891B2",
  Subcontractor: "#6D28D9",
  "Office Supplies": "#2563EB",
  "Equipment Rental": "#EA580C",
  Other: "#8899AA",
};
const expenseCategoryBg: Record<string, string> = {
  Materials: "#EBF0F8",
  Fuel: "#DCFCE7",
  Tools: "#FEF3C7",
  Software: "#EDE9FE",
  Meals: "#FEE2E2",
  Travel: "#CFFAFE",
  Subcontractor: "#EDE9FE",
  "Office Supplies": "#DBEAFE",
  "Equipment Rental": "#FFEDD5",
  Other: "#F3F4F6",
};
const categoryColors = expenseCategoryColors;

const categoryFilterOptions = ["All", "Materials", "Fuel", "Tools", "Software", "Meals", "Travel"];

// Column order mirrors the Figma expenses table (1139:93081):
// Number · Category · Vendor · Job · Created date · Amount · Note.
const EXPENSES_COLS = [
  { key: "number", label: "Number" },
  { key: "category", label: "Category" },
  { key: "merchant", label: "Vendor" },
  { key: "jobId", label: "Job" },
  { key: "date", label: "Created date" },
  { key: "amount", label: "Amount" },
  { key: "notes", label: "Note" },
] as const;

// Display number in the design's E-#### format, derived from the record id.
const expenseNumber = (id: string) => `E-${1233 + Number(id)}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

function toDateInputValue(date: string) {
  const parsed = new Date(`${date} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function matchesDatePreset(date: string, preset: string) {
  if (preset === "all") return true;
  const value = toDateInputValue(date);
  if (!value) return true;
  if (preset === "this_month") return value >= "2026-04-01" && value <= "2026-04-30";
  if (preset === "last_month") return value >= "2026-03-01" && value <= "2026-03-31";
  if (preset === "last_90") return value >= "2026-01-05" && value <= "2026-04-05";
  return true;
}

export function Expenses() {
  const navigate = useNavigate();
  const [cols, moveCol] = useDraggableColumns([...EXPENSES_COLS]);
  const [expenses, setExpenses] = useState(mockExpenses);

  // Quick filters (Figma 1139:93081: Categories + Date; job linkage lives in
  // the advanced Filter panel)
  const [qfCategory, setQfCategory] = useState("All");
  const [qfDate, setQfDate] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [receiptFilter, setReceiptFilter] = useState("All");
  // Expenses link to a JOB (job costing), not an invoice (Marek, Jun 11). The
  // advanced filter buckets by job linkage; the quick filter picks a specific job.
  const [jobLinkFilter, setJobLinkFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = expenses.filter((e) => {
    const dateValue = toDateInputValue(e.date);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !e.merchant.toLowerCase().includes(q) &&
        !e.category.toLowerCase().includes(q) &&
        !(e.notes || "").toLowerCase().includes(q) &&
        !(e.jobId || "").toLowerCase().includes(q)
      ) return false;
    }
    if (qfCategory !== "All" && e.category !== qfCategory) return false;
    if (!matchesDatePreset(e.date, qfDate)) return false;
    if (dateFrom && dateValue && dateValue < dateFrom) return false;
    if (dateTo && dateValue && dateValue > dateTo) return false;
    if (amountMin && e.amount < Number(amountMin)) return false;
    if (amountMax && e.amount > Number(amountMax)) return false;
    if (receiptFilter === "With receipts" && e.receipts <= 0) return false;
    if (receiptFilter === "Missing receipts" && e.receipts > 0) return false;
    if (jobLinkFilter === "Linked to job" && !e.jobId) return false;
    if (jobLinkFilter === "Unlinked" && e.jobId) return false;
    return true;
  });

  const activeFilterCount = [dateFrom, dateTo, amountMin, amountMax, receiptFilter !== "All", jobLinkFilter !== "All"].filter(Boolean).length;
  const advancedActive = activeFilterCount > 0;
  const resetAdvancedFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setReceiptFilter("All");
    setJobLinkFilter("All");
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  // ── KPI metrics ───────────────────────────────────────────────────────────
  // Computed off `filtered` so they reflect whatever the user has filtered to.
  const thisMonthTotal = filtered
    .filter((e) => matchesDatePreset(e.date, "this_month"))
    .reduce((s, e) => s + e.amount, 0);
  const avgPerExpense = filtered.length > 0 ? totalAmount / filtered.length : 0;
  const billableCount = filtered.filter((e) => e.jobId).length;
  const billablePct = filtered.length > 0 ? Math.round((billableCount / filtered.length) * 100) : 0;
  // Top category by spend
  const categoryTotals = filtered.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategoryEntry?.[0] ?? "—";
  const topCategoryAmount = topCategoryEntry?.[1] ?? 0;
  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id));

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Expenses"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
      />

      {/* KPI strip (3 tiles — "Top category" card removed per Marek) */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard
          value={`$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Total expenses"
          sub={`${filtered.length} record${filtered.length === 1 ? "" : "s"}`}
          data={[120, 180, 140, 260, 220, 310, 280]}
          sparklineColor="#DC2626"
        />
        <StatCard
          value={`$${thisMonthTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="This month"
          sub="So far this period"
          data={[40, 90, 60, 110, 95, 140, 130]}
          sparklineColor="#D97706"
        />
        <StatCard
          value={`$${avgPerExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Avg per expense"
          sub="Across filtered set"
          data={[200, 260, 220, 300, 250, 280, 320]}
          sparklineColor="#4A6FA5"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[220px] h-9 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
          </div>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <select value={qfCategory} onChange={e => setQfCategory(e.target.value)} className={qfClass(qfCategory !== "All")}>
            {categoryFilterOptions.map(c => <option key={c} value={c}>{c === "All" ? "Categories: All" : c}</option>)}
          </select>
          <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "all")}>
            <option value="all">Date: All time</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_90">Last 90 days</option>
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
            <CreateActionButton onClick={() => navigate("/expenses/new")}>
              Create expense
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
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Date to">
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Amount min">
              <input type="number" min="0" placeholder="$0" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Amount max">
              <input type="number" min="0" placeholder="Any" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Receipts">
              <select value={receiptFilter} onChange={(e) => setReceiptFilter(e.target.value)} className={advancedSelectClass}>
                <option>All</option>
                <option>With receipts</option>
                <option>Missing receipts</option>
              </select>
            </AdvancedFilterField>
            <AdvancedFilterField label="Link to job">
              <select value={jobLinkFilter} onChange={(e) => setJobLinkFilter(e.target.value)} className={advancedSelectClass}>
                <option>All</option>
                <option>Linked to job</option>
                <option>Unlinked</option>
              </select>
            </AdvancedFilterField>
          </AdvancedFilterPanel>
        )}
        <SelectionBar
          count={selectedIds.size}
          onDeselect={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Archive selected",
              icon: "archive",
              destructive: true,
              onClick: () => {
                setExpenses(prev => prev.filter(e => !selectedIds.has(e.id)));
                setSelectedIds(new Set());
              },
            },
            { label: "Export", icon: "file_download", onClick: () => {} },
          ]}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F7FA]">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filtered.map(ex => ex.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                  />
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <span className="material-icons text-[#E5E7EB] mb-2" style={{ fontSize: "40px" }}>receipt_long</span>
                    <p className="text-[14px] text-[#8899AA]">No expenses found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    className={`border-t border-[#E5E7EB] hover:bg-[#F5F7FA] cursor-pointer transition-colors ${selectedIds.has(expense.id) ? "bg-[#EBF0F8]" : ""}`}
                  >
                    <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(expense.id)}
                        onChange={(e) => {
                          const s = new Set(selectedIds);
                          e.target.checked ? s.add(expense.id) : s.delete(expense.id);
                          setSelectedIds(s);
                        }}
                        className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                      />
                    </td>
                    {cols.map(col => {
                      switch (col.key) {
                        case "number": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#4A6FA5] hover:underline" style={{ fontFamily: "Geist", fontWeight: 500, lineHeight: "20px" }}>{expenseNumber(expense.id)}</span>
                          </td>
                        );
                        case "date": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#546478]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{expense.date}</span>
                          </td>
                        );
                        case "category": return (
                          <td key={col.key} className="px-4 py-4">
                            {/* Colored dot + label (Figma 1139:93081) */}
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: categoryColors[expense.category] || "#8899AA" }} />
                              <span className="text-[12px]" style={{ fontWeight: 500, lineHeight: "16px", color: categoryColors[expense.category] || "#8899AA" }}>{expense.category}</span>
                            </span>
                          </td>
                        );
                        case "merchant": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{expense.merchant}</span>
                          </td>
                        );
                        case "amount": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>
                              ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </td>
                        );
                        case "jobId": return (
                          <td key={col.key} className="px-4 py-4">
                            {expense.jobId ? (
                              <div
                                className="cursor-pointer text-left"
                                onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${expense.jobId!.replace("J-", "")}`); }}
                              >
                                <div className="text-[14px] text-[#4A6FA5] hover:underline" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{expense.jobId}</div>
                                {expense.jobTitle && <div className="text-[13px] text-[#546478]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "18px" }}>{expense.jobTitle}</div>}
                              </div>
                            ) : (
                              <span className="text-[14px] text-[#8899AA]" style={{ fontFamily: "Geist", fontWeight: 400 }}>—</span>
                            )}
                          </td>
                        );
                        case "notes": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#546478] max-w-[200px] truncate block" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{expense.notes || "—"}</span>
                          </td>
                        );
                        case "receipts": return (
                          <td key={col.key} className="px-4 py-4">
                            {expense.receipts > 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>attach_file</span>
                                <span className="text-[13px] text-[#546478]">{expense.receipts}</span>
                              </div>
                            ) : (
                              <span className="text-[13px] text-[#8899AA]">—</span>
                            )}
                          </td>
                        );
                        default: return null;
                      }
                    })}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <KebabMenu>
                        <KebabItem icon="visibility" onSelect={() => navigate(`/expenses/${expense.id}`)}>View details</KebabItem>
                        {/* No "Open invoice" — expenses link to a JOB only (Marek, Jun 11). */}
                        <KebabItem icon="edit">Edit</KebabItem>
                        <KebabSeparator />
                        <KebabItem icon="archive" destructive>Archive</KebabItem>
                      </KebabMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter page={page} perPage={perPage} total={filtered.length} onPageChange={setPage} onPerPageChange={setPerPage} />
      </div>

    </div>
    </DndProvider>
  );
}
