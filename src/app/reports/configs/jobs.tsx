import { useSyncExternalStore } from "react";
import { jobsStore, type JobRecord } from "../../stores/jobsStore";
import { JOB_STATUSES, JOB_STATUS_STYLES, type JobStatus } from "../../constants/jobStatuses";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: JobRecord[], pick: (j: JobRecord) => number) => rows.reduce((a, j) => a + pick(j), 0);

const StatusBadge = ({ s }: { s: string }) => {
  const st = JOB_STATUS_STYLES[s as JobStatus] ?? { color: "#546478", bg: "#F3F4F6" };
  return <span className="inline-block rounded-full px-2 py-0.5 text-[12px]" style={{ color: st.color, backgroundColor: st.bg, fontWeight: 600 }}>{s}</span>;
};

// Semantic job types (jobCategory) — the default job-type vocabulary plus the
// "Service" value the seed jobs carry. jobType stores the FREQUENCY, so it is a
// SEPARATE filter (Marek: keep TYPE and FREQUENCY apart).
const JOB_CATEGORY_VALUES = ["Service", "Installation", "Maintenance", "Inspection", "Estimate"];

// Job statistics report. Source = Jobs list. Default period is the whole year
// because seed jobs span Feb–June 2026 (only one lands in March), so
// "this_year" is what actually shows data on open. (Marek call #21.)
export const jobsReport: ReportDef<JobRecord> = {
  id: "jobs",
  category: "clients_jobs",
  name: "Job statistics report",
  description: "All jobs for the period — counts and value by status, type and frequency, from your Jobs list.",
  icon: "work",
  useRows: () => useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot),
  rowKey: (j) => j.id,
  dateField: (j) => j.startDate,
  defaultDatePreset: "this_year",
  searchText: (j) => `${j.jobNumber} ${j.client}`,
  amountField: (j) => j.totalPrice,
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        ...JOB_STATUSES.map((s) => ({ value: s, label: s })),
      ],
      match: (j, v) => j.status === v,
    },
    {
      key: "type", label: "Type", default: "all",
      options: [
        { value: "all", label: "All" },
        ...JOB_CATEGORY_VALUES.map((t) => ({ value: t, label: t })),
      ],
      match: (j, v) => j.jobCategory === v,
    },
    {
      key: "frequency", label: "Frequency", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "One-off", label: "One-off" },
        { value: "Recurring", label: "Recurring" },
      ],
      match: (j, v) => j.jobType === v,
    },
  ],
  statCards: [
    { key: "total", label: "Total jobs", icon: "work", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${money(sum(r, (j) => j.totalPrice))} value` },
    { key: "completed", label: "Completed", icon: "check_circle", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => String(r.filter((j) => j.status === "Completed").length),
      sublabel: (r) => `${money(sum(r.filter((j) => j.status === "Completed"), (j) => j.totalPrice))} value`,
      filter: (j) => j.status === "Completed" },
    { key: "scheduled", label: "Scheduled", icon: "event", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.filter((j) => j.status === "Scheduled").length),
      sublabel: (r) => `${money(sum(r.filter((j) => j.status === "Scheduled"), (j) => j.totalPrice))} value`,
      filter: (j) => j.status === "Scheduled" },
    { key: "value", label: "Total value", icon: "payments", accent: "#0891B2", bg: "#CFFAFE",
      value: (r) => money(sum(r, (j) => j.totalPrice)), sublabel: (r) => `${r.length} jobs` },
  ],
  columns: [
    { key: "number", label: "Number", render: (j) => <span style={{ fontWeight: 600 }}>{j.jobNumber}</span> },
    { key: "client", label: "Client", render: (j) => j.client },
    { key: "type", label: "Type", render: (j) => j.jobCategory || "—" },
    { key: "frequency", label: "Frequency", render: (j) => j.jobType || "—" },
    { key: "status", label: "Status", render: (j) => <StatusBadge s={j.status} /> },
    { key: "scheduled", label: "Scheduled", render: (j) => j.startDate || "—" },
    { key: "total", label: "Total", align: "right", render: (j) => money(j.totalPrice) },
  ],
};
