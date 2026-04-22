import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus = "Unsent" | "Pending" | "Approved" | "Declined" | "Won" | "Archived";

interface Estimate {
  id: number;
  estimateNumber: string;
  estimateName: string;
  clientName: string;
  clientEmail: string;
  createdDate: string;
  addedBy: string;
  amount: number;
  status: EstimateStatus;
  source: string;
  depositDue: number;
  updatedDate?: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const statusColors: Record<EstimateStatus, string> = {
  Unsent: "#A855F7",
  Pending: "#F59E0B",
  Approved: "#3B82F6",
  Declined: "#EF4444",
  Won: "#22C55E",
  Archived: "#9CA3AF",
};

const timeFilters = [
  "All time", "Custom", "Today", "Yesterday", "Last 7 days", "Last 14 days",
  "Last 30 days", "Last month", "This month", "This year", "Last year",
  "This week (Sun-Today)", "This week (Mon-Today)", "Last week (Sun-Sat)",
  "Last week (Mon-Sun)", "Last business week (Mon-Fri)",
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockClients: Client[] = [
  { id: 1, name: "Travis Jones", email: "cerb04@yahoo.com", phone: "(863) 225-3254", address: "8377 Standish Bend Dr Unit 1, Tampa, Florida 33615" },
  { id: 2, name: "John Doe", email: "cerb04@yahoo.com", phone: "(555) 123-4567", address: "1250 NW 24th St, Miami, Florida 33142" },
  { id: 3, name: "Sarah Williams", email: "sarah.w@gmail.com", phone: "(407) 555-0198", address: "4521 Pine Grove Ln, Orlando, Florida 32801" },
  { id: 4, name: "Mike Rodriguez", email: "mike.r@outlook.com", phone: "(305) 555-0234", address: "789 Ocean Drive, Fort Lauderdale, Florida 33301" },
];

const initialEstimates: Estimate[] = [
  { id: 1, estimateNumber: "1", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", amount: 0, status: "Unsent", source: "", depositDue: 0 },
  { id: 2, estimateNumber: "8-1", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", amount: 0, status: "Unsent", source: "Job - 8", depositDue: 0 },
  { id: 3, estimateNumber: "4-3", estimateName: "Option C", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", amount: 0, status: "Unsent", source: "Job - 4", depositDue: 0 },
  { id: 4, estimateNumber: "4-2", estimateName: "Option B", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", amount: 0, status: "Unsent", source: "Job - 4", depositDue: 0 },
  { id: 5, estimateNumber: "4-1", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", amount: 3500, status: "Won", source: "Job - 4", depositDue: 0, updatedDate: "Mar 02, 2026" },
  { id: 6, estimateNumber: "3-1", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", amount: 10502, status: "Won", source: "Job - 3", depositDue: 500 },
  { id: 7, estimateNumber: "5-1", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", amount: 850, status: "Pending", source: "Job - 5", depositDue: 0 },
  { id: 8, estimateNumber: "6-1", estimateName: "Electrical Upgrade", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Feb 23, 2026", addedBy: "Marek Fie", amount: 2200, status: "Approved", source: "Job - 6", depositDue: 200 },
  { id: 9, estimateNumber: "7-1", estimateName: "Roof Inspection", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Fri Feb 20, 2026", addedBy: "Marek Ste", amount: 350, status: "Declined", source: "Job - 7", depositDue: 0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function StatusDot({ status }: { status: EstimateStatus }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: statusColors[status] }} />;
}

// ─── Status Dropdown (inline in table) ──────────────────────────────────────
function InlineStatusSelect({ status, onChange }: { status: EstimateStatus; onChange: (s: EstimateStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allStatuses: EstimateStatus[] = ["Unsent", "Pending", "Approved", "Declined", "Won", "Archived"];

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 hover:bg-[#F5F7FA] rounded px-1.5 py-1 transition-colors">
        <StatusDot status={status} />
        <span className="text-[13px]" style={{ fontWeight: 500 }}>{status}</span>
        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+2px)] w-[180px] bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-40 py-1">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors ${
                s === status ? "bg-[#4A6FA5] text-white" : "text-[#1A2332] hover:bg-[#F5F7FA]"
              }`}
              style={{ fontWeight: s === status ? 600 : 400 }}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s === status ? "#fff" : statusColors[s] }} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export function Estimates() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<Estimate[]>(initialEstimates);

  // Quick filters
  const [qfStatus, setQfStatus] = useState<"All" | EstimateStatus>("All");
  const [qfDate, setQfDate] = useState("All time");
  const [qfSource, setQfSource] = useState("All");

  const [search, setSearch] = useState("");
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

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: number[] } | null>(null);

  // Stats
  const statusCounts = useMemo(() => {
    const all: EstimateStatus[] = ["Unsent", "Pending", "Approved", "Declined", "Won", "Archived"];
    return all.map(s => ({
      status: s,
      count: estimates.filter(e => e.status === s).length,
      worth: estimates.filter(e => e.status === s).reduce((sum, e) => sum + e.amount, 0),
    }));
  }, [estimates]);

  const uniqueSources = useMemo(() =>
    ["All", ...Array.from(new Set(estimates.filter(e => e.source).map(e => e.source)))],
    [estimates]
  );

  // Filtered
  const filtered = useMemo(() => {
    let result = [...estimates];
    if (qfStatus !== "All") result = result.filter(e => e.status === qfStatus);
    if (qfSource !== "All") result = result.filter(e => e.source === qfSource);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.estimateNumber.toLowerCase().includes(q) ||
        e.estimateName.toLowerCase().includes(q) ||
        e.clientName.toLowerCase().includes(q) ||
        e.clientEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [estimates, qfStatus, qfSource, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const allSelected = paginated.length > 0 && paginated.every(e => selectedIds.has(e.id));

  const handleStatusChange = (id: number, newStatus: EstimateStatus) => {
    setEstimates(prev => prev.map(e => e.id === id ? { ...e, status: newStatus, updatedDate: "Apr 06, 2026" } : e));
  };

  const handleBulkDelete = () => {
    setEstimates(prev => prev.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setDeleteConfirm(null);
  };

  const filteredClients = mockClients.filter(c =>
    !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)
  );

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] text-[#1A2332] flex items-center gap-2" style={{ fontWeight: 700 }}>
          Estimates
          <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
            ({selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
            Create Estimate
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
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>send</span>
                  Resend Estimate
                </button>
                <div className="h-px bg-[#EDF0F5] my-1" />
                {selectedIds.size > 0 && <>
                  <button onClick={() => { setSelectedIds(new Set()); setKebabOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>deselect</span>
                    Deselect All
                  </button>
                  <button onClick={() => { setKebabOpen(false); setDeleteConfirm({ ids: Array.from(selectedIds) }); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#DC2626] hover:bg-[#FEE2E2]">
                    <span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>archive</span>
                    Archive Selected
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

      {/* Status Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {statusCounts.map(({ status, count, worth }) => (
          <button
            key={status}
            onClick={() => { setQfStatus(qfStatus === status ? "All" : status); setPage(1); }}
            className={`bg-white border rounded-lg px-4 py-4 text-center transition-all hover:shadow-sm ${
              qfStatus === status ? "border-[#4A6FA5] ring-1 ring-[#4A6FA5]/20" : "border-[#DDE3EE]"
            }`}
          >
            <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{status}</div>
            <div className="text-[12px] text-[#546478] mt-0.5">{count} · ${fmt(worth)}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#DDE3EE]">
          <select value={qfStatus} onChange={e => { setQfStatus(e.target.value as any); setPage(1); }} className={qfClass(qfStatus !== "All")}>
            <option value="All">All statuses</option>
            {(["Unsent","Pending","Approved","Declined","Won","Archived"] as EstimateStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "All time")}>
            {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={qfSource} onChange={e => { setQfSource(e.target.value); setPage(1); }} className={qfClass(qfSource !== "All")}>
            {uniqueSources.map(s => <option key={s} value={s}>{s === "All" ? "All sources" : s}</option>)}
          </select>
          <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
          <button className="h-8 px-3 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5 bg-white" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>tune</span>
            Filter
          </button>
          <div className="flex-1" />
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-[260px] h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginated.map(e => e.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                  />
                </th>
                {["Estimate", "Estimate Name", "Client", "Created", "Amount", "Status", "Source", "Deposit due"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>description</span>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No estimates found</div>
                    <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters or create a new estimate</div>
                  </td>
                </tr>
              ) : paginated.map((est, idx) => (
                <tr
                  key={est.id}
                  className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors cursor-pointer ${
                    selectedIds.has(est.id) ? "bg-[#EBF0F8]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"
                  }`}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(est.id)}
                      onChange={(e) => {
                        const s = new Set(selectedIds);
                        e.target.checked ? s.add(est.id) : s.delete(est.id);
                        setSelectedIds(s);
                      }}
                      className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                    />
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }} onClick={() => navigate(`/estimates/${est.id}`)}>{est.estimateNumber}</td>
                  <td className="px-3 py-3 text-[13px] text-[#546478]" onClick={() => navigate(`/estimates/${est.id}`)}>{est.estimateName || ""}</td>
                  <td className="px-3 py-3" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{est.clientName}</div>
                    <div className="text-[12px] text-[#8899AA]">{est.clientEmail}</div>
                  </td>
                  <td className="px-3 py-3" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[13px] text-[#1A2332]">{est.createdDate}</div>
                    <div className="text-[12px] text-[#8899AA]">Added by {est.addedBy}</div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }} onClick={() => navigate(`/estimates/${est.id}`)}>${fmt(est.amount)}</td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <InlineStatusSelect
                      status={est.status}
                      onChange={(s) => handleStatusChange(est.id, s)}
                    />
                    {est.updatedDate && (
                      <div className="text-[11px] text-[#8899AA] mt-0.5 pl-1.5">Updated: {est.updatedDate}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#546478]" onClick={() => navigate(`/estimates/${est.id}`)}>{est.source}</td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }} onClick={() => navigate(`/estimates/${est.id}`)}>${fmt(est.depositDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <span className="text-[13px] text-[#546478]">
            Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} results
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

      {/* ═══ Create Estimate Modal ═══ */}
      {createModalOpen && (
        <ModalBackdrop onClose={() => setCreateModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]">
            <div className="flex justify-end p-4 pb-0">
              <button onClick={() => setCreateModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
              </button>
            </div>
            <div className="px-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "32px" }}>description</span>
              </div>
              <h2 className="text-[20px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>Create Estimate</h2>
              <p className="text-[14px] text-[#546478] mb-6">Before we proceed, please select a client</p>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Name, email or phone"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full h-11 px-4 pr-10 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                  autoFocus
                />
                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>search</span>
              </div>

              {clientSearch && (
                <div className="border border-[#DDE3EE] rounded-lg max-h-[200px] overflow-y-auto mb-4">
                  {filteredClients.length === 0 ? (
                    <div className="px-4 py-6 text-[13px] text-[#546478]">No clients found</div>
                  ) : filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCreateModalOpen(false);
                        setClientSearch("");
                        navigate(`/estimates/new?client=${encodeURIComponent(c.name)}&email=${encodeURIComponent(c.email)}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F7FA] border-b border-[#EDF0F5] last:border-b-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>person</span>
                      </div>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.name}</div>
                        <div className="text-[12px] text-[#8899AA]">{c.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 justify-center text-[13px] text-[#546478]">
                <span>— OR —</span>
              </div>
              <button
                onClick={() => { setCreateModalOpen(false); navigate("/clients/new"); }}
                className="mt-3 text-[14px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                + Create client
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <ModalBackdrop onClose={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>warning</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Archive estimates?</h3>
            </div>
            <p className="text-[14px] text-[#546478] mb-6">
              Archive {deleteConfirm.ids.length} estimate(s)? They can be restored later.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Archive</button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}
