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
// Backlog: "duration auto by job type" when a job is dropped without one.
export const DEFAULT_DURATION_BY_TYPE: Record<string, number> = {
  Install: 4,
  Installation: 4,
  Repair: 2,
  Maintenance: 1.5,
  Inspection: 1,
  Estimate: 1,
  Emergency: 2,
};
export const DEFAULT_JOB_DURATION = 2;

export function durationForType(jobType?: string): number {
  if (!jobType) return DEFAULT_JOB_DURATION;
  return DEFAULT_DURATION_BY_TYPE[jobType] ?? DEFAULT_JOB_DURATION;
}

// ── Board visibility & draggability ───────────────────────────────────────
// Backlog: "completed not draggable; cancelled not shown".
export function isShownOnBoard(status: JobStatus): boolean {
  return status !== "Cancelled";
}
export function isDraggable(status: JobStatus): boolean {
  return status !== "Completed" && status !== "Cancelled";
}

// ── Status transitions on drag ────────────────────────────────────────────
// Backlog (Status updates US):
//  - Drag from Pending → slot → status becomes "Scheduled"
//  - Drag slot → slot → status unchanged
//  - Drag paused → slot → "In Progress" (resume)
export function statusAfterAssignToSlot(prev: JobStatus, fromPending: boolean): JobStatus {
  if (prev === "Paused") return "In Progress";   // resume takes priority
  if (fromPending) return "Scheduled";
  return prev;                                    // slot → slot keeps status
}

// Move to Pending (Marek/Solomiia 2026-06): the job loses its DATE (becomes
// unscheduled) but KEEPS its technician for history. The workflow status is
// unchanged EXCEPT an in-progress job pauses (it no longer has a slot).
//  - In Progress → Paused
//  - everything else (Scheduled, Dispatched, Paused) → unchanged
export function statusAfterMoveToPending(prev: JobStatus): JobStatus {
  return prev === "In Progress" ? "Paused" : prev;
}

// The exact drag-back transform, straight from Marek (walkthrough-13, lines
// 312-348): "we are removing the date … do not remove the assignee … job
// becomes unscheduled … we are keeping assignee because it's a little bit
// leftover history." So: clear the DATE (unscheduled = true), KEEP the
// technician, and pause an in-progress job. Returns a patched copy.
export function applyMoveToPending<T extends { status: JobStatus }>(job: T): T & { unscheduled: true } {
  return { ...job, unscheduled: true, status: statusAfterMoveToPending(job.status) };
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
//      Show all / Unassigned / Unscheduled / PAUSED / Unassigned + Unscheduled
//  - Unassigned  = has date, no technician (not started)
//  - Unscheduled = no date (may or may not have a technician)
//  - Paused      = was started then pulled back; pause icon; HIGHER priority
//    (customer mid-service, waiting) → sorted to the top of the column.
//  - The Pending column holds anything unassigned OR unscheduled OR paused.
//  - "scheduled" (walkthrough-13): within Pending, the jobs that DO have a date
//    for the selected period but are still unassigned — Marek's "don't forget
//    today's must-do jobs" view.
export type PendingFilter = "all" | "unassigned" | "unscheduled" | "scheduled" | "paused" | "both";

type PendingShape = Pick<SchedulableJob, "technicianId" | "unscheduled" | "status">;

export function isUnassigned(job: Pick<SchedulableJob, "technicianId">): boolean {
  return !job.technicianId;
}
export function isUnscheduled(job: Pick<SchedulableJob, "unscheduled">): boolean {
  return !!job.unscheduled;
}
export function isPaused(job: Pick<SchedulableJob, "status">): boolean {
  return job.status === "Paused";
}
export function isPending(job: PendingShape): boolean {
  return isUnassigned(job) || isUnscheduled(job) || isPaused(job);
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
    case "paused": return isPaused(job);
    // "Show unassigned + unscheduled" is the UNION — every pending job missing a
    // date OR a technician (the dispatcher's "needs scheduling attention" list).
    // The "+" reads as OR; this equals all pending EXCEPT a paused job that still
    // has both a date and a technician. (It is NOT the intersection.)
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
// that were also unscheduled). Paused is a workflow status, not a scheduling
// flag, so the UI handles it separately; this returns scheduling tags only.
export function schedulingTags(job: Pick<SchedulableJob, "technicianId" | "unscheduled">): string[] {
  const tags: string[] = [];
  if (isUnscheduled(job)) tags.push("Unscheduled");
  if (isUnassigned(job)) tags.push("Unassigned");
  return tags;
}

// Paused jobs float to the top (HIGHER priority per the backlog). Otherwise the
// input order is preserved (stable) so the list stays predictable.
export function pendingJobs<T extends PendingShape>(jobs: T[], filter: PendingFilter = "all"): T[] {
  return jobs
    .filter((j) => isPending(j) && pendingFilterMatch(j, filter))
    .map((j, i) => [j, i] as const)
    .sort((a, b) => {
      const pa = isPaused(a[0]) ? 0 : 1;
      const pb = isPaused(b[0]) ? 0 : 1;
      return pa !== pb ? pa - pb : a[1] - b[1]; // paused first, else stable
    })
    .map(([j]) => j);
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
      isShownOnBoard(j.status) &&
      rangesOverlap(start, end, j.start, j.end),
  );
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
    else if (j.status === "In Progress" || j.status === "Paused") k.inProgress += 1;
    else if (j.status === "Completed") {
      k.completed += 1;
      k.revenue += Math.round(j.amount ?? 0);
    }
  }
  return k;
}
