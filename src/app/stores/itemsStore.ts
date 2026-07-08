// Catalog store — the single source of truth for items offered in the
// Estimate / Job "Select item from catalog" pickers. The Items module mirrors
// its create / edit / delete into this store so an item created there shows up
// immediately in those pickers. localStorage-backed so it survives refresh.

import type { CatalogItem } from "../components/ItemPicker";

type Listener = () => void;

// v2: one merged collection — price-book entries live here as items with
// itemType "Price Book" (Figma items canvas: "Price Book" is an item Type).
const LS_KEY = "vision360.catalogItems.v2";

// Base catalog seed (ids align with the Items module so edits/deletes key correctly).
const BASE_SEED: CatalogItem[] = [
  { id: 1, name: "Diagnostic Visit",        itemDescription: "Standard diagnostic service call",    salesDescription: "Diagnostic visit — inspects and identifies system issues", brand: "", modelNumber: "SVC-1001", rate: 99,  cost: 0,  taxable: true, category: "Diagnostic", type: "Service",   itemType: "Service",   department: "Field Service", active: true },
  { id: 2, name: "AC Tune-Up",              itemDescription: "Annual AC maintenance and tune-up",   salesDescription: "AC tune-up — cleaning, inspection and performance check", brand: "", modelNumber: "SVC-1002", rate: 129, cost: 0,  taxable: true, category: "Maintenance", type: "Service",   itemType: "Service",   department: "Field Service", active: true },
  { id: 3, name: "R-410A Refrigerant (lb)", itemDescription: "R-410A refrigerant per pound",        salesDescription: "R-410A refrigerant recharge — per pound", brand: "", modelNumber: "MAT-2001", rate: 18,  cost: 9,  taxable: true, category: "Refrigerant", type: "Product",   itemType: "Material",  department: "Materials", vendor: "HVAC Supply Co.", active: true },
  { id: 4, name: "Capacitor 45/5 MFD",      itemDescription: "Dual run capacitor 45/5 MFD 440V",    salesDescription: "Capacitor 45/5 MFD — dual run capacitor replacement", brand: "", modelNumber: "MAT-2002", rate: 25,  cost: 12, taxable: true, category: "Parts", type: "Product",   itemType: "Material",  department: "Materials", vendor: "HVAC Supply Co.", active: true },
  { id: 5, name: "Blower Motor 1/2 HP",     itemDescription: "ECM blower motor 1/2 HP replacement", salesDescription: "Blower motor 1/2 HP — ECM variable speed", brand: "Carrier", modelNumber: "EQU-3001", rate: 225, cost: 98, taxable: true, category: "Motors", type: "Equipment", itemType: "Equipment", department: "Equipment", vendor: "Grainger", active: true },
  { id: 6, name: "Permit Fee",              itemDescription: "Administrative permit processing fee", salesDescription: "Permit fee — municipal permit filing and processing", brand: "", modelNumber: "FEE-4001", rate: 75,  cost: 0,  taxable: true, category: "Permit Fee", type: "Service",   itemType: "Admin", active: true },
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

const SEED: CatalogItem[] = [
  ...BASE_SEED,
  ...PB_SEED.map(([name, category, description, price, cost, taxable], i) => ({
    id: 101 + i, name, itemDescription: description, salesDescription: description,
    brand: "", modelNumber: "", rate: price, cost, taxable, category,
    type: "Service", itemType: "Price Book", active: true,
  } as CatalogItem)),
];

let items: CatalogItem[] = SEED;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) items = parsed;
  }
} catch { /* corrupt cache → keep seed */ }

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

export const itemsStore = {
  getSnapshot: (): CatalogItem[] => items,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
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
  },
  remove: (id: number) => {
    items = items.filter((i) => i.id !== id);
    saveLS();
    notify();
  },
  removeMany: (ids: Set<number>) => {
    items = items.filter((i) => !ids.has(i.id));
    saveLS();
    notify();
  },
};
