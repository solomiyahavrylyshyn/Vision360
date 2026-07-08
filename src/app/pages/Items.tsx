import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { CreateActionButton } from "../components/ui/create-action-button";
import { AdvancedFilterField, AdvancedFilterPanel, advancedInputClass, advancedSelectClass } from "../components/ui/advanced-filters";
import { PaginationFooter } from "../components/ui/pagination-footer";
import { itemsStore, mapItemTypeToCatalog } from "../stores/itemsStore";
import { toast } from "sonner";
import type { CatalogItem } from "../components/ItemPicker";

// Project the rich Items-module record onto the catalog shape the
// Estimate / Job pickers consume, so created items flow straight through.
export const toCatalogItem = (i: {
  id: number; name: string; description: string; salesDescription: string;
  brand: string; modelNumber: string; rate: number; cost: number; taxable: boolean;
  category: string; type: string;
  department?: string; vendor?: string; defaultQty?: number;
  additionalInfo?: string; customField1?: string; customField2?: string; notes?: string;
  images?: string[]; taxProfile?: string; active?: boolean; upc?: string;
}): CatalogItem => ({
  id: i.id, name: i.name, itemDescription: i.description, salesDescription: i.salesDescription,
  brand: i.brand, modelNumber: i.modelNumber, rate: i.rate, cost: i.cost, taxable: i.taxable,
  category: i.category, type: mapItemTypeToCatalog(i.type),
  // rich fields preserved for the Items list + detail page (pickers ignore them)
  itemType: i.type, department: i.department, vendor: i.vendor,
  defaultQty: i.defaultQty, additionalInfo: i.additionalInfo,
  customField1: i.customField1, customField2: i.customField2, notes: i.notes,
  images: i.images, taxProfile: i.taxProfile, active: i.active, upc: i.upc,
});

// ─── Types ───────────────────────────────────────────────────────────────────
// Canonical item types follow the Figma items module (canvas 904:76014): six
// predefined buckets. Legacy fine-grained sub-types on old records still map
// onto these via getItemCategory below.
type ItemType = string;

interface Item {
  id: number;
  active: boolean;
  name: string;
  description: string;        // internal description
  salesDescription: string;
  additionalInfo: string;
  brand: string;              // shown as "Manufacturer" in UI
  modelNumber: string;
  upc: string;
  rate: number;               // shown as "Price" in UI
  cost: number;
  taxable: boolean;
  category: string;
  type: ItemType;
  vendor: string;
  department: string;
  customField1: string;
  customField2: string;
  notes: string;
  defaultQty: number;
  createdAt: string;          // "Mar 10, 2026" — Created date column
  usageCount?: number;        // how many jobs/estimates have used this item (drives Delete vs Deactivate)
}

type TabKey = "all" | "pricebook" | "services" | "materials" | "equipment" | "asset" | "admin";

// ─── Shared Item taxonomy (Figma items canvas — supersedes the Jun 16 list) ──
// TYPES are the 6 predefined buckets from the Create-item form — NOT
// user-customizable. CATEGORIES are the customizable sub-buckets under each
// type. This is the ONE source of truth for the Create-item form and the
// Item-detail edit modal.
export const ITEM_TYPES = ["Service", "Material", "Equipment", "Asset", "Admin", "Price Book"] as const;

export const TYPE_CATEGORIES: Record<string, string[]> = {
  Service: ["Diagnostic", "Labor", "Installation", "Maintenance", "Repair", "Indoor Air Quality", "Electrical Service"],
  Material: ["Copper", "Electrical Material", "Parts", "Consumables", "Refrigerant"],
  Equipment: ["Condensers", "Air Handlers", "Water Heaters", "Boilers", "Motors"],
  Asset: ["IT Equipment", "Tools", "Machines", "Office Equipment", "Fleet"],
  Admin: ["Admin Fee", "Permit Fee", "Diagnostic Fee", "Trip Charge"],
  "Price Book": ["Maintenance", "Diagnostics", "Repairs", "Installation", "Replacement", "Membership", "Custom"],
};

// Every (type, category) pair, for consumers that need a combined list.
export const TYPE_CATEGORY_PAIRS: { type: string; category: string }[] =
  ITEM_TYPES.flatMap((t) => TYPE_CATEGORIES[t].map((c) => ({ type: t, category: c })));

// ─── Type helpers ────────────────────────────────────────────────────────────
type ItemBucket = "Service" | "Material" | "Equipment" | "Asset" | "Admin" | "Price Book" | "Other";

function getItemCategory(type: string): ItemBucket {
  // Canonical 6 types map straight to their bucket.
  if (type === "Service") return "Service";
  if (type === "Material") return "Material";
  if (type === "Equipment") return "Equipment";
  if (type === "Assets" || type === "Asset") return "Asset";
  if (type === "Admin" || type === "Fees") return "Admin";
  if (type === "Price Book") return "Price Book";
  // Legacy fine sub-types on older records → their bucket.
  if (["Labor", "Maintenance", "Diagnostics", "Installation", "Repair"].includes(type)) return "Service";
  if (["Inventory Item", "Non-Inventory Item", "Serialized Item"].includes(type)) return "Material";
  if (["Fee / Admin Code", "Discount", "Other Charge", "Material Markup", "Labor Markup", "Other Markup",
    "Material Discount", "Labor Discount", "Other Discount"].includes(type)) return "Admin";
  if (["Bundle / Kit"].includes(type)) return "Price Book";
  return "Other";
}

// Colored-dot type badge (Figma row 904:76078: 4px dot + 12px medium label).
function getTypeDot(type: ItemType): { label: string; color: string } {
  const cat = getItemCategory(type);
  if (cat === "Service") return { label: "Service", color: "#4A6FA5" };
  if (cat === "Material") return { label: "Material", color: "#16A34A" };
  if (cat === "Equipment") return { label: "Equipment", color: "#7C3AED" };
  if (cat === "Asset") return { label: "Asset", color: "#D97706" };
  if (cat === "Admin") return { label: "Admin", color: "#EA580C" };
  if (cat === "Price Book") return { label: "Price Book", color: "#0D9488" };
  return { label: "Other", color: "#6B7280" };
}

// Design shows whole-dollar prices as "$99" — only show cents when present.
const fmtMoney = (n: number) => `$${n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)}`;

// Deterministic mock created-dates for seed rows (Created date column).
const mockCreatedAt = (id: number) => {
  const d = new Date(2026, 0, 2 + ((id * 7) % 150));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Map a catalog record (the itemsStore is the single source of truth for the
// merged collection — base catalog + price book + user-created items) onto the
// rich row shape this page renders.
const catalogToRow = (s: any): Item => ({
  id: s.id, active: s.active ?? true, name: s.name,
  description: s.itemDescription || "", salesDescription: s.salesDescription || "", additionalInfo: s.additionalInfo || "",
  brand: s.brand || "", modelNumber: s.modelNumber || "", upc: s.upc || "",
  rate: s.rate || 0, cost: s.cost || 0, taxable: !!s.taxable,
  // Use the fine itemType (falls back to the coarse picker type for old data)
  category: s.category || "", type: s.itemType || s.type || "Service",
  vendor: s.vendor || "", department: s.department || "",
  customField1: s.customField1 || "", customField2: s.customField2 || "",
  notes: s.notes || "", defaultQty: s.defaultQty ?? 1,
  createdAt: mockCreatedAt(s.id),
  // Seed items 1-2 carry usage history so Deactivate (kept) vs Delete
  // (permanent, unused-only) are both demonstrable per ITM-3.
  usageCount: s.id <= 2 ? 3 : 0,
});

// ─── Column definitions ──────────────────────────────────────────────────────
// Toggleable via the "Edit columns" modal (Figma 1494:88462). Name is locked-on.
// Modal order mirrors the design: left column then right column.
const ALL_COLS = [
  { key: "name",      label: "Name",         sortable: true,  locked: true,  numeric: false },
  { key: "category",  label: "Category",     sortable: true,  locked: false, numeric: false },
  { key: "type",      label: "Type",         sortable: true,  locked: false, numeric: false },
  { key: "department",label: "Department",   sortable: true,  locked: false, numeric: false },
  { key: "vendor",    label: "Vendor",       sortable: true,  locked: false, numeric: false },
  { key: "brand",     label: "Manufacturer", sortable: true,  locked: false, numeric: false },
  { key: "status",    label: "Status",       sortable: true,  locked: false, numeric: false },
  { key: "createdAt", label: "Created date", sortable: true,  locked: false, numeric: false },
  { key: "rate",      label: "Price",        sortable: true,  locked: false, numeric: true  },
  { key: "cost",      label: "Cost",         sortable: true,  locked: false, numeric: true  },
  { key: "taxable",   label: "Taxable",      sortable: false, locked: false, numeric: true  },
] as const;
type ColKey = (typeof ALL_COLS)[number]["key"];

const DEFAULT_COL_VIS: Record<string, boolean> = {
  name: true, category: true, type: true, department: false, vendor: false,
  brand: false, status: true, createdAt: false, rate: true, cost: true, taxable: true,
};

// ─── Helper Components ───────────────────────────────────────────────────────
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function Items() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Items state — ONE collection sourced from itemsStore (base catalog +
  // price-book entries + user-created items).
  const storeItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const [items, setItems] = useState<Item[]>(() => storeItems.map(catalogToRow));
  // Items created on the /items/new page write to itemsStore; merge any store
  // items not already in this list (matched by id) so they appear here too.
  useEffect(() => {
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.id));
      const additions = storeItems.filter((s: any) => s.name && !ids.has(s.id)).map(catalogToRow)
        .map((r) => ({ ...r, usageCount: 0 }));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [storeItems]);

  const [itemSearch, setItemSearch] = useState("");
  const [itemFilter, setItemFilter] = useState("All");
  const [itemStatusFilter, setItemStatusFilter] = useState("All");
  const [itemSort, setItemSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [itemPage, setItemPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Edit-columns modal. Name is always shown; the rest toggle.
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
  const [colVis, setColVis] = useState<Record<string, boolean>>(DEFAULT_COL_VIS);
  const [draftColVis, setDraftColVis] = useState<Record<string, boolean>>(DEFAULT_COL_VIS);
  const openEditColumns = () => { setDraftColVis(colVis); setEditColumnsOpen(true); };
  // Price book tab has no Type column (all rows are Price Book by definition).
  const visibleCols = ALL_COLS.filter((c) => colVis[c.key] && !(activeTab === "pricebook" && c.key === "type"));

  // Row-action "Duplicate" — clone as a fresh, never-used, active item.
  const duplicateItem = (item: Item) => {
    const newId = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems((prev) => [{ ...item, id: newId, name: `${item.name} (copy)`, usageCount: 0, active: true, createdAt: mockCreatedAt(newId) }, ...prev]);
    toast.success(`Duplicated “${item.name}”`);
  };

  // Delete / Deactivate confirmation. mode "deactivate" keeps the record (it
  // has usage history); mode "delete" permanently removes it (never used).
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string; mode: "delete" | "deactivate" } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Advanced filters
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [advancedType, setAdvancedType] = useState("All");
  const [advancedPriceMin, setAdvancedPriceMin] = useState("");
  const [advancedPriceMax, setAdvancedPriceMax] = useState("");
  const [advancedCostMin, setAdvancedCostMin] = useState("");
  const [advancedCostMax, setAdvancedCostMax] = useState("");
  const [advancedTaxable, setAdvancedTaxable] = useState("All");

  // ─── Filtering / sorting ─────────────────────────────────────────────
  const tabBucketMap: Record<TabKey, ItemBucket | null> = {
    all: null, pricebook: "Price Book",
    services: "Service", materials: "Material",
    equipment: "Equipment", asset: "Asset", admin: "Admin",
  };

  const filteredItems = useMemo(() => {
    let result = [...items];
    const tabBucket = tabBucketMap[activeTab];
    if (tabBucket) result = result.filter(i => getItemCategory(i.type) === tabBucket);
    // Category dropdown filter
    if (itemFilter !== "All") result = result.filter(i => i.category === itemFilter);
    // Status filter
    if (itemStatusFilter === "Active") result = result.filter(i => i.active);
    else if (itemStatusFilter === "Inactive") result = result.filter(i => !i.active);
    if (advancedType !== "All") result = result.filter(i => getItemCategory(i.type) === advancedType);
    if (advancedPriceMin) result = result.filter(i => i.rate >= Number(advancedPriceMin));
    if (advancedPriceMax) result = result.filter(i => i.rate <= Number(advancedPriceMax));
    if (advancedCostMin) result = result.filter(i => i.cost >= Number(advancedCostMin));
    if (advancedCostMax) result = result.filter(i => i.cost <= Number(advancedCostMax));
    if (advancedTaxable === "Taxable") result = result.filter(i => i.taxable);
    if (advancedTaxable === "Non-taxable") result = result.filter(i => !i.taxable);
    // Search
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.modelNumber.toLowerCase().includes(q) ||
        String(i.id).includes(q)
      );
    }
    result.sort((a, b) => {
      const k = itemSort.key === "status" ? "active" : itemSort.key;
      const av = (a as any)[k], bv = (b as any)[k];
      if (typeof av === "number" && typeof bv === "number") return itemSort.dir === "asc" ? av - bv : bv - av;
      if (typeof av === "boolean" && typeof bv === "boolean") return itemSort.dir === "asc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
      return itemSort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return result;
  }, [items, itemFilter, itemStatusFilter, itemSearch, itemSort, activeTab, advancedType, advancedPriceMin, advancedPriceMax, advancedCostMin, advancedCostMax, advancedTaxable]);

  const paginatedItems = filteredItems.slice((itemPage - 1) * itemPerPage, itemPage * itemPerPage);
  const allItemsSelected = paginatedItems.length > 0 && paginatedItems.every(i => selectedItems.has(i.id));
  // Category options follow the active tab so the dropdown stays relevant.
  const uniqueCategories = useMemo(() => {
    const tabBucket = tabBucketMap[activeTab];
    const pool = tabBucket ? items.filter(i => getItemCategory(i.type) === tabBucket) : items;
    return [...new Set(pool.map(i => i.category).filter(Boolean))].sort();
  }, [items, activeTab]);

  const handleSortItems = (key: string) => {
    setItemSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  };

  // Header sort icon — double arrow at 50% opacity, active direction colored
  // (Figma 904:76070: arrow-up-down on every sortable column).
  const SortIcon = ({ col }: { col: string }) => (
    itemSort.key === col ? (
      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>
        {itemSort.dir === "asc" ? "arrow_upward" : "arrow_downward"}
      </span>
    ) : (
      <span className="material-icons text-[#1A2332] opacity-50" style={{ fontSize: "14px" }}>swap_vert</span>
    )
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All items" },
    { key: "pricebook", label: "Price book" },
    { key: "services", label: "Services" },
    { key: "materials", label: "Materials" },
    { key: "equipment", label: "Equipment" },
    { key: "asset", label: "Asset" },
    { key: "admin", label: "Admin" },
  ];

  const handleDownload = () => {
    toast.info("Download started — CSV export will be available with backend integration.");
  };

  const tabRecordCounts: Record<TabKey, number> = {
    all: items.length,
    pricebook: items.filter(i => getItemCategory(i.type) === "Price Book").length,
    services: items.filter(i => getItemCategory(i.type) === "Service").length,
    materials: items.filter(i => getItemCategory(i.type) === "Material").length,
    equipment: items.filter(i => getItemCategory(i.type) === "Equipment").length,
    asset: items.filter(i => getItemCategory(i.type) === "Asset").length,
    admin: items.filter(i => getItemCategory(i.type) === "Admin").length,
  };

  const advancedFilterCount = [
    advancedType !== "All",
    advancedPriceMin,
    advancedPriceMax,
    advancedCostMin,
    advancedCostMax,
    advancedTaxable !== "All",
  ].filter(Boolean).length;
  const clearAdvancedFilters = () => {
    setAdvancedType("All");
    setAdvancedPriceMin("");
    setAdvancedPriceMax("");
    setAdvancedCostMin("");
    setAdvancedCostMax("");
    setAdvancedTaxable("All");
    setItemFilter("All");
    setFilterPanelOpen(false);
    setItemPage(1);
  };

  const switchTab = (key: TabKey) => {
    setActiveTab(key);
    setItemFilter("All");
    setItemPage(1);
    setSelectedItems(new Set());
  };

  // Native-select chevron (house pattern shared by the list toolbars).
  const selectChevron = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23546478' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    appearance: "none" as const,
  };

  // Table cell text style (Figma: Geist 14/20 regular #1A2332).
  const cellText = { fontFamily: "Geist", fontWeight: 400, lineHeight: "20px" };

  // ═══════════════════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="px-7 py-5 bg-[#F5F7FA] min-h-full">
      {/* Page Header */}
      <PageHeader
        title="Items"
        count={tabRecordCounts[activeTab]}
        className="mb-4"
      />

      {/* Tabs — pill style (Figma 904:78133): container #F5F7FA p-[3px]
          rounded-[10px]; active tab = solid #4A6FA5 with white label */}
      <div className="mb-4 flex items-center">
        <div className="flex items-center rounded-[10px] bg-[#EDF0F4] p-[3px]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`min-h-[29px] rounded-[8px] px-2.5 py-1 text-[14px] whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-[#4A6FA5] text-white shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)]"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: 500, lineHeight: "20px" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ TABLE ═══════════════ */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        {/* Toolbar (Figma 904:76058): search | ÷ | Categories | Status | ÷ | Filter … Create item · ⋮ */}
        <div className="flex items-center gap-3 p-3 border-b border-[#E5E7EB]">
          <div className="relative w-[300px]">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>search</span>
            <input
              type="text"
              placeholder={activeTab === "pricebook" ? "Search pricebook items..." : "Search items..."}
              value={itemSearch}
              onChange={(e) => { setItemSearch(e.target.value); setItemPage(1); }}
              className="w-full h-9 pl-9 pr-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5] bg-white"
            />
          </div>
          <div className="w-px h-6 bg-[#E5E7EB]" />
          <select
            value={itemFilter}
            onChange={(e) => { setItemFilter(e.target.value); setItemPage(1); }}
            className="h-9 pl-3 pr-8 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5] min-w-[143px]"
            style={selectChevron}
          >
            <option value="All">Categories: All</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={itemStatusFilter}
            onChange={(e) => { setItemStatusFilter(e.target.value); setItemPage(1); }}
            className="h-9 pl-3 pr-8 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5] min-w-[116px]"
            style={selectChevron}
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="w-px h-6 bg-[#E5E7EB]" />
          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`h-9 px-4 rounded-lg border text-[14px] flex items-center gap-2 transition-colors ${
              advancedFilterCount > 0
                ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
                : "border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA]"
            }`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>filter_alt</span>
            Filter
            {advancedFilterCount > 0 && (
              <span className="w-4 h-4 bg-[#4A6FA5] text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                {advancedFilterCount}
              </span>
            )}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <CreateActionButton onClick={() => navigate("/items/new")}>
              Create item
            </CreateActionButton>
            <KebabMenu triggerClassName="w-9 h-9 border border-[#E5E7EB] rounded-lg bg-white">
              <KebabItem icon="view_column" onClick={openEditColumns}>Edit columns</KebabItem>
              <KebabSeparator />
              <KebabItem icon="file_upload" onClick={() => setUploadOpen(true)}>Upload</KebabItem>
              <KebabItem icon="file_download" onClick={handleDownload}>Download</KebabItem>
            </KebabMenu>
          </div>
        </div>

        {/* Bulk actions bar — Figma 1494:77246: "{N} selected" · Download · Deactivate · ✕ */}
        <SelectionBar
          count={selectedItems.size}
          onDeselect={() => setSelectedItems(new Set())}
          dismissAsIcon
          actions={[
            { label: "Download", icon: "file_download", onClick: handleDownload },
            {
              label: "Deactivate",
              icon: "block",
              onClick: () => {
                setItems(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, active: false } : i));
                items.filter(i => selectedItems.has(i.id)).forEach(i => itemsStore.upsert({ ...i, active: false } as any));
                setSelectedItems(new Set());
              },
            },
          ]}
        />

        {/* Table (Figma 904:76070 header + 904:76078 rows) */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                <th className="pl-4 pr-2 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={allItemsSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedItems(new Set(paginatedItems.map(i => i.id)));
                      else setSelectedItems(new Set());
                    }}
                    className="w-3.5 h-3.5 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                  />
                </th>
                {visibleCols.map(col => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 text-[14px] text-[#1A2332] select-none ${col.numeric ? "text-right" : "text-left"} ${col.sortable ? "cursor-pointer" : ""} ${col.key === "name" ? "w-[186px]" : col.key === "type" || col.key === "status" ? "w-[141px]" : ""}`}
                    style={{ fontFamily: "Geist", fontWeight: 500, lineHeight: "20px" }}
                    onClick={() => { if (col.sortable) handleSortItems(col.key); }}
                  >
                    <div className={`flex items-center gap-2 ${col.numeric ? "justify-end" : ""}`}>
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2 w-[52px]" />
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 2} className="px-4 py-16 text-center">
                    <span className="material-icons text-[#C8D5E8] mb-2 block" style={{ fontSize: "48px" }}>inventory_2</span>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items found</div>
                    <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your search or filters</div>
                  </td>
                </tr>
              ) : paginatedItems.map((item) => {
                const dot = getTypeDot(item.type);
                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/items/${item.id}`)}
                    className={`group h-[60px] border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-pointer ${selectedItems.has(item.id) ? "bg-[#EBF0F8]" : "bg-white"}`}
                  >
                    <td className="pl-4 pr-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const s = new Set(selectedItems);
                          e.target.checked ? s.add(item.id) : s.delete(item.id);
                          setSelectedItems(s);
                        }}
                        className="w-3.5 h-3.5 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                      />
                    </td>
                    {visibleCols.map(col => {
                      switch (col.key) {
                        case "name":
                          return (
                            <td key="name" className="px-2 py-2">
                              <div className="truncate max-w-[200px] text-[14px] text-[#4A6FA5] hover:underline" style={{ fontFamily: "Geist", fontWeight: 500, lineHeight: "20px" }}>{item.name}</div>
                            </td>
                          );
                        case "category":
                          return <td key="category" className="px-2 py-2 text-[14px] text-[#1A2332]" style={cellText}>{item.category || "—"}</td>;
                        case "type":
                          return (
                            <td key="type" className="px-2 py-2">
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: dot.color }} />
                                <span className="text-[12px]" style={{ fontWeight: 500, lineHeight: "16px", color: dot.color }}>{dot.label}</span>
                              </span>
                            </td>
                          );
                        case "department":
                          return <td key="department" className="px-2 py-2 text-[14px] text-[#1A2332]" style={cellText}>{item.department || "—"}</td>;
                        case "vendor":
                          return <td key="vendor" className="px-2 py-2 text-[14px] text-[#1A2332]" style={cellText}>{item.vendor || "—"}</td>;
                        case "brand":
                          return <td key="brand" className="px-2 py-2 text-[14px] text-[#1A2332]" style={cellText}>{item.brand || "—"}</td>;
                        case "status":
                          return (
                            <td key="status" className="px-2 py-2">
                              <span
                                className="inline-flex items-center rounded-[8px] px-2 py-0.5 text-[12px] whitespace-nowrap"
                                style={{
                                  fontWeight: 500, lineHeight: "16px",
                                  backgroundColor: item.active ? "rgba(22,163,74,0.15)" : "rgba(107,114,128,0.15)",
                                  color: item.active ? "#16A34A" : "#6B7280",
                                }}
                              >
                                {item.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          );
                        case "createdAt":
                          return <td key="createdAt" className="px-2 py-2 text-[14px] text-[#1A2332]" style={cellText}>{item.createdAt}</td>;
                        case "rate":
                          return <td key="rate" className="px-2 py-2 text-[14px] text-[#1A2332] text-right" style={{ ...cellText, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(item.rate)}</td>;
                        case "cost":
                          return <td key="cost" className="px-2 py-2 text-[14px] text-[#1A2332] text-right" style={{ ...cellText, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(item.cost)}</td>;
                        case "taxable":
                          return <td key="taxable" className="px-2 py-2 text-[14px] text-[#6B7280] text-right" style={cellText}>{item.taxable ? "Yes" : "No"}</td>;
                        default:
                          return null;
                      }
                    })}
                    <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {/* Row kebab (Figma 1494:78233): Duplicate / Deactivate / Open in new tab */}
                      <KebabMenu>
                        <KebabItem icon="content_copy" onClick={() => duplicateItem(item)}>Duplicate</KebabItem>
                        {!item.active ? (
                          <KebabItem icon="check_circle" onClick={() => { const upd = { ...item, active: true }; setItems(prev => prev.map(i => i.id === item.id ? upd : i)); itemsStore.upsert(upd as any); }}>Reactivate</KebabItem>
                        ) : (item.usageCount ?? 0) > 0 ? (
                          <KebabItem icon="block" onClick={() => setDeleteConfirm({ id: item.id, name: item.name, mode: "deactivate" })}>Deactivate</KebabItem>
                        ) : (
                          <KebabItem icon="delete_outline" destructive onClick={() => setDeleteConfirm({ id: item.id, name: item.name, mode: "delete" })}>Delete</KebabItem>
                        )}
                        <KebabItem icon="open_in_new" onClick={() => window.open(`/items/${item.id}`, "_blank")}>Open in new tab</KebabItem>
                      </KebabMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationFooter page={itemPage} perPage={itemPerPage} total={filteredItems.length} onPageChange={setItemPage} onPerPageChange={setItemPerPage} />
      </div>

      {/* ═══════════════ FILTER PANEL ═══════════════ */}
      {filterPanelOpen && (
        <AdvancedFilterPanel
          title="Filter"
          onClose={() => setFilterPanelOpen(false)}
          onClear={clearAdvancedFilters}
          onApply={() => {
            setFilterPanelOpen(false);
            setItemPage(1);
          }}
        >
          {activeTab === "all" && (
            <AdvancedFilterField label="Type">
              <select value={advancedType} onChange={(e) => setAdvancedType(e.target.value)} className={advancedSelectClass}>
                <option value="All">All</option>
                {ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </AdvancedFilterField>
          )}
          <AdvancedFilterField label="Category">
            <select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} className={advancedSelectClass}>
              <option value="All">All</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </AdvancedFilterField>
          <div className="border-t border-[#E5E7EB] pt-5">
            <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Price</h3>
            <div className="flex items-center gap-2">
              <input type="number" min="0" placeholder="min" value={advancedPriceMin} onChange={(e) => setAdvancedPriceMin(e.target.value)} className={advancedInputClass} />
              <span className="text-[#546478] text-[13px]">-</span>
              <input type="number" min="0" placeholder="max" value={advancedPriceMax} onChange={(e) => setAdvancedPriceMax(e.target.value)} className={advancedInputClass} />
            </div>
          </div>
          <div className="border-t border-[#E5E7EB] pt-5">
            <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Cost</h3>
            <div className="flex items-center gap-2">
              <input type="number" min="0" placeholder="min" value={advancedCostMin} onChange={(e) => setAdvancedCostMin(e.target.value)} className={advancedInputClass} />
              <span className="text-[#546478] text-[13px]">-</span>
              <input type="number" min="0" placeholder="max" value={advancedCostMax} onChange={(e) => setAdvancedCostMax(e.target.value)} className={advancedInputClass} />
            </div>
          </div>
          <AdvancedFilterField label="Taxable">
            <select value={advancedTaxable} onChange={(e) => setAdvancedTaxable(e.target.value)} className={advancedSelectClass}>
              <option value="All">All</option>
              <option value="Taxable">Taxable</option>
              <option value="Non-taxable">Non-taxable</option>
            </select>
          </AdvancedFilterField>
        </AdvancedFilterPanel>
      )}

      {/* ═══════════════ EDIT COLUMNS MODAL (Figma 1494:88462) ═══════════════ */}
      {editColumnsOpen && (
        <ModalBackdrop onClose={() => setEditColumnsOpen(false)}>
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[600px] max-w-[92vw] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit columns</h2>
              <button onClick={() => setEditColumnsOpen(false)} aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#546478]">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            {/* Body — two columns of checkbox rows (design order) */}
            <div className="flex gap-4 px-4 py-1">
              {[ALL_COLS.slice(0, 6), ALL_COLS.slice(6)].map((colGroup, gi) => (
                <div key={gi} className="flex-1 flex flex-col gap-2">
                  {colGroup.map((col) => {
                    const checked = col.locked ? true : !!draftColVis[col.key];
                    return (
                      <button
                        key={col.key}
                        type="button"
                        disabled={col.locked}
                        onClick={() => { if (!col.locked) setDraftColVis((d) => ({ ...d, [col.key]: !d[col.key] })); }}
                        className={`flex items-center gap-3 p-3 rounded-[10px] border border-[#E5E7EB] bg-white text-left transition-colors ${col.locked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9FAFB]"}`}
                      >
                        <span className={`w-4 h-4 rounded-[4px] flex items-center justify-center border shrink-0 ${checked ? "bg-[#4A6FA5] border-[#4A6FA5]" : "bg-white border-[#E5E7EB]"}`}>
                          {checked && <span className="material-icons text-white" style={{ fontSize: "12px" }}>check</span>}
                        </span>
                        <span className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", lineHeight: "20px" }}>{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4">
              <button onClick={() => setEditColumnsOpen(false)} className="min-h-9 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={() => { setColVis(draftColVis); setEditColumnsOpen(false); toast.success("Columns updated"); }} className="min-h-9 px-4 py-2 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-[14px] text-white transition-colors" style={{ fontWeight: 500 }}>Save</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ── Delete / Deactivate Confirmation ── */}
      {deleteConfirm && (
        <ModalBackdrop onClose={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>warning</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>{deleteConfirm.mode === "deactivate" ? "Deactivate item?" : "Delete item?"}</h3>
            </div>
            <p className="text-[14px] text-[#546478] mb-6">
              {deleteConfirm.mode === "deactivate"
                ? <>Deactivate <strong>"{deleteConfirm.name}"</strong>? It has usage history, so it's kept for reporting but removed from active lists. You can reactivate it anytime.</>
                : <>Permanently delete <strong>"{deleteConfirm.name}"</strong>? It has never been used, so this can't be undone.</>}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  const { id, mode } = deleteConfirm;
                  if (mode === "deactivate") {
                    setItems(prev => prev.map(i => i.id === id ? { ...i, active: false } : i));
                    const rec = items.find(i => i.id === id);
                    if (rec) itemsStore.upsert({ ...rec, active: false } as any);
                  } else {
                    setItems(prev => prev.filter(i => i.id !== id));
                    itemsStore.remove(id);
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]"
                style={{ fontWeight: 600 }}
              >
                {deleteConfirm.mode === "deactivate" ? "Deactivate" : "Delete"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ── Upload (bulk import) ── */}
      {uploadOpen && (
        <ModalBackdrop onClose={() => setUploadOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px] p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Upload items</h3>
              <button onClick={() => setUploadOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F5F7FA] text-[#6B7280]"><span className="material-icons" style={{ fontSize: "20px" }}>close</span></button>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4">Bulk-upload items from a CSV/XLSX file. Existing items are matched by name; new ones are added.</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#C8D5E8] rounded-xl py-8 cursor-pointer hover:bg-[#F9FBFD]">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "28px" }}>upload_file</span>
              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Choose a CSV or XLSX file</span>
              <span className="text-[12px] text-[#9CA3AF]">or drag and drop here</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { toast.success(`Uploading items from "${f.name}"`); setUploadOpen(false); }
                }}
              />
            </label>
            <div className="mt-4 flex items-center justify-between">
              <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }} onClick={() => toast.success("Template downloaded")}>Download template</button>
              <button onClick={() => setUploadOpen(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}
