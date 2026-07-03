import { useSyncExternalStore } from "react";
import { invoicesStore, type Invoice } from "../../stores/invoicesStore";
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

// Sales report (renamed from Revenue). Source = Invoices list, default current
// month. Cards: total invoices, overdue, paid, partially paid. (Marek call #21.)
export const salesReport: ReportDef<Invoice> = {
  id: "sales",
  category: "financial",
  name: "Sales report",
  description: "All invoices for the period — totals by status, from your Invoices list.",
  icon: "trending_up",
  useRows: () => useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot),
  rowKey: (i) => i.id,
  dateField: (i) => i.date,
  defaultDatePreset: "this_month",
  searchText: (i) => `${i.number} ${i.clientName} ${i.jobName} ${i.jobNumber}`,
  amountField: (i) => i.total,
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Unpaid", label: "Unpaid" },
        { value: "Overdue", label: "Overdue" },
        { value: "Paid", label: "Paid" },
        { value: "Partially Paid", label: "Partially Paid" },
        { value: "Void", label: "Void" },
      ],
      match: (i, v) => i.status === v,
    },
    {
      key: "balance", label: "Balance", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "with", label: "With balance" },
        { value: "without", label: "No balance" },
      ],
      match: (i, v) => (v === "with" ? i.balance > 0 : i.balance === 0),
    },
  ],
  statCards: [
    { key: "total", label: "Total invoices", icon: "receipt_long", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${money(sum(r, (i) => i.total))} billed` },
    { key: "overdue", label: "Overdue", icon: "warning", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => money(sum(r.filter((i) => i.status === "Overdue"), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => i.status === "Overdue").length} invoices`,
      filter: (i) => i.status === "Overdue" },
    { key: "paid", label: "Paid", icon: "check_circle", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter((i) => i.status === "Paid"), (i) => i.total)),
      sublabel: (r) => `${r.filter((i) => i.status === "Paid").length} invoices`,
      filter: (i) => i.status === "Paid" },
    { key: "partial", label: "Partially paid", icon: "pie_chart", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(sum(r.filter((i) => i.status === "Partially Paid"), (i) => i.balance)),
      sublabel: (r) => `${r.filter((i) => i.status === "Partially Paid").length} invoices`,
      filter: (i) => i.status === "Partially Paid" },
  ],
  columns: [
    { key: "number", label: "Number", render: (i) => <span style={{ fontWeight: 600 }}>{i.number}</span> },
    { key: "client", label: "Client name", render: (i) => i.clientName },
    { key: "job", label: "Job", render: (i) => i.jobNumber ? `${i.jobNumber}${i.jobName ? " · " + i.jobName : ""}` : "—" },
    { key: "status", label: "Status", render: (i) => <StatusBadge s={i.status} /> },
    { key: "date", label: "Date", render: (i) => i.date },
    { key: "dueDate", label: "Due date", render: (i) => i.dueDate || "—" },
    { key: "total", label: "Total", align: "right", render: (i) => money(i.total) },
    { key: "balance", label: "Balance", align: "right", render: (i) => <span style={{ color: i.balance > 0 ? "#DC2626" : "#16A34A" }}>{money(i.balance)}</span> },
  ],
};
