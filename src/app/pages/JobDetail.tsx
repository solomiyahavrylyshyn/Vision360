import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { PlusIcon } from "../components/ui/plus-icon";
import { DocumentsGallery } from "../components/DocumentsGallery";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { DocumentPreview } from "../components/DocumentPreview";
import { toast } from "sonner";
import acServicePhoto from "../../assets/documents/33897-cu.jpg";
import waterHeaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import installAcPhoto from "../../assets/documents/34689-install-ac.jpg";

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
  uploadedBy?: string;
  category?: string;
}

const INITIAL_DOCS: DocFile[] = [
  { id: "1", name: "AC_Estimate_draft.pdf", size: "245 KB", date: "Mar 30, 2026", icon: "picture_as_pdf", iconColor: "#DC2626", uploadedBy: "Peter Novak", category: "Documents" },
  { id: "2", name: "Site_Photos_Before.jpg", size: "1.2 MB", date: "Mar 30, 2026", icon: "image", iconColor: "#2563EB", isImage: true, previewGradient: "linear-gradient(135deg,#bfdbfe,#3b82f6)", uploadedBy: "Field Crew", category: "Photos" },
  { id: "3", name: "Service_Agreement.docx", size: "88 KB", date: "Mar 28, 2026", icon: "description", iconColor: "#2563EB", uploadedBy: "Office Admin", category: "Agreements" },
  { id: "4", name: "Property_Map.pdf", size: "156 KB", date: "Mar 27, 2026", icon: "picture_as_pdf", iconColor: "#DC2626", uploadedBy: "Peter Novak", category: "Documents" },
  { id: "5", name: "Invoice_Draft.pdf", size: "112 KB", date: "Mar 26, 2026", icon: "picture_as_pdf", iconColor: "#DC2626", uploadedBy: "Office Admin", category: "Documents" },
  { id: "6", name: "Duct_System_Photo.jpg", size: "2.1 MB", date: "Mar 25, 2026", icon: "image", iconColor: "#059669", isImage: true, previewGradient: "linear-gradient(135deg,#d1fae5,#10b981)", uploadedBy: "Field Crew", category: "Photos" },
  { id: "7", name: "Permit_Application.pdf", size: "320 KB", date: "Mar 22, 2026", icon: "picture_as_pdf", iconColor: "#DC2626", uploadedBy: "Office Admin", category: "Documents" },
];

const mockJobData: Record<string, any> = {
  "5": {
    id: 5, title: "AC Estimate", client: "Mike Delgado", clientId: "10245", clientInitials: "MD",
    address: "2105 West Hills Avenue", city: "Tampa", state: "FL", zip: "33606",
    gateCode: "2486",
    phone: "813-286-7572", email: "mjdelgado84@yahoo.com",
    jobNumber: "10245", jobType: "Estimate", jobFrequency: "Recurring",
    assignedTo: "Peter Novak",
    startedOn: "Mar 30, 2026", endsOn: "Mar 30, 2026",
    startTime: "9:00 AM", endTime: "11:00 AM",
    status: "Scheduled" as const,
    priority: "Low" as const,
    customerSince: "Jul 2021",
    membership: "Silver - Exp. Dec 2027",
    lastService: "Jun 2025",
    tags: ["Recurring", "Estimate"],
    notes: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 10, 2026" },
      { id: 2, text: "Requested annual maintenance plan.", date: "Mar 10, 2026" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Mar 10, 2026" },
      { id: 4, text: "Requested annual maintenance plan.", date: "Mar 10, 2026" },
      { id: 5, text: "Requested annual maintenance plan.", date: "Mar 10, 2026" },
    ] as NoteEntry[],
    fieldNotes: [
      { id: 1, text: "Verify outdoor condenser clearance before quoting.", date: "Mar 10, 2026" },
      { id: 2, text: "Customer asked for equipment options by efficiency tier.", date: "Mar 10, 2026" },
      { id: 3, text: "Existing ductwork needs photo documentation.", date: "Mar 10, 2026" },
    ] as NoteEntry[],
    internalNotes: [
      { id: 1, text: "Check service agreement eligibility.", date: "Mar 10, 2026" },
      { id: 2, text: "Confirm financing options before estimate is sent.", date: "Mar 10, 2026" },
      { id: 3, text: "Previous service history imported from legacy account.", date: "Mar 10, 2026" },
      { id: 4, text: "Coordinate quote review with Peter Novak.", date: "Mar 10, 2026" },
    ] as NoteEntry[],
    lineItems: [{ name: "AC Estimate", description: "System evaluation and replacement estimate.", quantity: 1, unitCost: 7995.82, unitPrice: 45230, total: 45230 }],
    totalCost: 7995.82, totalPrice: 45230,
    expenses: [
      { id: 1, item: "Site Visit", description: "Technician assessment", date: "Mar 30, 2026", amount: 320.00 },
      { id: 2, item: "Materials Review", description: "Quote preparation", date: "Mar 30, 2026", amount: 231.70 },
      { id: 3, item: "Permit Research", description: "Local permit check", date: "Mar 29, 2026", amount: 120.00 },
      { id: 4, item: "Photo Documentation", description: "Field media capture", date: "Mar 29, 2026", amount: 85.00 },
    ] as Expense[],
    expenseTotal: 756.70,
    visits: [{ id: 1, dateTime: "Mar 30, 2026 - 9:00 AM", title: "Mike Delgado - AC Estimate", status: "Scheduled" }] as Visit[],
    profitability: { totalPrice: 45230, lineItemCost: 7995.82, labor: 14526.75, expenses: 551.70, profit: 23407.93, margin: 51.75 },
    linkedEstimate: { id: 1, title: "Estimate #10245-E02", status: "Draft" },
    linkedInvoice: null,
  },
  "1": {
    id: 1, title: "AC Estimate", client: "Travis Jones", clientId: "10245", clientInitials: "TJ",
    address: "4405 North Clark Avenue", city: "Tampa", state: "FL", zip: "33614",
    gateCode: "4821",
    phone: "(813) 612-5487", email: "ccj924@yahoo.com",
    jobNumber: "10245-J01", jobType: "Estimate",
    assignedTo: "Peter Novak",
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
    internalNotes: [
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
    // Per Marek's mock: Total Price 45,230 · Compensation 14,526.75 · All Expenses 8,547.52 · Margin 51.75%
    profitability: { totalPrice: 45230, lineItemCost: 7995.82, labor: 14526.75, expenses: 551.70, profit: 23407.93, margin: 51.75 },
    linkedEstimate: { id: 1, title: "Estimate #10245-E02", status: "Draft" },
    linkedInvoice: null,
  },
  "2": {
    id: 2, title: "Tree Removal", client: "Sarah Johnson", clientId: "10246", clientInitials: "SJ",
    address: "1220 Elm Street", city: "Orlando", state: "FL", zip: "32801",
    gateCode: "",
    phone: "(407) 555-1234", email: "sarah.j@email.com",
    jobNumber: "10246-J01", jobType: "Install",
    assignedTo: "Travis Brown",
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
    internalNotes: [] as NoteEntry[],
    lineItems: [{ name: "Tree Removal", description: "Full tree removal service", quantity: 1, unitCost: 200, unitPrice: 450, total: 450 }],
    totalCost: 200, totalPrice: 450,
    expenses: [] as Expense[], expenseTotal: 0,
    visits: [{ id: 1, dateTime: "Apr 10, 2026 — 9:00 AM", title: "Sarah Johnson - Tree Removal", status: "In Progress" }] as Visit[],
    profitability: { totalPrice: 450, lineItemCost: 200, labor: 0, expenses: 0, profit: 250, margin: 55.6 },
    linkedEstimate: null,
    linkedInvoice: { id: 1, title: "Invoice #10246-I01", status: "Draft" },
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

type TabKey = "details" | "appointments" | "checklist" | "documents" | "items" | "labor" | "expense" | "finance";

const BASE_TABS: { key: TabKey; label: string }[] = [
  { key: "details",       label: "Details" },
  { key: "estimates",     label: "Estimates" },
  { key: "invoices",      label: "Invoices" },
  { key: "items",         label: "Items" },
  { key: "expense",       label: "Expenses" },
];

/* 11 placeholder photos for the Attachments panel */
const MOCK_PHOTOS = [
  { id: "p1", previewUrl: acServicePhoto, tag: null },
  { id: "p2", previewUrl: installAcPhoto, tag: null },
  { id: "p3", previewUrl: waterHeaterPhoto, tag: null },
  { id: "p4", previewUrl: acServicePhoto, tag: null },
  { id: "p5", previewUrl: installAcPhoto, tag: null },
  { id: "p6", previewUrl: waterHeaterPhoto, tag: null },
  { id: "p7", previewUrl: acServicePhoto, tag: null },
  { id: "p8", previewUrl: installAcPhoto, tag: null },
  { id: "p9", previewUrl: waterHeaterPhoto, tag: null },
  { id: "p10", previewUrl: acServicePhoto, tag: null },
  { id: "p11", previewUrl: installAcPhoto, tag: null },
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
      {/* Header — only "+" icon per Marek's spec */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
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

  // Must stay in sync with Calendar.tsx TEAM list — mismatched names caused
  // QA BUG-09 where the Assigned-To dropdown showed people who didn't exist
  // on the schedule board.
  const FIELD_EMPLOYEES = ["Peter Novak", "Travis Brown", "Maria Garcia"];
  const [assignedTo, setAssignedTo] = useState<string>(job.assignedTo || "");
  const [assignedToOpen, setAssignedToOpen] = useState(false);

  // Notes sub-tab + media preview state
  const [noteTab,        setNoteTab]        = useState<"office" | "internal" | "field">("office");
  const [notesAdding,    setNotesAdding]    = useState(false);
  const [notesNewText,   setNotesNewText]   = useState("");
  const [notesExpanded,  setNotesExpanded]  = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<DocFile[]>(INITIAL_DOCS);
  // Unified attachment list (media photos + files) powering the reusable DocumentsGallery,
  // mirroring the client Documents tab experience.
  const [attachments, setAttachments] = useState<DocFile[]>(() => [
    ...MOCK_PHOTOS.map((p, i) => ({
      id: p.id,
      name: `Job photo ${i + 1}.jpg`,
      size: "2.4 MB",
      date: "May 19, 2026",
      icon: "image",
      iconColor: "#F59E0B",
      isImage: true,
      previewUrl: p.previewUrl,
      category: "Photos",
    })),
    ...INITIAL_DOCS.filter((d) => !d.isImage),
  ]);
  // Documents card no longer collapses — header icon triggers upload directly.
  const docsUploadRef = useRef<(() => void) | null>(null);
  const [docSearch, setDocSearch] = useState("");
  const [docDate, setDocDate] = useState("all");
  const [docCategory, setDocCategory] = useState("all");
  const [docUploader, setDocUploader] = useState("all");
  const [docSortField, setDocSortField] = useState<"name" | "date" | "type" | "size" | "uploadedBy">("name");
  const [docSortDir, setDocSortDir] = useState<"asc" | "desc">("asc");
  const [docPreviewIdx, setDocPreviewIdx] = useState(0);
  const [docsPage, setDocsPage] = useState(0);
  const [docPreviewPaneOpen, setDocPreviewPaneOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const DOCS_PER_PAGE = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Right-side preview panel selection
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const previewFile = documents.find(d => d.id === previewFileId) ?? null;
  // Batch selection state for the documents grid (checkbox + bulk delete)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const toggleSelected = (id: string) =>
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const openEdit = (section: "address" | "schedule" | "overview") => {
    setEditJob(job);
    setEditingSection(section);
  };
  const setEditField = (field: string, value: any) => setEditJob((p: any) => ({ ...p, [field]: value }));

  /* ── Tab counts ── */
  const getTabCount = (key: TabKey): number | undefined => {
    const counts: Partial<Record<TabKey, number>> = {
      appointments: job.visits.length,
      documents: documents.length,
      items: job.lineItems.length,
      expense: job.expenses.length,
    };
    return counts[key];
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

  const visibleTabs = BASE_TABS
    .filter(t => !hiddenTabs.has(t.key))
    .map(t => ({ ...t, count: getTabCount(t.key) }));
  const statusColor = statusColors[currentStatus] || "#6B7280";

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setStatusDropdownOpen(false);
  };

  /* ── File helpers ── */
  const getFileIcon = (name: string): { icon: string; iconColor: string } => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { icon: "picture_as_pdf", iconColor: "#DC2626" };
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return { icon: "image", iconColor: "#F59E0B" };
    if (["doc", "docx"].includes(ext || "")) return { icon: "description", iconColor: "#2563EB" };
    if (["xls", "xlsx", "csv"].includes(ext || "")) return { icon: "table_chart", iconColor: "#16A34A" };
    if (["zip", "rar", "7z"].includes(ext || "")) return { icon: "folder_zip", iconColor: "#7C3AED" };
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
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    Array.from(files).forEach((f) => {
      const docId = String(Date.now() + Math.random());
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const isImage = imageExts.includes(ext) || f.type.startsWith("image/");
      const doc: DocFile = {
        id: docId,
        name: f.name,
        size: formatSize(f.size),
        date: today,
        ...getFileIcon(f.name),
        isImage,
        uploadedBy: "You",
        category: isImage ? "Photos" : /agreement/i.test(f.name) ? "Agreements" : "Documents",
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => setDocuments(prev => prev.map(d => d.id === docId ? { ...d, previewUrl: String(reader.result) } : d));
        reader.readAsDataURL(f);
      }
      setDocuments(prev => [doc, ...prev]);
    });
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
  };

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

  /* ──────────────────────────────────────────
     CONTENT RENDERERS
  ────────────────────────────────────────── */

  const renderDetailsTab = () => {
    const noteTabs = [
      { key: "office"   as const, label: "Job",      notes: job.notes         },
      { key: "field"    as const, label: "Field",    notes: job.fieldNotes    },
      { key: "internal" as const, label: "Internal", notes: job.internalNotes },
    ];
    const activeNotes = noteTabs.find(t => t.key === noteTab)?.notes ?? [];
    const SHOW_N = 4;
    const shownNotes = notesExpanded ? activeNotes : activeNotes.slice(0, SHOW_N);

    const handleSaveNote = () => {
      const trimmed = notesNewText.trim();
      if (!trimmed) return;
      setNotesAdding(false);
      setNotesNewText("");
    };

    const panelHandle = (
      <ResizableHandle
        withHandle
        className="mx-2 w-1 rounded-full bg-transparent transition-colors hover:bg-[#D8DEE8] data-[resize-handle-active]:bg-[#C5D5EC] after:w-3"
      />
    );

    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-[440px] items-stretch">

        {/* ── Col 1: Job Overview + Job Date & Time (stacked cards) ── */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={32} className="min-w-0">
          <div className="h-full flex flex-col gap-4">
            {/* Job overview card — mirrors the Contact Information card on ClientDetail */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>work_outline</span>
                <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Job overview</span>
                <button
                  onClick={() => openEdit("overview")}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
                  aria-label="Edit job overview"
                >
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Job frequency</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.jobFrequency || "One-time"}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Job title</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.title}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Job Type</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.jobType}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Assigned to</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{assignedTo || "Unassigned"}{assignedTo ? " - Technician" : ""}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Service Address</div>
                  <div className="text-[14px] text-[#1A2332] leading-[20px]" style={{ fontWeight: 500 }}>
                    {job.address}<br />{job.city}, {job.state} {job.zip}
                    {job.gateCode && <><br /><span className="text-[#6B7280]" style={{ fontWeight: 400 }}>Gate code: {job.gateCode}</span></>}
                  </div>
                </div>
              </div>
            </div>

            {/* Job date & time card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>event</span>
                <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Job date & time</span>
                <button
                  onClick={() => openEdit("schedule")}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
                  aria-label="Edit job schedule"
                >
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Start Date</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.startedOn}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">End Date</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.endsOn}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">Start Time</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.startTime}</div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6B7280] leading-[20px]">End Time</div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.endTime}</div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {panelHandle}

        {/* ── Col 2: Notes panel with sub-tabs ── */}
        <ResizablePanel defaultSize={31} minSize={22} maxSize={48} className="min-w-0">
        <div className="h-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col">
          {/* Header: "Notes" label + sub-tabs + "+" */}
          <div className="flex items-center border-b border-[#E5E7EB] px-4 gap-1 shrink-0">
            <span className="sr-only">Notes</span>
            {noteTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setNoteTab(tab.key); setNotesExpanded(false); }}
                className={`relative py-3 px-2 text-[13px] transition-colors ${
                  noteTab === tab.key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#1A2332]"
                }`}
                style={{ fontWeight: noteTab === tab.key ? 500 : 400 }}
              >
                {tab.label} <span className="opacity-70">({tab.notes.length})</span>
                {noteTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A6FA5] rounded-full" />}
              </button>
            ))}
            <button
              onClick={() => { setNotesAdding(true); setNotesNewText(""); }}
              className="ml-auto w-7 h-7 flex items-center justify-center rounded hover:bg-[#F5F7FA]"
            >
              <PlusIcon className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </button>
          </div>

          {/* Add note form */}
          {notesAdding && (
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <textarea
                autoFocus value={notesNewText} onChange={e => setNotesNewText(e.target.value)}
                placeholder="Write a note…" rows={3}
                className="w-full text-[13px] text-[#1A2332] border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white placeholder:text-[#9CA3AF]"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveNote} disabled={!notesNewText.trim()}
                  className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md" style={{ fontWeight: 500 }}>Save</button>
                <button onClick={() => { setNotesAdding(false); setNotesNewText(""); }}
                  className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md" style={{ fontWeight: 500 }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Notes list */}
          {activeNotes.length === 0 && !notesAdding ? (
            <div className="py-8 text-center text-[12px] text-[#9CA3AF]">No {noteTabs.find(t=>t.key===noteTab)?.label.toLowerCase()} notes yet</div>
          ) : (
            <div className="divide-y divide-[#F3F4F6] flex-1 overflow-y-auto">
              {shownNotes.map((note: NoteEntry) => (
                <div key={note.id} className="px-4 py-3 group">
                  <div className="text-[12px] text-[#8899AA] mb-1">Added {note.date}</div>
                  <p className="text-[13px] text-[#1A2332] leading-[20px]" style={{ fontWeight: 600 }}>{note.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Show more */}
          {activeNotes.length > SHOW_N && (
            <button
              onClick={() => setNotesExpanded(v => !v)}
              className="w-full py-2.5 text-[12px] text-[#4A6FA5] hover:bg-[#F5F7FA] flex items-center justify-center gap-1 border-t border-[#E5E7EB] transition-colors"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>{notesExpanded ? "expand_less" : "expand_more"}</span>
              {notesExpanded ? "Show less" : `Show ${activeNotes.length - SHOW_N} more`}
            </button>
          )}
        </div>
        </ResizablePanel>

        {panelHandle}

        {/* ── Col 3: Attachments (Media / Files) ── */}
        <ResizablePanel defaultSize={47} minSize={30} className="min-w-0">
        <div className="h-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-2.5 shrink-0">
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
              Documents <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>({attachments.length})</span>
            </span>
            <button
              type="button"
              onClick={() => docsUploadRef.current?.()}
              aria-label="Upload documents"
              title="Upload documents"
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#4A6FA5] hover:bg-[#EDF0F5] transition-colors"
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>upload</span>
            </button>
          </div>

          {/* Documents gallery — reuses the client Documents tab experience */}
          <div className="flex-1 overflow-y-auto min-h-[420px]">
            <DocumentsGallery
              documents={attachments}
              onChange={setAttachments}
              hideToolbarUpload
              uploadTriggerRef={docsUploadRef}
            />
          </div>
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  const renderEstimatesTab = () => (
    <>
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimates</h3>
        <button type="button" aria-label="Create estimate" title="Create estimate"
          onClick={() => navigate(`/estimates/new?client=${encodeURIComponent(job.client)}`)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors">
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="text-center py-12">
        <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>request_quote</span>
        <div className="text-[13px] text-[#9CA3AF]">No estimates linked to this job yet.</div>
      </div>
    </>
  );

  const renderInvoicesTab = () => (
    <>
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices</h3>
        <button type="button" aria-label="Create invoice" title="Create invoice"
          onClick={() => navigate(`/invoices/new?client=${encodeURIComponent(job.client)}`)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors">
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      {job.linkedInvoice ? (
        <button onClick={() => navigate(`/invoices/${job.linkedInvoice.id}`)} className="w-full flex items-center justify-between border border-[#E5E7EB] rounded-lg px-4 py-3 hover:bg-[#F9FAFB] text-left transition-colors">
          <div>
            <div className="text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{job.linkedInvoice.id}</div>
            <div className="text-[12px] text-[#6B7280]">{job.linkedInvoice.status ?? "Invoice"}</div>
          </div>
          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>chevron_right</span>
        </button>
      ) : (
        <div className="text-center py-12">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>receipt_long</span>
          <div className="text-[13px] text-[#9CA3AF]">No invoices for this job yet.</div>
        </div>
      )}
    </>
  );

  const renderItemsTab = () => (
    <>
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Products & Services</h3>
        <button
          type="button"
          aria-label="Add line item"
          title="Add line item"
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
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
    </>
  );

  const renderExpenseTab = () => (
    <>
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Expenses</h3>
        <button
          type="button"
          onClick={() => navigate(`/expenses/new?fromJob=${encodeURIComponent(job.jobNumber)}${job.linkedInvoice ? `&fromInvoice=${encodeURIComponent(job.linkedInvoice.id)}` : ""}&returnTo=${encodeURIComponent("/jobs/" + id)}`)}
          aria-label="Add expense"
          title="Add expense"
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
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
    </>
  );

  const renderLaborTab = () => (
    <div className="text-center py-12">
      <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>engineering</span>
      <div className="text-[13px] text-[#9CA3AF]">Labor details coming soon</div>
    </div>
  );

  const renderFinanceTab = () => (
    <div className="text-center py-12">
      <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>attach_money</span>
      <div className="text-[13px] text-[#9CA3AF]">Financial summary coming soon</div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-3">
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
        <select value={docDate} onChange={e => setDocDate(e.target.value)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]">
          <option value="all">Date: All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <select value={docCategory} onChange={e => setDocCategory(e.target.value)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]">
          <option value="all">All Categories</option>
          <option value="Photos">Photos</option>
          <option value="Documents">Documents</option>
          <option value="Agreements">Agreements</option>
        </select>
        <select value={docUploader} onChange={e => setDocUploader(e.target.value)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#4A6FA5]">
          <option value="all">All uploaders</option>
          {uploaderOptions.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#374151] hover:bg-[#F5F7FA] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>swap_vert</span>
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
              <DropdownMenuItem key={item.key} className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer" onClick={() => setDocSortField(item.key as typeof docSortField)}>
                <span className="w-4 text-[#4A6FA5]">{docSortField === item.key ? "•" : ""}</span>
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
            <div className="h-px bg-[#E5E7EB] my-1" />
            <DropdownMenuItem className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer" onClick={() => setDocSortDir("asc")}>
              <span className="w-4 text-[#4A6FA5]">{docSortDir === "asc" ? "•" : ""}</span>
              <span>Ascending</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer" onClick={() => setDocSortDir("desc")}>
              <span className="w-4 text-[#4A6FA5]">{docSortDir === "desc" ? "•" : ""}</span>
              <span>Descending</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <button
          type="button"
          className={`h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md inline-flex items-center justify-center transition-colors shrink-0 ${isDragOver ? "ring-2 ring-[#C5D5EC]" : ""}`}
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

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFilesAdded(e.target.files)} />

      {sortedDocuments.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 text-center">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>folder_open</span>
          <div className="text-[13px] text-[#9CA3AF]">
            {docSearch || docDate !== "all" || docCategory !== "all" || docUploader !== "all"
              ? "No documents match your filters"
              : "No documents yet"}
          </div>
        </div>
      ) : (() => {
        const safeIdx = Math.min(docPreviewIdx, Math.max(0, sortedDocuments.length - 1));
        const current = sortedDocuments[safeIdx];
        const totalPages = Math.ceil(sortedDocuments.length / DOCS_PER_PAGE);
        const safePage = Math.min(docsPage, Math.max(0, totalPages - 1));
        return (
          <>
            {selectedDocs.size > 0 && (
              <div className="bg-[#EEF3FA] border border-[#C5D5EC] rounded-lg px-4 py-2 flex items-center gap-3 mb-3">
                <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{selectedDocs.size} selected</span>
                <button onClick={() => setSelectedDocs(new Set(sortedDocuments.map(f => f.id)))} className="text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>Select all</button>
                <button onClick={() => setSelectedDocs(new Set())} className="text-[12px] text-[#6B7280] hover:underline" style={{ fontWeight: 500 }}>Clear</button>
                <div className="flex-1" />
                <button onClick={() => setConfirmBulkDelete(true)} className="h-8 px-3 flex items-center gap-1.5 border border-[#FCA5A5] bg-white hover:bg-[#FEF2F2] rounded-md text-[13px] text-[#DC2626] transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                  Delete selected
                </button>
              </div>
            )}

            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex" style={{ minHeight: "520px" }}>
              <div className={`${docPreviewPaneOpen ? "w-[240px] shrink-0 border-r border-[#F3F4F6]" : "flex-1"} flex flex-col`}>
                <div className="p-2.5 flex-1 overflow-y-auto">
                  {!docPreviewPaneOpen && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Preview hidden — click any file to reopen</span>
                      <button onClick={() => setDocPreviewPaneOpen(true)} className="h-7 px-2.5 inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] border border-[#E5E7EB] rounded-md hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
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
                        <button
                          key={file.id}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || selectedDocs.size > 0) {
                              toggleSelected(file.id);
                            } else {
                              setDocPreviewIdx(globalIdx);
                              if (!docPreviewPaneOpen) setDocPreviewPaneOpen(true);
                            }
                          }}
                          className={`group relative aspect-[4/3] rounded overflow-hidden border transition-all ${
                            isActive ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/40" : isSelected ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30" : "border-[#E5E7EB] hover:border-[#C5D5EC]"
                          }`}
                          title={`${file.name}\n${file.size} · ${file.date}${file.uploadedBy ? ` · ${file.uploadedBy}` : ""}`}
                        >
                          {file.isImage && file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : file.isImage ? (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}>
                              <span className="material-icons text-white/70" style={{ fontSize: "14px" }}>image</span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: file.iconColor + "12" }}>
                              <span className="material-icons" style={{ fontSize: "14px", color: file.iconColor }}>{file.icon}</span>
                            </div>
                          )}
                          {file.category && (
                            <span className="absolute left-0.5 bottom-0.5 px-1 rounded text-[8px] text-white bg-[#16A34A]/80" style={{ fontWeight: 600 }}>{file.category.charAt(0)}</span>
                          )}
                          <span onClick={(e) => { e.stopPropagation(); toggleSelected(file.id); }} className={`absolute top-0.5 left-0.5 ${isSelected || selectedDocs.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(file.id)} onClick={(e) => e.stopPropagation()} className="w-3 h-3 accent-[#4A6FA5] cursor-pointer" aria-label={`Select ${file.name}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="px-2.5 py-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <button onClick={() => setDocsPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]">Prev</button>
                    <span className="tabular-nums">{safePage + 1} / {totalPages}</span>
                    <button onClick={() => setDocsPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]">Next</button>
                  </div>
                )}
              </div>

              {docPreviewPaneOpen && (
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="relative bg-[#FAFBFC] p-4 flex-1 flex items-center justify-center">
                    <button onClick={() => setDocPreviewPaneOpen(false)} className="absolute top-3 left-3 z-10 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors" title="Close preview" aria-label="Close preview">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
                    </button>
                    <button onClick={() => setDocPreviewIdx(i => (i - 1 + sortedDocuments.length) % sortedDocuments.length)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors" title="Previous">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
                    </button>
                    <div className="relative w-full max-w-[680px] aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#E5E7EB] flex items-center justify-center">
                      {current?.isImage && current.previewUrl ? (
                        <img src={current.previewUrl} alt={current.name} className="w-full h-full object-cover" />
                      ) : current?.isImage ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: current.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}>
                          <span className="material-icons text-white/70" style={{ fontSize: "64px" }}>image</span>
                        </div>
                      ) : current ? (
                        <div className="flex flex-col items-center gap-2 text-center px-6">
                          <span className="material-icons" style={{ fontSize: "64px", color: current.iconColor, opacity: 0.85 }}>{current.icon}</span>
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{current.name}</div>
                          <div className="text-[12px] text-[#9CA3AF]">{current.size} · {current.date}</div>
                        </div>
                      ) : null}
                      {current && (
                        <button onClick={() => setPreviewFileId(current.id)} className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors" title="Open full preview">
                          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>open_in_full</span>
                        </button>
                      )}
                      {current?.category && (
                        <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-[#16A34A]" style={{ fontWeight: 600 }}>{current.category}</span>
                      )}
                      <span className="absolute right-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-black/60" style={{ fontWeight: 500 }}>{safeIdx + 1} / {sortedDocuments.length}</span>
                    </div>
                    <button onClick={() => setDocPreviewIdx(i => (i + 1) % sortedDocuments.length)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors" title="Next">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
                    </button>
                  </div>
                  {current && (
                    <div className="px-4 py-2 border-t border-[#F3F4F6] text-[12px] text-[#6B7280] truncate" title={current.name}>{current.name}</div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}

      <DocumentPreview
        file={previewFile}
        onClose={() => setPreviewFileId(null)}
        onRename={(id, newName) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d))}
        onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
      />

      {confirmBulkDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmBulkDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <span className="material-icons" style={{ fontSize: "20px", color: "#DC2626" }}>delete_outline</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Delete {selectedDocs.size} {selectedDocs.size === 1 ? "file" : "files"}?</h3>
                <p className="text-[13px] text-[#6B7280] leading-[18px]">The selected {selectedDocs.size === 1 ? "file" : "files"} will be permanently removed. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmBulkDelete(false)} className="h-9 px-4 border border-[#D8DEE8] hover:bg-[#F5F7FA] text-[#546478] text-[13px] rounded-md transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  setDocuments(prev => prev.filter(d => !selectedDocs.has(d.id)));
                  setSelectedDocs(new Set());
                  setConfirmBulkDelete(false);
                }}
                className="h-9 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >
                Delete {selectedDocs.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "details":       return renderDetailsTab();
      case "estimates":     return renderEstimatesTab();
      case "invoices":      return renderInvoicesTab();
      case "documents":     return renderDocumentsTab();
      case "items":         return renderItemsTab();
      case "labor":         return renderLaborTab();
      case "expense":       return renderExpenseTab();
      case "finance":       return renderFinanceTab();
      default: return null;
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── PAGE HEADER (back arrow + actions on gray, outside the white card) ── */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#546478] hover:bg-[#EDF0F5] transition-colors"
          style={{ fontWeight: 500 }}
          aria-label="Back to Jobs"
          title="Back to Jobs"
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
        </button>
        <h1 className="text-[24px] leading-[32px] text-[#1A2332]" style={{ fontWeight: 700 }}>Job details</h1>
      </div>

      {/* ── ONE BIG WHITE CARD CONTAINING EVERYTHING ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4 overflow-x-auto">

        {/* Summary content — left column has title/contact row, right column has compact KPIs */}
        <div className="flex min-w-[1190px] items-start gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Row 1: Job number + status */}
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                {job.client} <span className="text-[#6B7280]" style={{ fontWeight: 500 }}>({job.jobNumber})</span>
              </h2>
              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] transition-colors"
                  style={{ fontWeight: 600, backgroundColor: `${statusColor}18`, color: statusColor }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                  {currentStatus}
                  <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[160px] py-1">
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

            {/* Row 2: Contact icon row — client name | phone icon | email icon | address | job title */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <div className="flex items-center gap-1 px-1.5">
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>location_on</span>
                <span className="text-[13px] text-[#374151]">{job.address}, {job.city}, {job.state} {job.zip}</span>
              </div>
              <div className="w-px h-4 bg-[#E5E7EB]" />
              <a href={`tel:${job.phone}`} className="flex items-center gap-1 px-2 rounded-lg hover:bg-[#F5F7FA] transition-colors" title={job.phone}>
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>phone</span>
                <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>{job.phone}</span>
              </a>
              <div className="w-px h-4 bg-[#E5E7EB]" />
              <a href={`mailto:${job.email}`} className="flex items-center gap-1 px-2 rounded-lg hover:bg-[#F5F7FA] transition-colors" title={job.email}>
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>mail</span>
                <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>{job.email}</span>
              </a>
            </div>

            {/* Row 3: Secondary metadata strip (grayed) — client since · last visit · notes preview */}
            {(job.customerSince || job.lastService || (job.notes && job.notes.length > 0)) && (
              <div className="flex items-center gap-0.5 flex-wrap pt-1.5 text-[12px] text-[#6B7280]">
                {job.customerSince && (
                  <div className="flex items-center gap-1.5 pr-3">
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>calendar_today</span>
                    Client since {job.customerSince}
                  </div>
                )}
                {job.lastService && (
                  <>
                    {job.customerSince && <div className="w-px h-3.5 bg-[#E5E7EB]" />}
                    <div className="flex items-center gap-1.5 px-3">
                      <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>schedule</span>
                      Last visit: {job.lastService}
                    </div>
                  </>
                )}
                {job.notes && job.notes.length > 0 && (
                  <>
                    {(job.customerSince || job.lastService) && <div className="w-px h-3.5 bg-[#E5E7EB]" />}
                    <div className="flex items-center gap-1.5 px-3 min-w-0">
                      <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>sticky_note_2</span>
                      <span className="truncate">
                        Notes ({job.notes.length}): {job.notes[0].text}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right column: Financial KPI cards — compact, no decimals, aligned to the right */}
          <div className="shrink-0 flex gap-2">
            {/* Total Price (green) */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5" style={{ minHeight: 44 }}>
              <div className="min-w-0">
                <div className="text-[15px] leading-tight tabular-nums whitespace-nowrap" style={{ fontWeight: 700, color: "#16A34A" }}>
                  ${job.profitability.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="truncate text-[10px]" style={{ color: "#546478" }}>Total Price</div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#16A34A26" }}>
                <span className="material-icons" style={{ fontSize: "16px", color: "#16A34A" }}>trending_up</span>
              </div>
            </div>
            {/* Compensation (red — expenses-style cost) */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5" style={{ minHeight: 44 }}>
              <div className="min-w-0">
                <div className="text-[15px] leading-tight tabular-nums whitespace-nowrap" style={{ fontWeight: 700, color: "#DC2626" }}>
                  ${Math.round(job.profitability.labor).toLocaleString("en-US")}
                </div>
                <div className="truncate text-[10px]" style={{ color: "#546478" }}>Compensation</div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#DC262626" }}>
                <span className="material-icons" style={{ fontSize: "16px", color: "#DC2626" }}>payments</span>
              </div>
            </div>
            {/* All Expenses (dark gray) */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5" style={{ minHeight: 44 }}>
              <div className="min-w-0">
                <div className="truncate text-[15px] leading-tight tabular-nums text-[#1A2332]" style={{ fontWeight: 700 }}>
                  ${(job.profitability.lineItemCost + job.profitability.expenses).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="truncate text-[10px]" style={{ color: "#546478" }}>All Expenses</div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#4A6FA526" }}>
                <span className="material-icons" style={{ fontSize: "16px", color: "#4A6FA5" }}>receipt_long</span>
              </div>
            </div>
            {/* Profit Margin (green if positive, red if negative) */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5" style={{ minHeight: 44 }}>
              <div className="min-w-0">
                <div className="text-[15px] leading-tight tabular-nums whitespace-nowrap" style={{ fontWeight: 700, color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A" }}>
                  {job.profitability.margin.toFixed(2)}%
                </div>
                <div className="flex items-center gap-1">
                  <div className="truncate text-[10px]" style={{ color: "#546478" }}>Profit Margin</div>
                  <div className="relative group">
                    <span className="material-icons cursor-help" style={{ fontSize: "12px", color: "#9CA3AF" }}>info</span>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3 py-2 z-50 whitespace-nowrap">
                      <div className="text-[12px]" style={{ color: "#1A2332" }}>(Total Price − Costs) / Total Price</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${job.profitability.margin < 0 ? "#DC2626" : "#16A34A"}26` }}>
                <span className="material-icons" style={{ fontSize: "16px", color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A" }}>query_stats</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider separating the job header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        <DetailTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton onClick={() => setShowTabSettings(true)} />}
          trailing={
            <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-9 px-3 inline-flex items-center gap-1.5 text-[13px] text-white bg-[#4A6FA5] rounded-lg hover:bg-[#3d5a85] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
                  Create
                  <span className="material-icons" style={{ fontSize: "15px" }}>keyboard_arrow_down</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-1">
                <DropdownMenuItem
                  className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                  onClick={() => navigate(`/estimates/new?client=${encodeURIComponent(job.client)}&returnTo=${encodeURIComponent("/jobs/" + id)}`)}
                >
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>request_quote</span>
                  Create Estimate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                  onClick={() => navigate(`/invoices/new?client=${encodeURIComponent(job.client)}&returnTo=${encodeURIComponent("/jobs/" + id)}`)}
                >
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>receipt</span>
                  Create Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-lg hover:bg-[#EDF0F5] flex items-center justify-center bg-white">
              <KebabItem icon="edit" onClick={() => navigate(`/jobs/${id}/edit`)}>Edit Job</KebabItem>
              <KebabItem icon="content_copy">Duplicate Job</KebabItem>
              <KebabSeparator />
              <KebabItem icon="archive" destructive>Archive Job</KebabItem>
            </KebabMenu>
            </>
          }
          className="mt-5"
        />

        {/* ── CONTENT AREA ── */}
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
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Assigned To</label>
                    <select
                      value={editJob.assignedTo || ""}
                      onChange={(e) => { setEditField("assignedTo", e.target.value); setAssignedTo(e.target.value); }}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="">Unassigned</option>
                      {FIELD_EMPLOYEES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Customer</label>
                    <input
                      value={editJob.client || ""}
                      readOnly
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-[#F9FAFB] text-[#6B7280]"
                    />
                  </div>
                  {/* Service Address (matches Figma edit-job modal) */}
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Service Address</label>
                    <select
                      value={editJob.country || "United States"}
                      onChange={(e) => setEditField("country", e.target.value)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5] mb-2"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Mexico">Mexico</option>
                    </select>
                    <input
                      value={editJob.address || ""}
                      onChange={(e) => setEditField("address", e.target.value)}
                      placeholder="Street address"
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5] mb-2"
                    />
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input value={editJob.city || ""} onChange={(e) => setEditField("city", e.target.value)} placeholder="City" className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                      <input value={editJob.state || ""} onChange={(e) => setEditField("state", e.target.value)} placeholder="State" className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                      <input value={editJob.zip || ""} onChange={(e) => setEditField("zip", e.target.value)} placeholder="Zip" className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editJob.county || ""} onChange={(e) => setEditField("county", e.target.value)} placeholder="County" className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                      <input value={editJob.gateCode || ""} onChange={(e) => setEditField("gateCode", e.target.value)} placeholder="Gate code" className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    </div>
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
