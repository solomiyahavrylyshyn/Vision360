import { useSyncExternalStore } from "react";
import { estimatesStore, type EstimateRecord } from "../../stores/estimatesStore";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: EstimateRecord[], pick: (e: EstimateRecord) => number) => rows.reduce((a, e) => a + pick(e), 0);

// Approved / Converted read as "won" (green); Sent / Viewed are in-flight
// (blue); Rejected / Expired are dead (red); everything else is neutral gray.
const STATUS_STYLE: Record<string, { c: string; bg: string }> = {
  Approved: { c: "#16A34A", bg: "#DCFCE7" },
  Converted: { c: "#16A34A", bg: "#DCFCE7" },
  Sent: { c: "#2563EB", bg: "#DBEAFE" },
  Viewed: { c: "#2563EB", bg: "#DBEAFE" },
  Rejected: { c: "#DC2626", bg: "#FEE2E2" },
  Expired: { c: "#DC2626", bg: "#FEE2E2" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS_STYLE[s] ?? { c: "#546478", bg: "#F3F4F6" };
  return <span className="inline-block rounded-full px-2 py-0.5 text-[12px]" style={{ color: st.c, backgroundColor: st.bg, fontWeight: 600 }}>{s}</span>;
};

// Estimates report. Source = Estimates list, default current month. Cards:
// total estimates, approved, sent, converted. (Marek call #21.)
export const estimatesReport: ReportDef<EstimateRecord> = {
  id: "estimates",
  category: "clients_jobs",
  name: "Estimates report",
  description: "All estimates for the period — totals by status, from your Estimates list.",
  icon: "description",
  useRows: () => useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot),
  rowKey: (e) => e.id,
  dateField: (e) => e.createdDate,
  defaultDatePreset: "this_month",
  searchText: (e) => `${e.estimateNumber} ${e.clientName} ${e.estimateName}`,
  amountField: (e) => e.amount,
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Draft", label: "Draft" },
        { value: "Sent", label: "Sent" },
        { value: "Viewed", label: "Viewed" },
        { value: "Changes Requested", label: "Changes Requested" },
        { value: "Updated", label: "Updated" },
        { value: "Approved", label: "Approved" },
        { value: "Rejected", label: "Rejected" },
        { value: "Expired", label: "Expired" },
        { value: "Archived", label: "Archived" },
        { value: "Converted", label: "Converted" },
      ],
      match: (e, v) => e.status === v,
    },
  ],
  statCards: [
    { key: "total", label: "Total estimates", icon: "description", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${money(sum(r, (e) => e.amount))} total` },
    { key: "approved", label: "Approved", icon: "check_circle", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter((e) => e.status === "Approved"), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => e.status === "Approved").length} estimates`,
      filter: (e) => e.status === "Approved" },
    { key: "sent", label: "Sent", icon: "send", accent: "#2563EB", bg: "#DBEAFE",
      value: (r) => money(sum(r.filter((e) => e.status === "Sent"), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => e.status === "Sent").length} estimates`,
      filter: (e) => e.status === "Sent" },
    { key: "converted", label: "Converted", icon: "swap_horiz", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter((e) => e.status === "Converted"), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => e.status === "Converted").length} estimates`,
      filter: (e) => e.status === "Converted" },
  ],
  columns: [
    { key: "number", label: "Number", render: (e) => <span style={{ fontWeight: 600 }}>{e.estimateNumber}</span> },
    { key: "client", label: "Client", render: (e) => e.clientName },
    { key: "status", label: "Status", render: (e) => <StatusBadge s={e.status} /> },
    { key: "created", label: "Created", render: (e) => e.createdDate || "—" },
    { key: "amount", label: "Amount", align: "right", render: (e) => money(e.amount) },
    { key: "depositDue", label: "Deposit due", align: "right", render: (e) => money(e.depositDue) },
  ],
};
