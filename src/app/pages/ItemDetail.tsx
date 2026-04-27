import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";

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
  category: string; subcategory: string; type: ItemType;
  vendor: string; vendorCode: string; department: string;
  cogsGL: string; salesGL: string;
  customField1: string; customField2: string; customField3: string;
  notes: string; boldPrint: boolean;
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: false, booking: false,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: true, booking: false,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: true, booking: false,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: false, booking: true,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: true, booking: false,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: false, booking: false,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: false, booking: true,
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
    customField1: "", customField2: "", customField3: "", notes: "",
    boldPrint: false, inventory: true, booking: false,
  },
};

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
  const item = mockItems[id || "1000"] || mockItems["1000"];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const margin = item.rate > 0 ? ((item.rate - item.cost) / item.rate * 100) : 0;

  const renderDetailsTab = () => (
    <div className="flex gap-4 items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Row 1: Item Info + Type & Classification */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Item Info" onEdit={() => {}}>
            <div className="flex flex-col gap-4">
              <Field label="Description (Internal)" value={item.description} />
              <Field label="Sales Description" value={item.salesDescription} />
              {item.additionalInfo && <Field label="Additional Information" value={item.additionalInfo} />}
              {item.boldPrint && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>format_bold</span>
                  <span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>Bold when printed on J-I-E</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Type & Classification" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Item Type</div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${getTypeBadgeClass(item.type)}`} style={{ fontWeight: 600 }}>
                    {item.type}
                  </span>
                </div>
              </div>
              <Field label="Category" value={item.category} />
              <Field label="Subcategory" value={item.subcategory} />
              <Field label="Mfg." value={item.brand} />
              <Field label="Department" value={item.department} />
            </div>
          </Card>
        </div>

        {/* Row 2: Pricing & Tax + Inventory */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Pricing & Tax" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Retail Price</div>
                <div className="text-[15px] text-[#16A34A] leading-[22px]" style={{ fontWeight: 600 }}>
                  ${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Cost</div>
                <div className="text-[15px] text-[#374151] leading-[22px]" style={{ fontWeight: 500 }}>
                  ${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <Field label="Taxable" value={item.taxable ? "Yes" : "No"} />
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Tax</div>
                <div className="text-[13px] text-[#374151]">
                  {[item.tax1 && "Tax 1", item.tax2 && "Tax 2", item.tax3 && "Tax 3"].filter(Boolean).join(", ") || "—"}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Inventory" onEdit={() => {}}>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">On Hand</div>
                <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 600 }}>{item.onHand}</div>
              </div>
              <Field label="Min Qty" value={item.minQty || "—"} />
              <Field label="Max Qty" value={item.maxQty || "—"} />
              <Field label="SKU" value={item.modelNumber} />
              <Field label="UPC" value={item.upc} />
              <Field label="Tracking" value={item.tracking ? "Yes" : "No"} />
            </div>
          </Card>
        </div>

        {/* Row 3: Vendor + Accounting */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Vendor" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor" value={item.vendor} />
              <Field label="Vendor Code" value={item.vendorCode} />
            </div>
          </Card>

          <Card title="Accounting" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="COGS G/L" value={item.cogsGL} />
              <Field label="Sales G/L" value={item.salesGL} />
            </div>
          </Card>
        </div>

        {/* Row 4: Custom Fields (only if any filled) */}
        {(item.customField1 || item.customField2 || item.customField3) && (
          <Card title="Custom Fields" onEdit={() => {}}>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Custom Field 1" value={item.customField1} />
              <Field label="Custom Field 2" value={item.customField2} />
              <Field label="Custom Field 3" value={item.customField3} />
            </div>
          </Card>
        )}
      </div>

      {/* ── Notes Panel (right) ── */}
      <div className="w-[260px] shrink-0 bg-white border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
        </div>
        <div className="flex-1 p-3 flex flex-col gap-2">
          {item.notes ? (
            <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[12px] text-[#1A2332] leading-[18px]">{item.notes}</div>
          ) : (
            <div className="text-[12px] text-[#9CA3AF] text-center py-6">No notes yet</div>
          )}
          <button className="mt-auto flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>add</span>
            Add note
          </button>
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
      <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
      <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
      <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Back + Actions */}
        <div className="px-8 h-12 flex items-center justify-between border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/items")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Items
          </button>
          <div className="flex items-center gap-2">
            <button className="border border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5 rounded-md flex items-center justify-center">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <KebabMenu triggerClassName="h-8 w-8 border border-[#DDE3EE] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
              <KebabItem icon="content_copy">Duplicate Item</KebabItem>
              <KebabItem icon="delete" destructive>Delete Item</KebabItem>
            </KebabMenu>
          </div>
        </div>

        {/* Summary content */}
        <div className="px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-8">
            {/* Left: name + badges */}
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
                  {item.name}
                </h1>
                <span className="text-[13px] text-[#9CA3AF]">#{item.id}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] ${getTypeBadgeClass(item.type)}`} style={{ fontWeight: 600 }}>
                  {item.type}
                </span>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[11px]"
                  style={{
                    fontWeight: 600,
                    backgroundColor: item.active ? "#D1FAE5" : "#F3F4F6",
                    color: item.active ? "#16A34A" : "#6B7280",
                  }}
                >
                  {item.active ? "Active" : "Inactive"}
                </span>
                {item.category && (
                  <span className="text-[12px] text-[#6B7280]">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}</span>
                )}
                {item.brand && (
                  <span className="text-[12px] text-[#6B7280]">Mfg: {item.brand}</span>
                )}
              </div>
            </div>

            {/* Right: key stats */}
            <div className="flex items-center gap-8 border-l border-[#E5E7EB] pl-8">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Retail Price</div>
                <div className="text-[18px] text-[#16A34A] leading-[28px]" style={{ fontWeight: 600 }}>
                  ${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Cost</div>
                <div className="text-[18px] text-[#374151] leading-[28px]" style={{ fontWeight: 500 }}>
                  ${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Margin</div>
                <div
                  className="text-[18px] leading-[28px]"
                  style={{ fontWeight: 600, color: margin >= 0 ? "#16A34A" : "#DC2626" }}
                >
                  {margin.toFixed(1)}%
                </div>
              </div>
              {item.tracking && (
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">On Hand</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 600 }}>
                    {item.onHand}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white sticky top-0 z-30 border-b border-[#E5E7EB]">
        <div className="flex items-center px-6">
          {TABS.map(({ key, label }) => (
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

      {/* ── CONTENT ── */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 space-y-4 bg-[#F5F7FA]">
        {activeTab === "details" ? renderDetailsTab() : renderActivityTab()}
      </main>
    </div>
  );
}
