import { useSyncExternalStore } from "react";
import { clientsStore, type ClientRecord } from "../../stores/clientsStore";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: ClientRecord[], pick: (c: ClientRecord) => number) => rows.reduce((a, c) => a + pick(c), 0);

// Field accessors with the fallbacks Marek specified (older records only carry
// the legacy `totalBilled` / `balance` / `pastDue`; newer ones carry the
// `total*` / `open*` / `pastDue*` fields).
const revenueOf = (c: ClientRecord) => c.totalRevenue || c.totalBilled || 0;
const balanceOf = (c: ClientRecord) => c.openBalance || c.balance || 0;
const pastDueOf = (c: ClientRecord) => c.pastDueBalance || c.pastDue || 0;

// Customer profitability report. MVP scope (Marek): revenue, balance and past
// due per customer only — full job-costing margins come later. Source = the
// unified clients store; excludes merged-away and archived records. (Marek call #21.)
export const clientProfitabilityReport: ReportDef<ClientRecord> = {
  id: "client-profitability",
  category: "clients_jobs",
  name: "Customer profitability report",
  description: "Revenue, balance and past due per customer (full profitability coming later).",
  icon: "insights",
  useRows: () => useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot),
  rowKey: (c) => c.id,
  dateField: (c) => c.customerSince,
  defaultDatePreset: "this_year",
  searchText: (c) => `${c.name} ${c.email}`,
  baseFilter: (c) => !c.mergedIntoId && !c.archivedAt,
  amountField: (c) => revenueOf(c),
  quickFilters: [
    {
      key: "pastDue", label: "Past due", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "with", label: "With past due" },
        { value: "without", label: "No past due" },
      ],
      match: (c, v) => (v === "with" ? pastDueOf(c) > 0 : pastDueOf(c) === 0),
    },
    {
      key: "balance", label: "Balance", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "with", label: "With balance" },
        { value: "without", label: "No balance" },
      ],
      match: (c, v) => (v === "with" ? balanceOf(c) > 0 : balanceOf(c) === 0),
    },
  ],
  statCards: [
    { key: "revenue", label: "Total revenue", icon: "payments", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r, revenueOf)),
      sublabel: (r) => `${r.length} customers` },
    { key: "balance", label: "Total balance", icon: "account_balance_wallet", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(sum(r, balanceOf)),
      sublabel: (r) => `${r.filter((c) => balanceOf(c) > 0).length} with open balance` },
    { key: "pastDue", label: "Total past due", icon: "warning", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => money(sum(r, pastDueOf)),
      sublabel: (r) => `${r.filter((c) => pastDueOf(c) > 0).length} customers`,
      filter: (c) => pastDueOf(c) > 0 },
  ],
  columns: [
    { key: "client", label: "Client", render: (c) => <span style={{ fontWeight: 600 }}>{c.name}</span> },
    { key: "revenue", label: "Total revenue", align: "right", render: (c) => money(revenueOf(c)) },
    { key: "balance", label: "Balance", align: "right", render: (c) => money(balanceOf(c)) },
    { key: "pastDue", label: "Past due", align: "right", render: (c) => <span style={{ color: pastDueOf(c) > 0 ? "#DC2626" : undefined }}>{money(pastDueOf(c))}</span> },
  ],
};
