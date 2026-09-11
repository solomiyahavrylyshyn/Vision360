// Catalog store — the single source of truth for items offered in the
// Estimate / Job "Select item from catalog" pickers. The Items module mirrors
// its create / edit / delete into this store so an item created there shows up
// immediately in those pickers. localStorage-backed so it survives refresh.

import type { CatalogItem } from "../components/ItemPicker";
import { rollUpBreakdown, type ItemGroupMember } from "../utils/itemCost";
import { createApiSync } from "./apiSync";

type Listener = () => void;

// v2: one merged collection — price-book entries live here as items with
// itemType "Price Book" (Figma items canvas: "Price Book" is an item Type).
// v3: added the full AND Service Type/Category/Item Name catalog matrix
// (Service/Material/Equipment/Asset/Admin/Price Book) — bumped so existing
// browsers pick up the new seed instead of an old cached v2 snapshot.
const LS_KEY = "vision360.catalogItems.v3";

// Base catalog seed (ids align with the Items module so edits/deletes key correctly).
const BASE_SEED: CatalogItem[] = [
  { id: 1, name: "Diagnostic Visit",        itemDescription: "Standard diagnostic service call",    salesDescription: "Diagnostic visit — inspects and identifies system issues", brand: "", modelNumber: "SVC-1001", rate: 99,  cost: 0,  taxable: true, category: "Diagnostic", type: "Service",   itemType: "Service",   department: "Field Service", active: true },
  { id: 2, name: "AC Tune-Up",              itemDescription: "Annual AC maintenance and tune-up",   salesDescription: "AC tune-up — cleaning, inspection and performance check", brand: "", modelNumber: "SVC-1002", rate: 129, cost: 0,  taxable: true, category: "Maintenance", type: "Service",   itemType: "Service",   department: "Field Service", active: true },
  { id: 3, name: "R-410A Refrigerant (lb)", itemDescription: "R-410A refrigerant per pound",        salesDescription: "R-410A refrigerant recharge — per pound", brand: "", modelNumber: "MAT-2001", rate: 18,  cost: 9,  taxable: true, category: "Refrigerant", type: "Product",   itemType: "Material",  department: "Materials", vendor: "HVAC Supply Co.", active: true },
  { id: 4, name: "Capacitor 45/5 MFD",      itemDescription: "Dual run capacitor 45/5 MFD 440V",    salesDescription: "Capacitor 45/5 MFD — dual run capacitor replacement", brand: "", modelNumber: "MAT-2002", rate: 25,  cost: 12, taxable: true, category: "Parts", type: "Product",   itemType: "Material",  department: "Materials", vendor: "HVAC Supply Co.", active: true },
  { id: 5, name: "Blower Motor 1/2 HP",     itemDescription: "ECM blower motor 1/2 HP replacement", salesDescription: "Blower motor 1/2 HP — ECM variable speed", brand: "Carrier", modelNumber: "EQU-3001", rate: 225, cost: 98, taxable: true, category: "Motors", type: "Equipment", itemType: "Equipment", department: "Equipment", vendor: "Grainger", active: true },
  { id: 6, name: "Permit Fee",              itemDescription: "Administrative permit processing fee", salesDescription: "Permit fee — municipal permit filing and processing", brand: "", modelNumber: "FEE-4001", rate: 75,  cost: 0,  taxable: true, category: "Permit Fee", type: "Service",   itemType: "Admin", active: true },
  // FR-4.8 — Callback ships with "Do not show on customer documents" ON.
  { id: 7, name: "Callback",                itemDescription: "Return visit to address an issue from a previous job", salesDescription: "Callback — follow-up service visit", brand: "", modelNumber: "SVC-1003", rate: 0, cost: 0, taxable: false, category: "Repair", type: "Service", itemType: "Service", department: "Field Service", active: true, hideOnCustomerDocs: true },
];

// Price-book seed: [name, category, description, price, cost, taxable].
// Ids start at 101 to avoid clashing with the base seed.
const PB_SEED: [string, string, string, number, number, boolean][] = [
  ["AC Tune-Up (flat rate)", "Maintenance", "Comprehensive AC system tune-up and inspection", 89, 28, true],
  ["Diagnostic Fee", "Diagnostics", "System diagnostic and evaluation", 79, 0, true],
  ["Capacitor Replacement", "Repairs", "Replace run capacitor – includes labor and capacitor", 289, 108.50, true],
  ["Blower Motor Replacement", "Repairs", "Replace indoor blower motor – includes labor and motor", 649, 274, true],
  ["Drain Line Clearing", "Repairs", "Clear primary drain line", 159, 45, true],
  ["Thermostat Installation", "Installation", "Install new standard thermostat", 149, 45, true],
  ["System Installation – 3 Ton", "Installation", "Complete 3 ton system installation", 6995, 4250, true],
  ["R-410A Refrigerant (per lb)", "Materials", "R-410A refrigerant", 24, 12.50, true],
  ["Permit Fee (flat rate)", "Fees", "Local permit fee", 35, 0, true],
  ["After-Hours Service", "Fees", "After-hours service call", 125, 0, true],
  ["Annual Maintenance Plan", "Membership", "Annual HVAC maintenance membership", 299, 80, false],
  ["Filter Replacement", "Maintenance", "Replace air filter – includes filter and labor", 49, 12, true],
  ["Coil Cleaning", "Maintenance", "Evaporator and condenser coil cleaning", 199, 55, true],
  ["Refrigerant Recharge", "Repairs", "Recharge system refrigerant – up to 2 lbs", 175, 40, true],
  ["Contactor Replacement", "Repairs", "Replace contactor in condenser unit", 189, 65, true],
  ["Smart Thermostat Install", "Installation", "Install and configure smart WiFi thermostat", 249, 95, true],
  ["Duct Inspection", "Diagnostics", "Full duct system inspection and report", 129, 35, true],
  ["System Replacement – 2 Ton", "Replacement", "Full 2 ton system replacement – parts and labor", 4995, 2800, true],
  ["Duct Sealing", "Repairs", "Seal duct leaks throughout system", 349, 120, true],
  ["Emergency Service Call", "Fees", "Emergency after-hours dispatch fee", 199, 0, true],
  ["UV Light Installation", "Installation", "Install UV germicidal light in air handler", 399, 145, true],
  ["Drain Pan Treatment", "Maintenance", "Treat drain pan with algaecide tablets", 39, 8, true],
  ["Float Switch Install", "Installation", "Install safety float switch on drain pan", 89, 22, true],
  ["System Installation – 4 Ton", "Installation", "Complete 4 ton system installation", 8495, 5100, true],
  ["Heat Strip Replacement", "Repairs", "Replace electric heat strip in air handler", 375, 140, true],
  ["Expansion Valve Replacement", "Repairs", "Replace TXV expansion valve", 425, 165, true],
  ["System Tune-Up – Premium", "Maintenance", "Premium system tune-up with priority scheduling", 149, 42, true],
  ["Condenser Fan Motor", "Replacement", "Replace condenser fan motor – includes motor and labor", 485, 195, true],
  ["Ductless Mini-Split Install", "Installation", "Install single-zone ductless mini-split system", 2995, 1650, true],
  ["Membership – Silver", "Membership", "Silver tier annual maintenance membership", 199, 55, false],
  ["Membership – Gold", "Membership", "Gold tier annual membership with priority service", 349, 90, false],
  ["Pipe Insulation", "Materials", "Insulate refrigerant line set – per linear foot", 8, 2.50, true],
  ["Humidifier Installation", "Installation", "Whole-home humidifier installation", 699, 285, true],
  ["Air Purifier Install", "Installation", "Install electronic air purifier in air handler", 549, 220, true],
  ["Gas Furnace Tune-Up", "Maintenance", "Gas furnace annual inspection and tune-up", 109, 32, true],
  ["Heat Exchanger Inspection", "Diagnostics", "Inspect heat exchanger for cracks or failures", 159, 40, true],
  ["Capacitor – Dual Run", "Replacement", "Dual run capacitor replacement – standard", 169, 45, true],
  ["Condenser Coil Replacement", "Replacement", "Replace condenser coil – labor and parts", 895, 420, true],
  ["Attic Insulation – per sqft", "Custom", "Add blown-in attic insulation per square foot", 2.50, 0.80, true],
  ["Zone Damper Installation", "Installation", "Install motorized zone damper in duct", 299, 110, true],
  ["Service Agreement – 2 Year", "Membership", "Two-year service and parts agreement", 499, 130, false],
  ["System Flush", "Repairs", "Full refrigerant system flush and recharge", 325, 95, true],
];

// AND Service item catalog (full Type/Category/Item Name matrix) — [itemType, category, name, priceHint?].
// priceHint overrides the per-itemType default rate/cost below for a few notably
// priced items (Package Units, Fleet vehicles, etc.); most rows use the default.
const AND_SERVICE_SEED: [string, string, string, number?][] = [
  // Service
  ["Service", "Diagnostics", "Diagnostic Visit", 89],
  ["Service", "Diagnostics", "System Inspection", 99],
  ["Service", "Repair Labor", "Standard Repair", 140],
  ["Service", "Repair Labor", "Emergency Repair", 225],
  ["Service", "Installation Labor", "HVAC Install", 95],
  ["Service", "Installation Labor", "Duct Install", 85],
  ["Service", "Maintenance", "Tune-Up", 99],
  ["Service", "Maintenance", "Membership Visit", 0],
  ["Service", "Maintenance", "Coil Cleaning", 129],
  ["Service", "IAQ Service", "IAQ Installation", 189],
  ["Service", "IAQ Service", "IAQ Maintenance", 99],
  ["Service", "Electrical Service", "Low Voltage", 110],
  ["Service", "Electrical Service", "High Voltage", 175],
  ["Service", "Refrigeration Service", "Refrigerant Service", 135],
  // Material
  ["Material", "Refrigerant", "R-410A", 20],
  ["Material", "Refrigerant", "R-454B", 22],
  ["Material", "Copper", "Line Sets", 15],
  ["Material", "Copper", "Fittings", 6],
  ["Material", "Drain", "PVC", 9],
  ["Material", "Drain", "Condensate Pumps", 65],
  ["Material", "Electrical", "Breakers", 18],
  ["Material", "Electrical", "Disconnects", 28],
  ["Material", "Electrical", "Wire", 12],
  ["Material", "Ductwork", "Flex Duct", 14],
  ["Material", "Ductwork", "Sheet Metal", 22],
  ["Material", "Parts", "Capacitors", 25],
  ["Material", "Parts", "Contactors", 32],
  ["Material", "Parts", "Motors", 185],
  ["Material", "Parts", "Boards", 145],
  ["Material", "Parts", "Sensors", 28],
  ["Material", "Consumables", "Tape / Mastic", 8],
  ["Material", "Consumables", "Screws / Fasteners", 5],
  ["Material", "Electrical", "Blower Motor 825 RPM", 125.23],
  // Equipment
  ["Equipment", "Condensers", "Straight Cool", 1895],
  ["Equipment", "Condensers", "Heat Pump", 2450],
  ["Equipment", "Air Handlers", "Standard", 1650],
  ["Equipment", "Air Handlers", "Variable Speed", 2350],
  ["Equipment", "Furnaces", "Gas Furnace", 2895],
  ["Equipment", "Mini Splits", "Single Zone", 2200],
  ["Equipment", "Mini Splits", "Multi Zone", 3450],
  ["Equipment", "Thermostats", "Standard", 89],
  ["Equipment", "Thermostats", "Smart Thermostat", 279],
  ["Equipment", "IAQ Equipment", "UV Light", 399],
  ["Equipment", "IAQ Equipment", "Air Purifier", 549],
  ["Equipment", "Package Units", "Residential Package Unit", 4995],
  ["Equipment", "Package Units", "Commercial Package Unit", 8995],
  // Asset (company-owned — not sold; rate 0, cost = acquisition value)
  ["Asset", "Fleet", "Vans", 38000],
  ["Asset", "Fleet", "Trucks", 42000],
  ["Asset", "Fleet", "Trailers", 9500],
  ["Asset", "IT Equipment", "Laptops", 1400],
  ["Asset", "IT Equipment", "Desktops", 1100],
  ["Asset", "IT Equipment", "Tablets", 650],
  ["Asset", "IT Equipment", "Phones", 800],
  ["Asset", "Tools", "HVAC Tools", 450],
  ["Asset", "Tools", "Power Tools", 320],
  ["Asset", "Tools", "Ladders", 180],
  ["Asset", "Machines", "Shop Machines", 6500],
  ["Asset", "Machines", "Warehouse Equipment", 4200],
  ["Asset", "Office Equipment", "Printers", 350],
  ["Asset", "Office Equipment", "Furniture", 900],
  // Admin / Fees
  ["Admin", "Administrative Fee", "Permit Fee", 75],
  ["Admin", "Trip Charge", "Trip Charge", 45],
  ["Admin", "Disposal Fee", "Processing Fee", 35],
  ["Admin", "Diagnostic Fee", "Diagnostic Fee", 79],
  ["Admin", "Permit Fee", "After-Hours Fee", 125],
  ["Admin", "Credit Card Surcharge", "Financing Fee", 0],
  ["Admin", "Discount", "Coupon", 0],
  ["Admin", "Finance Charge", "Manager Discount", 0],
  ["Admin", "Late Fee", "Membership Discount", 0],
  ["Admin", "Coupon", "Warranty Deductible", 0],
  ["Admin", "Warranty", "Warranty Processing", 50],
  ["Admin", "Adjustment", "Adjustment", 0],
  ["Admin", "Deposit", "Deposit", 0],
  ["Admin", "Miscellaneous Charge", "Miscellaneous Charge", 0],
  ["Admin", "Prepaid Service Adjustment", "Prepaid Service Adjustment", 0],
];

// Default cost ratio + department/vendor per itemType, used when a row above
// doesn't need a special case.
const AND_SERVICE_DEFAULTS: Record<string, { costRatio: number; department: string; vendor?: string; taxable: boolean }> = {
  Service: { costRatio: 0, department: "Field Service", taxable: true },
  Material: { costRatio: 0.45, department: "Materials", vendor: "HVAC Supply Co.", taxable: true },
  Equipment: { costRatio: 0.42, department: "Equipment", vendor: "Grainger", taxable: true },
  Asset: { costRatio: 1, department: "Company Assets", taxable: false },
  Admin: { costRatio: 0, department: "Admin", taxable: true },
};

// A price book entry is an item group (Marek, Sep 10 call): a package of the
// labor that gets done plus the parts it consumes. The members below are what
// each entry is made of; the labor line absorbs whatever the parts do not, so a
// group's rolled-up price and cost still match the flat rate it was quoted at.
//
// Parts per entry: [name, itemType, quantity, unitPrice, unitCost]. An entry
// with no parts listed and a cost of its own gets one generic materials line;
// fees, memberships and bare materials are not packages and stay plain items.
type PbPart = [string, string, number, number, number];

const PB_PARTS: Record<string, PbPart[]> = {
  "Capacitor Replacement": [["Capacitor 45/5 MFD", "Material", 1, 25, 12]],
  "Capacitor – Dual Run": [["Capacitor 45/5 MFD", "Material", 1, 25, 12]],
  "Blower Motor Replacement": [["Blower Motor 1/2 HP", "Equipment", 1, 225, 98]],
  "Condenser Fan Motor": [["Blower Motor 1/2 HP", "Equipment", 1, 225, 98]],
  "Contactor Replacement": [["Contactors", "Material", 1, 32, 14]],
  "Thermostat Installation": [["Standard Thermostat", "Equipment", 1, 89, 37]],
  "Smart Thermostat Install": [["Smart Thermostat", "Equipment", 1, 279, 117]],
  "Refrigerant Recharge": [["R-410A Refrigerant (lb)", "Material", 2, 18, 9]],
  "System Flush": [["R-410A Refrigerant (lb)", "Material", 4, 18, 9]],
  "Filter Replacement": [["Air Filter MERV-11", "Material", 1, 18, 6]],
  "UV Light Installation": [["UV Light", "Equipment", 1, 399, 168]],
  "Air Purifier Install": [["Air Purifier", "Equipment", 1, 549, 231]],
  "Heat Strip Replacement": [["Heat Strip", "Material", 1, 140, 62]],
  "Expansion Valve Replacement": [["TXV Expansion Valve", "Material", 1, 165, 74]],
  "Condenser Coil Replacement": [["Condenser Coil", "Equipment", 1, 420, 189]],
  "Humidifier Installation": [["Whole-Home Humidifier", "Equipment", 1, 320, 148]],
  "Float Switch Install": [["Safety Float Switch", "Material", 1, 22, 9]],
  "Zone Damper Installation": [["Motorized Zone Damper", "Material", 1, 110, 48]],
  "Drain Pan Treatment": [["Algaecide Tablets", "Material", 1, 12, 4]],
  "Duct Sealing": [["Tape / Mastic", "Material", 4, 8, 3.5]],
  "System Installation – 3 Ton": [
    ["Straight Cool Condenser", "Equipment", 1, 1895, 1150],
    ["Standard Air Handler", "Equipment", 1, 1650, 980],
    ["Line Sets", "Material", 25, 15, 6.75],
    ["Permit Fee", "Admin", 1, 75, 0],
  ],
  "System Installation – 4 Ton": [
    ["Straight Cool Condenser", "Equipment", 1, 2350, 1420],
    ["Variable Speed Air Handler", "Equipment", 1, 2350, 1290],
    ["Line Sets", "Material", 30, 15, 6.75],
    ["Permit Fee", "Admin", 1, 75, 0],
  ],
  "System Replacement – 2 Ton": [
    ["Straight Cool Condenser", "Equipment", 1, 1650, 980],
    ["Standard Air Handler", "Equipment", 1, 1450, 850],
    ["Line Sets", "Material", 20, 15, 6.75],
    ["Permit Fee", "Admin", 1, 75, 0],
  ],
  "Ductless Mini-Split Install": [
    ["Single Zone Mini Split", "Equipment", 1, 2200, 1210],
    ["Line Sets", "Material", 15, 15, 6.75],
  ],
};

// Not packages: a fee is a fee, a membership is a subscription and a bare
// material is already an item of its own.
const PB_PLAIN = new Set([
  "Diagnostic Fee", "Permit Fee (flat rate)", "After-Hours Service", "Emergency Service Call",
  "Annual Maintenance Plan", "Membership – Silver", "Membership – Gold", "Service Agreement – 2 Year",
  "R-410A Refrigerant (per lb)", "Pipe Insulation", "Attic Insulation – per sqft",
]);

const r2 = (n: number) => Math.round(n * 100) / 100;

// Ids of the base catalog items, so a member points at the real item where one
// exists and the group is not just a copy of its name.
const BASE_ID_BY_NAME = new Map(BASE_SEED.map((i) => [i.name, i.id]));

function pbGroupItems(name: string, price: number, cost: number): ItemGroupMember[] | undefined {
  if (PB_PLAIN.has(name) || cost <= 0) return undefined;
  const parts: PbPart[] = PB_PARTS[name] ?? [["Parts & materials", "Material", 1, r2(price * 0.25), r2(cost * 0.4)]];
  const partsPrice = parts.reduce((s, [, , q, p]) => s + q * p, 0);
  const partsCost = parts.reduce((s, [, , q, , c]) => s + q * c, 0);
  // Whatever the parts do not account for is what the technician is paid.
  // The commission on the sale is not in here — it is a job expense.
  const laborCost = r2(cost - partsCost);
  if (laborCost <= 0) return undefined;
  const members: ItemGroupMember[] = [{
    itemId: 0,
    name: `${name} — labor`,
    itemType: "Service",
    quantity: 1,
    unitPrice: r2(price - partsPrice),
    unitCost: laborCost,
    costBreakdown: { labor: laborCost, materials: 0 },
  }];
  parts.forEach(([partName, itemType, quantity, unitPrice, unitCost]) => {
    members.push({ itemId: BASE_ID_BY_NAME.get(partName) ?? 0, name: partName, itemType, quantity, unitPrice, unitCost });
  });
  return members;
}

const SEED: CatalogItem[] = [
  ...BASE_SEED,
  ...PB_SEED.map(([name, category, description, price, cost, taxable], i) => {
    const groupItems = pbGroupItems(name, price, cost);
    return {
      id: 101 + i, name, itemDescription: description, salesDescription: description,
      brand: "", modelNumber: "", rate: price, cost, taxable, category,
      type: "Service", itemType: "Price Book", active: true,
      ...(groupItems ? { groupItems, groupPricing: "flat", costBreakdown: rollUpBreakdown(groupItems) } : {}),
    } as CatalogItem;
  }),
  // The one fully-worked Price Book example — and the worked item group (Marek,
  // Sep 10 call): a flat-rate package whose cost comes from its members, split
  // into labor and materials. The commission on this sale is not part of the
  // package; it is recorded as a Commission expense on the job.
  {
    id: 199, name: "Blower Motor Replacement — Premium", category: "Repairs",
    itemDescription: "Replacing Blower Motor 825 RPM, 1 year warranty, 90 days labor warranty, Comfort guarantee, Christmas Postcard, Chocolate Donuts",
    salesDescription: "Blower Motor Replacement — includes 1 year warranty, 90 days labor warranty, and Comfort Guarantee",
    brand: "", modelNumber: "", rate: 1457, cost: 435, taxable: true,
    type: "Service", itemType: "Price Book", active: true,
    groupPricing: "flat",
    costBreakdown: { labor: 325, materials: 110 },
    groupItems: [
      { itemId: 0, name: "Blower motor replacement — labor", itemType: "Service", quantity: 1, unitPrice: 480, unitCost: 325,
        costBreakdown: { labor: 325, materials: 0 } },
      { itemId: 5, name: "Blower Motor 1/2 HP", itemType: "Equipment", quantity: 1, unitPrice: 225, unitCost: 98 },
      { itemId: 4, name: "Capacitor 45/5 MFD", itemType: "Material", quantity: 1, unitPrice: 25, unitCost: 12 },
      { itemId: 6, name: "Permit Fee", itemType: "Admin", quantity: 1, unitPrice: 75, unitCost: 0 },
    ],
  } as CatalogItem,
  ...AND_SERVICE_SEED.map(([itemType, category, name, priceHint], i) => {
    const d = AND_SERVICE_DEFAULTS[itemType];
    const rate = priceHint ?? 0;
    const cost = itemType === "Asset" ? rate : Math.round(rate * d.costRatio * 100) / 100;
    return {
      id: 200 + i, name, category,
      itemDescription: `${name} — ${category}`, salesDescription: `${name} — ${category}`,
      brand: name === "Blower Motor 825 RPM" ? "Electrolux" : "", modelNumber: "",
      rate: itemType === "Asset" ? 0 : rate, cost, taxable: d.taxable, department: d.department,
      vendor: name === "Blower Motor 825 RPM" ? "Johnston Supply" : d.vendor,
      type: mapItemTypeToCatalog(itemType), itemType, active: true,
    } as CatalogItem;
  }),
];

let items: CatalogItem[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) items = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

// FR-4.8 migration: older cached catalogs predate the Callback seed item —
// append it so the flag showcase exists without wiping user data.
if (!items.some((i) => i.name === "Callback")) {
  const callback = SEED.find((i) => i.name === "Callback");
  if (callback) items = [...items, { ...callback, id: Math.max(0, ...items.map((i) => i.id)) + 1 }];
}

// Item-group migration: browsers cached before price book entries carried their
// members catch up seed row by seed row, so a group the user built themselves is
// left alone and their own items are never wiped.
const seededGroups = SEED.filter((i) => i.groupItems?.length);
if (seededGroups.length) {
  const cachedById = new Map(items.map((i) => [i.id, i]));
  // A cached row is re-seeded when it has no members yet, or when its members
  // still carry the commission share from before commission became a job
  // expense of its own rather than part of an item's cost.
  const hasLegacyCommission = (row: CatalogItem) =>
    !!row.groupItems?.some((m) => (m.costBreakdown as { commission?: number } | undefined)?.commission != null);
  items = items.map((i) => {
    const seed = seededGroups.find((s) => s.id === i.id);
    return seed && (!i.groupItems?.length || hasLegacyCommission(i))
      ? { ...i, cost: seed.cost, costBreakdown: seed.costBreakdown, groupItems: seed.groupItems, groupPricing: seed.groupPricing }
      : i;
  });
  const missing = seededGroups.filter((s) => !cachedById.has(s.id));
  if (missing.length) items = [...items, ...missing];
}

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* quota */ }
};

// Map the Items module's broad item type onto the picker's narrow set.
// Canonical types (Figma items canvas): Service, Material, Equipment, Asset,
// Admin, Price Book — legacy fine-grained names still map for old records.
export function mapItemTypeToCatalog(t: string): CatalogItem["type"] {
  if (t === "Labor" || t === "Labor Markup" || t === "Labor Discount") return "Labor";
  if (t === "Equipment" || t === "Asset" || t === "Assets") return "Equipment";
  if (t === "Material" || ["Inventory Item", "Non-Inventory Item", "Serialized Item"].includes(t)) return "Product";
  // Service, Admin, Price Book and anything unrecognized sell as services.
  return "Service";
}

const api = createApiSync<CatalogItem>("items", (i) => i.id);

export const itemsStore = {
  getSnapshot: (): CatalogItem[] => items,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    api.hydrate(items, (rows) => { items = rows; saveLS(); notify(); });
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  // Insert or replace by id (used by the Items module on add / edit).
  upsert: (item: CatalogItem) => {
    const idx = items.findIndex((i) => i.id === item.id);
    items = idx >= 0
      ? items.map((i) => (i.id === item.id ? item : i))
      : [...items, item];
    saveLS();
    notify();
    api.persistNew(item); // POST upserts on the server too
  },
  remove: (id: number) => {
    items = items.filter((i) => i.id !== id);
    saveLS();
    notify();
    api.persistDelete(id);
  },
  removeMany: (ids: Set<number>) => {
    items = items.filter((i) => !ids.has(i.id));
    saveLS();
    notify();
    ids.forEach((id) => api.persistDelete(id));
  },
};
