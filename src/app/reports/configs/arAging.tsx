import { useSyncExternalStore } from "react";
import { invoicesStore, type Invoice } from "../../stores/invoicesStore";
import { daysPastDue } from "../../utils/reportDates";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: Invoice[], pick: (i: Invoice) => number) => rows.reduce((a, i) => a + pick(i), 0);

const STATUS_STYLE: Record<string, { c: string; bg: string }> = {
  Unpaid: { c: "#DC2626", bg: "#FEE2E2" },
  Overdue: { c: "#EF4444", bg: "#FEE2E2" },
  Paid: { c: "#16A34A", bg: "#DCFCE7" },
  "Partially Paid": { c: "#D97706", bg: "#FEF3C7" },
  Void: { c: "#9CA3AF", bg: "#F3F4F6" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS_STYLE[s] ?? { c: "#546478", bg: "#F3F4F6" };
  return <span className="inline-block rounded-full px-2 py-0.5 text-[12px]" style={{ color: st.c, backgroundColor: st.bg, fontWeight: 600 }}>{s}</span>;
};

// "Current unpaid" = issued but not yet past due. An open invoice with no
// parseable due date has no computable age (daysPastDue → NaN) and would fall
// into none of the overdue buckets; fold it in here so the six buckets always
// sum exactly to the "All unpaid" total.
const isCurrent = (i: Invoice) => !(daysPastDue(i.dueDate) > 0);

// Invoices AR aging report. Source = Invoices list, restricted to open
// receivables (balance owed, not voided). Cards bucket the outstanding balance
// by days past due relative to REPORT_TODAY; the summary card shows the whole
// open-AR total. (Marek call #21.)
export const arAgingReport: ReportDef<Invoice> = {
  id: "ar-aging",
  category: "financial",
  name: "Invoices AR aging report",
  description: "Open receivables aged by days past due — from your Invoices list.",
  icon: "account_balance_wallet",
  useRows: () => useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot),
  rowKey: (i) => i.id,
  dateField: (i) => i.date,
  defaultDatePreset: "this_year",
  searchText: (i) => `${i.number} ${i.clientName}`,
  baseFilter: (i) => i.balance > 0 && i.status !== "Void",
  amountField: (i) => i.balance,
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Unpaid", label: "Unpaid" },
        { value: "Overdue", label: "Overdue" },
        { value: "Partially Paid", label: "Partially Paid" },
      ],
      match: (i, v) => i.status === v,
    },
  ],
  statCards: [
    { key: "all", label: "All unpaid", icon: "account_balance_wallet", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(sum(r, (i) => i.balance)),
      sublabel: (r) => `${r.length} invoices` },
    { key: "current", label: "Current unpaid", icon: "schedule", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter(isCurrent), (i) => i.balance)),
      sublabel: (r) => `${r.filter(isCurrent).length} invoices`,
      filter: isCurrent },
    { key: "od30", label: "Overdue <30 days", icon: "warning", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(sum(r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 0 && d <= 30; }), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 0 && d <= 30; }).length} invoices`,
      filter: (i) => { const d = daysPastDue(i.dueDate); return d > 0 && d <= 30; } },
    { key: "od3060", label: "30-60 days", icon: "warning", accent: "#EA580C", bg: "#FFEDD5",
      value: (r) => money(sum(r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 30 && d <= 60; }), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 30 && d <= 60; }).length} invoices`,
      filter: (i) => { const d = daysPastDue(i.dueDate); return d > 30 && d <= 60; } },
    { key: "od6090", label: "60-90 days", icon: "priority_high", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => money(sum(r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 60 && d <= 90; }), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => { const d = daysPastDue(i.dueDate); return d > 60 && d <= 90; }).length} invoices`,
      filter: (i) => { const d = daysPastDue(i.dueDate); return d > 60 && d <= 90; } },
    { key: "od90", label: ">90 days", icon: "error", accent: "#991B1B", bg: "#FEE2E2",
      value: (r) => money(sum(r.filter((i) => daysPastDue(i.dueDate) > 90), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => daysPastDue(i.dueDate) > 90).length} invoices`,
      filter: (i) => daysPastDue(i.dueDate) > 90 },
  ],
  columns: [
    { key: "number", label: "Number", render: (i) => <span style={{ fontWeight: 600 }}>{i.number}</span> },
    { key: "client", label: "Client name", render: (i) => i.clientName },
    { key: "status", label: "Status", render: (i) => <StatusBadge s={i.status} /> },
    { key: "date", label: "Date", render: (i) => i.date },
    { key: "dueDate", label: "Due date", render: (i) => i.dueDate || "—" },
    { key: "dpd", label: "Days past due", render: (i) => { const d = daysPastDue(i.dueDate); return Number.isNaN(d) ? "No due date" : d > 0 ? `${d}d` : "Current"; } },
    { key: "balance", label: "Balance", align: "right", render: (i) => <span style={{ color: i.balance > 0 ? "#DC2626" : "#16A34A" }}>{money(i.balance)}</span> },
  ],
};
