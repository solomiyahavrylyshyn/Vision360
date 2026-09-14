// Item type buckets shared by the Items module and the catalog picker.
//
// Canonical item types (Figma items canvas): Service, Material, Equipment,
// Asset, Admin, Price Book. Older records may still carry finer legacy names;
// getItemCategory folds every spelling onto one of the six buckets so the tabs
// on the Items page and in the "Select item from catalog" picker agree.

export type ItemBucket = "Service" | "Material" | "Equipment" | "Asset" | "Admin" | "Price Book" | "Other";

export function getItemCategory(type: string): ItemBucket {
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

/** Bucket of a catalog row: the fine itemType when the Items module set one,
 *  otherwise the picker's coarse type. */
export function bucketOfCatalogItem(item: { type: string; itemType?: string }): ItemBucket {
  if (item.itemType) return getItemCategory(item.itemType);
  if (item.type === "Product") return "Material";
  if (item.type === "Labor") return "Service";
  return getItemCategory(item.type);
}

/** Tabs of the catalog picker, in the same order as the Items page. */
export const PICKER_TABS: { key: ItemBucket | "all"; label: string }[] = [
  { key: "all", label: "All items" },
  { key: "Price Book", label: "Price book" },
  { key: "Service", label: "Services" },
  { key: "Material", label: "Materials" },
  { key: "Equipment", label: "Equipment" },
  { key: "Asset", label: "Asset" },
  { key: "Admin", label: "Admin" },
];
