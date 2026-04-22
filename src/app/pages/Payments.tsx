import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────
type PaymentMethod = "Cash" | "Check" | "Credit Card" | "Debit Card" | "Bank Transfer" | "Other";
type PaymentStatus = "Completed" | "Pending" | "Refunded";

interface Payment {
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
  note: string;
  createdBy: string;
  createdAt: string;
}

const statusColors: Record<PaymentStatus, { text: string; bg: string }> = {
  Completed: { text: "#22C55E", bg: "#DCFCE7" },
  Pending: { text: "#F59E0B", bg: "#FEF3C7" },
  Refunded: { text: "#8B5CF6", bg: "#EDE9FE" },
};

const methodIcons: Record<PaymentMethod, string> = {
  Cash: "payments",
  Check: "receipt",
  "Credit Card": "credit_card",
  "Debit Card": "credit_card",
  "Bank Transfer": "account_balance",
  Other: "more_horiz",
};

const timeFilters = [
  "All time", "Today", "Yesterday", "Last 7 days", "Last 30 days",
  "This month", "Last month", "This year", "Last year",
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockPayments: Payment[] = [
  { id: 1, date: "2026-03-10", amount: 5000.00, method: "Bank Transfer", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "INV-001", jobId: "JOB-003", note: "First installment", createdBy: "Marek Stroz", createdAt: "2026-03-10 14:22" },
  { id: 2, date: "2026-03-25", amount: 5502.00, method: "Check", status: "Completed", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "INV-001", jobId: "JOB-003", note: "Final payment", createdBy: "Marek Stroz", createdAt: "2026-03-25 11:45" },
  { id: 3, date: "2026-03-15", amount: 1000.00, method: "Credit Card", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 4, invoiceNumber: "INV-004", jobId: "JOB-006", note: "Partial payment", createdBy: "Marek Stroz", createdAt: "2026-03-15 13:30" },
  { id: 4, date: "2026-04-01", amount: 913.75, method: "Check", status: "Pending", clientName: "Mike Rodriguez", clientEmail: "mike.r@email.com", invoiceId: 5, invoiceNumber: "INV-005", jobId: "JOB-005", note: "", createdBy: "Marek Stroz", createdAt: "2026-04-01 09:15" },
  { id: 5, date: "2026-02-21", amount: 326.25, method: "Cash", status: "Completed", clientName: "Sarah Williams", clientEmail: "sarah.w@email.com", invoiceId: 6, invoiceNumber: "INV-006", jobId: "JOB-007", note: "Paid in full", createdBy: "Marek Stroz", createdAt: "2026-02-21 16:00" },
  { id: 6, date: "2026-03-28", amount: 200.00, method: "Credit Card", status: "Refunded", clientName: "Travis Jones", clientEmail: "travis.j@email.com", invoiceId: 1, invoiceNumber: "INV-001", jobId: "JOB-003", note: "Partial refund — overcharge adjustment", createdBy: "Marek Stroz", createdAt: "2026-03-28 10:20" },
  { id: 7, date: "2026-04-03", amount: 2800.00, method: "Bank Transfer", status: "Completed", clientName: "John Doe", clientEmail: "john.d@email.com", invoiceId: 2, invoiceNumber: "INV-002", jobId: "JOB-004", note: "Partial payment on overdue invoice", createdBy: "Marek Stroz", createdAt: "2026-04-03 11:00" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export function Payments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Quick filters
  const [qfStatus, setQfStatus] = useState("All");
  const [qfDate, setQfDate] = useState("All time");
  const [qfMethod, setQfMethod] = useState("All");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Kebab
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) setKebabOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Detail panel
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Summary
  const summary = useMemo(() => {
    const completed = mockPayments.filter(p => p.status === "Completed");
    const pending = mockPayments.filter(p => p.status === "Pending");
    const refunded = mockPayments.filter(p => p.status === "Refunded");
    return {
      totalCollected: completed.reduce((s, p) => s + p.amount, 0),
      completedCount: completed.length,
      pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
      pendingCount: pending.length,
      refundedTotal: refunded.reduce((s, p) => s + p.amount, 0),
      refundedCount: refunded.length,
      totalPayments: mockPayments.length,
    };
  }, []);

  // Filter
  const filtered = useMemo(() => {
    let result = [...mockPayments];
    if (qfStatus !== "All") result = result.filter(p => p.status === qfStatus);
    if (qfMethod !== "All") result = result.filter(p => p.method === qfMethod);
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
  }, [search, qfStatus, qfMethod]);

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
    <div className="p-6 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] text-[#1A2332] flex items-center gap-2" style={{ fontWeight: 700 }}>
          Payments
          <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
            ({selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
            Record Payment
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
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>payments</span>
                  Batch Payments
                </button>
                <button onClick={() => setKebabOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>link</span>
                  Assign to Invoices
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

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {summaryCards.map(c => (
          <button
            key={c.label}
            onClick={() => { setQfStatus(qfStatus === c.filterVal ? "All" : c.filterVal); setPage(1); }}
            className={`bg-white border rounded-lg px-4 py-4 text-center transition-all hover:shadow-sm ${qfStatus === c.filterVal ? "border-[#4A6FA5] shadow-sm" : "border-[#DDE3EE]"}`}
          >
            <div className="text-[11px] uppercase tracking-wider mb-2" style={{ fontWeight: 600, color: c.color }}>{c.label}</div>
            <div className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
            <div className="text-[12px] text-[#8899AA] mt-1">{c.sub}</div>
          </button>
        ))}
      </div>

      <div className={`flex gap-6`}>
        {/* Table */}
        <div className={`bg-white border border-[#DDE3EE] rounded-lg overflow-hidden ${selectedPayment ? "flex-1" : "w-full"}`}>
          {/* Filter bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#DDE3EE]">
            <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
              <option value="All">All statuses</option>
              {(["Completed", "Pending", "Refunded"] as PaymentStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "All time")}>
              {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={qfMethod} onChange={e => { setQfMethod(e.target.value); setPage(1); }} className={qfClass(qfMethod !== "All")}>
              <option value="All">All methods</option>
              {(["Cash", "Check", "Credit Card", "Debit Card", "Bank Transfer", "Other"] as PaymentMethod[]).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
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
                className="w-[240px] h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(paginated.map(p => p.id)));
                        else setSelectedIds(new Set());
                      }}
                      className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
                  </th>
                  {["Date", "Client", "Invoice", "Amount", "Method", "Status", "Note"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>credit_card_off</span>
                      <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No payments found</div>
                      <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters</div>
                    </td>
                  </tr>
                ) : paginated.map((p, idx) => {
                  const ss = statusColors[p.status];
                  const isSelected = selectedPayment?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer ${isSelected ? "bg-[#EBF0F8]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}
                    >
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={(e) => {
                            const s = new Set(selectedIds);
                            e.target.checked ? s.add(p.id) : s.delete(p.id);
                            setSelectedIds(s);
                          }}
                          className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]">{fmtDate(p.date)}</td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{p.clientName}</div>
                        <div className="text-[12px] text-[#8899AA]">{p.clientEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${p.invoiceId}`); }}
                          className="text-[13px] text-[#4A6FA5] hover:underline"
                          style={{ fontWeight: 500 }}
                        >
                          {p.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        <span className={p.status === "Refunded" ? "text-[#8B5CF6]" : "text-[#1A2332]"}>
                          {p.status === "Refunded" ? "−" : ""}${fmt(p.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="material-icons text-[#546478]" style={{ fontSize: "15px" }}>{methodIcons[p.method]}</span>
                          <span className="text-[13px] text-[#546478]">{p.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[12px]" style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#546478] max-w-[160px] truncate">{p.note || "—"}</td>
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

        {/* Detail Side Panel */}
        {selectedPayment && (
          <div className="w-[360px] bg-white border border-[#DDE3EE] rounded-lg overflow-hidden flex-shrink-0 flex flex-col">
            <div className="px-5 py-4 border-b border-[#DDE3EE] flex items-center justify-between">
              <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="w-7 h-7 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-5 border-b border-[#EDF0F5] text-center">
                <div className="text-[28px] text-[#1A2332] mb-2" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {selectedPayment.status === "Refunded" ? "−" : ""}${fmt(selectedPayment.amount)}
                </div>
                <span
                  className="px-3 py-1 rounded-full text-[12px]"
                  style={{ fontWeight: 600, color: statusColors[selectedPayment.status].text, backgroundColor: statusColors[selectedPayment.status].bg }}
                >
                  {selectedPayment.status}
                </span>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Date</div>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{fmtDate(selectedPayment.date)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Method</div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "15px" }}>{methodIcons[selectedPayment.method]}</span>
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{selectedPayment.method}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Client</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{selectedPayment.clientName}</div>
                  <div className="text-[12px] text-[#8899AA]">{selectedPayment.clientEmail}</div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Invoice</div>
                  <button
                    onClick={() => navigate(`/invoices/${selectedPayment.invoiceId}`)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#F5F7FA] border border-[#DDE3EE] rounded-lg hover:bg-[#EBF0F8] transition-colors w-full text-left"
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>receipt</span>
                    <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{selectedPayment.invoiceNumber}</span>
                    <span className="material-icons text-[#C8D5E8] ml-auto" style={{ fontSize: "16px" }}>open_in_new</span>
                  </button>
                </div>

                {selectedPayment.jobId && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Job</div>
                    <button
                      onClick={() => navigate(`/jobs/${selectedPayment.jobId?.replace("JOB-", "")}`)}
                      className="flex items-center gap-2 px-3 py-2 bg-[#F5F7FA] border border-[#DDE3EE] rounded-lg hover:bg-[#EBF0F8] transition-colors w-full text-left"
                    >
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>work</span>
                      <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{selectedPayment.jobId}</span>
                      <span className="material-icons text-[#C8D5E8] ml-auto" style={{ fontSize: "16px" }}>open_in_new</span>
                    </button>
                  </div>
                )}

                {selectedPayment.note && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Note</div>
                    <div className="text-[13px] text-[#546478] bg-[#F9FAFB] border border-[#EDF0F5] rounded-lg px-3 py-2">{selectedPayment.note}</div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-[#EDF0F5]">
                <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-3" style={{ fontWeight: 600 }}>Audit Trail</div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>add_circle</span>
                    </div>
                    <div>
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Payment recorded</div>
                      <div className="text-[12px] text-[#8899AA]">by {selectedPayment.createdBy}</div>
                      <div className="text-[11px] text-[#B0BEC5] mt-0.5">{selectedPayment.createdAt}</div>
                    </div>
                  </div>
                  {selectedPayment.status === "Completed" && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-[#22C55E]" style={{ fontSize: "14px" }}>check_circle</span>
                      </div>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Payment completed</div>
                        <div className="text-[12px] text-[#8899AA]">Invoice balance updated</div>
                        <div className="text-[11px] text-[#B0BEC5] mt-0.5">{selectedPayment.createdAt}</div>
                      </div>
                    </div>
                  )}
                  {selectedPayment.status === "Refunded" && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-[#8B5CF6]" style={{ fontSize: "14px" }}>undo</span>
                      </div>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Payment refunded</div>
                        <div className="text-[12px] text-[#8899AA]">Invoice balance adjusted</div>
                        <div className="text-[11px] text-[#B0BEC5] mt-0.5">{selectedPayment.createdAt}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC] flex items-center gap-2">
              <button
                onClick={() => navigate(`/invoices/${selectedPayment.invoiceId}`)}
                className="flex-1 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center justify-center gap-1.5"
                style={{ fontWeight: 600 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>receipt</span>
                View Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
