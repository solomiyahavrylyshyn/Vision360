// A report's history (FR-12.5) and the Home count (FR-15.6) — tasks 9348 / 9349.
//
// Each Generate, PDF (Print) and Excel download, Share and scheduled send is
// kept against the report: who, when, the period and the filters, and for a
// send whom it reached. As on the server, the period is written in as dates
// (`from` / `to`), so Open gives the same period and filters on today's data.
// Generated runs and downloads are the report's History; sends are its
// Activity, under its schedules.
//
// Prototype: localStorage only (no write-through to the shared demo database).
// Seeded relative to REPORT_TODAY, the date the report world is anchored to.
import { REPORTS } from "../reports/registry";
import type { ReportDef } from "../reports/types";
import { REPORT_TODAY, rangeForPreset, type DatePreset } from "../utils/reportDates";

export type RunKind = "Generated" | "ExportPdf" | "ExportXlsx" | "Shared" | "Scheduled";

/** The report's request as it was made, with the period's dates written in. */
export interface RunQuery {
  from: string;            // yyyy-mm-dd
  to: string;              // yyyy-mm-dd
  /** The preset picked at the time, kept only to label the period ("This month"). */
  preset: DatePreset;
  search: string;
  qf: Record<string, string>;
  amt: { min: string; max: string };
}

export interface ReportRun {
  id: string;
  reportId: string;
  kind: RunKind;
  at: string;              // ISO
  /** Null for a scheduled send — no one pressed a button. */
  by: string | null;
  query: RunQuery;
  /** Sends only: the people it reached. */
  recipients?: string[];
  /** Scheduled sends only. */
  scheduleId?: string;
}

export type Frequency = "daily" | "weekly" | "monthly";
export interface ReportScheduleRec {
  id: string;
  reportId: string;
  frequency: Frequency;
  time: string;            // "08:00"
  recipients: string[];
  createdBy: string;
}

export const SENDS: RunKind[] = ["Shared", "Scheduled"];
export const isSend = (r: ReportRun) => SENDS.includes(r.kind);

const LS_KEY = "vision360.reportHistory.v1";
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const at = (day: number, h: number, m: number) => new Date(REPORT_TODAY.getFullYear(), REPORT_TODAY.getMonth(), day, h, m).toISOString();
const NO_AMT = { min: "", max: "" };

function q(def: ReportDef<any>, preset: DatePreset, opts: { search?: string; filter?: boolean; from?: string; to?: string } = {}): RunQuery {
  const range = preset === "custom" ? { from: new Date(opts.from + "T12:00:00"), to: new Date(opts.to + "T12:00:00") } : rangeForPreset(preset);
  const qf = Object.fromEntries(def.quickFilters.map((f) => [f.key, f.default]));
  // A run "with filters" uses the report's first quick filter, first real option.
  const f = def.quickFilters[0];
  if (opts.filter && f) { const o = f.options.find((x) => x.value !== f.default); if (o) qf[f.key] = o.value; }
  return { from: ymd(range.from), to: ymd(range.to), preset, search: opts.search ?? "", qf, amt: NO_AMT };
}

// Most reports have a history; every third has none yet, so the empty states show too.
function seed(): { runs: ReportRun[]; schedules: ReportScheduleRec[] } {
  const runs: ReportRun[] = [];
  const schedules: ReportScheduleRec[] = [];
  REPORTS.forEach((def, i) => {
    if (i % 3 === 2) return;
    const id = (n: string) => `${def.id}-${n}`;
    const add = (r: Omit<ReportRun, "reportId">) => runs.push({ ...r, reportId: def.id });
    add({ id: id("r1"), kind: "Generated",  at: at(27, 9, 41),  by: "Maria Garcia", query: q(def, "this_month", { filter: true }) });
    add({ id: id("r2"), kind: "ExportPdf",  at: at(26, 16, 12), by: "Peter Novak",  query: q(def, "this_month") });
    add({ id: id("r3"), kind: "ExportXlsx", at: at(24, 11, 5),  by: "Travis Brown", query: q(def, "last_month", { search: "smith" }) });
    add({ id: id("r4"), kind: "Generated",  at: at(20, 14, 30), by: "Peter Novak",  query: q(def, "last_14", { filter: true }) });
    add({ id: id("r5"), kind: "Generated",  at: at(13, 10, 0),  by: "Maria Garcia", query: q(def, "last_month") });
    add({ id: id("r6"), kind: "Generated",  at: at(2, 8, 15),   by: "Peter Novak",  query: q(def, "last_month") });
    if (i % 3 === 0) {
      schedules.push({ id: id("s1"), reportId: def.id, frequency: "weekly", time: "08:00", recipients: ["Peter Novak", "Maria Garcia"], createdBy: "Peter Novak" });
      add({ id: id("w2"), kind: "Scheduled", at: at(23, 8, 0), by: null, scheduleId: id("s1"), recipients: ["Peter Novak", "Maria Garcia"], query: q(def, "custom", { from: "2026-03-16", to: "2026-03-22" }) });
      add({ id: id("w1"), kind: "Scheduled", at: at(16, 8, 0), by: null, scheduleId: id("s1"), recipients: ["Peter Novak", "Maria Garcia"], query: q(def, "custom", { from: "2026-03-09", to: "2026-03-15" }) });
    }
    add({ id: id("sh1"), kind: "Shared", at: at(25, 15, 47), by: "Peter Novak", recipients: ["Travis Brown"], query: q(def, "this_month", { filter: true }) });
  });
  return { runs, schedules };
}

let state: { runs: ReportRun[]; schedules: ReportScheduleRec[] } = (() => {
  try { const r = localStorage.getItem(LS_KEY); if (r) { const v = JSON.parse(r); if (v && Array.isArray(v.runs) && Array.isArray(v.schedules)) return v; } } catch { /* ignore */ }
  return seed();
})();
const listeners = new Set<() => void>();
const emit = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
  listeners.forEach((l) => l());
};
const newId = () => `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const reportHistoryStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => state,
  /** Generated runs and downloads, newest first. */
  history: (reportId: string) => state.runs.filter((r) => r.reportId === reportId && !isSend(r)).sort((a, b) => b.at.localeCompare(a.at)),
  /** Shared and scheduled sends, newest first. */
  sends: (reportId: string) => state.runs.filter((r) => r.reportId === reportId && isSend(r)).sort((a, b) => b.at.localeCompare(a.at)),
  schedules: (reportId: string) => state.schedules.filter((s) => s.reportId === reportId),
  record(run: Omit<ReportRun, "id" | "at">) {
    // Stamped on the report world's day (REPORT_TODAY) at the current clock time,
    // so it lands in "This month" with the seed and the Home count goes up.
    const now = new Date(), d = new Date(REPORT_TODAY);
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    state = { ...state, runs: [{ ...run, id: newId(), at: d.toISOString() }, ...state.runs] };
    emit();
  },
  saveSchedule(s: Omit<ReportScheduleRec, "id"> & { id?: string }) {
    const rec: ReportScheduleRec = { ...s, id: s.id ?? newId() };
    state = { ...state, schedules: s.id ? state.schedules.map((x) => (x.id === s.id ? rec : x)) : [...state.schedules, rec] };
    emit();
  },
  stopSchedule(id: string) { state = { ...state, schedules: state.schedules.filter((s) => s.id !== id) }; emit(); },
  /** FR-15.6 — Generate runs (not downloads or sends) in the range, of every report. */
  generatedCount(from: Date, to: Date) {
    return state.runs.filter((r) => r.kind === "Generated" && new Date(r.at) >= from && new Date(r.at) <= to).length;
  },
};

// ── Labels ───────────────────────────────────────────────────────────────────
const dLabel = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const periodLabel = (rq: RunQuery) => `${dLabel(rq.from)} – ${dLabel(rq.to)}`;
export const runTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

/** "Status: Overdue", "Search "smith"", "Amount: 500–∞" — what the run filtered on. */
export function describeQuery(def: ReportDef<any>, rq: RunQuery): string[] {
  const out: string[] = [];
  if (rq.search.trim()) out.push(`Search "${rq.search.trim()}"`);
  for (const f of def.quickFilters) {
    const v = rq.qf[f.key];
    if (v && v !== f.default) out.push(`${f.label}: ${f.options.find((o) => o.value === v)?.label ?? v}`);
  }
  if (rq.amt.min !== "" || rq.amt.max !== "") out.push(`Amount: ${rq.amt.min || "0"}–${rq.amt.max || "∞"}`);
  return out;
}

const WEEKDAY = "Monday";
const time12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
/** "Weekly, Monday 8:00 AM" — as the schedules list and a scheduled send's title read. */
export function scheduleWhen(s: ReportScheduleRec): string {
  if (s.frequency === "daily") return `Daily, ${time12(s.time)}`;
  if (s.frequency === "weekly") return `Weekly, ${WEEKDAY} ${time12(s.time)}`;
  return `Monthly, day 1, ${time12(s.time)}`;
}
export function scheduleNext(s: ReportScheduleRec): string {
  const d = new Date(REPORT_TODAY);
  if (s.frequency === "daily") d.setDate(d.getDate() + 1);
  else if (s.frequency === "weekly") d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  else d.setMonth(d.getMonth() + 1, 1);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${time12(s.time)}`;
}
export const namesLine = (names: string[]) => (names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`);
