import { describe, it, expect } from "vitest";
import {
  durationForType,
  DEFAULT_JOB_DURATION,
  isShownOnBoard,
  isDraggable,
  statusAfterAssignToSlot,
  statusAfterMoveToPending,
  isUnassigned,
  isUnscheduled,
  isPending,
  pendingFilterMatch,
  pendingJobs,
  rangesOverlap,
  hasTimeConflict,
  dailyKpis,
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
    expect(isDraggable("Paused")).toBe(true);
    expect(isDraggable("Dispatched")).toBe(true);
    expect(isDraggable("Completed")).toBe(false);
    expect(isDraggable("Cancelled")).toBe(false);
  });
});

describe("statusAfterAssignToSlot (AC: pending→slot=scheduled, slot→slot unchanged, paused→slot resumes)", () => {
  it("pending job dropped on a slot becomes Scheduled", () => {
    expect(statusAfterAssignToSlot("Scheduled", true)).toBe("Scheduled");
    expect(statusAfterAssignToSlot("Dispatched", true)).toBe("Scheduled");
  });
  it("slot → slot keeps the status", () => {
    expect(statusAfterAssignToSlot("Scheduled", false)).toBe("Scheduled");
    expect(statusAfterAssignToSlot("Dispatched", false)).toBe("Dispatched");
    expect(statusAfterAssignToSlot("In Progress", false)).toBe("In Progress");
  });
  it("a paused job dropped on a slot resumes to In Progress", () => {
    expect(statusAfterAssignToSlot("Paused", false)).toBe("In Progress");
    expect(statusAfterAssignToSlot("Paused", true)).toBe("In Progress");
  });
});

describe("statusAfterMoveToPending (AC: in_progress→paused; move to pending keeps scheduled)", () => {
  it("in-progress dragged to the drawer pauses", () => {
    expect(statusAfterMoveToPending("In Progress")).toBe("Paused");
  });
  it("paused stays paused", () => {
    expect(statusAfterMoveToPending("Paused")).toBe("Paused");
  });
  it("scheduled / dispatched moved to pending stay/return to Scheduled", () => {
    expect(statusAfterMoveToPending("Scheduled")).toBe("Scheduled");
    expect(statusAfterMoveToPending("Dispatched")).toBe("Scheduled");
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
  it("filter: all / unassigned / unscheduled / both", () => {
    const all = [unassigned, unscheduledWithTech, both, normal];
    expect(pendingJobs(all, "all").map((j) => j.id).sort()).toEqual([1, 2, 3]);
    expect(pendingJobs(all, "unassigned").map((j) => j.id).sort()).toEqual([1, 3]);
    expect(pendingJobs(all, "unscheduled").map((j) => j.id).sort()).toEqual([2, 3]);
    expect(pendingJobs(all, "both").map((j) => j.id)).toEqual([3]);
  });
  it("pendingFilterMatch is consistent with pendingJobs", () => {
    expect(pendingFilterMatch(unscheduledWithTech, "unassigned")).toBe(false);
    expect(pendingFilterMatch(unscheduledWithTech, "unscheduled")).toBe(true);
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
      { status: "Paused" as const },
      { status: "Completed" as const, amount: 199.6 },
      { status: "Completed" as const, amount: 100.4 },
      { status: "Cancelled" as const, amount: 999 },
    ];
    const k = dailyKpis(jobs);
    expect(k.scheduled).toBe(2);  // scheduled + dispatched
    expect(k.inProgress).toBe(2); // in progress + paused
    expect(k.completed).toBe(2);
    expect(k.revenue).toBe(300);  // 200 + 100, cancelled excluded, whole dollars
    expect(Number.isInteger(k.revenue)).toBe(true);
  });
});
