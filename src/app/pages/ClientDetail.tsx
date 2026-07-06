import { useState, useEffect, useMemo, useSyncExternalStore, useCallback, useRef, type ReactNode } from "react";
import { DocumentPreview } from "../components/DocumentPreview";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { PlusIcon } from "../components/ui/plus-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../components/ui/dropdown-menu";
import { KebabMenu as KebabMenuShared, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { RecordTab, type RecordColumn, type RecordAction, type RecordBulkAction } from "../components/ui/record-tab";
import { toast } from "sonner";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { clientsStore, deriveClientStatus } from "../stores/clientsStore";
import { estimatesStore } from "../stores/estimatesStore";
import { jobsStore, type JobRecord } from "../stores/jobsStore";
import { invoicesStore, type InvoiceStatus } from "../stores/invoicesStore";
import { paymentsStore } from "../stores/paymentsStore";
import { JOB_STATUS_STYLES as JOB_STATUS_COLORS, JOB_STATUSES as JOB_STATUS_OPTIONS } from "../constants/jobStatuses";
import { PAYMENT_METHODS } from "../constants/paymentMethods";
import { tagsStore } from "../stores/tagsStore";
import { customFieldsStore } from "../stores/customFieldsStore";
import { relationshipsStore } from "../stores/relationshipsStore";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import installHeatingSystem1Photo from "../../assets/documents/33702-install-heating-system-1.jpg";
import installHeatingSystemPhoto from "../../assets/documents/33702-install-heating-system.jpg";
import installDuctsVentsPhoto from "../../assets/documents/33805-install-ducts-vents.jpg";
import installAc33841Photo from "../../assets/documents/33841-install-ac.jpg";
import cuPhoto from "../../assets/documents/33897-cu.jpg";
import installWaterHeaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import outdoorElectricalPanelPhoto from "../../assets/documents/34610-install-outlet-outdoor-electrical-panel.jpg";
import installAcPhoto from "../../assets/documents/34689-install-ac.jpg";
import installWaterHeaterTanklessPhoto from "../../assets/documents/34689-install-water-heater-tankless.jpg";
import job87970Photo from "../../assets/documents/87970-20241208-113711.png";
import job44644Photo from "../../assets/documents/44644-img-20241210-123749.png";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

type TabKey =
  | "details" | "appointments" | "jobs" | "estimates"
  | "invoices" | "payments" | "pos" | "addresses"
  | "service-agreements" | "documents" | "notes"
  | "equipment" | "activity" | "marketing";

const DEFAULT_TABS: { key: TabKey; label: string; count?: number }[] = [
  { key: "details",   label: "Details" },
  { key: "addresses", label: "Properties", count: 3 },
  { key: "jobs",      label: "Jobs",       count: 11 },
  { key: "estimates", label: "Estimates" },
  { key: "invoices",  label: "Invoices" },
  { key: "payments",  label: "Payments" },
  { key: "documents", label: "Documents" },
];

// Only allow http(s) URLs to be rendered as clickable links. Anything with a
// different explicit scheme (javascript:, data:, vbscript:, file:, …) is unsafe
// and returns null so the caller renders it as inert text instead of an <a>.
function safeExternalHref(url: string): string | null {
  const u = (url || "").trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return null; // some other scheme → block
  return `https://${u}`; // scheme-less (e.g. "example.com") → assume https
}

/* ── ClientJobsPanel — full list-page treatment scoped to one client ───────
   Mirrors the Jobs list page inside the client's Jobs tab: search + quick
   filters + Create job toolbar, sortable columns with row selection, a kebab
   (Duplicate / Change status / Cancel job / Open in New Tab) and pagination.
   All rows are live jobsStore records, so every action persists. */
const JOB_PANEL_COLS = [
  { key: "number",   label: "Number"    },
  { key: "schedule", label: "Scheduled" },
  { key: "status",   label: "Status"    },
  { key: "total",    label: "Total"     },
] as const;
type JobSortField = "number" | "schedule" | "status" | "total";

function ClientJobsPanel({ rows, onOpen, onCreate }: {
  rows: JobRecord[];
  onOpen: (id: number) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState("");
  const [qfStatus, setQfStatus] = useState("All");
  const [qfType, setQfType] = useState("All");
  const [qfDate, setQfDate] = useState("all_time");
  const [sortField, setSortField] = useState<JobSortField>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusTarget, setStatusTarget] = useState<number[] | null>(null);
  const [cols, moveCols] = useDraggableColumns([...JOB_PANEL_COLS]);

  // Type filter options derived from the data so we never offer a value that
  // filters everything out.
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.jobType) set.add(r.jobType); });
    return Array.from(set);
  }, [rows]);

  const inDateRange = (startDate: string) => {
    if (qfDate === "all_time") return true;
    if (!startDate) return false;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
    const today = startOfDay(now);
    const dDay = startOfDay(d);
    if (qfDate === "today") return dDay.getTime() === today.getTime();
    if (qfDate === "this_week") {
      const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
      return dDay >= weekStart && dDay < weekEnd;
    }
    if (qfDate === "this_month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.jobNumber} ${r.title} ${r.status}`.toLowerCase().includes(q)) return false;
      if (qfStatus !== "All" && r.status !== qfStatus) return false;
      if (qfType !== "All" && r.jobType !== qfType) return false;
      if (!inDateRange(r.startDate)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, qfStatus, qfType, qfDate]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "number":   return a.jobNumber.localeCompare(b.jobNumber, undefined, { numeric: true }) * dir;
        case "schedule": return ((new Date(a.startDate).getTime() || 0) - (new Date(b.startDate).getTime() || 0)) * dir;
        case "status":   return a.status.localeCompare(b.status) * dir;
        case "total":    return (a.totalPrice - b.totalPrice) * dir;
        default:         return 0;
      }
    });
  }, [filtered, sortField, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, total);
  const paginated = sorted.slice(startIdx, endIdx);

  const allSelected = paginated.length > 0 && paginated.every((r) => selected.has(r.id));
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      paginated.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  const toggleOne = (id: number, checked: boolean) =>
    setSelected((prev) => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });

  const toggleSort = (f: JobSortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("asc"); }
  };

  const duplicateJob = (job: JobRecord) => {
    const base = job.jobNumber.replace(/-J\d+$/, "");
    const suffixes = rows
      .filter((r) => r.jobNumber.startsWith(`${base}-J`))
      .map((r) => parseInt(r.jobNumber.split("-J")[1] || "0", 10))
      .filter((n) => !isNaN(n));
    const nextSuffix = (suffixes.length ? Math.max(...suffixes) : 0) + 1;
    const newNumber = `${base}-J${String(nextSuffix).padStart(2, "0")}`;
    jobsStore.add({
      jobNumber: newNumber, title: job.title, client: job.client, clientId: job.clientId,
      address: job.address, city: job.city, state: job.state, zip: job.zip,
      gateCode: job.gateCode, assignedTo: job.assignedTo, jobType: job.jobType,
      jobCategory: job.jobCategory, startDate: job.startDate, endDate: job.endDate,
      startTime: job.startTime, endTime: job.endTime, status: "Scheduled",
      totalPrice: job.totalPrice, notes: job.notes, fieldNotes: job.fieldNotes,
      privateNotes: job.privateNotes, taxRate: job.taxRate,
      estimateId: job.estimateId, estimateNumber: job.estimateNumber,
    });
    toast.success(`Duplicated as ${newNumber}`);
  };
  const cancelJobs = (ids: number[]) => {
    ids.forEach((id) => jobsStore.update(id, { status: "Cancelled" }));
    setSelected(new Set());
    toast.success(ids.length > 1 ? `${ids.length} jobs cancelled` : "Job cancelled");
  };
  const applyStatus = (status: string) => {
    (statusTarget || []).forEach((id) => jobsStore.update(id, { status }));
    setStatusTarget(null);
    setSelected(new Set());
    toast.success("Status updated");
  };

  const qfClass = (active: boolean) =>
    `h-8 px-2.5 rounded-lg border text-[13px] focus:outline-none cursor-pointer transition-colors ${
      active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] bg-white hover:border-[#C5CEDD]"
    }`;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Toolbar / selection bar (mutually exclusive) */}
        {selected.size > 0 ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#EEF3FA] border-b border-[#E5E7EB]">
            <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{selected.size} selected</span>
            <button onClick={() => setStatusTarget([...selected])} className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: "16px" }}>swap_horiz</span>Change status
            </button>
            <button onClick={() => { toast.success(`Downloading ${selected.size} job${selected.size > 1 ? "s" : ""}`); }} className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: "16px" }}>download</span>Download
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-[13px] text-[#1A2332] hover:underline" style={{ fontWeight: 500 }}>Unselect</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB] flex-wrap">
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
              <input type="text" placeholder="Search jobs..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 pl-8 pr-3 w-[200px] border border-[#E5E7EB] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
            </div>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <select value={qfStatus} onChange={(e) => { setQfStatus(e.target.value); setPage(1); }} className={qfClass(qfStatus !== "All")}>
              <option value="All">Status: All</option>
              {JOB_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {typeOptions.length > 0 && (
              <select value={qfType} onChange={(e) => { setQfType(e.target.value); setPage(1); }} className={qfClass(qfType !== "All")}>
                <option value="All">Frequency: All</option>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select value={qfDate} onChange={(e) => { setQfDate(e.target.value); setPage(1); }} className={qfClass(qfDate !== "all_time")}>
              <option value="all_time">Date: All time</option>
              <option value="today">Today</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
            </select>
            <button onClick={onCreate} title="Create job" aria-label="Create job" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#4A6FA5] hover:bg-[#EEF3FA] transition-colors">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <table className="w-full">
          <thead className="bg-[#F5F7FA]">
            <tr className="border-b border-[#E5E7EB]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
              </th>
              {cols.map((col) => (
                <DraggableTh key={col.key} colKey={col.key} onMove={moveCols}
                  className={`px-4 py-3 ${col.key === "total" ? "text-right" : "text-left"} text-[13px] text-[#1A2332] select-none cursor-pointer`}
                  style={{ fontWeight: 500 }}
                  onClick={() => toggleSort(col.key as JobSortField)}>
                  <div className={`flex items-center ${col.key === "total" ? "justify-end" : ""}`}>
                    {col.label}
                    <span className="material-icons ml-0.5" style={{ fontSize: "16px", color: sortField === col.key ? "#4A6FA5" : "#C5CEDD" }}>
                      {sortField !== col.key ? "unfold_more" : sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </div>
                </DraggableTh>
              ))}
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={cols.length + 2} className="px-4 py-12 text-center text-[14px] text-[#8899AA]">No jobs found</td></tr>
            ) : paginated.map((row) => {
              const ss = JOB_STATUS_COLORS[row.status] ?? JOB_STATUS_COLORS["Scheduled"];
              return (
                <tr key={row.id} onClick={() => onOpen(row.id)}
                  className={`border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer ${selected.has(row.id) ? "bg-[#EDF5FF]" : ""}`}>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(row.id)} onChange={(e) => toggleOne(row.id, e.target.checked)} className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]" />
                  </td>
                  {cols.map((col) => {
                    switch (col.key) {
                      case "number": return (
                        <td key="number" className="px-4 py-4">
                          <div className="text-[12px] text-[#6B7280] leading-4">{row.jobNumber}</div>
                          <div className="text-[14px] text-[#1A2332] leading-5">{row.title || "Service"}</div>
                        </td>
                      );
                      case "schedule": return <td key="schedule" className="px-4 py-4 text-[14px] text-[#6B7280]">{row.startDate ? formatRegionalDate(row.startDate) : "—"}</td>;
                      case "status": return (
                        <td key="status" className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px]" style={{ fontWeight: 600, backgroundColor: ss.bg, color: ss.color }}>{row.status}</span>
                        </td>
                      );
                      case "total": return <td key="total" className="px-4 py-4 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>${row.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                      default: return null;
                    }
                  })}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <KebabMenuShared>
                      <KebabItem icon="content_copy" onSelect={() => duplicateJob(row)}>Duplicate</KebabItem>
                      <KebabItem icon="swap_horiz" onSelect={() => setStatusTarget([row.id])}>Change status</KebabItem>
                      <KebabItem icon="block" onSelect={() => cancelJobs([row.id])}>Deactivate</KebabItem>
                      <KebabSeparator />
                      <KebabItem icon="open_in_new" onSelect={() => window.open(`/jobs/${row.id}`, "_blank")}>Open in New Tab</KebabItem>
                    </KebabMenuShared>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#6B7280]">Rows per page:</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-9 w-[72px] border-[#E5E7EB] text-[14px] text-[#1A2332]"><SelectValue /></SelectTrigger>
              <SelectContent>{[5, 10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-[13px] text-[#6B7280]">{total === 0 ? "0-0" : `${startIdx + 1}-${endIdx}`} of {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
              <span className="material-icons" style={{ fontSize: "16px" }}>chevron_left</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
              <span className="material-icons" style={{ fontSize: "16px" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change-status modal */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setStatusTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[320px] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Change status</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">{statusTarget.length > 1 ? `${statusTarget.length} jobs selected` : "Select a new status for this job."}</p>
            <div className="flex flex-col gap-1.5">
              {JOB_STATUS_OPTIONS.map((s) => {
                const c = JOB_STATUS_COLORS[s] ?? JOB_STATUS_COLORS["Scheduled"];
                return (
                  <button key={s} onClick={() => applyStatus(s)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA] text-left">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[13px] text-[#1A2332]">{s}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStatusTarget(null)} className="mt-4 w-full h-9 rounded-lg border border-[#E5E7EB] text-[13px] text-[#546478] hover:bg-[#F5F7FA]">Cancel</button>
          </div>
        </div>
      )}
    </DndProvider>
  );
}

/* ── EST_STATUS_COLORS — shared by the Estimates RecordTab grid ───────────── */
const EST_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Draft:     { bg: "#F3F4F6", color: "#6B7280"  },
  Sent:      { bg: "#DBEAFE", color: "#1E40AF"  },
  Viewed:    { bg: "#FEF3C7", color: "#92400E"  },
  "Changes Requested": { bg: "#FEF3C7", color: "#B45309" },
  Updated:   { bg: "#EBF0F8", color: "#4A6FA5"  },
  Approved:  { bg: "#DCFCE7", color: "#166534"  },
  Rejected:  { bg: "#FEE2E2", color: "#DC2626"  },
  Expired:   { bg: "#F3F4F6", color: "#6B7280"  },
  Converted: { bg: "#EBF0F8", color: "#4A6FA5"  },
  Archived:  { bg: "#E5E7EB", color: "#4B5563"  },
};
/* ── InvoiceRow / invoiceRows — seed data + type for the Invoices RecordTab grid ── */
interface InvoiceRow {
  id: number; invoiceNo: string; jobNo: string; jobName?: string; type: string;
  status: string; note: string;
  date: string;
  total: string; balance: string; dueDate: string;
}
const invoiceRows: InvoiceRow[] = [
  { id: 1, invoiceNo: "INV-2026-0041", jobNo: "J-1048", jobName: "Plumbing fix",   type: "Service",      status: "Overdue",         note: "Progress invoice", date: "Mar 15, 2026", total: "$1,240.00", balance: "$1,240.00", dueDate: "Apr 14, 2026" },
  { id: 2, invoiceNo: "INV-2026-0035", jobNo: "J-1039", jobName: "AC tune-up",     type: "Service",      status: "Paid",            note: "Progress invoice", date: "Feb 20, 2026", total: "$890.00",   balance: "$0.00",     dueDate: "Mar 22, 2026" },
  { id: 3, invoiceNo: "INV-2025-0198", jobNo: "J-0997", jobName: "Filter swap",    type: "Maintenance",  status: "Paid",            note: "Progress invoice", date: "Nov 4, 2025",  total: "$430.00",   balance: "$0.00",     dueDate: "Dec 4, 2025"  },
  { id: 4, invoiceNo: "INV-2025-0177", jobNo: "J-0981", jobName: "Heat pump inst", type: "Installation", status: "Paid",            note: "Progress invoice", date: "Sep 8, 2025",  total: "$3,750.00", balance: "$0.00",     dueDate: "Oct 8, 2025"  },
  { id: 5, invoiceNo: "INV-2026-0048", jobNo: "J-1054", jobName: "Drain clear",    type: "Service",      status: "Partially paid",  note: "Progress invoice", date: "Apr 28, 2026", total: "$560.00",   balance: "$560.00",   dueDate: "May 28, 2026" },
];

// Status → badge colour (shared by the inner Invoices / Payments grids).
const RECORD_STATUS_STYLE: Record<string, { color: string; backgroundColor: string }> = {
  Paid:             { color: "#16A34A", backgroundColor: "rgba(22,163,74,0.15)" },
  Completed:        { color: "#16A34A", backgroundColor: "rgba(22,163,74,0.15)" },
  Overdue:          { color: "#DC2626", backgroundColor: "rgba(220,38,38,0.15)" },
  Unpaid:           { color: "#DC2626", backgroundColor: "rgba(220,38,38,0.15)" },
  Failed:           { color: "#DC2626", backgroundColor: "rgba(220,38,38,0.15)" },
  "Partially paid": { color: "#F59E0B", backgroundColor: "rgba(245,158,11,0.15)" },
  "Partially Paid": { color: "#F59E0B", backgroundColor: "rgba(245,158,11,0.15)" },
  Pending:          { color: "#F59E0B", backgroundColor: "rgba(245,158,11,0.15)" },
  Void:             { color: "#6B7280", backgroundColor: "rgba(107,114,128,0.15)" },
  Refunded:         { color: "#6B7280", backgroundColor: "rgba(107,114,128,0.15)" },
};
function RecordStatusBadge({ status }: { status: string }) {
  const s = RECORD_STATUS_STYLE[status] || { color: "#6B7280", backgroundColor: "rgba(107,114,128,0.15)" };
  return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px] whitespace-nowrap" style={{ fontWeight: 500, ...s }}>{status}</span>;
}

// Columns for the inner Invoices grid (Figma: Number · Job · Status · Date ·
// Due date · Total · Balance · Note).
const INVOICE_GRID_COLS: RecordColumn<InvoiceRow>[] = [
  { key: "number",  label: "Number",   render: (r) => <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{r.invoiceNo}</span> },
  { key: "job",     label: "Job",      render: (r) => r.jobNo ? (<div><div className="text-[#4A6FA5] text-[14px]" style={{ fontWeight: 500 }}>{r.jobNo}</div><div className="text-[13px] text-[#6B7280]">{r.jobName}</div></div>) : <span className="text-[#9CA3AF]">—</span> },
  { key: "status",  label: "Status",   render: (r) => <RecordStatusBadge status={r.status} /> },
  { key: "date",    label: "Date",     render: (r) => <span className="text-[#1A2332]">{r.date}</span> },
  { key: "dueDate", label: "Due date", render: (r) => <span className="text-[#1A2332]">{r.dueDate}</span> },
  { key: "total",   label: "Total",    align: "right", render: (r) => <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{r.total}</span> },
  { key: "balance", label: "Balance",  align: "right", render: (r) => <span style={{ fontWeight: 500, color: r.balance === "$0.00" ? "#16A34A" : "#DC2626" }}>{r.balance}</span> },
  { key: "note",    label: "Note",     render: (r) => <span className="text-[#6B7280]">{r.note || "—"}</span> },
];

// Columns for the inner Payments grid.
const PAYMENT_GRID_COLS: RecordColumn<PaymentRow>[] = [
  { key: "invoiceNo", label: "Invoice", render: (r) => <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{r.invoiceNo}</span> },
  { key: "date",      label: "Date",    render: (r) => <span className="text-[#1A2332]">{r.date}</span> },
  { key: "method",    label: "Method",  render: (r) => <span className="text-[#1A2332]">{r.method}</span> },
  { key: "status",    label: "Status",  render: (r) => <RecordStatusBadge status={r.status} /> },
  { key: "note",      label: "Note",    render: (r) => <span className="text-[#6B7280]">{r.note || "—"}</span> },
  { key: "amount",    label: "Amount",  align: "right", render: (r) => <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{r.amount}</span> },
];
/* ── PaymentRow / paymentRows — seed data + type for the Payments RecordTab grid ── */
interface PaymentRow {
  id: number; invoiceNo: string; date: string;
  method: string; status: string; note: string; amount: string;
}
const paymentRows: PaymentRow[] = [
  { id: 1, invoiceNo: "INV-2026-0035", date: "Mar 22, 2026", method: "ACH",         status: "Completed", note: "" },
  { id: 2, invoiceNo: "INV-2025-0198", date: "Dec 3, 2025",  method: "Credit Card", status: "Completed", note: "" },
  { id: 3, invoiceNo: "INV-2025-0177", date: "Oct 7, 2025",  method: "Check",       status: "Completed", note: "Partial - check #4421" },
  { id: 4, invoiceNo: "INV-2025-0177", date: "Oct 20, 2025", method: "ACH",         status: "Completed", note: "Final balance" },
].map((r, i) => ({ ...r, amount: ["$890.00","$430.00","$2,000.00","$1,750.00"][i] }));

export function ClientDetail() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabRaw] = useState<TabKey>(() => {
    const t = searchParams.get("tab") as TabKey | null;
    return t && DEFAULT_TABS.some((d) => d.key === t) ? t : "details";
  });
  // Keep ?tab= in sync so the URL is always shareable and the browser back
  // button lands on the right tab after a create-page round-trip.
  const setActiveTab = (key: TabKey) => {
    setActiveTabRaw(key);
    const next = new URLSearchParams(searchParams);
    if (key === "details") next.delete("tab"); else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    const t = searchParams.get("tab") as TabKey | null;
    if (t && DEFAULT_TABS.some((d) => d.key === t)) setActiveTabRaw(t);
  }, [searchParams]);
  const [tabs] = useState(DEFAULT_TABS);
  const [hiddenTabs, setHiddenTabs] = useState<Set<TabKey>>(new Set());
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [pendingHidden, setPendingHidden] = useState<Set<TabKey>>(new Set()); // staged edits for the Edit tabs modal
  const tabSettingsRef = useRef<HTMLDivElement>(null);
  // Invoices & payments render from the live invoicesStore / paymentsStore,
  // filtered by client — see clientInvoiceRows / clientPaymentRows below.

  const toggleTabVisibility = (key: TabKey) => {
    setHiddenTabs(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); }
      else {
        next.add(key);
        // if we're hiding the active tab, switch to first visible
        if (activeTab === key) {
          const firstVisible = tabs.find(t => t.key !== key && !next.has(t.key));
          if (firstVisible) setActiveTab(firstVisible.key);
        }
      }
      return next;
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<null | "name" | "contact" | "addresses" | "finance">(null);
  const [clientStatusOpen, setClientStatusOpen] = useState(false);
  const clientStatusColors: Record<string, string> = { Prospect: "#4A6FA5", Active: "#16A34A", Inactive: "#6B7280" };
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());

  interface ServiceAddress {
    id: string; street: string; unit: string; city: string; state: string;
    zip: string; county: string; notes: string; isPrimary: boolean;
  }
  // serviceAddresses now lives on the unified client record (per-client, persisted
  // to Postgres). Derived from `client` below, once it's in scope.
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ street: "", unit: "", city: "", state: "", zip: "", county: "", notes: "" });
  // Additional-contacts inline editor (Contact Information card)
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ firstName: "", lastName: "", phone: "", email: "", relationship: "" });
  const relationships = useSyncExternalStore(relationshipsStore.subscribe, relationshipsStore.getRelationships);
  // Edit address / Edit address notes modals (Figma 489:35769 / 489:36354)
  const [editAddressId, setEditAddressId] = useState<string | null>(null); // null = editing the main service address
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: "", unit: "", city: "", state: "", zip: "", county: "", country: "United States", notes: "" });
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  // Reusable delete confirmation (Figma 489:34912)
  const [pendingDelete, setPendingDelete] = useState<null | (() => void)>(null);
  // Guard modal shown when trying to delete the only remaining service address.
  const [lastAddressGuardOpen, setLastAddressGuardOpen] = useState(false);
  // Statement activity slide-over
  const [statementOpen, setStatementOpen] = useState(false);
  // Invoice "Change status": modal to pick from all invoice statuses.
  const [statusModalIds, setStatusModalIds] = useState<number[] | null>(null);
  // Document rename modal
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameDocDraft, setRenameDocDraft] = useState("");

  interface DocFile { id: string; name: string; size: string; date: string; icon: string; iconColor: string; isImage?: boolean; previewUrl?: string; previewGradient?: string; uploadedBy?: string; category?: string; }
  // Sample media — shown only for clients with real activity. A brand-new client
  // (no jobs/billing/revenue) starts with an empty Documents tab (was a phantom 11).
  const SEED_DOCUMENTS: DocFile[] = [
    { id: "photo-34610-outdoor-electrical-panel", name: "Copy of 34610 Install outlet outdoor electrical panel.jpg", size: "3.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: outdoorElectricalPanelPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33841-ac", name: "Copy of 33841 Install AC.jpg", size: "2.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAc33841Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34689-tankless", name: "Copy of 34689 Install Water Heater Tankless.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterTanklessPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34689-ac", name: "Copy of 34689 Install AC.jpg", size: "2.7 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAcPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34285-water-heater", name: "Copy of 34285 Install Water Heater.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33897-cu", name: "Copy of 33897 cu.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: cuPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33805-ducts", name: "Copy of 33805 Install ducts & vents.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installDuctsVentsPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33702-heating-1", name: "Copy of 33702 Install heating system (1).jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystem1Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33702-heating", name: "Copy of 33702 Install heating system.jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystemPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-87970", name: "87970_20241208_113711.png", size: "10.0 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job87970Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-44644", name: "44644_IMG_20241210_123749.png", size: "9.5 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job44644Photo, uploadedBy: "Field Crew", category: "Photos" },
  ];
  // Demo documents belong to ONE specific client (John Smith, id 10245) so they
  // are NEVER shown for other clients — opening any other client starts with an
  // empty Documents tab. Real per-client documents would come from the store.
  const DEMO_DOCS_CLIENT_ID = "10245";
  const [documents, setDocuments] = useState<DocFile[]>(() =>
    routeId === DEMO_DOCS_CLIENT_ID ? SEED_DOCUMENTS : [],
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Selected file for the right-side preview panel (rename / download / delete)
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const previewFile = documents.find(d => d.id === previewFileId) ?? null;
  // Batch selection state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const toggleSelected = (id: string) =>
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  // Document quick-filter state (per Marek: search by file name, filter by uploader/category/date)
  const [docSearch, setDocSearch] = useState("");
  const [docDate, setDocDate] = useState("all");
  const [docCategory, setDocCategory] = useState("all");
  const [docUploader, setDocUploader] = useState("all");
  const [docSortField, setDocSortField] = useState<"name" | "date" | "type" | "size" | "uploadedBy">("name");
  const [docSortDir, setDocSortDir] = useState<"asc" | "desc">("asc");
  // Inline preview-pane state (mirrors the EstimateDetail Documents UX)
  const [docPreviewIdx, setDocPreviewIdx] = useState(0);
  const [docsPage, setDocsPage] = useState(0);
  const [docPreviewPaneOpen, setDocPreviewPaneOpen] = useState(true);
  const DOCS_PER_PAGE = 12; // 3 columns x 4 rows of miniature thumbnails (left rail)
  const uploaderOptions = Array.from(new Set(documents.map(d => d.uploadedBy).filter(Boolean) as string[]));
  const filteredDocuments = documents.filter(d => {
    if (docSearch && !d.name.toLowerCase().includes(docSearch.toLowerCase())) return false;
    if (docCategory !== "all" && d.category !== docCategory) return false;
    if (docUploader !== "all" && d.uploadedBy !== docUploader) return false;
    if (docDate !== "all") {
      const docTs = new Date(d.date).getTime();
      const now = Date.now();
      const days = docDate === "7" ? 7 : docDate === "30" ? 30 : 90;
      if (now - docTs > days * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });
  const parseDocSize = (size: string) => {
    const [rawValue, rawUnit = "B"] = size.split(" ");
    const value = Number(rawValue) || 0;
    const unit = rawUnit.toUpperCase();
    if (unit.startsWith("GB")) return value * 1024 * 1024 * 1024;
    if (unit.startsWith("MB")) return value * 1024 * 1024;
    if (unit.startsWith("KB")) return value * 1024;
    return value;
  };
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dir = docSortDir === "asc" ? 1 : -1;
    if (docSortField === "name") return a.name.localeCompare(b.name) * dir;
    if (docSortField === "date") return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    if (docSortField === "type") {
      const aType = a.name.split(".").pop()?.toLowerCase() || "";
      const bType = b.name.split(".").pop()?.toLowerCase() || "";
      return aType.localeCompare(bType) * dir || a.name.localeCompare(b.name) * dir;
    }
    if (docSortField === "size") return (parseDocSize(a.size) - parseDocSize(b.size)) * dir;
    return (a.uploadedBy || "").localeCompare(b.uploadedBy || "") * dir || a.name.localeCompare(b.name) * dir;
  });

  const getFileIcon = (name: string): { icon: string; iconColor: string } => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["pdf"].includes(ext))                    return { icon: "picture_as_pdf", iconColor: "#DC2626" };
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) return { icon: "image",          iconColor: "#F59E0B" };
    if (["doc","docx"].includes(ext))             return { icon: "description",    iconColor: "#2563EB" };
    if (["xls","xlsx","csv"].includes(ext))       return { icon: "table_chart",    iconColor: "#16A34A" };
    if (["zip","rar","7z"].includes(ext))         return { icon: "folder_zip",     iconColor: "#7C3AED" };
    return { icon: "insert_drive_file", iconColor: "#6B7280" };
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const today = formatRegionalDate(new Date());
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    Array.from(files).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const isImage = imageExts.includes(ext);
      const id = Math.random().toString(36).slice(2);
      const doc: DocFile = { id, name: f.name, size: formatSize(f.size), date: today, ...getFileIcon(f.name), isImage };
      setDocuments((prev) => [doc, ...prev]);
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, previewUrl: String(reader.result) } : d));
        };
        reader.readAsDataURL(f);
      }
    });
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
  };
  // Auto-transition rules (server-driven in production):
  //   prospect → active   when first invoice with payment > 0 is recorded
  //   active   → on-hold  when an invoice is past due
  //   on-hold  → active   when past-due balance is settled
  const daysOverdue = 18;
  const cfClientFields = useSyncExternalStore(
    customFieldsStore.subscribe,
    useCallback(() => customFieldsStore.getEntityFields("clients"), [])
  );
  const availableTags = useSyncExternalStore(
    tagsStore.subscribe,
    tagsStore.getTags
  );

  // Single source of truth: load THIS client from the shared store by URL :id.
  const allClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const client = useMemo(
    () => allClients.find((c) => c.id === routeId) ?? allClients[0],
    [allClients, routeId],
  );
  // Whether the URL :id actually resolves to a real client. When it doesn't
  // (e.g. a stale/never-persisted id), we render a "not found" screen instead
  // of silently falling back to the first client (which masked the mismatch).
  const clientExists = useMemo(
    () => allClients.some((c) => c.id === routeId),
    [allClients, routeId],
  );

  // Build a create-page URL pre-populated with this client + a return path that
  // brings the user back to the originating tab after they save/cancel.
  const createUrl = (path: string, tab: TabKey, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      client: client.name,
      clientId: client.customerId,
      returnTo: `/clients/${client.id}?tab=${tab}`,
      ...extra,
    });
    return `${path}?${params.toString()}`;
  };

  const [editedClient, setEditedClient] = useState(client);
  // Re-seed the edit form whenever the active client changes (id switch or store update).
  useEffect(() => { setEditedClient(client); }, [client]);
  // Reset the (sample) documents per client so navigating to a fresh client
  // doesn't carry over the previous client's media. New clients → empty.
  useEffect(() => { setDocuments(client.id === DEMO_DOCS_CLIENT_ID ? SEED_DOCUMENTS : []); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [client.id]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedClient(client);
    if (activeTab !== "details") setActiveTab("details");
  };

  const handleSaveClick = () => {
    // Every client must carry name, a primary phone and an address (Marek rule).
    const firstName = (editedClient.firstName || "").trim();
    const lastName = (editedClient.lastName || "").trim();
    const phone = (editedClient.mobilePhone || "").trim();
    const hasAddress = Boolean((editedClient.address || "").trim()) || serviceAddresses.length > 0;
    if (!firstName || !lastName) { toast.error("First and last name are required"); return; }
    if (!phone) { toast.error("A primary phone number is required"); return; }
    if (!hasAddress) { toast.error("A service address is required — add one in the Properties tab"); return; }
    clientsStore.updateClient(client.id, editedClient);
    toast.success("Client updated successfully");
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedClient((prev) => ({ ...prev, [field]: value }));
  };

  /* ── work data ── */
  // Per-client service addresses from the unified record (mutations persist via the store).
  const serviceAddresses = client.serviceAddresses ?? [];

  // Per-client work data: only show sample rows for clients that actually have
  // the corresponding activity, so a brand-new client reads 0 across the board
  // instead of inheriting shared demo rows.
  const hasEstimates = (client.estimatesTotal ?? 0) > 0;
  const hasBilling = (client.totalBilled ?? 0) > 0;
  // Live jobs for this client from jobsStore — any job created via Convert or
  // Create Job (linked by client name or clientId) appears here immediately.
  const allStoreJobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const liveClientJobs = (() => {
    // Match by clientId when the job carries one (exact link), otherwise fall
    // back to name. This prevents two different clients that happen to share a
    // display name from bleeding each other's jobs onto their pages.
    const matched = allStoreJobs.filter((j) =>
      j.clientId ? j.clientId === client.id : j.client === client.name
    );
    // Dedupe by jobNumber so a job that matched on both name AND id, or stale
    // duplicate records from earlier sessions, only render once.
    const seen = new Set<string>();
    return matched.filter((j) => {
      const key = j.jobNumber || String(j.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  // Status follows the work: ≥1 job (live store, or the seeded totalJobs) → Active;
  // none → Prospect. An explicit "Inactive" flag still wins. Active/Prospect is automatic.
  const clientJobCount = Math.max(client.totalJobs ?? 0, liveClientJobs.length);
  const derivedStatus = deriveClientStatus(client.status, clientJobCount);
  // Merge: show live store jobs, then fall back to legacy demo rows for clients
  // that have `totalJobs > 0` but nothing in the store yet.
  const jobItems = liveClientJobs.length > 0
    ? liveClientJobs.map((j) => ({
        id: j.id,
        type: "job",
        title: `Job ${j.jobNumber}`,
        subtitle: j.title || "Service",
        date: j.startDate ? `Scheduled for ${j.startDate}` : "",
        amount: `$${j.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        _jobId: j.id,
      }))
    : Array.from({ length: client.totalJobs }, (_, i) => ({
        id: i + 2,
        type: "job",
        title: `Job #${i + 1}`,
        subtitle: "AC Estimate",
        date: i < client.openJobs ? "Scheduled for Mar 30, 2026" : "Completed Mar 15, 2026",
        amount: "$0.00",
      }));
  // Live estimates for this client from the persistent estimatesStore so newly
  // created estimates land here immediately. We fall back to a single demo row
  // for legacy clients that have a non-zero `estimatesTotal` but no store entry.
  const allEstimates = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const liveClientEstimates = allEstimates
    // Match by clientId when present (exact link); fall back to name only for
    // legacy records with no clientId — prevents same-name data bleed.
    .filter((e) => e.clientId ? e.clientId === client.id : e.clientName === client.name)
    // Attach the jobs linked to each estimate so the table can show job IDs
    // (Marek, Jun 8). Sources: the estimate's own appointment job (`job`/`jobTitle`)
    // plus any jobs created FROM it in jobsStore (matched by estimateId/number).
    .map((e) => {
      const jobs: Array<{ number: string; name: string }> = [];
      const push = (number: string, name: string) => {
        if (number && !jobs.some((j) => j.number === number)) jobs.push({ number, name });
      };
      if ((e as { job?: string }).job) push((e as { job?: string }).job!, (e as { jobTitle?: string }).jobTitle ?? "");
      allStoreJobs
        .filter((j) => (j.estimateId != null && j.estimateId === e.id) || (!!j.estimateNumber && !!e.estimateNumber && j.estimateNumber === e.estimateNumber))
        .forEach((j) => push(j.jobNumber || String(j.id), j.title || ""));
      return { ...e, jobs };
    });
  // Invoices & payments for this client come from the live stores, so a created
  // invoice/payment appears here immediately and survives a refresh. Records link
  // by client name.
  const allClientInvoices = useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot);
  const allClientPayments = useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getSnapshot);
  const clientStoreInvoices = allClientInvoices.filter((i) => i.clientName === client.name);
  const clientStorePayments = allClientPayments.filter((p) => p.clientName === client.name);
  const moneyStr = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtISO = (d: string) => (d ? formatRegionalDate(new Date(d + "T12:00:00")) : "—");
  const clientInvoiceRows: InvoiceRow[] = clientStoreInvoices.map((i) => ({
    id: i.id, invoiceNo: i.number, jobNo: i.jobNumber || "", jobName: i.jobName || "",
    type: i.type, status: i.status, note: i.memo || "",
    date: fmtISO(i.date), total: moneyStr(i.total), balance: moneyStr(i.balance), dueDate: fmtISO(i.dueDate),
  }));
  const clientPaymentRows: PaymentRow[] = clientStorePayments.map((p) => ({
    id: p.id, invoiceNo: p.invoiceNumber || "—", date: fmtISO(p.date),
    method: p.method, status: p.status, note: p.note || "", amount: moneyStr(p.amount),
  }));
  // Header financial tiles: when the client has live billing data, derive the
  // figures from it so the tiles match the tabs; otherwise keep the seeded numbers.
  const hasLiveBilling = clientStoreInvoices.length > 0 || clientStorePayments.length > 0;
  const tileRevenue = hasLiveBilling ? clientStoreInvoices.reduce((s, i) => s + i.total, 0) : client.totalRevenue;
  const tileBalance = hasLiveBilling ? clientStoreInvoices.reduce((s, i) => s + i.balance, 0) : client.openBalance;
  const tilePastDue = hasLiveBilling ? clientStoreInvoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.balance, 0) : client.pastDueBalance;

  // Visible tabs with LIVE counts derived from the actual data arrays (no hardcoded literals).
  const visibleTabs = tabs
    .filter((t) => !hiddenTabs.has(t.key))
    .map((t) => {
      if (t.key === "addresses") return { ...t, count: serviceAddresses.length };
      if (t.key === "jobs") return { ...t, count: liveClientJobs.length };
      if (t.key === "estimates") return { ...t, count: liveClientEstimates.length };
      if (t.key === "invoices") return { ...t, count: clientInvoiceRows.length };
      if (t.key === "documents") return { ...t, count: documents.length };
      if (t.key === "payments") return { ...t, count: clientPaymentRows.length };
      return t;
    });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  /* ──────────────────────────────────────────
     CREATE DROPDOWN (reusable)
  ────────────────────────────────────────── */
  const CreateDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-9 px-4 text-white text-[13px]">
          <PlusIcon className="mr-1.5 shrink-0" />
          Create
          <span className="material-icons ml-1 -mr-1 shrink-0" style={{ fontSize: "18px" }}>keyboard_arrow_down</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[185px] p-0.5">
        {([
          { label: "Estimate", icon: "schedule",                path: "/estimates/new", tab: "estimates" as TabKey },
          { label: "Job",      icon: "work_outline",            path: "/jobs/new",      tab: "jobs" as TabKey },
          { label: "Invoice",  icon: "description",             path: "/invoices/new",  tab: "invoices" as TabKey },
          { label: "Payment",  icon: "account_balance_wallet",  path: "/payments/new",  tab: "payments" as TabKey },
        ]).map(({ label, icon, path, tab }) => (
          <DropdownMenuItem
            key={label}
            className="flex items-center gap-2 h-8 min-h-8 rounded-md px-2"
            onClick={() => navigate(createUrl(path, tab))}
          >
            <span className="material-icons text-[#6B7280]" style={{ fontSize: "20px" }}>{icon}</span>
            <span className="text-[14px] text-[#1A2332]">{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ──────────────────────────────────────────
     KEBAB MENU
  ────────────────────────────────────────── */
  const KebabMenu = () => (
    <KebabMenuShared triggerClassName="w-9 h-9 border border-[#E5E7EB] rounded-lg bg-white" contentClassName="min-w-[200px]">
      <KebabItem icon="print" onClick={() => { setStatementOpen(true); setTimeout(() => window.print(), 300); }}>Print</KebabItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2 rounded-md px-2 text-[14px] text-[#1A2332]" style={{ height: 32, minHeight: 32 }}>
          <span className="material-icons text-[#6B7280]" style={{ fontSize: "20px" }}>description</span>
          <span className="flex-1">Statement actions</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[185px] p-0.5">
          <KebabItem icon="mail" onClick={() => setStatementOpen(true)}>Email statement</KebabItem>
          <KebabItem icon="print" onClick={() => { setStatementOpen(true); setTimeout(() => window.print(), 300); }}>Print statement</KebabItem>
          <KebabItem icon="visibility" onClick={() => setStatementOpen(true)}>View statement</KebabItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <KebabItem icon="account_balance_wallet" onClick={() => navigate(createUrl("/payments/new", "payments", { amount: String(client.openBalance), method: client.paymentMethod || "" }))}>Collect Payment</KebabItem>
    </KebabMenuShared>
  );


  /* ──────────────────────────────────────────
     DETAILS READ-ONLY
  ────────────────────────────────────────── */
  const DetailsView = () => (
    <div className="grid grid-cols-3 gap-4 items-stretch">

      {/* Card 1: Contact Information */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header — Figma: 16px title + bordered edit button, no leading icon/divider */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Contact information</span>
          <button
            onClick={() => { setEditedClient(client); setEditingSection("contact"); }}
            className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors"
            aria-label="Edit contact"
          >
            <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* Fields — always shown to match Figma 488:31819 (empty → "—") */}
          {(
            [
              ["Primary phone", client.mobilePhone, false],
              ["Secondary phone", client.workPhone ? `${client.workPhone}${client.workPhoneExt ? ` ext. ${client.workPhoneExt}` : ""}` : "", false],
              ["Email", client.email, false],
              ["Website", client.website, true],
              ["Company name", client.company, false],
              ["Role", client.role, false],
              ["Customer since", client.customerSince, false],
            ] as [string, string, boolean][]
          ).map(([label, value, isLink]) => (
            <div key={label}>
              <div className="text-[14px] text-[#6B7280] leading-[20px]">{label}</div>
              {value ? (
                isLink && safeExternalHref(value) ? (
                  <a href={safeExternalHref(value)!} target="_blank" rel="noopener noreferrer nofollow" className="text-[14px] text-[#4A6FA5] hover:underline break-all" style={{ fontWeight: 500 }}>{value}</a>
                ) : (
                  <div className="text-[14px] text-[#1A2332] break-all" style={{ fontWeight: 500 }}>{value}</div>
                )
              ) : (
                <div className="text-[14px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>—</div>
              )}
            </div>
          ))}

          {/* Additional contacts — add / edit / delete (Figma 488:31847) */}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Additional contacts</div>

            {(client.additionalContacts ?? []).map((c) => (
              <div key={c.id} className="group flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                    {c.relationship && <span className="text-[14px] text-[#6B7280]">{c.relationship}</span>}
                  </div>
                  {c.phone && <div className="text-[14px] text-[#6B7280] leading-[20px]">{c.phone}</div>}
                  {c.email && <div className="text-[14px] text-[#6B7280] leading-[20px]">{c.email}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    aria-label="Edit contact"
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F7FA] text-[#9CA3AF] hover:text-[#4A6FA5]"
                    onClick={() => { setEditingContactId(c.id); setContactForm({ firstName: c.firstName, lastName: c.lastName, phone: c.phone, email: c.email, relationship: c.relationship }); setContactFormOpen(true); }}
                  >
                    <span className="material-icons" style={{ fontSize: "15px" }}>edit</span>
                  </button>
                  <button
                    aria-label="Delete contact"
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626]"
                    onClick={() => setPendingDelete(() => () => clientsStore.updateClient(client.id, { additionalContacts: (client.additionalContacts ?? []).filter((x) => x.id !== c.id) }))}
                  >
                    <span className="material-icons" style={{ fontSize: "15px" }}>delete_outline</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => { setEditingContactId(null); setContactForm({ firstName: "", lastName: "", phone: "", email: "", relationship: "" }); setContactFormOpen(true); }}
              className="flex items-center gap-2 text-[14px] text-[#4A6FA5] hover:underline"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
              Add additional contact
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Addresses + Billing details — two stacked cards (Figma) */}
      <div className="flex flex-col gap-4">
      {/* Card 2: Addresses */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header — Figma: 16px title + bordered edit button */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Addresses</span>
          <button
            onClick={() => { setEditAddressId(null); setAddressForm({ street: client.address, unit: client.unit, city: client.city, state: client.state, zip: client.zip, county: client.county, country: client.country || "United States", notes: client.gateCode }); setEditAddressOpen(true); }}
            className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors"
            aria-label="Edit address"
          >
            <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* Billing Address */}
          <div>
            <div className="text-[12px] font-semibold text-[#1A2332] mb-1">Billing Address</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingAddress}</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingCity}, {client.billingState} {client.billingZip}</div>
            {client.gateCode && <div className="text-[12px] text-[#6B7280] mt-1">Gate code: {client.gateCode}</div>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-4 border-b border-[#E5E7EB]">
            <input
              type="checkbox"
              checked={clientData.isBillingSameAsService}
              onChange={(e) => handleCheckboxChange("isBillingSameAsService", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[13px] text-[#4B5563]">Use as service address</span>
          </label>
          {/* Service Address — Figma: inline gate code, own edit pencil, empty state */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#1A2332] mb-1">Service Address</div>
              {clientData.isBillingSameAsService ? (
                <>
                  <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingAddress}</div>
                  <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingCity}, {client.billingState} {client.billingZip}</div>
                  {client.gateCode && <div className="text-[12px] text-[#6B7280] mt-1">Gate code: {client.gateCode}</div>}
                </>
              ) : client.address ? (
                <>
                  <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.address}</div>
                  <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.city}, {client.state} {client.zip}</div>
                  {client.gateCode && <div className="text-[12px] text-[#6B7280] mt-1">Gate code: {client.gateCode}</div>}
                </>
              ) : (
                <div className="text-[13px] text-[#6B7280]">
                  No service address yet.{" "}
                  <button onClick={() => navigate(`/clients/${client.id}?tab=properties`)} className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>Go to properties</button>
                </div>
              )}
            </div>
            <button
              onClick={() => { setEditAddressId(null); setAddressForm({ street: client.address, unit: client.unit, city: client.city, state: client.state, zip: client.zip, county: client.county, country: client.country || "United States", notes: client.gateCode }); setEditAddressOpen(true); }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F7FA] text-[#9CA3AF] hover:text-[#1A2332] shrink-0"
              aria-label="Edit service address"
            >
              <span className="material-icons" style={{ fontSize: "15px" }}>edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 2b: Billing details — separate card with Taxable Customer (Figma) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Billing details</span>
          <button
            onClick={() => { setEditedClient(client); setEditingSection("finance"); }}
            className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors"
            aria-label="Edit billing details"
          >
            <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="px-4 pt-3 pb-4 space-y-4">
          <div>
            <div className="text-[14px] text-[#6B7280] leading-[20px]">Payment terms</div>
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{clientData.paymentTerms || "—"}</div>
          </div>
          <div>
            <div className="text-[14px] text-[#6B7280] leading-[20px]">Preferred method</div>
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{clientData.paymentMethod || "—"}</div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={clientData.isTaxable} onChange={(e) => handleCheckboxChange("isTaxable", e.target.checked)} className="w-4 h-4 accent-[#4A6FA5]" />
            <span className="text-[14px] text-[#1A2332]">Taxable client</span>
          </label>
        </div>
      </div>
      </div>

      {/* Card 3: Notes */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header — Figma: 16px title + bordered add button */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>
            Notes
            {clientData.notesArray.length > 0 && (
              <span className="ml-1 text-[#9CA3AF]" style={{ fontWeight: 400 }}>({clientData.notesArray.length})</span>
            )}
          </span>
          <button
            onClick={() => { setAddingNote(true); setNewNoteText(""); }}
            className="w-8 h-8 flex items-center justify-center border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors"
            aria-label="Add note"
          >
            <PlusIcon className="h-4 w-4 text-[#1A2332]" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          {clientData.notesArray.length === 0 && !addingNote && (
            <div className="py-6 text-center text-[12px] text-[#9CA3AF]">No notes yet</div>
          )}
          <>{(notesExpanded ? clientData.notesArray : clientData.notesArray.slice(0, 4)).map((note, index, arr) => {
            const isLong = note.text.length > 120;
            const isExpanded = expandedNoteIds.has(note.id);
            const isEditingThis = editingNoteId === note.id;
            return (
              <div key={note.id} className={`group py-3 ${index < arr.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                {isEditingThis ? (
                  /* ── Edit mode ── */
                  <div>
                    <textarea
                      autoFocus
                      value={editingNoteText}
                      onChange={e => setEditingNoteText(e.target.value)}
                      rows={3}
                      className="w-full text-[13px] text-[#1A2332] border border-[#4A6FA5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const trimmed = editingNoteText.trim();
                          if (!trimmed) return;
                          clientsStore.updateClient(client.id, { notesArray: client.notesArray.map(n => n.id === note.id ? { ...n, text: trimmed } : n) });
                          setEditingNoteId(null);
                        }}
                        disabled={!editingNoteText.trim()}
                        className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Read mode (Figma: "Added {date}" above the note text) ── */
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-[#6B7280] mb-0.5">{note.date.startsWith("Added") ? note.date : `Added ${note.date}`}</div>
                      <p className={`text-[14px] text-[#1A2332] leading-[20px] ${!isExpanded && isLong ? "line-clamp-2" : ""}`}>
                        {note.text}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => setExpandedNoteIds(prev => {
                            const s = new Set(prev);
                            isExpanded ? s.delete(note.id) : s.add(note.id);
                            return s;
                          })}
                          className="mt-1 text-[11px] text-[#4A6FA5] hover:underline"
                          style={{ fontWeight: 500 }}
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      <button
                        onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-[#EDF0F5] rounded transition-colors"
                        title="Edit"
                      >
                        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>edit</span>
                      </button>
                      <button
                        onClick={() => setPendingDelete(() => () => {
                          clientsStore.updateClient(client.id, { notesArray: client.notesArray.filter(n => n.id !== note.id) });
                          setExpandedNoteIds(prev => { const s = new Set(prev); s.delete(note.id); return s; });
                        })}
                        className="w-6 h-6 flex items-center justify-center hover:bg-[#FEF2F2] rounded transition-colors"
                        title="Delete"
                      >
                        <span className="material-icons text-[#9CA3AF] hover:text-[#DC2626]" style={{ fontSize: "14px" }}>delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {clientData.notesArray.length > 4 && (
            <button
              onClick={() => setNotesExpanded(v => !v)}
              className="w-full py-2.5 text-[12px] text-[#4A6FA5] hover:text-[#3d5a85] hover:bg-[#F5F7FA] rounded-lg transition-colors flex items-center justify-center gap-1 border-t border-[#E5E7EB] mt-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>
                {notesExpanded ? "expand_less" : "expand_more"}
              </span>
              {notesExpanded ? "Show less" : `Show ${clientData.notesArray.length - 4} more`}
            </button>
          )}</>

          {/* Custom Fields — Figma places this at the bottom of the Notes column */}
          <div className="pt-3 mt-2 border-t border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Custom Fields</div>
            {(() => {
              const configured = cfClientFields.slice(0, 2).filter(f => f.label.trim() !== "");
              if (configured.length === 0) {
                return (
                  <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <span>Configure in</span>
                    <button
                      onClick={() => navigate("/settings?section=general")}
                      className="text-[11px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      Settings &gt; Custom Fields
                    </button>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {configured.map((field, idx) => {
                    const key = String(idx);
                    const cfValue = client.customFields?.[key] ?? "";
                    const save = (v: string) =>
                      clientsStore.updateClient(client.id, { customFields: { ...(client.customFields ?? {}), [key]: v } });
                    return (
                      <div key={idx}>
                        <div className="text-[12px] text-[#6B7280] mb-0.5">{field.label}</div>
                        {field.type === "dropdown" ? (
                          <select
                            value={cfValue}
                            onChange={(e) => save(e.target.value)}
                            className="w-full h-9 px-2 text-[13px] text-[#1A2332] border border-[#E5E7EB] rounded-md bg-white"
                          >
                            <option value="">—</option>
                            {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cfValue === "true"}
                              onChange={(e) => save(e.target.checked ? "true" : "false")}
                              className="w-4 h-4 accent-[#4A6FA5]"
                            />
                            <span className="text-[13px] text-[#1A2332]">{cfValue === "true" ? "Yes" : "No"}</span>
                          </label>
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                            value={cfValue}
                            onChange={(e) => save(e.target.value)}
                            placeholder="—"
                            className="w-full h-9 px-2 text-[13px] text-[#1A2332] border border-[#E5E7EB] rounded-md bg-white placeholder:text-[#9CA3AF]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const InfoField = ({ label, value, isLink = false }: { label: string; value?: string | string[]; isLink?: boolean }) => (
    <div>
      <div className="text-[12px] text-[#9CA3AF] mb-1">{label}</div>
      <div className={`text-[14px] ${isLink ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: 500 }}>
        {Array.isArray(value) ? value.join(", ") : value || <span className="text-[#D1D5DB]">—</span>}
      </div>
    </div>
  );

  /* ──────────────────────────────────────────
     DETAILS EDIT FORM
  ────────────────────────────────────────── */
  const EditForm = () => (
    <div className="space-y-6">
      {/* 1. Details */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Customer number */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Client number</Label>
            <Input placeholder="e.g. 10245" value={editedClient.customerId} onChange={(e) => handleFieldChange("customerId", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
          </div>
          {/* Name row */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Name <span className="text-[#DC2626]">*</span></Label>
            <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
              <Select value={editedClient.title || "none"} onValueChange={(v) => handleFieldChange("title", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Title</SelectItem>
                  {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="First name" value={editedClient.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
              <Input placeholder="M.I." value={editedClient.middleInitial} onChange={(e) => handleFieldChange("middleInitial", e.target.value.slice(0,1).toUpperCase())} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" maxLength={1} />
              <Input placeholder="Last name" value={editedClient.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
            </div>
          </div>
          {/* Preferred name */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Preferred name (Goes by)</Label>
            <Input placeholder="e.g. Mia, Bobby, TJ" value={editedClient.preferredName} onChange={(e) => handleFieldChange("preferredName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
          </div>
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
              <Input placeholder="Company name" value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
            </div>
            <div>
              <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
              <Input placeholder="e.g. Owner, Manager" value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Billing vs Service Address */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editedClient.isBillingSameAsService}
              onChange={(e) => handleFieldChange("isBillingSameAsService", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[14px] text-[#374151]">Billing address is the same as service address</span>
          </label>
        </div>
      </div>

      {/* 3. Tags */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tags</h3>
        </div>
        <div className="px-6 py-5 space-y-3">
          {/* Selected tags */}
          {editedClient.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b border-[#E5E7EB]">
              {editedClient.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                  {tag}
                  <button
                    onClick={() => handleFieldChange("tags", editedClient.tags.filter(t => t !== tag))}
                    className="hover:bg-[#C7D2FE] rounded-full w-3.5 h-3.5 flex items-center justify-center"
                  >
                    <span className="material-icons" style={{ fontSize: "12px" }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Available tags */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Select tags</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-2 border border-[#E5E7EB] rounded-md">
              {availableTags.map((tag) => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F7FA] p-2 rounded">
                  <input
                    type="checkbox"
                    checked={editedClient.tags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange("tags", [...editedClient.tags, tag]);
                      } else {
                        handleFieldChange("tags", editedClient.tags.filter(t => t !== tag));
                      }
                    }}
                    className="w-4 h-4 accent-[#4A6FA5]"
                  />
                  <span className="text-[13px] text-[#374151]">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-[#6B7280]">
            Manage tags in <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=customerTags")}>Settings → Customer Tags</span>
          </p>
        </div>
      </div>

      {/* 4. Billing & payment */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          {/* Taxable */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editedClient.isTaxable}
              onChange={(e) => handleFieldChange("isTaxable", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[14px] text-[#374151]">Taxable client</span>
          </label>

          {/* Payment terms */}
          <div>
            <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Payment terms</label>
            <select
              value={editedClient.paymentTerms || ""}
              onChange={(e) => handleFieldChange("paymentTerms", e.target.value)}
              className="w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]"
            >
              {["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Preferred payment method */}
          <div>
            <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Preferred payment method</label>
            <select
              value={editedClient.paymentMethod || ""}
              onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
              className="w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]"
            >
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Additional Contact Information */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Additional Contact Information</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Primary phone */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Primary phone number <span className="text-[#DC2626]">*</span></Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 123-4567" value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Secondary phone */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone number</Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 456-7890" value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Email */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
            <Input type="email" placeholder="john@example.com" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
          </div>
          {/* Website */}
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
            <Input type="url" placeholder="https://example.com" value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
          </div>
        </div>
      </div>

      {/* 6. Payment Details */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Payment Details</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Payment terms</Label>
              <Select value={editedClient.paymentTerms || "none"} onValueChange={(v) => handleFieldChange("paymentTerms", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Payment method</Label>
              <Select value={editedClient.paymentMethod || "none"} onValueChange={(v) => handleFieldChange("paymentMethod", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Credit limit</Label>
            <Input type="number" placeholder="0" value={editedClient.creditLimit} onChange={(e) => handleFieldChange("creditLimit", parseFloat(e.target.value) || 0)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
          </div>
        </div>
      </div>

    </div>
  );

  /* ──────────────────────────────────────────
     EMPTY STATE PANEL
  ────────────────────────────────────────── */
  const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
      <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>{icon}</span>
      <p className="text-[13px] text-[#9CA3AF]">{message}</p>
    </div>
  );

  /* ──────────────────────────────────────────
     HANDLE CHECKBOX CHANGES IN VIEW MODE
  ────────────────────────────────────────── */
  const [clientData, setClientData] = useState(client);
  // Keep the interactive Details widgets (notes, checkboxes) in sync with the active client.
  useEffect(() => { setClientData(client); }, [client]);

  const handleCheckboxChange = (field: string, value: boolean) => {
    clientsStore.updateClient(client.id, { [field]: value });
    toast.success("Setting updated");
  };

  /* ──────────────────────────────────────────
     TAB CONTENT ROUTER
  ────────────────────────────────────────── */
  const TabActionButton = ({
    children,
    onClick,
    icon = "plus",
  }: {
    children: ReactNode;
    onClick: () => void;
    icon?: "plus" | "upload";
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md inline-flex items-center justify-center transition-colors"
      style={{ fontWeight: 600 }}
    >
      {icon === "plus" ? (
        <PlusIcon className="h-4 w-4" />
      ) : (
        <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
      )}
      {children}
    </button>
  );

  // Tab content header: title (+ optional count) followed by a small "+" icon that
  // opens the matching create page — simpler than a full button, matching the Notes card.
  const TabHeader = ({ title, count, onAdd, addLabel }: { title: string; count?: number; onAdd: () => void; addLabel: string }) => (
    <div className="flex items-center justify-between gap-2 mb-5">
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h3>
        {typeof count === "number" && (
          <span className="text-[13px] text-[#9CA3AF]" style={{ fontWeight: 400 }}>({count})</span>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title={addLabel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#4A6FA5] hover:bg-[#EEF3FA] transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return isEditing ? <EditForm /> : <DetailsView />;

      case "appointments":
        return (
          <div className="py-16 text-center">
            <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
            <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
          </div>
        );

      case "jobs":
        // Always render the panel — its toolbar carries the search + quick filters
        // and the blue circular "+" create, and its body shows the empty state when
        // there are no jobs (no redundant inner "Jobs" heading; the tab labels it).
        return (
          <ClientJobsPanel
            rows={liveClientJobs}
            onOpen={(id) => navigate(`/jobs/${id}?returnTo=${encodeURIComponent(`/clients/${client.id}?tab=jobs`)}`)}
            onCreate={() => navigate(createUrl("/jobs/new", "jobs"))}
          />
        );

      case "estimates": {
        const estReturn = encodeURIComponent(`/clients/${client.id}?tab=estimates`);
        return (
          <RecordTab
            rows={liveClientEstimates}
            emptyIcon="request_quote" emptyTitle="No estimates yet" emptySubtitle="Create an estimate to send this client a quote"
            searchPlaceholder="Search estimates…"
            searchMatch={(r, q) => [r.estimateNumber, r.estimateName, r.status, ...(r.jobs ?? []).map((j) => j.number)].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))}
            filters={[
              { key: "status", label: "Status", options: [
                { value: "", label: "All" }, { value: "Draft", label: "Draft" }, { value: "Sent", label: "Sent" }, { value: "Viewed", label: "Viewed" },
                { value: "Changes Requested", label: "Changes Requested" }, { value: "Updated", label: "Updated" },
                { value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }, { value: "Expired", label: "Expired" },
              ], match: (r, v) => r.status === v },
            ]}
            createLabel="Create estimate"
            onCreate={() => navigate(createUrl("/estimates/new", "estimates"))}
            onRowClick={(r) => navigate(`/estimates/${r.id}?returnTo=${estReturn}`)}
            columns={[
              { key: "number", label: "Number", render: (r) => <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{r.estimateNumber}</span> },
              { key: "name", label: "Name", render: (r) => <span className="text-[#1A2332]">{r.estimateName || "—"}</span> },
              { key: "jobs", label: "Jobs", render: (r) => {
                const js = r.jobs ?? [];
                const label = js.length === 0 ? "—" : js.length === 1 ? `${js[0].number}${js[0].name ? ` — ${js[0].name}` : ""}` : js.map((j) => j.number).join(", ");
                return <span className="text-[#4A6FA5]" title={js.map((j) => `${j.number}${j.name ? ` — ${j.name}` : ""}`).join("\n")}>{label}</span>;
              } },
              { key: "date", label: "Date", render: (r) => <span className="text-[#1A2332]">{r.createdDate || "—"}</span> },
              { key: "status", label: "Status", render: (r) => { const ss = EST_STATUS_COLORS[r.status] ?? EST_STATUS_COLORS["Draft"]; return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px]" style={{ fontWeight: 500, backgroundColor: ss.bg, color: ss.color }}>{r.status}</span>; } },
              { key: "amount", label: "Amount", align: "right", render: (r) => <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
            ]}
            rowActions={(r) => [
              { label: "Preview estimate", icon: "visibility", onClick: () => navigate(`/estimates/${r.id}?returnTo=${estReturn}`) },
              { label: "Send to client", icon: "send", onClick: () => toast.success(`Estimate ${r.estimateNumber} sent to ${client.name}`) },
              { label: "Make invoice", icon: "request_quote", onClick: () => navigate(createUrl("/invoices/new", "invoices", { fromEstimate: String(r.id) })) },
              { label: "Convert to job", icon: "work_outline", onClick: () => navigate(createUrl("/jobs/new", "jobs", { fromEstimate: String(r.id) })) },
              { label: "Change status", icon: "swap_horiz", separatorBefore: true, onClick: () => { estimatesStore.update(Number(r.id), { status: "Sent" }); toast.success(`Estimate ${r.estimateNumber} marked as Sent`); } },
              { label: "Duplicate", icon: "content_copy", onClick: () => toast.success(`Estimate ${r.estimateNumber} duplicated`) },
              { label: "Archive", icon: "inventory_2", separatorBefore: true, destructive: true, onClick: () => { estimatesStore.remove(Number(r.id)); toast.success(`Estimate ${r.estimateNumber} archived`); } },
              { label: "Open in new tab", icon: "open_in_new", onClick: () => window.open(`/estimates/${r.id}`, "_blank") },
            ]}
            bulkActions={[
              { label: "Change status", icon: "swap_horiz", onClick: (sel) => { sel.forEach((e) => estimatesStore.update(Number(e.id), { status: "Sent" })); toast.success(`${sel.length} estimate${sel.length > 1 ? "s" : ""} marked as Sent`); } },
              { label: "Download", icon: "download", onClick: (sel) => toast.success(`Downloading ${sel.length} estimate${sel.length > 1 ? "s" : ""}`) },
              { label: "Archive", icon: "inventory_2", onClick: (sel) => { estimatesStore.removeMany(new Set(sel.map((e) => Number(e.id)))); toast.success(`${sel.length} estimate${sel.length > 1 ? "s" : ""} archived`); } },
            ]}
          />
        );
      }

      case "invoices":
        return (
          <RecordTab<InvoiceRow>
            rows={clientInvoiceRows}
            columns={INVOICE_GRID_COLS}
            emptyIcon="description" emptyTitle="No invoices yet" emptySubtitle="Create an invoice to bill this client for your work"
            searchPlaceholder="Search invoices…"
            searchMatch={(r, q) => [r.invoiceNo, r.jobNo, r.jobName, r.status, r.note].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))}
            filters={[
              { key: "status", label: "Status", options: [
                { value: "", label: "All" }, { value: "Paid", label: "Paid" }, { value: "Overdue", label: "Overdue" },
                { value: "Partially paid", label: "Partially paid" }, { value: "Void", label: "Void" },
              ], match: (r, v) => r.status === v },
            ]}
            createLabel="Create invoice"
            onCreate={() => navigate(createUrl("/invoices/new", "invoices"))}
            onRowClick={(r) => navigate(`/invoices/${r.id}?returnTo=${encodeURIComponent(`/clients/${client.id}?tab=invoices`)}`)}
            rowActions={(r) => [
              { label: "Send to client", icon: "send", onClick: () => toast.success(`Invoice ${r.invoiceNo} sent to ${client.name}`) },
              { label: "Change status", icon: "swap_horiz", onClick: () => setStatusModalIds([r.id]) },
              { label: "Duplicate", icon: "content_copy", onClick: () => { const inv = invoicesStore.getById(r.id); if (inv) invoicesStore.add({ ...inv, number: invoicesStore.nextInvoiceNumber(inv.jobNumber || inv.clientName) }); toast.success("Invoice duplicated"); } },
              { label: "Void", icon: "block", separatorBefore: true, onClick: () => { invoicesStore.update(r.id, { status: "Void", balance: 0 }); toast.success(`Invoice ${r.invoiceNo} voided`); } },
              { label: "Archive", icon: "inventory_2", destructive: true, onClick: () => { invoicesStore.remove(r.id); toast.success(`Invoice ${r.invoiceNo} archived`); } },
            ] as RecordAction<InvoiceRow>[]}
            bulkActions={[
              { label: "Change status", icon: "swap_horiz", onClick: (sel) => setStatusModalIds(sel.map((x) => x.id)) },
              { label: "Download", icon: "download", onClick: (sel) => toast.success(`Downloading ${sel.length} invoice${sel.length > 1 ? "s" : ""}`) },
              { label: "Archive", icon: "inventory_2", onClick: (sel) => { invoicesStore.removeMany(new Set(sel.map((x) => x.id))); toast.success(`${sel.length} invoice${sel.length > 1 ? "s" : ""} archived`); } },
            ] as RecordBulkAction<InvoiceRow>[]}
          />
        );

      case "payments":
        return (
          <RecordTab<PaymentRow>
            rows={clientPaymentRows}
            columns={PAYMENT_GRID_COLS}
            emptyIcon="account_balance_wallet" emptyTitle="No payments yet" emptySubtitle="Record a payment to track what this client has paid"
            searchPlaceholder="Search payments…"
            searchMatch={(r, q) => [r.invoiceNo, r.method, r.status, r.note].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))}
            filters={[
              { key: "status", label: "Status", options: [
                { value: "", label: "All" }, { value: "Completed", label: "Completed" }, { value: "Pending", label: "Pending" }, { value: "Refunded", label: "Refunded" },
              ], match: (r, v) => r.status === v },
            ]}
            createLabel="Collect payment"
            onCreate={() => navigate(createUrl("/payments/new", "payments", { amount: String(client.openBalance), method: client.paymentMethod || "" }))}
            onRowClick={(r) => navigate(`/payments/${r.id}?returnTo=${encodeURIComponent(`/clients/${client.id}?tab=payments`)}`)}
            rowActions={(r) => [
              { label: "View payment", icon: "visibility", onClick: () => navigate(`/payments/${r.id}?returnTo=${encodeURIComponent(`/clients/${client.id}?tab=payments`)}`) },
              { label: "Send receipt", icon: "send", onClick: () => toast.success(`Receipt for ${r.invoiceNo} sent to ${client.name}`) },
              { label: "Refund", icon: "swap_horiz", separatorBefore: true, destructive: true, onClick: () => { paymentsStore.update(r.id, { status: "Refunded" }); toast.success(`Payment for ${r.invoiceNo} refunded`); } },
            ] as RecordAction<PaymentRow>[]}
            bulkActions={[
              { label: "Send receipts", icon: "send", onClick: (sel) => toast.success(`${sel.length} receipt${sel.length > 1 ? "s" : ""} sent to ${client.name}`) },
              { label: "Download", icon: "download", onClick: (sel) => toast.success(`Downloading ${sel.length} payment${sel.length > 1 ? "s" : ""}`) },
            ] as RecordBulkAction<PaymentRow>[]}
          />
        );

      case "addresses": {
        const openCreateAddress = () => { setEditAddressId("__new__"); setAddressForm({ street: "", unit: "", city: client.city, state: client.state, zip: "", county: client.county, country: client.country || "United States", notes: "" }); setEditAddressOpen(true); };
        return (
          <div>
            {/* Header — title + "+" icon (consistent with the Jobs tab) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service address</h3>
                <span className="text-[14px] text-[#9CA3AF]" style={{ fontWeight: 400 }}>({serviceAddresses.length})</span>
              </div>
              <button
                type="button"
                onClick={openCreateAddress}
                aria-label="Create address"
                title="Create address"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#4A6FA5] hover:bg-[#EEF3FA] transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Address list — divider separates the header from the rows */}
            <div className="flex flex-col gap-5 mt-4 pt-5 border-t border-[#E5E7EB]">
              {serviceAddresses.map((addr, i) => (
                <div key={addr.id} className={`flex items-start justify-between gap-3 ${i < serviceAddresses.length - 1 ? "border-b border-[#E5E7EB] pb-4" : ""}`}>
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{addr.street}{addr.unit ? `, ${addr.unit}` : ""}</span>
                      {addr.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[rgba(22,163,74,0.15)] text-[#16A34A] text-[12px]" style={{ fontWeight: 500 }}>Primary</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[14px] flex-wrap">
                      <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{addr.city}, {addr.state}, {addr.zip}</span>
                      {addr.county && <span className="text-[#6B7280]">{addr.county} County</span>}
                    </div>
                    <div className="text-[14px] text-[#6B7280]">{addr.notes || "No notes added"}</div>
                  </div>
                  <KebabMenuShared>
                    {!addr.isPrimary && (
                      <KebabItem icon="push_pin" onSelect={() => clientsStore.updateClient(client.id, { serviceAddresses: serviceAddresses.map(a => ({ ...a, isPrimary: a.id === addr.id })) })}>Set primary</KebabItem>
                    )}
                    <KebabItem icon="edit" onSelect={() => { setEditAddressId(addr.id); setAddressForm({ street: addr.street, unit: addr.unit, city: addr.city, state: addr.state, zip: addr.zip, county: addr.county, country: "United States", notes: addr.notes }); setEditAddressOpen(true); }}>Edit</KebabItem>
                    <KebabItem icon="delete_outline" destructive onSelect={() => {
                      // A client must always keep at least one service address.
                      if (serviceAddresses.length <= 1) { setLastAddressGuardOpen(true); return; }
                      setPendingDelete(() => () => {
                        let remaining = serviceAddresses.filter(a => a.id !== addr.id);
                        // If we removed the primary, promote the first remaining address.
                        if (addr.isPrimary && remaining.length && !remaining.some(a => a.isPrimary)) {
                          remaining = remaining.map((a, idx) => (idx === 0 ? { ...a, isPrimary: true } : a));
                        }
                        clientsStore.updateClient(client.id, { serviceAddresses: remaining });
                      });
                    }}>Delete</KebabItem>
                  </KebabMenuShared>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "documents":
        return (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-[260px]">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "15px" }}>search</span>
                <input
                  type="text"
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5] focus:bg-white"
                />
              </div>
              <select
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]"
              >
                <option value="all">Date: All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <select
                value={docCategory}
                onChange={e => setDocCategory(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]"
              >
                <option value="all">All Categories</option>
                <option value="Photos">Photos</option>
                <option value="Documents">Documents</option>
                <option value="Agreements">Agreements</option>
              </select>
              <select
                value={docUploader}
                onChange={e => setDocUploader(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]"
              >
                <option value="all">All uploaders</option>
                {uploaderOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#374151] hover:bg-[#F5F7FA] flex items-center gap-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>
                      {docSortDir === "asc" ? "swap_vert" : "swap_vert"}
                    </span>
                    Sort
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>expand_more</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px] p-1">
                  {[
                    { key: "name", label: "Name" },
                    { key: "date", label: "Date" },
                    { key: "type", label: "Type" },
                    { key: "size", label: "Size" },
                    { key: "uploadedBy", label: "Uploaded by" },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                      onClick={() => setDocSortField(item.key as typeof docSortField)}
                    >
                      <span className="w-4 text-[#4A6FA5]">{docSortField === item.key ? "•" : ""}</span>
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className="h-px bg-[#E5E7EB] my-1" />
                  <DropdownMenuItem
                    className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                    onClick={() => setDocSortDir("asc")}
                  >
                    <span className="w-4 text-[#4A6FA5]">{docSortDir === "asc" ? "•" : ""}</span>
                    <span>Ascending</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                    onClick={() => setDocSortDir("desc")}
                  >
                    <span className="w-4 text-[#4A6FA5]">{docSortDir === "desc" ? "•" : ""}</span>
                    <span>Descending</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1" />
              <button
                type="button"
                className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md inline-flex items-center justify-center transition-colors shrink-0"
                style={{ fontWeight: 600 }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFilesAdded(e.dataTransfer.files); }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                Upload
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />

            {/* Files: Estimate-style inline preview pane + miniature thumbnails strip */}
            {sortedDocuments.length === 0 ? (
              (docSearch || docDate !== "all" || docCategory !== "all" || docUploader !== "all") ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 text-center">
                  <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>folder_open</span>
                  <div className="text-[13px] text-[#9CA3AF]">No documents match your filters</div>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5F7FA] flex items-center justify-center">
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "24px" }}>folder_open</span>
                  </div>
                  <div>
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>No documents yet</div>
                    <div className="text-[12px] text-[#6B7280] mt-1">Upload files to keep everything in one place</div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-4 inline-flex items-center gap-1.5 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[14px] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                    Upload
                  </button>
                </div>
              )
            ) : (() => {
              const safeIdx = Math.min(docPreviewIdx, Math.max(0, sortedDocuments.length - 1));
              const current = sortedDocuments[safeIdx];
              const totalPages = Math.ceil(sortedDocuments.length / DOCS_PER_PAGE);
              const safePage = Math.min(docsPage, Math.max(0, totalPages - 1));
              return (
                <>
                {/* Batch selection action bar */}
                {selectedDocs.size > 0 && (
                  <div className="bg-[#EEF3FA] border border-[#C5D5EC] rounded-lg px-4 py-2 flex items-center gap-3 mb-3">
                    <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                      {selectedDocs.size} selected
                    </span>
                    <button
                      onClick={() => setSelectedDocs(new Set(sortedDocuments.map(f => f.id)))}
                      className="text-[12px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >Select all</button>
                    <button
                      onClick={() => setSelectedDocs(new Set())}
                      className="text-[12px] text-[#6B7280] hover:underline"
                      style={{ fontWeight: 500 }}
                    >Clear</button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="h-8 px-3 flex items-center gap-1.5 border border-[#FCA5A5] bg-white hover:bg-[#FEF2F2] rounded-md text-[13px] text-[#DC2626] transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                      Delete selected
                    </button>
                  </div>
                )}

                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex" style={{ minHeight: "520px" }}>
                  {/* Left: miniature thumbnails rail (smaller icons, 3 cols when preview open, more cols when closed) */}
                  <div className={`${docPreviewPaneOpen ? "w-[240px] shrink-0 border-r border-[#F3F4F6]" : "flex-1"} flex flex-col`}>
                    <div className="p-2.5 flex-1 overflow-y-auto">
                      {!docPreviewPaneOpen && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>
                            Preview hidden — click any file to reopen
                          </span>
                          <button
                            onClick={() => setDocPreviewPaneOpen(true)}
                            className="h-7 px-2.5 inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] border border-[#E5E7EB] rounded-md hover:bg-[#F5F7FA]"
                            style={{ fontWeight: 500 }}
                          >
                            <span className="material-icons" style={{ fontSize: "14px" }}>visibility</span>
                            Show preview
                          </button>
                        </div>
                      )}
                      <div className={`grid gap-1.5 ${docPreviewPaneOpen ? "grid-cols-3" : "grid-cols-6 md:grid-cols-8 lg:grid-cols-10"}`}>
                        {sortedDocuments.slice(safePage * DOCS_PER_PAGE, safePage * DOCS_PER_PAGE + DOCS_PER_PAGE).map((file) => {
                          const globalIdx = sortedDocuments.indexOf(file);
                          const isActive = globalIdx === safeIdx;
                          const isSelected = selectedDocs.has(file.id);
                          return (
                            <div
                              key={file.id}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setDocPreviewIdx(globalIdx);
                                  if (!docPreviewPaneOpen) setDocPreviewPaneOpen(true);
                                }
                              }}
                              onClick={(e) => {
                                if (e.metaKey || e.ctrlKey || e.shiftKey || selectedDocs.size > 0) {
                                  toggleSelected(file.id);
                                } else {
                                  setDocPreviewIdx(globalIdx);
                                  if (!docPreviewPaneOpen) setDocPreviewPaneOpen(true);
                                }
                              }}
                              className={`group relative aspect-[4/3] rounded overflow-hidden border transition-all cursor-pointer ${
                                isActive
                                  ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/40"
                                  : isSelected
                                    ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30"
                                    : "border-[#E5E7EB] hover:border-[#C5D5EC]"
                              }`}
                              title={`${file.name}\n${file.size} · ${file.date}${file.uploadedBy ? ` · ${file.uploadedBy}` : ""}`}
                            >
                              {file.isImage && file.previewUrl ? (
                                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                              ) : file.isImage ? (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
                                >
                                  <span className="material-icons text-white/70" style={{ fontSize: "14px" }}>image</span>
                                </div>
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: file.iconColor + "12" }}
                                >
                                  <span className="material-icons" style={{ fontSize: "14px", color: file.iconColor }}>{file.icon}</span>
                                </div>
                              )}
                              {file.category && (
                                <span className="absolute left-0.5 bottom-0.5 px-1 rounded text-[8px] text-white bg-[#16A34A]/80" style={{ fontWeight: 600 }}>
                                  {file.category.charAt(0)}
                                </span>
                              )}
                              <span
                                onClick={(e) => { e.stopPropagation(); toggleSelected(file.id); }}
                                className={`absolute top-0.5 left-0.5 ${isSelected || selectedDocs.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelected(file.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-3 h-3 accent-[#4A6FA5] cursor-pointer"
                                  aria-label={`Select ${file.name}`}
                                />
                              </span>
                              {/* Hover kebab → rename / delete (no right-side drawer needed) */}
                              {selectedDocs.size === 0 && (
                                <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-5 w-5 flex items-center justify-center rounded bg-white/95 hover:bg-white border border-[#E5E7EB] text-[#546478] shadow-sm"
                                        aria-label={`Options for ${file.name}`}
                                      >
                                        <span className="material-icons" style={{ fontSize: "14px" }}>more_vert</span>
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px] p-1">
                                      <DropdownMenuItem
                                        className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                                        onClick={() => {
                                          // Trigger a real download when we have a blob/url; otherwise acknowledge.
                                          if (file.previewUrl) {
                                            const a = document.createElement("a");
                                            a.href = file.previewUrl;
                                            a.download = file.name;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                          }
                                          toast.success(`Downloading ${file.name}`);
                                        }}
                                      >
                                        <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>download</span>
                                        Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                                        onClick={() => { setRenameDocId(file.id); setRenameDocDraft(file.name); }}
                                      >
                                        <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>edit</span>
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="h-9 px-3 text-[13px] text-[#DC2626] flex items-center gap-2.5 cursor-pointer"
                                        onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== file.id))}
                                      >
                                        <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="px-2.5 py-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                        <button
                          onClick={() => setDocsPage(p => Math.max(0, p - 1))}
                          disabled={safePage === 0}
                          className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]"
                        >
                          Prev
                        </button>
                        <span className="tabular-nums">{safePage + 1} / {totalPages}</span>
                        <button
                          onClick={() => setDocsPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={safePage >= totalPages - 1}
                          className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: preview pane (collapsible via the close button) */}
                  {docPreviewPaneOpen && (
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="relative bg-[#FAFBFC] p-4 flex-1 flex items-center justify-center">
                        {/* close pane button */}
                        <button
                          onClick={() => setDocPreviewPaneOpen(false)}
                          className="absolute top-3 left-3 z-10 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors"
                          title="Close preview"
                          aria-label="Close preview"
                        >
                          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
                        </button>

                        {/* prev arrow */}
                        <button
                          onClick={() => setDocPreviewIdx(i => (i - 1 + sortedDocuments.length) % sortedDocuments.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors"
                          title="Previous"
                        >
                          <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
                        </button>

                        {/* main image / file */}
                        <div className="relative w-full max-w-[680px] aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#E5E7EB] flex items-center justify-center">
                          {current?.isImage && current.previewUrl ? (
                            <img src={current.previewUrl} alt={current.name} className="w-full h-full object-cover" />
                          ) : current?.isImage ? (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: current.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
                            >
                              <span className="material-icons text-white/70" style={{ fontSize: "64px" }}>image</span>
                            </div>
                          ) : current ? (
                            <div className="flex flex-col items-center gap-2 text-center px-6">
                              <span className="material-icons" style={{ fontSize: "64px", color: current.iconColor, opacity: 0.85 }}>{current.icon}</span>
                              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{current.name}</div>
                              <div className="text-[12px] text-[#9CA3AF]">{current.size} · {current.date}</div>
                            </div>
                          ) : null}

                          {/* expand button */}
                          {current && (
                            <button
                              onClick={() => setPreviewFileId(current.id)}
                              className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors"
                              title="Open full preview"
                            >
                              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>open_in_full</span>
                            </button>
                          )}

                          {/* category tag overlay */}
                          {current?.category && (
                            <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-[#16A34A]" style={{ fontWeight: 600 }}>
                              {current.category}
                            </span>
                          )}
                          {/* page counter */}
                          <span className="absolute right-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-black/60" style={{ fontWeight: 500 }}>
                            {safeIdx + 1} / {sortedDocuments.length}
                          </span>
                        </div>

                        {/* next arrow */}
                        <button
                          onClick={() => setDocPreviewIdx(i => (i + 1) % sortedDocuments.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors"
                          title="Next"
                        >
                          <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
                        </button>
                      </div>

                      {/* Caption */}
                      {current && (
                        <div className="px-4 py-2 border-t border-[#F3F4F6] text-[12px] text-[#6B7280] truncate" title={current.name}>
                          {current.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </>
              );
            })()}

            {/* Right-side preview panel */}
            <DocumentPreview
              file={previewFile}
              onClose={() => setPreviewFileId(null)}
              onRename={(id, newName) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d))}
              onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
            />

            {/* Batch-delete confirmation */}
            {confirmBulkDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center" role="alertdialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmBulkDelete(false)} />
                <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                      <span className="material-icons" style={{ fontSize: "20px", color: "#DC2626" }}>delete_outline</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                        Delete {selectedDocs.size} {selectedDocs.size === 1 ? "file" : "files"}?
                      </h3>
                      <p className="text-[13px] text-[#6B7280] leading-[18px]">
                        The selected {selectedDocs.size === 1 ? "file" : "files"} will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmBulkDelete(false)}
                      className="h-9 px-4 border border-[#D8DEE8] hover:bg-[#F5F7FA] text-[#546478] text-[13px] rounded-md transition-colors"
                      style={{ fontWeight: 500 }}
                    >Cancel</button>
                    <button
                      onClick={() => {
                        setDocuments(prev => prev.filter(d => !selectedDocs.has(d.id)));
                        setSelectedDocs(new Set());
                        setConfirmBulkDelete(false);
                      }}
                      className="h-9 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] rounded-md transition-colors"
                      style={{ fontWeight: 500 }}
                    >Delete {selectedDocs.size}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "notes":
        return (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
              <TabActionButton onClick={() => toast.info("Add note coming soon")}>Add note</TabActionButton>
            </div>
            <div className="space-y-4">
              {client.notesArray.map((note) => (
                <div key={note.id} className="border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#EEF2F7] flex items-center justify-center text-[#4A6FA5]">
                      <span className="material-icons" style={{ fontSize: "14px" }}>sticky_note_2</span>
                    </div>
                    <span className="text-[12px] text-[#6B7280]">{note.date}</span>
                  </div>
                  <p className="text-[14px] text-[#374151] leading-[21px]">{note.text}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-[#6B7280] mt-4">
              Edit note templates in{" "}
              <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=clients")}>
                Settings → Client Preferences
              </span>
            </p>
          </>
        );

      case "pos":
      case "service-agreements":
      case "equipment":
      case "activity":
      case "marketing":
        return (
          <div className="py-16 text-center">
            <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
            <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
          </div>
        );

      default:
        return <EmptyState icon="help_outline" message="Select a tab from the left panel." />;
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  // Unknown / stale id → explicit not-found screen (no silent fallback to client #0).
  if (!clientExists) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={() => navigate("/clients")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Clients</span>
          </button>
        </div>
        <div className="px-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-20 flex flex-col items-center text-center">
            <span className="material-icons text-[#D1D5DB] mb-3" style={{ fontSize: "48px" }}>person_off</span>
            <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Client not found</h2>
            <p className="text-[14px] text-[#6B7280] mt-1 max-w-[420px]">
              No client matches ID <span className="font-mono text-[#1A2332]">{routeId}</span>. It may have been removed,
              or hasn’t been saved to the database yet.
            </p>
            <button
              onClick={() => navigate("/clients")}
              className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px]"
              style={{ fontWeight: 500 }}
            >
              Go to Clients list
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── PAGE HEADER (back arrow + title on gray, outside the white card) ── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/clients")}
            aria-label="Back to clients"
            title="Back to clients"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "24px" }}>chevron_left</span>
          </button>
          <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600 }}>Client details</h1>
        </div>
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancelClick}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-9 px-3 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-9 px-3 text-white text-[13px]"
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* ── ONE BIG WHITE CARD CONTAINING EVERYTHING (per Figma spec) ── */}
      <div className="mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* Header — Figma 746:54312: title + stats on row 1, contact details on row 2 */}
        <div className="flex flex-col gap-3">
          {/* Row 1: title (left) + stats (right) */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[20px] text-[#1A2332] leading-[27px] whitespace-nowrap" style={{ fontWeight: 600 }}>
                {client.name}
              </h2>
              <span className="text-[16px] text-[#6B7280] leading-[24px]" style={{ fontWeight: 400 }}>
                ({client.customerId.replace(/^C-/, "")})
              </span>
              {/* Status chip — Active/Prospect is derived from jobs; the menu only
                  toggles the manual Inactive flag (Deactivate / Reactivate). */}
              <div className="relative">
                <button
                  onClick={() => setClientStatusOpen(!clientStatusOpen)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[12px] transition-colors"
                  style={{ fontWeight: 500, backgroundColor: `${clientStatusColors[derivedStatus]}26`, color: clientStatusColors[derivedStatus] }}
                  title={derivedStatus === "Prospect" ? "No jobs yet — a new prospect" : derivedStatus === "Active" ? "Has at least one job" : "Manually deactivated"}
                >
                  {derivedStatus}
                  <span className="material-icons" style={{ fontSize: "14px" }}>expand_more</span>
                </button>
                {clientStatusOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[200px] py-1">
                    <div className="px-3 py-1.5 text-[11px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                      {derivedStatus === "Inactive" ? "Deactivated" : `${derivedStatus} · ${clientJobCount} job${clientJobCount === 1 ? "" : "s"}`}
                    </div>
                    {derivedStatus === "Inactive" ? (
                      <button
                        onClick={() => { clientsStore.updateClient(client.id, { status: "Active" }); setClientStatusOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F4F6] flex items-center gap-2"
                      >
                        <span className="material-icons text-[#16A34A]" style={{ fontSize: "16px" }}>check_circle</span>
                        <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>Reactivate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { clientsStore.updateClient(client.id, { status: "Inactive" }); setClientStatusOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#FEF2F2] flex items-center gap-2"
                      >
                        <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>block</span>
                        <span className="text-[#DC2626]" style={{ fontWeight: 500 }}>Deactivate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats — borderless, copy left / tinted icon right, 1px dividers (Figma) */}
            <div className="flex items-center gap-4 shrink-0">
              {[
                { label: "Total revenue", value: `$${Math.round(tileRevenue).toLocaleString("en-US")}`, icon: "trending_up",    iconColor: "#16A34A" },
                { label: "Balance",       value: `$${tileBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,    icon: "account_balance_wallet", iconColor: "#4A6FA5" },
                { label: "Past due",      value: `$${tilePastDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "warning_amber",          iconColor: "#DC2626" },
                { label: "Open jobs",     value: String(client.openJobs), icon: "work_outline",   iconColor: "#6B7280" },
              ].map(({ label, value, icon, iconColor }, i) => (
                <div key={label} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-6 bg-[#E5E7EB] shrink-0" />}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="text-[18px] leading-none tabular-nums text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 600 }}>{value}</div>
                      <div className="text-[14px] leading-[20px] text-[#6B7280] mt-1 whitespace-nowrap">{label}</div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}26` }}>
                      <span className="material-icons" style={{ fontSize: "20px", color: iconColor }}>{icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Address · Phone · Email */}
          <div className="flex items-center gap-1 flex-wrap">
            <div className="flex items-center gap-2 pr-2">
              <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>location_on</span>
              <span className="text-[14px] text-[#1A2332]">{client.address}, {client.city}, {client.state} {client.zip}</span>
            </div>
            <div className="w-px h-6 bg-[#E5E7EB]" />
            <a href={`tel:${client.mobilePhone}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F5F7FA] text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>phone</span>
              {client.mobilePhone}
            </a>
            <div className="w-px h-6 bg-[#E5E7EB]" />
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F5F7FA] text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>mail</span>
              {client.email}
            </a>
          </div>

          {/* Row 3: Created + Last activity (Figma — calendar/clock icons + divider) */}
          <div className="flex items-center gap-3 text-[14px] flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>calendar_today</span>
              <span className="text-[#6B7280]">Created: <span className="text-[#1A2332]">{client.customerSince || "—"}</span></span>
            </div>
            <div className="w-px h-6 bg-[#E5E7EB]" />
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>schedule</span>
              <span className="text-[#6B7280]">Last activity: <span className="text-[#1A2332]">{client.lastActivity || "—"}</span></span>
            </div>
          </div>
        </div>

        {/* Divider separating the client header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        {/* Unified detail-page tab bar */}
        <DetailTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={(key) => { setActiveTab(key); if (isEditing) setIsEditing(false); }}
          tabSuffix={<TabSettingsButton onClick={() => { setPendingHidden(new Set(hiddenTabs)); setShowTabSettings(true); }} />}
          trailing={
            <>
              <CreateDropdown />
              <KebabMenu />
            </>
          }
          className="mt-3"
        />

        {/* Tab content */}
        <div className="mt-4">
          {renderContent()}
        </div>
      </div>

      {/* ── PER-SECTION EDIT MODAL ── */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditingSection(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>
                {editingSection === "name" && "Edit name & role"}
                {editingSection === "contact" && "Edit contact information"}
                {editingSection === "addresses" && "Edit addresses"}
                {editingSection === "finance" && "Edit billing details"}
              </h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-[#6B7280] hover:text-[#111827] w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {editingSection === "name" && (
                <>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Name <span className="text-[#DC2626]">*</span></Label>
                    <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
                      <Select value={editedClient.title || "none"} onValueChange={(v) => handleFieldChange("title", v === "none" ? "" : v)}>
                        <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Title" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Title</SelectItem>
                          {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="First name" value={editedClient.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                      <Input placeholder="M.I." value={editedClient.middleInitial} onChange={(e) => handleFieldChange("middleInitial", e.target.value.slice(0, 1).toUpperCase())} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" maxLength={1} />
                      <Input placeholder="Last name" value={editedClient.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Preferred name</Label>
                    <Input placeholder="e.g. Mike" value={editedClient.preferredName} onChange={(e) => handleFieldChange("preferredName", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                  </div>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
                    <Input placeholder="e.g. Property Owner" value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                  </div>
                </>
              )}

              {editingSection === "contact" && (
                <>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Primary phone number <span className="text-[#DC2626]">*</span></Label>
                    <div className="grid grid-cols-[1fr_64px] gap-2">
                      <Input value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                      <Input placeholder="EXT" value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone number</Label>
                    <div className="grid grid-cols-[1fr_64px] gap-2">
                      <Input value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                      <Input placeholder="EXT" value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
                      <Input type="email" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
                      <Input value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
                      <Input value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
                      <Input value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "addresses" && (
                <>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Service address <span className="text-[#DC2626]">*</span></Label>
                    <Input placeholder="Street address" value={editedClient.address} onChange={(e) => handleFieldChange("address", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] mb-2" />
                    <Input placeholder="Unit / Suite" value={editedClient.unit} onChange={(e) => handleFieldChange("unit", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input value={editedClient.city} onChange={(e) => handleFieldChange("city", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>State</Label>
                      <Input value={editedClient.state} onChange={(e) => handleFieldChange("state", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                    <div>
                      <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>ZIP</Label>
                      <Input value={editedClient.zip} onChange={(e) => handleFieldChange("zip", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Address notes</Label>
                    <Input placeholder="Gate code, access instructions…" value={editedClient.gateCode} onChange={(e) => handleFieldChange("gateCode", e.target.value)} className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
                  </div>
                </>
              )}

              {editingSection === "finance" && (
                <>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Payment terms</Label>
                    <Select value={editedClient.paymentTerms || "none"} onValueChange={(v) => handleFieldChange("paymentTerms", v === "none" ? "" : v)}>
                      <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Select terms" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select —</SelectItem>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[14px] text-[#1A2332] mb-2 block" style={{ fontWeight: 500 }}>Payment method</Label>
                    <Select value={editedClient.paymentMethod || "none"} onValueChange={(v) => handleFieldChange("paymentMethod", v === "none" ? "" : v)}>
                      <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select —</SelectItem>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editedClient.isTaxable}
                      onChange={(e) => handleFieldChange("isTaxable", e.target.checked)}
                      className="w-4 h-4 accent-[#4A6FA5]"
                    />
                    <span className="text-[13px] text-[#374151]">Taxable</span>
                  </label>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingSection(null)}
                className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-9 px-4 text-[13px]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Mandatory client info (Marek rule): name, primary phone, address.
                  // Validated per section so each modal only guards its own fields.
                  if (editingSection === "name" && (!(editedClient.firstName || "").trim() || !(editedClient.lastName || "").trim())) {
                    toast.error("First and last name are required"); return;
                  }
                  if (editingSection === "contact" && !(editedClient.mobilePhone || "").trim()) {
                    toast.error("A primary phone number is required"); return;
                  }
                  if (editingSection === "addresses" && !(editedClient.address || "").trim()) {
                    toast.error("A service address is required"); return;
                  }
                  clientsStore.updateClient(client.id, editedClient);
                  toast.success("Changes saved");
                  setEditingSection(null);
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-9 px-4 text-white text-[13px]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit additional contact modal (Figma 489:34357 / 489:33802) ── */}
      {contactFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setContactFormOpen(false); setEditingContactId(null); }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>
                {editingContactId != null ? "Edit additional contact" : "Add additional contact"}
              </h2>
              <button onClick={() => { setContactFormOpen(false); setEditingContactId(null); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>First name</Label>
                  <Input placeholder="First name" value={contactForm.firstName} onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Last name</Label>
                  <Input placeholder="Last name" value={contactForm.lastName} onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Phone</Label>
                  <Input placeholder="e.g. (555) 456-7890" value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Email</Label>
                  <Input placeholder="e.g. john@example.com" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
              </div>
              <div>
                <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Relationship</Label>
                <Select value={contactForm.relationship || undefined} onValueChange={(v) => setContactForm((p) => ({ ...p, relationship: v }))}>
                  <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px]"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {(contactForm.relationship && !relationships.includes(contactForm.relationship)
                      ? [contactForm.relationship, ...relationships]
                      : relationships
                    ).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-1">
              <Button variant="outline" onClick={() => { setContactFormOpen(false); setEditingContactId(null); }} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button
                disabled={!(contactForm.firstName.trim() && contactForm.lastName.trim() && contactForm.phone.trim() && contactForm.email.trim() && contactForm.relationship.trim())}
                onClick={() => {
                  const list = client.additionalContacts ?? [];
                  const next =
                    editingContactId != null
                      ? list.map((x) => (x.id === editingContactId ? { ...x, ...contactForm } : x))
                      : [...list, { id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1, ...contactForm }];
                  clientsStore.updateClient(client.id, { additionalContacts: next });
                  setContactFormOpen(false);
                  setEditingContactId(null);
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit tabs modal (Figma) ── */}
      {showTabSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowTabSettings(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[576px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Edit tabs</h2>
              <button onClick={() => setShowTabSettings(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4 grid grid-cols-2 gap-4">
              {tabs.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer border border-[#E5E7EB] rounded-[10px] p-3">
                  <input
                    type="checkbox"
                    checked={!pendingHidden.has(key)}
                    onChange={() => setPendingHidden((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                    className="w-4 h-4 accent-[#4A6FA5]"
                  />
                  <span className="text-[14px] text-[#1A2332]">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => setShowTabSettings(false)} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] bg-white h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button onClick={() => { setHiddenTabs(new Set(pendingHidden)); setShowTabSettings(false); }} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg">Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change invoice status modal — pick from all invoice statuses ── */}
      {statusModalIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setStatusModalIds(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-xl w-[360px] max-w-[92vw] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Change status</h3>
              <button onClick={() => setStatusModalIds(null)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#9CA3AF]"><span className="material-icons" style={{ fontSize: "18px" }}>close</span></button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(["Unpaid", "Overdue", "Partially Paid", "Paid", "Void"] as InvoiceStatus[]).map((s) => (
                <button key={s} onClick={() => {
                  const ids = statusModalIds;
                  ids.forEach((id) => {
                    const inv = invoicesStore.getById(id);
                    const total = inv?.total ?? 0;
                    const balance = (s === "Paid" || s === "Void") ? 0 : (s === "Partially Paid" ? (inv?.balance ?? total) : total);
                    invoicesStore.update(id, { status: s, balance });
                  });
                  toast.success(ids.length > 1 ? `${ids.length} invoices updated` : "Status updated");
                  setStatusModalIds(null);
                }} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA] text-left transition-colors">
                  <RecordStatusBadge status={s} />
                  <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "18px" }}>chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit address modal (Figma 489:35769) ── */}
      {editAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditAddressOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>{editAddressId === "__new__" ? "Create address" : "Edit address"}</h2>
              <button onClick={() => setEditAddressOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Country</Label>
                  <Select value={addressForm.country || undefined} onValueChange={(v) => setAddressForm((p) => ({ ...p, country: v }))}>
                    <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px]"><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>{["United States", "Canada", "Mexico"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>State</Label>
                  <Select value={addressForm.state || undefined} onValueChange={(v) => setAddressForm((p) => ({ ...p, state: v }))}>
                    <SelectTrigger className="border-[#E5E7EB] bg-white h-9 text-[14px]"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">{US_STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>City</Label>
                <Input value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Address</Label>
                  <Input value={addressForm.street} onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
                <Input placeholder="Unit" value={addressForm.unit} onChange={(e) => setAddressForm((p) => ({ ...p, unit: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px] w-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>County</Label>
                  <Input value={addressForm.county} onChange={(e) => setAddressForm((p) => ({ ...p, county: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
                <div>
                  <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>ZIP Code</Label>
                  <Input value={addressForm.zip} onChange={(e) => setAddressForm((p) => ({ ...p, zip: e.target.value }))} className="border-[#E5E7EB] bg-white h-9 text-[14px]" />
                </div>
              </div>
              <div>
                <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Address notes</Label>
                <Textarea value={addressForm.notes} onChange={(e) => setAddressForm((p) => ({ ...p, notes: e.target.value }))} className="border-[#E5E7EB] bg-white text-[14px] min-h-[64px]" placeholder="Gate code, access instructions…" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-1">
              <Button variant="outline" onClick={() => setEditAddressOpen(false)} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button
                disabled={!addressForm.street.trim()}
                onClick={() => {
                  if (!addressForm.street.trim()) return;
                  if (editAddressId == null) {
                    clientsStore.updateClient(client.id, {
                      address: addressForm.street, unit: addressForm.unit, city: addressForm.city,
                      state: addressForm.state, zip: addressForm.zip, county: addressForm.county, country: addressForm.country, gateCode: addressForm.notes,
                    });
                  } else if (editAddressId === "__new__") {
                    if (!addressForm.street.trim()) return;
                    clientsStore.updateClient(client.id, {
                      serviceAddresses: [
                        ...serviceAddresses,
                        { id: Math.random().toString(36).slice(2), street: addressForm.street, unit: addressForm.unit, city: addressForm.city, state: addressForm.state, zip: addressForm.zip, county: addressForm.county, notes: addressForm.notes, isPrimary: serviceAddresses.length === 0 },
                      ],
                    });
                  } else {
                    clientsStore.updateClient(client.id, {
                      serviceAddresses: serviceAddresses.map((a) => a.id === editAddressId
                        ? { ...a, street: addressForm.street, unit: addressForm.unit, city: addressForm.city, state: addressForm.state, zip: addressForm.zip, county: addressForm.county, notes: addressForm.notes }
                        : a),
                    });
                  }
                  setEditAddressOpen(false);
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit address notes modal (Figma 489:36354) ── */}
      {editNotesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditNotesOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Edit address notes</h2>
              <button onClick={() => setEditNotesOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4">
              <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Address notes</Label>
              <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} className="border-[#E5E7EB] bg-white text-[14px] min-h-[76px]" placeholder="Gate code, access instructions…" />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => setEditNotesOpen(false)} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button onClick={() => { clientsStore.updateClient(client.id, { gateCode: notesDraft }); setEditNotesOpen(false); }} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg">Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add note modal (Figma 489:36795) ──
          Textarea is UNCONTROLLED (defaultValue + onChange syncing state only for
          the disabled/save check) so React never re-sets the DOM value mid-keystroke.
          That eliminates the cursor-reset that made fast typing appear reversed. */}
      {addingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setAddingNote(false); setNewNoteText(""); }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Add note</h2>
              <button onClick={() => { setAddingNote(false); setNewNoteText(""); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4">
              <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Note</Label>
              <Textarea
                autoFocus
                defaultValue=""
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add any relevant notes…"
                className="border-[#E5E7EB] bg-white text-[14px] min-h-[96px]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => { setAddingNote(false); setNewNoteText(""); }} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button
                disabled={!newNoteText.trim()}
                onClick={() => {
                  const trimmed = newNoteText.trim();
                  if (!trimmed) return;
                  const dateStr = `Added ${formatRegionalDate(new Date())}`;
                  const newId = Math.max(0, ...client.notesArray.map((n) => n.id)) + 1;
                  clientsStore.updateClient(client.id, { notesArray: [{ id: newId, text: trimmed, date: dateStr }, ...client.notesArray] });
                  setAddingNote(false);
                  setNewNoteText("");
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
              >Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation (Figma 489:34912) ── */}
      <ConfirmDialog
        open={pendingDelete != null}
        onConfirm={() => { pendingDelete?.(); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />

      {/* ── Guard: can't delete the only service address ── */}
      {lastAddressGuardOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setLastAddressGuardOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[480px] max-w-[92vw] p-7 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF3FA] flex items-center justify-center shrink-0">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>wrong_location</span>
              </div>
              <div>
                <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Keep at least one address</h2>
                <p className="text-[14px] text-[#6B7280] leading-[20px] mt-1">A client must always have at least one service address. Edit this address, or add a new one — then you’ll be able to delete this one.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <Button
                variant="outline"
                onClick={() => {
                  const a = serviceAddresses[0];
                  if (a) { setEditAddressId(a.id); setAddressForm({ street: a.street, unit: a.unit, city: a.city, state: a.state, zip: a.zip, county: a.county, country: "United States", notes: a.notes }); setEditAddressOpen(true); }
                  setLastAddressGuardOpen(false);
                }}
                className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg"
              >Edit this address</Button>
              <Button
                onClick={() => {
                  setEditAddressId("__new__");
                  setAddressForm({ street: "", unit: "", city: client.city, state: client.state, zip: "", county: client.county, country: client.country || "United States", notes: "" });
                  setEditAddressOpen(true);
                  setLastAddressGuardOpen(false);
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg"
              >Add new address</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename document modal ── */}
      {renameDocId != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setRenameDocId(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[480px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Rename document</h2>
              <button onClick={() => setRenameDocId(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4">
              <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Name</Label>
              <Input
                autoFocus
                value={renameDocDraft}
                onChange={(e) => setRenameDocDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameDocDraft.trim()) {
                    setDocuments((prev) => prev.map((d) => (d.id === renameDocId ? { ...d, name: renameDocDraft.trim() } : d)));
                    setRenameDocId(null);
                  }
                }}
                className="border-[#E5E7EB] bg-white text-[14px]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => setRenameDocId(null)} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button
                disabled={!renameDocDraft.trim()}
                onClick={() => {
                  setDocuments((prev) => prev.map((d) => (d.id === renameDocId ? { ...d, name: renameDocDraft.trim() } : d)));
                  setRenameDocId(null);
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
              >Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Statement activity slide-over ─────────────────────────────────────── */}
      {statementOpen && (() => {
        // Whole-dollar amounts (no decimals) per the walkthrough decision.
        const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
        type LedgerKind = "job" | "invoice" | "payment";
        const KIND_ORDER: Record<LedgerKind, number> = { job: 0, invoice: 1, payment: 2 };
        const ledger: Array<{ date: string; kind: LedgerKind; desc: string; sub: string; debit: number; credit: number; balance: number }> = [];
        // A customer activity statement (per the walkthrough): the full history
        // of what we did for this client — the JOB performed, then the INVOICE
        // raised for it, then the PAYMENT(s) that settle it — interleaved by
        // date with a running balance. Jobs are their own rows (no $ effect);
        // the invoice carries the charge.
        clientInvoiceRows.forEach(inv => {
          const amt = Number(inv.total.replace(/[^0-9.-]/g, "")) || 0;
          if (inv.jobNo) {
            ledger.push({ date: inv.date, kind: "job", desc: `Job ${inv.jobNo}`, sub: inv.type, debit: 0, credit: 0, balance: 0 });
          }
          ledger.push({ date: inv.date, kind: "invoice", desc: `Invoice ${inv.invoiceNo}`, sub: inv.type, debit: amt, credit: 0, balance: 0 });
        });
        // Payments are the credits; show how it was paid + which invoice it applied to.
        clientPaymentRows.forEach(pay => {
          const amt = Number(pay.amount.replace(/[^0-9.-]/g, "")) || 0;
          const sub = [pay.method, pay.invoiceNo ? `applied to ${pay.invoiceNo}` : "", pay.note].filter(Boolean).join(" · ");
          ledger.push({ date: pay.date, kind: "payment", desc: "Payment received", sub, debit: 0, credit: amt, balance: 0 });
        });
        // Sort by date; same date keeps job → invoice → payment order.
        ledger.sort((a, b) => {
          const t = new Date(a.date).getTime() - new Date(b.date).getTime();
          return t !== 0 ? t : KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
        });
        let running = 0;
        ledger.forEach(row => { running += row.debit - row.credit; row.balance = running; });

        return (
          <div className="fixed inset-0 z-50 flex" onClick={() => setStatementOpen(false)}>
            <div className="flex-1 bg-black/30 backdrop-blur-[1px]" />
            <div className="w-[680px] max-w-[96vw] bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()} id="client-statement-print">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between shrink-0 no-print">
                <div>
                  <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Account statement</h2>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">{client.name} · {formatRegionalDate(new Date())}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="h-9 px-3.5 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] inline-flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                    <span className="material-icons" style={{ fontSize: "16px" }}>print</span>Print
                  </button>
                  <button onClick={() => setStatementOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#9CA3AF]">
                    <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                  </button>
                </div>
              </div>

              {/* Client + summary */}
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] shrink-0">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Client</div>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{client.name}</div>
                    {client.email && <div className="text-[12px] text-[#6B7280]">{client.email}</div>}
                    {client.mobilePhone && <div className="text-[12px] text-[#6B7280]">{client.mobilePhone}</div>}
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Total billed</div>
                    <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>${fmt(client.totalBilled ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Balance due</div>
                    <div className={`text-[18px]`} style={{ fontWeight: 700, color: (client.openBalance ?? 0) > 0 ? "#DC2626" : "#16A34A" }}>
                      ${fmt(client.openBalance ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ledger */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {ledger.length === 0 ? (
                  <div className="text-center py-12 text-[13px] text-[#9CA3AF]">No activity yet for this client.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB]">
                        {["Date", "Description", "Charges", "Payments", "Balance"].map((h, i) => (
                          <th key={h} className={`pb-2.5 text-[11px] text-[#6B7280] uppercase tracking-wider ${i >= 2 ? "text-right pl-5 whitespace-nowrap" : "text-left"}`} style={{ fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((row, i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-0">
                          <td className="py-3 pr-3 text-[12px] text-[#6B7280] whitespace-nowrap align-top">{row.date}</td>
                          <td className="py-3 pr-3 align-top">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.kind === "payment" ? "#16A34A" : row.kind === "invoice" ? "#4A6FA5" : "#94A3B8" }} />
                              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{row.desc}</span>
                            </div>
                            {row.sub && <div className="text-[12px] text-[#6B7280] mt-0.5 ml-3.5">{row.sub}</div>}
                          </td>
                          <td className="py-3 pl-5 text-[13px] text-right text-[#DC2626] whitespace-nowrap">{row.debit > 0 ? `$${fmt(row.debit)}` : "—"}</td>
                          <td className="py-3 pl-5 text-[13px] text-right text-[#16A34A] whitespace-nowrap">{row.credit > 0 ? `$${fmt(row.credit)}` : "—"}</td>
                          <td className={`py-3 pl-5 text-[13px] text-right whitespace-nowrap`} style={{ fontWeight: 600, color: row.balance > 0 ? "#DC2626" : "#16A34A" }}>
                            ${fmt(Math.abs(row.balance))}{row.balance < 0 ? " CR" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#E5E7EB]">
                        <td colSpan={2} className="pt-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Balance due</td>
                        <td />
                        <td />
                        <td className="pt-3 text-[14px] text-right" style={{ fontWeight: 700, color: (client.openBalance ?? 0) > 0 ? "#DC2626" : "#16A34A" }}>
                          ${fmt(client.openBalance ?? 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Footer CTA */}
              <div className="px-6 py-4 border-t border-[#E5E7EB] shrink-0 no-print">
                {(client.openBalance ?? 0) > 0 && (
                  <button
                    onClick={() => { setStatementOpen(false); navigate(createUrl("/payments/new", "payments", { amount: String(client.openBalance), method: client.paymentMethod || "" })); }}
                    className="w-full h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[14px] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Collect payment — ${fmt(client.openBalance ?? 0)}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
