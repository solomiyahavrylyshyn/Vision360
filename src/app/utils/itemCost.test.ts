import { describe, it, expect } from "vitest";
import {
  breakdownForItem, breakdownTotal, breakdownCompensation, defaultCostComponent, retotalBreakdown,
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
  it("uses the split the company entered — labor, commission and materials", () => {
    const b = breakdownForItem({ cost: 400, itemType: "Service", costBreakdown: { labor: 150, commission: 50, materials: 200 } });
    expect(b).toEqual({ labor: 150, commission: 50, materials: 200 });
    expect(breakdownTotal(b)).toBe(400);
    // Labor and commission both pay a person.
    expect(breakdownCompensation(b)).toBe(200);
  });

  it("falls back to the whole cost in the bucket the type implies", () => {
    expect(breakdownForItem({ cost: 45, itemType: "Service" })).toEqual({ labor: 45, commission: 0, materials: 0 });
    expect(breakdownForItem({ cost: 98, itemType: "Equipment" })).toEqual({ labor: 0, commission: 0, materials: 98 });
  });

  it("never implies commission — it only exists when typed in", () => {
    expect(breakdownForItem({ cost: 300, itemType: "Service" }).commission).toBe(0);
  });

  // Records written before commission was a component carry only labor and
  // materials; they read back unchanged with a zero commission.
  it("reads a two-part split written before commission existed", () => {
    const legacy = { cost: 400, itemType: "Service", costBreakdown: { labor: 200, materials: 200 } };
    expect(breakdownForItem(legacy)).toEqual({ labor: 200, commission: 0, materials: 200 });
    expect(breakdownTotal(legacy.costBreakdown)).toBe(400);
  });
});

describe("retotalBreakdown", () => {
  it("puts a fresh total in the bucket the item type implies", () => {
    expect(retotalBreakdown(undefined, 200, "Service")).toEqual({ labor: 200, commission: 0, materials: 0 });
    expect(retotalBreakdown(undefined, 200, "Material")).toEqual({ labor: 0, commission: 0, materials: 200 });
  });

  it("scales an existing split so the entered ratio survives", () => {
    const next = retotalBreakdown({ labor: 200, commission: 100, materials: 100 }, 800, "Service");
    expect(next).toEqual({ labor: 400, commission: 200, materials: 200 });
    expect(breakdownTotal(next)).toBe(800);
  });

  it("keeps the split adding up to the total when the ratio does not divide evenly", () => {
    const next = retotalBreakdown({ labor: 1, commission: 1, materials: 1 }, 100, "Service");
    expect(breakdownTotal(next)).toBe(100);
  });
});
