import { describe, it, expect } from "vitest";
import {
  durationForType,
  DEFAULT_JOB_DURATION,
  isShownOnBoard,
  isDraggable,
  statusAfterAssignToSlot,
  applyMoveToPending,
  applyUnassign,
  isUnassigned,
  isUnscheduled,
  hasDate,
  isAssigned,
  belongsOnBoard,
  isPending,
  pendingFilterMatch,
  pendingJobs,
  schedulingTags,
  rangesOverlap,
  hasTimeConflict,
  dailyKpis,
  packOverlaps,
  type SchedulableJob,
} from "./scheduleLogic";

const job = (over: Partial<SchedulableJob> = {}): SchedulableJob => ({
  id: 1, technicianId: "peter", status: "Scheduled", start: 9, end: 11, ...over,
});

describe("durationForType — default duration by job type", () => {
  it("maps known types", () => {
    expect(durationForType("Install")).toBe(4);
    expect(durationForType("Repair")).toBe(2);
    expect(durationForType("Maintenance")).toBe(1.5);
    expect(durationForType("Estimate")).toBe(1);
  });
  it("falls back for unknown / missing types", () => {
    expect(durationForType("Frobnicate")).toBe(DEFAULT_JOB_DURATION);
    expect(durationForType(undefined)).toBe(DEFAULT_JOB_DURATION);
  });
});

describe("board visibility & draggability (AC: completed not draggable; cancelled not shown)", () => {
  it("hides only cancelled from the board", () => {
    expect(isShownOnBoard("Scheduled")).toBe(true);
    expect(isShownOnBoard("Completed")).toBe(true);
    expect(isShownOnBoard("Cancelled")).toBe(false);
  });
  it("blocks dragging completed and cancelled, allows the rest", () => {
    expect(isDraggable("Scheduled")).toBe(true);
    expect(isDraggable("In Progress")).toBe(true);
    expect(isDraggable("Dispatched")).toBe(true);
    expect(isDraggable("Completed")).toBe(false);
    expect(isDraggable("Cancelled")).toBe(false);
  });
});

describe("statusAfterAssignToSlot (AC: pending→slot=scheduled, slot→slot unchanged)", () => {
  it("pending job dropped on a slot becomes Scheduled", () => {
    expect(statusAfterAssignToSlot("Scheduled", true)).toBe("Scheduled");
    expect(statusAfterAssignToSlot("Dispatched", true)).toBe("Scheduled");
  });
  it("slot → slot keeps the status", () => {
    expect(statusAfterAssignToSlot("Scheduled", false)).toBe("Scheduled");
    expect(statusAfterAssignToSlot("Dispatched", false)).toBe("Dispatched");
    expect(statusAfterAssignToSlot("In Progress", false)).toBe("In Progress");
  });
});

describe("applyMoveToPending (Marek transcript lines 312-348: remove date, KEEP assignee + status)", () => {
  it("clears the date (→ unscheduled) but KEEPS the technician", () => {
    const r = applyMoveToPending(job({ technicianId: "travis", unscheduled: false, status: "Scheduled" }));
    expect(r.unscheduled).toBe(true);        // date removed → unscheduled
    expect(r.technicianId).toBe("travis");   // assignee kept (leftover history)
    expect(r.status).toBe("Scheduled");      // workflow status unchanged
  });
  it("an in-progress job keeps its status + tech (Paused removed from the model)", () => {
    const r = applyMoveToPending(job({ technicianId: "peter", unscheduled: false, status: "In Progress" }));
    expect(r.unscheduled).toBe(true);
    expect(r.technicianId).toBe("peter");
    expect(r.status).toBe("In Progress");    // no longer auto-paused
  });
});

describe("applyUnassign (brief §6: keep the date, drop the technician)", () => {
  it("removes the technician but KEEPS the date → scheduled + unassigned", () => {
    const r = applyUnassign(job({ technicianId: "travis", unscheduled: false, status: "Scheduled" }));
    expect(r.technicianId).toBe("");          // technician dropped
    expect(r.unscheduled).toBeFalsy();        // date kept (still scheduled)
    expect(isUnassigned(r)).toBe(true);
    expect(hasDate(r)).toBe(true);
    // It's the overlap: matches BOTH scheduled and unassigned, off the board.
    expect(pendingFilterMatch(r, "scheduled")).toBe(true);
    expect(pendingFilterMatch(r, "unassigned")).toBe(true);
    expect(belongsOnBoard(r)).toBe(false);
  });
});

describe("pending membership & filter (AC: unassigned=no tech; unscheduled=no date)", () => {
  const unassigned = job({ id: 1, technicianId: "", unscheduled: false }); // has date, no tech
  const unscheduledWithTech = job({ id: 2, technicianId: "travis", unscheduled: true }); // no date, has tech
  const both = job({ id: 3, technicianId: "", unscheduled: true }); // no tech AND no date
  const normal = job({ id: 4, technicianId: "maria", unscheduled: false }); // assigned + scheduled

  it("classifies unassigned / unscheduled", () => {
    expect(isUnassigned(unassigned)).toBe(true);
    expect(isUnassigned(unscheduledWithTech)).toBe(false);
    expect(isUnscheduled(unscheduledWithTech)).toBe(true);
    expect(isUnscheduled(unassigned)).toBe(false);
  });
  it("pending column = unassigned OR unscheduled; a normal job is not pending", () => {
    expect(isPending(unassigned)).toBe(true);
    expect(isPending(unscheduledWithTech)).toBe(true);
    expect(isPending(both)).toBe(true);
    expect(isPending(normal)).toBe(false);
  });
  it("filter: all / unassigned / unscheduled / scheduled / both", () => {
    const all = [unassigned, unscheduledWithTech, both, normal];
    expect(pendingJobs(all, "all").map((j) => j.id).sort()).toEqual([1, 2, 3]);
    expect(pendingJobs(all, "unassigned").map((j) => j.id).sort()).toEqual([1, 3]);
    expect(pendingJobs(all, "unscheduled").map((j) => j.id).sort()).toEqual([2, 3]);
    // "unassigned + unscheduled" is the UNION (no date OR no tech), NOT the
    // intersection — so every pending job (1, 2, 3) matches; only the fully
    // scheduled+assigned job (4) is excluded.
    expect(pendingJobs(all, "both").map((j) => j.id).sort()).toEqual([1, 2, 3]);
    // "scheduled" = pending jobs that DO have a date (not unscheduled).
    // Only the unassigned-with-date job (id 1) qualifies.
    expect(pendingJobs(all, "scheduled").map((j) => j.id)).toEqual([1]);
  });
  it("pendingFilterMatch is consistent with pendingJobs", () => {
    expect(pendingFilterMatch(unscheduledWithTech, "unassigned")).toBe(false);
    expect(pendingFilterMatch(unscheduledWithTech, "unscheduled")).toBe(true);
  });
});

describe("two-flag model (Marek): date + assignee are independent; filters overlap", () => {
  const datedNoTech = job({ id: 1, technicianId: "", unscheduled: false });        // date, no tech
  const techNoDate = job({ id: 2, technicianId: "peter", unscheduled: true });      // tech, no date
  const both = job({ id: 3, technicianId: "peter", unscheduled: false });           // date + tech
  const neither = job({ id: 4, technicianId: "", unscheduled: true });              // no date, no tech

  it("hasDate / isAssigned are the two independent flags", () => {
    expect(hasDate(datedNoTech)).toBe(true);
    expect(isAssigned(datedNoTech)).toBe(false);
    expect(hasDate(techNoDate)).toBe(false);
    expect(isAssigned(techNoDate)).toBe(true);
  });
  it("a dated job with no technician is BOTH scheduled AND unassigned", () => {
    expect(pendingFilterMatch(datedNoTech, "scheduled")).toBe(true);
    expect(pendingFilterMatch(datedNoTech, "unassigned")).toBe(true);
  });
  it("a job is on the board ONLY with both a date and an assignee", () => {
    expect(belongsOnBoard(both)).toBe(true);
    expect(belongsOnBoard(datedNoTech)).toBe(false);   // missing assignee
    expect(belongsOnBoard(techNoDate)).toBe(false);    // missing date
    expect(belongsOnBoard(neither)).toBe(false);
  });
  it("cancelled never belongs on the board even with date + assignee", () => {
    expect(belongsOnBoard(job({ technicianId: "peter", unscheduled: false, status: "Cancelled" }))).toBe(false);
  });
});

describe("schedulingTags (the overlap must be VISIBLE on the card/panel)", () => {
  it("a job with no date AND no technician carries BOTH tags", () => {
    expect(schedulingTags(job({ technicianId: "", unscheduled: true }))).toEqual(["Unscheduled", "Unassigned"]);
  });
  it("a dated job with no technician is Unassigned only (NOT unscheduled)", () => {
    expect(schedulingTags(job({ technicianId: "", unscheduled: false }))).toEqual(["Unassigned"]);
  });
  it("a dragged-back job (no date, keeps tech) is Unscheduled only (NOT unassigned)", () => {
    // This is the case that made the filter look broken: when EVERY unscheduled
    // seed job was also tech-less, "unscheduled" and "unassigned" looked nested.
    // A real dragged-back job keeps its technician, so it is unscheduled ONLY.
    expect(schedulingTags(job({ technicianId: "travis", unscheduled: true }))).toEqual(["Unscheduled"]);
  });
  it("a fully scheduled + assigned board job carries no scheduling tags", () => {
    expect(schedulingTags(job({ technicianId: "peter", unscheduled: false }))).toEqual([]);
  });
});

describe("time-conflict detection", () => {
  it("rangesOverlap is half-open (touching edges don't clash)", () => {
    expect(rangesOverlap(9, 11, 10, 12)).toBe(true);
    expect(rangesOverlap(9, 11, 11, 12)).toBe(false); // back-to-back is OK
    expect(rangesOverlap(9, 11, 8, 9)).toBe(false);
  });
  it("flags overlap for the same technician only", () => {
    const jobs = [job({ id: 1, technicianId: "peter", start: 9, end: 11 })];
    expect(hasTimeConflict(jobs, null, "peter", 10, 12)).toBe(true);   // overlaps Peter
    expect(hasTimeConflict(jobs, null, "travis", 10, 12)).toBe(false); // different tech
    expect(hasTimeConflict(jobs, 1, "peter", 10, 12)).toBe(false);     // same job (being moved)
  });
  it("ignores unscheduled and cancelled jobs", () => {
    const jobs = [
      job({ id: 1, technicianId: "peter", start: 9, end: 11, unscheduled: true }),
      job({ id: 2, technicianId: "peter", start: 9, end: 11, status: "Cancelled" }),
    ];
    expect(hasTimeConflict(jobs, null, "peter", 9.5, 10.5)).toBe(false);
  });
});

describe("dailyKpis aggregation (AC: counts + revenue, whole numbers, exclude cancelled)", () => {
  it("buckets statuses and sums completed revenue (rounded)", () => {
    const jobs = [
      { status: "Scheduled" as const },
      { status: "Dispatched" as const },
      { status: "In Progress" as const },
      { status: "Completed" as const, amount: 199.6 },
      { status: "Completed" as const, amount: 100.4 },
      { status: "Cancelled" as const, amount: 999 },
    ];
    const k = dailyKpis(jobs);
    expect(k.scheduled).toBe(2);  // scheduled + dispatched
    expect(k.inProgress).toBe(1); // in progress
    expect(k.completed).toBe(2);
    expect(k.revenue).toBe(300);  // 200 + 100, cancelled excluded, whole dollars
    expect(Number.isInteger(k.revenue)).toBe(true);
  });
});

describe("packOverlaps — sub-row layout so lane cards never cover each other", () => {
  const ev = (id: number, start: number, end: number) => ({ id, start, end });

  it("keeps non-overlapping jobs on a single row", () => {
    const { rowByJobId, rowCount } = packOverlaps([ev(1, 8, 10), ev(2, 10, 12), ev(3, 13, 14)]);
    expect(rowCount).toBe(1);
    expect(rowByJobId).toEqual({ 1: 0, 2: 0, 3: 0 });
  });

  it("treats back-to-back jobs (end === next start) as non-overlapping", () => {
    const { rowCount } = packOverlaps([ev(1, 9, 10), ev(2, 10, 11)]);
    expect(rowCount).toBe(1);
  });

  it("pushes a time-overlapping job to a second row", () => {
    const { rowByJobId, rowCount } = packOverlaps([ev(1, 8, 10), ev(2, 9, 11)]);
    expect(rowCount).toBe(2);
    expect(rowByJobId[1]).toBe(0);
    expect(rowByJobId[2]).toBe(1);
  });

  it("reuses a freed row — the screenshot case (8-10, 9-11, 10:30-12) packs into 2 rows", () => {
    // AC Repair 8-10, AC Installation 9-11, Water Heater 10:30-12.
    const { rowByJobId, rowCount } = packOverlaps([ev(1, 8, 10), ev(2, 9, 11), ev(3, 10.5, 12)]);
    expect(rowCount).toBe(2);
    expect(rowByJobId[1]).toBe(0);          // row 0
    expect(rowByJobId[2]).toBe(1);          // overlaps #1 → row 1
    expect(rowByJobId[3]).toBe(0);          // 10:30 ≥ 10, row 0 is free again
  });

  it("always reports at least one row, even when empty", () => {
    expect(packOverlaps([]).rowCount).toBe(1);
  });

  it("is order-independent (sorts internally)", () => {
    const a = packOverlaps([ev(3, 10.5, 12), ev(1, 8, 10), ev(2, 9, 11)]);
    const b = packOverlaps([ev(1, 8, 10), ev(2, 9, 11), ev(3, 10.5, 12)]);
    expect(a).toEqual(b);
  });
});
