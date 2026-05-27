import { useState } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { CreateActionButton } from "../components/ui/create-action-button";
import { AdvancedFilterActions, AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";

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

const EXPENSES_COLS = [
  { key: "date", label: "Date" },
  { key: "category", label: "Category" },
  { key: "merchant", label: "Vendor" },
  { key: "amount", label: "Amount" },
  { key: "jobId", label: "Job #" },
  { key: "invoiceId", label: "Invoice #" },
  { key: "notes", label: "Notes" },
] as const;

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

  // Quick filters
  const [qfCategory, setQfCategory] = useState("All");
  const [qfDate, setQfDate] = useState("all");
  const [qfJob, setQfJob] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [receiptFilter, setReceiptFilter] = useState("All");
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    if (qfJob && e.jobId !== qfJob) return false;
    if (dateFrom && dateValue && dateValue < dateFrom) return false;
    if (dateTo && dateValue && dateValue > dateTo) return false;
    if (amountMin && e.amount < Number(amountMin)) return false;
    if (amountMax && e.amount > Number(amountMax)) return false;
    if (receiptFilter === "With receipts" && e.receipts <= 0) return false;
    if (receiptFilter === "Missing receipts" && e.receipts > 0) return false;
    if (invoiceFilter === "Linked to invoice" && !e.invoiceId) return false;
    if (invoiceFilter === "No invoice" && e.invoiceId) return false;
    return true;
  });

  const advancedActive = Boolean(dateFrom || dateTo || amountMin || amountMax || receiptFilter !== "All" || invoiceFilter !== "All");
  const resetAdvancedFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setReceiptFilter("All");
    setInvoiceFilter("All");
  };

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const uniqueJobs = Array.from(new Set(expenses.filter((e) => e.jobId).map((e) => e.jobId!)));
  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id));

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Expenses"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
      />

      {/* Summary Card */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Card className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[#546478]">Total Expenses</div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#FEF2F2" }}>
            <span className="material-icons" style={{ fontSize: "18px", color: "#DC2626" }}>receipt_long</span>
          </div>
        </Card>
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
            {categoryFilterOptions.map(c => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
          </select>
          <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "all")}>
            <option value="all">All time</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_90">Last 90 days</option>
          </select>
          <select value={qfJob} onChange={e => setQfJob(e.target.value)} className={qfClass(qfJob !== "")}>
            <option value="">All jobs</option>
            {uniqueJobs.map(j => <option key={j} value={j}>#{j}</option>)}
          </select>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`h-8 px-3 border rounded-lg text-[13px] flex items-center gap-1.5 transition-colors ${
              filterOpen || advancedActive ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA] bg-white"
            }`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>filter_alt</span>
            Filter{advancedActive ? " *" : ""}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <CreateActionButton onClick={() => navigate("/expenses/new")}>
              Create Expense
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
          <AdvancedFilterPanel>
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
            <AdvancedFilterField label="Invoice">
              <select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value)} className={advancedSelectClass}>
                <option>All</option>
                <option>Linked to invoice</option>
                <option>No invoice</option>
              </select>
            </AdvancedFilterField>
            <AdvancedFilterActions>
              <button type="button" onClick={resetAdvancedFilters} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#546478] hover:bg-[#F5F7FA]">
                Reset
              </button>
            </AdvancedFilterActions>
          </AdvancedFilterPanel>
        )}
        <SelectionBar
          count={selectedIds.size}
          onDeselect={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Inactivate selected",
              icon: "block",
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
                filtered.map((expense) => (
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
                        case "date": return (
                          <td key={col.key} className="px-4 py-4">
                            <span className="text-[14px] text-[#546478]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{expense.date}</span>
                          </td>
                        );
                        case "category": return (
                          <td key={col.key} className="px-4 py-4">
                            <span
                              className="inline-flex items-center justify-center min-w-[90px] rounded-md px-2.5 py-1 text-[12px] whitespace-nowrap"
                              style={{
                                background: expenseCategoryBg[expense.category] || "#F3F4F6",
                                color: categoryColors[expense.category] || "#8899AA",
                                fontWeight: 600,
                              }}
                            >
                              {expense.category}
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
                        case "invoiceId": return (
                          <td key={col.key} className="px-4 py-4">
                            {expense.invoiceId ? (
                              <span
                                className="text-[14px] text-[#4A6FA5] hover:underline"
                                style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`); }}
                              >
                                #{expense.invoiceId}
                              </span>
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
                        {expense.invoiceId && (
                          <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`)}>Open invoice</KebabItem>
                        )}
                        <KebabItem icon="edit">Edit</KebabItem>
                        <KebabSeparator />
                        <KebabItem icon="delete_outline" destructive>Delete</KebabItem>
                      </KebabMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
          <div className="text-[13px] text-[#546478]">
            Showing <span style={{ fontWeight: 600 }}>1</span> to{" "}
            <span style={{ fontWeight: 600 }}>{filtered.length}</span> of{" "}
            <span style={{ fontWeight: 600 }}>{filtered.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-md text-[#8899AA] hover:bg-[#F5F7FA] transition-colors disabled:opacity-40" disabled>
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-[#4A6FA5] rounded-md text-white text-[13px]" style={{ fontWeight: 600 }}>1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-md text-[#8899AA] hover:bg-[#F5F7FA] transition-colors disabled:opacity-40" disabled>
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>
    </DndProvider>
  );
}
