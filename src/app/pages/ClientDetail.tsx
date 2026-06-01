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
import { KebabMenu as KebabMenuShared, KebabItem } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { toast } from "sonner";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { clientsStore } from "../stores/clientsStore";
import { estimatesStore } from "../stores/estimatesStore";
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

/* ── WorkTable: reusable draggable-column table for jobs/estimates/invoices ── */
interface WorkItem {
  id: number; type: string; title: string; subtitle: string;
  date: string; amount: string;
}

const WORK_COLS = [
  { key: "item",   label: "Item"   },
  { key: "date",   label: "Date"   },
  { key: "amount", label: "Amount" },
] as const;

function WorkTable({ items, emptyIcon, emptyLabel }: {
  items: WorkItem[]; emptyIcon: string; emptyLabel: string;
}) {
  const [cols, moveCols] = useDraggableColumns([...WORK_COLS]);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "36px" }}>{emptyIcon}</span>
        <p className="text-[13px] text-[#9CA3AF]">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            {cols.map(col => (
              <DraggableTh
                key={col.key}
                colKey={col.key}
                onMove={moveCols}
                className={`pb-3 text-[12px] text-[#6B7280] ${col.key === "amount" ? "text-right" : "text-left"}`}
                style={{ fontWeight: 500 }}
              >
                {col.label}
              </DraggableTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
              {cols.map(col => {
                switch (col.key) {
                  case "item": return (
                    <td key="item" className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>
                          {item.type === "estimate" ? "request_quote" : item.type === "invoice" ? "receipt" : "work"}
                        </span>
                        <div>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.title}</div>
                          <div className="text-[12px] text-[#6B7280]">{item.subtitle}</div>
                        </div>
                      </div>
                    </td>
                  );
                  case "date": return (
                    <td key="date" className="py-4">
                      <div className="text-[13px] text-[#6B7280]">{item.date}</div>
                    </td>
                  );
                  case "amount": return (
                    <td key="amount" className="py-4 text-right">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.amount || "—"}</div>
                    </td>
                  );
                  default: return null;
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </DndProvider>
  );
}

/* ── InvoiceTable ── */
interface InvoiceRow {
  id: number; invoiceNo: string; jobNo: string; type: string;
  date: string;
  total: string; balance: string; dueDate: string;
}
const INVOICE_COLS = [
  { key: "invoiceNo", label: "Invoice #" },
  { key: "jobNo",     label: "Job #"     },
  { key: "type",      label: "Type"      },
  { key: "date",      label: "Date"      },
  { key: "total",     label: "Total"     },
  { key: "balance",   label: "Balance"   },
  { key: "dueDate",   label: "Due Date"  },
] as const;
const invoiceRows: InvoiceRow[] = [
  { id: 1, invoiceNo: "INV-2026-0041", jobNo: "J-1048", type: "Service",      date: "Mar 15, 2026", total: "$1,240.00", balance: "$1,240.00", dueDate: "Apr 14, 2026" },
  { id: 2, invoiceNo: "INV-2026-0035", jobNo: "J-1039", type: "Service",      date: "Feb 20, 2026", total: "$890.00",   balance: "$0.00",     dueDate: "Mar 22, 2026" },
  { id: 3, invoiceNo: "INV-2025-0198", jobNo: "J-0997", type: "Maintenance",  date: "Nov 4, 2025",  total: "$430.00",   balance: "$0.00",     dueDate: "Dec 4, 2025"  },
  { id: 4, invoiceNo: "INV-2025-0177", jobNo: "J-0981", type: "Installation", date: "Sep 8, 2025",  total: "$3,750.00", balance: "$0.00",     dueDate: "Oct 8, 2025"  },
  { id: 5, invoiceNo: "INV-2026-0048", jobNo: "J-1054", type: "Service",      date: "Apr 28, 2026", total: "$560.00",   balance: "$560.00",   dueDate: "May 28, 2026" },
];
function InvoiceTable({ rows }: { rows: InvoiceRow[] }) {
  const [cols, moveCols] = useDraggableColumns([...INVOICE_COLS]);
  return (
    <DndProvider backend={HTML5Backend}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            {cols.map(col => (
              <DraggableTh key={col.key} colKey={col.key} onMove={moveCols}
                className={`pb-3 text-[12px] text-[#6B7280] whitespace-nowrap ${["total","balance"].includes(col.key) ? "text-right" : "text-left"}`}
                style={{ fontWeight: 500 }}
              >{col.label}</DraggableTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer">
              {cols.map(col => {
                switch (col.key) {
                  case "invoiceNo": return <td key="invoiceNo" className="py-3.5 pr-4"><span className="text-[13px] text-[#4A6FA5] font-medium hover:underline">{row.invoiceNo}</span></td>;
                  case "jobNo":     return <td key="jobNo"     className="py-3.5 pr-4"><span className="text-[13px] text-[#4A6FA5] hover:underline">{row.jobNo}</span></td>;
                  case "type":      return <td key="type"      className="py-3.5 pr-4"><span className="text-[13px] text-[#374151]">{row.type}</span></td>;
                  case "date":      return <td key="date"      className="py-3.5 pr-4"><span className="text-[13px] text-[#6B7280]">{row.date}</span></td>;
                  case "total":     return <td key="total"     className="py-3.5 pr-4 text-right"><span className="text-[13px] text-[#1A2332] font-medium">{row.total}</span></td>;
                  case "balance":   return <td key="balance"   className="py-3.5 pr-4 text-right"><span className={`text-[13px] font-medium ${row.balance === "$0.00" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{row.balance}</span></td>;
                  case "dueDate":   return <td key="dueDate"   className="py-3.5"><span className="text-[13px] text-[#6B7280]">{row.dueDate}</span></td>;
                  default: return null;
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </DndProvider>
  );
}

/* ── PaymentTable ── */
interface PaymentRow {
  id: number; date: string; invoiceNo: string;
  amount: string; method: string; note: string;
}
const PAYMENT_COLS = [
  { key: "date",      label: "Date"      },
  { key: "invoiceNo", label: "Invoice #" },
  { key: "amount",    label: "Amount"    },
  { key: "method",    label: "Method"    },
  { key: "note",      label: "Note"      },
] as const;
const paymentRows: PaymentRow[] = [
  { id: 1, date: "Mar 22, 2026", invoiceNo: "INV-2026-0035", amount: "$890.00",   method: "ACH",         note: "" },
  { id: 2, date: "Dec 3, 2025",  invoiceNo: "INV-2025-0198", amount: "$430.00",   method: "Credit Card", note: "" },
  { id: 3, date: "Oct 7, 2025",  invoiceNo: "INV-2025-0177", amount: "$2,000.00", method: "Check",       note: "Partial - check #4421" },
  { id: 4, date: "Oct 20, 2025", invoiceNo: "INV-2025-0177", amount: "$1,750.00", method: "ACH",         note: "Final balance" },
];
function PaymentTable({ rows }: { rows: PaymentRow[] }) {
  const [cols, moveCols] = useDraggableColumns([...PAYMENT_COLS]);
  return (
    <DndProvider backend={HTML5Backend}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            {cols.map(col => (
              <DraggableTh key={col.key} colKey={col.key} onMove={moveCols}
                className={`pb-3 text-[12px] text-[#6B7280] whitespace-nowrap ${col.key === "amount" ? "text-right" : "text-left"}`}
                style={{ fontWeight: 500 }}
              >{col.label}</DraggableTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer">
              {cols.map(col => {
                switch (col.key) {
                  case "date":      return <td key="date"      className="py-3.5 pr-4"><span className="text-[13px] text-[#6B7280]">{row.date}</span></td>;
                  case "invoiceNo": return <td key="invoiceNo" className="py-3.5 pr-4"><span className="text-[13px] text-[#4A6FA5] hover:underline cursor-pointer">{row.invoiceNo}</span></td>;
                  case "amount":    return <td key="amount"    className="py-3.5 pr-4 text-right"><span className="text-[13px] text-[#1A2332] font-medium">{row.amount}</span></td>;
                  case "method":    return <td key="method"    className="py-3.5 pr-4"><span className="text-[13px] text-[#374151]">{row.method}</span></td>;
                  case "note":      return <td key="note"      className="py-3.5"><span className="text-[13px] text-[#6B7280] italic">{row.note || "—"}</span></td>;
                  default: return null;
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </DndProvider>
  );
}

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
  const [clientStatus, setClientStatus] = useState<"Prospect" | "Active" | "Inactive">("Active");
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
  const hasDocActivity = (c?: { totalJobs?: number; totalBilled?: number; totalRevenue?: number }) =>
    !!c && ((c.totalJobs ?? 0) > 0 || (c.totalBilled ?? 0) > 0 || (c.totalRevenue ?? 0) > 0);
  const [documents, setDocuments] = useState<DocFile[]>(() =>
    hasDocActivity(clientsStore.getClient(routeId)) ? SEED_DOCUMENTS : [],
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
  // Status chip reflects the real client status (was hardcoded "Active").
  useEffect(() => { setClientStatus(client.status); }, [client]);
  // Reset the (sample) documents per client so navigating to a fresh client
  // doesn't carry over the previous client's media. New clients → empty.
  useEffect(() => { setDocuments(hasDocActivity(client) ? SEED_DOCUMENTS : []); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [client.id]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedClient(client);
    if (activeTab !== "details") setActiveTab("details");
  };

  const handleSaveClick = () => {
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
  // Jobs list sized to the client's real job counts so the Jobs tab badge
  // (= totalJobs) and the header "Open jobs" KPI (= openJobs) are consistent
  // and both trace to the client record — no more orphan "1".
  const jobItems = Array.from({ length: client.totalJobs }, (_, i) => ({
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
    .filter((e) => e.clientName === client.name)
    .map((e) => ({
      id: e.id,
      type: "estimate",
      title: `Estimate ${e.estimateNumber}`,
      subtitle: e.estimateName || e.jobTitle || "—",
      date: e.createdDate ? `Created ${e.createdDate}` : "",
      amount: `$${e.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      _estimateId: e.id,
    }));
  const estimateItems = liveClientEstimates.length > 0
    ? liveClientEstimates
    : hasEstimates
      ? [{ id: 3, type: "estimate", title: "Estimate #1", subtitle: "AC Unit Replacement", date: "Created Mar 28, 2026", amount: "$2,450.00" }]
      : [];
  const clientInvoiceRows = hasBilling ? invoiceRows : [];
  const clientPaymentRows = hasBilling ? paymentRows : [];

  // Visible tabs with LIVE counts derived from the actual data arrays (no hardcoded literals).
  const visibleTabs = tabs
    .filter((t) => !hiddenTabs.has(t.key))
    .map((t) => {
      if (t.key === "addresses") return { ...t, count: serviceAddresses.length };
      if (t.key === "jobs") return { ...t, count: jobItems.length };
      if (t.key === "estimates") return { ...t, count: estimateItems.length };
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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {[
          { label: "Estimate",          icon: "description", path: "/estimates/new" },
          { label: "Job",               icon: "work",        path: "/jobs/new" },
          { label: "Invoice",           icon: "receipt",     path: "/invoices/new" },
          { label: "Payment",           icon: "credit_card", path: "/payments/new" },
        ].map(({ label, icon, path }) => (
          <DropdownMenuItem
            key={label}
            className="flex items-center gap-3 py-2.5"
            onClick={() => path ? navigate(path) : undefined}
          >
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>{icon}</span>
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
    <KebabMenuShared triggerClassName="w-9 h-9 border border-[#E5E7EB] rounded-md bg-white" contentClassName="min-w-[220px]">
      <KebabItem icon="print" onClick={() => toast.info("Print functionality coming soon")}>Print</KebabItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }}>
          <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>receipt_long</span>
          <span className="flex-1 leading-none">Statement Actions</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[200px]">
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("Email Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>email</span>
            <span className="flex-1 leading-none">Email Statement</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("Print Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>print</span>
            <span className="flex-1 leading-none">Print Statement</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("View Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>visibility</span>
            <span className="flex-1 leading-none">View Statement</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <KebabItem icon="payments" onClick={() => navigate(`/payments/new?client=${encodeURIComponent(client.name)}&clientId=${encodeURIComponent(client.customerId)}&amount=${client.openBalance}`)}>Collect Payment</KebabItem>
    </KebabMenuShared>
  );


  /* ──────────────────────────────────────────
     DETAILS READ-ONLY
  ────────────────────────────────────────── */
  const DetailsView = () => (
    <div className="grid grid-cols-3 gap-4 items-stretch">

      {/* Card 1: Contact Information */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>person</span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Contact Information</span>
          <button
            onClick={() => { setEditedClient(client); setEditingSection("contact"); }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
            aria-label="Edit contact"
          >
            <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
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

      {/* Card 2: Addresses */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>location_on</span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Addresses</span>
          <button
            onClick={() => { setEditAddressId(null); setAddressForm({ street: client.address, unit: client.unit, city: client.city, state: client.state, zip: client.zip, county: client.county, country: client.country || "United States", notes: client.gateCode }); setEditAddressOpen(true); }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
            aria-label="Edit address"
          >
            <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Billing Address */}
          <div>
            <div className="text-[12px] font-semibold text-[#1A2332] mb-1">Billing Address</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingAddress}</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.billingCity}, {client.billingState} {client.billingZip}</div>
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
          {/* Service Address */}
          <div>
            <div className="text-[12px] font-semibold text-[#1A2332] mb-1">Service Address</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.address}</div>
            <div className="text-[13px] text-[#1A2332] font-medium leading-[20px]">{client.city}, {client.state} {client.zip}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Address notes</div>
              <button
                onClick={() => { setNotesDraft(client.gateCode || ""); setEditNotesOpen(true); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors text-[#9CA3AF]"
                aria-label="Edit address notes"
              >
                <span className="material-icons" style={{ fontSize: "15px" }}>edit</span>
              </button>
            </div>
            <div className="text-[13px] text-[#1A2332]">
              {client.gateCode ? `Gate code: ${client.gateCode}` : <span className="text-[#9CA3AF]">—</span>}
            </div>
          </div>

          {/* Custom Fields section — lives in the Addresses card */}
          <div className="pt-3 border-t border-[#E5E7EB]">
            <div className="text-[13px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Custom Fields</div>
            {(() => {
              const configured = cfClientFields.slice(0, 2).filter(f => f.label.trim() !== "");
              if (configured.length === 0) {
                return (
                  <div className="flex items-center gap-1 text-[12px] text-[#6B7280]">
                    <span>Configure in</span>
                    <button
                      onClick={() => navigate("/settings?section=customFields")}
                      className="text-[12px] text-[#4A6FA5] hover:underline"
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

          {/* Billing & payment — lives at the bottom of the Addresses card */}
          <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
            {/* Taxable */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clientData.isTaxable}
                onChange={(e) => handleCheckboxChange("isTaxable", e.target.checked)}
                className="w-4 h-4 accent-[#4A6FA5]"
              />
              <span className="text-[13px] text-[#1A2332]">Taxable Customer</span>
            </label>

            {/* Payment terms */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#6B7280]">Payment terms</span>
              <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                {clientData.paymentTerms || "—"}
              </span>
            </div>

            {/* Preferred payment method */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#6B7280]">Preferred payment</span>
              <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                {clientData.paymentMethod || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Notes */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>notes</span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">
            Notes
            {clientData.notesArray.length > 0 && (
              <span className="ml-1 text-[#9CA3AF]" style={{ fontWeight: 400 }}>({clientData.notesArray.length})</span>
            )}
          </span>
          <button
            onClick={() => { setAddingNote(true); setNewNoteText(""); }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
            aria-label="Add note"
          >
            <PlusIcon className="h-4 w-4 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="px-5 pt-2 pb-1">
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
                  /* ── Read mode ── */
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] text-[#1A2332] leading-[20px] flex-1 ${!isExpanded && isLong ? "line-clamp-2" : ""}`}
                        style={{ fontWeight: 500 }}>
                        {note.text}
                      </p>
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
                    <div className="text-[11px] text-[#9CA3AF] mt-1">{note.date}</div>
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
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Customer number</Label>
            <Input placeholder="e.g. 10245" value={editedClient.customerId} onChange={(e) => handleFieldChange("customerId", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
          </div>
          {/* Name row */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Name</Label>
            <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
              <Select value={editedClient.title || "none"} onValueChange={(v) => handleFieldChange("title", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Title</SelectItem>
                  {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="First name" value={editedClient.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
              <Input placeholder="M.I." value={editedClient.middleInitial} onChange={(e) => handleFieldChange("middleInitial", e.target.value.slice(0,1).toUpperCase())} className="border-[#E5E7EB] bg-white h-10 text-[14px]" maxLength={1} />
              <Input placeholder="Last name" value={editedClient.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
            </div>
          </div>
          {/* Preferred name */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Preferred name (Goes by)</Label>
            <Input placeholder="e.g. Mia, Bobby, TJ" value={editedClient.preferredName} onChange={(e) => handleFieldChange("preferredName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
          </div>
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
              <Input placeholder="Company name" value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
            </div>
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
              <Input placeholder="e.g. Owner, Manager" value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Select tags</Label>
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
            <span className="text-[14px] text-[#374151]">Taxable customer</span>
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
              {["Cash", "Check", "Credit Card", "Debit Card", "Bank Transfer", "Other"].map((m) => (
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
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Primary phone number</Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 123-4567" value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Secondary phone */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone number</Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 456-7890" value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Email */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
            <Input type="email" placeholder="john@example.com" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
          </div>
          {/* Website */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
            <Input type="url" placeholder="https://example.com" value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment terms</Label>
              <Select value={editedClient.paymentTerms || "none"} onValueChange={(v) => handleFieldChange("paymentTerms", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment method</Label>
              <Select value={editedClient.paymentMethod || "none"} onValueChange={(v) => handleFieldChange("paymentMethod", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Credit limit</Label>
            <Input type="number" placeholder="0" value={editedClient.creditLimit} onChange={(e) => handleFieldChange("creditLimit", parseFloat(e.target.value) || 0)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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
    <div className="flex items-center gap-2 mb-5">
      <h3 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h3>
      {typeof count === "number" && (
        <span className="text-[13px] text-[#9CA3AF]" style={{ fontWeight: 400 }}>({count})</span>
      )}
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title={addLabel}
        className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
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
        return (
          <>
            <TabHeader title="Jobs" onAdd={() => navigate(createUrl("/jobs/new", "jobs"))} addLabel="Create job" />
            <WorkTable items={jobItems} emptyIcon="work" emptyLabel="No jobs yet for this client." />
          </>
        );

      case "estimates":
        return (
          <>
            <TabHeader title="Estimates" count={estimateItems.length} onAdd={() => navigate(createUrl("/estimates/new", "estimates"))} addLabel="Create estimate" />
            <WorkTable items={estimateItems} emptyIcon="request_quote" emptyLabel="No estimates yet for this client." />
          </>
        );

      case "invoices":
        return (
          <>
            <TabHeader title="Invoices" count={clientInvoiceRows.length} onAdd={() => navigate(createUrl("/invoices/new", "invoices"))} addLabel="Create invoice" />
            {clientInvoiceRows.length === 0 ? (
              <EmptyState icon="receipt_long" message="No invoices yet for this client." />
            ) : (
              <div className="overflow-x-auto">
                <InvoiceTable rows={clientInvoiceRows} />
              </div>
            )}
          </>
        );

      case "payments":
        return (
          <>
            <TabHeader title="Payments" count={clientPaymentRows.length} onAdd={() => navigate(createUrl("/payments/new", "payments", { amount: String(client.openBalance) }))} addLabel="Collect payment" />
            {clientPaymentRows.length === 0 ? (
              <EmptyState icon="payments" message="No payments yet for this client." />
            ) : (
              <div className="overflow-x-auto">
                <PaymentTable rows={clientPaymentRows} />
              </div>
            )}
          </>
        );

      case "addresses": {
        const openCreateAddress = () => { setEditAddressId("__new__"); setAddressForm({ street: "", unit: "", city: client.city, state: client.state, zip: "", county: client.county, country: client.country || "United States", notes: "" }); setEditAddressOpen(true); };
        return (
          <div>
            {/* Header — title + "+" icon (consistent with the Jobs tab) */}
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service address</h3>
              <span className="text-[14px] text-[#9CA3AF]" style={{ fontWeight: 400 }}>({serviceAddresses.length})</span>
              <button
                type="button"
                onClick={openCreateAddress}
                aria-label="Create address"
                title="Create address"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
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
            onClick={() => navigate("/clients")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
            aria-label="Back to Clients"
            title="Back to Clients"
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Clients</span>
          </button>
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
              {/* Status chip — functional (changes client status) */}
              <div className="relative">
                <button
                  onClick={() => setClientStatusOpen(!clientStatusOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] transition-colors"
                  style={{ fontWeight: 600, backgroundColor: `${clientStatusColors[clientStatus]}18`, color: clientStatusColors[clientStatus] }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: clientStatusColors[clientStatus] }} />
                  {clientStatus}
                  <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                </button>
                {clientStatusOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[160px] py-1">
                    {(["Prospect", "Active", "Inactive"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { clientsStore.updateClient(client.id, { status: s }); setClientStatusOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F4F6] flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clientStatusColors[s] }} />
                        <span style={{ color: clientStatusColors[s], fontWeight: 500 }}>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats — borderless, copy left / tinted icon right, 1px dividers (Figma) */}
            <div className="flex items-center gap-4 shrink-0">
              {[
                { label: "Total revenue", value: `$${Math.round(client.totalRevenue).toLocaleString("en-US")}`, icon: "trending_up", iconColor: "#16A34A" },
                { label: "Balance",       value: `$${client.openBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,    icon: "paid",     iconColor: "#4A6FA5" },
                { label: "Past due",      value: `$${client.pastDueBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "schedule", iconColor: "#DC2626" },
                { label: "Open jobs",     value: String(client.openJobs), icon: "work", iconColor: "#6B7280" },
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
                {editingSection === "finance" && "Edit finance details"}
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
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Name</Label>
                    <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
                      <Select value={editedClient.title || "none"} onValueChange={(v) => handleFieldChange("title", v === "none" ? "" : v)}>
                        <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Title" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Title</SelectItem>
                          {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="First name" value={editedClient.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                      <Input placeholder="M.I." value={editedClient.middleInitial} onChange={(e) => handleFieldChange("middleInitial", e.target.value.slice(0, 1).toUpperCase())} className="border-[#E5E7EB] bg-white h-10 text-[14px]" maxLength={1} />
                      <Input placeholder="Last name" value={editedClient.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Preferred name</Label>
                    <Input placeholder="e.g. Mike" value={editedClient.preferredName} onChange={(e) => handleFieldChange("preferredName", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
                    <Input placeholder="e.g. Property Owner" value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                </>
              )}

              {editingSection === "contact" && (
                <>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Primary phone number</Label>
                    <div className="grid grid-cols-[1fr_88px] gap-2">
                      <Input value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                      <Input placeholder="EXT" value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone number</Label>
                    <div className="grid grid-cols-[1fr_88px] gap-2">
                      <Input value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                      <Input placeholder="EXT" value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
                      <Input type="email" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
                      <Input value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
                      <Input value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
                      <Input value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "addresses" && (
                <>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Service address</Label>
                    <Input placeholder="Street address" value={editedClient.address} onChange={(e) => handleFieldChange("address", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px] mb-2" />
                    <Input placeholder="Unit / Suite" value={editedClient.unit} onChange={(e) => handleFieldChange("unit", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input value={editedClient.city} onChange={(e) => handleFieldChange("city", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>State</Label>
                      <Input value={editedClient.state} onChange={(e) => handleFieldChange("state", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>ZIP</Label>
                      <Input value={editedClient.zip} onChange={(e) => handleFieldChange("zip", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Address notes</Label>
                    <Input placeholder="Gate code, access instructions…" value={editedClient.gateCode} onChange={(e) => handleFieldChange("gateCode", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                </>
              )}

              {editingSection === "finance" && (
                <>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment terms</Label>
                    <Select value={editedClient.paymentTerms || "none"} onValueChange={(v) => handleFieldChange("paymentTerms", v === "none" ? "" : v)}>
                      <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select terms" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select —</SelectItem>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Net 90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Credit limit</Label>
                    <Input type="number" placeholder="0" value={editedClient.creditLimit} onChange={(e) => handleFieldChange("creditLimit", parseFloat(e.target.value) || 0)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment method</Label>
                    <Select value={editedClient.paymentMethod || "none"} onValueChange={(v) => handleFieldChange("paymentMethod", v === "none" ? "" : v)}>
                      <SelectTrigger className="border-[#E5E7EB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select —</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="ACH">ACH</SelectItem>
                        <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Department</Label>
                    <Input value={editedClient.department} onChange={(e) => handleFieldChange("department", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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
          <div className="relative bg-white rounded-xl shadow-2xl w-[460px] max-w-[92vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Edit tabs</h2>
              <button onClick={() => setShowTabSettings(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4 grid grid-cols-2 grid-rows-4 grid-flow-col gap-x-6 gap-y-3">
              {tabs.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!pendingHidden.has(key)}
                    onChange={() => setPendingHidden((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                    className="w-4 h-4 accent-[#4A6FA5]"
                  />
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4 mt-2">
              <Button variant="outline" onClick={() => setShowTabSettings(false)} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button onClick={() => { setHiddenTabs(new Set(pendingHidden)); setShowTabSettings(false); }} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg">Save</Button>
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
                onClick={() => {
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
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg"
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
    </div>
  );
}
