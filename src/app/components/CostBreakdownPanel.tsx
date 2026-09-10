import { COST_COMPONENTS, breakdownTotal, defaultCostComponent, retotalBreakdown, type CostBreakdown } from "../utils/itemCost";

// Cost split fields, shared by the Create-item form and the Item-detail pricing
// modal (Marek, Sep 10 call): an item's cost can be recorded as labor,
// commission and materials instead of one lump number.
//
// Off by default so a plain part or a plain service stays a single number — the
// point of the split is packages and anything that pays a person, not every
// little item. With the split on, Cost is the sum and is no longer typed
// directly; with it off, the item type decides which bucket the cost lands in.
//
// Two components because they sit in different places on the form: CostField
// takes the Cost cell inside the price row, CostSplitBlock is the full-width
// panel underneath it. Both are pure — the state lives in the form.

export interface CostBreakdownProps {
  /** Total cost as typed, kept as a string so the field can be empty. */
  cost: string;
  onCostChange: (next: string) => void;
  /** undefined = not split; the item type then decides the bucket. */
  breakdown: CostBreakdown | undefined;
  onBreakdownChange: (next: CostBreakdown | undefined) => void;
  itemType: string;
  fieldClass: string;
  labelClass: string;
  /** Rendered next to the Cost label. */
  required?: React.ReactNode;
}

const BUCKET_LABEL: Record<string, string> = { labor: "labor", commission: "commission", materials: "materials" };

export function CostField({ cost, onCostChange, breakdown, itemType, fieldClass, labelClass, required }: CostBreakdownProps) {
  const split = !!breakdown;
  return (
    <div>
      <label className={labelClass}>Cost {required}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
        <input
          type="number" min="0" step="0.01"
          value={split ? String(breakdownTotal(breakdown)) : cost}
          readOnly={split}
          onChange={(e) => onCostChange(e.target.value)}
          placeholder="0"
          className={`${fieldClass} pl-7 ${split ? "bg-[#F9FAFB] text-[#546478]" : ""}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
      </div>
      <p className="mt-1.5 text-[12px] text-[#8899AA]">
        {split ? "Sum of the split below" : `Counts as ${BUCKET_LABEL[defaultCostComponent(itemType)]}`}
      </p>
    </div>
  );
}

export function CostSplitBlock({ cost, onCostChange, breakdown, onBreakdownChange, itemType, fieldClass, labelClass }: CostBreakdownProps) {
  const split = !!breakdown;

  const toggle = (on: boolean) => {
    if (on) {
      // Seed the split from the cost already entered, in the bucket the item
      // type implies, so turning it on never changes the total.
      onBreakdownChange(retotalBreakdown(undefined, parseFloat(cost) || 0, itemType));
    } else {
      const total = breakdownTotal(breakdown);
      onBreakdownChange(undefined);
      onCostChange(total ? String(total) : cost);
    }
  };

  const setComponent = (key: keyof CostBreakdown, value: string) => {
    const next = { ...(breakdown ?? { labor: 0, commission: 0, materials: 0 }), [key]: parseFloat(value) || 0 };
    onBreakdownChange(next);
    onCostChange(String(breakdownTotal(next)));
  };

  return (
    <div className="rounded-lg border border-[#E5E7EB] p-4">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox" checked={split} onChange={(e) => toggle(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[#CBD5E1] accent-[#4A6FA5]"
        />
        <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Split cost into labor, commission and materials</span>
      </label>
      <p className="mt-1.5 text-[12px] text-[#8899AA]">
        Labor and commission are compensation; materials are an expense. Recording them apart is what lets the company
        report labor on its own — workers&rsquo; comp insurance is priced off it.
      </p>
      {split && (
        <div className="mt-3 grid grid-cols-3 gap-5">
          {COST_COMPONENTS.map(({ key, label }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={String(breakdown?.[key] ?? 0)}
                  onChange={(e) => setComponent(key, e.target.value)}
                  className={`${fieldClass} pl-7`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
