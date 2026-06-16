import { useState, useSyncExternalStore } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { itemsStore } from "../stores/itemsStore";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { PlusIcon } from "../components/ui/plus-icon";
import { TYPE_CATEGORY_PAIRS } from "./Items";

// Classification option lists (mirror the Create-item form).
const MANUFACTURERS = ["Carrier", "Trane", "Lennox", "Goodman", "Rheem", "Ferguson", "Square D", "Ecobee"];
const DEPARTMENTS = ["Field Service", "Materials", "Equipment", "Administrative", "Office"];
const VENDORS = ["HVAC Supply Co.", "Ferguson Enterprises", "Johnstone Supply", "Grainger", "HD Supply"];

// ─── Shared type/data (mirrors Items.tsx) ────────────────────────────────────
type ItemType =
  | "Service" | "Labor" | "Maintenance" | "Diagnostics" | "Installation" | "Repair"
  | "Inventory Item" | "Non-Inventory Item" | "Serialized Item"
  | "Equipment" | "Asset"
  | "Fee / Admin Code" | "Discount" | "Other Charge"
  | "Material Markup" | "Labor Markup" | "Other Markup"
  | "Material Discount" | "Labor Discount" | "Other Discount"
  | "Bundle / Kit" | "Expense / Reimbursement";

interface Item {
  id: number; active: boolean; name: string;
  description: string; salesDescription: string; additionalInfo: string;
  brand: string; modelNumber: string; upc: string;
  rate: number; cost: number;
  taxable: boolean; tax1: boolean; tax2: boolean; tax3: boolean;
  onHand: number; minQty: number; maxQty: number; tracking: boolean;
  category: string; type: ItemType;
  vendor: string; vendorCode: string; department: string;
  cogsGL: string; salesGL: string;
  customField1: string; customField2: string;
  notes: string; boldPrint: boolean;
  group: string; defaultQty: number; picture: string;
  inventory: boolean; booking: boolean;
}

const mockItems: Record<string, Item> = {
  "1000": {
    id: 1000, active: true, name: "Heat Pump Repair or Service",
    description: "Standard heat pump repair service call",
    salesDescription: "Heat pump diagnostic, repair and service",
    additionalInfo: "", brand: "Carrier", modelNumber: "HP-2500", upc: "",
    rate: 285, cost: 120, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "HVAC", subcategory: "Repair", type: "Service",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: false,
  },
  "1001": {
    id: 1001, active: true, name: "SEER Heat Pump Condenser Unit",
    description: "SEER 16 heat pump condenser outdoor unit",
    salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit",
    additionalInfo: "SEER 16 rated", brand: "Trane", modelNumber: "XR16-048", upc: "012345678901",
    rate: 3200, cost: 1800, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 12, minQty: 2, maxQty: 50, tracking: true,
    category: "HVAC", subcategory: "Condensers", type: "Inventory Item",
    vendor: "Trane Supply", vendorCode: "TR-XR16048", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  "1002": {
    id: 1002, active: true, name: "SEER Heat Pump Condenser Premium",
    description: "SEER 20 premium heat pump condenser",
    salesDescription: "SEER Premium Heat Pump Condenser — ultra high efficiency",
    additionalInfo: "SEER 20 rated, Energy Star certified", brand: "Lennox", modelNumber: "XP25-048", upc: "098765432109",
    rate: 4800, cost: 2900, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 5, minQty: 1, maxQty: 20, tracking: true,
    category: "HVAC", subcategory: "Condensers", type: "Inventory Item",
    vendor: "Lennox Pro", vendorCode: "LX-XP25048", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  "1003": {
    id: 1003, active: true, name: "Copper Piping Installation",
    description: "Install copper piping per linear foot",
    salesDescription: "Professional copper piping installation (per ft)",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 18.50, cost: 6.75, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Plumbing", subcategory: "Installation", type: "Installation",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: true,
  },
  "1004": {
    id: 1004, active: true, name: "Electrical Panel Upgrade 200A",
    description: "Upgrade existing panel to 200 amp service",
    salesDescription: "200A electrical panel upgrade — parts and labor",
    additionalInfo: "", brand: "Square D", modelNumber: "HOM2040M200PC", upc: "",
    rate: 2800, cost: 1100, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 3, minQty: 1, maxQty: 10, tracking: true,
    category: "Electrical", subcategory: "Panels", type: "Equipment",
    vendor: "Electrical Wholesale", vendorCode: "SQD-HOM2040", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  "1005": {
    id: 1005, active: true, name: "General Labor - Technician",
    description: "Standard technician labor rate per hour",
    salesDescription: "Technician labor (hourly)",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 95, cost: 45, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Labor", subcategory: "Technician", type: "Labor",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "5100 · Labor Cost", salesGL: "4200 · Labor Revenue",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: false,
  },
  "1006": {
    id: 1006, active: true, name: "Drain Cleaning Service",
    description: "Standard drain cleaning and snaking",
    salesDescription: "Professional drain cleaning service",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 175, cost: 40, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Plumbing", subcategory: "Maintenance", type: "Maintenance",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: true,
  },
  "1007": {
    id: 1007, active: true, name: "Thermostat - Smart WiFi",
    description: "Smart thermostat with WiFi connectivity",
    salesDescription: "Smart WiFi Thermostat — professional installation included",
    additionalInfo: "Compatible with most HVAC systems", brand: "Ecobee", modelNumber: "EB-STATE5-01", upc: "841602000000",
    rate: 450, cost: 180, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 18, minQty: 3, maxQty: 40, tracking: true,
    category: "HVAC", subcategory: "Controls", type: "Inventory Item",
    vendor: "Ecobee Direct", vendorCode: "EB-STATE5", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
};

// Map a stored catalog record (created via /items/new) onto the detail display
// shape, so a created item shows its REAL fields instead of the mock fallback.
function catalogToItem(c: any): Item {
  return {
    id: c.id, active: c.active ?? true, name: c.name,
    description: c.itemDescription || "", salesDescription: c.salesDescription || "", additionalInfo: c.additionalInfo || "",
    brand: c.brand || "", modelNumber: c.modelNumber || "", upc: c.upc || "",
    rate: c.rate || 0, cost: c.cost || 0, taxable: !!c.taxable, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: c.category || "", type: (c.itemType || "Service") as ItemType,
    vendor: c.vendor || "", vendorCode: "", department: c.department || "",
    cogsGL: "", salesGL: "",
    customField1: c.customField1 || "", customField2: c.customField2 || "",
    notes: c.notes || "", boldPrint: false, group: "", defaultQty: c.defaultQty ?? 1, picture: "",
    inventory: false, booking: false,
  };
}

function getTypeBadgeClass(type: ItemType): string {
  const serviceTypes = ["Service", "Labor", "Maintenance", "Diagnostics", "Installation", "Repair"];
  const materialTypes = ["Inventory Item", "Non-Inventory Item", "Serialized Item"];
  const equipmentTypes = ["Equipment", "Asset"];
  const feeTypes = ["Fee / Admin Code", "Discount", "Other Charge", "Material Markup", "Labor Markup", "Other Markup", "Material Discount", "Labor Discount", "Other Discount"];
  const bundleTypes = ["Bundle / Kit"];
  if (serviceTypes.includes(type)) return "bg-[#EBF0F8] text-[#4A6FA5]";
  if (materialTypes.includes(type)) return "bg-[#D1FAE5] text-[#16A34A]";
  if (equipmentTypes.includes(type)) return "bg-[#FEF3C7] text-[#D97706]";
  if (feeTypes.includes(type)) return "bg-[#EDE9FE] text-[#7C3AED]";
  if (bundleTypes.includes(type)) return "bg-[#CCFBF1] text-[#0D9488]";
  return "bg-[#FFEDD5] text-[#EA580C]";
}

type TabKey = "details" | "activity";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "activity", label: "Activity" },
];

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === null || value === undefined || value === "" || value === false
    ? <span className="text-[#9CA3AF]">—</span>
    : value === true ? "Yes" : String(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-[#9CA3AF] leading-[16px]">{label}</div>
      <div className="text-[13px] text-[#374151] leading-[20px]">{display}</div>
    </div>
  );
}

// Offline placeholder thumbnail (data-URI SVG) so the gallery shows real images
// without a network round-trip. Solid fill (no gradient/url() ref) so it renders
// reliably once URL-encoded. Hue varies so seeded thumbs look distinct.
function demoThumb(hue: number): string {
  const bg = `hsl(${hue} 42% 58%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='128'><rect width='160' height='128' fill='${bg}'/><circle cx='116' cy='40' r='12' fill='white' fill-opacity='0.6'/><path d='M14 116 L58 70 L86 96 L116 64 L150 98 L150 128 L14 128 Z' fill='white' fill-opacity='0.42'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function Card({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  // A created item lives in itemsStore; demo items 1000-1007 come from mockItems.
  const storeItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const stored = storeItems.find((s) => String(s.id) === String(id));
  const base = stored ? catalogToItem(stored) : (mockItems[id || "1000"] || mockItems["1000"]);
  // Edits from the detail-page modals apply as an overrides layer so the header
  // + cards reflect them without persisting back to the seed.
  const [overrides, setOverrides] = useState<Partial<typeof base>>({});
  const item = { ...base, ...overrides };
  const setItem = (patch: Partial<typeof base>) => setOverrides((o) => ({ ...o, ...patch }));

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const margin = item.rate > 0 ? ((item.rate - item.cost) / item.rate * 100) : 0;

  // Edit modals (Edit item info / Edit pricing & tax / Edit classification / Edit note).
  const [editModal, setEditModal] = useState<null | "info" | "pricing" | "classification">(null);
  const [taxProfile, setTaxProfile] = useState(stored?.taxProfile || "Florida Sales Tax 7%");
  // Image gallery. A created item shows its OWN uploaded images (may be empty);
  // demo items get offline placeholder thumbnails to mirror the 4-up design.
  const [images, setImages] = useState<string[]>(() => {
    if (stored) return stored.images && stored.images.length ? stored.images : [];
    return item.picture ? [item.picture] : [demoThumb(205), demoThumb(150), demoThumb(28), demoThumb(265)];
  });
  // Status is changeable from the header badge (Figma: "Active ▾").
  const [statusOpen, setStatusOpen] = useState(false);
  const [notes, setNotes] = useState<{ id: number; date: string; text: string }[]>(() => {
    // Created items show only the note the user entered (if any); demo items get
    // a seeded timeline so the design's Notes card isn't empty.
    if (stored) return stored.notes ? [{ id: 1, date: "Today", text: stored.notes }] : [];
    const seeded = [
      "Prefers morning appointments.",
      "Has three properties requiring service.",
      "Requested annual maintenance plan.",
    ];
    const list = item.notes ? [item.notes, ...seeded] : seeded;
    return list.map((text, i) => ({ id: i + 1, date: "Mar 10, 2026", text }));
  });
  const [editingNote, setEditingNote] = useState<{ id: number; text: string } | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const saveNote = () => {
    if (!editingNote) return;
    setNotes((prev) => editingNote.id === 0
      ? [{ id: (prev.at(-1)?.id ?? 0) + 1, date: "Today", text: editingNote.text }, ...prev]
      : prev.map((n) => (n.id === editingNote.id ? { ...n, text: editingNote.text } : n)));
    setEditingNote(null);
    toast.success("Note saved");
  };

  const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Image upload — reads each picked file to a data URL and appends to the gallery
  // (no backend needed). Used by the Item info card and the Edit item info modal.
  const handleAddImages = (files: FileList | null) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    list.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, String(reader.result)]);
      reader.readAsDataURL(f);
    });
    toast.success(list.length === 1 ? "Image added" : `${list.length} images added`);
  };
  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const renderDetailsTab = () => {
    const visibleNotes = showAllNotes ? notes : notes.slice(0, 2);
    return (
    // items-stretch → the three columns share the tallest column's height
    <div className="grid grid-cols-3 gap-4 items-stretch">
      {/* ── Col 1: Item info ── */}
      <Card title="Item info" onEdit={() => setEditModal("info")}>
        <div className="flex flex-col gap-4">
          {/* Image gallery — uniform display-only thumbnails (Figma 1500:95027).
              Add/remove images via the Edit pencil → Edit item info modal. */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="h-16 w-[78px] shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]">
                  <img src={src} alt={`${item.name} ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {item.picture && (
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Image URL</div>
              <a href={item.picture} target="_blank" rel="noreferrer" className="truncate text-[13px] text-[#4A6FA5] hover:underline">{item.picture}</a>
            </div>
          )}
          <Field label="Internal description" value={item.description} />
          <Field label="Sales description" value={item.salesDescription} />
          <Field label="Additional information" value={item.additionalInfo} />
        </div>
      </Card>

      {/* ── Col 2: Type & classification & vendor + Pricing & tax ── */}
      <div className="flex flex-col gap-4">
        <Card title="Type & classification & vendor" onEdit={() => setEditModal("classification")}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Type | Category</div>
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${getTypeBadgeClass(item.type)}`} style={{ fontWeight: 600 }}>{item.type}</span>
                <span className="text-[#C8D5E8]">|</span>
                <span className="text-[13px] text-[#1A2332]">{item.category || "—"}</span>
              </div>
            </div>
            <Field label="Manufacturer" value={item.brand} />
            <Field label="Department" value={item.department} />
            <Field label="Vendor" value={item.vendor} />
          </div>
        </Card>

        <Card title="Pricing & tax" onEdit={() => setEditModal("pricing")}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Retail price</div>
              <div className="text-[15px] text-[#1A2332] leading-[22px]" style={{ fontWeight: 600 }}>${money(item.rate)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Cost</div>
              <div className="text-[15px] text-[#374151] leading-[22px]" style={{ fontWeight: 500 }}>${money(item.cost)}</div>
            </div>
            <Field label="Default quantity" value={item.defaultQty} />
            <Field label="Taxable" value={item.taxable ? "Yes" : "No"} />
            <Field label="Tax profile" value={taxProfile} />
          </div>
        </Card>
      </div>

      {/* ── Col 3: Notes + Custom Fields in ONE card (Figma 1500:81570) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
          <button onClick={() => setEditingNote({ id: 0, text: "" })} className="text-[#9CA3AF] hover:text-[#4A6FA5]" aria-label="Add note">
            <span className="material-icons" style={{ fontSize: "18px" }}>add_circle_outline</span>
          </button>
        </div>
        {notes.length === 0 ? (
          <div className="py-4 text-center text-[12px] text-[#9CA3AF]">No notes yet</div>
        ) : (
          <div className="flex flex-col">
            {visibleNotes.map((n) => (
              <div key={n.id} className="group border-b border-[#EDF0F5] py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-[#9CA3AF]">Added {n.date}</div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setEditingNote({ id: n.id, text: n.text })} className="text-[#9CA3AF] hover:text-[#4A6FA5]" aria-label="Edit note"><span className="material-icons" style={{ fontSize: "15px" }}>edit</span></button>
                    <button onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))} className="text-[#9CA3AF] hover:text-[#DC2626]" aria-label="Delete note"><span className="material-icons" style={{ fontSize: "15px" }}>delete_outline</span></button>
                  </div>
                </div>
                <div className="mt-0.5 text-[13px] text-[#1A2332] leading-[20px]">{n.text}</div>
              </div>
            ))}
            {notes.length > 2 && (
              <button onClick={() => setShowAllNotes((v) => !v)} className="mt-3 text-center text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                {showAllNotes ? "Show less" : `Show ${notes.length - 2} more`}
              </button>
            )}
          </div>
        )}

        {/* divider + Custom Fields (same card) */}
        <div className="my-4 border-t border-[#E5E7EB]" />
        <h3 className="mb-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Custom Fields</h3>
        <Field label="Custom Field 1" value={item.customField1 || "Custom Field Value"} />
        <div className="mt-3"><Field label="Custom Field 2" value={item.customField2 || "Custom Field Value"} /></div>
        <div className="mt-3 text-[12px] text-[#9CA3AF]">
          Configure in{" "}
          <button onClick={() => navigate("/settings?section=custom-fields")} className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>Settings &gt; Custom Fields</button>
        </div>
      </div>
    </div>
    );
  };

  const ACTIVITY = [
    { icon: "add_circle_outline", title: "Item created", by: "Marek Stroz", date: "Feb 25, 2026 09:18" },
    { icon: "task_alt", title: "Item added to the job", by: "Marek Stroz", date: "Feb 25, 2026 09:18" },
  ];
  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <h3 className="mb-4 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Activity</h3>
      <div className="flex flex-col">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[#EDF0F5] py-3 last:border-b-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF0F8]">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>{a.icon}</span>
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{a.title}</div>
              <div className="text-[12px] text-[#8899AA]">by {a.by}</div>
            </div>
            <div className="text-[12px] text-[#9CA3AF] shrink-0">{a.date}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── PAGE HEADER: back arrow icon + "Item details" title (Figma 1500:51447) ── */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <button
          onClick={() => navigate("/items")}
          aria-label="Back to Items"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#546478] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "20px" }}>arrow_back</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332] leading-[32px]" style={{ fontWeight: 600 }}>Item details</h1>
      </div>

      {/* ── ONE BIG WHITE CARD CONTAINING EVERYTHING ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">
        {/* Summary content (Figma 1500:51453 row-header + 1500:51465 details) */}
        <div className="flex items-start justify-between gap-4">
            {/* Left: name + changeable status dropdown */}
            <div className="min-w-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontWeight: 600 }}>
                  {item.name}
                </h2>
                {/* Status badge — opens a dropdown to change Active/Inactive */}
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen((v) => !v)}
                    aria-label="Change status"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] transition-colors"
                    style={{ fontWeight: 500, backgroundColor: item.active ? "rgba(22,163,74,0.15)" : "#F3F4F6", color: item.active ? "#16A34A" : "#6B7280" }}
                  >
                    {item.active ? "Active" : "Inactive"}
                    <span className="material-icons" style={{ fontSize: "14px" }}>expand_more</span>
                  </button>
                  {statusOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 min-w-[150px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                        {[{ v: true, l: "Active" }, { v: false, l: "Inactive" }].map((o) => (
                          <button
                            key={o.l}
                            onClick={() => { setItem({ active: o.v }); setStatusOpen(false); toast.success(`Item marked ${o.l}`); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]"
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.v ? "#16A34A" : "#9CA3AF" }} />
                            {o.l}
                            {item.active === o.v && <span className="material-icons ml-auto text-[#4A6FA5]" style={{ fontSize: "16px" }}>check</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Subtitle: Category + Manufacturer with leading icons */}
              <div className="flex items-center gap-3 text-[14px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>grid_view</span>
                  <span className="text-[#6B7280]">Category:</span>
                  <span className="text-[#1A2332]">{item.category || "—"}</span>
                </span>
                <div className="w-px h-6 bg-[#E5E7EB]" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>apartment</span>
                  <span className="text-[#6B7280]">Manufacturer:</span>
                  <span className="text-[#1A2332]">{item.brand || "—"}</span>
                </span>
              </div>
            </div>

            {/* Right: KPI tiles — value + label + tinted icon circle, 1px dividers */}
            <div className="flex items-center shrink-0">
              {[
                { val: `$${item.rate.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, label: "Retail price", icon: "sell", color: "#16A34A", bg: "rgba(22,163,74,0.15)" },
                { val: `$${item.cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, label: "Cost", icon: "monetization_on", color: "#4A6FA5", bg: "rgba(74,111,165,0.15)" },
                { val: `${margin.toFixed(0)}%`, label: "Margin", icon: "pie_chart", color: "#A856F7", bg: "rgba(168,86,247,0.15)" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center">
                  {i > 0 && <div className="w-px h-6 bg-[#E5E7EB] mx-4" />}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="text-[18px] text-[#1A2332] leading-none" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                      <div className="text-[14px] text-[#6B7280] leading-[20px]">{s.label}</div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: s.bg }}>
                      <span className="material-icons" style={{ fontSize: "18px", color: s.color }}>{s.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* ── UNIFIED TAB BAR ── */}
        <DetailTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton />}
          trailing={
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center bg-white">
              <KebabItem icon="content_copy" onClick={() => toast.success("Item duplicated")}>Duplicate item</KebabItem>
              <KebabItem icon="open_in_new" onClick={() => window.open(`/items/${item.id}`, "_blank")}>Open in new tab</KebabItem>
              <KebabSeparator />
              {item.active ? (
                <KebabItem icon="block" destructive onClick={() => { setItem({ active: false }); toast.success("Item marked Inactive"); }}>Inactivate item</KebabItem>
              ) : (
                <KebabItem icon="check_circle" onClick={() => { setItem({ active: true }); toast.success("Item marked Active"); }}>Reactivate item</KebabItem>
              )}
            </KebabMenu>
          }
          className="mt-5"
        />

        {/* ── CONTENT ── */}
        <div className="mt-4 space-y-4">
          {activeTab === "details" ? renderDetailsTab() : renderActivityTab()}
        </div>
      </div>

      {editModal === "info" && (
        <EditItemInfoModal item={item} images={images} onAddImages={handleAddImages} onRemoveImage={removeImage} onClose={() => setEditModal(null)}
          onSave={(patch) => { setItem(patch); setEditModal(null); toast.success("Item info saved"); }} />
      )}
      {editModal === "classification" && (
        <EditClassificationModal item={item} onClose={() => setEditModal(null)}
          onSave={(patch) => { setItem(patch); setEditModal(null); toast.success("Type & classification saved"); }} />
      )}
      {editModal === "pricing" && (
        <EditPricingModal item={item} taxProfile={taxProfile} onClose={() => setEditModal(null)}
          onSave={(patch, tp) => { setItem(patch); setTaxProfile(tp); setEditModal(null); toast.success("Pricing & tax saved"); }} />
      )}
      {editingNote && (
        <EditNoteModal note={editingNote} onClose={() => setEditingNote(null)}
          onSave={(text) => {
            setNotes((prev) => editingNote.id === 0
              ? [{ id: (prev.at(-1)?.id ?? 0) + 1, date: "Today", text }, ...prev]
              : prev.map((n) => (n.id === editingNote.id ? { ...n, text } : n)));
            setEditingNote(null);
            toast.success("Note saved");
          }} />
      )}
    </div>
  );
}

// ─── Edit modals (Figma 1506:100402 / 1506:104813 / 1508:112964) ──────────────
function ModalShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-[600px] max-w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6]" aria-label="Close"><span className="material-icons" style={{ fontSize: "20px" }}>close</span></button>
        </div>
        <div className="px-5 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}
const mInput = "h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]";
const mLabel = "mb-1.5 block text-[13px] text-[#374151]";
const mArea = "w-full resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]";
const cancelBtn = "h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]";
const saveBtn = "h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]";

function EditItemInfoModal({ item, images, onAddImages, onRemoveImage, onClose, onSave }: { item: any; images: string[]; onAddImages: (f: FileList | null) => void; onRemoveImage: (i: number) => void; onClose: () => void; onSave: (p: any) => void }) {
  const [picture, setPicture] = useState(item.picture || "");
  const [description, setDescription] = useState(item.description || "");
  const [salesDescription, setSalesDescription] = useState(item.salesDescription || "");
  const [additionalInfo, setAdditionalInfo] = useState(item.additionalInfo || "");
  return (
    <ModalShell title="Edit item info" onClose={onClose}
      footer={<><button className={cancelBtn} style={{ fontWeight: 600 }} onClick={onClose}>Cancel</button><button className={saveBtn} style={{ fontWeight: 600 }} onClick={() => onSave({ picture, description, salesDescription, additionalInfo })}>Save</button></>}>
      <div className="flex flex-col gap-4">
        <div>
          <div className={mLabel} style={{ fontWeight: 600 }}>Images</div>
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="group/img relative h-16 w-[78px] overflow-hidden rounded-lg border border-[#E5E7EB]">
                  <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                  <button onClick={() => onRemoveImage(i)} aria-label="Remove image" className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white group-hover/img:flex">
                    <span className="material-icons" style={{ fontSize: "13px" }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-6 text-center hover:border-[#4A6FA5]">
            <span className="material-icons text-[#8899AA]" style={{ fontSize: "24px" }}>upload</span>
            <span className="text-[13px] text-[#546478]">Drop your files here, or <span className="text-[#4A6FA5]">click to browse</span></span>
            <span className="text-[12px] text-[#9CA3AF]">SVG, PNG, JPG or GIF (max. 3MB)</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAddImages(e.target.files)} />
          </label>
        </div>
        <input type="text" value={picture} onChange={(e) => setPicture(e.target.value)} placeholder="Paste image URL" className={mInput} />
        <div><label className={mLabel}>Internal description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${mArea} min-h-[64px]`} /></div>
        <div><label className={mLabel}>Sales description</label><textarea value={salesDescription} onChange={(e) => setSalesDescription(e.target.value)} className={`${mArea} min-h-[64px]`} /></div>
        <div><label className={mLabel}>Additional information</label><textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} className={`${mArea} min-h-[64px]`} /></div>
      </div>
    </ModalShell>
  );
}

function EditClassificationModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (p: any) => void }) {
  // Single combined Type | Category picker (Marek Jun 16). The current pair is kept
  // selectable even if it is a legacy/custom pair not in the predefined list.
  const current = `${item.type || "Service"}|||${item.category || ""}`;
  const pairs = TYPE_CATEGORY_PAIRS.map((p) => ({ value: `${p.type}|||${p.category}`, label: `${p.type}  |  ${p.category}` }));
  const options = pairs.some((p) => p.value === current)
    ? pairs
    : [{ value: current, label: `${item.type || "Service"}  |  ${item.category || "—"}` }, ...pairs];
  const [pair, setPair] = useState(current);
  const [brand, setBrand] = useState(item.brand || "");
  const [department, setDepartment] = useState(item.department || "");
  const [vendor, setVendor] = useState(item.vendor || "");
  const save = () => {
    const [type, category] = pair.split("|||");
    onSave({ type, category, brand, department, vendor });
  };
  return (
    <ModalShell title="Edit type & classification" onClose={onClose}
      footer={<><button className={cancelBtn} style={{ fontWeight: 600 }} onClick={onClose}>Cancel</button><button className={saveBtn} style={{ fontWeight: 600 }} onClick={save}>Save</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className={mLabel}>Type | Category</label><select value={pair} onChange={(e) => setPair(e.target.value)} className={mInput}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div><label className={mLabel}>Manufacturer</label><select value={brand} onChange={(e) => setBrand(e.target.value)} className={mInput}><option value="">Select manufacturer</option>{MANUFACTURERS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
        <div><label className={mLabel}>Department</label><select value={department} onChange={(e) => setDepartment(e.target.value)} className={mInput}><option value="">Select department</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><label className={mLabel}>Vendor</label><select value={vendor} onChange={(e) => setVendor(e.target.value)} className={mInput}><option value="">Select vendor</option>{VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
      </div>
    </ModalShell>
  );
}

function EditPricingModal({ item, taxProfile, onClose, onSave }: { item: any; taxProfile: string; onClose: () => void; onSave: (p: any, tp: string) => void }) {
  const [rate, setRate] = useState(String(item.rate ?? ""));
  const [cost, setCost] = useState(String(item.cost ?? ""));
  const [defaultQty, setDefaultQty] = useState(String(item.defaultQty ?? "1"));
  const [taxable, setTaxable] = useState(!!item.taxable);
  const [tp, setTp] = useState(taxProfile);
  return (
    <ModalShell title="Edit pricing & tax" onClose={onClose}
      footer={<><button className={cancelBtn} style={{ fontWeight: 600 }} onClick={onClose}>Cancel</button><button className={saveBtn} style={{ fontWeight: 600 }} onClick={() => onSave({ rate: parseFloat(rate) || 0, cost: parseFloat(cost) || 0, defaultQty: parseInt(defaultQty) || 1, taxable }, tp)}>Save</button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div><label className={mLabel}>Retail price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span><input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={`${mInput} pl-7`} style={{ fontVariantNumeric: "tabular-nums" }} /></div></div>
          <div><label className={mLabel}>Cost</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span><input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className={`${mInput} pl-7`} style={{ fontVariantNumeric: "tabular-nums" }} /></div></div>
          <div><label className={mLabel}>Default quantity</label><input type="number" min="0" step="1" value={defaultQty} onChange={(e) => setDefaultQty(e.target.value)} className={mInput} style={{ fontVariantNumeric: "tabular-nums" }} /></div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] p-4">
          <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="h-4 w-4 rounded border-[#CBD5E1] accent-[#4A6FA5]" /><span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Taxable</span></label>
          {taxable && (
            <div className="mt-3"><label className={mLabel}>Tax profile</label><select value={tp} onChange={(e) => setTp(e.target.value)} className={mInput}>{["No Tax", "Florida Sales Tax 7%", "Texas Sales Tax 8.25%", "Polish Sales Tax 23%"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function EditNoteModal({ note, onClose, onSave }: { note: { id: number; text: string }; onClose: () => void; onSave: (text: string) => void }) {
  const [text, setText] = useState(note.text);
  return (
    <ModalShell title={note.id === 0 ? "Add note" : "Edit note"} onClose={onClose}
      footer={<><button className={cancelBtn} style={{ fontWeight: 600 }} onClick={onClose}>Cancel</button><button className={saveBtn} style={{ fontWeight: 600 }} onClick={() => { if (text.trim()) onSave(text.trim()); }}>Save</button></>}>
      <label className={mLabel}>Note</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className={`${mArea} min-h-[90px]`} autoFocus />
    </ModalShell>
  );
}
