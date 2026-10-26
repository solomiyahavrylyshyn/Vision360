// "Adjust price" (Figma 5485:34201, tasks 9227 / 9228): the salesperson agrees a
// lower total with the client. Item prices stay as they are; the difference is
// one "Discount" line at the bottom of the table, so discounts can be counted
// at month end. Dollars only, never higher than the list price.

import { useState } from "react";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DISCOUNT_LINE_NAME = "Discount";

export function discountLineDescription(by = "You", on = new Date()) {
  return `Price adjusted by ${by} · ${on.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function AdjustPriceModal({ listPrice, currentPrice, onApply, onClose }: {
  /** Sum of the items, before any discount. */
  listPrice: number;
  /** The price after the existing discount, when there is one. */
  currentPrice?: number;
  onApply: (newPrice: number) => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState(currentPrice != null ? currentPrice.toFixed(2) : "");
  const value = raw.trim() === "" ? null : Number(raw.replace(/,/g, ""));
  const error = value === null || Number.isNaN(value) ? null
    : value < 0 ? "Price can't be below $0"
    : value >= listPrice ? "New price must be lower than the list price; to charge more, add an item or change a line price"
    : null;
  const valid = value !== null && !Number.isNaN(value) && !error;
  const discount = valid ? Math.round((listPrice - value!) * 100) / 100 : 0;
  const pct = valid && listPrice > 0 ? Math.round((discount / listPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[440px] max-w-full rounded-xl border border-[#E5E7EB] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4">
          <h3 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Adjust price</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded text-[#1A2332] hover:bg-[#F3F4F6]">
            <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-[#F5F7FA] px-3 py-2.5 text-[14px]">
            <span className="text-[#6B7280]">List price</span>
            <span className="text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{money(listPrice)}</span>
          </div>
          <div>
            <label className="mb-1.5 block text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>New price <span className="text-[#DC2626]">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#9CA3AF]">$</span>
              <input
                autoFocus inputMode="decimal" value={raw} placeholder="0.00"
                onChange={(e) => setRaw(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && valid) onApply(value!); if (e.key === "Escape") onClose(); }}
                className={`h-9 w-full rounded-lg border pl-7 pr-3 text-[14px] text-[#1A2332] outline-none ${error ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" : "border-[#E5E7EB] focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"}`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              />
            </div>
            {error
              ? <p className="mt-1.5 text-[12px] text-[#DC2626]">{error}</p>
              : !valid && <p className="mt-1.5 text-[12px] text-[#6B7280]">Enter the price agreed with the client, in dollars.</p>}
          </div>
          {valid && (
            <div className="space-y-1.5 border-t border-[#E5E7EB] pt-3 text-[14px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              <div className="flex justify-between"><span className="text-[#6B7280]">Discount</span><span className="text-[#DC2626]" style={{ fontWeight: 500 }}>−{money(discount)} ({pct}%)</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">New total</span><span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{money(value!)}</span></div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button disabled={!valid} onClick={() => valid && onApply(value!)} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white hover:bg-[#3d5a85] disabled:cursor-not-allowed disabled:opacity-50" style={{ fontWeight: 500 }}>Apply</button>
        </div>
      </div>
    </div>
  );
}
