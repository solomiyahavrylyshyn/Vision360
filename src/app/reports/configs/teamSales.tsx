import { useSyncExternalStore } from "react";
import { invoicesStore, type Invoice } from "../../stores/invoicesStore";
import type { ReportDef } from "../types";

// Team Sales (FR-12.17, Team Operations) — revenue and invoice count per team
// member, expandable to the underlying invoices (the table lists them). Source:
// invoice list; quick filters: status (all / paid / with balances) and team
// member; date default this month.

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const members = (rows: Invoice[]) => Array.from(new Set(rows.map((i) => i.createdBy).filter(Boolean)));

export const teamSalesReport: ReportDef<Invoice> = {
  id: "team-sales",
  category: "team",
  name: "Team sales report",
  description: "Revenue and invoice count per team member — e.g. who sold how much this month, down to the underlying invoices.",
  icon: "groups",
  useRows: () => useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot),
  rowKey: (i) => i.id,
  dateField: (i) => i.date,
  defaultDatePreset: "this_month",
  searchText: (i) => `${i.number} ${i.clientName} ${i.createdBy}`,
  amountField: (i) => i.total,
  baseFilter: (i) => i.status !== "Void",
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All invoices" },
        { value: "paid", label: "Paid" },
        { value: "balance", label: "With balances" },
      ],
      match: (i, v) => (v === "paid" ? i.status === "Paid" : i.balance > 0),
    },
    {
      key: "member", label: "Team member", default: "all",
      // Static option list mirrors the seeded team; user-created invoices are
      // stamped createdBy "You".
      options: [
        { value: "all", label: "All members" },
        { value: "Marek Stroz", label: "Marek Stroz" },
        { value: "Peter Novak", label: "Peter Novak" },
        { value: "You", label: "You" },
      ],
      match: (i, v) => i.createdBy === v,
    },
  ],
  statCards: [
    { key: "revenue", label: "Team revenue", icon: "payments", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(r.reduce((a, i) => a + i.total, 0)),
      sublabel: (r) => `${r.length} invoices` },
    { key: "collected", label: "Collected", icon: "account_balance_wallet", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(r.reduce((a, i) => a + (i.total - i.balance), 0)) },
    { key: "members", label: "Active members", icon: "groups", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => String(members(r).length),
      sublabel: (r) => {
        const per = members(r).map((m) => ({ m, v: r.filter((i) => i.createdBy === m).reduce((a, i) => a + i.total, 0) }));
        const top = per.sort((a, b) => b.v - a.v)[0];
        return top ? `Top: ${top.m} (${money(top.v)})` : "";
      } },
  ],
  columns: [
    { key: "member", label: "Team member", render: (i) => <span style={{ fontWeight: 600 }}>{i.createdBy}</span> },
    { key: "number", label: "Invoice", render: (i) => i.number },
    { key: "client", label: "Client", render: (i) => i.clientName },
    { key: "status", label: "Status", render: (i) => i.status },
    { key: "total", label: "Total", align: "right", render: (i) => money(i.total) },
    { key: "balance", label: "Balance", align: "right", render: (i) => money(i.balance) },
    { key: "date", label: "Date", render: (i) => i.date },
  ],
};
