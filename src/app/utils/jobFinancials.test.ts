import { describe, it, expect } from "vitest";
import { computeJobFinancials } from "./jobFinancials";

// The worked example the rule was agreed on: "AC repair for Mr. Smith",
// approved estimate 600.
const smithItems = [
  { quantity: 1, unitPrice: 120, unitCost: 40, itemType: "Material" },
  { quantity: 2, unitPrice: 50, unitCost: 20, itemType: "Material" },
  { quantity: 1, unitPrice: 89, unitCost: 45, itemType: "Service" },
];
const smithExpenses = [
  { category: "Commission", amount: 30 },
  { category: "Tools", amount: 100 },
  { category: "Fuel", amount: 20 },
];

describe("computeJobFinancials", () => {
  it("splits the worked example across the four tiles", () => {
    const f = computeJobFinancials({
      lineItems: smithItems,
      expenses: smithExpenses,
      approvedEstimateTotal: 600,
    });
    expect(f.totalPrice).toBe(600);
    expect(f.compensation).toBe(75); // service cost 45 + commission 30
    expect(f.allExpenses).toBe(200); // materials 80 + lift 100 + fuel 20
    expect(f.grossProfit).toBe(325);
    expect(Math.round(f.margin)).toBe(54);
  });

  it("keeps the tiles disjoint so they add up left to right", () => {
    const f = computeJobFinancials({
      lineItems: smithItems,
      expenses: smithExpenses,
      approvedEstimateTotal: 600,
    });
    expect(f.totalPrice - f.compensation - f.allExpenses).toBe(f.grossProfit);
  });

  it("falls back to the sum of item prices without an approved estimate", () => {
    const f = computeJobFinancials({ lineItems: smithItems, expenses: [] });
    expect(f.totalPrice).toBe(309);
    expect(f.fromApprovedEstimate).toBe(false);
  });

  it("lets an approved estimate outrank the item prices", () => {
    const f = computeJobFinancials({ lineItems: smithItems, approvedEstimateTotal: 600 });
    expect(f.totalPrice).toBe(600);
    expect(f.fromApprovedEstimate).toBe(true);
  });

  // The case that surfaced the disagreement: a tune-up sold at 89 with a cost of
  // 15 (what the technician is paid) plus a 48 Labor expense for the extra hours.
  it("counts a Labor expense as compensation, not as an expense", () => {
    const f = computeJobFinancials({
      lineItems: [{ quantity: 1, unitPrice: 89, unitCost: 15, itemType: "Service" }],
      expenses: [{ category: "Labor", amount: 48 }],
    });
    expect(f.totalPrice).toBe(89);
    expect(f.compensation).toBe(63);
    expect(f.allExpenses).toBe(0);
    expect(Math.round(f.margin)).toBe(29);
  });

  it("sends material cost to expenses and service cost to compensation", () => {
    const f = computeJobFinancials({
      lineItems: [
        { quantity: 1, unitPrice: 200, unitCost: 80, itemType: "Material" },
        { quantity: 1, unitPrice: 200, unitCost: 80, itemType: "Service" },
      ],
    });
    expect(f.compensation).toBe(80);
    expect(f.allExpenses).toBe(80);
  });

  it("treats an unknown or missing item type as a material cost", () => {
    const f = computeJobFinancials({
      lineItems: [{ quantity: 1, unitPrice: 100, unitCost: 30 }],
    });
    expect(f.allExpenses).toBe(30);
    expect(f.compensation).toBe(0);
  });

  it("matches expense categories regardless of casing", () => {
    const f = computeJobFinancials({ expenses: [{ category: "labor", amount: 10 }] });
    expect(f.compensation).toBe(10);
  });

  it("reports a zero margin for an empty job instead of NaN", () => {
    const f = computeJobFinancials({});
    expect(f.totalPrice).toBe(0);
    expect(f.margin).toBe(0);
  });

  it("goes negative when the job cost more than it sold for", () => {
    const f = computeJobFinancials({
      lineItems: [{ quantity: 1, unitPrice: 100, unitCost: 90, itemType: "Service" }],
      expenses: [{ category: "Fuel", amount: 40 }],
    });
    expect(f.grossProfit).toBe(-30);
    expect(f.margin).toBe(-30);
  });
});
