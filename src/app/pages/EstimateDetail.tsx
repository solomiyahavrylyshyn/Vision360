import { useState, useRef, useEffect, useCallback } from "react";
import { getStoredBrandLogo, BRAND_LOGO_EVENT } from "../utils/brandTheme";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { PlusIcon } from "../components/ui/plus-icon";
import { DocumentPreview } from "../components/DocumentPreview";
import { DocumentsGallery } from "../components/DocumentsGallery";
import { estimatesStore, type EstimateRecord } from "../stores/estimatesStore";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
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

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus =
  | "Draft" | "Sent" | "Viewed" | "Changes Requested" | "Updated" | "Approved" | "Rejected" | "Expired" | "Archived" | "Converted";

interface LineItem {
  id: number; name: string; description: string;
  quantity: number; price: number; cost: number; amount: number;
  taxable: boolean; optional?: boolean;
}

interface MockPhoto { id: number; tag: "Before" | "After"; group: "A" | "B"; color: string; }

interface NoteEntry {
  id: number;
  text: string;
  date: string;
  kind: "client" | "internal";
}

interface EstimateData {
  id: number; estimateNumber: string; estimateName: string;
  clientName: string; clientEmail: string; clientPhone: string;
  clientAddress: string; serviceAddress: string;
  dateCreated: string; expirationDate: string; sentDate: string;
  status: EstimateStatus; teamMember: string; job: string; jobId: number | null;
  items: LineItem[]; notes: string; internalNotes: string; taxRate: number;
  notesList?: NoteEntry[];
  depositRequired: boolean; depositType: "amount" | "percentage"; depositValue: number;
  photos?: MockPhoto[];
  activity: { id: number; date: string; action: string; detail: string; icon: string }[];
}

// ─── Status colours ───────────────────────────────────────────────────────────
const statusColors: Record<EstimateStatus, string> = {
  Draft: "#6B7280", Sent: "#1E40AF", Viewed: "#92400E",
  "Changes Requested": "#B45309", Updated: "#4A6FA5",
  Approved: "#166534", Rejected: "#DC2626", Expired: "#6B7280", Archived: "#4B5563",
  Converted: "#4A6FA5",
};
const statusBg: Record<EstimateStatus, string> = {
  Draft: "#F3F4F6", Sent: "#DBEAFE", Viewed: "#FEF3C7",
  "Changes Requested": "#FEF3C7", Updated: "#EBF0F8",
  Approved: "#DCFCE7", Rejected: "#FEE2E2", Expired: "#F3F4F6", Archived: "#E5E7EB",
  Converted: "#EBF0F8",
};
const primaryStatuses: EstimateStatus[] = [
  "Draft", "Sent", "Viewed", "Changes Requested", "Updated", "Approved", "Rejected", "Expired",
];
const otherStatuses: EstimateStatus[] = ["Archived"];
// Converted is terminal — it's set automatically and not shown in the picker.
const isConverted = (s: EstimateStatus) => s === "Converted";

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockEstimates: Record<string, EstimateData> = {
  "1": {
    id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones",
    clientEmail: "cerb04@yahoo.com", clientPhone: "(863) 225-3254",
    clientAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    serviceAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    dateCreated: "Mar 30, 2026", expirationDate: "Apr 30, 2026", sentDate: "Not Sent",
    status: "Draft", teamMember: "Marek Stroz", job: "10245-J01: AC Estimate", jobId: 1,
    items: [
      { id: 1, name: "Diagnostic Visit", description: "Standard diagnostic service call", quantity: 1, price: 99, cost: 0, amount: 99, taxable: true },
      { id: 2, name: "AC Tune-Up", description: "Annual AC maintenance and tune-up", quantity: 1, price: 129, cost: 0, amount: 129, taxable: true },
    ], notes: "", internalNotes: "",
    taxRate: 0, depositRequired: false, depositType: "amount", depositValue: 0,
    activity: [
      { id: 1, date: "Mar 30, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
    ],
  },
  "5": {
    id: 5, estimateNumber: "10246-E01", estimateName: "Option A", clientName: "John Doe",
    clientEmail: "john.doe@email.com", clientPhone: "(555) 123-4567",
    clientAddress: "1250 NW 24th St\nMiami, FL 33142",
    serviceAddress: "1250 NW 24th St\nMiami, FL 33142",
    dateCreated: "Mar 02, 2026", expirationDate: "Apr 02, 2026", sentDate: "Mar 03, 2026",
    status: "Approved", teamMember: "Marek Stroz", job: "10246-J01: Bathroom Remodel", jobId: 4,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Unit", description: "High efficiency outdoor unit", quantity: 1, price: 3200, cost: 1800, amount: 3200, taxable: true },
      { id: 2, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 2, price: 95, cost: 45, amount: 190, taxable: false },
      { id: 3, name: "Thermostat - Smart WiFi", description: "Smart WiFi Thermostat", quantity: 1, price: 110, cost: 65, amount: 110, taxable: true },
    ],
    notes: "Client prefers morning installation window.", internalNotes: "",
    taxRate: 7.5, depositRequired: true, depositType: "amount", depositValue: 850,
    activity: [
      { id: 1, date: "Mar 02, 2026 08:30", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 03, 2026 10:15", action: "Estimate sent", detail: "Sent to john.doe@email.com", icon: "send" },
      { id: 3, date: "Mar 10, 2026 14:00", action: "Estimate approved", detail: "Customer approved the estimate", icon: "check_circle" },
    ],
  },
  "6": {
    id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams",
    clientEmail: "sarah.w@gmail.com", clientPhone: "(407) 555-0198",
    clientAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    serviceAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    dateCreated: "Feb 28, 2026", expirationDate: "Mar 28, 2026", sentDate: "Mar 01, 2026",
    status: "Approved", teamMember: "Marek Stroz", job: "10248-J01: HVAC Replacement", jobId: 3,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Premium", description: "Ultra high efficiency", quantity: 1, price: 4800, cost: 2900, amount: 4800, taxable: true },
      { id: 2, name: "Copper Piping Installation", description: "Per linear foot", quantity: 50, price: 18.50, cost: 6.75, amount: 925, taxable: true },
      { id: 3, name: "General Labor - Technician", description: "Hourly", quantity: 16, price: 95, cost: 45, amount: 1520, taxable: false },
      { id: 4, name: "Thermostat - Smart WiFi", description: "Ecobee smart thermostat", quantity: 1, price: 450, cost: 180, amount: 450, taxable: true },
      { id: 5, name: "Electrical Panel Upgrade 200A", description: "Panel upgrade", quantity: 1, price: 2800, cost: 1100, amount: 2800, taxable: true },
    ],
    notes: "Coordinate with electrical team for panel upgrade timing.", internalNotes: "",
    taxRate: 7.5, depositRequired: true, depositType: "percentage", depositValue: 50,
    photos: [
      { id: 1, tag: "Before", group: "A", color: "#CBD5E1" },
      { id: 2, tag: "Before", group: "A", color: "#94A3B8" },
      { id: 3, tag: "Before", group: "A", color: "#CBD5E1" },
      { id: 4, tag: "Before", group: "A", color: "#94A3B8" },
      { id: 5, tag: "After",  group: "B", color: "#86EFAC" },
      { id: 6, tag: "After",  group: "B", color: "#4ADE80" },
      { id: 7, tag: "After",  group: "B", color: "#86EFAC" },
      { id: 8, tag: "After",  group: "B", color: "#4ADE80" },
    ],
    activity: [
      { id: 1, date: "Feb 28, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 01, 2026 11:30", action: "Estimate sent", detail: "Sent to sarah.w@gmail.com", icon: "send" },
      { id: 3, date: "Mar 15, 2026 16:00", action: "Estimate approved", detail: "Customer approved the estimate", icon: "check_circle" },
    ],
  },
  "7": {
    id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez",
    clientEmail: "mike.r@outlook.com", clientPhone: "(813) 555-0142",
    clientAddress: "1804 W North B St\nTampa, FL 33606",
    serviceAddress: "1804 W North B St\nTampa, FL 33606",
    dateCreated: "Feb 25, 2026", expirationDate: "Mar 27, 2026", sentDate: "Feb 26, 2026",
    status: "Viewed", teamMember: "Marek Stroz", job: "10247-J01: Plumbing Repair", jobId: 5,
    items: [
      { id: 1, name: "Drain Cleaning Service", description: "Clear main drain line", quantity: 1, price: 175, cost: 40, amount: 175, taxable: false },
      { id: 2, name: "Pipe Repair Labor", description: "Technician labor", quantity: 3, price: 95, cost: 45, amount: 285, taxable: false },
      { id: 3, name: "PVC Repair Materials", description: "Pipe, fittings, primer, cement", quantity: 1, price: 390, cost: 140, amount: 390, taxable: true },
    ],
    notes: "Do not walk on the right side — citrus tree planted. Dog on the right side.", internalNotes: "",
    taxRate: 7.5, depositRequired: false, depositType: "amount", depositValue: 0,
    activity: [
      { id: 1, date: "Feb 25, 2026 09:18", action: "Estimate created", detail: "Created from Job-5 by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Feb 25, 2026 09:18", action: "Technician assigned", detail: "Marek Stroz assigned as estimate technician", icon: "engineering" },
      { id: 3, date: "Feb 26, 2026 10:04", action: "Estimate sent", detail: "Sent to mike.r@outlook.com", icon: "send" },
      { id: 4, date: "Feb 26, 2026 18:42", action: "Customer viewed estimate", detail: "Mike Rodriguez opened the estimate from email link", icon: "visibility" },
      { id: 5, date: "Mar 04, 2026 08:11", action: "Customer viewed estimate again", detail: "Estimate viewed 7 days after it was sent", icon: "visibility" },
      { id: 6, date: "Mar 06, 2026 14:22", action: "Changes requested", detail: "Mike Rodriguez: \"Please add pipe insulation for the main line\"", icon: "edit_note" },
    ],
  },
};

type TabKey = "details" | "jobs" | "deposit" | "activity";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "jobs", label: "Jobs" },
  { key: "deposit", label: "Deposit" },
  { key: "activity", label: "Activity" },
];

const catalogItems = [
  { id: 101, name: "Heat Pump Repair or Service", price: 285, cost: 120 },
  { id: 102, name: "SEER Heat Pump Condenser Unit", price: 3200, cost: 1800 },
  { id: 103, name: "Copper Piping Installation", price: 18.50, cost: 6.75 },
  { id: 104, name: "General Labor - Technician", price: 95, cost: 45 },
  { id: 105, name: "Thermostat - Smart WiFi", price: 450, cost: 180 },
  { id: 106, name: "Drain Cleaning Service", price: 175, cost: 40 },
  { id: 107, name: "Electrical Panel Upgrade 200A", price: 2800, cost: 1100 },
];

// Bridges the store's EstimateRecord into the richer EstimateData shape this
// page uses. Missing fields fall back to empty/sane defaults so the page renders
// even for minimally-created drafts.
function recordToEstimateData(r: EstimateRecord): EstimateData {
  return {
    id: r.id,
    estimateNumber: r.estimateNumber,
    estimateName: r.estimateName,
    clientName: r.clientName,
    clientEmail: r.clientEmail,
    clientPhone: r.clientPhone ?? "",
    clientAddress: r.clientAddress ?? "",
    serviceAddress: r.serviceAddress ?? r.clientAddress ?? "",
    dateCreated: r.createdDate,
    expirationDate: r.expirationDate ?? "",
    sentDate: r.sentDate || "Not Sent",
    status: r.status,
    teamMember: r.teamMember ?? "",
    job: r.jobTitle || r.job || "",
    jobId: r.jobId ?? null,
    items: (r.items ?? []).map((it) => ({
      id: it.id, name: it.name, description: it.description,
      quantity: it.quantity, price: it.price, cost: it.cost,
      amount: it.amount, taxable: it.taxable,
    })),
    notes: r.notes ?? "",
    internalNotes: r.internalNotes ?? "",
    taxRate: r.taxRate ?? 0,
    depositRequired: r.depositRequired ?? false,
    depositType: r.depositType ?? "amount",
    depositValue: r.depositValue ?? 0,
    activity: [{
      id: 1,
      date: `${r.createdDate || "—"} 09:00`,
      action: "Estimate created",
      detail: `Created by ${r.addedBy || "You"}`,
      icon: "add_circle",
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
export function EstimateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  // Resolve the estimate by id (1) from the persistent store first — that's
  // where user-created records live; (2) by estimateNumber as a fallback so
  // direct links like /estimates/10245-E03 also work; (3) from the seed
  // mockEstimates table for legacy demo rows. If nothing matches, fall
  // through to the first seed so the page never crashes.
  const initial: EstimateData = (() => {
    const seed = mockEstimates[id || ""];
    if (seed) return seed;
    const allStored = estimatesStore.getSnapshot();
    const byId = allStored.find((e) => String(e.id) === id);
    const byNumber = byId ?? allStored.find((e) => e.estimateNumber === id);
    if (byNumber) return recordToEstimateData(byNumber);
    return mockEstimates["1"];
  })();
  const [estimate, setEstimate] = useState<EstimateData>({ ...initial });
  // Keep in sync with the store for fields that can be changed elsewhere
  // (e.g. status changed from the Estimates list page). Only re-sync the
  // status so the user's in-page edits (items, notes) aren't blown away.
  const latestRecord = estimatesStore.getById(estimate.id);
  useEffect(() => {
    if (latestRecord && latestRecord.status !== estimate.status) {
      setEstimate(prev => ({ ...prev, status: latestRecord.status }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestRecord?.status]);
  const initialTabKey = (searchParams.get("tab") as TabKey) || "details";
  const [activeTab, setActiveTabState] = useState<TabKey>(initialTabKey);
  const setActiveTab = (key: TabKey) => {
    setActiveTabState(key);
    const next = new URLSearchParams(searchParams);
    if (key === "details") next.delete("tab"); else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };
  const [statusOpen, setStatusOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [customerPreviewOpen, setCustomerPreviewOpen] = useState(false);
  const [brandLogo, setBrandLogoState] = useState(() => getStoredBrandLogo());
  const handleBrandLogoChange = useCallback((e: Event) => {
    setBrandLogoState((e as CustomEvent<string>).detail ?? "");
  }, []);
  useEffect(() => {
    window.addEventListener(BRAND_LOGO_EVENT, handleBrandLogoChange);
    return () => window.removeEventListener(BRAND_LOGO_EVENT, handleBrandLogoChange);
  }, [handleBrandLogoChange]);
  interface DocFile { id: string; name: string; size: string; date: string; icon: string; iconColor: string; isImage?: boolean; previewUrl?: string; previewGradient?: string; uploadedBy?: string; category?: string; }
  // Documents are scoped PER estimate id — each demo estimate gets its OWN
  // subset, so estimates 5 / 6 / 7 never share the same documents (and the
  // draft estimate 1 shows none). User-created estimates also start empty.
  const ALL_SEED_DOCS: DocFile[] = [
        { id: "photo-34610", name: "Copy of 34610 Install outlet outdoor electrical panel.jpg", size: "3.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: outdoorElectricalPanelPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-33841", name: "Copy of 33841 Install AC.jpg", size: "2.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAc33841Photo, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-34689-tankless", name: "Copy of 34689 Install Water Heater Tankless.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterTanklessPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-34689-ac", name: "Copy of 34689 Install AC.jpg", size: "2.7 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAcPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-34285", name: "Copy of 34285 Install Water Heater.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-33897", name: "Copy of 33897 cu.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: cuPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-33805", name: "Copy of 33805 Install ducts & vents.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installDuctsVentsPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-33702-1", name: "Copy of 33702 Install heating system (1).jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystem1Photo, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-33702", name: "Copy of 33702 Install heating system.jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystemPhoto, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-87970", name: "87970_20241208_113711.png", size: "10.0 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job87970Photo, uploadedBy: "Field Crew", category: "Photos" },
        { id: "photo-44644", name: "44644_IMG_20241210_123749.png", size: "9.5 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job44644Photo, uploadedBy: "Field Crew", category: "Photos" },
  ];
  // Distinct subset per demo estimate id (estimate 1 = draft → none).
  const docsByEstimateId: Record<string, DocFile[]> = {
    "6": ALL_SEED_DOCS.slice(0, 5),
    "7": ALL_SEED_DOCS.slice(5, 8),
    "5": ALL_SEED_DOCS.slice(8, 11),
  };
  const seedDocs: DocFile[] = docsByEstimateId[id || ""] ?? [];
  const [documents, setDocuments] = useState<DocFile[]>(seedDocs);
  // Re-seed when navigating directly between estimate detail pages (the route
  // reuses the mounted component, so without this the previous estimate's docs
  // would persist). Only fires on id change, so in-session uploads are kept.
  useEffect(() => { setDocuments(docsByEstimateId[id || ""] ?? []); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [docsPage, setDocsPage] = useState(0);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [docPreviewIdx, setDocPreviewIdx] = useState(0);
  const [docKind, setDocKind] = useState<"photos" | "files">("photos");
  const [noteTab, setNoteTab] = useState<"client" | "internal">("client");
  const DOCS_PER_PAGE = 10; // 5 columns x 2 rows
  const previewFile = documents.find(d => d.id === previewFileId) ?? null;
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Lets the card header trigger DocumentsGallery's file picker without it
  // having to render its own Upload button (matches JobDetail).
  const docsUploadRef = useRef<(() => void) | null>(null);
  // Notes — modal-driven add, list-driven display (mirrors ClientDetail).
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  // Fall back to the estimate's own note fields so a real note shows in the
  // column (not just the customer-preview) until the user adds structured ones.
  const notesList: NoteEntry[] = estimate.notesList ?? [
    ...(estimate.notes ? [{ id: -1, text: estimate.notes, date: estimate.dateCreated, kind: "client" as const }] : []),
    ...(estimate.internalNotes ? [{ id: -2, text: estimate.internalNotes, date: estimate.dateCreated, kind: "internal" as const }] : []),
  ];
  const clientCount = notesList.filter((n) => n.kind === "client").length;
  const internalCount = notesList.filter((n) => n.kind === "internal").length;
  const activeNotes = notesList.filter((n) => n.kind === noteTab);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const visibleNotes = showAllNotes ? activeNotes : activeNotes.slice(0, 4);
  const addNote = () => {
    const trimmed = newNoteText.trim();
    if (!trimmed) return;
    const newId = (notesList.length ? Math.max(...notesList.map((n) => n.id)) : 0) + 1;
    const entry: NoteEntry = {
      id: newId,
      text: trimmed,
      date: formatRegionalDate(new Date()),
      kind: noteTab,
    };
    setEstimate(prev => ({ ...prev, notesList: [entry, ...(prev.notesList ?? [])] }));
    setNewNoteText("");
    setAddingNote(false);
  };
  const deleteNote = (id: number) =>
    setEstimate(prev => ({ ...prev, notesList: (prev.notesList ?? []).filter((n) => n.id !== id) }));

  // Status change helper: updates local state + store, sets sentDate on Sent,
  // and appends an Activity entry so the audit trail is complete (G6).
  const changeStatus = (next: EstimateStatus) => {
    const now = formatRegionalDate(new Date());
    const actionLabel: Record<EstimateStatus, string> = {
      Draft: "Reverted to Draft",
      Sent: "Estimate sent",
      Viewed: "Marked as Viewed",
      "Changes Requested": "Changes requested",
      Updated: "Estimate updated",
      Approved: "Estimate approved",
      Rejected: "Estimate rejected",
      Expired: "Marked as Expired",
      Archived: "Archived",
    };
    const newActivity = {
      id: (estimate.activity.length ? Math.max(...estimate.activity.map(a => a.id)) : 0) + 1,
      date: `${now} — today`,
      action: actionLabel[next] ?? `Status → ${next}`,
      detail: `Changed by You`,
      icon: next === "Sent" ? "send" : next === "Approved" ? "check_circle" : next === "Rejected" ? "cancel" : "swap_horiz",
    };
    const patch: Partial<typeof estimate> = {
      status: next,
      activity: [newActivity, ...estimate.activity],
      sentDate: next === "Sent" ? now : estimate.sentDate,
    };
    setEstimate(prev => ({ ...prev, ...patch }));
    estimatesStore.update(estimate.id, {
      status: next,
      sentDate: next === "Sent" ? now : undefined,
    });
    setStatusOpen(false);
  };
  const toggleDocSelected = (docId: string) => setSelectedDocs(prev => { const n = new Set(prev); n.has(docId) ? n.delete(docId) : n.add(docId); return n; });
  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith("image/");
      const newDoc: DocFile = { id: `upload-${Date.now()}-${file.name}`, name: file.name, size: file.size > 1048576 ? `${(file.size/1048576).toFixed(1)} MB` : `${Math.round(file.size/1024)} KB`, date: formatRegionalDate(new Date()), icon: isImg ? "image" : "insert_drive_file", iconColor: isImg ? "#F59E0B" : "#6B7280", isImage: isImg, uploadedBy: "You", category: isImg ? "Photos" : "Documents" };
      if (isImg) { const reader = new FileReader(); reader.onload = e => setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, previewUrl: e.target?.result as string } : d)); reader.readAsDataURL(file); }
      setDocuments(prev => [newDoc, ...prev]);
    });
  };

  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const subtotal = estimate.items.reduce((s, i) => s + i.amount, 0);
  const taxableAmount = estimate.items.filter(i => i.taxable).reduce((s, i) => s + i.amount, 0);
  const taxAmount = taxableAmount * (estimate.taxRate / 100);
  const total = subtotal + taxAmount;
  const depositAmount = estimate.depositRequired
    ? estimate.depositType === "percentage" ? total * (estimate.depositValue / 100) : estimate.depositValue
    : 0;

  const removeItem = (itemId: number) => setEstimate(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  const photos = estimate.photos || [];
  const totalDocCount = photos.length;

  // ── Customer preview ─────────────────────────────────────────────────────────
  const renderCustomerPreview = () => (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-start justify-center overflow-y-auto px-6 py-8" onClick={() => setCustomerPreviewOpen(false)}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => window.print()}
            className="h-9 px-3 rounded-md bg-white border border-[#D8DEE8] text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>print</span> Print
          </button>
          <button type="button" onClick={() => setCustomerPreviewOpen(false)}
            className="h-9 w-9 rounded-md bg-white border border-[#D8DEE8] text-[#546478] hover:bg-[#F5F7FA] inline-flex items-center justify-center">
            <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
        <div className="bg-white text-[#5F6670] shadow-2xl border border-[#D7DCE3]" style={{ width: 760, minHeight: 980, padding: "32px 28px 44px", fontFamily: "Arial, sans-serif" }}>
          <div className="flex items-start justify-between mb-9">
            <div className="text-[12px] leading-[18px]">
              {brandLogo
                ? <img src={brandLogo} alt="Company logo" className="max-h-[48px] max-w-[160px] object-contain mb-1" />
                : <div style={{ fontWeight: 700 }}>Service Vision</div>
              }
              <div>8377 Standish Bend Dr Tampa FL 33615</div>
              <div style={{ color: "var(--brand-primary, #4A6FA5)" }}>jaamsflying@gmail.com</div>
              <div>(813) 263-0691</div>
            </div>
            <div className="text-right">
              <div className="text-[31px] leading-none tracking-wide text-[#4F5660]" style={{ fontWeight: 800 }}>ESTIMATE</div>
              <div className="grid grid-cols-[100px_120px] gap-x-6 gap-y-1 text-[12px] mt-11">
                <div className="text-right" style={{ fontWeight: 700 }}>Estimate #</div>
                <div className="text-right text-[#7C6A9D]">{estimate.estimateNumber}</div>
                <div className="text-right" style={{ fontWeight: 700 }}>Date</div>
                <div className="text-right text-[#7C6A9D]">{estimate.dateCreated}</div>
                <div className="text-right" style={{ fontWeight: 700 }}>Total</div>
                <div className="text-right text-[#7C6A9D]">${fmt(total)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-14 text-[12px] leading-[18px] mb-6">
            <div>
              <div className="mb-1" style={{ fontWeight: 700 }}>Prepared For:</div>
              <div>{estimate.clientName}</div>
              <div className="whitespace-pre-line">{estimate.clientAddress}</div>
              <div>{estimate.clientPhone}</div>
              <div style={{ color: "var(--brand-primary, #4A6FA5)" }}>{estimate.clientEmail}</div>
            </div>
            <div>
              <div className="mb-1" style={{ fontWeight: 700 }}>Service Location:</div>
              <div className="whitespace-pre-line">{estimate.serviceAddress}</div>
            </div>
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-y-[3px] border-[#4F5660]">
                <th className="text-left py-3 px-2" style={{ fontWeight: 700 }}>Description</th>
                <th className="text-left py-3 px-2 w-[84px]" style={{ fontWeight: 700 }}>QTY</th>
                <th className="text-left py-3 px-2 w-[102px]" style={{ fontWeight: 700 }}>Price</th>
                <th className="text-left py-3 px-2 w-[102px]" style={{ fontWeight: 700 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map(item => (
                <tr key={item.id} className="border-b border-[#E0E3E7]">
                  <td className="py-3 px-2"><div style={{ fontWeight: 700 }}>{item.name}</div>{item.description && <div>{item.description}</div>}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">{item.quantity}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">${fmt(item.price)}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">${fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-[#E0E3E7] mb-16">
            <div className="grid grid-cols-[90px_110px] text-[12px]">
              <div className="py-2 px-2" style={{ fontWeight: 700 }}>Subtotal</div><div className="py-2 px-2 text-right text-[#6F6A93]">${fmt(subtotal)}</div>
              {taxAmount > 0 && <><div className="py-1 px-2" style={{ fontWeight: 700 }}>Tax</div><div className="py-1 px-2 text-right text-[#6F6A93]">${fmt(taxAmount)}</div></>}
              <div className="py-2 px-2" style={{ fontWeight: 700 }}>Total</div><div className="py-2 px-2 text-right text-[#6F6A93]">${fmt(total)}</div>
            </div>
          </div>
          {estimate.notes && <div className="text-[12px]"><div style={{ fontWeight: 700 }}>Notes:</div><div>{estimate.notes}</div></div>}
          {/* Page-1 disclaimer is a US legal requirement ("form of delivery"):
              without an explicit pointer to the T&C pages the client can claim
              they never saw them. Final wording to be reviewed by the attorney. */}
          <div className="mt-4 text-[11px] text-[#6B7280]" style={{ fontWeight: 600 }}>See terms and conditions on the next page.</div>
          <div className="mt-12 text-center text-[23px] text-[#111827]" style={{ fontWeight: 800 }}>Thank you for your business</div>
        </div>
        {/* Page 2 — Terms & Conditions travel with the estimate as the following
            page(s) of the PDF. Placeholder copy; the attorney finalizes the text. */}
        <div className="bg-white text-[#5F6670] shadow-2xl border border-[#D7DCE3] mt-6" style={{ width: 760, minHeight: 980, padding: "32px 28px 44px", fontFamily: "Arial, sans-serif", pageBreakBefore: "always" }}>
          <div className="text-[18px] text-[#4F5660] mb-6" style={{ fontWeight: 800 }}>Terms &amp; Conditions</div>
          <div className="text-[12px] leading-[19px] space-y-4">
            <div>
              <div style={{ fontWeight: 700 }}>1. Acceptance of estimate</div>
              <div>This estimate is an offer to perform the work described on page 1 for the stated price. Approving or signing this estimate constitutes acceptance of these terms and conditions in full.</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>2. Pricing and validity</div>
              <div>Pricing is valid until the expiration date shown on page 1. Work or materials not listed in the line items are not included and will be estimated separately.</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>3. Deposits and payment</div>
              <div>Where a deposit is required, work is scheduled after the deposit is received. The remaining balance is due upon completion unless otherwise agreed in writing.</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>4. Changes and cancellations</div>
              <div>Changes to the scope of work must be agreed in writing and may affect the price and schedule. Cancellations after materials have been ordered may incur restocking charges.</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>5. Warranty</div>
              <div>Labor is warranted for the period stated in the service agreement. Manufacturer warranties apply to supplied equipment and materials.</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>6. Liability</div>
              <div>The company is not responsible for pre-existing conditions, concealed defects, or damage not caused by its work.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Jobs tab (Figma: Details · Jobs · Deposit · Activity) ──────────────────────
  const renderJobsTab = () => {
    const jobs = estimate.jobId
      ? [{ id: estimate.jobId, label: estimate.job || `Job #${estimate.jobId}`, address: estimate.serviceAddress.replace("\n", ", "), scheduled: "—", status: "Scheduled", total }]
      : [];
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs ({jobs.length})</h3>
          <button
            onClick={() => { if (!isConverted(estimate.status)) navigate(`/jobs/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}&returnTo=${encodeURIComponent(`/estimates/${estimate.id}`)}`); }}
            className="h-8 px-3 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors" style={{ fontWeight: 600 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>add</span> Add job
          </button>
        </div>
        {jobs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>work_outline</span>
            </div>
            <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No jobs linked yet</div>
            <div className="text-[12px] text-[#8899AA] mt-1">Convert this estimate to a job to get started</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                {["Job", "Address", "Scheduled", "Status", "Total"].map(h => (
                  <th key={h} className={`px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "Total" ? "text-right" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="border-b border-[#F1F3F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer" onClick={() => navigate(`/jobs/${j.id}`)}>
                  <td className="px-5 py-3 text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{j.label}</td>
                  <td className="px-5 py-3 text-[13px] text-[#546478]">{j.address}</td>
                  <td className="px-5 py-3 text-[13px] text-[#546478]">{j.scheduled}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] bg-[#DBEAFE] text-[#1E40AF]" style={{ fontWeight: 600 }}>{j.status}</span></td>
                  <td className="px-5 py-3 text-right text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(j.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // ── Details tab ──────────────────────────────────────────────────────────────
  const renderDetailsTab = () => (
    <div className="grid grid-cols-[240px_minmax(0,1fr)_300px] gap-4 items-stretch min-h-[440px]">

      {/* ── Col 1: Items ── */}
      <div className="h-full flex flex-col gap-0 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Items</h3>
          <button
            onClick={() => setAddItemOpen(true)}
            className="h-8 px-3 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
            Add Item
          </button>
        </div>

        {estimate.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="w-10 h-10 mb-4 bg-[#F5F7FA] rounded-full flex items-center justify-center">
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>archive</span>
            </div>
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>No items yet</div>
            <div className="mt-1 max-w-[200px] text-[12px] text-[#8899AA]">Add items to break down the work and materials for this estimate</div>
            <button onClick={() => setAddItemOpen(true)} className="mt-4 h-8 px-3 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
              Add item
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    {["Item", "Unit Price", "QTY", "Amount", "Taxable", ""].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[44px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item) => (
                    <tr key={item.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-[#F0F4FA] flex items-center justify-center shrink-0">
                            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>build</span>
                          </div>
                          <div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                            {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]">{item.quantity}</td>
                      <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.amount)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]">{item.taxable ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
                          <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="border-t border-[#E5E7EB] px-5 py-4 bg-[#FAFBFC]">
              <div className="flex justify-end">
                <div className="space-y-1.5 min-w-[260px]">
                  {[
                    { label: "Subtotal:", value: fmt(subtotal) },
                    { label: "Taxable:", value: fmt(taxableAmount) },
                    { label: `Tax (${estimate.taxRate}%):`, value: fmt(taxAmount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">{label}</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span>
                    <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Deposit Required toggle (quick view) */}
            <div className="border-t border-[#E5E7EB] px-5 py-3 flex items-center gap-3 bg-white">
              <button
                type="button"
                onClick={() => { setEstimate(prev => ({ ...prev, depositRequired: !prev.depositRequired })); setActiveTab("deposit"); }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${estimate.depositRequired ? "bg-[#22C55E]" : "bg-[#D1D5DB]"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${estimate.depositRequired ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-[13px] text-[#546478]">
                Deposit Required
                {estimate.depositRequired && <span className="ml-2 text-[#22C55E]" style={{ fontWeight: 500 }}>— ${fmt(depositAmount)}</span>}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Col 2: Documents ── */}
      <div className="h-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-2.5 shrink-0">
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
            Documents <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>({documents.length})</span>
          </span>
          <button
            type="button"
            onClick={() => docsUploadRef.current?.()}
            aria-label="Upload documents"
            title="Upload documents"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#4A6FA5] hover:bg-[#EDF0F5] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: 20 }}>upload</span>
          </button>
        </div>

        {/* Reuses the Clients-style gallery the rest of the app uses */}
        <div className="flex-1 overflow-y-auto min-h-[420px]">
          <DocumentsGallery
            documents={documents}
            onChange={setDocuments}
            hideToolbarUpload
            uploadTriggerRef={docsUploadRef}
          />
        </div>
      </div>


      {/* ── Col 3: Notes ── */}
      <div className="h-full flex flex-col bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-4 py-2.5">
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-[#F3F4F6] p-0.5">
              {[
                { key: "client" as const, label: "Note to client", count: clientCount },
                { key: "internal" as const, label: "Internal", count: internalCount },
              ].map(t => {
                const active = noteTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => { setNoteTab(t.key); setShowAllNotes(false); }}
                    className={`h-7 px-2.5 rounded-md text-[12px] whitespace-nowrap transition-colors ${active ? "bg-white text-[#4A6FA5] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
                    style={{ fontWeight: 600 }}
                  >
                    {t.label} ({t.count})
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { setAddingNote(true); setNewNoteText(""); }}
              aria-label="Add note"
              title="Add note"
              className="ml-auto w-7 h-7 flex items-center justify-center rounded text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#4A6FA5] transition-colors"
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add_circle_outline</span>
            </button>
          </div>
          {activeNotes.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-center text-[12px] text-[#9CA3AF]">
              No {noteTab === "client" ? "client" : "internal"} notes yet
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-[#F3F4F6]">
                {visibleNotes.map((note) => (
                  <div key={note.id} className="px-4 py-3 group flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-[#8899AA] mb-1">Added {note.date}</div>
                      <p className="text-[13px] text-[#1A2332] leading-[20px]" style={{ fontWeight: 500 }}>{note.text}</p>
                    </div>
                    {note.id >= 0 && (
                      <button
                        onClick={() => deleteNote(note.id)}
                        aria-label="Delete note"
                        title="Delete"
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                      >
                        <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {activeNotes.length > 4 && (
                <button onClick={() => setShowAllNotes(v => !v)} className="w-full py-3 text-center text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                  {showAllNotes ? "Show less" : `Show ${activeNotes.length - 4} more`}
                </button>
              )}
            </div>
          )}
        </div>

      <DocumentPreview
        file={previewFile}
        onClose={() => setPreviewFileId(null)}
        onRename={(id, newName) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d))}
        onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
      />

      {/* ── Add-note modal (same as ClientDetail) ───────────────────────────── */}
      {addingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setAddingNote(false); setNewNoteText(""); }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>
                Add {noteTab === "client" ? "note to client" : "internal note"}
              </h2>
              <button onClick={() => { setAddingNote(false); setNewNoteText(""); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4">
              <Label className="text-[14px] text-[#1A2332] mb-1 block" style={{ fontWeight: 500 }}>Note</Label>
              <Textarea
                autoFocus
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={noteTab === "client" ? "Add a note for the client…" : "Internal note — e.g. 'Dog on right side'…"}
                className="border-[#E5E7EB] bg-white text-[14px] min-h-[96px]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => { setAddingNote(false); setNewNoteText(""); }} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button
                disabled={!newNoteText.trim()}
                onClick={addNote}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
              >Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Deposit tab ───────────────────────────────────────────────────────────────
  const renderDepositTab = () => (
    <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposit Settings</h3>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-[#546478]">Deposit Required</span>
              <button type="button"
                onClick={() => setEstimate(prev => ({ ...prev, depositRequired: !prev.depositRequired }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${estimate.depositRequired ? "bg-[#22C55E]" : "bg-[#D1D5DB]"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${estimate.depositRequired ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          {estimate.depositRequired ? (
            <>
              <p className="text-[13px] text-[#546478] mb-5">A deposit is required to secure your project and schedule the work.</p>
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Type</label>
                <select value={estimate.depositType}
                  onChange={(e) => setEstimate(prev => ({ ...prev, depositType: e.target.value as "amount" | "percentage" }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white">
                  <option value="percentage">Percentage of Total</option>
                  <option value="amount">Fixed Dollar Amount</option>
                </select>
              </div>
              {estimate.depositType === "percentage" ? (
                <div className="grid grid-cols-2 gap-4 mb-1">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Percentage</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01" value={estimate.depositValue}
                        onChange={(e) => setEstimate(prev => ({ ...prev, depositValue: Number(e.target.value) || 0 }))}
                        className="w-full pl-4 pr-8 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">$</span>
                      <input type="text" readOnly value={fmt(depositAmount)}
                        className="w-full pl-7 pr-4 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-[#F9FAFB] cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-1">
                  <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Amount</label>
                  <div className="relative w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">$</span>
                    <input type="number" min="0" step="0.01" value={estimate.depositValue}
                      onChange={(e) => setEstimate(prev => ({ ...prev, depositValue: Number(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-4 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>
              )}
              {estimate.depositType === "percentage" && total > 0 && (
                <div className="text-[12px] text-[#9CA3AF] mb-5">{estimate.depositValue}% of Total (${fmt(total)})</div>
              )}
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Due Upon</label>
                <select className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white">
                  <option>Approval</option>
                  <option>Scheduling</option>
                  <option>Start of Work</option>
                </select>
              </div>
              <div className="mb-5 rounded-md border border-[#E5E7EB] bg-[#FAFBFC] p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Invoice Status After Deposit</label>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Partially Paid</div>
                  </div>
                  <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] text-[#D97706]" style={{ fontWeight: 700 }}>MVP</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {["Unpaid", "Overdue", "Paid", "Partially Paid", "Void"].map(status => (
                    <div
                      key={status}
                      className={`flex min-h-8 items-center justify-center rounded-md border px-2 text-center text-[11px] leading-4 ${
                        status === "Partially Paid"
                          ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
                          : "border-[#E5E7EB] bg-white text-[#546478]"
                      }`}
                      style={{ fontWeight: status === "Partially Paid" ? 700 : 600 }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 flex gap-3">
                <span className="material-icons text-[#3B82F6] mt-0.5 shrink-0" style={{ fontSize: "18px" }}>info</span>
                <div>
                  <div className="text-[13px] text-[#1E40AF] mb-1" style={{ fontWeight: 600 }}>How it works</div>
                  <div className="text-[12px] text-[#1E40AF] leading-relaxed">
                    When this estimate is approved, the deposit is recorded against the invoice and the invoice status becomes Partially Paid.
                    The remaining balance stays open until it is paid in full.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#9CA3AF] mt-3">Enable "Deposit Required" to request a deposit before work begins.</p>
          )}
        </div>
      </div>

      <div className="w-[280px] shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposit Summary</h3>
          </div>
          {estimate.depositRequired ? (
            <>
              <div className="mx-4 mt-4 mb-4 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
                <div className="text-[12px] text-[#15803D] mb-0.5" style={{ fontWeight: 600 }}>Deposit Due Now</div>
                <div className="text-[12px] text-[#15803D] mb-1">({estimate.depositType === "percentage" ? `${estimate.depositValue}%` : "Fixed"} of Total)</div>
                <div className="text-[22px] text-[#15803D]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(depositAmount)}</div>
              </div>
              <div className="px-5 pb-4 space-y-2 border-b border-[#E5E7EB]">
                {[
                  { label: "Subtotal", value: `$${fmt(subtotal)}` },
                  { label: "Taxable", value: `$${fmt(taxableAmount)}` },
                  { label: `Tax (${estimate.taxRate}%)`, value: `$${fmt(taxAmount)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[13px]">
                    <span className="text-[#546478]">{label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
                  <span className="text-[15px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                </div>
              </div>
              <div className="px-5 py-4 border-b border-[#E5E7EB]">
                <button className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-md text-[14px] transition-colors" style={{ fontWeight: 600 }}>
                  Record Deposit
                </button>
                <div className="text-center text-[11px] text-[#9CA3AF] mt-2">This deposit will be applied to your total balance.</div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { icon: "task_alt", color: "#22C55E", title: "Secure Your Project", desc: "Your project is scheduled once the deposit is received." },
                  { icon: "account_balance_wallet", color: "#3B82F6", title: "Applied to Balance", desc: "Your deposit will be applied to your total balance." },
                  { icon: "receipt_long", color: "#D97706", title: "Invoice Status", desc: "Recording a deposit marks the invoice Partially Paid." },
                  { icon: "tune", color: "#A855F7", title: "Flexible Terms", desc: "Final payment due upon completion unless otherwise agreed." },
                ].map(({ icon, color, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <span className="material-icons mt-0.5 shrink-0" style={{ fontSize: "16px", color }}>{icon}</span>
                    <div>
                      <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</div>
                      <div className="text-[11px] text-[#9CA3AF] leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="px-5 py-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "24px" }}>account_balance_wallet</span>
              </div>
              <div className="text-[13px] text-[#9CA3AF]">Enable deposit to see summary</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Activity tab ──────────────────────────────────────────────────────────────
  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Activity</h3>
        {estimate.status === "Approved" && (
          <button
            onClick={() => { navigate(`/invoices/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}&returnTo=${encodeURIComponent(`/estimates/${estimate.id}?tab=activity`)}`); }}
            className="h-8 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[13px] inline-flex items-center gap-1.5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "15px" }}>receipt</span>
            Create Invoice
          </button>
        )}
      </div>
      <div className="divide-y divide-[#F3F4F6]">
        {estimate.activity.map(entry => (
          <div key={entry.id} className="flex items-start gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-[#EEF3FA] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>{entry.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{entry.action}</div>
              <div className="text-[12px] text-[#8899AA]">{entry.detail}</div>
            </div>
            <div className="text-[12px] text-[#9CA3AF] whitespace-nowrap">{entry.date}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <button onClick={() => navigate("/estimates")} aria-label="Back to Estimates"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#546478] hover:bg-[#EDF0F5] transition-colors">
          <span className="material-icons" style={{ fontSize: "20px" }}>arrow_back</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332] leading-[32px]" style={{ fontWeight: 600 }}>Estimate details</h1>
      </div>

      {/* White card */}
      <div className="mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
            {/* Left: name + contact info */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontWeight: 600 }}>
                  {estimate.estimateName || "Estimate"}
                </h2>
                <span className="text-[16px] text-[#6B7280] leading-[24px]" style={{ fontWeight: 400 }}>
                  ({estimate.estimateNumber})
                </span>
                <div ref={statusRef} className="relative">
                  <button onClick={() => setStatusOpen(!statusOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] hover:opacity-80 transition-opacity"
                    style={{ fontWeight: 600, color: statusColors[estimate.status], backgroundColor: statusBg[estimate.status] }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[estimate.status] }} />
                    {estimate.status}
                    <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                  </button>
                  {statusOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] w-[200px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
                      {primaryStatuses.map(s => (
                        <button key={s} onClick={() => { changeStatus(s); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === estimate.status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                          style={{ fontWeight: s === estimate.status ? 600 : 400, color: s === estimate.status ? "#4A6FA5" : "#1A2332" }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s] }} />
                          {s}
                          {s === estimate.status && <span className="material-icons ml-auto" style={{ fontSize: "16px", color: "#4A6FA5" }}>check</span>}
                        </button>
                      ))}
                      <div className="mx-3 my-1 border-t border-[#F3F4F6]" />
                      <div className="px-3.5 pb-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Other</span>
                      </div>
                      {otherStatuses.map(s => (
                        <button key={s} onClick={() => { changeStatus(s); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === estimate.status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                          style={{ fontWeight: s === estimate.status ? 600 : 400, color: s === estimate.status ? "#4A6FA5" : "#1A2332" }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s] }} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Client + phone + email + address + job inline row */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button onClick={() => navigate("/clients/1")} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>person</span>
                  {estimate.clientName}
                </button>
                {estimate.clientPhone && (
                  <a href={`tel:${estimate.clientPhone}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors ml-0.5" title={estimate.clientPhone}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                  </a>
                )}
                {estimate.clientEmail && (
                  <a href={`mailto:${estimate.clientEmail}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors" title={estimate.clientEmail}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>mail</span>
                  </a>
                )}
                <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                <span className="flex items-center gap-1 text-[14px] text-[#374151]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>location_on</span>
                  {estimate.serviceAddress.replace("\n", ", ")}
                </span>
                {estimate.job && (
                  <>
                    <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                    <button onClick={() => estimate.jobId && navigate(`/jobs/${estimate.jobId}`)} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                      <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
                      {estimate.job}
                    </button>
                  </>
                )}
              </div>
              {/* Metadata strip — all estimate metadata + edit pencil at the end */}
              <div className="flex items-center gap-0.5 flex-wrap pt-2 mt-1 border-t border-[#F3F4F6]">
                <div className="flex items-center gap-1.5 pr-3 text-[13px]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "14px" }}>calendar_today</span>
                  <span className="text-[#6B7280]">Created:</span>
                  <span className="text-[#374151]">{estimate.dateCreated}</span>
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "14px" }}>schedule</span>
                  <span className="text-[#6B7280]">Expires:</span>
                  <span className="text-[#374151]">{estimate.expirationDate || "—"}</span>
                  <button aria-label="Edit expiry" title="Edit expiry" className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#4A6FA5]">
                    <span className="material-icons" style={{ fontSize: "13px" }}>edit</span>
                  </button>
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "14px" }}>add_circle_outline</span>
                  <span className="text-[#6B7280]">Created by:</span>
                  <span className="text-[#374151]">{estimate.teamMember}</span>
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "14px" }}>send</span>
                  <span className="text-[#6B7280]">Sent:</span>
                  <span className="text-[#374151]">{estimate.sentDate && estimate.sentDate !== "Not Sent" ? estimate.sentDate : "Not sent"}</span>
                </div>
              </div>
            </div>

            {/* Right: KPI strip — Client-style (borderless, dark value, tinted icon) */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="text-[18px] leading-none tabular-nums text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 600 }}>${fmt(total)}</div>
                  <div className="text-[14px] leading-[20px] text-[#6B7280] mt-1 whitespace-nowrap">Total (USD)</div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#4A6FA526" }}>
                  <span className="material-icons" style={{ fontSize: "20px", color: "#4A6FA5" }}>monetization_on</span>
                </div>
              </div>
            </div>
        </div>

        {/* Divider separating the estimate header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        <DetailTabs
          tabs={TABS.map(t => ({
            ...t,
            count: t.key === "jobs"
              ? (estimate.jobId ? 1 : 0)
              : t.key === "deposit"
              ? (estimate.depositRequired ? 1 : undefined)
              : t.key === "activity"
              ? estimate.activity.length
              : undefined,
          }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton />}
          trailing={
            <>
            <button onClick={() => setCustomerPreviewOpen(true)}
              className="h-9 px-3.5 rounded-md border border-[#E5E7EB] bg-white text-[#1A2332] text-[13px] inline-flex items-center gap-1.5 hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>visibility</span>
              Preview
            </button>
            <button onClick={() => changeStatus("Sent")}
              className="h-9 px-3.5 rounded-md border border-[#E5E7EB] bg-white text-[#1A2332] text-[13px] inline-flex items-center gap-1.5 hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>send</span>
              Send
            </button>
            <div className="relative">
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="h-9 px-3.5 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
                Create
                <span className="material-icons" style={{ fontSize: "16px" }}>expand_more</span>
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+4px)] w-[200px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
                  <button
                    onClick={() => {
                      if (isConverted(estimate.status)) return;
                      setCreateMenuOpen(false);
                      navigate(`/jobs/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}&returnTo=${encodeURIComponent(`/estimates/${estimate.id}`)}`);
                    }}
                    disabled={isConverted(estimate.status)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-[#F5F7FA] transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500, color: "#1A2332" }}
                    title={isConverted(estimate.status) ? "Already converted to a job" : ""}
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>work</span>
                    {isConverted(estimate.status) ? "Converted to Job" : "Create Job"}
                  </button>
                  <button
                    onClick={() => { setCreateMenuOpen(false); navigate(`/invoices/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}&returnTo=${encodeURIComponent(`/estimates/${estimate.id}`)}`); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-[#F5F7FA] transition-colors text-left"
                    style={{ fontWeight: 500, color: "#1A2332" }}
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>receipt</span>
                    Create Invoice
                  </button>
                </div>
              )}
            </div>
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md bg-white flex items-center justify-center hover:bg-[#F5F7FA]">
              <KebabItem icon="visibility" onClick={() => setCustomerPreviewOpen(true)}>Preview estimate</KebabItem>
              <KebabItem icon="send">Send to Client</KebabItem>
              <KebabItem icon="link">Get Link</KebabItem>
              <KebabItem icon="print" onClick={() => setCustomerPreviewOpen(true)}>Print</KebabItem>
              <KebabSeparator />
              <KebabItem icon="content_copy">Duplicate</KebabItem>
              <KebabSeparator />
              <KebabItem icon="archive" destructive>Archive</KebabItem>
            </KebabMenu>
            </>
          }
          className="mt-5"
        />

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "jobs" && renderJobsTab()}
          {activeTab === "deposit" && renderDepositTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>
      </div>

      {customerPreviewOpen && renderCustomerPreview()}

      {/* Add Item Modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddItemOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Add Item</h2>
              <button onClick={() => setAddItemOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
              {catalogItems.map(item => (
                <button key={item.id}
                  onClick={() => {
                    const newItem: LineItem = { id: Math.max(...estimate.items.map(i => i.id), 0) + 1, name: item.name, description: "", quantity: 1, price: item.price, cost: item.cost, amount: item.price, taxable: true };
                    setEstimate(prev => ({ ...prev, items: [...prev.items, newItem] }));
                    setAddItemOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] text-left">
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
