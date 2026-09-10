import { describe, it, expect } from "vitest";
import {
  breakdownForItem, breakdownTotal, breakdownCompensation, defaultCostComponent,
  retotalBreakdown, rollUpBreakdown, rollUpPrice,
} from "./itemCost";

describe("defaultCostComponent", () => {
  it("treats a service cost as labor — it is what the technician is paid", () => {
    expect(defaultCostComponent("Service")).toBe("labor");
  });

  it("treats a part, a machine and a fee as materials — money paid out", () => {
    expect(defaultCostComponent("Material")).toBe("materials");
    expect(defaultCostComponent("Equipment")).toBe("materials");
    expect(defaultCostComponent("Asset")).toBe("materials");
    expect(defaultCostComponent("Admin")).toBe("materials");
    expect(defaultCostComponent(undefined)).toBe("materials");
  });
});

describe("breakdownForItem", () => {
  it("uses the split the company entered", () => {
    const b = breakdownForItem({ cost: 400, itemType: "Service", costBreakdown: { labor: 100, commission: 100, materials: 200 } });
    expect(b).toEqual({ labor: 100, commission: 100, materials: 200 });
    expect(breakdownTotal(b)).toBe(400);
    expect(breakdownCompensation(b)).toBe(200);
  });

  it("falls back to the whole cost in the bucket the type implies", () => {
    expect(breakdownForItem({ cost: 45, itemType: "Service" })).toEqual({ labor: 45, commission: 0, materials: 0 });
    expect(breakdownForItem({ cost: 98, itemType: "Equipment" })).toEqual({ labor: 0, commission: 0, materials: 98 });
  });

  it("rolls a group up from its members instead of guessing", () => {
    const group = {
      cost: 435,
      itemType: "Price Book",
      groupItems: [
        { itemId: 0, name: "Labor", itemType: "Service", quantity: 1, unitPrice: 480, unitCost: 325, costBreakdown: { labor: 180, commission: 145, materials: 0 } },
        { itemId: 5, name: "Motor", itemType: "Equipment", quantity: 1, unitPrice: 225, unitCost: 98 },
        { itemId: 4, name: "Capacitor", itemType: "Material", quantity: 1, unitPrice: 25, unitCost: 12 },
      ],
    };
    expect(breakdownForItem(group)).toEqual({ labor: 180, commission: 145, materials: 110 });
  });
});

describe("rollUpBreakdown", () => {
  it("multiplies each member by its quantity", () => {
    const b = rollUpBreakdown([
      { itemId: 1, name: "Install labor", itemType: "Service", quantity: 3, unitPrice: 95, unitCost: 45 },
      { itemId: 2, name: "Line set", itemType: "Material", quantity: 40, unitPrice: 18.5, unitCost: 6.75 },
    ]);
    expect(b).toEqual({ labor: 135, commission: 0, materials: 270 });
  });

  it("comes back empty for a group with no members", () => {
    expect(rollUpBreakdown([])).toEqual({ labor: 0, commission: 0, materials: 0 });
  });
});

describe("rollUpPrice", () => {
  it("sums the members' retail prices", () => {
    expect(rollUpPrice([
      { itemId: 1, name: "a", quantity: 2, unitPrice: 120, unitCost: 40 },
      { itemId: 2, name: "b", quantity: 1, unitPrice: 89, unitCost: 45 },
    ])).toBe(329);
  });
});

describe("retotalBreakdown", () => {
  it("puts a fresh total in the bucket the item type implies", () => {
    expect(retotalBreakdown(undefined, 200, "Service")).toEqual({ labor: 200, commission: 0, materials: 0 });
    expect(retotalBreakdown(undefined, 200, "Material")).toEqual({ labor: 0, commission: 0, materials: 200 });
  });

  it("scales an existing split so the entered ratios survive", () => {
    const next = retotalBreakdown({ labor: 100, commission: 100, materials: 200 }, 800, "Service");
    expect(next).toEqual({ labor: 200, commission: 200, materials: 400 });
    expect(breakdownTotal(next)).toBe(800);
  });

  it("keeps the split adding up to the total when the ratios do not divide evenly", () => {
    const next = retotalBreakdown({ labor: 1, commission: 1, materials: 1 }, 100, "Service");
    expect(breakdownTotal(next)).toBe(100);
  });
});
