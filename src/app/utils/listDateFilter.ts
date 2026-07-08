// Canonical date quick-filter shared by every list page (Clients, Jobs,
// Estimates, Invoices, Payments, Expenses) so the "Date:" dropdown looks and
// behaves identically everywhere. One option set + one matcher.

export const LIST_DATE_OPTIONS = [
  { value: "all_time", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_14", label: "Last 14 days" },
  { value: "this_month", label: "This month" },
] as const;

export type ListDatePreset = (typeof LIST_DATE_OPTIONS)[number]["value"];

// Demo "today". Seed data clusters around Feb–Apr 2026, so the presets are
// anchored here rather than the real wall-clock date (which would leave every
// list empty). Matches the anchor the per-page filters used before unification.
export const LIST_TODAY = "2026-04-27";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Normalize the date formats used across the app ("2026-04-05", "Apr 5, 2026",
// "Mon Mar 30, 2026") to "YYYY-MM-DD". Returns "" when unparseable.
export function toISODate(input: string): string {
  if (!input) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "" : iso(d);
}

function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return iso(new Date(y, m - 1, d + delta));
}

// True if `dateStr` falls inside `preset`, relative to LIST_TODAY. Unknown
// presets and unparseable dates pass through (treated as "All time").
export function matchesListDatePreset(dateStr: string, preset: string): boolean {
  if (!preset || preset === "all_time") return true;
  const d = toISODate(dateStr);
  if (!d) return true;
  const today = LIST_TODAY;
  switch (preset) {
    case "today": return d === today;
    case "yesterday": return d === addDays(today, -1);
    case "last_14": return d >= addDays(today, -13) && d <= today;
    case "this_month": return d.slice(0, 7) === today.slice(0, 7);
    default: return true;
  }
}

// Label to show on the collapsed "Date:" select (only "All time" is prefixed).
export function listDateOptionLabel(value: string, label: string): string {
  return value === "all_time" ? "Date: All time" : label;
}
