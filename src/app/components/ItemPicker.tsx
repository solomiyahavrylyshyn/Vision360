import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CatalogItem {
  id: number;
  name: string;
  itemDescription: string;
  salesDescription: string;
  brand: string;
  modelNumber: string;
  rate: number;
  cost: number;
  taxable: boolean;
  category: string;
  type: "Service" | "Product" | "Labor" | "Equipment";
}

export interface SelectedLineItem {
  id: number;
  catalogItemId: number;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  taxable: boolean;
  total: number;
}

interface ItemPickerProps {
  catalogItems: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  placeholder?: string;
}

// ─── Item Picker Modal ───────────────────────────────────────────────────────
export function ItemPicker({ catalogItems, onSelect, onClose, placeholder = "Search items by name, brand, or category..." }: ItemPickerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter items
  const filtered = catalogItems.filter(item => {
    if (debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.modelNumber.toLowerCase().includes(q)
    );
  });

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[680px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>Select Item from Catalog</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-[#DDE3EE]">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>search</span>
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
            />
          </div>
          {search.length > 0 && search.length < 2 && (
            <div className="text-[12px] text-[#8899AA] mt-2">Type at least 2 characters to search</div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "48px" }}>inventory_2</span>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items found</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Try adjusting your search</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="w-full flex items-start justify-between px-4 py-3 hover:bg-[#F5F7FA] rounded-lg border border-transparent hover:border-[#DDE3EE] transition-all text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{item.name}</div>
                      <span className={`text-[11px] px-2 py-0.5 rounded ${
                        item.type === "Service" ? "bg-[#DBEAFE] text-[#1E40AF]" :
                        item.type === "Product" ? "bg-[#FEF3C7] text-[#B45309]" :
                        item.type === "Labor" ? "bg-[#E0E7FF] text-[#4338CA]" :
                        "bg-[#F3E8FF] text-[#7C3AED]"
                      }`} style={{ fontWeight: 600 }}>
                        {item.type}
                      </span>
                      {item.taxable && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]" style={{ fontWeight: 600 }}>Taxable</span>
                      )}
                    </div>
                    {item.salesDescription && (
                      <div className="text-[12px] text-[#8899AA] mb-1">{item.salesDescription}</div>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-[#546478]">
                      {item.brand && <span>Brand: {item.brand}</span>}
                      {item.modelNumber && <span>Model: {item.modelNumber}</span>}
                      <span>Category: {item.category}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className="text-[16px] text-[#1A2332] mb-0.5" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(item.rate)}</div>
                    <div className="text-[11px] text-[#8899AA]" style={{ fontVariantNumeric: "tabular-nums" }}>Cost: ${fmt(item.cost)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC] flex items-center justify-between">
          <div className="text-[13px] text-[#546478]">
            {filtered.length === catalogItems.length ? (
              <span>{catalogItems.length} items available</span>
            ) : (
              <span>{filtered.length} of {catalogItems.length} items</span>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Line Item Row Component ─────────────────────────────────────────────────
interface LineItemRowProps {
  item: SelectedLineItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  allowPriceOverride?: boolean;
  onUpdatePrice?: (id: number, price: number) => void;
}

export function LineItemRow({ item, onUpdateQuantity, onRemove, allowPriceOverride = false, onUpdatePrice }: LineItemRowProps) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <tr className="border-b border-[#EDF0F5] hover:bg-[#FAFBFC]">
      <td className="px-4 py-3">
        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
        {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
        {item.taxable && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-[#DDE3EE] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]"
        />
      </td>
      <td className="px-4 py-3">
        {allowPriceOverride && onUpdatePrice ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdatePrice(item.id, Number(e.target.value) || 0)}
            className="w-28 px-2 py-1 border border-[#DDE3EE] rounded text-[13px] text-right focus:outline-none focus:border-[#4A6FA5]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
        ) : (
          <span className="text-[13px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</span>
        )}
      </td>
      <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
      <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
      <td className="px-4 py-3">
        <button onClick={() => onRemove(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
          <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>close</span>
        </button>
      </td>
    </tr>
  );
}

// ─── Helper to convert CatalogItem to SelectedLineItem ──────────────────────
export function catalogItemToLineItem(catalogItem: CatalogItem, lineItemId: number, quantity: number = 1): SelectedLineItem {
  return {
    id: lineItemId,
    catalogItemId: catalogItem.id,
    name: catalogItem.name,
    description: catalogItem.salesDescription || "",
    quantity,
    unitPrice: catalogItem.rate,
    unitCost: catalogItem.cost,
    taxable: catalogItem.taxable,
    total: quantity * catalogItem.rate,
  };
}
