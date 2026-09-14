// Job financials — the allocation rule (FR-9.19) behind the four KPI tiles on a
// job page: Total price · Compensation · Expenses · Gross margin.
//
// The rule every tile follows: an item's cost is allocated by what it pays for.
// A cost split into labor, commission and materials is used as entered (Marek,
// Sep 14 call: "one item, three buckets"). Without a split the item type
// decides: a Service cost is what we pay the technician, so compensation;
// Material, Equipment, Asset and Admin costs are paid out to someone else, so
// an expense. Job expenses split the same way — the categories that pay people
// (Commission and Labor) count as compensation, everything else is an expense.
//
// The tiles are kept disjoint on purpose: Total price − Compensation −
// Expenses = gross profit, so the strip reads left to right and adds up.
// Compensation also comes back split as laborTotal / commissionTotal, because
// workers' comp insurance is priced off labor and asks for that number alone.

import { breakdownForItem, type CostBreakdown } from "./itemCost";

export interface FinancialLineItem {
  quantity: number;
  unitPrice: number;
  unitCost: number;
  itemType?: string;
  /** Per-unit cost split. When present it decides how the cost is allocated —
   *  see utils/itemCost. */
  costBreakdown?: Partial<CostBreakdown>;
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
  expenses: number;
  grossProfit: number;
  /** Gross margin as a percentage, 0 when nothing has been sold yet. */
  margin: number;
  /** Breakdown, for tooltips and the finance tab. */
  serviceCost: number;
  materialCost: number;
  compensationExpenses: number;
  otherExpenses: number;
  /** Compensation split by kind of pay — what a workers' comp renewal asks for
   *  ("how much did you spend on labor?"). Labor is the item labor cost plus
   *  Labor expenses; commission is the item commission plus Commission
   *  expenses. Together they are `compensation`. */
  laborTotal: number;
  commissionTotal: number;
  /** True when the total came from an approved estimate rather than the items. */
  fromApprovedEstimate: boolean;
}

// Item types whose cost is technician pay rather than a supplier price, used
// only for items with no cost split of their own.
const COMPENSATION_ITEM_TYPES = new Set(["Service", "Labor"]);

// Expense categories that pay people. Commission is the percentage a salesperson
// or technician earns on the sale; Labor covers work that does not fit inside an
// item — overtime, a second visit, a subcontractor. Both ship pre-coded with the
// product (expenseCategoriesStore) because every home service business has them.
export const COMPENSATION_EXPENSE_CATEGORIES = ["Commission", "Labor"];

const isCommissionCategory = (category: string | undefined): boolean =>
  (category ?? "").trim().toLowerCase() === "commission";

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
  let itemLabor = 0;
  let itemCommission = 0;
  let materialCost = 0;
  let itemRevenue = 0;

  for (const item of lineItems) {
    const quantity = num(item.quantity);
    itemRevenue += quantity * num(item.unitPrice);
    // An explicit split wins; without one the item type puts the whole cost in
    // labor (Service) or materials (everything else).
    const split = breakdownForItem({
      cost: num(item.unitCost),
      itemType: isCompensationItemType(item.itemType) ? "Service" : item.itemType,
      costBreakdown: item.costBreakdown,
    });
    itemLabor += quantity * split.labor;
    itemCommission += quantity * split.commission;
    materialCost += quantity * split.materials;
  }

  let expenseLabor = 0;
  let expenseCommission = 0;
  let otherExpenses = 0;

  for (const expense of expenses) {
    const amount = num(expense.amount);
    if (isCommissionCategory(expense.category)) expenseCommission += amount;
    else if (isCompensationCategory(expense.category)) expenseLabor += amount;
    else otherExpenses += amount;
  }

  const serviceCost = itemLabor + itemCommission;
  const compensationExpenses = expenseLabor + expenseCommission;

  const fromApprovedEstimate =
    approvedEstimateTotal != null && Number.isFinite(approvedEstimateTotal);
  const totalPrice = round2(fromApprovedEstimate ? (approvedEstimateTotal as number) : itemRevenue);
  const compensation = round2(serviceCost + compensationExpenses);
  const expensesTotal = round2(materialCost + otherExpenses);
  const grossProfit = round2(totalPrice - compensation - expensesTotal);

  return {
    totalPrice,
    compensation,
    expenses: expensesTotal,
    grossProfit,
    margin: totalPrice > 0 ? round2((grossProfit / totalPrice) * 100) : 0,
    serviceCost: round2(serviceCost),
    materialCost: round2(materialCost),
    compensationExpenses: round2(compensationExpenses),
    otherExpenses: round2(otherExpenses),
    laborTotal: round2(itemLabor + expenseLabor),
    commissionTotal: round2(itemCommission + expenseCommission),
    fromApprovedEstimate,
  };
}
