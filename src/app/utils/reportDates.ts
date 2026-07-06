// Shared date-range logic for the Reports module. One date-preset vocabulary
// used by every report (role model: the Estimates picker), so the picker never
// drifts between reports (Marek call #21 — "unify the date picker").
//
// REPORT_TODAY anchors relative presets ("this month" etc.) to the mock-data
// era so the default "This month" actually shows seed rows instead of an empty
// table. March 2026 is where invoices, payments and estimates cluster, so we
// anchor there (late March) — the whole point of the current-month default is
// that a report loads with recent data, not the entire database.
export const REPORT_TODAY = new Date("2026-03-27T12:00:00");

export type DatePreset =
  | "today"
  | "yesterday"
  | "last_14"
  | "this_month"
  | "last_month"
  | "last_quarter"
  | "this_year"
  | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_14", label: "Last 14 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export interface DateRange {
  from: Date;
  to: Date;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function rangeForPreset(
  preset: DatePreset,
  custom?: { from?: string; to?: string },
  today: Date = REPORT_TODAY,
): DateRange {
  const t = startOfDay(today);
  switch (preset) {
    case "today":
      return { from: startOfDay(t), to: endOfDay(t) };
    case "yesterday": {
      const y = new Date(t);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "last_14": {
      const from = new Date(t);
      from.setDate(from.getDate() - 13);
      return { from: startOfDay(from), to: endOfDay(today) };
    }
    case "this_month":
      return {
        from: new Date(t.getFullYear(), t.getMonth(), 1, 0, 0, 0, 0),
        to: new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "last_month":
      return {
        from: new Date(t.getFullYear(), t.getMonth() - 1, 1, 0, 0, 0, 0),
        to: new Date(t.getFullYear(), t.getMonth(), 0, 23, 59, 59, 999),
      };
    case "last_quarter": {
      const q = Math.floor(t.getMonth() / 3); // 0..3 for current quarter
      const startMonth = (q - 1) * 3; // may be negative → rolls into prev year
      const from = new Date(t.getFullYear(), startMonth, 1, 0, 0, 0, 0);
      const to = new Date(t.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case "this_year":
      return {
        from: new Date(t.getFullYear(), 0, 1, 0, 0, 0, 0),
        to: new Date(t.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "custom": {
      const from = custom?.from ? startOfDay(new Date(custom.from + "T12:00:00")) : new Date(2000, 0, 1);
      const to = custom?.to ? endOfDay(new Date(custom.to + "T12:00:00")) : endOfDay(today);
      return { from, to };
    }
    default:
      return { from: new Date(2000, 0, 1), to: endOfDay(today) };
  }
}

// Parse the varied date strings across stores consistently as LOCAL time.
// Date.parse treats an ISO date-only string ("2026-03-01") as UTC midnight,
// which shifts it to the previous day in any west-of-UTC timezone — so a
// month-boundary row would fall into the neighbouring month once compared
// against the locally-built range boundaries. Anchor ISO date-only strings at
// local noon; spelled-out formats ("Mon Mar 30, 2026") already parse as local.
function parseLocalMs(s: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(s + "T12:00:00") : Date.parse(s);
}

// Test membership of a store date string in a range. Unparseable / empty
// dates are excluded.
export function inRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  const ms = parseLocalMs(dateStr);
  if (Number.isNaN(ms)) return false;
  return ms >= range.from.getTime() && ms <= range.to.getTime();
}

// Whole days past a due date relative to REPORT_TODAY (for AR aging buckets).
// Returns NaN when there is no parseable due date, so callers can treat
// "unknown age" separately instead of folding it into the "current" bucket.
export function daysPastDue(dueDateStr: string | undefined, today: Date = REPORT_TODAY): number {
  if (!dueDateStr) return NaN;
  const ms = parseLocalMs(dueDateStr);
  if (Number.isNaN(ms)) return NaN;
  return Math.floor((startOfDay(today).getTime() - startOfDay(new Date(ms)).getTime()) / 86_400_000);
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(range.from)} – ${fmt(range.to)}`;
}
