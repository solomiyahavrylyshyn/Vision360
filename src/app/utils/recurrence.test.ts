import { describe, it, expect } from "vitest";
import { expandRecurrence, describeRecurrence, type RecurrenceRule } from "./recurrence";

const start = new Date(2026, 0, 1); // Thu Jan 1, 2026

describe("expandRecurrence (recurring-job wizard)", () => {
  it("ends after N occurrences (count mode)", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1, endMode: "count", count: 12 };
    expect(expandRecurrence(rule, start)).toHaveLength(12);
  });

  it("daily with interval steps by N days", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 2, endMode: "count", count: 3 };
    const occ = expandRecurrence(rule, start);
    expect(occ.map((d) => d.getDate())).toEqual([1, 3, 5]);
  });

  it("weekly with specific weekdays emits each selected day", () => {
    // Mon (1) + Wed (3), 2 weeks → 4 occurrences
    const rule: RecurrenceRule = { frequency: "weekly", interval: 1, weekdays: [1, 3], endMode: "count", count: 4 };
    const occ = expandRecurrence(rule, start);
    expect(occ).toHaveLength(4);
    expect(occ.every((d) => d.getDay() === 1 || d.getDay() === 3)).toBe(true);
  });

  it("ends on a date (date mode) — never past the end date", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1, endMode: "date", endDate: "2026-03-31" };
    const occ = expandRecurrence(rule, start);
    // Jan 1, Feb 1, Mar 1 (Apr 1 is past Mar 31)
    expect(occ).toHaveLength(3);
    expect(occ.every((d) => d <= new Date("2026-03-31T23:59:59"))).toBe(true);
  });

  it("is capped so a misconfigured rule can never run away", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 1, endMode: "count", count: 9999 };
    expect(expandRecurrence(rule, start, 100)).toHaveLength(100);
  });

  it("describeRecurrence summarizes the rule", () => {
    expect(describeRecurrence({ frequency: "weekly", interval: 1, weekdays: [1, 3], endMode: "count", count: 12 }))
      .toBe("Every 1 week on Mon, Wed · ends after 12 occurrences");
  });
});
