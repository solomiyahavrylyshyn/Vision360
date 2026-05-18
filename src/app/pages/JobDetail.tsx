import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";
import { PlusIcon } from "../components/ui/plus-icon";

interface Expense {
  id: number;
  item: string;
  description: string;
  date: string;
  amount: number;
}

interface Visit {
  id: number;
  dateTime: string;
  title: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

interface NoteEntry {
  id: number;
  text: string;
  date: string;
}

interface DocFile {
  id: string;
  name: string;
  size: string;
  date: string;
  icon: string;
  iconColor: string;
  isImage?: boolean;
  previewUrl?: string;
  previewGradient?: string;
}

const INITIAL_DOCS: DocFile[] = [
  { id: "1", name: "AC_Estimate_draft.pdf", size: "245 KB", date: "Mar 30, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
  { id: "2", name: "Site_Photos_Before.jpg", size: "1.2 MB", date: "Mar 30, 2026", icon: "image", iconColor: "#2563EB", isImage: true, previewGradient: "linear-gradient(135deg,#bfdbfe,#3b82f6)" },
  { id: "3", name: "Service_Agreement.docx", size: "88 KB", date: "Mar 28, 2026", icon: "description", iconColor: "#2563EB" },
  { id: "4", name: "Property_Map.pdf", size: "156 KB", date: "Mar 27, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
  { id: "5", name: "Invoice_Draft.pdf", size: "112 KB", date: "Mar 26, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
  { id: "6", name: "Duct_System_Photo.jpg", size: "2.1 MB", date: "Mar 25, 2026", icon: "image", iconColor: "#059669", isImage: true, previewGradient: "linear-gradient(135deg,#d1fae5,#10b981)" },
  { id: "7", name: "Permit_Application.pdf", size: "320 KB", date: "Mar 22, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
];

const mockJobData: Record<string, any> = {
  "1": {
    id: 1, title: "AC Estimate", client: "Travis Jones", clientInitials: "TJ",
    address: "4405 North Clark Avenue", city: "Tampa", state: "FL", zip: "33614",
    gateCode: "4821",
    phone: "(813) 612-5487", email: "ccj924@yahoo.com",
    jobNumber: "29899-J01", jobType: "Estimate",
    startedOn: "Mar 30, 2026", endsOn: "Mar 30, 2026",
    startTime: "9:00 AM", endTime: "11:00 AM",
    status: "Scheduled" as const,
    priority: "Low" as const,
    customerSince: "Jul - 2021",
    membership: "Silver - Exp. Dec 2027",
    lastService: "Jun-25",
    tags: ["New Homeowner"],
    notes: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 28, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Feb 19, 2026" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Jan 15, 2026" },
      { id: 4, text: "Requested annual maintenance plan.", date: "Jan 10, 2026" },
      { id: 5, text: "Large dog on property, call ahead.", date: "Nov 22, 2025" },
    ] as NoteEntry[],
    fieldNotes: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 28, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Feb 14, 2026" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Jan 10, 2026" },
      { id: 4, text: "Requested annual maintenance plan.", date: "Jan 05, 2026" },
    ] as NoteEntry[],
    privateNotes: [
      { id: 1, text: "Requested annual maintenance plan.", date: "Jan 15, 2026" },
      { id: 2, text: "Requested annual maintenance plan.", date: "Jan 10, 2026" },
      { id: 3, text: "Internal note: check warranty status.", date: "Dec 20, 2025" },
    ] as NoteEntry[],
    lineItems: [{ name: "Tree Removal", description: "Complete removal of a tree, including cutting it down to ground level, hauling away all wood and debris.", quantity: 1, unitCost: 0, unitPrice: 0, total: 0 }],
    totalCost: 0, totalPrice: 0,
    expenses: [
      { id: 1, item: "HD Items", description: "Plywood", date: "Mar 31, 2026", amount: 152.00 },
      { id: 2, item: "Refrigerant", description: "R-410A 25lb cylinder", date: "Mar 30, 2026", amount: 287.50 },
      { id: 3, item: "Copper Fittings", description: "Assorted fittings pack", date: "Mar 29, 2026", amount: 64.20 },
      { id: 4, item: "Filter Pack", description: "MERV-11 filters (6-pack)", date: "Mar 28, 2026", amount: 48.00 },
    ] as Expense[],
    expenseTotal: 551.70,
    visits: [{ id: 1, dateTime: "Mar 30, 2026 — Anytime", title: "Travis Jones - AC Estimate", status: "Scheduled" }] as Visit[],
    profitability: { totalPrice: 0, lineItemCost: 0, labor: 0, expenses: 551.70, profit: -551.70, margin: 0 },
    linkedEstimate: { id: 1, title: "Estimate #1", status: "Draft" },
    linkedInvoice: null,
  },
  "2": {
    id: 2, title: "Tree Removal", client: "Sarah Johnson", clientInitials: "SJ",
    address: "1220 Elm Street", city: "Orlando", state: "FL", zip: "32801",
    gateCode: "",
    phone: "(407) 555-1234", email: "sarah.j@email.com",
    jobNumber: "29900-J01", jobType: "Install",
    startedOn: "Apr 10, 2026", endsOn: "Apr 10, 2026",
    startTime: "9:00 AM", endTime: "1:00 PM",
    status: "In Progress" as const,
    priority: "High" as const,
    customerSince: "Mar - 2023",
    membership: null,
    lastService: "Apr-03",
    tags: ["Landscaping"],
    notes: [] as NoteEntry[],
    fieldNotes: [] as NoteEntry[],
    privateNotes: [] as NoteEntry[],
    lineItems: [{ name: "Tree Removal", description: "Full tree removal service", quantity: 1, unitCost: 200, unitPrice: 450, total: 450 }],
    totalCost: 200, totalPrice: 450,
    expenses: [] as Expense[], expenseTotal: 0,
    visits: [{ id: 1, dateTime: "Apr 10, 2026 — 9:00 AM", title: "Sarah Johnson - Tree Removal", status: "In Progress" }] as Visit[],
    profitability: { totalPrice: 450, lineItemCost: 200, labor: 0, expenses: 0, profit: 250, margin: 55.6 },
    linkedEstimate: null,
    linkedInvoice: { id: 1, title: "Invoice #1", status: "Draft" },
  },
};

const statusColors: Record<string, string> = {
  Scheduled: "#4A6FA5",
  "In Progress": "#D97706",
  Completed: "#16A34A",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  Low: { bg: "#F0FDF4", text: "#16A34A" },
  Medium: { bg: "#FEF3C7", text: "#D97706" },
  High: { bg: "#FEF2F2", text: "#DC2626" },
};

type TabKey = "details" | "estimate" | "invoices" | "items" | "expenses" | "documents";

const BASE_TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Job Details" },
  { key: "estimate", label: "Estimate" },
  { key: "invoices", label: "Invoices" },
  { key: "items", label: "Items" },
  { key: "expenses", label: "Expenses" },
  { key: "documents", label: "Documents" },
];

/* ──────────────────────────────────────────
   NOTE COLUMN SUB-COMPONENT
────────────────────────────────────────── */
function NoteColumn({ title, initialNotes }: { title: string; initialNotes: NoteEntry[] }) {
  const [notes, setNotes] = useState<NoteEntry[]>(initialNotes);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const SHOW = 4;
  const visibleNotes = expanded ? notes : notes.slice(0, SHOW);

  const handleSaveNote = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newId = Math.max(0, ...notes.map(n => n.id)) + 1;
    setNotes(prev => [{ id: newId, text: trimmed, date: dateStr }, ...prev]);
    setAdding(false);
    setNewText("");
  };

  const handleSaveEdit = () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setNotes(prev => prev.map(n => n.id === editingId ? { ...n, text: trimmed } : n));
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
        <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>subject</span>
        <span className="flex-1 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>
          {title}
          {notes.length > 0 && (
            <span className="text-[#9CA3AF] ml-1" style={{ fontWeight: 400 }}>({notes.length})</span>
          )}
        </span>
        <button
          onClick={() => { setAdding(true); setNewText(""); }}
          className="w-6 h-6 flex items-center justify-center hover:bg-[#F5F7FA] rounded transition-colors"
          title="Add note"
        >
          <PlusIcon className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </button>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-6 h-6 flex items-center justify-center hover:bg-[#F5F7FA] rounded transition-colors"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>
            {collapsed ? "add" : "remove"}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          {/* Add note form */}
          {adding && (
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <textarea
                autoFocus
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Write a note…"
                rows={3}
                className="w-full text-[13px] text-[#1A2332] border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white placeholder:text-[#9CA3AF]"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveNote}
                  disabled={!newText.trim()}
                  className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                  style={{ fontWeight: 500 }}
                >Save</button>
                <button
                  onClick={() => { setAdding(false); setNewText(""); }}
                  className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                  style={{ fontWeight: 500 }}
                >Cancel</button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {notes.length === 0 && !adding && (
            <div className="py-8 text-center text-[12px] text-[#9CA3AF]">No {title.toLowerCase()} yet</div>
          )}

          {/* Notes list */}
          {notes.length > 0 && (
            <div className="divide-y divide-[#E5E7EB]">
              {visibleNotes.map((note) => {
                const isLong = note.text.length > 120;
                const isExpanded = expandedIds.has(note.id);
                const isEditing = editingId === note.id;
                return (
                  <div key={note.id} className="group px-4 py-3">
                    {isEditing ? (
                      <div>
                        <textarea
                          autoFocus
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          rows={3}
                          className="w-full text-[13px] text-[#1A2332] border border-[#4A6FA5] rounded-lg px-3 py-2 resize-none focus:outline-none bg-white"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editingText.trim()}
                            className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                            style={{ fontWeight: 500 }}
                          >Save</button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                            style={{ fontWeight: 500 }}
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-[13px] text-[#1A2332] leading-[20px] flex-1 ${!isExpanded && isLong ? "line-clamp-2" : ""}`}
                            style={{ fontWeight: 500 }}
                          >
                            {note.text}
                          </p>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                            <button
                              onClick={() => { setEditingId(note.id); setEditingText(note.text); }}
                              className="w-6 h-6 flex items-center justify-center hover:bg-[#EDF0F5] rounded transition-colors"
                            >
                              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>edit</span>
                            </button>
                            <button
                              onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                              className="w-6 h-6 flex items-center justify-center hover:bg-[#FEF2F2] rounded transition-colors"
                            >
                              <span className="material-icons text-[#9CA3AF] hover:text-[#DC2626]" style={{ fontSize: "14px" }}>delete</span>
                            </button>
                          </div>
                        </div>
                        {isLong && (
                          <button
                            onClick={() => setExpandedIds(prev => {
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
                        <div className="text-[11px] text-[#9CA3AF] mt-1">{note.date}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show more / less */}
          {notes.length > SHOW && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full py-2.5 text-[12px] text-[#4A6FA5] hover:text-[#3d5a85] hover:bg-[#F5F7FA] rounded-lg transition-colors flex items-center justify-center gap-1 border-t border-[#E5E7EB]"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>
                {expanded ? "expand_less" : "expand_more"}
              </span>
              {expanded ? "Show less" : `Show ${notes.length - SHOW} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
export function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const job = mockJobData[id || "1"] || mockJobData["1"];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [hiddenTabs, setHiddenTabs] = useState<Set<TabKey>>(new Set());
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(job.status);
  const [editingSection, setEditingSection] = useState<null | "address" | "schedule" | "overview">(null);
  const [editJob, setEditJob] = useState<any>(job);

  // Assigned-to (per Marek: surface technician with quick dropdown to reassign without opening edit modal)
  const TECHNICIANS = ["Travis Jones", "Peter Romanenko", "Ernesto Diaz", "Alex Petrov", "Sarah Williams"];
  const [assignedTo, setAssignedTo] = useState<string>("Travis Jones");
  const [assignedDropdownOpen, setAssignedDropdownOpen] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<DocFile[]>(INITIAL_DOCS);
  const [docSearch, setDocSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = (section: "address" | "schedule" | "overview") => {
    setEditJob(job);
    setEditingSection(section);
  };
  const setEditField = (field: string, value: any) => setEditJob((p: any) => ({ ...p, [field]: value }));

  /* ── Tab label with counts ── */
  const getTabLabel = (key: TabKey): string => {
    const counts: Partial<Record<TabKey, number>> = {
      estimate: job.linkedEstimate ? 1 : 0,
      invoices: job.linkedInvoice ? 1 : 0,
      expenses: job.expenses.length,
      documents: documents.length,
    };
    const count = counts[key];
    const base = BASE_TABS.find(t => t.key === key)!.label;
    return count && count > 0 ? `${base} (${count})` : base;
  };

  const toggleTabVisibility = (key: TabKey) => {
    setHiddenTabs(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); }
      else {
        next.add(key);
        if (activeTab === key) {
          const firstVisible = BASE_TABS.find(t => t.key !== key && !next.has(t.key));
          if (firstVisible) setActiveTab(firstVisible.key);
        }
      }
      return next;
    });
  };

  const visibleTabs = BASE_TABS.filter(t => !hiddenTabs.has(t.key));
  const statusColor = statusColors[currentStatus] || "#6B7280";

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setStatusDropdownOpen(false);
  };

  /* ── File helpers ── */
  const getFileIcon = (name: string): { icon: string; iconColor: string } => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { icon: "picture_as_pdf", iconColor: "#DC2626" };
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return { icon: "image", iconColor: "#2563EB" };
    if (["doc", "docx"].includes(ext || "")) return { icon: "description", iconColor: "#2563EB" };
    if (["xls", "xlsx"].includes(ext || "")) return { icon: "table_chart", iconColor: "#059669" };
    return { icon: "insert_drive_file", iconColor: "#6B7280" };
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    Array.from(files).forEach((f) => {
      const docId = String(Date.now() + Math.random());
      const isImage = f.type.startsWith("image/");
      const doc: DocFile = { id: docId, name: f.name, size: formatSize(f.size), date: today, ...getFileIcon(f.name), isImage };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => setDocuments(prev => prev.map(d => d.id === docId ? { ...d, previewUrl: String(reader.result) } : d));
        reader.readAsDataURL(f);
      }
      setDocuments(prev => [doc, ...prev]);
    });
  };

  /* ──────────────────────────────────────────
     CONTENT RENDERERS
  ────────────────────────────────────────── */

  const renderDetailsTab = () => (
    <div className="flex gap-4 items-start">

      {/* ── Left: stacked cards ── */}
      <div className="flex flex-col gap-4 w-[260px] shrink-0">

        {/* Job Overview */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Overview</h3>
            <button onClick={() => openEdit("overview")} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Job Title</div>
            <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{job.title}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Service Address</div>
            <div className="flex items-start gap-1.5">
              <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "15px" }}>location_on</span>
              <div className="text-[13px] text-[#374151] leading-[20px]">
                {job.address}<br />{job.city}, {job.state} {job.zip}
                {job.gateCode && <><br /><span className="text-[#9CA3AF]">Gate code: {job.gateCode}</span></>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Job Type</div>
            <div className="text-[13px] text-[#374151]">{job.jobType}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Job #</div>
            <div className="text-[13px] text-[#374151]">{job.jobNumber}</div>
          </div>
        </div>

        {/* Appointment (date/time + assigned to) */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Appointment</h3>
            <button onClick={() => openEdit("schedule")} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF]">Start Date</div>
              <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{job.startedOn}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF]">End Date</div>
              <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{job.endsOn}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF]">Start Time</div>
              <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{job.startTime}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF]">End Time</div>
              <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{job.endTime}</div>
            </div>
          </div>

          {/* Assigned to — quick chevron-edit dropdown so dispatcher can reassign without opening the modal */}
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Assigned to</div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssignedDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 h-8 px-2 -ml-2 rounded-md hover:bg-[#F5F7FA] transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#4A6FA5] text-white text-[10px] flex items-center justify-center shrink-0" style={{ fontWeight: 600 }}>
                    {assignedTo.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </span>
                  <span className="text-[13px] text-[#374151] truncate" style={{ fontWeight: 500 }}>{assignedTo}</span>
                </span>
                <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "18px" }}>arrow_drop_down</span>
              </button>
              {assignedDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAssignedDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 w-full min-w-[200px] bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1">
                    {TECHNICIANS.map(tech => (
                      <button
                        key={tech}
                        onClick={() => { setAssignedTo(tech); setAssignedDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[#F5F7FA] ${tech === assignedTo ? "text-[#4A6FA5]" : "text-[#374151]"}`}
                        style={{ fontWeight: tech === assignedTo ? 600 : 400 }}
                      >
                        <span className="w-5 h-5 rounded-full bg-[#4A6FA5] text-white text-[9px] flex items-center justify-center shrink-0" style={{ fontWeight: 600 }}>
                          {tech.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                        <span className="flex-1 truncate">{tech}</span>
                        {tech === assignedTo && (
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: 3 note columns ── */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        <NoteColumn title="Job Notes" initialNotes={job.notes} />
        <NoteColumn title="Field Notes" initialNotes={job.fieldNotes} />
        <NoteColumn title="Private Notes" initialNotes={job.privateNotes} />
      </div>
    </div>
  );

  const renderEstimateTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimates</h3>
        <button
          onClick={() => navigate("/estimates/create")}
          className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1"
          style={{ fontWeight: 500 }}
        >
          <PlusIcon className="h-4 w-4" />
          Create estimate
        </button>
      </div>
      {job.linkedEstimate ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Estimate</th>
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#F3F4F6]">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>request_quote</span>
                  <button
                    onClick={() => navigate(`/estimates/${job.linkedEstimate.id}`)}
                    className="text-[#4A6FA5] hover:underline"
                    style={{ fontWeight: 500 }}
                  >
                    {job.linkedEstimate.title}
                  </button>
                </div>
              </td>
              <td className="py-3">
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F3F4F6] text-[#6B7280]" style={{ fontWeight: 500 }}>
                  {job.linkedEstimate.status}
                </span>
              </td>
              <td className="py-3 text-right">
                <button className="text-[12px] text-[#6B7280] hover:text-[#374151]">
                  <span className="material-icons" style={{ fontSize: "18px" }}>open_in_new</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="text-center py-8">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>request_quote</span>
          <div className="text-[13px] text-[#9CA3AF]">No estimates yet</div>
          <button
            onClick={() => navigate("/estimates/create")}
            className="mt-3 text-[12px] text-[#4A6FA5] hover:underline"
            style={{ fontWeight: 500 }}
          >
            Create the first estimate
          </button>
        </div>
      )}
    </div>
  );

  const renderInvoicesTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices</h3>
        <button
          onClick={() => navigate("/invoices/create")}
          className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1"
          style={{ fontWeight: 500 }}
        >
          <PlusIcon className="h-4 w-4" />
          Create invoice
        </button>
      </div>
      {job.linkedInvoice ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Invoice</th>
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#F3F4F6]">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>receipt</span>
                  <button
                    onClick={() => navigate(`/invoices/${job.linkedInvoice.id}`)}
                    className="text-[#4A6FA5] hover:underline"
                    style={{ fontWeight: 500 }}
                  >
                    {job.linkedInvoice.title}
                  </button>
                </div>
              </td>
              <td className="py-3">
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F3F4F6] text-[#6B7280]" style={{ fontWeight: 500 }}>
                  {job.linkedInvoice.status}
                </span>
              </td>
              <td className="py-3 text-right">
                <button className="text-[12px] text-[#6B7280] hover:text-[#374151]">
                  <span className="material-icons" style={{ fontSize: "18px" }}>open_in_new</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="text-center py-8">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>receipt</span>
          <div className="text-[13px] text-[#9CA3AF]">No invoices yet</div>
          <button
            onClick={() => navigate("/invoices/create")}
            className="mt-3 text-[12px] text-[#4A6FA5] hover:underline"
            style={{ fontWeight: 500 }}
          >
            Create the first invoice
          </button>
        </div>
      )}
    </div>
  );

  const renderItemsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Products & Services</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <PlusIcon className="h-4 w-4" />
          Add line item
        </button>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Line Item</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Qty</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Unit Cost</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Unit Price</th>
            <th className="text-right py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {job.lineItems.map((li: any, idx: number) => (
            <tr key={idx} className="border-b border-[#F3F4F6]">
              <td className="py-3">
                <div className="text-[#1A2332]" style={{ fontWeight: 500 }}>{li.name}</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">{li.description}</div>
              </td>
              <td className="text-center py-3 text-[#374151]">{li.quantity}</td>
              <td className="text-center py-3 text-[#374151]">${li.unitCost.toFixed(2)}</td>
              <td className="text-center py-3 text-[#374151]">${li.unitPrice.toFixed(2)}</td>
              <td className="text-right py-3 text-[#1A2332]" style={{ fontWeight: 500 }}>${li.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-8 pt-4 mt-2 border-t border-[#E5E7EB]">
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total Cost</div>
          <div className="text-[14px] text-[#374151]" style={{ fontWeight: 500 }}>${job.totalCost.toFixed(2)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total Price</div>
          <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>${job.totalPrice.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  const renderExpensesTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Expenses</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <PlusIcon className="h-4 w-4" />
          Add expense
        </button>
      </div>
      {job.expenses.length > 0 ? (
        <>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Item</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Description</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Date</th>
                <th className="text-right py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {job.expenses.map((exp: Expense) => (
                <tr key={exp.id} className="border-b border-[#F3F4F6]">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>receipt</span>
                      <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{exp.item}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#374151]">{exp.description}</td>
                  <td className="py-3 text-[#374151]">{exp.date}</td>
                  <td className="py-3 text-right text-[#1A2332]" style={{ fontWeight: 500 }}>${exp.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end pt-3 mt-2 border-t border-[#E5E7EB]">
            <div className="flex flex-col items-end gap-1">
              <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total</div>
              <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>${job.expenseTotal.toFixed(2)}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>receipt_long</span>
          <div className="text-[13px] text-[#9CA3AF]">No expenses recorded</div>
        </div>
      )}
    </div>
  );

  const renderDocumentsTab = () => {
    const filtered = documents.filter(d =>
      !docSearch || d.name.toLowerCase().includes(docSearch.toLowerCase())
    );
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
          <select className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]">
            <option>Date: All time</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <select className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]">
            <option>All Categories</option>
            <option>Photos</option>
            <option>Documents</option>
            <option>Agreements</option>
          </select>
          <div className="flex-1" />
          <button
            className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md flex items-center shrink-0 transition-colors"
            style={{ fontWeight: 500 }}
            onClick={() => fileInputRef.current?.click()}
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
          onChange={e => handleFilesAdded(e.target.files)}
        />

        {/* Files grid — Windows File Explorer medium-icons style per Marek's request */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filtered.map((file) => (
              <div
                key={file.id}
                className="flex flex-col items-center text-center group relative cursor-pointer rounded-lg p-2 hover:bg-[#EEF3FA] transition-colors"
                title={`${file.name}\n${file.size} · ${file.date}`}
              >
                {/* Thumbnail */}
                <div className="w-full aspect-[4/3] rounded-md border border-[#E5E7EB] overflow-hidden bg-white">
                  {file.isImage ? (
                    file.previewUrl ? (
                      <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
                      >
                        <span className="material-icons text-white/70" style={{ fontSize: "32px" }}>image</span>
                      </div>
                    )
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: file.iconColor + "12" }}
                    >
                      <span className="material-icons" style={{ fontSize: "40px", color: file.iconColor, opacity: 0.85 }}>{file.icon}</span>
                    </div>
                  )}
                </div>

                {/* Filename below */}
                <div
                  className="mt-2 text-[12px] text-[#1A2332] leading-[16px] w-full px-0.5"
                  style={{
                    fontWeight: 500,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {file.name}
                </div>

                {/* Hover delete */}
                <button
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/95 shadow text-[#9CA3AF] hover:text-[#DC2626] transition-all"
                  onClick={(e) => { e.stopPropagation(); setDocuments(prev => prev.filter(d => d.id !== file.id)); }}
                  title="Remove"
                >
                  <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl text-center py-14">
            <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>folder_open</span>
            <div className="text-[13px] text-[#9CA3AF]">
              {docSearch ? "No documents match your search" : "No documents yet"}
            </div>
            {!docSearch && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-[12px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                Upload the first document
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "details":   return renderDetailsTab();
      case "estimate":  return renderEstimateTab();
      case "invoices":  return renderInvoicesTab();
      case "items":     return renderItemsTab();
      case "expenses":  return renderExpensesTab();
      case "documents": return renderDocumentsTab();
      default: return null;
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Back arrow + Actions */}
        <div className="px-8 h-12 flex items-center justify-between gap-1.5 border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
            aria-label="Back to Jobs"
            title="Back to Jobs"
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Jobs</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/jobs/${id}/edit`)}
              className="border border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5 rounded-md flex items-center justify-center"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <KebabMenu triggerClassName="h-8 w-8 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
              <KebabItem icon="tab_unselected" onClick={() => setShowTabSettings(true)}>Edit Tabs</KebabItem>
              <KebabItem icon="edit" onClick={() => navigate(`/jobs/${id}/edit`)}>Edit Job</KebabItem>
              <KebabItem icon="content_copy">Duplicate Job</KebabItem>
              <KebabItem icon="block" destructive>Inactivate Job</KebabItem>
            </KebabMenu>
          </div>
        </div>

        {/* Summary content */}
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-start gap-10">
            {/* Main info section */}
            <div className="flex-1 flex gap-8">
              {/* Left: Name + Address + Icons + Status */}
              <div className="flex flex-col gap-4 min-w-[270px]">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
                    {job.client}
                  </h1>
                  <span className="text-[13px] text-[#9CA3AF]">
                    {job.jobNumber}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5">
                  <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "14px" }}>location_on</span>
                  <div className="text-[13px] text-[#374151] leading-[19px]">
                    {job.address}
                    <br />
                    {job.city}, {job.state}, {job.zip}
                  </div>
                </div>

                {/* Icons row + Status */}
                <div className="flex items-center gap-4">
                  {/* Phone */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>phone</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{job.phone}</div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>email</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{job.email}</div>
                    </div>
                  </div>

                  {/* Job Type pill removed per Marek — it's already shown in Job Overview below */}

                  {/* Status badge */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors"
                      style={{
                        fontWeight: 600,
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {currentStatus}
                      <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[150px] py-1">
                        {["Scheduled", "In Progress", "Completed"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F4F6] flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                            <span style={{ color: statusColors[s], fontWeight: 500 }}>{s}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Three-column data grid */}
              <div className="grid grid-cols-3 gap-6 flex-1 border-l border-[#E5E7EB] pl-10">
                {/* Column 1: Customer since + Tags */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Customer since</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">{job.customerSince}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Tags ({job.tags.length})</div>
                    {job.tags.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {job.tags.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#9CA3AF] leading-[20px]">—</div>
                    )}
                  </div>
                </div>

                {/* Column 2: Membership + Last Service */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Membership</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">
                      {job.membership || <span className="text-[#9CA3AF]">—</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Last Service</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">
                      {job.lastService || <span className="text-[#9CA3AF]">—</span>}
                    </div>
                  </div>
                </div>

                {/* Column 3: Notes preview */}
                <div className="relative group cursor-pointer flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Notes ({job.notes.length})</div>
                  {job.notes.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {job.notes.slice(0, 2).map((note: NoteEntry) => (
                        <div key={note.id} className="text-[12px] text-[#374151] leading-[18px] truncate max-w-[240px]">
                          {note.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#9CA3AF] leading-[20px]">—</div>
                  )}

                  {/* Notes hover tooltip */}
                  {job.notes.length > 0 && (
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 w-[320px] z-[60]">
                      <div className="absolute -top-1.5 left-5 w-3 h-1.5 overflow-hidden">
                        <div className="absolute w-2 h-2 bg-white border-l border-t border-[#E5E7EB] rotate-45 left-1/2 -translate-x-1/2"></div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-lg p-3.5">
                        <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.5px" }}>
                          Notes
                        </div>
                        <div className="h-px bg-[#E5E7EB] mb-3"></div>
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                          {job.notes.map((note: NoteEntry, index: number) => (
                            <div key={note.id} className="flex flex-col gap-1">
                              <div className="text-[13px] text-[#1A2332] leading-[20px]">{note.text}</div>
                              <div className="text-[11px] text-[#6B7280] leading-[16px]">{note.date}</div>
                              {index < job.notes.length - 1 && <div className="h-px bg-[#E5E7EB] mt-2"></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-l border-[#E5E7EB] pl-8" style={{ width: "280px" }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-[255px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Total Price</div>
                  <div className="text-[18px] text-[#16A34A] leading-[28px]" style={{ fontWeight: 600 }}>
                    ${job.profitability.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Compensation</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 500 }}>
                    ${job.profitability.labor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">All Expenses</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 500 }}>
                    ${(job.profitability.lineItemCost + job.profitability.expenses).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Profit Margin</div>
                    <div className="relative group">
                      <span className="material-icons text-[#9CA3AF] cursor-help" style={{ fontSize: "14px" }}>info</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3 py-2 z-50 whitespace-nowrap">
                        <div className="text-[12px] text-[#1A2332]">(Total Price − Costs) / Total Price</div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-[18px] leading-[28px]"
                    style={{ fontWeight: 600, color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A" }}
                  >
                    {job.profitability.margin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL TABS ── */}
      <div className="bg-white sticky top-0 z-30">
        <div className="flex items-center overflow-x-auto scrollbar-hide border-b border-[#E5E7EB]">
          <div className="flex items-center px-6">
            {visibleTabs.map(({ key }) => {
              const label = getTabLabel(key);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap ${
                    activeTab === key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {label}
                  {activeTab === key && (
                    <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 space-y-4 bg-[#F5F7FA]">
        {renderContent()}
      </main>

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
              <h2 className="text-[16px] text-[#111827]" style={{ fontWeight: 600 }}>
                {editingSection === "address" && "Edit service address"}
                {editingSection === "schedule" && "Edit job date & time"}
                {editingSection === "overview" && "Edit job overview"}
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
              {editingSection === "address" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Street address</label>
                    <input
                      value={editJob.address || ""}
                      onChange={(e) => setEditField("address", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
                      <input
                        value={editJob.city || ""}
                        onChange={(e) => setEditField("city", e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>State</label>
                      <input
                        value={editJob.state || ""}
                        onChange={(e) => setEditField("state", e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>ZIP</label>
                      <input
                        value={editJob.zip || ""}
                        onChange={(e) => setEditField("zip", e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "schedule" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Start date</label>
                    <input
                      value={editJob.startedOn || ""}
                      onChange={(e) => setEditField("startedOn", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End date</label>
                    <input
                      value={editJob.endsOn || ""}
                      onChange={(e) => setEditField("endsOn", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Start time</label>
                    <input
                      value={editJob.startTime || ""}
                      onChange={(e) => setEditField("startTime", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End time</label>
                    <input
                      value={editJob.endTime || ""}
                      onChange={(e) => setEditField("endTime", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                </div>
              )}

              {editingSection === "overview" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job title</label>
                    <input
                      value={editJob.title || ""}
                      onChange={(e) => setEditField("title", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job #</label>
                      <input
                        value={editJob.jobNumber || ""}
                        readOnly
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-[#F9FAFB] text-[#6B7280] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job type</label>
                      <select
                        value={editJob.jobType || ""}
                        onChange={(e) => setEditField("jobType", e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      >
                        <option value="Estimate">Estimate</option>
                        <option value="Install">Install</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Priority</label>
                      <select
                        value={editJob.priority || "Low"}
                        onChange={(e) => setEditField("priority", e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Customer</label>
                    <input
                      value={editJob.client || ""}
                      readOnly
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-[#F9FAFB] text-[#6B7280]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingSection(null)}
                className="h-9 px-4 border border-[#E5E7EB] rounded-md text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingSection(null)}
                className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors"
                style={{ fontWeight: 500 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Settings Modal ── */}
      {showTabSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTabSettings(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[260px] py-3">
            <div className="px-4 pb-2 pt-1 flex items-center justify-between">
              <p className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Show / Hide Tabs</p>
              <button onClick={() => setShowTabSettings(false)} className="text-[#9CA3AF] hover:text-[#374151]">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="border-t border-[#F3F4F6] pt-1">
              {BASE_TABS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#F9FAFB] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenTabs.has(key)}
                    onChange={() => toggleTabVisibility(key)}
                    className="w-4 h-4 accent-[#4A6FA5]"
                  />
                  <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
