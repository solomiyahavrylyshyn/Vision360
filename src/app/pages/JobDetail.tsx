import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";

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
  assigned: string;
}

interface NoteEntry {
  id: number;
  text: string;
  date: string;
}

const mockJobData: Record<string, any> = {
  "1": {
    id: 1, title: "AC Estimate", client: "Travis Jones", clientInitials: "TJ",
    address: "4405 North Clark Avenue", city: "Tampa", state: "FL", zip: "33614",
    phone: "(813) 612-5487", email: "ccj924@yahoo.com",
    jobNumber: "29899-J01", jobType: "Estimate",
    startedOn: "Mar 30, 2026", endsOn: "Mar 30, 2026",
    startTime: "9:00 AM", endTime: "11:00 AM",
    assignedTo: "Marek Stroz", assignedInitials: "MS",
    status: "Scheduled" as const,
    priority: "Low" as const,
    customerSince: "Jul - 2021",
    membership: "Silver - Exp. Dec 2027",
    lastService: "Jun-25",
    tags: ["New Homeowner"],
    notes: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 28, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Feb 14, 2026" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Jan 10, 2026" },
      { id: 4, text: "Gate code: 4821", date: "Dec 03, 2025" },
      { id: 5, text: "Large dog on property, call ahead.", date: "Nov 22, 2025" },
    ] as NoteEntry[],
    privateNotes: [] as NoteEntry[],
    fieldNotes: [] as NoteEntry[],
    lineItems: [{ name: "Tree Removal", description: "Complete removal of a tree, including cutting it down to ground level, hauling away all wood and debris.", quantity: 1, unitCost: 0, unitPrice: 0, total: 0 }],
    totalCost: 0, totalPrice: 0,
    expenses: [{ id: 1, item: "HD Items", description: "Plywood", date: "Mar 31, 2026", amount: 152.00 }] as Expense[],
    expenseTotal: 152.00,
    visits: [{ id: 1, dateTime: "Mar 30, 2026 — Anytime", title: "Travis Jones - AC Estimate", status: "Scheduled", assigned: "Marek Stroz" }] as Visit[],
    profitability: { totalPrice: 0, lineItemCost: 0, labor: 0, expenses: 152.00, profit: -152.00, margin: 0 },
    linkedEstimate: { id: 1, title: "Estimate #1", status: "Draft" },
    linkedInvoice: null,
    photos: { before: [], after: [] },
  },
  "2": {
    id: 2, title: "Tree Removal", client: "Sarah Johnson", clientInitials: "SJ",
    address: "1220 Elm Street", city: "Orlando", state: "FL", zip: "32801",
    phone: "(407) 555-1234", email: "sarah.j@email.com",
    jobNumber: "29900-J01", jobType: "Install",
    startedOn: "Apr 10, 2026", endsOn: "Apr 10, 2026",
    startTime: "9:00 AM", endTime: "1:00 PM",
    assignedTo: "Marek Stroz", assignedInitials: "MS",
    status: "In Progress" as const,
    priority: "High" as const,
    customerSince: "Mar - 2023",
    membership: null,
    lastService: "Apr-03",
    tags: ["Landscaping"],
    notes: [] as NoteEntry[],
    privateNotes: [] as NoteEntry[],
    fieldNotes: [] as NoteEntry[],
    lineItems: [{ name: "Tree Removal", description: "Full tree removal service", quantity: 1, unitCost: 200, unitPrice: 450, total: 450 }],
    totalCost: 200, totalPrice: 450,
    expenses: [] as Expense[], expenseTotal: 0,
    visits: [{ id: 1, dateTime: "Apr 10, 2026 — 9:00 AM", title: "Sarah Johnson - Tree Removal", status: "In Progress", assigned: "Marek Stroz" }] as Visit[],
    profitability: { totalPrice: 450, lineItemCost: 200, labor: 0, expenses: 0, profit: 250, margin: 55.6 },
    linkedEstimate: null,
    linkedInvoice: { id: 1, title: "Invoice #1", status: "Draft" },
    photos: { before: [], after: [] },
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

type TabKey = "details" | "documents" | "items" | "expenses";
type NotesTabKey = "notes" | "private" | "field";
type DocTabKey = "estimates" | "invoices" | "photos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Job Details" },
  { key: "documents", label: "Documents" },
  { key: "items", label: "Items" },
  { key: "expenses", label: "Expenses" },
];

export function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const job = mockJobData[id || "1"] || mockJobData["1"];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [hiddenTabs, setHiddenTabs] = useState<Set<TabKey>>(new Set());
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(job.status);
  const [notesTab, setNotesTab] = useState<NotesTabKey>("notes");
  const [jobNotes, setJobNotes] = useState<NoteEntry[]>(job.notes);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [addingJobNote, setAddingJobNote] = useState(false);
  const [newJobNoteText, setNewJobNoteText] = useState("");
  const [editingJobNoteId, setEditingJobNoteId] = useState<number | null>(null);
  const [editingJobNoteText, setEditingJobNoteText] = useState("");
  const [expandedJobNoteIds, setExpandedJobNoteIds] = useState<Set<number>>(new Set());
  const [docTab, setDocTab] = useState<DocTabKey>("estimates");
  const [photoTab, setPhotoTab] = useState<"before" | "after">("before");
  const [editingSection, setEditingSection] = useState<null | "address" | "assigned" | "schedule" | "overview">(null);
  const [editJob, setEditJob] = useState<any>(job);
  const openEdit = (section: "address" | "assigned" | "schedule" | "overview") => {
    setEditJob(job);
    setEditingSection(section);
  };
  const setEditField = (field: string, value: any) => setEditJob((p: any) => ({ ...p, [field]: value }));

  const toggleTabVisibility = (key: TabKey) => {
    setHiddenTabs(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); }
      else {
        next.add(key);
        if (activeTab === key) {
          const firstVisible = TABS.find(t => t.key !== key && !next.has(t.key));
          if (firstVisible) setActiveTab(firstVisible.key);
        }
      }
      return next;
    });
  };

  const visibleTabs = TABS.filter(t => !hiddenTabs.has(t.key));

  const statusColor = statusColors[currentStatus] || "#6B7280";

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setStatusDropdownOpen(false);
  };

  /* ──────────────────────────────────────────
     CONTENT RENDERERS (per tab)
  ────────────────────────────────────────── */

  const renderDetailsTab = () => (
    <div className="flex gap-4 items-stretch">

      {/* ── Job Overview ── */}
      <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Overview</h3>
          <button onClick={() => openEdit("overview")} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="flex flex-col gap-4">
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
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Job Type</div>
            <div className="text-[13px] text-[#374151]">{job.jobType}</div>
          </div>
          <div className="h-px bg-[#F3F4F6]" />
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Assigned To</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[11px]" style={{ fontWeight: 600 }}>
                {job.assignedInitials}
              </div>
              <div>
                <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.assignedTo}</div>
                <div className="text-[11px] text-[#9CA3AF]">Technician</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF]">Job #</div>
            <div className="text-[13px] text-[#374151]">{job.jobNumber}</div>
          </div>
        </div>
      </div>

      {/* ── Job Date & Time ── */}
      <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Date & Time</h3>
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
      </div>

      {/* ── Notes Panel ── */}
      <div className="w-[300px] shrink-0 bg-white border border-[#DDE3EE] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#DDE3EE]">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>notes</span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">
            Notes
            {jobNotes.length > 0 && (
              <span className="ml-1 text-[#9CA3AF]" style={{ fontWeight: 400 }}>({jobNotes.length})</span>
            )}
          </span>
          <button
            onClick={() => { setAddingJobNote(true); setNewJobNoteText(""); }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
          >
            <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>add</span>
          </button>
        </div>

        {/* Note type tabs */}
        <div className="flex border-b border-[#DDE3EE] px-5">
          {(["notes", "private", "field"] as NotesTabKey[]).map((t) => {
            const label = t === "notes" ? "Notes" : t === "private" ? "Private Notes" : "Field Notes";
            return (
              <button
                key={t}
                onClick={() => { setNotesTab(t); setAddingJobNote(false); }}
                className={`py-2.5 mr-4 text-[12px] border-b-2 transition-colors ${
                  notesTab === t ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
                }`}
                style={{ fontWeight: notesTab === t ? 600 : 500 }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Add note form */}
        {addingJobNote && notesTab === "notes" && (
          <div className="px-5 py-3 border-b border-[#DDE3EE] bg-[#F9FAFB]">
            <textarea
              autoFocus
              value={newJobNoteText}
              onChange={e => setNewJobNoteText(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              className="w-full text-[13px] text-[#1A2332] border border-[#DDE3EE] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white placeholder:text-[#9CA3AF]"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const trimmed = newJobNoteText.trim();
                  if (!trimmed) return;
                  const today = new Date();
                  const dateStr = `Added ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                  const newId = Math.max(0, ...jobNotes.map(n => n.id)) + 1;
                  setJobNotes(prev => [{ id: newId, text: trimmed, date: dateStr }, ...prev]);
                  setAddingJobNote(false);
                  setNewJobNoteText("");
                }}
                disabled={!newJobNoteText.trim()}
                className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >Save</button>
              <button
                onClick={() => { setAddingJobNote(false); setNewJobNoteText(""); }}
                className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Notes list */}
        <div className="px-5 pt-2 pb-1">
          {notesTab === "private" && (
            <div className="py-6 text-center text-[12px] text-[#9CA3AF]">No private notes yet</div>
          )}
          {notesTab === "field" && (
            <div className="py-6 text-center text-[12px] text-[#9CA3AF]">No field notes yet</div>
          )}
          {notesTab === "notes" && jobNotes.length === 0 && !addingJobNote && (
            <div className="py-6 text-center text-[12px] text-[#9CA3AF]">No notes yet</div>
          )}
          {notesTab === "notes" && <>{(notesExpanded ? jobNotes : jobNotes.slice(0, 4)).map((note, index, arr) => {
            const isLong = note.text.length > 120;
            const isExpanded = expandedJobNoteIds.has(note.id);
            const isEditingThis = editingJobNoteId === note.id;
            return (
              <div key={note.id} className={`group py-3 ${index < arr.length - 1 ? "border-b border-[#DDE3EE]" : ""}`}>
                {isEditingThis ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editingJobNoteText}
                      onChange={e => setEditingJobNoteText(e.target.value)}
                      rows={3}
                      className="w-full text-[13px] text-[#1A2332] border border-[#4A6FA5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const trimmed = editingJobNoteText.trim();
                          if (!trimmed) return;
                          setJobNotes(prev => prev.map(n => n.id === note.id ? { ...n, text: trimmed } : n));
                          setEditingJobNoteId(null);
                        }}
                        disabled={!editingJobNoteText.trim()}
                        className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                        style={{ fontWeight: 500 }}
                      >Save</button>
                      <button
                        onClick={() => setEditingJobNoteId(null)}
                        className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                        style={{ fontWeight: 500 }}
                      >Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] text-[#1A2332] leading-[20px] flex-1 ${!isExpanded && isLong ? "line-clamp-2" : ""}`}
                        style={{ fontWeight: 500 }}>
                        {note.text}
                      </p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                        <button
                          onClick={() => { setEditingJobNoteId(note.id); setEditingJobNoteText(note.text); }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#EDF0F5] rounded transition-colors"
                        >
                          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setJobNotes(prev => prev.filter(n => n.id !== note.id));
                            setExpandedJobNoteIds(prev => { const s = new Set(prev); s.delete(note.id); return s; });
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#FEF2F2] rounded transition-colors"
                        >
                          <span className="material-icons text-[#9CA3AF] hover:text-[#DC2626]" style={{ fontSize: "14px" }}>delete</span>
                        </button>
                      </div>
                    </div>
                    {isLong && (
                      <button
                        onClick={() => setExpandedJobNoteIds(prev => {
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
          {jobNotes.length > 4 && (
            <button
              onClick={() => setNotesExpanded(v => !v)}
              className="w-full py-2.5 text-[12px] text-[#4A6FA5] hover:text-[#3d5a85] hover:bg-[#F5F7FA] rounded-lg transition-colors flex items-center justify-center gap-1 border-t border-[#DDE3EE] mt-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>
                {notesExpanded ? "expand_less" : "expand_more"}
              </span>
              {notesExpanded ? "Show less" : `Show ${jobNotes.length - 4} more`}
            </button>
          )}</>}
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-5">
        {(["estimates", "invoices", "photos"] as DocTabKey[]).map((t) => {
          const label = t === "estimates" ? "Estimates" : t === "invoices" ? "Invoices" : "Photos";
          return (
            <button
              key={t}
              onClick={() => setDocTab(t)}
              className={`pb-3 px-3 text-[13px] border-b-2 transition-colors ${
                docTab === t ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: docTab === t ? 600 : 500 }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {docTab === "estimates" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimates</h3>
            <button
              onClick={() => navigate("/estimates/create")}
              className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
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
      )}

      {docTab === "invoices" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices</h3>
            <button
              onClick={() => navigate("/invoices/create")}
              className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
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
      )}

      {docTab === "photos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Attachments & Photos</h3>
            <button className="px-3 py-1.5 border border-[#4A6FA5] text-[#4A6FA5] rounded-md text-[12px] hover:bg-[#EBF0F8] flex items-center gap-1" style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>add_a_photo</span>
              Upload
            </button>
          </div>
          <div className="flex gap-4 border-b border-[#E5E7EB] mb-4">
            <button
              onClick={() => setPhotoTab("before")}
              className={`pb-2 text-[13px] border-b-2 ${photoTab === "before" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280]"}`}
              style={{ fontWeight: photoTab === "before" ? 600 : 500 }}
            >
              Before
            </button>
            <button
              onClick={() => setPhotoTab("after")}
              className={`pb-2 text-[13px] border-b-2 ${photoTab === "after" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280]"}`}
              style={{ fontWeight: photoTab === "after" ? 600 : 500 }}
            >
              After
            </button>
          </div>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
            <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>photo_camera</span>
            <p className="text-[13px] text-[#9CA3AF]">
              No {photoTab} photos yet. Upload photos to document job progress.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderItemsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Products & Services</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
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
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
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

  const renderContent = () => {
    switch (activeTab) {
      case "details": return renderDetailsTab();
      case "documents": return renderDocumentsTab();
      case "items": return renderItemsTab();
      case "expenses": return renderExpensesTab();
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
              className="border border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5 rounded-md flex items-center justify-center"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <KebabMenu triggerClassName="h-8 w-8 border border-[#DDE3EE] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
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

                  {/* Job Type */}
                  <span className="px-2.5 py-1 rounded text-[11px] bg-[#F3F4F6] text-[#374151]" style={{ fontWeight: 500 }}>
                    {job.jobType}
                  </span>

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

              {/* Three-column data grid — inherited from client */}
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

                {/* Column 3: Notes */}
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
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Labor</div>
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
            {visibleTabs.map(({ key, label }) => (
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
            ))}
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
                {editingSection === "assigned" && "Edit assigned technician"}
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
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
                      <input
                        value={editJob.city || ""}
                        onChange={(e) => setEditField("city", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>State</label>
                      <input
                        value={editJob.state || ""}
                        onChange={(e) => setEditField("state", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>ZIP</label>
                      <input
                        value={editJob.zip || ""}
                        onChange={(e) => setEditField("zip", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "assigned" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Technician</label>
                    <select
                      value={editJob.assignedTo || ""}
                      onChange={(e) => setEditField("assignedTo", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="Marek Stroz">Marek Stroz</option>
                      <option value="Travis Jones">Travis Jones</option>
                      <option value="Sarah Miller">Sarah Miller</option>
                      <option value="Anne Blue">Anne Blue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                    <select
                      defaultValue="Lead Technician"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option>Lead Technician</option>
                      <option>Helper</option>
                      <option>Apprentice</option>
                    </select>
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
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End date</label>
                    <input
                      value={editJob.endsOn || ""}
                      onChange={(e) => setEditField("endsOn", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Start time</label>
                    <input
                      value={editJob.startTime || ""}
                      onChange={(e) => setEditField("startTime", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End time</label>
                    <input
                      value={editJob.endTime || ""}
                      onChange={(e) => setEditField("endTime", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
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
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
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
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
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
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
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
                className="h-9 px-4 border border-[#DDE3EE] rounded-md text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors"
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
              {TABS.map(({ key, label }) => (
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
