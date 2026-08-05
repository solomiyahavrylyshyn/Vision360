import { useSyncExternalStore } from "react";
import { jobsStore, type JobRecord } from "../../stores/jobsStore";
import { estimatesStore } from "../../stores/estimatesStore";
import type { ReportDef } from "../types";

// Job Profitability (FR-12.15, Should Have) — per-job profit from job costing:
// assigned amount + upsell minus item costs (FR-9.19). Prototype: item costs
// come from the line items of estimates linked to the job (jobs don't persist
// their own line items in the static prototype); PRD notes detailed content is
// still pending, so the table keeps to the essentials.

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// Item costs per job number, derived from linked estimates.
const costsByJob = (): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const e of estimatesStore.getSnapshot()) {
    if (!e.job) continue;
    const cost = (e.items ?? []).reduce((a, li) => a + li.cost * li.quantity, 0);
    map[e.job] = (map[e.job] ?? 0) + cost;
  }
  return map;
};

const itemCost = (j: JobRecord) => costsByJob()[j.jobNumber] ?? 0;
const profit = (j: JobRecord) => j.totalPrice - itemCost(j);
const marginPct = (j: JobRecord) => (j.totalPrice > 0 ? `${Math.round((profit(j) / j.totalPrice) * 100)}%` : "—");

export const jobProfitabilityReport: ReportDef<JobRecord> = {
  id: "job-profitability",
  category: "clients_jobs",
  name: "Job profitability report",
  description: "Per-job profit from job costing — the job's price minus its item costs, from your Jobs list.",
  icon: "trending_up",
  useRows: () => useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot),
  rowKey: (j) => j.id,
  dateField: (j) => j.startDate,
  defaultDatePreset: "this_year",
  searchText: (j) => `${j.jobNumber} ${j.client} ${j.assignedTo}`,
  amountField: (j) => j.totalPrice,
  quickFilters: [
    {
      key: "sold", label: "Jobs", default: "all",
      options: [
        { value: "all", label: "All jobs" },
        { value: "sold", label: "Sold (amount > $0)" },
      ],
      match: (j, v) => (v === "sold" ? j.totalPrice > 0 : true),
    },
    {
      key: "profitable", label: "Profitability", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "profitable", label: "Profitable" },
        { value: "loss", label: "At a loss" },
      ],
      match: (j, v) => (v === "profitable" ? profit(j) > 0 : profit(j) < 0),
    },
  ],
  statCards: [
    { key: "revenue", label: "Job revenue", icon: "payments", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(r.reduce((a, j) => a + j.totalPrice, 0)),
      sublabel: (r) => `${r.length} jobs` },
    { key: "costs", label: "Item costs", icon: "inventory_2", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(r.reduce((a, j) => a + itemCost(j), 0)) },
    { key: "profit", label: "Gross profit", icon: "trending_up", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(r.reduce((a, j) => a + profit(j), 0)),
      sublabel: (r) => {
        const rev = r.reduce((a, j) => a + j.totalPrice, 0);
        const p = r.reduce((a, j) => a + profit(j), 0);
        return rev > 0 ? `${Math.round((p / rev) * 100)}% margin` : "";
      } },
  ],
  columns: [
    { key: "job", label: "Job", render: (j) => <span style={{ fontWeight: 600 }}>{j.jobNumber}</span> },
    { key: "client", label: "Client", render: (j) => j.client },
    { key: "assigned", label: "Assigned to", render: (j) => j.assignedTo || "Unassigned" },
    { key: "price", label: "Total price", align: "right", render: (j) => money(j.totalPrice) },
    { key: "costs", label: "Item costs", align: "right", render: (j) => money(itemCost(j)) },
    { key: "profit", label: "Profit", align: "right", render: (j) => <span style={{ color: profit(j) >= 0 ? "#16A34A" : "#DC2626" }}>{money(profit(j))}</span> },
    { key: "margin", label: "Margin", align: "right", render: (j) => marginPct(j) },
    { key: "date", label: "Date", render: (j) => j.startDate },
  ],
};
