import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus = "Unsent" | "Pending" | "Approved" | "Declined" | "Won" | "Archived" | "Drafted" | "Accepted" | "Sent";

interface Estimate {
  id: number;
  estimateNumber: string;
  estimateName: string;
  clientName: string;
  clientEmail: string;
  createdDate: string;
  addedBy: string;
  option?: string;
  amount: number;
  status: EstimateStatus;
  job?: string;
  sentDate?: string;
  expirationDate?: string;
  teamMember?: string;
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

const primaryStatuses: EstimateStatus[] = ["Unsent", "Pending", "Approved", "Declined", "Won", "Archived"];
const otherStatuses: EstimateStatus[] = ["Drafted", "Accepted", "Sent"];

const statusColors: Record<EstimateStatus, string> = {
  Unsent: "#A855F7",
  Pending: "#F59E0B",
  Approved: "#3B82F6",
  Declined: "#EF4444",
  Won: "#22C55E",
  Archived: "#9CA3AF",
  Drafted: "#D97706",
  Accepted: "#15803D",
  Sent: "#1E40AF",
};

const statusBg: Record<EstimateStatus, string> = {
  Unsent: "#F3E8FF",
  Pending: "#FEF3C7",
  Approved: "#DBEAFE",
  Declined: "#FEE2E2",
  Won: "#DCFCE7",
  Archived: "#F3F4F6",
  Drafted: "#FEF9C3",
  Accepted: "#D1FAE5",
  Sent: "#EFF6FF",
};

const avatarColors = ["#4A6FA5", "#3B82F6", "#8B5CF6", "#D97706", "#10B981", "#DC2626"];
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

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
  { id: 1, estimateNumber: "1", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", option: "", amount: 0, status: "Unsent", job: "", sentDate: "", expirationDate: "", teamMember: "Marek Stroz", source: "", depositDue: 0 },
  { id: 2, estimateNumber: "8-1", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", option: "1", amount: 0, status: "Unsent", job: "Job - 8", sentDate: "", expirationDate: "Apr 13, 2026", teamMember: "Marek Stroz", source: "Job - 8", depositDue: 0 },
  { id: 3, estimateNumber: "4-3", estimateName: "Option C", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "C", amount: 0, status: "Unsent", job: "Job - 4", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "Job - 4", depositDue: 0 },
  { id: 4, estimateNumber: "4-2", estimateName: "Option B", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "B", amount: 0, status: "Unsent", job: "Job - 4", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "Job - 4", depositDue: 0 },
  { id: 5, estimateNumber: "4-1", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "A", amount: 3500, status: "Won", job: "Job - 4", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "Job - 4", depositDue: 0, updatedDate: "Mar 02, 2026" },
  { id: 6, estimateNumber: "3-1", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", option: "1", amount: 10502, status: "Won", job: "Job - 3", sentDate: "Mar 01, 2026", expirationDate: "Mar 31, 2026", teamMember: "Marek Stroz", source: "Job - 3", depositDue: 500 },
  { id: 7, estimateNumber: "5-1", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", option: "1", amount: 850, status: "Pending", job: "Job - 5", sentDate: "Feb 26, 2026", expirationDate: "Mar 27, 2026", teamMember: "Marek Stroz", source: "Job - 5", depositDue: 0 },
  { id: 8, estimateNumber: "6-1", estimateName: "Electrical Upgrade", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Feb 23, 2026", addedBy: "Marek Fie", option: "1", amount: 2200, status: "Approved", job: "Job - 6", sentDate: "Feb 24, 2026", expirationDate: "Mar 26, 2026", teamMember: "Marek Stroz", source: "Job - 6", depositDue: 200 },
  { id: 9, estimateNumber: "7-1", estimateName: "Roof Inspection", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Fri Feb 20, 2026", addedBy: "Marek Ste", option: "1", amount: 350, status: "Declined", job: "Job - 7", sentDate: "Feb 21, 2026", expirationDate: "Mar 23, 2026", teamMember: "Marek Stroz", source: "Job - 7", depositDue: 0 },
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

// ─── Status Pill Dropdown (inline in table) ─────────────────────────────────
function InlineStatusSelect({ status, onChange }: { status: EstimateStatus; onChange: (s: EstimateStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const renderOption = (s: EstimateStatus) => (
    <button
      key={s}
      onClick={() => { onChange(s); setOpen(false); }}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${
        s === status ? "bg-[#EBF0F8]" : "hover:bg-[#F5F7FA]"
      }`}
      style={{ fontWeight: s === status ? 600 : 400, color: s === status ? "#1A2332" : "#374151" }}
    >
      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[s] }} />
      {s}
    </button>
  );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] transition-opacity hover:opacity-80"
        style={{ fontWeight: 600, color: statusColors[status], backgroundColor: statusBg[status] }}
      >
        {status}
        <span className="material-icons" style={{ fontSize: "13px" }}>expand_more</span>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-[190px] bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-40 py-1">
          {primaryStatuses.map(renderOption)}
          <div className="px-3.5 pt-2 pb-1">
            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>other options</span>
          </div>
          {otherStatuses.map(renderOption)}
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

  type SortField = "estimateNumber" | "clientName" | "createdDate" | "amount" | "status";
  const [sortField, setSortField] = useState<SortField>("createdDate");
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

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: number[] } | null>(null);

  // Stats (only primary statuses on summary cards)
  const statusCounts = useMemo(() => {
    return primaryStatuses.map(s => ({
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

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "estimateNumber") return a.estimateNumber.localeCompare(b.estimateNumber, undefined, { numeric: true }) * dir;
      if (sortField === "clientName") return a.clientName.localeCompare(b.clientName) * dir;
      if (sortField === "createdDate") return a.createdDate.localeCompare(b.createdDate) * dir;
      if (sortField === "amount") return (a.amount - b.amount) * dir;
      if (sortField === "status") return a.status.localeCompare(b.status) * dir;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);
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
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Estimates"
        count={selectedIds.size > 0 ? `${filtered.length} records · ${selectedIds.size} selected` : `${filtered.length} records`}
        actions={
          <>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              Create Estimate
            </button>
            <KebabMenu triggerClassName="w-9 h-9 border border-[#DDE3EE] rounded-lg bg-white">
              <KebabItem icon="view_column">Edit Columns</KebabItem>
              <KebabItem icon="swap_horiz">Change Status</KebabItem>
              <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
              <KebabItem icon="send">Resend Estimate</KebabItem>
              <KebabSeparator />
              {selectedIds.size > 0 && <>
                <KebabItem icon="deselect" onClick={() => setSelectedIds(new Set())}>Deselect All</KebabItem>
                <KebabItem icon="archive" destructive onClick={() => setDeleteConfirm({ ids: Array.from(selectedIds) })}>Archive Selected</KebabItem>
                <KebabSeparator />
              </>}
              <KebabItem icon="file_upload">Import</KebabItem>
              <KebabItem icon="file_download">Export</KebabItem>
            </KebabMenu>
          </>
        }
      />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-6 gap-5 mb-8">
        {statusCounts.map(({ status, count, worth }) => (
          <Card
            key={status}
            onClick={() => { setQfStatus(qfStatus === status ? "All" : status); setPage(1); }}
            className={`px-4 py-4 border bg-white hover:shadow-sm transition-shadow cursor-pointer ${
              qfStatus === status ? "border-[#4A6FA5] ring-1 ring-[#4A6FA5]/20" : "border-[#DDE3EE]"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[status] }} />
              <div className="text-[12px]" style={{ fontWeight: 500, color: "#546478" }}>{status}</div>
            </div>
            <div className="text-[26px] leading-none mb-1.5" style={{ fontWeight: 700, color: "#1A2332" }}>{count}</div>
            <div className="text-[13px]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", color: worth > 0 ? "#374151" : "#9CA3AF" }}>${fmt(worth)}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#DDE3EE]">
          <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>{filtered.length} results</span>
          <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
          <select value={qfStatus} onChange={e => { setQfStatus(e.target.value as any); setPage(1); }} className={qfClass(qfStatus !== "All")}>
            <option value="All">All statuses</option>
            {primaryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            <option disabled>── other options ──</option>
            {otherStatuses.map(s => <option key={s} value={s}>{s}</option>)}
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
        <SelectionBar
          count={selectedIds.size}
          onDeselect={() => setSelectedIds(new Set())}
          onDelete={() => {
            if (confirm(`Delete ${selectedIds.size} estimate(s)?`)) {
              handleBulkDelete();
            }
          }}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginated.map(e => e.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none whitespace-nowrap" style={{ fontWeight: 600 }} onClick={() => toggleSort("estimateNumber")}>
                  <div className="flex items-center">Estimate <SortIcon field="estimateNumber" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none whitespace-nowrap" style={{ fontWeight: 600 }} onClick={() => toggleSort("clientName")}>
                  <div className="flex items-center">Client <SortIcon field="clientName" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none whitespace-nowrap" style={{ fontWeight: 600 }} onClick={() => toggleSort("createdDate")}>
                  <div className="flex items-center">Created <SortIcon field="createdDate" /></div>
                </th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide text-[#546478] whitespace-nowrap" style={{ fontWeight: 600 }}>Option</th>
                <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none whitespace-nowrap" style={{ fontWeight: 600 }} onClick={() => toggleSort("amount")}>
                  <div className="flex items-center justify-end">Amount <SortIcon field="amount" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none whitespace-nowrap" style={{ fontWeight: 600 }} onClick={() => toggleSort("status")}>
                  <div className="flex items-center">Status <SortIcon field="status" /></div>
                </th>
                {["Job", "Sent Date", "Expiration Date", "Team Member", "Source", "Deposit due"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-16 text-center">
                    <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>description</span>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No estimates found</div>
                    <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your filters or create a new estimate</div>
                  </td>
                </tr>
              ) : paginated.map((est) => (
                <tr
                  key={est.id}
                  className={`group border-b border-[#DDE3EE] hover:bg-[#F9FAFB] transition-colors cursor-pointer ${
                    selectedIds.has(est.id) ? "bg-[#EBF0F8]" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(est.id)}
                      onChange={(e) => {
                        const s = new Set(selectedIds);
                        e.target.checked ? s.add(est.id) : s.delete(est.id);
                        setSelectedIds(s);
                      }}
                      className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                    />
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[12px] text-[#8899AA] font-mono tabular-nums">#{est.estimateNumber}</div>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{est.estimateName || <span className="text-[#9CA3AF]">—</span>}</div>
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{est.clientName}</div>
                    <div className="text-[12px] text-[#8899AA]">{est.clientEmail}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[13px] text-[#374151]">{est.createdDate}</div>
                    <div className="text-[12px] text-[#8899AA]">by {est.addedBy}</div>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-center text-[#546478]" onClick={() => navigate(`/estimates/${est.id}`)}>
                    {est.option ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#F3F4F6] text-[#374151] text-[12px]" style={{ fontWeight: 600 }}>{est.option}</span>
                    ) : <span className="text-[#D1D5DB]">—</span>}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(est.amount)}</div>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <InlineStatusSelect status={est.status} onChange={(s) => handleStatusChange(est.id, s)} />
                    {est.updatedDate && (
                      <div className="text-[11px] text-[#8899AA] mt-1">Updated: {est.updatedDate}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.job || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.sentDate || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.expirationDate || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.teamMember || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-4 py-4 text-[13px] text-[#546478]" onClick={() => navigate(`/estimates/${est.id}`)}>{est.source || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-4 py-4 text-[13px] text-right whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: est.depositDue > 0 ? "#1A2332" : "#D1D5DB" }}>${fmt(est.depositDue)}</span>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <KebabMenu triggerClassName="w-7 h-7 rounded hover:bg-[#F3F4F6] flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <KebabItem icon="open_in_new" onClick={() => navigate(`/estimates/${est.id}`)}>Open</KebabItem>
                      <KebabItem icon="content_copy">Duplicate</KebabItem>
                      <KebabItem icon="send">Send to Client</KebabItem>
                      <KebabSeparator />
                      <KebabItem icon="archive" destructive>Archive</KebabItem>
                    </KebabMenu>
                  </td>
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
