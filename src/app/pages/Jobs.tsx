import { useState } from "react";
import { useNavigate } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";

interface Job {
  id: number;
  jobNumber: string; // {customerId}-J{NN} format, e.g. "29899-J01"
  title: string;
  client: string;
  address: string;
  schedule: string;
  scheduleDateSort: string;
  status: "Scheduled" | "In Progress" | "Completed";
  jobType: "One-off" | "Recurring";
  total: number;
}

const mockJobs: Job[] = [
  { id: 1, jobNumber: "29899-J01", title: "AC Estimate", client: "Travis Jones", address: "4405 North Clark Avenue, Tampa, Florida 33614", schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled", jobType: "One-off", total: 0.0 },
  { id: 2, jobNumber: "29900-J01", title: "Tree Removal", client: "Sarah Johnson", address: "1220 Elm Street, Orlando, Florida 32801", schedule: "April 10, 2026", scheduleDateSort: "2026-04-10", status: "In Progress", jobType: "One-off", total: 450.0 },
  { id: 3, jobNumber: "29901-J03", title: "Monthly Lawn Care", client: "Mike Davis", address: "890 Oak Drive, Miami, Florida 33101", schedule: "April 15, 2026", scheduleDateSort: "2026-04-15", status: "Scheduled", jobType: "Recurring", total: 120.0 },
  { id: 4, jobNumber: "29902-J01", title: "Plumbing Repair", client: "Lisa Brown", address: "567 Pine Road, Jacksonville, Florida 32099", schedule: "April 6, 2026", scheduleDateSort: "2026-04-06", status: "Completed", jobType: "One-off", total: 275.0 },
];

const statusColors: Record<string, string> = {
  Scheduled: "#4A6FA5",
  "In Progress": "#D97706",
  Completed: "#16A34A",
};

const statusBg: Record<string, string> = {
  Scheduled: "#EBF0F8",
  "In Progress": "#FEF3C7",
  Completed: "#DCFCE7",
};

const statusIcons: Record<string, string> = {
  Scheduled: "event_note",
  "In Progress": "autorenew",
  Completed: "check_circle",
};

type SortField = "id" | "address" | "schedule" | "status" | "total" | "client";
type SortDir = "asc" | "desc";

function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

const JOBS_COLS = [
  { key: "id",       label: "#",         sortable: true  },
  { key: "client",   label: "Client",    sortable: true  },
  { key: "address",  label: "Address",   sortable: false },
  { key: "schedule", label: "Scheduled", sortable: true  },
  { key: "status",   label: "Status",    sortable: true  },
  { key: "total",    label: "Total",     sortable: true  },
];

export function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  // Quick filters
  const [qfStatus, setQfStatus] = useState("All");
  const [qfType, setQfType] = useState("All");
  const [qfDate, setQfDate] = useState("all_time");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobCols, moveJobCol] = useDraggableColumns(JOBS_COLS);

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

  const filtered = jobs.filter(j => {
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

  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginated = sorted.slice(startIndex, endIndex);

  const allSelected = paginated.length > 0 && paginated.every(j => selectedJobs.has(j.id));
  const handleSelectAll = (checked: boolean) => setSelectedJobs(checked ? new Set(sorted.map(j => j.id)) : new Set());
  const handleSelect = (id: number, checked: boolean) => { const s = new Set(selectedJobs); checked ? s.add(id) : s.delete(id); setSelectedJobs(s); };

  const statusCounts = { Scheduled: jobs.filter(j => j.status === "Scheduled").length, "In Progress": jobs.filter(j => j.status === "In Progress").length, Completed: jobs.filter(j => j.status === "Completed").length };

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
        count={selectedJobs.size > 0 ? `${filtered.length} records · ${selectedJobs.size} selected` : `${filtered.length} records`}
        actions={
          <>
            <CreateActionButton onClick={() => navigate("/jobs/new")}>
              Create Job
            </CreateActionButton>
            <KebabMenu triggerClassName="w-9 h-9 border border-[#E5E7EB] rounded-lg bg-white">
              <KebabItem icon="view_column">Edit Columns</KebabItem>
              <KebabItem icon="swap_horiz">Change Status</KebabItem>
              <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
              <KebabSeparator />
              <KebabItem icon="file_upload">Import</KebabItem>
              <KebabItem icon="file_download">Export</KebabItem>
            </KebabMenu>
          </>
        }
      />

      {/* ── Stats Cards (Clients-template style) ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          value={String(statusCounts["Scheduled"])}
          label="Scheduled"
          sub="upcoming"
          change="+8%"
          changeUp
          period="vs last week"
          data={[2, 3, 4, 3, 5, 4, 6]}
        />
        <StatCard
          value={String(statusCounts["In Progress"])}
          label="In progress"
          sub="active right now"
          change="+12%"
          changeUp
          period="vs last week"
          data={[1, 2, 2, 3, 4, 3, 5]}
          sparklineColor="#F59E0B"
        />
        <StatCard
          value={String(statusCounts["Completed"])}
          label="Completed"
          sub="this month"
          change="+24%"
          changeUp
          period="vs prev. month"
          data={[5, 6, 7, 8, 9, 10, 12]}
          sparklineColor="#16A34A"
        />
        <StatCard
          value={`$${jobs.reduce((sum, j) => sum + (j.total ?? 0), 0).toLocaleString("en-US")}`}
          label="Revenue"
          sub="this month"
          change="+18%"
          changeUp
          period="vs prev. month"
          data={[3, 4, 4, 5, 6, 6, 7]}
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Filter Bar */}
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
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
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
        </div>
        <SelectionBar
          count={selectedJobs.size}
          onDeselect={() => setSelectedJobs(new Set())}
          actions={[
            {
              label: "Inactivate selected",
              icon: "block",
              destructive: true,
              onClick: () => {
                setJobs(prev => prev.filter(j => !selectedJobs.has(j.id)));
                setSelectedJobs(new Set());
              },
            },
            { label: "Change status", icon: "swap_horiz", onClick: () => {} },
            { label: "Export", icon: "file_download", onClick: () => {} },
          ]}
        />
        <table className="w-full">
          <thead className="bg-[#F5F7FA]">
            <tr className="border-b border-[#E5E7EB]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
              </th>
              {jobCols.map(col => (
                <DraggableTh
                  key={col.key}
                  colKey={col.key}
                  onMove={moveJobCol}
                  className={`px-4 py-3 text-left text-[14px] text-[#1A2332] select-none${col.sortable ? " cursor-pointer" : ""}${col.key === "total" ? " text-right" : ""}`}
                  style={{ fontWeight: 500 }}
                  onClick={col.sortable ? () => toggleSort(col.key as SortField) : undefined}
                >
                  <div className={`flex items-center${col.key === "total" ? " justify-end" : ""}`}>
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
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[14px] text-[#8899AA]">No jobs found</td></tr>
            ) : paginated.map(job => (
              <tr key={job.id}
                className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer ${selectedJobs.has(job.id) ? "bg-[#EDF5FF]" : ""}`}
                onClick={() => navigate(`/jobs/${job.id}`)}>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedJobs.has(job.id)} onChange={e => handleSelect(job.id, e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                </td>
                {jobCols.map(col => {
                  switch (col.key) {
                    case "id":
                      return (
                        <td key="id" className="px-4 py-4">
                          <div className="text-[12px] text-[#8899AA] font-mono tabular-nums">{job.jobNumber}</div>
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.title}</div>
                        </td>
                      );
                    case "client":
                      return <td key="client" className="px-4 py-4 text-[13px] text-[#546478]">{job.client}</td>;
                    case "address":
                      return <td key="address" className="px-4 py-4 text-[13px] text-[#546478]">{job.address}</td>;
                    case "schedule":
                      return <td key="schedule" className="px-4 py-4 text-[13px] text-[#546478]">{job.schedule}</td>;
                    case "status":
                      return (
                        <td key="status" className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[12px]" style={{ fontWeight: 500, color: statusColors[job.status], backgroundColor: statusBg[job.status] }}>{job.status}</span>
                        </td>
                      );
                    case "total":
                      return <td key="total" className="px-4 py-4 text-[13px] text-right text-[#1A2332]" style={{ fontWeight: 500 }}>${job.total.toFixed(2)}</td>;
                    default:
                      return null;
                  }
                })}
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <KebabMenu>
                    <KebabItem icon="edit" onSelect={() => navigate(`/jobs/${job.id}`)}>Edit</KebabItem>
                    <KebabItem icon="content_copy">Duplicate</KebabItem>
                    <KebabSeparator />
                    <KebabItem icon="block" destructive>Inactivate</KebabItem>
                    <KebabSeparator />
                    <KebabItem icon="open_in_new" onSelect={() => window.open(`/jobs/${job.id}`, "_blank")}>Open in New Tab</KebabItem>
                  </KebabMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination (inside table card per template) ── */}
        <div className="flex items-center justify-between bg-white px-4 py-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-[59px] border-[#E5E7EB] text-[14px] text-[#1A2332]" style={{ fontWeight: 400, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>
              {totalItems === 0 ? "0-0" : `${startIndex + 1}-${endIndex}`} of {totalItems}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>chevron_left</span>
            </button>
            <button
              className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Next page"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Advanced Filter Slide-over ── */}
    {filterPanelOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={() => setFilterPanelOpen(false)} />
        <div className="relative bg-white w-[340px] h-full shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
            <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Advanced Filters</h2>
            <button onClick={() => setFilterPanelOpen(false)} className="text-[#546478] hover:text-[#1A2332]">
              <span className="material-icons" style={{ fontSize: "22px" }}>close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Job type */}
            <div>
              <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job type</label>
              <select value={pendingFilters.jobType} onChange={e => setPendingFilters(p => ({ ...p, jobType: e.target.value }))}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                <option value="">All</option>
                <option value="One-off">One-off</option>
                <option value="Recurring">Recurring</option>
              </select>
            </div>

            {/* Client */}
            <div>
              <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Client</label>
              <input type="text" placeholder="e.g. John Smith" value={pendingFilters.client}
                onChange={e => setPendingFilters(p => ({ ...p, client: e.target.value }))}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
            </div>

            {/* City */}
            <div>
              <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
              <input type="text" placeholder="e.g. Tampa, Orlando" value={pendingFilters.city}
                onChange={e => setPendingFilters(p => ({ ...p, city: e.target.value }))}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Schedule Date</h3>
            </div>

            {/* Schedule date range */}
            <div>
              <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>From — To</label>
              <div className="flex gap-2">
                <input type="date" value={pendingFilters.scheduleFrom}
                  onChange={e => setPendingFilters(p => ({ ...p, scheduleFrom: e.target.value }))}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                <input type="date" value={pendingFilters.scheduleTo}
                  onChange={e => setPendingFilters(p => ({ ...p, scheduleTo: e.target.value }))}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Total Amount</h3>
            </div>

            {/* Total range */}
            <div>
              <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Min — Max</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={pendingFilters.totalMin}
                  onChange={e => setPendingFilters(p => ({ ...p, totalMin: e.target.value }))}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                <span className="text-[#546478] text-[13px]">—</span>
                <input type="number" placeholder="Max" value={pendingFilters.totalMax}
                  onChange={e => setPendingFilters(p => ({ ...p, totalMax: e.target.value }))}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>

          </div>
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
            <button onClick={handleClearFilters} className="flex-1 h-10 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors" style={{ fontWeight: 500 }}>Clear all</button>
            <button onClick={handleApplyFilters} className="flex-1 h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-lg text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>Apply</button>
          </div>
        </div>
      </div>
    )}
    </>
    </DndProvider>
  );
}
