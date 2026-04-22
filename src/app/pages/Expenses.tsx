import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

interface Expense {
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

const mockExpenses: Expense[] = [
  { id: "1", date: "Apr 5, 2026", category: "Materials", merchant: "Home Depot", amount: 1245.5, jobId: "J-1234", jobTitle: "HVAC Installation", invoiceId: "INV-0042", notes: "Supplies for commercial HVAC project", receipts: 2 },
  { id: "2", date: "Apr 4, 2026", category: "Fuel", merchant: "Shell Gas Station", amount: 85.3, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "Fleet vehicle fuel", receipts: 1 },
  { id: "3", date: "Apr 4, 2026", category: "Tools", merchant: "Grainger", amount: 567.89, jobId: "J-1236", jobTitle: "Equipment Repair", notes: "Replacement tools and equipment", receipts: 1 },
  { id: "4", date: "Apr 3, 2026", category: "Software", merchant: "Microsoft", amount: 299.0, notes: "Annual subscription renewal", receipts: 1 },
  { id: "5", date: "Apr 2, 2026", category: "Meals", merchant: "Starbucks", amount: 42.15, jobId: "J-1237", jobTitle: "Client Meeting", invoiceId: "INV-0045", notes: "Coffee with prospective client", receipts: 1 },
  { id: "6", date: "Apr 1, 2026", category: "Travel", merchant: "Delta Airlines", amount: 389.0, notes: "Flight to vendor conference", receipts: 1 },
  { id: "7", date: "Mar 31, 2026", category: "Materials", merchant: "Ferguson Plumbing", amount: 723.45, jobId: "J-1235", jobTitle: "Service Call", invoiceId: "INV-0043", notes: "PVC pipes and fittings", receipts: 2 },
];

const categoryColors: Record<string, string> = {
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

const categoryFilterOptions = ["All", "Materials", "Fuel", "Tools", "Software", "Meals", "Travel"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

export function Expenses() {
  const navigate = useNavigate();

  // Quick filters
  const [qfCategory, setQfCategory] = useState("All");
  const [qfDate, setQfDate] = useState("all");
  const [qfJob, setQfJob] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Kebab
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) setKebabOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = mockExpenses.filter((e) => {
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
    if (qfJob && e.jobId !== qfJob) return false;
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const uniqueJobs = Array.from(new Set(mockExpenses.filter((e) => e.jobId).map((e) => e.jobId!)));
  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id));

  return (
    <div className="p-6 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] text-[#1A2332] flex items-center gap-2" style={{ fontWeight: 700 }}>
          Expenses
          <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
            ({selectedIds.size > 0 ? `${filtered.length} records · ${selectedIds.size} selected` : `${filtered.length} records`})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/expenses/new")}
            className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3D5F8F] flex items-center gap-2 shadow-sm"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
            Create Expense
          </button>
          <div ref={kebabRef} className="relative">
            <button
              onClick={() => setKebabOpen(!kebabOpen)}
              className="w-9 h-9 flex items-center justify-center border border-[#DDE3EE] rounded-lg bg-white text-[#546478] hover:bg-[#EDF0F5] transition-colors"
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>more_vert</span>
            </button>
            {kebabOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] w-[210px] bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-30 py-1">
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>view_column</span>
                  Edit Columns
                </button>
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>swap_vert</span>
                  Change Status
                </button>
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>merge_type</span>
                  Manage Duplicates
                </button>
                <div className="h-px bg-[#EDF0F5] my-1" />
                {selectedIds.size > 0 && <>
                  <button onClick={() => { setSelectedIds(new Set()); setKebabOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>deselect</span>
                    Deselect All
                  </button>
                  <div className="h-px bg-[#EDF0F5] my-1" />
                </>}
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>file_upload</span>
                  Import
                </button>
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>file_download</span>
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="flex items-center gap-6 mb-6">
        <div className="bg-white border border-[#DDE3EE] rounded-lg px-5 py-4 min-w-[180px] h-[110.5px] flex flex-col justify-center">
          <div className="text-[11px] text-[#8899AA] uppercase tracking-wide mb-1">Total Expenses</div>
          <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 700 }}>
            ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8899AA]">{filtered.length} records</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#DDE3EE]">
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
          <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`h-8 px-3 border rounded-lg text-[13px] flex items-center gap-1.5 transition-colors ${
              filterOpen ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:bg-[#F5F7FA] bg-white"
            }`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>tune</span>
            Filter
          </button>
          <div className="flex-1" />
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[260px] h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white"
            />
          </div>
        </div>
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
                    className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                  />
                </th>
                {["Date", "Category", "Merchant", "Amount", "Job #", "Invoice #", "Notes", "Receipts"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#546478] uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <span className="material-icons text-[#DDE3EE] mb-2" style={{ fontSize: "40px" }}>receipt_long</span>
                    <p className="text-[14px] text-[#8899AA]">No expenses found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className={`border-t border-[#DDE3EE] hover:bg-[#F5F7FA] cursor-pointer transition-colors ${selectedIds.has(expense.id) ? "bg-[#EBF0F8]" : ""}`}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(expense.id)}
                        onChange={(e) => {
                          const s = new Set(selectedIds);
                          e.target.checked ? s.add(expense.id) : s.delete(expense.id);
                          setSelectedIds(s);
                        }}
                        className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#546478]">{expense.date}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: categoryColors[expense.category] || "#8899AA" }} />
                        <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#1A2332]">{expense.merchant}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                        ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expense.jobId ? (
                        <span
                          className="text-[13px] text-[#4A6FA5] hover:underline"
                          style={{ fontWeight: 500 }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${expense.jobId!.replace("J-", "")}`); }}
                        >
                          #{expense.jobId}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#8899AA]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {expense.invoiceId ? (
                        <span
                          className="text-[13px] text-[#4A6FA5] hover:underline"
                          style={{ fontWeight: 500 }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`); }}
                        >
                          #{expense.invoiceId}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#8899AA]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#546478] max-w-[200px] truncate block">{expense.notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {expense.receipts > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>attach_file</span>
                          <span className="text-[13px] text-[#546478]">{expense.receipts}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#8899AA]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDE3EE]">
          <div className="text-[13px] text-[#546478]">
            Showing <span style={{ fontWeight: 600 }}>1</span> to{" "}
            <span style={{ fontWeight: 600 }}>{filtered.length}</span> of{" "}
            <span style={{ fontWeight: 600 }}>{filtered.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-[#DDE3EE] rounded-md text-[#8899AA] hover:bg-[#F5F7FA] transition-colors disabled:opacity-40" disabled>
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-[#4A6FA5] rounded-md text-white text-[13px]" style={{ fontWeight: 600 }}>1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#DDE3EE] rounded-md text-[#8899AA] hover:bg-[#F5F7FA] transition-colors disabled:opacity-40" disabled>
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Side Panel */}
      {selectedExpense && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedExpense(null)} />
          <div className="fixed top-0 right-0 w-[440px] h-full bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE3EE]">
              <h2 className="text-[17px] text-[#1A2332]" style={{ fontWeight: 700 }}>Expense Details</h2>
              <button onClick={() => setSelectedExpense(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] transition-colors">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center mb-6">
                <div className="text-[32px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                  ${selectedExpense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: categoryColors[selectedExpense.category] || "#8899AA" }} />
                  <span className="text-[13px] text-[#546478]">{selectedExpense.category}</span>
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow label="Merchant" value={selectedExpense.merchant} />
                <DetailRow label="Date" value={selectedExpense.date} />
                <DetailRow label="Category" value={selectedExpense.category} />

                {selectedExpense.jobId && (
                  <div className="flex items-start justify-between py-2 border-b border-[#F0F2F5]">
                    <span className="text-[12px] text-[#8899AA] uppercase tracking-wide" style={{ fontWeight: 500 }}>Job</span>
                    <span className="text-[13px] text-[#4A6FA5] cursor-pointer hover:underline" style={{ fontWeight: 500 }}
                      onClick={() => { setSelectedExpense(null); navigate(`/jobs/${selectedExpense.jobId!.replace("J-", "")}`); }}>
                      #{selectedExpense.jobId} — {selectedExpense.jobTitle}
                    </span>
                  </div>
                )}

                {selectedExpense.invoiceId && (
                  <div className="flex items-start justify-between py-2 border-b border-[#F0F2F5]">
                    <span className="text-[12px] text-[#8899AA] uppercase tracking-wide" style={{ fontWeight: 500 }}>Invoice</span>
                    <span className="text-[13px] text-[#4A6FA5] cursor-pointer hover:underline" style={{ fontWeight: 500 }}
                      onClick={() => { setSelectedExpense(null); navigate(`/invoices/${selectedExpense.invoiceId!.replace("INV-", "")}`); }}>
                      #{selectedExpense.invoiceId}
                    </span>
                  </div>
                )}

                {selectedExpense.notes && (
                  <div className="py-2 border-b border-[#F0F2F5]">
                    <span className="text-[12px] text-[#8899AA] uppercase tracking-wide block mb-1" style={{ fontWeight: 500 }}>Notes</span>
                    <p className="text-[13px] text-[#1A2332]">{selectedExpense.notes}</p>
                  </div>
                )}

                <div className="py-2">
                  <span className="text-[12px] text-[#8899AA] uppercase tracking-wide block mb-2" style={{ fontWeight: 500 }}>Receipts ({selectedExpense.receipts})</span>
                  {selectedExpense.receipts > 0 ? (
                    <div className="space-y-2">
                      {Array.from({ length: selectedExpense.receipts }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-[#F5F7FA] rounded-lg">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>description</span>
                          <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>receipt_{i + 1}.jpg</span>
                          <span className="text-[11px] text-[#8899AA] ml-auto">View</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#8899AA]">No receipts attached</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DDE3EE]">
                <span className="text-[12px] text-[#8899AA] uppercase tracking-wide block mb-3" style={{ fontWeight: 500 }}>Activity</span>
                <div className="space-y-3">
                  <AuditItem icon="add_circle_outline" text="Expense created" time={selectedExpense.date + " at 10:30 AM"} user="John Smith" />
                  {selectedExpense.receipts > 0 && (
                    <AuditItem icon="attach_file" text={`${selectedExpense.receipts} receipt(s) attached`} time={selectedExpense.date + " at 10:32 AM"} user="John Smith" />
                  )}
                  {selectedExpense.jobId && (
                    <AuditItem icon="link" text={`Linked to Job #${selectedExpense.jobId}`} time={selectedExpense.date + " at 10:33 AM"} user="John Smith" />
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DDE3EE] flex items-center gap-3">
              {selectedExpense.invoiceId && (
                <button
                  onClick={() => { setSelectedExpense(null); navigate(`/invoices/${selectedExpense.invoiceId!.replace("INV-", "")}`); }}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#DDE3EE] text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>receipt</span>
                  View Invoice
                </button>
              )}
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#DDE3EE] text-[13px] text-[#546478] hover:bg-[#F5F7FA] transition-colors ml-auto" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                Edit
              </button>
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#FCA5A5] text-[13px] text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#F0F2F5]">
      <span className="text-[12px] text-[#8899AA] uppercase tracking-wide" style={{ fontWeight: 500 }}>{label}</span>
      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function AuditItem({ icon, text, time, user }: { icon: string; text: string; time: string; user: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="material-icons text-[#8899AA] mt-0.5" style={{ fontSize: "16px" }}>{icon}</span>
      <div>
        <p className="text-[13px] text-[#1A2332]">{text}</p>
        <p className="text-[11px] text-[#8899AA]">{user} · {time}</p>
      </div>
    </div>
  );
}
