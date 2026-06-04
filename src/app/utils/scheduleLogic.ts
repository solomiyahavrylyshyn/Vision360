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

// Backlog:
//  - Drag in_progress → Pending (drawer) → "Paused"
//  - Moving a job to Pending keeps status "Scheduled"
//  - Paused dragged to Pending stays "Paused"
export function statusAfterMoveToPending(prev: JobStatus): JobStatus {
  if (prev === "In Progress") return "Paused";
  if (prev === "Paused") return "Paused";
  return "Scheduled";
}

// ── Pending column membership & filter ────────────────────────────────────
// Backlog (Pending jobs US):
//  - Unassigned = has date, no technician
//  - Unscheduled = no date (may or may not have a technician)
//  - The Pending column holds anything unassigned OR unscheduled.
export type PendingFilter = "all" | "unassigned" | "unscheduled" | "both";

export function isUnassigned(job: Pick<SchedulableJob, "technicianId">): boolean {
  return !job.technicianId;
}
export function isUnscheduled(job: Pick<SchedulableJob, "unscheduled">): boolean {
  return !!job.unscheduled;
}
export function isPending(job: Pick<SchedulableJob, "technicianId" | "unscheduled">): boolean {
  return isUnassigned(job) || isUnscheduled(job);
}

export function pendingFilterMatch(
  job: Pick<SchedulableJob, "technicianId" | "unscheduled">,
  filter: PendingFilter,
): boolean {
  switch (filter) {
    case "unassigned": return isUnassigned(job);
    case "unscheduled": return isUnscheduled(job);
    case "both": return isUnassigned(job) && isUnscheduled(job);
    case "all":
    default: return isPending(job);
  }
}

export function pendingJobs<T extends Pick<SchedulableJob, "technicianId" | "unscheduled">>(
  jobs: T[],
  filter: PendingFilter = "all",
): T[] {
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
