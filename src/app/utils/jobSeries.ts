// A recurring job is a series of separate jobs (Marek, Jun 5): each visit is its
// own job record carrying `series` — which series, which visit, how many visits,
// and the rule. Tasks 9117 / 9236 / 9237: "Visit N of M", See all visits, change
// the number of visits or the end date, cancel the series. Completed visits are
// never changed; nothing is deleted — cancelled visits stay as Cancelled.

import { jobsStore, type JobRecord } from "../stores/jobsStore";
import { describeRecurrence, expandRecurrence, type RecurrenceRule } from "./recurrence";

export interface JobSeriesInfo {
  id: string;
  /** 1-based visit number. */
  index: number;
  /** Visits in the plan (cancelled ones beyond it don't count). */
  total: number;
  rule: RecurrenceRule;
}

type SeriesJob = JobRecord & { series: JobSeriesInfo };

const isDone = (j: JobRecord) => j.status === "Completed";
const isCancelled = (j: JobRecord) => j.status === "Cancelled";

export function seriesVisits(seriesId: string): SeriesJob[] {
  return (jobsStore.getSnapshot().filter((j) => j.series?.id === seriesId) as SeriesJob[])
    .sort((a, b) => a.series.index - b.series.index);
}

/** The visits still in the plan: everything except the ones cancelled. */
export const activeVisits = (seriesId: string) => seriesVisits(seriesId).filter((j) => !isCancelled(j));

const fmtDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "Every 1 week on Mon · ends after 10 visits" / "… · ends on 1 Jul 2027". */
export function seriesRuleText(rule: RecurrenceRule, total: number): string {
  const head = describeRecurrence({ ...rule, endMode: "count", count: 1 }).split(" · ")[0];
  const ends = rule.endMode === "date" && rule.endDate
    ? `ends on ${fmtDate(rule.endDate)}`
    : `ends after ${total} visit${total === 1 ? "" : "s"}`;
  return `${head} · ${ends}`;
}

const retitle = (title: string, i: number, n: number) => `${title.replace(/\s*\(\d+\/\d+\)$/, "")} (${i}/${n})`;

/** How many visits a date end gives, counted from the first visit's day. */
export function visitsUntil(rule: RecurrenceRule, endDate: string, start: Date): number {
  return expandRecurrence({ ...rule, endMode: "date", endDate }, start).length;
}

/** The smallest plan allowed: every completed visit has to stay inside it. */
export function minVisits(seriesId: string): number {
  return Math.max(1, ...activeVisits(seriesId).filter(isDone).map((j) => j.series.index));
}

/** Shrink or extend the plan to `n` visits. Visits past `n` are cancelled
 *  (completed ones never); new visits are copies of visit 1, unscheduled. */
export function changeSeriesVisits(seriesId: string, n: number, rule: RecurrenceRule) {
  const visits = activeVisits(seriesId);
  if (!visits.length) return;
  const first = visits[0];
  n = Math.max(minVisits(seriesId), Math.floor(n));
  visits.forEach((v) => {
    if (v.series.index > n && !isDone(v)) jobsStore.update(v.id, { status: "Cancelled" });
  });
  for (let i = visits.length + 1; i <= n; i++) {
    const { id: _id, createdAt: _c, series: _s, ...copy } = first;
    jobsStore.add({
      ...copy,
      title: retitle(first.title, i, n),
      assignedTo: "", startDate: "", endDate: "", startTime: "", endTime: "",
      status: "Unscheduled",
      series: { ...first.series, index: i, total: n, rule },
    });
  }
  activeVisits(seriesId).forEach((v) => {
    jobsStore.update(v.id, { title: retitle(v.title, v.series.index, n), series: { ...v.series, total: n, rule } });
  });
}

/** Cancel every visit that is not completed. */
export function cancelSeries(seriesId: string) {
  seriesVisits(seriesId).forEach((v) => { if (!isDone(v) && !isCancelled(v)) jobsStore.update(v.id, { status: "Cancelled" }); });
}
