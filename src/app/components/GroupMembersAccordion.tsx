import { useState } from "react";
import type { ItemGroupMember } from "../utils/itemCost";
import { getItemCategory } from "../utils/itemTypes";

// Item group (price book entry) expanded inside a line-items table.
//
// A group is sold as ONE line at its flat price, and that is all the customer
// ever sees — the documents (DocumentSheets) never render members. Internally
// the line can be expanded to show what the package is made of: each member
// with its type, quantity and cost, so the office can see where the group's
// cost comes from (services → Compensation, everything else → All expenses).
//
// Usage inside any <tbody>:
//   const groups = useExpandedGroups();          // in the component body
//   <GroupToggle count={n} open={groups.isOpen(k)} onToggle={() => groups.toggle(k)} />
//   <GroupMemberRows members={li.groupItems} open={groups.isOpen(k)} colSpan={7} />

export function useExpandedGroups() {
  const [open, setOpen] = useState<Set<string | number>>(() => new Set());
  return {
    isOpen: (key: string | number) => open.has(key),
    toggle: (key: string | number) =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      }),
  };
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Chevron + "N components" under a group line's name. */
export function GroupToggle({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-expanded={open}
      className="mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-md pr-2 text-[12px] text-[#4A6FA5] hover:bg-[#EEF3FA]"
      style={{ fontWeight: 600 }}
    >
      <span className="material-icons transition-transform" style={{ fontSize: "18px", transform: open ? "rotate(180deg)" : "none" }}>expand_more</span>
      {count} {count === 1 ? "component" : "components"}
    </button>
  );
}

const TYPE_COLOR: Record<string, string> = {
  Service: "#4A6FA5", Material: "#16A34A", Equipment: "#7C3AED", Asset: "#D97706", Admin: "#546478", "Price Book": "#BE185D", Other: "#8899AA",
};

/** The expanded rows: one full-width cell holding the member list.
 *  `lineQuantity` scales the member quantities when the group line itself
 *  was sold more than once. */
export function GroupMemberRows({
  members, open, colSpan, lineQuantity = 1,
}: { members: ItemGroupMember[]; open: boolean; colSpan: number; lineQuantity?: number }) {
  if (!open || !members.length) return null;
  const qtyOf = (m: ItemGroupMember) => m.quantity * (lineQuantity || 1);
  const groupCost = members.reduce((sum, m) => sum + qtyOf(m) * m.unitCost, 0);
  const compensation = members
    .filter((m) => getItemCategory(m.itemType ?? "") === "Service")
    .reduce((sum, m) => sum + qtyOf(m) * m.unitCost, 0);
  return (
    <tr className="bg-[#F9FAFB]">
      <td colSpan={colSpan} className="px-4 pb-4 pt-1">
        <div className="ml-3 overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#EDF0F5] text-left text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                <th className="px-3 py-2" style={{ fontWeight: 600 }}>Component</th>
                <th className="px-3 py-2" style={{ fontWeight: 600 }}>Type</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 600 }}>Qty</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 600 }}>Unit cost</th>
                <th className="px-3 py-2 text-right" style={{ fontWeight: 600 }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const bucket = getItemCategory(m.itemType ?? "");
                return (
                  <tr key={`${m.itemId}-${i}`} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="px-3 py-2 text-[#1A2332]" style={{ fontWeight: 500 }}>{m.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#546478]" style={{ fontWeight: 500 }}>
                        <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: TYPE_COLOR[bucket] ?? TYPE_COLOR.Other }} />
                        {m.itemType || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{qtyOf(m)}</td>
                    <td className="px-3 py-2 text-right text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(m.unitCost)}</td>
                    <td className="px-3 py-2 text-right text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(qtyOf(m) * m.unitCost)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#EDF0F5] bg-[#FAFBFC] text-[12px]">
                <td colSpan={4} className="px-3 py-2 text-right text-[#546478]">
                  Group cost{compensation > 0 && <span className="text-[#9CA3AF]"> · ${fmt(compensation)} of it is compensation (services)</span>}
                </td>
                <td className="px-3 py-2 text-right text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(groupCost)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="border-t border-[#EDF0F5] px-3 py-1.5 text-[11px] text-[#9CA3AF]">
            Internal view. The customer sees this group as one line at its flat price.
          </div>
        </div>
      </td>
    </tr>
  );
}
