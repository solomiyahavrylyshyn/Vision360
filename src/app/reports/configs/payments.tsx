import { useSyncExternalStore } from "react";
import { paymentsStore } from "../../stores/paymentsStore";
import type { Payment } from "../../pages/Payments";
import { PAYMENT_METHODS } from "../../constants/paymentMethods";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: Payment[], pick: (p: Payment) => number) => rows.reduce((a, p) => a + pick(p), 0);

// Refunded rows report the returned amount (refundAmount) when present,
// otherwise the original payment amount.
const refundValue = (p: Payment) => p.refundAmount ?? p.amount;

const STATUS_STYLE: Record<string, { c: string; bg: string }> = {
  Completed: { c: "#16A34A", bg: "#DCFCE7" },
  Pending: { c: "#D97706", bg: "#FEF3C7" },
  Refunded: { c: "#A855F7", bg: "#F3E8FF" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS_STYLE[s] ?? { c: "#546478", bg: "#F3F4F6" };
  return <span className="inline-block rounded-full px-2 py-0.5 text-[12px]" style={{ color: st.c, backgroundColor: st.bg, fontWeight: 600 }}>{s}</span>;
};

// Payments (cash collected) report. Source = Payments list, default current
// month. Cards: cash collected (Completed), pending, refunded, total count.
// (Marek call #21.)
export const paymentsReport: ReportDef<Payment> = {
  id: "payments",
  category: "financial",
  name: "Payments (cash collected) report",
  description: "All payments for the period — cash collected, pending and refunded, from your Payments list.",
  icon: "account_balance",
  useRows: () => useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getSnapshot),
  rowKey: (p) => p.id,
  dateField: (p) => p.date,
  defaultDatePreset: "this_month",
  searchText: (p) => `${p.clientName} ${p.invoiceNumber} ${p.method}`,
  amountField: (p) => p.amount,
  quickFilters: [
    {
      key: "method", label: "Method", default: "all",
      options: [
        { value: "all", label: "All" },
        ...PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
      ],
      // Seed data was migrated to "Bank transfer" casing; match case-insensitively
      // so the "Bank Transfer" option still catches those rows.
      match: (p, v) => p.method.toLowerCase() === v.toLowerCase(),
    },
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Completed", label: "Completed" },
        { value: "Pending", label: "Pending" },
        { value: "Refunded", label: "Refunded" },
      ],
      match: (p, v) => p.status === v,
    },
  ],
  statCards: [
    { key: "collected", label: "Cash collected", icon: "payments", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter((p) => p.status === "Completed"), (p) => p.amount)),
      sublabel: (r) => `${r.filter((p) => p.status === "Completed").length} payments`,
      filter: (p) => p.status === "Completed" },
    { key: "pending", label: "Pending", icon: "schedule", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(sum(r.filter((p) => p.status === "Pending"), (p) => p.amount)),
      sublabel: (r) => `${r.filter((p) => p.status === "Pending").length} payments`,
      filter: (p) => p.status === "Pending" },
    { key: "refunded", label: "Refunded", icon: "undo", accent: "#A855F7", bg: "#F3E8FF",
      value: (r) => money(sum(r.filter((p) => p.status === "Refunded"), refundValue)),
      sublabel: (r) => `${r.filter((p) => p.status === "Refunded").length} payments`,
      filter: (p) => p.status === "Refunded" },
    { key: "count", label: "Payments", icon: "receipt_long", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${money(sum(r, (p) => p.amount))} total` },
  ],
  columns: [
    { key: "number", label: "Number", render: (p) => <span style={{ fontWeight: 600 }}>{`P-${1000 + p.id}`}</span> },
    { key: "client", label: "Client", render: (p) => p.clientName },
    { key: "invoice", label: "Invoice", render: (p) => p.invoiceNumber },
    { key: "method", label: "Method", render: (p) => p.method },
    { key: "status", label: "Status", render: (p) => <StatusBadge s={p.status} /> },
    { key: "amount", label: "Amount", align: "right", render: (p) => money(p.amount) },
    { key: "date", label: "Date", render: (p) => p.date },
  ],
};
