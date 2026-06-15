// Pure, unit-testable business rules for the Schedule / Dispatch board.
// Each rule maps directly to an acceptance criterion in the Schedule backlog
// (Vision360_Schedule_Backlog.csv) so the UI and the tests share one source
// of truth. Keep this free of React / DOM so it can be tested in isolation.

import type { JobStatus } from "../constants/jobStatuses";

// A minimal shape the rules operate on — both the day board and the pending
// column pass objects compatible with this.
export interface SchedulableJob {
  id: number;
  technicianId: string;          // "" = unassigned
  status: JobStatus;
  start: number;                 // hour-of-day (e.g. 9.5 = 9:30)
  end: number;
  unscheduled?: boolean;         // true = no fixed date yet
  jobType?: string;
}

// ── Default job duration by type (hours) ──────────────────────────────────
// Product decision (Marek call): the default duration is 2h for EVERY job type,
// with the single exception of Installation → 8h. It auto-fills the end time on
// create/drag and is configurable per client afterwards.
export const DEFAULT_DURATION_BY_TYPE: Record<string, number> = {
  Install: 8,
  Installation: 8,
};
export const DEFAULT_JOB_DURATION = 2;

export function durationForType(jobType?: string): number {
  if (!jobType) return DEFAULT_JOB_DURATION;
  return DEFAULT_DURATION_BY_TYPE[jobType] ?? DEFAULT_JOB_DURATION;
}

// ── Board visibility, slot occupancy & draggability ───────────────────────
// PO decision: a CANCELLED job STAYS on the board (rendered greyed / struck
// through) but it never OCCUPIES its slot — you can schedule another job over it.
// So "shown on board" and "occupies the slot" are two DIFFERENT predicates.
export function isShownOnBoard(_status: JobStatus): boolean {
  return true; // every status renders on the board, including Cancelled
}
// Does the job actually take up its time slot? A cancelled job does not, so it
// never blocks a conflict check (you can schedule over it) and is kept off the
// route map.
export function occupiesSlot(status: JobStatus): boolean {
  return status !== "Cancelled";
}
export function isDraggable(status: JobStatus): boolean {
  return status !== "Completed" && status !== "Cancelled";
}

// ── Status transitions on drag ────────────────────────────────────────────
// Backlog (Status updates US):
//  - Drag from Pending → slot → status becomes "Scheduled"
//  - Drag slot → slot → status unchanged
export function statusAfterAssignToSlot(prev: JobStatus, fromPending: boolean): JobStatus {
  if (fromPending) return "Scheduled";
  return prev;                                    // slot → slot keeps status
}

// The exact drag-back transform, straight from Marek (walkthrough-13, lines
// 312-348): "we are removing the date … do not remove the assignee … job
// becomes unscheduled … we are keeping assignee because it's a little bit
// leftover history." So: clear the DATE (unscheduled = true) and KEEP both the
// technician and the workflow status. Returns a patched copy.
export function applyMoveToPending<T extends { status: JobStatus }>(job: T): T & { unscheduled: true } {
  return { ...job, unscheduled: true };
}

// Unassign on board (brief §6 + Marek's overlap, line 288): KEEP the date,
// drop the technician. The job becomes "scheduled + unassigned" — it leaves the
// board (no technician) but still has a date, so it stays under the "scheduled"
// filter and also appears under "unassigned". The opposite of move-to-pending.
export function applyUnassign<T extends { technicianId: string }>(job: T): T {
  return { ...job, technicianId: "" };
}

// ── Pending column membership & filter ────────────────────────────────────
// Backlog (Pending jobs US, per Marek 02.06):
//  - ONE column "Pending jobs" with a dropdown:
//      Show all / Unassigned / Unscheduled / Unassigned + Unscheduled
//  - Unassigned  = has date, no technician (not started)
//  - Unscheduled = no date (may or may not have a technician)
//  - The Pending column holds anything unassigned OR unscheduled.
//  - "scheduled" (walkthrough-13): within Pending, the jobs that DO have a date
//    for the selected period but are still unassigned — Marek's "don't forget
//    today's must-do jobs" view.
export type PendingFilter = "all" | "unassigned" | "unscheduled" | "scheduled" | "both";

type PendingShape = Pick<SchedulableJob, "technicianId" | "unscheduled" | "status">;

export function isUnassigned(job: Pick<SchedulableJob, "technicianId">): boolean {
  return !job.technicianId;
}
export function isUnscheduled(job: Pick<SchedulableJob, "unscheduled">): boolean {
  return !!job.unscheduled;
}
export function isPending(job: PendingShape): boolean {
  return isUnassigned(job) || isUnscheduled(job);
}

// ── The two-flag model (Marek) ────────────────────────────────────────────
// A job is NOT a single status. It has two INDEPENDENT flags:
//   1) a DATE        → hasDate(job)      (absence = "unscheduled")
//   2) an ASSIGNEE   → isAssigned(job)   (absence = "unassigned")
// The sidebar's "scheduled / unscheduled / unassigned" are PREDICATES over
// these two flags, NOT an enum — and they OVERLAP: a dated job with no
// technician is BOTH "scheduled" AND "unassigned" at the same time.
// For developers: model this as `hasDate` + `assigneeId`, three sidebar
// buttons = predicates, never a status column.
export function hasDate(job: Pick<SchedulableJob, "unscheduled">): boolean {
  return !isUnscheduled(job);
}
export function isAssigned(job: Pick<SchedulableJob, "technicianId">): boolean {
  return !isUnassigned(job);
}
// A job appears on the calendar board ONLY when it has BOTH a date and an
// assignee (and isn't cancelled). Everything else lives in the pending sidebar.
export function belongsOnBoard(job: PendingShape): boolean {
  return hasDate(job) && isAssigned(job) && isShownOnBoard(job.status);
}

export function pendingFilterMatch(job: PendingShape, filter: PendingFilter): boolean {
  switch (filter) {
    case "unassigned": return isUnassigned(job);
    case "unscheduled": return isUnscheduled(job);
    case "scheduled": return !isUnscheduled(job); // pending but HAS a date
    // "Show unassigned + unscheduled" is the UNION — every pending job missing a
    // date OR a technician (the dispatcher's "needs scheduling attention" list).
    // The "+" reads as OR (NOT the intersection).
    case "both": return isUnassigned(job) || isUnscheduled(job);
    case "all":
    default: return isPending(job);
  }
}

// The derived scheduling-state tags for a job. Because the two flag-predicates
// OVERLAP (brief §4), a job can carry MORE THAN ONE — e.g. a job with no date
// AND no technician is BOTH "Unscheduled" and "Unassigned". The sidebar card and
// the job panel render every applicable tag so the overlap is always visible and
// never hidden behind a single priority badge (hiding it is what made the
// "unassigned" filter look broken — the unassigned-ness was invisible on cards
// that were also unscheduled). Returns scheduling tags only — never a workflow
// status.
export function schedulingTags(job: Pick<SchedulableJob, "technicianId" | "unscheduled">): string[] {
  const tags: string[] = [];
  if (isUnscheduled(job)) tags.push("Unscheduled");
  if (isUnassigned(job)) tags.push("Unassigned");
  return tags;
}

// Pending jobs in stable input order so the list stays predictable.
export function pendingJobs<T extends PendingShape>(jobs: T[], filter: PendingFilter = "all"): T[] {
  return jobs.filter((j) => isPending(j) && pendingFilterMatch(j, filter));
}

// ── Time-conflict detection ───────────────────────────────────────────────
// Two jobs for the SAME technician whose [start,end) intervals overlap clash.
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
export function hasTimeConflict(
  jobs: SchedulableJob[],
  jobId: number | null,
  technicianId: string,
  start: number,
  end: number,
): boolean {
  if (!technicianId) return false;
  return jobs.some(
    (j) =>
      j.id !== jobId &&
      j.technicianId === technicianId &&
      !j.unscheduled &&
      occupiesSlot(j.status) &&
      rangesOverlap(start, end, j.start, j.end),
  );
}

// ── Overlap packing (board lane layout) ───────────────────────────────────
// When a technician lane holds jobs whose [start,end) intervals overlap, they
// must NOT be painted on top of each other. Greedy interval-partitioning packs
// each job into the first sub-row whose previous job has already ended, so two
// overlapping jobs never share a sub-row. Returns the row index per job id plus
// the total row count (always >= 1) so the lane can grow to fit. Back-to-back
// jobs (one ends exactly when the next starts) are NOT an overlap → same row.
export function packOverlaps<T extends { id: number; start: number; end: number }>(
  jobs: T[],
): { rowByJobId: Record<number, number>; rowCount: number } {
  const sorted = [...jobs].sort((a, b) => a.start - b.start || a.end - b.end);
  const rowEnds: number[] = []; // rowEnds[r] = end time of the last job in row r
  const rowByJobId: Record<number, number> = {};
  for (const job of sorted) {
    let placed = rowEnds.findIndex((end) => end <= job.start);
    if (placed === -1) { placed = rowEnds.length; rowEnds.push(job.end); }
    else { rowEnds[placed] = job.end; }
    rowByJobId[job.id] = placed;
  }
  return { rowByJobId, rowCount: Math.max(1, rowEnds.length) };
}

// ── Seed deconfliction (no technician double-booked) ───────────────────────
// A technician can't be in two places at once, so the board must never show one
// person two time-overlapping jobs on the same day. Demo seeds assembled from
// multiple sources can violate this once placed on real dates. deconflict() keeps
// a non-overlapping set per (technician, day) greedily by start time — the FIRST
// item wins a tie (caller orders by priority). Jobs with no technician ("") or no
// date (unscheduled) never conflict and are always kept. Pure + deterministic
// given the input order; never run user-created jobs through it (don't hide data).
export function deconflict<
  T extends Pick<SchedulableJob, "technicianId" | "start" | "end" | "unscheduled"> & { date: Date | null },
>(list: T[]): T[] {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const placed = new Map<string, { start: number; end: number }[]>();
  const kept: T[] = [];
  for (const j of [...list].sort((a, b) => a.start - b.start || a.end - b.end)) {
    if (!j.technicianId || j.unscheduled || j.date == null) { kept.push(j); continue; }
    const key = `${j.technicianId}|${dayKey(j.date)}`;
    const slots = placed.get(key) ?? [];
    if (slots.some((s) => j.start < s.end && s.start < j.end)) continue; // overlaps a kept job → drop
    slots.push({ start: j.start, end: j.end });
    placed.set(key, slots);
    kept.push(j);
  }
  return kept;
}

// ── Daily KPI aggregation ─────────────────────────────────────────────────
// Backlog: compact counts (scheduled / in_progress / completed) + revenue,
// whole numbers. Cancelled jobs are excluded from the board KPIs.
export interface DailyKpis {
  scheduled: number;
  inProgress: number;
  completed: number;
  revenue: number;
}
export function dailyKpis(jobs: Array<Pick<SchedulableJob, "status"> & { amount?: number }>): DailyKpis {
  const k: DailyKpis = { scheduled: 0, inProgress: 0, completed: 0, revenue: 0 };
  for (const j of jobs) {
    if (j.status === "Cancelled") continue;
    if (j.status === "Scheduled" || j.status === "Dispatched") k.scheduled += 1;
    else if (j.status === "In Progress") k.inProgress += 1;
    else if (j.status === "Completed") {
      k.completed += 1;
      k.revenue += Math.round(j.amount ?? 0);
    }
  }
  return k;
}
