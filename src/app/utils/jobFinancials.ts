// Job financials — the allocation rule (FR-9.19) behind the four KPI tiles on a
// job page: Total price · Compensation · All expenses · Profit margin.
//
// The rule every tile follows: on a Service item, `cost` is what we pay the
// technician for that piece of work, so it is compensation. Material,
// Equipment and Asset items carry the supplier price, so their cost is an
// expense. Job expenses split the same way — the categories that pay people
// (commission, extra labor, subcontractors) count as compensation, everything
// else is an expense.
//
// The tiles are kept disjoint on purpose: Total price − Compensation − All
// expenses = gross profit, so the strip reads left to right and adds up.

export interface FinancialLineItem {
  quantity: number;
  unitPrice: number;
  unitCost: number;
  itemType?: string;
}

export interface FinancialExpense {
  category: string;
  amount: number;
}

export interface JobFinancialsInput {
  lineItems?: FinancialLineItem[];
  expenses?: FinancialExpense[];
  /** Sum of the approved estimate(s). When set it wins over the line-item prices. */
  approvedEstimateTotal?: number | null;
}

export interface JobFinancials {
  totalPrice: number;
  compensation: number;
  allExpenses: number;
  grossProfit: number;
  /** Percentage, 0 when nothing has been sold yet. */
  margin: number;
  /** Breakdown, for tooltips and the finance tab. */
  serviceCost: number;
  materialCost: number;
  compensationExpenses: number;
  otherExpenses: number;
  /** True when the total came from an approved estimate rather than the items. */
  fromApprovedEstimate: boolean;
}

// Item types whose cost is technician pay rather than a supplier price.
// Price Book is the open question with Marek: a flat-rate package carries one
// cost covering both labor and parts, and it currently counts as labor. If he
// says the package cost is materials, move "Price Book" to the expense side.
const COMPENSATION_ITEM_TYPES = new Set(["Service", "Price Book"]);

// Expense categories that pay people. Commission is the percentage a salesperson
// or technician earns on the sale; Labor covers work that does not fit inside an
// item — overtime, a second visit, a subcontractor.
export const COMPENSATION_EXPENSE_CATEGORIES = ["Commission", "Labor"];

const compensationCategories = new Set(
  COMPENSATION_EXPENSE_CATEGORIES.map((c) => c.toLowerCase()),
);

export const isCompensationCategory = (category: string | undefined): boolean =>
  compensationCategories.has((category ?? "").trim().toLowerCase());

export const isCompensationItemType = (itemType: string | undefined): boolean =>
  COMPENSATION_ITEM_TYPES.has((itemType ?? "").trim());

// Money is summed in cents so a job with many rows doesn't drift by a cent.
const round2 = (n: number) => Math.round(n * 100) / 100;

const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);

export function computeJobFinancials({
  lineItems = [],
  expenses = [],
  approvedEstimateTotal = null,
}: JobFinancialsInput): JobFinancials {
  let serviceCost = 0;
  let materialCost = 0;
  let itemRevenue = 0;

  for (const item of lineItems) {
    const quantity = num(item.quantity);
    const cost = quantity * num(item.unitCost);
    itemRevenue += quantity * num(item.unitPrice);
    if (isCompensationItemType(item.itemType)) serviceCost += cost;
    else materialCost += cost;
  }

  let compensationExpenses = 0;
  let otherExpenses = 0;

  for (const expense of expenses) {
    const amount = num(expense.amount);
    if (isCompensationCategory(expense.category)) compensationExpenses += amount;
    else otherExpenses += amount;
  }

  const fromApprovedEstimate =
    approvedEstimateTotal != null && Number.isFinite(approvedEstimateTotal);
  const totalPrice = round2(fromApprovedEstimate ? (approvedEstimateTotal as number) : itemRevenue);
  const compensation = round2(serviceCost + compensationExpenses);
  const allExpenses = round2(materialCost + otherExpenses);
  const grossProfit = round2(totalPrice - compensation - allExpenses);

  return {
    totalPrice,
    compensation,
    allExpenses,
    grossProfit,
    margin: totalPrice > 0 ? round2((grossProfit / totalPrice) * 100) : 0,
    serviceCost: round2(serviceCost),
    materialCost: round2(materialCost),
    compensationExpenses: round2(compensationExpenses),
    otherExpenses: round2(otherExpenses),
    fromApprovedEstimate,
  };
}
