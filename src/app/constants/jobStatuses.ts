// Single source of truth for job / appointment statuses across the whole app:
// the schedule board, the Jobs list, the Job detail page, and the client Jobs
// tab. Jobs and appointments are unified in MVP, so every surface uses the
// SAME full set — keep this list and the color map in lockstep here so the
// statuses never drift between pages again.
//
// Per the consolidated 2026-06 client spec (Schedule + Jobs walkthrough, Part 2
// "final list — 7"), there are SEVEN workflow statuses. This supersedes the
// earlier five-status note: "Unscheduled" is a real status (recurring future
// jobs are created with no date/assignee — Part 6) and "Paused" is a time-clock
// state (technician on a break / interruption — Part 5; it keeps its date and
// assignee so it stays ON the board, never in Pending).
//
// Status stays SEPARATE from the derived chips: a job's DATE and ASSIGNEE are
// still independent of its status, so "unscheduled" (no date) and "unassigned"
// (no technician) remain DERIVED predicates (see scheduleLogic) shown as chips —
// a job can be Scheduled yet have no date, or Scheduled + unassigned. The
// "Unscheduled" STATUS and the derived "unscheduled" CHIP happily coexist (a
// no-date recurring job carries both).
export type JobStatus =
  | "Unscheduled"
  | "Scheduled"
  | "Dispatched"
  | "In Progress"
  | "Paused"
  | "Completed"
  | "Cancelled";

export const JOB_STATUSES: JobStatus[] = [
  "Unscheduled",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Paused",
  "Completed",
  "Cancelled",
];

// `color` = text / dot color; `bg` = badge background (the color at low alpha).
export const JOB_STATUS_STYLES: Record<JobStatus, { color: string; bg: string }> = {
  Unscheduled:   { color: "#6B7280", bg: "rgba(107,114,128,0.15)" }, // neutral — matches the derived chip
  Scheduled:     { color: "#4A6FA5", bg: "rgba(74,111,165,0.15)" },
  Dispatched:    { color: "#0891B2", bg: "rgba(8,145,178,0.15)" },
  "In Progress": { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  Paused:        { color: "#64748B", bg: "rgba(100,116,139,0.15)" }, // slate — distinct "on hold" treatment
  Completed:     { color: "#16A34A", bg: "rgba(22,163,74,0.15)" },
  Cancelled:     { color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
};

// Material-icon ligature per status, for compact surfaces (the schedule board
// grid blocks) where a colored icon replaces the text pill. Keep the meaning
// legible: calendar states use calendar glyphs, the active job uses a wrench,
// terminal states use check / cancel.
export const JOB_STATUS_ICONS: Record<JobStatus, string> = {
  Unscheduled:   "event_busy",
  Scheduled:     "event",
  Dispatched:    "near_me",
  "In Progress": "build",
  Paused:        "pause_circle",
  Completed:     "check_circle",
  Cancelled:     "cancel",
};

// Convenience maps for call sites that want a flat color/bg lookup.
export const JOB_STATUS_COLOR: Record<string, string> = Object.fromEntries(
  JOB_STATUSES.map((s) => [s, JOB_STATUS_STYLES[s].color]),
);
export const JOB_STATUS_BG: Record<string, string> = Object.fromEntries(
  JOB_STATUSES.map((s) => [s, JOB_STATUS_STYLES[s].bg]),
);
