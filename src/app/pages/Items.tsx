import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";

// ─── Types ───────────────────────────────────────────────────────────────────
type ItemType =
  // Service
  | "Service" | "Labor" | "Maintenance" | "Diagnostics" | "Installation" | "Repair"
  // Material
  | "Inventory Item" | "Non-Inventory Item" | "Serialized Item"
  // Equipment & Asset
  | "Equipment" | "Asset"
  // Fee
  | "Fee / Admin Code" | "Discount" | "Other Charge"
  | "Material Markup" | "Labor Markup" | "Other Markup"
  | "Material Discount" | "Labor Discount" | "Other Discount"
  // Other
  | "Bundle / Kit" | "Expense / Reimbursement";

interface Item {
  id: number;
  active: boolean;
  name: string;
  description: string;        // internal description
  salesDescription: string;
  additionalInfo: string;
  brand: string;              // shown as "Mfg." in UI
  modelNumber: string;        // shown as "SKU" in UI
  upc: string;
  rate: number;               // shown as "Retail Price" in UI
  cost: number;
  taxable: boolean;
  tax1: boolean;
  tax2: boolean;
  tax3: boolean;
  onHand: number;
  minQty: number;
  maxQty: number;
  tracking: boolean;
  category: string;
  subcategory: string;
  type: ItemType;
  vendor: string;
  vendorCode: string;
  department: string;
  cogsGL: string;
  salesGL: string;
  customField1: string;
  customField2: string;
  customField3: string;
  notes: string;
  boldPrint: boolean;
  group: string;
  defaultQty: number;
  picture: string;
  inventory: boolean;         // keep for backward compat
  booking: boolean;           // keep for backward compat
}

interface ItemGroup {
  id: number;
  name: string;
  description: string;
  groupType: "Individual items" | "Bundle";
  category: string;
  items: number[];
  active: boolean;
  total: number;
}

interface ItemCategory {
  id: number;
  name: string;
  description: string;
  parentCategory: string;
  activeItems: number;
  active: boolean;
}

interface ItemBrand {
  id: number;
  name: string;
  description: string;
}

interface Catalog {
  id: number;
  name: string;
  description: string;
  itemCount: number;
  active: boolean;
}

type TabKey = "items" | "groups" | "categories" | "brands" | "catalogs";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const initialItems: Item[] = [
  {
    id: 1000, active: true, name: "Heat Pump Repair or Service",
    description: "Standard heat pump repair service call",
    salesDescription: "Heat pump diagnostic, repair and service",
    additionalInfo: "", brand: "Carrier", modelNumber: "HP-2500", upc: "",
    rate: 285, cost: 120, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "HVAC", subcategory: "Repair", type: "Service",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: false,
  },
  {
    id: 1001, active: true, name: "SEER Heat Pump Condenser Unit",
    description: "SEER 16 heat pump condenser outdoor unit",
    salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit",
    additionalInfo: "SEER 16 rated", brand: "Trane", modelNumber: "XR16-048", upc: "012345678901",
    rate: 3200, cost: 1800, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 12, minQty: 2, maxQty: 50, tracking: true,
    category: "HVAC", subcategory: "Condensers", type: "Inventory Item",
    vendor: "Trane Supply", vendorCode: "TR-XR16048", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  {
    id: 1002, active: true, name: "SEER Heat Pump Condenser Premium",
    description: "SEER 20 premium heat pump condenser",
    salesDescription: "SEER Premium Heat Pump Condenser — ultra high efficiency",
    additionalInfo: "SEER 20 rated, Energy Star certified", brand: "Lennox", modelNumber: "XP25-048", upc: "098765432109",
    rate: 4800, cost: 2900, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 5, minQty: 1, maxQty: 20, tracking: true,
    category: "HVAC", subcategory: "Condensers", type: "Inventory Item",
    vendor: "Lennox Pro", vendorCode: "LX-XP25048", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  {
    id: 1003, active: true, name: "Copper Piping Installation",
    description: "Install copper piping per linear foot",
    salesDescription: "Professional copper piping installation (per ft)",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 18.50, cost: 6.75, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Plumbing", subcategory: "Installation", type: "Installation",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: true,
  },
  {
    id: 1004, active: true, name: "Electrical Panel Upgrade 200A",
    description: "Upgrade existing panel to 200 amp service",
    salesDescription: "200A electrical panel upgrade — parts and labor",
    additionalInfo: "Includes permit filing", brand: "Square D", modelNumber: "HOM2040M200PC", upc: "786549871023",
    rate: 2800, cost: 1100, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 3, minQty: 1, maxQty: 10, tracking: true,
    category: "Electrical", subcategory: "Panels", type: "Equipment",
    vendor: "Graybar Electric", vendorCode: "GB-HOM2040", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
  {
    id: 1005, active: true, name: "General Labor - Technician",
    description: "Standard technician labor rate per hour",
    salesDescription: "Technician labor (hourly)",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 95, cost: 45, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Labor", subcategory: "Technician", type: "Labor",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4200 · Labor Revenue",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: false,
  },
  {
    id: 1006, active: true, name: "Drain Cleaning Service",
    description: "Standard drain cleaning and snaking",
    salesDescription: "Professional drain cleaning service",
    additionalInfo: "", brand: "", modelNumber: "", upc: "",
    rate: 175, cost: 40, taxable: false, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "Plumbing", subcategory: "Maintenance", type: "Maintenance",
    vendor: "", vendorCode: "", department: "Field Service",
    cogsGL: "", salesGL: "4000 · Service Revenue",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: true,
  },
  {
    id: 1007, active: true, name: "Thermostat - Smart WiFi",
    description: "Smart thermostat with WiFi connectivity",
    salesDescription: "Smart WiFi Thermostat — professional installation included",
    additionalInfo: "Compatible with most HVAC systems", brand: "Ecobee", modelNumber: "EB-STATE5-01", upc: "854239006800",
    rate: 450, cost: 180, taxable: true, tax1: true, tax2: false, tax3: false,
    onHand: 18, minQty: 3, maxQty: 40, tracking: true,
    category: "HVAC", subcategory: "Controls", type: "Inventory Item",
    vendor: "Ecobee Direct", vendorCode: "EC-STATE501", department: "Equipment",
    cogsGL: "5000 · Cost of Goods", salesGL: "4100 · Equipment Sales",
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: true, booking: false,
  },
];

const initialGroups: ItemGroup[] = [
  { id: 1, name: "HVAC Full Install Package", description: "Complete HVAC install bundle including unit, labor and thermostat", groupType: "Bundle", category: "HVAC", items: [1001, 1005, 1007], active: true, total: 7495 },
  { id: 2, name: "Plumbing Emergency Kit", description: "Emergency plumbing service items", groupType: "Individual items", category: "Plumbing", items: [1003, 1006], active: true, total: 193.50 },
];

const initialCategories: ItemCategory[] = [
  { id: 1, name: "HVAC", description: "Heating, ventilation, and air conditioning", parentCategory: "", activeItems: 4, active: true },
  { id: 2, name: "Plumbing", description: "Plumbing services and materials", parentCategory: "", activeItems: 2, active: true },
  { id: 3, name: "Electrical", description: "Electrical services and equipment", parentCategory: "", activeItems: 1, active: true },
  { id: 4, name: "Labor", description: "General labor charges", parentCategory: "", activeItems: 1, active: true },
];

const initialBrands: ItemBrand[] = [
  { id: 1, name: "Carrier", description: "Premium HVAC manufacturer" },
  { id: 2, name: "Trane", description: "Commercial and residential HVAC" },
  { id: 3, name: "Lennox", description: "High-efficiency heating and cooling" },
  { id: 4, name: "Ecobee", description: "Smart home thermostats" },
  { id: 5, name: "Square D", description: "Electrical distribution equipment" },
];

const initialCatalogs: Catalog[] = [
  { id: 1, name: "Plumbing Price Guide 2026", description: "Complete plumbing services and materials catalog", itemCount: 2, active: true },
  { id: 2, name: "HVAC Equipment Catalog", description: "All HVAC units, parts and accessories", itemCount: 4, active: true },
];

// ─── Type badge helper ────────────────────────────────────────────────────────
function getTypeBadgeClass(type: ItemType): string {
  const serviceTypes: ItemType[] = ["Service", "Labor", "Maintenance", "Diagnostics", "Installation", "Repair"];
  const materialTypes: ItemType[] = ["Inventory Item", "Non-Inventory Item", "Serialized Item"];
  const equipmentTypes: ItemType[] = ["Equipment", "Asset"];
  const feeTypes: ItemType[] = [
    "Fee / Admin Code", "Discount", "Other Charge",
    "Material Markup", "Labor Markup", "Other Markup",
    "Material Discount", "Labor Discount", "Other Discount",
  ];
  if (serviceTypes.includes(type)) return "bg-[#EBF0F8] text-[#4A6FA5]";
  if (materialTypes.includes(type)) return "bg-[#D1FAE5] text-[#16A34A]";
  if (equipmentTypes.includes(type)) return "bg-[#FEF3C7] text-[#D97706]";
  if (feeTypes.includes(type)) return "bg-[#EDE9FE] text-[#7C3AED]";
  if (type === "Bundle / Kit") return "bg-[#CCFBF1] text-[#0D9488]";
  if (type === "Expense / Reimbursement") return "bg-[#FFEDD5] text-[#EA580C]";
  return "bg-[#F3F4F6] text-[#6B7280]";
}

// ─── Helper Components ───────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#4A6FA5]" : "bg-[#D1D5DB]"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

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

function Pagination({ total, perPage, page, onPageChange, onPerPageChange }: {
  total: number; perPage: number; page: number;
  onPageChange: (p: number) => void; onPerPageChange: (pp: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC]">
      <span className="text-[13px] text-[#546478]">
        Showing {from} to {to} of {total} results
      </span>
      <div className="flex items-center gap-4">
        <select
          value={perPage}
          onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="px-2 py-1 border border-[#DDE3EE] rounded text-[13px] bg-white"
        >
          {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30"
          >
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_left</span>
          </button>
          <span className="text-[13px] text-[#1A2332] min-w-[80px] text-center" style={{ fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5] disabled:opacity-30"
          >
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function Items() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("items");

  // Items state
  const [items, setItems] = useState<Item[]>(initialItems);
  const [itemSearch, setItemSearch] = useState("");
  const [itemFilter, setItemFilter] = useState("All");
  const [itemSort, setItemSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [itemPage, setItemPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Groups state
  const [groups, setGroups] = useState<ItemGroup[]>(initialGroups);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);

  // Categories state
  const [categories, setCategories] = useState<ItemCategory[]>(initialCategories);
  const [catSearch, setCatSearch] = useState("");
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ItemCategory | null>(null);

  // Brands state
  const [brands, setBrands] = useState<ItemBrand[]>(initialBrands);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ItemBrand | null>(null);

  // Catalogs state
  const [catalogs, setCatalogs] = useState<Catalog[]>(initialCatalogs);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);

  // ─── Items Logic ─────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.active);
    if (itemFilter !== "All") result = result.filter(i => i.category === itemFilter);
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.modelNumber.toLowerCase().includes(q) ||
        String(i.id).includes(q)
      );
    }
    result.sort((a, b) => {
      const k = itemSort.key as keyof Item;
      const av = a[k], bv = b[k];
      if (typeof av === "number" && typeof bv === "number") return itemSort.dir === "asc" ? av - bv : bv - av;
      return itemSort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return result;
  }, [items, itemFilter, itemSearch, itemSort]);

  const paginatedItems = filteredItems.slice((itemPage - 1) * itemPerPage, itemPage * itemPerPage);
  const allItemsSelected = paginatedItems.length > 0 && paginatedItems.every(i => selectedItems.has(i.id));
  const uniqueCategories = [...new Set(items.map(i => i.category))];

  const handleSortItems = (key: string) => {
    setItemSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  };

  const SortIcon = ({ col }: { col: string }) => (
    itemSort.key === col ? (
      <span className="material-icons text-[#4A6FA5] ml-0.5" style={{ fontSize: "14px" }}>
        {itemSort.dir === "asc" ? "arrow_upward" : "arrow_downward"}
      </span>
    ) : null
  );

  // ─── Tab content descriptions ────────────────────────────────────────
  const tabDescriptions: Record<TabKey, string> = {
    items: "Manage your catalog of services, products, equipment, and labor rates.",
    groups: "Item groups help you add multiple items to invoices and estimates.",
    categories: "Item categories help manage and streamline your items, making it easy to navigate your catalog.",
    brands: "Manage brands associated with your products and equipment.",
    catalogs: "Organize your items into catalogs for different use cases.",
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "items", label: "Items & Products" },
    { key: "groups", label: "Item Groups" },
    { key: "categories", label: "Item Categories" },
    { key: "brands", label: "Item Brands" },
    { key: "catalogs", label: "Catalogs" },
  ];

  // ─── Export mock ─────────────────────────────────────────────────────
  const handleExport = () => {
    alert("Export functionality — CSV/Google Sheets export will be available with backend integration.");
  };

  const tabRecordCounts: Record<TabKey, number> = {
    items: filteredItems.length,
    groups: groups.filter(g => !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase())).length,
    categories: categories.filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())).length,
    brands: brands.filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())).length,
    catalogs: catalogs.filter(c => !catalogSearch || c.name.toLowerCase().includes(catalogSearch.toLowerCase())).length,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="p-8 bg-[#F5F7FA] min-h-full">
      {/* Page Header */}
      <PageHeader
        title="Items"
        count={`${tabRecordCounts[activeTab]} records`}
        actions={
          <>
            <button
              onClick={() => {
                if (activeTab === "items") { setEditingItem(null); setItemModalOpen(true); }
                else if (activeTab === "groups") { setEditingGroup(null); setGroupModalOpen(true); }
                else if (activeTab === "categories") { setEditingCat(null); setCatModalOpen(true); }
              }}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              {activeTab === "items" && "Create Item"}
              {activeTab === "groups" && "Create Group"}
              {activeTab === "categories" && "Create Category"}
              {activeTab !== "items" && activeTab !== "groups" && activeTab !== "categories" && "Create"}
            </button>
            <KebabMenu triggerClassName="w-9 h-9 border border-[#DDE3EE] rounded-lg bg-white">
              <KebabItem icon="file_upload" onClick={() => alert("Import functionality — CSV/Google Sheets import will be available with backend integration.")}>Import</KebabItem>
              <KebabItem icon="file_download" onClick={() => handleExport()}>Export</KebabItem>
              <KebabSeparator />
              <KebabItem icon="view_column">Edit Columns</KebabItem>
              <KebabItem icon="content_copy">Manage Duplicates</KebabItem>
            </KebabMenu>
          </>
        }
      />

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-6">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-[#4A6FA5]"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ ITEMS & PRODUCTS TAB ═══════════════ */}
      {activeTab === "items" && (
        <div>
          {/* Search + Filter bar */}
          <div className="bg-white border border-[#DDE3EE] rounded-t-lg">
            <div className="flex items-center justify-between p-3 border-b border-[#DDE3EE]">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>{filteredItems.length} results</span>
                <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Category:</span>
                <select
                  value={itemFilter}
                  onChange={(e) => { setItemFilter(e.target.value); setItemPage(1); }}
                  className="px-3 py-1.5 border border-[#DDE3EE] rounded-lg text-[13px] bg-white min-w-[160px] focus:outline-none focus:border-[#4A6FA5]"
                >
                  <option value="All">All Categories</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="relative w-[260px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input
                  type="text"
                  placeholder="Search"
                  value={itemSearch}
                  onChange={(e) => { setItemSearch(e.target.value); setItemPage(1); }}
                  className="w-full h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </div>
            </div>

            {/* Bulk actions */}
            <SelectionBar
              count={selectedItems.size}
              onDeselect={() => setSelectedItems(new Set())}
              onDelete={() => {
                if (confirm(`Delete ${selectedItems.size} item(s)?`)) {
                  setItems(prev => prev.filter(i => !selectedItems.has(i.id)));
                  setSelectedItems(new Set());
                }
              }}
            />

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allItemsSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItems(new Set(paginatedItems.map(i => i.id)));
                          else setSelectedItems(new Set());
                        }}
                        className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                      />
                    </th>
                    {[
                      { key: "id", label: "Id", w: "w-[70px]", sortable: true },
                      { key: "name", label: "Name", w: "min-w-[200px]", sortable: true },
                      { key: "type", label: "Type", w: "w-[160px]", sortable: true },
                      { key: "category", label: "Category", w: "w-[110px]", sortable: true },
                      { key: "subcategory", label: "Subcategory", w: "w-[120px]", sortable: true },
                      { key: "rate", label: "Retail Price", w: "w-[110px]", sortable: true },
                      { key: "cost", label: "Cost", w: "w-[90px]", sortable: true },
                      { key: "onHand", label: "On Hand", w: "w-[90px]", sortable: true },
                      { key: "taxable", label: "Taxable", w: "w-[80px]", sortable: true },
                    ].map(col => (
                      <th
                        key={col.key}
                        className={`px-3 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${col.sortable ? "cursor-pointer hover:text-[#1A2332]" : ""} select-none ${col.w}`}
                        style={{ fontWeight: 600 }}
                        onClick={() => { if (col.sortable) handleSortItems(col.key); }}
                      >
                        <div className="flex items-center">
                          {col.label}
                          {col.sortable && <SortIcon col={col.key} />}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 w-[80px]" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-16 text-center">
                        <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>inventory_2</span>
                        <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items found</div>
                        <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your search or filters</div>
                      </td>
                    </tr>
                  ) : paginatedItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] transition-colors ${
                        selectedItems.has(item.id) ? "bg-[#EBF0F8]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => {
                            const s = new Set(selectedItems);
                            e.target.checked ? s.add(item.id) : s.delete(item.id);
                            setSelectedItems(s);
                          }}
                          className="w-4 h-4 rounded border-[#DDE3EE] cursor-pointer accent-[#4A6FA5]"
                        />
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#546478]">{item.id}</td>
                      <td className="px-3 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                        <button onClick={() => navigate(`/items/${item.id}`)} className="truncate max-w-[220px] text-left hover:text-[#4A6FA5] hover:underline">{item.name}</button>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap ${getTypeBadgeClass(item.type)}`} style={{ fontWeight: 600 }}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#546478]">{item.category || "—"}</td>
                      <td className="px-3 py-3 text-[13px] text-[#546478]">{item.subcategory || "—"}</td>
                      <td className="px-3 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${item.rate.toFixed(2)}</td>
                      <td className="px-3 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${item.cost.toFixed(2)}</td>
                      <td className="px-3 py-3 text-[13px] text-[#546478] text-center">{item.onHand}</td>
                      <td className="px-3 py-3 text-[13px] text-[#546478]">{item.taxable ? "Yes" : "No"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => { setEditingItem(item); setItemModalOpen(true); }}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5]"
                            title="Edit"
                          >
                            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: "item", id: item.id, name: item.name })}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2]"
                            title="Delete"
                          >
                            <span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              total={filteredItems.length}
              perPage={itemPerPage}
              page={itemPage}
              onPageChange={setItemPage}
              onPerPageChange={setItemPerPage}
            />
          </div>
        </div>
      )}

      {/* ═══════════════ ITEM GROUPS TAB ═══════════════ */}
      {activeTab === "groups" && (
        <div>
          <div className="bg-white border border-[#DDE3EE] rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-[#DDE3EE]">
              <div className="relative w-[260px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input type="text" placeholder="Search" value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Name</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Description</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Items</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Group Type</th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Total</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Category</th>
                  <th className="px-4 py-3 w-[80px]" />
                </tr>
              </thead>
              <tbody>
                {groups.filter(g => !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No Records Found</td></tr>
                ) : groups.filter(g => !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase())).map((g, idx) => (
                  <tr key={g.id} className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] ${idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{g.name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]"><div className="truncate max-w-[220px]">{g.description}</div></td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{g.items.length}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{g.groupType}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${g.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{g.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => { setEditingGroup(g); setGroupModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5]"><span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span></button>
                        <button onClick={() => setDeleteConfirm({ type: "group", id: g.id, name: g.name })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2]"><span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ ITEM CATEGORIES TAB ═══════════════ */}
      {activeTab === "categories" && (
        <div>
          <div className="bg-white border border-[#DDE3EE] rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-[#DDE3EE]">
              <div className="relative w-[260px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input type="text" placeholder="Search" value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Name</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Description</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Parent Category</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>No. of Active Items</th>
                  <th className="px-4 py-3 w-[100px] text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No Records Found</td></tr>
                ) : categories.filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())).map((c, idx) => (
                  <tr key={c.id} className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] ${idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{c.description}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{c.parentCategory || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332] text-center" style={{ fontWeight: 500 }}>{c.activeItems}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => { setEditingCat(c); setCatModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5]"><span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span></button>
                        <button onClick={() => setDeleteConfirm({ type: "category", id: c.id, name: c.name })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2]"><span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ ITEM BRANDS TAB ═══════════════ */}
      {activeTab === "brands" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => { setEditingBrand(null); setBrandModalOpen(true); }}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              Create Brand
            </button>
          </div>

          <div className="bg-white border border-[#DDE3EE] rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-[#DDE3EE]">
              <div className="relative w-[260px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input type="text" placeholder="Search" value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Name</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Description</th>
                  <th className="px-4 py-3 w-[100px] text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-12 text-center text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No Records Found</td></tr>
                ) : brands.filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())).map((b, idx) => (
                  <tr key={b.id} className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] ${idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{b.name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{b.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => { setEditingBrand(b); setBrandModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5]"><span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span></button>
                        <button onClick={() => setDeleteConfirm({ type: "brand", id: b.id, name: b.name })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2]"><span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ CATALOGS TAB ═══════════════ */}
      {activeTab === "catalogs" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => { setEditingCatalog(null); setCatalogModalOpen(true); }}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-2 shadow-sm"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              Create Catalog
            </button>
          </div>

          <div className="bg-white border border-[#DDE3EE] rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-[#DDE3EE]">
              <div className="relative w-[260px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input type="text" placeholder="Search" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Name</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Description</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Items</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Status</th>
                  <th className="px-4 py-3 w-[100px] text-center text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogs.filter(c => !catalogSearch || c.name.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No Records Found</td></tr>
                ) : catalogs.filter(c => !catalogSearch || c.name.toLowerCase().includes(catalogSearch.toLowerCase())).map((c, idx) => (
                  <tr key={c.id} className={`border-b border-[#EDF0F5] hover:bg-[#F9FBFD] ${idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="px-4 py-3 text-[13px] text-[#546478]">{c.description}</td>
                    <td className="px-4 py-3 text-[13px] text-[#1A2332] text-center" style={{ fontWeight: 500 }}>{c.itemCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${c.active ? "bg-[#D1FAE5] text-[#16A34A]" : "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 600 }}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => { setEditingCatalog(c); setCatalogModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#EDF0F5]"><span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span></button>
                        <button onClick={() => setDeleteConfirm({ type: "catalog", id: c.id, name: c.name })} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2]"><span className="material-icons text-[#DC2626]" style={{ fontSize: "18px" }}>delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* ── Item Modal ── */}
      {itemModalOpen && (
        <ItemModal
          item={editingItem}
          categories={uniqueCategories}
          brands={brands}
          groups={groups}
          onClose={() => setItemModalOpen(false)}
          onSave={(item) => {
            if (editingItem) {
              setItems(prev => prev.map(i => i.id === item.id ? item : i));
            } else {
              setItems(prev => [...prev, { ...item, id: Math.max(...prev.map(i => i.id), 999) + 1 }]);
            }
            setItemModalOpen(false);
          }}
        />
      )}

      {/* ── Group Modal ── */}
      {groupModalOpen && (
        <GroupModal
          group={editingGroup}
          items={items}
          categories={uniqueCategories}
          onClose={() => setGroupModalOpen(false)}
          onSave={(group) => {
            if (editingGroup) {
              setGroups(prev => prev.map(g => g.id === group.id ? group : g));
            } else {
              setGroups(prev => [...prev, { ...group, id: Math.max(...prev.map(g => g.id), 0) + 1 }]);
            }
            setGroupModalOpen(false);
          }}
        />
      )}

      {/* ── Category Modal ── */}
      {catModalOpen && (
        <CategoryModal
          category={editingCat}
          categories={categories}
          onClose={() => setCatModalOpen(false)}
          onSave={(cat) => {
            if (editingCat) {
              setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
            } else {
              setCategories(prev => [...prev, { ...cat, id: Math.max(...prev.map(c => c.id), 0) + 1, activeItems: 0 }]);
            }
            setCatModalOpen(false);
          }}
        />
      )}

      {/* ── Brand Modal ── */}
      {brandModalOpen && (
        <BrandModal
          brand={editingBrand}
          onClose={() => setBrandModalOpen(false)}
          onSave={(brand) => {
            if (editingBrand) {
              setBrands(prev => prev.map(b => b.id === brand.id ? brand : b));
            } else {
              setBrands(prev => [...prev, { ...brand, id: Math.max(...prev.map(b => b.id), 0) + 1 }]);
            }
            setBrandModalOpen(false);
          }}
        />
      )}

      {/* ── Catalog Modal ── */}
      {catalogModalOpen && (
        <CatalogModal
          catalog={editingCatalog}
          onClose={() => setCatalogModalOpen(false)}
          onSave={(catalog) => {
            if (editingCatalog) {
              setCatalogs(prev => prev.map(c => c.id === catalog.id ? catalog : c));
            } else {
              setCatalogs(prev => [...prev, { ...catalog, id: Math.max(...prev.map(c => c.id), 0) + 1 }]);
            }
            setCatalogModalOpen(false);
          }}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <ModalBackdrop onClose={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>warning</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Delete {deleteConfirm.type}?</h3>
            </div>
            <p className="text-[14px] text-[#546478] mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  const { type, id } = deleteConfirm;
                  if (type === "item") setItems(prev => prev.filter(i => i.id !== id));
                  else if (type === "group") setGroups(prev => prev.filter(g => g.id !== id));
                  else if (type === "category") setCategories(prev => prev.filter(c => c.id !== id));
                  else if (type === "brand") setBrands(prev => prev.filter(b => b.id !== id));
                  else if (type === "catalog") setCatalogs(prev => prev.filter(c => c.id !== id));
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]"
                style={{ fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ITEM MODAL ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ItemModal({ item, categories, brands, groups, onClose, onSave }: {
  item: Item | null;
  categories: string[];
  brands: ItemBrand[];
  groups: ItemGroup[];
  onClose: () => void;
  onSave: (item: Item) => void;
}) {
  const blankItem: Item = {
    id: 0, active: true, name: "", description: "", salesDescription: "", additionalInfo: "",
    brand: "", modelNumber: "", upc: "",
    rate: 0, cost: 0, taxable: true, tax1: false, tax2: false, tax3: false,
    onHand: 0, minQty: 0, maxQty: 0, tracking: false,
    category: "", subcategory: "", type: "Service",
    vendor: "", vendorCode: "", department: "",
    cogsGL: "", salesGL: "",
    customField1: "", customField2: "", customField3: "",
    notes: "", boldPrint: false, group: "", defaultQty: 1, picture: "", inventory: false, booking: false,
  };

  const [form, setForm] = useState<Item>(item || blankItem);
  const update = (field: keyof Item, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[780px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{item ? "Edit Item" : "Add New Item"}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Toggle checked={form.active} onChange={(v) => update("active", v)} />
              <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Active</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Basic Info ── */}
          <SectionHeader label="Basic Info" />
          <div className="space-y-4">
            {/* Name + Bold toggle inline */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <FieldGroup label="Name" required>
                  <input
                    type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                    placeholder="Item name"
                    className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    spellCheck
                  />
                </FieldGroup>
              </div>
              <div className="flex items-center gap-2 pt-7 shrink-0">
                <Toggle checked={form.boldPrint} onChange={(v) => update("boldPrint", v)} />
                <span className="text-[13px] text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 500 }}>Bold When Printed on J-I-E</span>
              </div>
            </div>

            <FieldGroup label="Description (internal)">
              <textarea
                value={form.description} onChange={(e) => update("description", e.target.value)}
                placeholder="Internal description (not shown to customers)"
                className="w-full min-h-[72px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]"
                spellCheck
              />
            </FieldGroup>

            <FieldGroup label="Sales Description">
              <textarea
                value={form.salesDescription} onChange={(e) => update("salesDescription", e.target.value)}
                placeholder="Customer-facing description"
                className="w-full min-h-[72px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]"
                spellCheck
              />
            </FieldGroup>

            <FieldGroup label="Additional Information">
              <textarea
                value={form.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)}
                placeholder="Additional details (optional)"
                className="w-full min-h-[72px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]"
                spellCheck
              />
            </FieldGroup>
            <FieldGroup label="Picture (URL)">
              <input
                type="text" value={form.picture} onChange={(e) => update("picture", e.target.value)}
                placeholder="Image URL or file path (optional)"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
          </div>

          {/* ── Type & Classification ── */}
          <SectionHeader label="Type & Classification" />
          <div className="space-y-4">
            <FieldGroup label="Item Type">
              <select
                value={form.type} onChange={(e) => update("type", e.target.value as ItemType)}
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
              >
                <optgroup label="Service">
                  <option value="Service">Service</option>
                  <option value="Labor">Labor</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Installation">Installation</option>
                  <option value="Repair">Repair</option>
                </optgroup>
                <optgroup label="Material">
                  <option value="Inventory Item">Inventory Item</option>
                  <option value="Non-Inventory Item">Non-Inventory Item</option>
                  <option value="Serialized Item">Serialized Item</option>
                </optgroup>
                <optgroup label="Equipment &amp; Asset">
                  <option value="Equipment">Equipment</option>
                  <option value="Asset">Asset</option>
                </optgroup>
                <optgroup label="Fee">
                  <option value="Fee / Admin Code">Fee / Admin Code</option>
                  <option value="Discount">Discount</option>
                  <option value="Other Charge">Other Charge</option>
                  <option value="Material Markup">Material Markup</option>
                  <option value="Labor Markup">Labor Markup</option>
                  <option value="Other Markup">Other Markup</option>
                  <option value="Material Discount">Material Discount</option>
                  <option value="Labor Discount">Labor Discount</option>
                  <option value="Other Discount">Other Discount</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Bundle / Kit">Bundle / Kit</option>
                  <option value="Expense / Reimbursement">Expense / Reimbursement</option>
                </optgroup>
              </select>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Category">
                <select
                  value={form.category} onChange={(e) => update("category", e.target.value)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                >
                  <option value="">Choose category (optional)</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Subcategory">
                <input
                  type="text" value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)}
                  placeholder="Subcategory (optional)"
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Mfg.">
                <select
                  value={form.brand} onChange={(e) => update("brand", e.target.value)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                >
                  <option value="">Select manufacturer (optional)</option>
                  {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Department">
                <input
                  type="text" value={form.department} onChange={(e) => update("department", e.target.value)}
                  placeholder="e.g. Field Service"
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Group">
              <select
                value={form.group} onChange={(e) => update("group", e.target.value)}
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
              >
                <option value="">No group (optional)</option>
                {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </FieldGroup>
          </div>

          {/* ── Pricing & Tax ── */}
          <SectionHeader label="Pricing & Tax" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="Retail Price ($)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[14px]">$</span>
                  <input
                    type="number" min="0" step="0.01" value={form.rate || ""}
                    onChange={(e) => update("rate", parseFloat(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
              </FieldGroup>
              <FieldGroup label="Cost ($)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[14px]">$</span>
                  <input
                    type="number" min="0" step="0.01" value={form.cost || ""}
                    onChange={(e) => update("cost", parseFloat(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
              </FieldGroup>
              <FieldGroup label="Default Qty">
                <input
                  type="number" min="0" step="1" value={form.defaultQty || ""}
                  onChange={(e) => update("defaultQty", parseInt(e.target.value) || 1)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </FieldGroup>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Taxable</div>
                <div className="text-[12px] text-[#8899AA]">Apply tax to this item</div>
              </div>
              <Toggle checked={form.taxable} onChange={(v) => update("taxable", v)} />
            </div>

            <div className="flex items-center gap-6">
              {(["tax1", "tax2", "tax3"] as const).map((field, i) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field]}
                    onChange={(e) => update(field, e.target.checked)}
                    className="w-4 h-4 rounded border-[#DDE3EE] accent-[#4A6FA5] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Tax {i + 1}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Inventory ── */}
          <SectionHeader label="Inventory" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="On Hand">
                <input
                  type="number" min="0" value={form.onHand || ""}
                  onChange={(e) => update("onHand", parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
              <FieldGroup label="Min Qty">
                <input
                  type="number" min="0" value={form.minQty || ""}
                  onChange={(e) => update("minQty", parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
              <FieldGroup label="Max Qty">
                <input
                  type="number" min="0" value={form.maxQty || ""}
                  onChange={(e) => update("maxQty", parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="UPC">
                <input
                  type="text" value={form.upc} onChange={(e) => update("upc", e.target.value)}
                  placeholder="Universal Product Code"
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
              <FieldGroup label="SKU">
                <input
                  type="text" value={form.modelNumber} onChange={(e) => update("modelNumber", e.target.value)}
                  placeholder="Stock Keeping Unit / Model #"
                  className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </FieldGroup>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Tracking</div>
                <div className="text-[12px] text-[#8899AA]">Track inventory quantity for this item</div>
              </div>
              <Toggle checked={form.tracking} onChange={(v) => update("tracking", v)} />
            </div>
          </div>

          {/* ── Vendor ── */}
          <SectionHeader label="Vendor" />
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Vendor">
              <input
                type="text" value={form.vendor} onChange={(e) => update("vendor", e.target.value)}
                placeholder="Vendor name"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
            <FieldGroup label="Vendor Code">
              <input
                type="text" value={form.vendorCode} onChange={(e) => update("vendorCode", e.target.value)}
                placeholder="Vendor part / item code"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
          </div>

          {/* ── Accounting ── */}
          <SectionHeader label="Accounting" />
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="COGS G/L">
              <input
                type="text" value={form.cogsGL} onChange={(e) => update("cogsGL", e.target.value)}
                placeholder="5000 · Cost of Goods"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
            <FieldGroup label="Sales G/L">
              <input
                type="text" value={form.salesGL} onChange={(e) => update("salesGL", e.target.value)}
                placeholder="4000 · Sales Revenue"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
          </div>

          {/* ── Custom Fields ── */}
          <SectionHeader label="Custom Fields" />
          <div className="grid grid-cols-3 gap-4">
            <FieldGroup label="Custom Field 1">
              <input
                type="text" value={form.customField1} onChange={(e) => update("customField1", e.target.value)}
                placeholder="Custom field 1"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
            <FieldGroup label="Custom Field 2">
              <input
                type="text" value={form.customField2} onChange={(e) => update("customField2", e.target.value)}
                placeholder="Custom field 2"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
            <FieldGroup label="Custom Field 3">
              <input
                type="text" value={form.customField3} onChange={(e) => update("customField3", e.target.value)}
                placeholder="Custom field 3"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
              />
            </FieldGroup>
          </div>

          {/* ── Notes ── */}
          <SectionHeader label="Notes" />
          <FieldGroup label="">
            <textarea
              value={form.notes} onChange={(e) => update("notes", e.target.value)}
              placeholder="Internal notes (optional)"
              className="w-full min-h-[80px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]"
              spellCheck
            />
          </FieldGroup>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button
            onClick={() => { if (!form.name) return; onSave(form); }}
            className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── GROUP MODAL ─────────────────────────────────────────────────────────────
function GroupModal({ group, items, categories, onClose, onSave }: {
  group: ItemGroup | null; items: Item[]; categories: string[];
  onClose: () => void; onSave: (g: ItemGroup) => void;
}) {
  const [form, setForm] = useState<ItemGroup>(group || {
    id: 0, name: "", description: "", groupType: "Individual items", category: "", items: [], active: true, total: 0,
  });

  const selectedItems = items.filter(i => form.items.includes(i.id));
  const total = selectedItems.reduce((s, i) => s + i.rate, 0);

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{group ? "Edit Item Group" : "Create Item Group"}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Toggle checked={form.active} onChange={(v) => setForm(prev => ({ ...prev, active: v }))} />
              <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Enable</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <FieldGroup label="Item Group Name">
              <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Item group name"
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
            </FieldGroup>
            <FieldGroup label="Item Group Description">
              <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Item group description"
                className="w-full min-h-[80px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]" />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FieldGroup label="Group Type">
              <select value={form.groupType} onChange={(e) => setForm(prev => ({ ...prev, groupType: e.target.value as any }))}
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
              >
                <option value="Individual items">Individual items</option>
                <option value="Bundle">Bundle</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Category">
              <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
              >
                <option value="">Choose category (optional)</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldGroup>
          </div>

          <FieldGroup label="Add Items">
            <select
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id && !form.items.includes(id)) setForm(prev => ({ ...prev, items: [...prev.items, id] }));
                e.target.value = "";
              }}
              className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
            >
              <option value="">Add items</option>
              {items.filter(i => !form.items.includes(i.id)).map(i => <option key={i.id} value={i.id}>{i.name} — ${i.rate.toFixed(2)}</option>)}
            </select>
          </FieldGroup>

          {/* Items table */}
          <div className="border border-[#DDE3EE] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#DDE3EE]">
                  {["Item Name", "Price", "Cost", "Qty", "Amount", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-[#546478]" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#546478]">No items added yet</td></tr>
                ) : selectedItems.map(si => (
                  <tr key={si.id} className="border-b border-[#EDF0F5]">
                    <td className="px-3 py-2.5 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{si.name}</td>
                    <td className="px-3 py-2.5 text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>${si.rate.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${si.cost.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-[13px]">1</td>
                    <td className="px-3 py-2.5 text-[13px]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${si.rate.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter(id => id !== si.id) }))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
                        <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>close</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <div className="text-[14px] text-[#1A2332]">Total: <strong style={{ fontVariantNumeric: "tabular-nums" }}>${total.toFixed(2)}</strong></div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={() => onSave({ ...form, total })} className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── CATEGORY MODAL ──────────────────────────────────────────────────────────
function CategoryModal({ category, categories, onClose, onSave }: {
  category: ItemCategory | null; categories: ItemCategory[];
  onClose: () => void; onSave: (c: ItemCategory) => void;
}) {
  const [form, setForm] = useState<ItemCategory>(category || {
    id: 0, name: "", description: "", parentCategory: "", activeItems: 0, active: true,
  });

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{category ? "Edit Category" : "Create New Category"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <FieldGroup label="Category Name" required>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Category name"
              className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>

          <FieldGroup label="Parent Category">
            <select value={form.parentCategory} onChange={(e) => setForm(prev => ({ ...prev, parentCategory: e.target.value }))}
              className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
            >
              <option value="">Choose parent category (optional)</option>
              {categories.filter(c => c.id !== form.id).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </FieldGroup>

          <FieldGroup label="Category Description">
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Category description (optional)"
              className="w-full min-h-[100px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Enable Category</div>
              <div className="text-[12px] text-[#8899AA]">Turning this off will also disable all subcategories, item groups, and items within this category</div>
            </div>
            <Toggle checked={form.active} onChange={(v) => setForm(prev => ({ ...prev, active: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { if (!form.name) return; onSave(form); }} className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── BRAND MODAL ─────────────────────────────────────────────────────────────
function BrandModal({ brand, onClose, onSave }: {
  brand: ItemBrand | null; onClose: () => void; onSave: (b: ItemBrand) => void;
}) {
  const [form, setForm] = useState<ItemBrand>(brand || { id: 0, name: "", description: "" });

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{brand ? "Edit Brand" : "Create New Brand"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <FieldGroup label="Brand Name" required>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Brand name"
              className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>
          <FieldGroup label="Description">
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description"
              className="w-full min-h-[100px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { if (!form.name) return; onSave(form); }} className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── CATALOG MODAL ───────────────────────────────────────────────────────────
function CatalogModal({ catalog, onClose, onSave }: {
  catalog: Catalog | null; onClose: () => void; onSave: (c: Catalog) => void;
}) {
  const [form, setForm] = useState<Catalog>(catalog || { id: 0, name: "", description: "", itemCount: 0, active: true });

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{catalog ? "Edit Catalog" : "Create Catalog"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <FieldGroup label="Catalog Name" required>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Catalog name"
              className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>
          <FieldGroup label="Description">
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description"
              className="w-full min-h-[100px] px-3 py-2 border border-[#DDE3EE] rounded-lg text-[14px] resize-y focus:outline-none focus:border-[#4A6FA5]" />
          </FieldGroup>
          <div className="flex items-center justify-between py-1">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Active</div>
            <Toggle checked={form.active} onChange={(v) => setForm(prev => ({ ...prev, active: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { if (!form.name) return; onSave(form); }} className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 500 }}>
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[12px] uppercase tracking-wider text-[#546478] shrink-0" style={{ fontWeight: 700 }}>{label}</span>
      <div className="flex-1 h-px bg-[#DDE3EE]" />
    </div>
  );
}
