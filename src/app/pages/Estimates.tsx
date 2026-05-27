import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { AdvancedFilterActions, AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus = "Draft" | "Sent" | "Viewed" | "Approved" | "Rejected" | "Expired" | "Archived";

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
  jobTitle?: string;
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

const primaryStatuses: EstimateStatus[] = ["Draft", "Sent", "Viewed", "Approved", "Rejected", "Expired"];
const otherStatuses: EstimateStatus[] = ["Archived"];

const statusColors: Record<EstimateStatus, string> = {
  Draft: "#6B7280",
  Sent: "#1E40AF",
  Viewed: "#92400E",
  Approved: "#166534",
  Rejected: "#DC2626",
  Expired: "#6B7280",
  Archived: "#4B5563",
};

const statusBg: Record<EstimateStatus, string> = {
  Draft: "#F3F4F6",
  Sent: "#DBEAFE",
  Viewed: "#FEF3C7",
  Approved: "#DCFCE7",
  Rejected: "#FEE2E2",
  Expired: "#F3F4F6",
  Archived: "#E5E7EB",
};

const avatarColors = ["#4A6FA5", "#3B82F6", "#8B5CF6", "#D97706", "#10B981", "#DC2626"];
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

const ESTIMATES_COLS = [
  { key: "estimate",       label: "Estimate",        sortable: true },
  { key: "client",         label: "Client",           sortable: true },
  { key: "status",         label: "Status",           sortable: true },
  { key: "amount",         label: "Amount",           sortable: true },
  { key: "job",            label: "Job" },
  { key: "technician",     label: "Technician" },
  { key: "created",        label: "Created",          sortable: true },
  { key: "sentDate",       label: "Sent Date" },
  { key: "expirationDate", label: "Expiration Date" },
  { key: "depositDue",     label: "Deposit due" },
] as const;

const DEFAULT_VISIBLE_COLS = new Set(["estimate", "client", "status", "amount", "job", "technician"]);

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
  { id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 30, 2026", addedBy: "Marek Ste", option: "", amount: 0, status: "Draft", job: "", jobTitle: "", sentDate: "", expirationDate: "", teamMember: "Marek Stroz", source: "", depositDue: 0 },
  { id: 2, estimateNumber: "10246-E04", estimateName: "Estimate 1", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Fri Mar 13, 2026", addedBy: "Marek Fie", option: "1", amount: 0, status: "Viewed", job: "10246-J04", jobTitle: "Bathroom Remodel", sentDate: "Mar 13, 2026", expirationDate: "Jun 13, 2026", teamMember: "Marek Stroz", source: "10246-J04", depositDue: 0 },
  { id: 3, estimateNumber: "10246-E03", estimateName: "Option C", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "C", amount: 0, status: "Expired", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0 },
  { id: 4, estimateNumber: "10246-E02", estimateName: "Option B", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "B", amount: 0, status: "Sent", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0 },
  { id: 5, estimateNumber: "10246-E01", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Mar 02, 2026", addedBy: "Marek Fie", option: "A", amount: 3500, status: "Approved", job: "10246-J01", jobTitle: "Tree Removal", sentDate: "Mar 03, 2026", expirationDate: "Apr 02, 2026", teamMember: "Marek Stroz", source: "10246-J01", depositDue: 0, updatedDate: "Mar 02, 2026" },
  { id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Sat Feb 28, 2026", addedBy: "Marek Fie", option: "1", amount: 10502, status: "Approved", job: "10248-J01", jobTitle: "HVAC Installation", sentDate: "Mar 01, 2026", expirationDate: "Mar 31, 2026", teamMember: "Marek Stroz", source: "10248-J01", depositDue: 500 },
  { id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez", clientEmail: "mike.r@outlook.com", createdDate: "Wed Feb 25, 2026", addedBy: "Marek Fie", option: "1", amount: 850, status: "Viewed", job: "10247-J01", jobTitle: "Plumbing Fix", sentDate: "Feb 26, 2026", expirationDate: "Mar 27, 2026", teamMember: "Marek Stroz", source: "10247-J01", depositDue: 0 },
  { id: 8, estimateNumber: "10245-E01", estimateName: "Electrical Upgrade", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", createdDate: "Mon Feb 23, 2026", addedBy: "Marek Fie", option: "1", amount: 2200, status: "Approved", job: "10245-J01", jobTitle: "Kitchen Renovation", sentDate: "Feb 24, 2026", expirationDate: "Mar 26, 2026", teamMember: "Marek Stroz", source: "10245-J01", depositDue: 200 },
  { id: 9, estimateNumber: "10248-E02", estimateName: "Roof Inspection", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", createdDate: "Fri Feb 20, 2026", addedBy: "Marek Ste", option: "1", amount: 350, status: "Rejected", job: "10248-J02", jobTitle: "Drain Service", sentDate: "Feb 21, 2026", expirationDate: "Mar 23, 2026", teamMember: "Marek Stroz", source: "10248-J02", depositDue: 0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

function toDateInputValue(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function matchesDatePreset(date: string, preset: string) {
  if (preset === "All time") return true;
  const value = toDateInputValue(date);
  if (!value) return true;
  if (preset === "Today") return value === "2026-04-27";
  if (preset === "Yesterday") return value === "2026-04-26";
  if (preset === "Last 7 days") return value >= "2026-04-21" && value <= "2026-04-27";
  if (preset === "Last 30 days") return value >= "2026-03-29" && value <= "2026-04-27";
  if (preset === "This month") return value >= "2026-04-01" && value <= "2026-04-30";
  if (preset === "Last month") return value >= "2026-03-01" && value <= "2026-03-31";
  if (preset === "This year") return value >= "2026-01-01" && value <= "2026-12-31";
  if (preset === "Last year") return value >= "2025-01-01" && value <= "2025-12-31";
  return true;
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
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] transition-opacity hover:opacity-80"
        style={{ fontWeight: 600, color: statusColors[status], backgroundColor: statusBg[status] }}
      >
        {status}
        <span className="material-icons" style={{ fontSize: "13px" }}>expand_more</span>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-[190px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-40 py-1">
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
  const [cols, moveCol] = useDraggableColumns([...ESTIMATES_COLS]);
  const [estimates, setEstimates] = useState<Estimate[]>(initialEstimates);

  // Quick filters
  const [qfStatus, setQfStatus] = useState<"All" | EstimateStatus>("All");
  const [qfDate, setQfDate] = useState("All time");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [expiresFrom, setExpiresFrom] = useState("");
  const [expiresTo, setExpiresTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");
  const [depositFilter, setDepositFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("");

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

  // Edit Columns modal
  const [editColsOpen, setEditColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(DEFAULT_VISIBLE_COLS));
  const toggleCol = (key: string) => setVisibleCols(prev => {
    const next = new Set(prev);
    if (next.has(key)) { if (next.size > 1) next.delete(key); }
    else next.add(key);
    return next;
  });

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

  // Filtered
  const filtered = useMemo(() => {
    let result = [...estimates];
    if (qfStatus !== "All") result = result.filter(e => e.status === qfStatus);
    result = result.filter(e => matchesDatePreset(e.createdDate, qfDate));
    if (createdFrom) result = result.filter(e => toDateInputValue(e.createdDate) >= createdFrom);
    if (createdTo) result = result.filter(e => toDateInputValue(e.createdDate) <= createdTo);
    if (expiresFrom) result = result.filter(e => toDateInputValue(e.expirationDate) >= expiresFrom);
    if (expiresTo) result = result.filter(e => toDateInputValue(e.expirationDate) <= expiresTo);
    if (amountMin) result = result.filter(e => e.amount >= Number(amountMin));
    if (amountMax) result = result.filter(e => e.amount <= Number(amountMax));
    if (teamFilter !== "All") result = result.filter(e => e.teamMember === teamFilter);
    if (depositFilter === "Deposit due") result = result.filter(e => e.depositDue > 0);
    if (depositFilter === "No deposit") result = result.filter(e => e.depositDue <= 0);
    if (jobFilter) {
      const q = jobFilter.toLowerCase();
      result = result.filter(e => e.job.toLowerCase().includes(q) || e.jobTitle.toLowerCase().includes(q));
    }
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
  }, [estimates, qfStatus, qfDate, createdFrom, createdTo, expiresFrom, expiresTo, amountMin, amountMax, teamFilter, depositFilter, jobFilter, search]);

  const teamMembers = useMemo(() => Array.from(new Set(estimates.map(e => e.teamMember).filter(Boolean))), [estimates]);
  const advancedActive = Boolean(createdFrom || createdTo || expiresFrom || expiresTo || amountMin || amountMax || teamFilter !== "All" || depositFilter !== "All" || jobFilter);
  const resetAdvancedFilters = () => {
    setCreatedFrom("");
    setCreatedTo("");
    setExpiresFrom("");
    setExpiresTo("");
    setAmountMin("");
    setAmountMax("");
    setTeamFilter("All");
    setDepositFilter("All");
    setJobFilter("");
    setPage(1);
  };

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

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Header */}
      <PageHeader
        title="Estimates"
        count={selectedIds.size > 0 ? `${filtered.length} · ${selectedIds.size} selected` : filtered.length}
      />

      {/* ── Stats Cards (Clients-template style) ── */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        {(() => {
          const total       = estimates.length;
          const pending     = estimates.filter(e => e.status === "Viewed").length;
          const won         = estimates.filter(e => e.status === "Approved");
          const wonCount    = won.length;
          const wonValue    = won.reduce((sum, e) => sum + e.amount, 0);
          const conversion  = total > 0 ? Math.round((wonCount / total) * 100) : 0;
          return (
            <>
              <StatCard
                value={String(total)}
                label="Estimates"
                sub="this month"
                change="+14%"
                changeUp
                period="vs prev. period"
                data={[2, 3, 2, 4, 3, 5, 4]}
              />
              <StatCard
                value={String(pending)}
                label="Awaiting approval"
                sub="awaiting response"
                change="+5%"
                changeUp
                period="vs prev. period"
                data={[0, 1, 0, 1, 1, 0, 1]}
                sparklineColor="#F59E0B"
              />
              <StatCard
                value={`${conversion}%`}
                label="Conversion rate"
                sub="this month"
                change="+5%"
                changeUp
                period="vs prev. period"
                data={[3, 4, 4, 5, 5, 6, 6]}
                sparklineColor="#16A34A"
              />
              <StatCard
                value={`$${wonValue.toLocaleString("en-US")}`}
                label="Approved value"
                sub="this month"
                change="+18%"
                changeUp
                period="vs prev. period"
                data={[3, 4, 4, 5, 6, 6, 7]}
              />
            </>
          );
        })()}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search estimates..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-[220px] h-9 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white" />
          </div>
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <select value={qfStatus} onChange={e => { setQfStatus(e.target.value as any); setPage(1); }} className={qfClass(qfStatus !== "All")}>
            <option value="All">All statuses</option>
            {primaryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            <option disabled>── other options ──</option>
            {otherStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={qfDate} onChange={e => { setQfDate(e.target.value); setPage(1); }} className={qfClass(qfDate !== "All time")}>
            {timeFilters.map(t => <option key={t} value={t}>{t}</option>)}
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
            <CreateActionButton onClick={() => setCreateModalOpen(true)}>
              Create Estimate
            </CreateActionButton>
            <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
              <KebabItem icon="view_column" onClick={() => setEditColsOpen(true)}>Edit Columns</KebabItem>
              <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
              <KebabSeparator />
              <KebabItem icon="file_upload">Import</KebabItem>
              <KebabItem icon="file_download">Export</KebabItem>
            </KebabMenu>
          </div>
        </div>
        {filterOpen && (
          <AdvancedFilterPanel>
            <AdvancedFilterField label="Created from">
              <input type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Created to">
              <input type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Expires from">
              <input type="date" value={expiresFrom} onChange={(e) => { setExpiresFrom(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Expires to">
              <input type="date" value={expiresTo} onChange={(e) => { setExpiresTo(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Amount min">
              <input type="number" min="0" placeholder="$0" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Amount max">
              <input type="number" min="0" placeholder="Any" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1); }} className={advancedInputClass} />
            </AdvancedFilterField>
            <AdvancedFilterField label="Team member">
              <select value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }} className={advancedSelectClass}>
                <option>All</option>
                {teamMembers.map((member) => <option key={member}>{member}</option>)}
              </select>
            </AdvancedFilterField>
            <AdvancedFilterField label="Deposit">
              <select value={depositFilter} onChange={(e) => { setDepositFilter(e.target.value); setPage(1); }} className={advancedSelectClass}>
                <option>All</option>
                <option>Deposit due</option>
                <option>No deposit</option>
              </select>
            </AdvancedFilterField>
            <AdvancedFilterField label="Job">
              <input value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1); }} placeholder="10246-J01" className={advancedInputClass} />
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
              onClick: () => setDeleteConfirm({ ids: Array.from(selectedIds) }),
            },
            { label: "Export", icon: "file_download", onClick: () => {} },
          ]}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginated.map(e => e.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                  />
                </th>
                {cols.filter(c => visibleCols.has(c.key)).map(col => {
                  const sortFieldMap: Record<string, SortField> = { estimate: "estimateNumber", client: "clientName", created: "createdDate", amount: "amount", status: "status" };
                  const sf = sortFieldMap[col.key];
                  return (
                    <DraggableTh
                      key={col.key}
                      colKey={col.key}
                      onMove={moveCol}
                      className={`px-4 py-3 text-left text-[14px] text-[#1A2332] whitespace-nowrap select-none`}
                      style={{ fontFamily: "Geist", fontWeight: 500 }}
                      onClick={sf ? () => toggleSort(sf) : undefined}
                    >
                      {col.key === "option" ? (
                        <div className="text-center">{col.label}</div>
                      ) : (
                        <div className="flex items-center">{col.label}{sf && <SortIcon field={sf} />}</div>
                      )}
                    </DraggableTh>
                  );
                })}
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
                  className={`group border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-pointer ${
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
                      className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                    />
                  </td>
                  {cols.filter(c => visibleCols.has(c.key)).map(col => {
                    switch (col.key) {
                      case "estimate": return (
                        <td key={col.key} className="px-4 py-4" onClick={() => navigate(`/estimates/${est.id}`)}>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{est.estimateName || <span className="text-[#9CA3AF]">—</span>}</div>
                        </td>
                      );
                      case "client": return (
                        <td key={col.key} className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/clients/${est.estimateNumber.split('-')[0]}`)}
                            className="text-[14px] text-[#4A6FA5] hover:underline hover:text-[#3d5a85] transition-colors text-left"
                            style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}
                          >
                            {est.clientName}
                          </button>
                        </td>
                      );
                      case "created": return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                          <div className="text-[13px] text-[#374151]">{est.createdDate.replace(/^\w{3}\s/, "")}</div>
                        </td>
                      );
                      case "option": return (
                        <td key={col.key} className="px-4 py-4 text-[13px] text-center text-[#546478]" onClick={() => navigate(`/estimates/${est.id}`)}>
                          {est.option ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#F3F4F6] text-[#374151] text-[12px]" style={{ fontWeight: 600 }}>{est.option}</span>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                      );
                      case "amount": return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(est.amount)}</div>
                        </td>
                      );
                      case "status": return (
                        <td key={col.key} className="px-4 py-4">
                          <span className="inline-flex items-center justify-center min-w-[86px] px-2.5 py-1 rounded-md text-[12px]" style={{ fontWeight: 500, color: statusColors[est.status], backgroundColor: statusBg[est.status] }}>{est.status}</span>
                        </td>
                      );
                      case "job": return (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {est.job ? (
                            <button onClick={() => navigate(`/jobs/${est.job}`)} className="text-left">
                              <div className="text-[14px] text-[#4A6FA5] hover:underline" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{est.job}</div>
                              {est.jobTitle && <div className="text-[13px] text-[#546478]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "18px" }}>{est.jobTitle}</div>}
                            </button>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                      );
                      case "sentDate": return (
                        <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.sentDate || <span className="text-[#D1D5DB]">—</span>}</td>
                      );
                      case "expirationDate": return (
                        <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.expirationDate || <span className="text-[#D1D5DB]">—</span>}</td>
                      );
                      case "technician": return (
                        <td key={col.key} className="px-4 py-4 text-[13px] text-[#546478] whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>{est.teamMember || <span className="text-[#D1D5DB]">—</span>}</td>
                      );
                      case "depositDue": return (
                        <td key={col.key} className="px-4 py-4 text-[13px] text-right whitespace-nowrap" onClick={() => navigate(`/estimates/${est.id}`)}>
                          <span style={{ fontVariantNumeric: "tabular-nums", color: est.depositDue > 0 ? "#1A2332" : "#D1D5DB" }}>${fmt(est.depositDue)}</span>
                        </td>
                      );
                      default: return null;
                    }
                  })}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <KebabMenu>
                      <KebabItem icon="edit" onClick={() => navigate(`/estimates/${est.id}`)}>Edit</KebabItem>
                      <KebabItem icon="send">Send to Client</KebabItem>
                      <KebabItem icon="receipt">Make Invoice</KebabItem>
                      <KebabItem icon="print">Print</KebabItem>
                      <KebabSeparator />
                      <KebabItem icon="content_copy">Duplicate</KebabItem>
                      <KebabSeparator />
                      <KebabItem icon="delete" destructive>Delete</KebabItem>
                    </KebabMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-[#FAFBFC]">
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

      {/* ═══ Edit Columns Modal ═══ */}
      {editColsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditColsOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[340px] border border-[#E5E7EB]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Edit Columns</div>
              <button onClick={() => setEditColsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="px-5 py-3 space-y-1">
              {ESTIMATES_COLS.map(col => (
                <label key={col.key} className="flex items-center gap-3 py-2 cursor-pointer rounded-lg px-2 hover:bg-[#F5F7FA] transition-colors">
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 400 }}>{col.label}</span>
                  {DEFAULT_VISIBLE_COLS.has(col.key) && (
                    <span className="ml-auto text-[11px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>default</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#E5E7EB] gap-3">
              <button
                onClick={() => setVisibleCols(new Set(DEFAULT_VISIBLE_COLS))}
                className="text-[13px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                Reset to default
              </button>
              <button
                onClick={() => setEditColsOpen(false)}
                className="h-9 px-5 rounded-lg bg-[#4A6FA5] text-white text-[13px] hover:bg-[#3d5a85] transition-colors"
                style={{ fontWeight: 600 }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full h-11 px-4 pr-10 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                  autoFocus
                />
                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>search</span>
              </div>

              {clientSearch && (
                <div className="border border-[#E5E7EB] rounded-lg max-h-[200px] overflow-y-auto mb-4">
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
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Inactivate estimates?</h3>
            </div>
            <p className="text-[14px] text-[#546478] mb-6">
              Inactivate {deleteConfirm.ids.length} estimate(s)? They can be restored later.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Inactivate</button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
    </DndProvider>
  );
}
