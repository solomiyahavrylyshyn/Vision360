// Pure recurrence expansion for the Create-Job recurring wizard (Marek, Jun 8:
// "ends after N occurrences" OR "ends on date"; repeat daily/weekly/monthly/yearly,
// weekly with specific weekdays). Kept free of React/DOM so it can be unit-tested.
// Recurring jobs are generated as a SERIES of unscheduled + unassigned jobs
// (Marek, Jun 5 — the dispatcher schedules each one later).

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;            // every N days/weeks/months/years (>=1)
  weekdays?: number[];         // weekly only: 0=Sun … 6=Sat
  dayOfMonth?: number;         // monthly only: 1..31 (clamped to the month's last day)
  endMode: "count" | "date";
  count?: number;              // ends after N occurrences
  endDate?: string;            // "YYYY-MM-DD" — ends on/before this date
}

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => addDays(d, -d.getDay()); // Sunday

/**
 * Expand a recurrence rule into concrete occurrence dates starting at `start`.
 * Capped at `cap` (default 100) so a misconfigured rule can never run away.
 */
export function expandRecurrence(rule: RecurrenceRule, start: Date, cap = 100): Date[] {
  const interval = Math.max(1, Math.floor(rule.interval || 1));
  const maxByCount = rule.endMode === "count"
    ? Math.max(1, Math.min(cap, Math.floor(rule.count || 1)))
    : cap;
  const end = rule.endMode === "date" && rule.endDate ? new Date(rule.endDate + "T23:59:59") : null;
  const out: Date[] = [];
  const anchor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (rule.frequency === "weekly" && rule.weekdays && rule.weekdays.length) {
    const wds = [...rule.weekdays].sort((a, b) => a - b);
    const base = startOfWeek(anchor);
    for (let week = 0; week < 520 && out.length < maxByCount; week++) {
      if (week % interval !== 0) continue;
      for (const wd of wds) {
        const d = addDays(base, week * 7 + wd);
        if (d < anchor) continue;          // don't emit before the anchor day
        if (end && d > end) return out;    // past the end date → done
        out.push(d);
        if (out.length >= maxByCount) break;
      }
    }
    return out.slice(0, cap);
  }

  // Monthly on a fixed day-of-month (e.g. "the 5th"), clamped to the month's
  // last day (so "31st" becomes Feb 28/29). Steps by `interval` months.
  if (rule.frequency === "monthly" && rule.dayOfMonth) {
    const dom = Math.min(31, Math.max(1, Math.floor(rule.dayOfMonth)));
    const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const make = (y: number, m: number) => new Date(y, m, Math.min(dom, lastDay(y, m)));
    const y0 = anchor.getFullYear();
    let m = anchor.getMonth();
    if (make(y0, m) < anchor) m += 1; // this month's day already passed → start next month
    let guard = 0;
    while (out.length < maxByCount && guard++ < 5000) {
      const cur = make(y0, m);
      if (end && cur > end) break;
      out.push(cur);
      m += interval;
    }
    return out.slice(0, cap);
  }

  let d = new Date(anchor);
  let guard = 0;
  while (out.length < maxByCount && guard++ < 5000) {
    if (end && d > end) break;
    out.push(new Date(d));
    if (rule.frequency === "daily") d = addDays(d, interval);
    else if (rule.frequency === "weekly") d = addDays(d, 7 * interval);
    else if (rule.frequency === "monthly") d = new Date(d.getFullYear(), d.getMonth() + interval, d.getDate());
    else d = new Date(d.getFullYear() + interval, d.getMonth(), d.getDate()); // yearly
  }
  return out.slice(0, cap);
}

const FREQ_NOUN: Record<RecurrenceFrequency, string> = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human-readable summary, e.g. "Every 1 week on Mon, Wed · ends after 12". */
export function describeRecurrence(rule: RecurrenceRule): string {
  const every = `Every ${rule.interval} ${FREQ_NOUN[rule.frequency]}${rule.interval === 1 ? "" : "s"}`;
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };
  const on = rule.frequency === "weekly" && rule.weekdays && rule.weekdays.length
    ? ` on ${[...rule.weekdays].sort((a, b) => a - b).map((w) => WD[w]).join(", ")}`
    : rule.frequency === "monthly" && rule.dayOfMonth
    ? ` on the ${ordinal(rule.dayOfMonth)}`
    : "";
  const ends = rule.endMode === "count"
    ? ` · ends after ${Math.max(1, Math.floor(rule.count || 1))} occurrence${(rule.count || 1) === 1 ? "" : "s"}`
    : rule.endDate ? ` · ends ${rule.endDate}` : "";
  return `${every}${on}${ends}`;
}
