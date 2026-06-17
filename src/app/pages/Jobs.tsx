import { useState, useRef, useSyncExternalStore, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";
import { PaginationFooter } from "../components/ui/pagination-footer";
import { formatRegionalDate, regionalSettingsStore } from "../stores/regionalSettingsStore";
import { jobsStore } from "../stores/jobsStore";
import { type JobStatus, JOB_STATUSES, JOB_STATUS_COLOR as statusColors, JOB_STATUS_BG as statusBg } from "../constants/jobStatuses";

interface Job {
  id: number;
  jobNumber: string; // {customerId}-J{NN} format, e.g. "29899-J01"
  title: string;
  client: string;
  clientId: string;
  address: string;
  schedule: string;
  scheduleDateSort: string;
  status: JobStatus;
  jobType: "One-off" | "Recurring";
  total: number;
}

const mockJobs: Job[] = [
  { id: 1,  jobNumber: "10234-J01", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled",  jobType: "One-off",   total: 375.01 },
  { id: 2,  jobNumber: "10234-J02", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled",  jobType: "One-off",   total: 375.01 },
  { id: 3,  jobNumber: "10234-J03", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "In Progress", jobType: "One-off",   total: 375.01 },
  { id: 4,  jobNumber: "10234-J04", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled",  jobType: "One-off",   total: 375.01 },
  { id: 5,  jobNumber: "10234-J05", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Completed",  jobType: "One-off",   total: 375.01 },
  { id: 6,  jobNumber: "10234-J06", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled",  jobType: "One-off",   total: 375.01 },
  { id: 7,  jobNumber: "10234-J07", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "In Progress", jobType: "Recurring", total: 375.01 },
  { id: 8,  jobNumber: "10234-J08", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled",  jobType: "One-off",   total: 375.01 },
  { id: 9,  jobNumber: "10234-J09", title: "AC Estimate",        client: "Travis Jones",   clientId: "10234", address: "854 Maple St, Fort Worth, TX 76107",        schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Completed",  jobType: "One-off",   total: 375.01 },
  { id: 10, jobNumber: "10255-J01", title: "Plumbing Repair",    client: "Lisa Brown",     clientId: "10255", address: "567 Pine Road, Jacksonville, FL 32099",     schedule: "April 6, 2026",  scheduleDateSort: "2026-04-06", status: "Completed",  jobType: "One-off",   total: 275.00 },
  { id: 11, jobNumber: "10246-J01", title: "Tree Removal",       client: "Sarah Johnson",  clientId: "10246", address: "1220 Elm Street, Orlando, FL 32801",        schedule: "April 10, 2026", scheduleDateSort: "2026-04-10", status: "In Progress", jobType: "One-off",   total: 450.00 },
  { id: 12, jobNumber: "10247-J03", title: "Monthly Lawn Care",  client: "Mike Davis",     clientId: "10247", address: "890 Oak Drive, Miami, FL 33101",            schedule: "April 15, 2026", scheduleDateSort: "2026-04-15", status: "Scheduled",  jobType: "Recurring", total: 120.00 },
];


const statusIcons: Record<string, string> = {
  Scheduled: "event_note",
  "In Progress": "autorenew",
  Completed: "check_circle",
  Inactive: "block",
};

// ── Mini area-chart sparkline (Figma stat card "Area chart", 64×32) ──
function Sparkline({ data, color = "#4A6FA5" }: { data: number[]; color?: string }) {
  const w = 64, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / range) * (h - 6) - 3]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Jobs stat card — number + label + sparkline (Figma 495:41109) ──
function JobStat({ value, label, data, color }: { value: string; label: string; data: number[]; color?: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg flex gap-2 items-center p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: 1.35 }}>{value}</span>
        <span className="text-[14px] text-[#6B7280]" style={{ lineHeight: "20px" }}>{label}</span>
      </div>
      <Sparkline data={data} color={color} />
    </div>
  );
}

// Tolerant CSV parser (handles quoted fields, escaped quotes, commas in quotes).
function parseCSV(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map((line) => {
    const fields: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { fields.push(cur); cur = ""; }
      else cur += ch;
    }
    fields.push(cur);
    return fields;
  });
}

type SortField = "id" | "address" | "schedule" | "status" | "total" | "client";
type SortDir = "asc" | "desc";

function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

const JOBS_COLS = [
  { key: "id",       label: "Number",    sortable: true  },
  { key: "client",   label: "Client",    sortable: true  },
  { key: "address",  label: "Address",   sortable: false },
  { key: "schedule", label: "Scheduled", sortable: true  },
  { key: "status",   label: "Status",    sortable: true  },
  { key: "total",    label: "Total",     sortable: true  },
];

export function Jobs() {
  const navigate = useNavigate();
  const regionalSettings = useSyncExternalStore(regionalSettingsStore.subscribe, regionalSettingsStore.getSnapshot);
  // Merge store-created jobs on top of the seed demo rows so newly created
  // jobs appear in the list while the demo data is still visible.
  const storeJobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const storeJobIds = new Set(storeJobs.map(j => j.id));
  const mergedJobs: Job[] = useMemo(() => {
    // Dedupe store records by jobNumber (keep the first / most recent) so stale
    // duplicate records from earlier sessions don't render multiple times.
    const seenNumbers = new Set<string>();
    const fromStore: Job[] = storeJobs
      .filter(r => {
        const key = r.jobNumber || String(r.id);
        if (seenNumbers.has(key)) return false;
        seenNumbers.add(key);
        return true;
      })
      .map(r => ({
        id: r.id,
        jobNumber: r.jobNumber,
        title: r.title,
        client: r.client,
        clientId: r.clientId,
        address: [r.address, r.city, r.state, r.zip].filter(Boolean).join(", "),
        schedule: r.startDate,
        scheduleDateSort: r.startDate,
        status: r.status as Job["status"],
        jobType: r.jobType || "One-off",
        total: r.totalPrice,
      }));
    // Seed rows whose ID or jobNumber collides with a store row are dropped.
    const seedRows = mockJobs.filter(j => !storeJobIds.has(j.id) && !seenNumbers.has(j.jobNumber));
    return [...fromStore, ...seedRows];
  }, [storeJobs]);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const allJobs = mergedJobs;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  // Quick filters
  const [qfStatus, setQfStatus] = useState("All");
  const [qfType, setQfType] = useState("All");
  const [qfDate, setQfDate] = useState("all_time");

  // Pagination — default 10 rows (matches Figma "1-10 of …")
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobCols, moveJobCol] = useDraggableColumns(JOBS_COLS);

  // Column visibility (Edit columns modal) — every column on by default.
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(JOBS_COLS.map(c => c.key)));
  const [editColsOpen, setEditColsOpen] = useState(false);
  const [pendingCols, setPendingCols] = useState<Set<string>>(new Set(JOBS_COLS.map(c => c.key)));
  // Change-status modal — holds the ids being updated (null = closed).
  const [statusModalIds, setStatusModalIds] = useState<number[] | null>(null);
  const [statusChoice, setStatusChoice] = useState<Job["status"]>("Scheduled");

  const openStatusModal = (ids: number[]) => {
    if (ids.length === 0) return;
    const first = allJobs.find(j => j.id === ids[0]);
    setStatusChoice(first?.status ?? "Scheduled");
    setStatusModalIds(ids);
  };
  const applyStatus = () => {
    if (!statusModalIds) return;
    const ids = new Set(statusModalIds);
    setJobs(prev => prev.map(j => (ids.has(j.id) ? { ...j, status: statusChoice } : j)));
    setStatusModalIds(null);
    setSelectedJobs(new Set());
  };
  const duplicateJob = (job: Job) => {
    const nextId = Math.max(0, ...allJobs.map(j => j.id)) + 1;
    setJobs(prev => [{ ...job, id: nextId, jobNumber: `${job.jobNumber}-COPY` }, ...prev]);
    setCurrentPage(1);
    toast.success(`Duplicated ${job.jobNumber}`);
  };

  // Advanced filter panel
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterState, setFilterState] = useState({
    scheduleFrom: "", scheduleTo: "",
    totalMin: "", totalMax: "",
    client: "", city: "",
    jobType: "",
  });
  const [pendingFilters, setPendingFilters] = useState({ ...filterState });

  const activeFilterCount = Object.values(filterState).filter(v => v !== "").length;

  const handleApplyFilters = () => { setFilterState({ ...pendingFilters }); setFilterPanelOpen(false); setCurrentPage(1); };
  const handleClearFilters = () => {
    const empty = { scheduleFrom: "", scheduleTo: "", totalMin: "", totalMax: "", client: "", city: "", jobType: "" };
    setPendingFilters(empty); setFilterState(empty); setFilterPanelOpen(false); setCurrentPage(1);
  };

  const [sortField, setSortField] = useState<SortField>("schedule");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = allJobs.filter(j => {
    if (qfStatus !== "All" && j.status !== qfStatus) return false;
    if (qfType === "One-off" && j.jobType !== "One-off") return false;
    if (qfType === "Recurring" && j.jobType !== "Recurring") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!j.title.toLowerCase().includes(q) && !j.client.toLowerCase().includes(q) && !j.address.toLowerCase().includes(q) && !j.jobNumber.toLowerCase().includes(q)) return false;
    }
    // Advanced filters
    if (filterState.jobType && j.jobType !== filterState.jobType) return false;
    if (filterState.client && !j.client.toLowerCase().includes(filterState.client.toLowerCase())) return false;
    if (filterState.city && !j.address.toLowerCase().includes(filterState.city.toLowerCase())) return false;
    if (filterState.scheduleFrom && j.scheduleDateSort < filterState.scheduleFrom) return false;
    if (filterState.scheduleTo && j.scheduleDateSort > filterState.scheduleTo) return false;
    if (filterState.totalMin !== "" && j.total < Number(filterState.totalMin)) return false;
    if (filterState.totalMax !== "" && j.total > Number(filterState.totalMax)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "id") return (a.id - b.id) * dir;
    if (sortField === "total") return (a.total - b.total) * dir;
    if (sortField === "address") return a.address.localeCompare(b.address) * dir;
    if (sortField === "client") return a.client.localeCompare(b.client) * dir;
    if (sortField === "schedule") return a.scheduleDateSort.localeCompare(b.scheduleDateSort) * dir;
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  // Columns actually shown (Edit columns modal toggles visibility).
  const shownCols = jobCols.filter((c) => visibleCols.has(c.key));


  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginated = sorted.slice(startIndex, endIndex);

  const allSelected = paginated.length > 0 && paginated.every(j => selectedJobs.has(j.id));
  const handleSelectAll = (checked: boolean) => setSelectedJobs(checked ? new Set(sorted.map(j => j.id)) : new Set());
  const handleSelect = (id: number, checked: boolean) => { const s = new Set(selectedJobs); checked ? s.add(id) : s.delete(id); setSelectedJobs(s); };

  const statusCounts = {
    Scheduled: allJobs.filter(j => j.status === "Scheduled").length,
    "In Progress": allJobs.filter(j => j.status === "In Progress").length,
    Completed: allJobs.filter(j => j.status === "Completed").length,
  };
  const revenue = jobs.reduce((sum, j) => sum + (j.total ?? 0), 0);

  // ── Export / Import (kebab menu) ──
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportJobs = (rows: Job[]) => {
    if (rows.length === 0) { toast.info("Nothing to export"); return; }
    const headers = ["Number", "Title", "Client", "Address", "Scheduled", "Status", "Type", "Total"];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map(j => [j.jobNumber, j.title, j.client, j.address, j.schedule, j.status, j.jobType, j.total.toFixed(2)].map(esc).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs-export-${rows.length}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} job${rows.length === 1 ? "" : "s"} to CSV`);
  };
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result));
        const dataRows = parsed.slice(1).filter(r => r.some(c => c.trim()));
        if (dataRows.length === 0) { toast.error("No rows found in that file"); return; }
        const base = Date.now();
        const imported: Job[] = dataRows.map((r, i) => ({
          id: base + i,
          jobNumber: r[0]?.trim() || `IMP-J${String(i + 1).padStart(2, "0")}`,
          title: r[1]?.trim() || "Imported job",
          client: r[2]?.trim() || "—",
          clientId: "",
          address: r[3]?.trim() || "",
          schedule: r[4]?.trim() || "",
          scheduleDateSort: "2026-01-01",
          status: (["Scheduled", "In Progress", "Completed"].includes(r[5]?.trim()) ? r[5].trim() : "Scheduled") as Job["status"],
          jobType: (r[6]?.trim() === "Recurring" ? "Recurring" : "One-off") as Job["jobType"],
          total: Number(String(r[7] ?? "").replace(/[^0-9.]/g, "")) || 0,
        }));
        setJobs(prev => [...imported, ...prev]);
        setCurrentPage(1);
        toast.success(`Imported ${imported.length} job${imported.length === 1 ? "" : "s"} from ${file.name}`);
      } catch {
        toast.error("Couldn't parse that file — expected a CSV");
      }
    };
    reader.onerror = () => toast.error("Couldn't read that file");
    reader.readAsText(file);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="material-icons text-[#9AA3AF] ml-0.5" style={{ fontSize: "14px" }}>
      {sortField === field ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  return (
    <DndProvider backend={HTML5Backend}>
    <>
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* ── Header ── */}
      <PageHeader
        title="Jobs"
        count={selectedJobs.size > 0 ? `${filtered.length} · ${selectedJobs.size} selected` : filtered.length}
        countSuffix="records"
      />

      {/* Hidden CSV input for Import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }}
      />

      {/* ── Stats Cards — shared StatCard so every list page is the same height ── */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        <StatCard value={String(statusCounts["Scheduled"])}                                                                       label="Scheduled"   sub="current" data={[3, 4, 3, 5, 4, 6, 5]}    sparklineColor="#4A6FA5" />
        <StatCard value={String(statusCounts["In Progress"])}                                                                     label="In progress" sub="current" data={[1, 2, 2, 3, 4, 3, 5]}    sparklineColor="#D97706" />
        <StatCard value={String(statusCounts["Completed"])}                                                                       label="Completed"   sub="current" data={[5, 6, 7, 8, 9, 10, 12]}  sparklineColor="#16A34A" />
        <StatCard value={`$${revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}            label="Revenue"     sub="current" data={[3, 4, 4, 5, 6, 6, 7]}    sparklineColor="#4A6FA5" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Filter Bar / Selection Bar (mutually exclusive — matches Figma) */}
        {selectedJobs.size > 0 ? (
          <SelectionBar
            count={selectedJobs.size}
            onDeselect={() => setSelectedJobs(new Set())}
            actions={[
              {
                label: "Cancel",
                icon: "cancel",
                destructive: true,
                onClick: () => {
                  setJobs(prev => prev.map(j => (selectedJobs.has(j.id) ? { ...j, status: "Cancelled" } : j)));
                  setSelectedJobs(new Set());
                },
              },
              { label: "Change status", icon: "swap_horiz", onClick: () => openStatusModal([...selectedJobs]) },
              { label: "Export selected", icon: "file_download", onClick: () => exportJobs(allJobs.filter(j => selectedJobs.has(j.id))) },
            ]}
          />
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]">
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
              <input type="text" placeholder="Search jobs..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-8 pl-8 pr-3 w-[220px] border border-[#E5E7EB] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
            </div>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <div className="flex items-center gap-2">
              <select value={qfStatus} onChange={e => { setQfStatus(e.target.value); setCurrentPage(1); }} className={qfClass(qfStatus !== "All")}>
                <option value="All">Status: All</option>
                {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={qfType} onChange={e => { setQfType(e.target.value); setCurrentPage(1); }} className={qfClass(qfType !== "All")}>
                <option value="All">Type: All</option>
                <option value="One-off">One-off</option>
                <option value="Recurring">Recurring</option>
              </select>
              <select value={qfDate} onChange={e => { setQfDate(e.target.value); setCurrentPage(1); }} className={qfClass(qfDate !== "all_time")}>
                <option value="all_time">Date: All time</option>
                <option value="today">Today</option>
                <option value="this_week">This week</option>
                <option value="this_month">This month</option>
              </select>
              <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
              <button
                onClick={() => { setPendingFilters({ ...filterState }); setFilterPanelOpen(true); }}
                className={`h-8 px-3 rounded-lg border text-[13px] flex items-center gap-1.5 transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
                    : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA] hover:border-[#C5CEDD]"
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
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CreateActionButton onClick={() => navigate("/jobs/new")}>
                Create Job
              </CreateActionButton>
              <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
                <KebabItem icon="view_column" onSelect={() => { setPendingCols(new Set(visibleCols)); setEditColsOpen(true); }}>Edit columns</KebabItem>
                <KebabSeparator />
                <KebabItem icon="file_upload" onSelect={() => importInputRef.current?.click()}>Import</KebabItem>
                <KebabItem icon="file_download" onSelect={() => exportJobs(sorted)}>Export</KebabItem>
              </KebabMenu>
            </div>
          </div>
        )}
        {/* Horizontal scroll so the right-hand columns (Total / Status / kebab)
            stay reachable on narrow viewports instead of being clipped by the
            card's overflow-hidden (QA: content ran off the right edge). */}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-[#F5F7FA]">
            <tr className="border-b border-[#E5E7EB]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
              </th>
              {shownCols.map(col => (
                <DraggableTh
                  key={col.key}
                  colKey={col.key}
                  onMove={moveJobCol}
                  className={`px-4 py-3 ${col.key === "total" ? "text-right" : "text-left"} text-[14px] text-[#1A2332] select-none${col.sortable ? " cursor-pointer" : ""}`}
                  style={{ fontWeight: 500 }}
                  onClick={col.sortable ? () => toggleSort(col.key as SortField) : undefined}
                >
                  <div className={`flex items-center ${col.key === "total" ? "justify-end" : ""}`}>
                    {col.label}
                    {col.sortable && <SortIcon field={col.key as SortField} />}
                  </div>
                </DraggableTh>
              ))}
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={shownCols.length + 2} className="px-4 py-12 text-center text-[14px] text-[#8899AA]">No jobs found</td></tr>
            ) : paginated.map(job => (
              <tr key={job.id}
                className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer ${selectedJobs.has(job.id) ? "bg-[#EDF5FF]" : ""}`}
                onClick={() => navigate(`/jobs/${job.id}`)}>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedJobs.has(job.id)} onChange={e => handleSelect(job.id, e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                </td>
                {shownCols.map(col => {
                  switch (col.key) {
                    case "id":
                      return (
                        <td key="id" className="px-4 py-4">
                          <div className="text-[12px] text-[#6B7280]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "16px" }}>{job.jobNumber}</div>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" }}>{job.title}</div>
                        </td>
                      );
                    case "client":
                      return (
                        <td key="client" className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/clients/${job.clientId}`)}
                            className="text-[14px] text-[#4A6FA5] hover:underline hover:text-[#3d5a85] transition-colors text-left"
                            style={{ fontFamily: "Geist", fontStyle: "normal", fontWeight: 500, lineHeight: "20px" }}
                          >
                            {job.client}
                          </button>
                        </td>
                      );
                    case "address":
                      return <td key="address" className="px-4 py-4 text-[14px] text-[#6B7280]" style={{ fontFamily: "Geist", fontStyle: "normal", fontWeight: 400, lineHeight: "20px" }}>{job.address}</td>;
                    case "schedule":
                      return <td key="schedule" className="px-4 py-4 text-[14px] text-[#6B7280]" style={{ fontFamily: "Geist", fontStyle: "normal", fontWeight: 400, lineHeight: "20px" }}>{formatRegionalDate(job.scheduleDateSort, regionalSettings)}</td>;
                    case "status":
                      return (
                        <td key="status" className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px]" style={{ fontWeight: 500, lineHeight: "16px", color: statusColors[job.status], backgroundColor: statusBg[job.status] }}>{job.status}</span>
                        </td>
                      );
                    case "total":
                      return <td key="total" className="px-4 py-4 text-[14px] text-[#1A2332] text-right" style={{ fontWeight: 400, lineHeight: "20px" }}>${job.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                    default:
                      return null;
                  }
                })}
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <KebabMenu>
                    <KebabItem icon="content_copy" onSelect={() => duplicateJob(job)}>Duplicate</KebabItem>
                    <KebabItem icon="swap_horiz" onSelect={() => openStatusModal([job.id])}>Change status</KebabItem>
                    <KebabItem icon="cancel" onSelect={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "Cancelled" } : j))}>Cancel</KebabItem>
                    <KebabSeparator />
                    <KebabItem icon="open_in_new" onSelect={() => window.open(`/jobs/${job.id}`, "_blank")}>Open in New Tab</KebabItem>
                  </KebabMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* ── Pagination (inside table card per template) ── */}
        <PaginationFooter page={currentPage} perPage={rowsPerPage} total={totalItems} onPageChange={setCurrentPage} onPerPageChange={setRowsPerPage} />
      </div>
    </div>

    {/* ── Filter Slide-over ── */}
    {filterPanelOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={() => setFilterPanelOpen(false)} />
        <div className="relative bg-white w-[400px] h-full flex flex-col overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">

          {/* Header */}
          <div className="flex items-center px-4 py-4">
            <h2 className="flex-1 text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, fontSize: 20, lineHeight: 1.35 }}>Filter</h2>
            <button onClick={() => setFilterPanelOpen(false)}
              className="flex items-center justify-center w-6 h-6 rounded text-[#546478] hover:bg-[#F3F4F6] hover:text-[#1A2332] transition-colors">
              <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-1 flex flex-col gap-2">

            {/* Section 1: Job type · Client · City dropdown */}
            <div className="flex flex-col gap-4 pb-4 border-b border-[#E5E7EB]">
              {/* Job type */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, lineHeight: "20px" }}>Job type</label>
                <select value={pendingFilters.jobType} onChange={e => setPendingFilters(p => ({ ...p, jobType: e.target.value }))}
                  className="min-h-[36px] pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }}>
                  <option value="">All</option>
                  <option value="One-off">One-off</option>
                  <option value="Recurring">Recurring</option>
                </select>
              </div>

              {/* Client */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, lineHeight: "20px" }}>Client</label>
                <select value={pendingFilters.client} onChange={e => setPendingFilters(p => ({ ...p, client: e.target.value }))}
                  className="min-h-[36px] pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }}>
                  <option value="">All</option>
                  {[...new Set(mockJobs.map(j => j.client))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* City dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, lineHeight: "20px" }}>City</label>
                <select value={pendingFilters.city} onChange={e => setPendingFilters(p => ({ ...p, city: e.target.value }))}
                  className="min-h-[36px] pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }}>
                  <option value="">All</option>
                  {[...new Set(mockJobs.map(j => { const m = j.address.match(/,\s*([^,]+),\s*[A-Z]{2}/); return m ? m[1].trim() : null; }).filter((c): c is string => Boolean(c)))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Section 2: Scheduled date */}
            <div className="flex flex-col gap-4 pb-4 pt-2 border-b border-[#E5E7EB]">
              <div className="flex gap-4 items-end">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, lineHeight: "20px" }}>Scheduled date</label>
                  <div className="relative">
                    <input type="text" placeholder="DD-MM-YYYY" value={pendingFilters.scheduleFrom}
                      onChange={e => setPendingFilters(p => ({ ...p, scheduleFrom: e.target.value }))}
                      className="w-full min-h-[36px] pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] placeholder-[#6B7280] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }} />
                    <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "16px" }}>calendar_today</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="relative">
                    <input type="text" placeholder="DD-MM-YYYY" value={pendingFilters.scheduleTo}
                      onChange={e => setPendingFilters(p => ({ ...p, scheduleTo: e.target.value }))}
                      className="w-full min-h-[36px] pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] placeholder-[#6B7280] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }} />
                    <span className="material-icons absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "16px" }}>calendar_today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Total amount + City text */}
            <div className="flex flex-col gap-4 pb-4 pt-2 border-b border-[#E5E7EB]">
              <div className="flex gap-4 items-end">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, lineHeight: "20px" }}>Total amount</label>
                  <input type="number" placeholder="min" value={pendingFilters.totalMin}
                    onChange={e => setPendingFilters(p => ({ ...p, totalMin: e.target.value }))}
                    className="min-h-[36px] px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] placeholder-[#6B7280] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                    style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }} />
                </div>
                <div className="flex flex-1 flex-col">
                  <input type="number" placeholder="max" value={pendingFilters.totalMax}
                    onChange={e => setPendingFilters(p => ({ ...p, totalMax: e.target.value }))}
                    className="min-h-[36px] px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] placeholder-[#6B7280] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                    style={{ fontFamily: "Geist, sans-serif", fontWeight: 400 }} />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4">
            <button onClick={handleClearFilters}
              className="min-h-[36px] px-4 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A2332] bg-white hover:bg-[#F9FAFB] transition-colors"
              style={{ fontFamily: "Geist, sans-serif", fontWeight: 500 }}>
              Clear All
            </button>
            <button onClick={handleApplyFilters}
              className="min-h-[36px] px-4 py-2 rounded-[8px] text-[14px] text-white bg-[#4A6FA5] hover:bg-[#3d5a85] transition-colors"
              style={{ fontFamily: "Geist, sans-serif", fontWeight: 500 }}>
              Apply
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Edit columns modal ── */}
    {editColsOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEditColsOpen(false)}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[92vw] p-6" onClick={e => e.stopPropagation()}>
          <h2 className="text-[18px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Edit columns</h2>
          <div className="flex flex-col gap-0.5 mb-5">
            {JOBS_COLS.map(col => (
              <label key={col.key} className="flex items-center gap-2.5 py-1.5 px-1 rounded-md hover:bg-[#F5F7FA] cursor-pointer text-[14px] text-[#1A2332]">
                <input
                  type="checkbox"
                  checked={pendingCols.has(col.key)}
                  onChange={() => setPendingCols(prev => { const n = new Set(prev); if (n.has(col.key)) n.delete(col.key); else n.add(col.key); return n; })}
                  className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer"
                />
                {col.label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditColsOpen(false)} className="h-9 px-4 border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#546478] text-[14px] rounded-lg" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={() => { setVisibleCols(new Set(pendingCols.size ? pendingCols : JOBS_COLS.map(c => c.key))); setEditColsOpen(false); }} className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] rounded-lg" style={{ fontWeight: 500 }}>Done</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Change status modal (radio + Inactive) ── */}
    {statusModalIds !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setStatusModalIds(null)}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[92vw] p-6" onClick={e => e.stopPropagation()}>
          <h2 className="text-[18px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Change status</h2>
          <p className="text-[13px] text-[#6B7280] mb-4">{statusModalIds.length === 1 ? "Update this job's status." : `Update ${statusModalIds.length} jobs.`}</p>
          <div className="flex flex-col gap-0.5 mb-5">
            {JOB_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-2.5 py-2 px-2 rounded-md hover:bg-[#F5F7FA] cursor-pointer">
                <input type="radio" name="job-status" checked={statusChoice === s} onChange={() => setStatusChoice(s)} className="w-4 h-4 accent-[#4A6FA5] cursor-pointer" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px]" style={{ fontWeight: 500, lineHeight: "16px", color: statusColors[s], backgroundColor: statusBg[s] }}>{s}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusModalIds(null)} className="h-9 px-4 border border-[#E5E7EB] hover:bg-[#F5F7FA] text-[#546478] text-[14px] rounded-lg" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={applyStatus} className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] rounded-lg" style={{ fontWeight: 500 }}>Save</button>
          </div>
        </div>
      </div>
    )}

    </>
    </DndProvider>
  );
}
