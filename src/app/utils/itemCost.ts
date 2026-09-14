// Item cost breakdown — an item's internal cost split by what it actually pays
// for: labor, commission or materials.
//
// Why the split exists (Marek, Sep 10 and Sep 14 calls): the job page has four
// tiles — Total price · Compensation · Expenses · Gross margin — and every
// service item pays for three things at once: the technician's labor, the
// commission on the sale, and the parts. One item, three buckets. Labor and
// commission are compensation; materials are an expense. Recording them apart
// is what lets the company report labor on its own (workers' comp insurance is
// priced off it) without creating a separate "labor" or "commission" item for
// every service.
//
// A single item is deliberately kept simple: one cost with an optional split.
// Packages of several items (item groups) were considered and dropped — the
// split does the same job for costing and keeps the catalog flat.

export interface CostBreakdown {
  labor: number;
  commission: number;
  materials: number;
}

export const ZERO_BREAKDOWN: CostBreakdown = { labor: 0, commission: 0, materials: 0 };

export const COST_COMPONENTS = [
  { key: "labor", label: "Labor" },
  { key: "commission", label: "Commission" },
  { key: "materials", label: "Materials" },
] as const;

const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Records written before commission was a component of its own carry only
 *  labor and materials; they read back with a zero commission. */
const normalize = (b: Partial<CostBreakdown> | undefined): CostBreakdown => ({
  labor: round2(num(b?.labor)),
  commission: round2(num(b?.commission)),
  materials: round2(num(b?.materials)),
});

export const breakdownTotal = (b: Partial<CostBreakdown> | undefined): number => {
  const n = normalize(b);
  return round2(n.labor + n.commission + n.materials);
};

/** The part of a cost that pays a person — labor plus commission. */
export const breakdownCompensation = (b: Partial<CostBreakdown> | undefined): number => {
  const n = normalize(b);
  return round2(n.labor + n.commission);
};

export const isEmptyBreakdown = (b: Partial<CostBreakdown> | undefined): boolean =>
  breakdownTotal(b) === 0;

/**
 * Which bucket an item's cost falls into when nobody has split it by hand.
 * On a Service item the cost is what we pay the technician for that piece of
 * work, so it is labor. Material, Equipment and Asset costs are the supplier
 * price, and an Admin fee (a permit, a disposal charge) is money paid out to a
 * third party — both are materials, i.e. an expense rather than compensation.
 * Commission is never implied: it only exists when the company types it in.
 */
export function defaultCostComponent(itemType: string | undefined): keyof CostBreakdown {
  const t = (itemType ?? "").trim();
  if (t === "Service" || t === "Labor" || t === "Labor Markup") return "labor";
  return "materials";
}

/**
 * The breakdown to use for an item: the explicit one when the company filled it
 * in, otherwise the whole cost in the bucket its type implies.
 */
export function breakdownForItem(item: {
  cost?: number;
  itemType?: string;
  type?: string;
  costBreakdown?: Partial<CostBreakdown>;
}): CostBreakdown {
  if (item.costBreakdown && !isEmptyBreakdown(item.costBreakdown)) {
    return normalize(item.costBreakdown);
  }
  const bucket = defaultCostComponent(item.itemType ?? item.type);
  return { ...ZERO_BREAKDOWN, [bucket]: round2(num(item.cost)) };
}

/**
 * Move a new total into an existing split. Editing the single "Cost" field on
 * an item that was never broken down should not force the form open: the total
 * goes to the bucket the item type implies, and an existing split is scaled so
 * the ratio the company entered survives.
 */
export function retotalBreakdown(
  current: Partial<CostBreakdown> | undefined,
  nextTotal: number,
  itemType: string | undefined,
): CostBreakdown {
  const total = round2(num(nextTotal));
  const prev = breakdownTotal(current);
  if (!current || prev === 0) {
    return { ...ZERO_BREAKDOWN, [defaultCostComponent(itemType)]: total };
  }
  const cur = normalize(current);
  const labor = round2((cur.labor / prev) * total);
  const commission = round2((cur.commission / prev) * total);
  // Materials absorbs the rounding so the split always adds up to the total.
  return { labor, commission, materials: round2(total - labor - commission) };
}
