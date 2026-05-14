import { useState, useSyncExternalStore, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import { useNavigate, useParams } from "react-router";
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
import { toast } from "sonner";
import { tagsStore } from "../stores/tagsStore";
import { customFieldsStore } from "../stores/customFieldsStore";

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
function InvoiceTable() {
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
          {invoiceRows.map(row => (
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
function PaymentTable() {
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
          {paymentRows.map(row => (
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

const TAB_ITEM = "CLIENT_TAB";
interface DraggableTabProps {
  tabKey: TabKey; label: string; count?: number;
  isActive: boolean; onMove: (from: TabKey, to: TabKey) => void;
  onClick: () => void;
}
function DraggableTab({ tabKey, label, count, isActive, onMove, onClick }: DraggableTabProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: TAB_ITEM,
    item: { key: tabKey },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  const [{ isOver }, drop] = useDrop({
    accept: TAB_ITEM,
    drop: (dragged: { key: TabKey }) => { if (dragged.key !== tabKey) onMove(dragged.key, tabKey); },
    collect: (m) => ({ isOver: m.isOver() }),
  });
  drag(drop(ref));
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap select-none ${
        isDragging ? "opacity-40" : ""
      } ${isOver ? "border-l-2 border-[#4A6FA5]" : ""} ${
        isActive ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
      }`}
      style={{ fontWeight: 500, cursor: "grab" }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-0.5" style={{ fontWeight: 400 }}>({count})</span>
      )}
      {isActive && <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />}
    </button>
  );
}

export function ClientDetail() {
  const navigate = useNavigate();
  useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [hiddenTabs, setHiddenTabs] = useState<Set<TabKey>>(new Set());
  const [showTabSettings, setShowTabSettings] = useState(false);
  const tabSettingsRef = useRef<HTMLDivElement>(null);

  const moveTab = useCallback((from: TabKey, to: TabKey) => {
    setTabs(prev => {
      const arr = [...prev];
      const fi = arr.findIndex(t => t.key === from);
      const ti = arr.findIndex(t => t.key === to);
      const [item] = arr.splice(fi, 1);
      arr.splice(ti, 0, item);
      return arr;
    });
  }, []);

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

  const visibleTabs = tabs.filter(t => !hiddenTabs.has(t.key));
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<null | "name" | "contact" | "finance">(null);
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
  const [serviceAddresses, setServiceAddresses] = useState<ServiceAddress[]>([
    { id: "1", street: "2105 West Hills Avenue", unit: "Suite 201", city: "Tampa",       state: "FL", zip: "33606", county: "Hillsborough", notes: "Gate code: 2486",         isPrimary: true  },
    { id: "2", street: "4820 Cypress Creek Blvd", unit: "",          city: "Tampa",       state: "FL", zip: "33613", county: "Hillsborough", notes: "Side entrance only",      isPrimary: false },
    { id: "3", street: "910 Harbour Island Blvd", unit: "Apt 305",   city: "Tampa",       state: "FL", zip: "33602", county: "Hillsborough", notes: "",                        isPrimary: false },
  ]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ street: "", unit: "", city: "", state: "", zip: "", county: "", notes: "" });

  interface DocFile { id: string; name: string; size: string; date: string; icon: string; iconColor: string; isImage?: boolean; previewUrl?: string; previewGradient?: string; }
  const [documents, setDocuments] = useState<DocFile[]>([
    { id: "1", name: "Service Agreement - 2026.pdf", size: "245 KB",  date: "Mar 28, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
    { id: "2", name: "HVAC System Photo.jpg",        size: "1.2 MB",  date: "Mar 15, 2026", icon: "image",          iconColor: "#F59E0B", isImage: true, previewGradient: "linear-gradient(135deg,#fde68a 0%,#f59e0b 50%,#d97706 100%)" },
    { id: "3", name: "Property Blueprint.pdf",       size: "3.8 MB",  date: "Feb 10, 2026", icon: "picture_as_pdf", iconColor: "#DC2626" },
    { id: "4", name: "Before Service.jpg",           size: "980 KB",  date: "Jan 20, 2026", icon: "image",          iconColor: "#F59E0B", isImage: true, previewGradient: "linear-gradient(135deg,#bfdbfe 0%,#60a5fa 50%,#3b82f6 100%)" },
    { id: "5", name: "After Service.jpg",            size: "1.1 MB",  date: "Jan 20, 2026", icon: "image",          iconColor: "#F59E0B", isImage: true, previewGradient: "linear-gradient(135deg,#d1fae5 0%,#34d399 50%,#059669 100%)" },
    { id: "6", name: "Equipment Photo.jpg",          size: "870 KB",  date: "Mar 10, 2026", icon: "image",          iconColor: "#F59E0B", isImage: true, previewGradient: "linear-gradient(135deg,#e9d5ff 0%,#a78bfa 50%,#7c3aed 100%)" },
  ]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  const client = {
    name: "Mike Delgado",
    customerId: "C-10245",
    title: "Mr.",
    firstName: "Mike",
    middleInitial: "J",
    lastName: "Delgado",
    preferredName: "Michael",
    company: "Delgado Property Solutions",
    role: "Property Owner",
    customerType: "homeowner" as const,
    customerSince: "Apr 12, 2022",
    lastService: "Jun-25",
    isBillingSameAsService: true,
    isTaxable: true,
    paymentTerms: "Net 30",
    paymentMethod: "ACH",
    creditLimit: 10000,
    department: "Sarasota Branch",
    salesRep: "Travis Jones",
    accManager: "Anne Blue",
    type: "Residential",
    customField1: "",
    customField2: "",
    mobilePhone: "813-286-7572",
    mobilePhoneExt: "457",
    workPhone: "(833) 555-9999",
    workPhoneExt: "456",
    website: "https://smithplumbing.com",
    email: "mjdelgado84@yahoo.com",
    address: "2105 West Hills Avenue",
    unit: "Suite 201",
    city: "Tampa",
    state: "FL",
    zip: "33606",
    country: "United States",
    county: "Hillsborough",
    billingAddress: "2105 West Hills Avenue",
    billingUnit: "Suite 201",
    billingCity: "Tampa",
    billingState: "FL",
    billingZip: "33606",
    billingCounty: "Hillsborough",
    marketingSource: "Google",
    notes: "Prefers morning appointments. Has three properties requiring service.",
    gateCode: "2486",
    notesArray: [
      { id: 1, text: "Prefers morning appointments.", date: "Added Mar 10, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Added Jan 15, 2024" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Added Dec 5, 2023" },
      { id: 4, text: "Prefers email communication over phone.", date: "Added Oct 20, 2023" },
      { id: 5, text: "Has two dogs, please close gates.", date: "Added Jul 15, 2021" },
    ],
    additionalContacts: [
      { id: "1", firstName: "Sandra", lastName: "Delgado", phone: "(813) 555-0011", email: "sandra@delgadoprop.com", relationship: "Spouse" },
    ],
    tags: ["New Homeowner", "Self-Generated Lead", "VIP Customer"],
    membership: "Silver",
    membershipExpiry: "Dec-27",
    totalRevenue: 45230.0,
    estimatesTotal: 12300.0,
    openBalance: 2450.0,
    pastDueBalance: 850.0,
    balance: 1214.0,
  };

  const [editedClient, setEditedClient] = useState(client);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedClient(client);
    if (activeTab !== "details") setActiveTab("details");
  };

  const handleSaveClick = () => {
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
  const jobItems = [
    { id: 2, type: "job", title: "Job #1", subtitle: "AC Estimate", date: "Scheduled for Mar 30, 2026", amount: "$0.00" },
  ];
  const estimateItems = [
    { id: 3, type: "estimate", title: "Estimate #1", subtitle: "AC Unit Replacement", date: "Created Mar 28, 2026", amount: "$2,450.00" },
  ];

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
          { label: "Appointment",       icon: "event",       path: "/appointments/new" },
          { label: "Estimate",          icon: "description", path: "/estimates/new" },
          { label: "Job",               icon: "work",        path: "/jobs/new" },
          { label: "Invoice",           icon: "receipt",     path: "/invoices/new" },
          { label: "Payment",           icon: "credit_card", path: "/payments/new" },
          { label: "Message",           icon: "message",     path: null },
          { label: "Property",          icon: "home",        path: "/properties/new" },
          { label: "Service Agreement", icon: "assignment",  path: "/service-agreements/new" },
          { label: "Contact",           icon: "person_add",  path: "/clients/new" },
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
      <KebabItem icon="tab_unselected" onClick={() => setShowTabSettings(true)}>Edit Tabs</KebabItem>
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
      <KebabItem icon="payments" onClick={() => { setActiveTab("payments"); setHiddenTabs(prev => { const next = new Set(prev); next.delete("payments"); return next; }); }}>Collect Payment</KebabItem>
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
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Primary Phone</div>
            <div className="text-[13px] text-[#1A2332] font-medium">{client.mobilePhone}</div>
          </div>
          {client.workPhone && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Secondary Phone</div>
              <div className="text-[13px] text-[#1A2332] font-medium">{client.workPhone}{client.workPhoneExt ? ` ext. ${client.workPhoneExt}` : ""}</div>
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Email</div>
            <div className="text-[13px] text-[#1A2332] font-medium">{client.email}</div>
          </div>
          {client.website && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Website</div>
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#4A6FA5] hover:underline font-medium">{client.website}</a>
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Company Name</div>
            <div className="text-[13px] text-[#1A2332] font-medium">{client.company}</div>
          </div>
          {client.role && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Role</div>
              <div className="text-[13px] text-[#1A2332] font-medium">{client.role}</div>
            </div>
          )}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-0.5">Customer Since</div>
              <div className="text-[13px] text-[#1A2332] font-medium">{client.customerSince}</div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clientData.isTaxable}
                onChange={(e) => handleCheckboxChange("isTaxable", e.target.checked)}
                className="w-4 h-4 accent-[#4A6FA5]"
              />
              <span className="text-[13px] text-[#4B5563]">Taxable Customer</span>
            </label>
          </div>
          {client.additionalContacts && client.additionalContacts.length > 0 && (
            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-2">Additional Contacts</div>
              <div className="space-y-3">
                {client.additionalContacts.map((c) => (
                  <div key={c.id} className="space-y-0.5">
                    <div className="text-[13px] text-[#1A2332] font-medium">{c.firstName} {c.lastName}
                      {c.relationship && <span className="text-[12px] text-[#6B7280] font-normal ml-1.5">· {c.relationship}</span>}
                    </div>
                    {c.phone && <div className="text-[12px] text-[#546478]">{c.phone}</div>}
                    {c.email && <div className="text-[12px] text-[#546478]">{c.email}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Addresses */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E7EB]">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>location_on</span>
          <span className="flex-1 text-[13px] font-semibold text-[#1A2332]">Addresses</span>
          <button
            onClick={() => { setEditedClient(client); setEditingSection("contact"); }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md transition-colors"
            aria-label="Edit addresses"
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
            <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-1">Address Notes</div>
            <textarea
              defaultValue={client.gateCode ? `Gate code: ${client.gateCode}` : ""}
              placeholder="Gate code, access notes…"
              rows={2}
              className="w-full text-[12px] text-[#374151] border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-[#F9FAFB] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="border-t border-[#E5E7EB] pt-4">
            {(() => {
              const configured = cfClientFields.slice(0, 2).filter(f => f.label.trim() !== "");
              if (configured.length === 0) {
                return (
                  <p className="text-[12px] text-[#9CA3AF]">
                    No custom fields configured.{" "}
                    <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=general")}>
                      Configure in Settings
                    </span>
                  </p>
                );
              }
              return (
                <div className="space-y-3">
                  {configured.map((field, idx) => {
                    const cfValue = (clientData as Record<string, string>)[`cf_${idx}`] ?? "";
                    const setCf = (val: string) => setClientData(prev => ({ ...prev, [`cf_${idx}`]: val }));
                    return (
                      <div key={idx}>
                        <div className="text-[11px] uppercase tracking-wider text-[#546478] font-semibold mb-1">{field.label}</div>
                        {field.type === "text" && (
                          <input value={cfValue} onChange={e => setCf(e.target.value)} placeholder={field.label}
                            className="w-full h-8 px-3 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]" />
                        )}
                        {field.type === "number" && (
                          <input type="number" value={cfValue} onChange={e => setCf(e.target.value)} placeholder="0"
                            className="w-full h-8 px-3 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]" />
                        )}
                        {field.type === "date" && (
                          <input type="date" value={cfValue} onChange={e => setCf(e.target.value)}
                            className="w-full h-8 px-3 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]" />
                        )}
                        {field.type === "checkbox" && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={cfValue === "true"} onChange={e => setCf(e.target.checked ? "true" : "")}
                              className="w-4 h-4 accent-[#4A6FA5]" />
                            <span className="text-[13px] text-[#4B5563]">{field.label}</span>
                          </label>
                        )}
                        {field.type === "dropdown" && (
                          <Select value={cfValue || "none"} onValueChange={v => setCf(v === "none" ? "" : v)}>
                            <SelectTrigger className="border-[#E5E7EB] bg-white h-8 text-[13px] rounded-lg" style={{ fontWeight: 400 }}>
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Select —</SelectItem>
                              {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
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

        {/* Add note form */}
        {addingNote && (
          <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <textarea
              autoFocus
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              className="w-full text-[13px] text-[#1A2332] border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] bg-white placeholder:text-[#9CA3AF]"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const trimmed = newNoteText.trim();
                  if (!trimmed) return;
                  const today = new Date();
                  const dateStr = `Added ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                  const newId = Math.max(0, ...clientData.notesArray.map(n => n.id)) + 1;
                  setClientData(prev => ({ ...prev, notesArray: [{ id: newId, text: trimmed, date: dateStr }, ...prev.notesArray] }));
                  setAddingNote(false);
                  setNewNoteText("");
                }}
                disabled={!newNoteText.trim()}
                className="h-7 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-40 text-white text-[12px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >
                Save
              </button>
              <button
                onClick={() => { setAddingNote(false); setNewNoteText(""); }}
                className="h-7 px-3 text-[#546478] hover:bg-[#EDF0F5] text-[12px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                          setClientData(prev => ({ ...prev, notesArray: prev.notesArray.map(n => n.id === note.id ? { ...n, text: trimmed } : n) }));
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
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                        <button
                          onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#EDF0F5] rounded transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setClientData(prev => ({ ...prev, notesArray: prev.notesArray.filter(n => n.id !== note.id) }));
                            setExpandedNoteIds(prev => { const s = new Set(prev); s.delete(note.id); return s; });
                          }}
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
            <Input placeholder="e.g. C-10245" value={editedClient.customerId} onChange={(e) => handleFieldChange("customerId", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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

      {/* 4. Taxable */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editedClient.isTaxable}
              onChange={(e) => handleFieldChange("isTaxable", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[14px] text-[#374151]">Taxable</span>
          </label>
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

  const handleCheckboxChange = (field: string, value: boolean) => {
    setClientData((prev) => ({ ...prev, [field]: value }));
    toast.success("Setting updated");
  };

  /* ──────────────────────────────────────────
     TAB CONTENT ROUTER
  ────────────────────────────────────────── */
  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return isEditing ? <EditForm /> : <DetailsView />;

      case "appointments":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
            <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
            <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
          </div>
        );

      case "jobs":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/jobs/new")}>
                <PlusIcon className="h-5 w-5 text-[#546478]" />
              </Button>
            </div>
            <div className="p-6">
              <WorkTable items={jobItems} emptyIcon="work" emptyLabel="No jobs yet for this client." />
            </div>
          </div>
        );

      case "estimates":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimates</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/estimates/new")}>
                <PlusIcon className="h-5 w-5 text-[#546478]" />
              </Button>
            </div>
            <div className="p-6">
              <WorkTable items={estimateItems} emptyIcon="request_quote" emptyLabel="No estimates yet for this client." />
            </div>
          </div>
        );

      case "invoices":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices</h3>
                <span className="text-[12px] text-[#6B7280]">{invoiceRows.length} invoices</span>
              </div>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/invoices/new")}>
                <PlusIcon className="h-5 w-5 text-[#546478]" />
              </Button>
            </div>
            <div className="px-6 py-5 overflow-x-auto">
              <InvoiceTable />
            </div>
          </div>
        );

      case "payments":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Payments</h3>
                <span className="text-[12px] text-[#6B7280]">{paymentRows.length} payments</span>
              </div>
              <Button className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white" onClick={() => toast.info("Collect payment coming soon")}>
                <PlusIcon className="h-4 w-4" />
                Collect payment
              </Button>
            </div>
            <div className="px-6 py-5 overflow-x-auto">
              <PaymentTable />
            </div>
          </div>
        );

      case "addresses":
        return (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service Address</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-[13px] text-[#4A6FA5] hover:bg-[#EEF2F8]"
                  onClick={() => { setShowAddAddress(true); setNewAddr({ street: "", unit: "", city: "", state: "", zip: "", county: "", notes: "" }); }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add address
                </Button>
              </div>
            </div>

            {/* Address cards */}
            <div className="space-y-3">
              {serviceAddresses.map((addr) => (
                <div key={addr.id} className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors group">
                  <span className="material-icons text-[#4A6FA5] mt-0.5 shrink-0" style={{ fontSize: "20px" }}>location_on</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                        {addr.street}{addr.unit ? `, ${addr.unit}` : ""}
                      </div>
                      {addr.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#D1FAE5] text-[#16A34A] text-[11px]" style={{ fontWeight: 500 }}>Primary</span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#6B7280]">{addr.city}, {addr.state} {addr.zip}</div>
                    {addr.county && <div className="text-[12px] text-[#9CA3AF] mt-0.5">{addr.county} County</div>}
                    {addr.notes && <div className="text-[12px] text-[#6B7280] mt-1 italic">{addr.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!addr.isPrimary && (
                      <button
                        className="text-[11px] text-[#4A6FA5] hover:underline px-2 py-1 rounded hover:bg-[#EEF2F8]"
                        style={{ fontWeight: 500 }}
                        onClick={() => setServiceAddresses(prev => prev.map(a => ({ ...a, isPrimary: a.id === addr.id })))}
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                      onClick={() => setServiceAddresses(prev => prev.filter(a => a.id !== addr.id))}
                    >
                      <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add address form */}
            {showAddAddress && (
              <div className="bg-white border border-[#4A6FA5] rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>New Service Address</h4>
                  <button onClick={() => setShowAddAddress(false)} className="text-[#9CA3AF] hover:text-[#374151]">
                    <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                  </button>
                </div>
                <div className="flex gap-3">
                  <Input placeholder="Street address" value={newAddr.street} onChange={(e) => setNewAddr(p => ({ ...p, street: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px] flex-1" />
                  <Input placeholder="Unit" value={newAddr.unit} onChange={(e) => setNewAddr(p => ({ ...p, unit: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px] w-[100px]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr(p => ({ ...p, city: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  <Input placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr(p => ({ ...p, state: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  <Input placeholder="ZIP" value={newAddr.zip} onChange={(e) => setNewAddr(p => ({ ...p, zip: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                </div>
                <Input placeholder="County" value={newAddr.county} onChange={(e) => setNewAddr(p => ({ ...p, county: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                <Input placeholder="Notes (gate code, access instructions…)" value={newAddr.notes} onChange={(e) => setNewAddr(p => ({ ...p, notes: e.target.value }))} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#546478]" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white"
                    onClick={() => {
                      if (!newAddr.street.trim()) return;
                      setServiceAddresses(prev => [...prev, {
                        id: Math.random().toString(36).slice(2),
                        ...newAddr,
                        isPrimary: prev.length === 0,
                      }]);
                      setShowAddAddress(false);
                    }}
                  >
                    Save Address
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "documents":
        return (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-[260px]">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "15px" }}>search</span>
                <input
                  type="text"
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
              <Button
                size="sm"
                className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white shrink-0"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFilesAdded(e.dataTransfer.files); }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                Upload
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />

            {/* Files grid */}
            {documents.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {documents.map((file) => (
                  <div key={file.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
                    {/* Preview area */}
                    {file.isImage ? (
                      file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="w-full h-[148px] object-cover" />
                      ) : (
                        <div
                          className="w-full h-[148px] flex items-center justify-center"
                          style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
                        >
                          <span className="material-icons text-white/70" style={{ fontSize: "44px" }}>image</span>
                        </div>
                      )
                    ) : (
                      <div
                        className="w-full h-[148px] flex items-center justify-center"
                        style={{ backgroundColor: file.iconColor + "12" }}
                      >
                        <span className="material-icons" style={{ fontSize: "52px", color: file.iconColor, opacity: 0.75 }}>{file.icon}</span>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow text-[#9CA3AF] hover:text-[#DC2626] transition-all"
                      onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== file.id))}
                    >
                      <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
                    </button>

                    {/* File info */}
                    <div className="px-3 py-2.5 border-t border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <span className="material-icons shrink-0" style={{ fontSize: "14px", color: file.iconColor }}>{file.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[12px] text-[#1A2332] truncate" style={{ fontWeight: 600 }}>{file.name}</div>
                          <div className="text-[11px] text-[#9CA3AF] mt-0.5">{file.size} · {file.date}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "notes":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => toast.info("Add note coming soon")}>
                <PlusIcon className="h-5 w-5 text-[#546478]" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {client.notesArray.map((note) => (
                <div key={note.id} className="border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>MS</div>
                    <span className="text-[12px] text-[#6B7280]">Marek Stroz · {note.date}</span>
                  </div>
                  <p className="text-[14px] text-[#374151] leading-[21px]">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "pos":
      case "service-agreements":
      case "equipment":
      case "activity":
      case "marketing":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
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
  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Back arrow + Actions */}
        <div className="px-8 h-12 flex items-center justify-between gap-1.5 border-b border-[#F3F4F6]">
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
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <CreateDropdown />
                <KebabMenu />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelClick}
                  className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-8 px-3 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveClick}
                  className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-8 px-3 text-white text-[13px]"
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>


        {/* Summary content */}
        <div className="px-8 pt-5 pb-[14px]">
          <div className="flex items-start gap-8">
            {/* Left: Name + Address */}
            <div className="shrink-0 flex flex-col gap-3 min-w-[260px]">
                <div className="flex items-center gap-2">
                  <h1 className="text-[22px] text-[#1A2332] leading-[32px]" style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                    {client.name}
                  </h1>
                  <span className="text-[15px] text-[#9CA3AF] leading-[32px]" style={{ fontWeight: 400 }}>
                    ({client.customerId.replace(/^C-/, "")})
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 text-[13px] text-[#374151]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "15px" }}>location_on</span>
                  {client.address}, {client.city}, {client.state} {client.zip}
                </div>

                {/* Phone + Email row */}
                <div className="flex items-center gap-5">
                  <a href={`tel:${client.mobilePhone}`} className="flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:underline">
                    <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                    {client.mobilePhone}
                  </a>
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:underline">
                    <span className="material-icons" style={{ fontSize: "15px" }}>email</span>
                    {client.email}
                  </a>
                </div>

            </div>

            {/* Financial Summary — 4 horizontal stat cards */}
            <div className="flex gap-3 shrink-0 ml-auto">
              {[
                { label: "Total Revenue", value: `$${client.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`, color: "#16A34A" },
                { label: "Balance",       value: `$${client.openBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#1A2332" },
                { label: "Past Due",      value: `$${client.pastDueBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#DC2626" },
                { label: "Open Jobs",     value: "3", color: "#1A2332" },
              ].map(({ label, value, color }) => (
                <div key={label} className="w-[180px] bg-white border border-[#E5E7EB] rounded-xl px-4 py-3">
                  <div className="text-[12px] text-[#546478] mb-1">{label}</div>
                  <div className="text-[22px] tabular-nums" style={{ fontWeight: 700, color, letterSpacing: "-0.01em" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL TABS ── */}
      <div className="bg-white sticky top-0 z-30">
        <DndProvider backend={HTML5Backend}>
          <div className="flex items-center border-b border-[#E5E7EB]">
            {/* Scrollable tabs */}
            <div className="flex items-center px-6 overflow-x-auto scrollbar-hide flex-1">
              {visibleTabs.map(({ key, label, count }) => (
                <DraggableTab
                  key={key}
                  tabKey={key}
                  label={label}
                  count={count}
                  isActive={activeTab === key}
                  onMove={moveTab}
                  onClick={() => { setActiveTab(key); if (isEditing) setIsEditing(false); }}
                />
              ))}
            </div>
          </div>
        </DndProvider>
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
                {editingSection === "name" && "Edit name & role"}
                {editingSection === "contact" && "Edit address & contact"}
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
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Billing Address</Label>
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
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Primary phone</Label>
                      <Input value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Ext.</Label>
                      <Input value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone</Label>
                      <Input value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Ext.</Label>
                      <Input value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
                    <Input type="email" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
                    <Input value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
                    <Input value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#E5E7EB] bg-white h-10 text-[14px]" />
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
              {tabs.map(({ key, label }) => (
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
