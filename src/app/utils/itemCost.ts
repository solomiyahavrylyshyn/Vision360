// Item cost breakdown — an item's internal cost split by what it actually pays
// for: labor, commission, or materials.
//
// Why the split exists (Marek, Sep 10 call): workers' comp insurance is priced
// off compensation, and the rate differs wildly by kind of work — roofing or
// HVAC labor is expensive, a salesperson's commission is cheap. A shop that
// reports one lump "compensation" number pays the expensive rate on all of it.
// Recording $50 labor + $50 commission instead of $100 compensation is what
// lets the company answer "how much did you spend on labor last year?" at
// renewal time, and is what the labor-vs-commission reports will read.
//
// A single item is deliberately kept simple: one cost with an optional split.
// A package that mixes labor, commission and parts is an item group (a Price
// Book entry) whose components each carry their own split — see rollUpBreakdown.

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

export const breakdownTotal = (b: CostBreakdown | undefined): number =>
  b ? round2(num(b.labor) + num(b.commission) + num(b.materials)) : 0;

/** Labor + commission — the part of a cost that pays a person. */
export const breakdownCompensation = (b: CostBreakdown | undefined): number =>
  b ? round2(num(b.labor) + num(b.commission)) : 0;

export const isEmptyBreakdown = (b: CostBreakdown | undefined): boolean =>
  !b || (num(b.labor) === 0 && num(b.commission) === 0 && num(b.materials) === 0);

/**
 * Which bucket an item's cost falls into when nobody has split it by hand.
 * On a Service item the cost is what we pay the technician for that piece of
 * work, so it is labor. Material, Equipment and Asset costs are the supplier
 * price, and an Admin fee (a permit, a disposal charge) is money paid out to a
 * third party — both are materials, i.e. an expense rather than compensation.
 */
export function defaultCostComponent(itemType: string | undefined): keyof CostBreakdown {
  const t = (itemType ?? "").trim();
  if (t === "Service" || t === "Labor" || t === "Labor Markup") return "labor";
  return "materials";
}

/**
 * The breakdown to use for an item: the explicit one when the company filled it
 * in, otherwise the whole cost in the bucket its type implies. A Price Book
 * group with no explicit split rolls up from its members.
 */
export function breakdownForItem(item: {
  cost?: number;
  itemType?: string;
  type?: string;
  costBreakdown?: CostBreakdown;
  groupItems?: ItemGroupMember[];
}): CostBreakdown {
  if (item.costBreakdown && !isEmptyBreakdown(item.costBreakdown)) {
    return {
      labor: round2(num(item.costBreakdown.labor)),
      commission: round2(num(item.costBreakdown.commission)),
      materials: round2(num(item.costBreakdown.materials)),
    };
  }
  if (item.groupItems?.length) return rollUpBreakdown(item.groupItems);
  const bucket = defaultCostComponent(item.itemType ?? item.type);
  return { ...ZERO_BREAKDOWN, [bucket]: round2(num(item.cost)) };
}

/** A member line of an item group (Price Book entry). */
export interface ItemGroupMember {
  /** Catalog id of the member item, 0 for a line typed in by hand. */
  itemId: number;
  name: string;
  /** Member's own item type, so the rollup knows which bucket its cost is. */
  itemType?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  costBreakdown?: CostBreakdown;
}

/** Sum the members' costs into one breakdown, quantity included. */
export function rollUpBreakdown(members: ItemGroupMember[]): CostBreakdown {
  const out = { ...ZERO_BREAKDOWN };
  for (const m of members) {
    const qty = num(m.quantity) || 0;
    const b = breakdownForItem({ cost: m.unitCost, itemType: m.itemType, costBreakdown: m.costBreakdown });
    out.labor += qty * b.labor;
    out.commission += qty * b.commission;
    out.materials += qty * b.materials;
  }
  return { labor: round2(out.labor), commission: round2(out.commission), materials: round2(out.materials) };
}

/** Sum the members' retail prices — the group's price when it is not flat-rate. */
export function rollUpPrice(members: ItemGroupMember[]): number {
  return round2(members.reduce((s, m) => s + num(m.quantity) * num(m.unitPrice), 0));
}

/**
 * Move a new total into an existing split. Editing the single "Cost" field on
 * an item that was never broken down should not force the form open: the delta
 * goes to the bucket the item type implies, and an existing split is scaled so
 * the ratios the company entered survive.
 */
export function retotalBreakdown(
  current: CostBreakdown | undefined,
  nextTotal: number,
  itemType: string | undefined,
): CostBreakdown {
  const total = round2(num(nextTotal));
  const prev = breakdownTotal(current);
  if (!current || isEmptyBreakdown(current) || prev === 0) {
    return { ...ZERO_BREAKDOWN, [defaultCostComponent(itemType)]: total };
  }
  const f = total / prev;
  const labor = round2(num(current.labor) * f);
  const commission = round2(num(current.commission) * f);
  // The last component absorbs the rounding so the split always adds to total.
  return { labor, commission, materials: round2(total - labor - commission) };
}
