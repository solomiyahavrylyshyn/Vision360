import { useState } from "react";
import { useNavigate } from "react-router";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";

interface Job {
  id: number;
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
  { id: 1, title: "AC Estimate", client: "Travis Jones", address: "4405 North Clark Avenue, Tampa, Florida 33614", schedule: "March 30, 2026", scheduleDateSort: "2026-03-30", status: "Scheduled", jobType: "One-off", total: 0.0 },
  { id: 2, title: "Tree Removal", client: "Sarah Johnson", address: "1220 Elm Street, Orlando, Florida 32801", schedule: "April 10, 2026", scheduleDateSort: "2026-04-10", status: "In Progress", jobType: "One-off", total: 450.0 },
  { id: 3, title: "Monthly Lawn Care", client: "Mike Davis", address: "890 Oak Drive, Miami, Florida 33101", schedule: "April 15, 2026", scheduleDateSort: "2026-04-15", status: "Scheduled", jobType: "Recurring", total: 120.0 },
  { id: 4, title: "Plumbing Repair", client: "Lisa Brown", address: "567 Pine Road, Jacksonville, Florida 32099", schedule: "April 6, 2026", scheduleDateSort: "2026-04-06", status: "Completed", jobType: "One-off", total: 275.0 },
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

type SortField = "id" | "address" | "schedule" | "status" | "total" | "client";
type SortDir = "asc" | "desc";

function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

export function Jobs() {
  const navigate = useNavigate();
  const [jobs] = useState<Job[]>(mockJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  // Quick filters
  const [qfStatus, setQfStatus] = useState("All");
  const [qfType, setQfType] = useState("All");
  const [qfDate, setQfDate] = useState("all_time");

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
      return j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q) || j.address.toLowerCase().includes(q);
    }
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

  const allSelected = sorted.length > 0 && sorted.every(j => selectedJobs.has(j.id));
  const handleSelectAll = (checked: boolean) => setSelectedJobs(checked ? new Set(sorted.map(j => j.id)) : new Set());
  const handleSelect = (id: number, checked: boolean) => { const s = new Set(selectedJobs); checked ? s.add(id) : s.delete(id); setSelectedJobs(s); };

  const statusCounts = { Scheduled: jobs.filter(j => j.status === "Scheduled").length, "In Progress": jobs.filter(j => j.status === "In Progress").length, Completed: jobs.filter(j => j.status === "Completed").length };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="material-icons text-[#9AA3AF] ml-0.5" style={{ fontSize: "14px" }}>
      {sortField === field ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[26px] text-[#1A2332] flex items-center gap-2" style={{ fontWeight: 700 }}>
          Jobs
          <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
            ({selectedJobs.size > 0 ? `${filtered.length} · ${selectedJobs.size} selected` : filtered.length})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/jobs/new")}
            className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[13px] flex items-center gap-1.5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
            Create Job
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center border border-[#DDE3EE] rounded-lg bg-white text-[#546478] hover:bg-[#EDF0F5] transition-colors">
                <span className="material-icons" style={{ fontSize: "20px" }}>more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>view_column</span>Edit Columns
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>swap_horiz</span>Change Status
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>content_copy</span>Manage Duplicates
              </DropdownMenuItem>
              {selectedJobs.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => { setSelectedJobs(new Set()); }}>
                    <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>archive</span>Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => setSelectedJobs(new Set())}>
                    <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>deselect</span>Deselect All
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>file_upload</span>Import
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>file_download</span>Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["Scheduled", "In Progress", "Completed"] as const).map(s => (
          <button
            key={s}
            onClick={() => setQfStatus(qfStatus === s ? "All" : s)}
            className={`bg-white border rounded-lg px-4 py-4 text-left transition-all hover:shadow-sm ${qfStatus === s ? "border-[#4A6FA5] ring-1 ring-[#4A6FA5]/20" : "border-[#DDE3EE]"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
              <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>{s}</span>
            </div>
            <div className="text-[28px] text-[#1A2332]" style={{ fontWeight: 700 }}>{statusCounts[s]}</div>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select value={qfStatus} onChange={e => setQfStatus(e.target.value)} className={qfClass(qfStatus !== "All")}>
            <option value="All">Status: All</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select value={qfType} onChange={e => setQfType(e.target.value)} className={qfClass(qfType !== "All")}>
            <option value="All">Type: All</option>
            <option value="One-off">One-off</option>
            <option value="Recurring">Recurring</option>
          </select>

          <select value={qfDate} onChange={e => setQfDate(e.target.value)} className={qfClass(qfDate !== "all_time")}>
            <option value="all_time">Date: All time</option>
            <option value="today">Today</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-3 w-[220px] border border-[#DDE3EE] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F7FA]">
            <tr className="border-b border-[#DDE3EE]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("id")}>
                <div className="flex items-center">Job # <SortIcon field="id" /></div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("client")}>
                <div className="flex items-center">Client <SortIcon field="client" /></div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("address")}>
                <div className="flex items-center">Address <SortIcon field="address" /></div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("schedule")}>
                <div className="flex items-center">Schedule <SortIcon field="schedule" /></div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("status")}>
                <div className="flex items-center">Status <SortIcon field="status" /></div>
              </th>
              <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("total")}>
                <div className="flex items-center justify-end">Total <SortIcon field="total" /></div>
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[14px] text-[#8899AA]">No jobs found</td></tr>
            ) : sorted.map(job => (
              <tr key={job.id}
                className={`border-b border-[#DDE3EE] hover:bg-[#F9FAFB] cursor-pointer ${selectedJobs.has(job.id) ? "bg-[#EDF5FF]" : ""}`}
                onClick={() => navigate(`/jobs/${job.id}`)}>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedJobs.has(job.id)} onChange={e => handleSelect(job.id, e.target.checked)} className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]" />
                </td>
                <td className="px-4 py-4">
                  <div className="text-[12px] text-[#8899AA]">#{job.id}</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.title}</div>
                </td>
                <td className="px-4 py-4 text-[13px] text-[#546478]">{job.client}</td>
                <td className="px-4 py-4 text-[13px] text-[#546478]">{job.address}</td>
                <td className="px-4 py-4 text-[13px] text-[#546478]">{job.schedule}</td>
                <td className="px-4 py-4">
                  <span className="px-2.5 py-1 rounded-full text-[12px]" style={{ fontWeight: 500, color: statusColors[job.status], backgroundColor: statusBg[job.status] }}>{job.status}</span>
                </td>
                <td className="px-4 py-4 text-[13px] text-right text-[#1A2332]" style={{ fontWeight: 500 }}>${job.total.toFixed(2)}</td>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-[#EDF0F5] rounded transition-colors">
                        <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>more_vert</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate(`/jobs/${job.id}`)}>View Job</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Archive</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" onSelect={() => window.open(`/jobs/${job.id}`, "_blank")}>
                        Open in New Tab
                        <span className="material-icons ml-auto text-[#6B7280]" style={{ fontSize: "16px" }}>open_in_new</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
