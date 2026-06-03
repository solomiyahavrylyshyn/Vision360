// Single source of truth for job / appointment statuses across the whole app:
// the schedule board, the Jobs list, the Job detail page, and the client Jobs
// tab. Jobs and appointments are unified in MVP, so every surface uses the
// SAME full set — keep this list and the color map in lockstep here so the
// statuses never drift between pages again.
export type JobStatus =
  | "Unscheduled"
  | "Scheduled"
  | "Dispatched"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "Paused";

export const JOB_STATUSES: JobStatus[] = [
  "Unscheduled",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Completed",
  "Cancelled",
  "Paused",
];

// `color` = text / dot color; `bg` = badge background (the color at low alpha).
export const JOB_STATUS_STYLES: Record<JobStatus, { color: string; bg: string }> = {
  Unscheduled:   { color: "#64748B", bg: "rgba(100,116,139,0.15)" },
  Scheduled:     { color: "#4A6FA5", bg: "rgba(74,111,165,0.15)" },
  Dispatched:    { color: "#0891B2", bg: "rgba(8,145,178,0.15)" },
  "In Progress": { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  Completed:     { color: "#16A34A", bg: "rgba(22,163,74,0.15)" },
  Cancelled:     { color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
  Paused:        { color: "#A856F7", bg: "rgba(168,86,247,0.12)" },
};

// Convenience maps for call sites that want a flat color/bg lookup.
export const JOB_STATUS_COLOR: Record<string, string> = Object.fromEntries(
  JOB_STATUSES.map((s) => [s, JOB_STATUS_STYLES[s].color]),
);
export const JOB_STATUS_BG: Record<string, string> = Object.fromEntries(
  JOB_STATUSES.map((s) => [s, JOB_STATUS_STYLES[s].bg]),
);
