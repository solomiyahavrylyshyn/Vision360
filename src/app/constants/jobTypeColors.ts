// Job-type → colour mapping for the Schedule board, taken verbatim from the
// Figma legend (Vision360 Web App, node 946:27019). The card's left border +
// background tint AND the board legend both derive from here, so the colours
// never drift between the cards and the key.
export const JOB_TYPE_COLORS: Record<string, string> = {
  Service: "#F59E0B",
  Maintenance: "#16A34A",
  Installation: "#4A6FA5",
  Estimate: "#6B7280",
  Emergency: "#DC2626",
};

// Order shown in the legend (matches the Figma left-to-right order).
export const JOB_TYPE_ORDER = [
  "Service",
  "Maintenance",
  "Installation",
  "Estimate",
  "Emergency",
] as const;

export const DEFAULT_JOB_TYPE_COLOR = "#4A6FA5";

export function jobTypeColor(jobType?: string): string {
  return (jobType && JOB_TYPE_COLORS[jobType]) || DEFAULT_JOB_TYPE_COLOR;
}

// Faint card fill = the type colour at low alpha over white (matches the
// design's barely-tinted card background).
export function jobTypeTint(jobType?: string): string {
  return `color-mix(in srgb, ${jobTypeColor(jobType)} 8%, white)`;
}
