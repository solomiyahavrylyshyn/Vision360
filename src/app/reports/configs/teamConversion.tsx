import { useSyncExternalStore } from "react";
import { jobsStore, type JobRecord } from "../../stores/jobsStore";
import type { ReportDef } from "../types";

// Team Conversion Rate (FR-12.17, Team Operations) — jobs sold (amount > $0)
// divided by jobs run, per team member (10 jobs, 6 sold = 60%). Source: job
// list; quick filters: team member and job type, plus the standard panel.

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");
const members = (rows: JobRecord[]) => Array.from(new Set(rows.map((j) => j.assignedTo).filter(Boolean)));
const JOB_CATEGORY_VALUES = ["Service", "Installation", "Maintenance", "Inspection", "Estimate"];

export const teamConversionReport: ReportDef<JobRecord> = {
  id: "team-conversion",
  category: "team",
  name: "Team conversion rate report",
  description: "Jobs sold (amount greater than $0) divided by jobs run, per team member — from your Jobs list.",
  icon: "percent",
  useRows: () => useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot),
  rowKey: (j) => j.id,
  dateField: (j) => j.startDate,
  defaultDatePreset: "this_year",
  searchText: (j) => `${j.jobNumber} ${j.client} ${j.assignedTo}`,
  amountField: (j) => j.totalPrice,
  quickFilters: [
    {
      key: "member", label: "Team member", default: "all",
      options: [
        { value: "all", label: "All members" },
        { value: "Peter Novak", label: "Peter Novak" },
        { value: "Emily Parker", label: "Emily Parker" },
        { value: "Elliot Harper", label: "Elliot Harper" },
      ],
      match: (j, v) => j.assignedTo === v,
    },
    {
      key: "type", label: "Job type", default: "all",
      options: [
        { value: "all", label: "All" },
        ...JOB_CATEGORY_VALUES.map((t) => ({ value: t, label: t })),
      ],
      match: (j, v) => (j as any).jobCategory === v,
    },
  ],
  statCards: [
    { key: "run", label: "Jobs run", icon: "work", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length) },
    { key: "sold", label: "Jobs sold", icon: "sell", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => String(r.filter((j) => j.totalPrice > 0).length),
      sublabel: (r) => money(r.reduce((a, j) => a + j.totalPrice, 0)),
      filter: (j) => j.totalPrice > 0 },
    { key: "rate", label: "Conversion rate", icon: "percent", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => pct(r.filter((j) => j.totalPrice > 0).length, r.length),
      sublabel: (r) => `${members(r).length} team members` },
  ],
  columns: [
    { key: "member", label: "Team member", render: (j) => <span style={{ fontWeight: 600 }}>{j.assignedTo || "Unassigned"}</span> },
    { key: "job", label: "Job", render: (j) => j.jobNumber },
    { key: "client", label: "Client", render: (j) => j.client },
    { key: "status", label: "Status", render: (j) => j.status },
    { key: "sold", label: "Sold", render: (j) => (j.totalPrice > 0 ? "Yes" : "No") },
    { key: "amount", label: "Amount", align: "right", render: (j) => money(j.totalPrice) },
    { key: "date", label: "Date", render: (j) => j.startDate },
  ],
};
