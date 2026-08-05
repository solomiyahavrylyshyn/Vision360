import { useSyncExternalStore } from "react";
import { estimatesStore, type EstimateRecord } from "../../stores/estimatesStore";
import type { ReportDef } from "../types";

// Item Usage Report (FR-12.14) — which items/parts were used on which jobs; the
// "rock" report that drives next-day warehouse restocking. Callbacks are
// tracked here through the non-sellable "Callback" admin item (FR-9.18).
// Prototype data source: line items on estimates joined to their linked job —
// jobs don't persist their own line items in the static prototype.

interface UsageRow {
  key: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  job: string;
  jobTitle: string;
  clientName: string;
  date: string;
  isCallback: boolean;
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const toRows = (estimates: EstimateRecord[]): UsageRow[] =>
  estimates.flatMap((e) =>
    (e.items ?? []).map((li) => ({
      key: `${e.id}-${li.id}`,
      itemName: li.name,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.price,
      amount: li.amount,
      job: e.job || "—",
      jobTitle: e.jobTitle || "",
      clientName: e.clientName,
      date: e.createdDate,
      isCallback: /callback/i.test(li.name),
    })),
  );

// Cache keyed by store snapshot so useRows returns a stable reference between
// renders (useSyncExternalStore contract).
let lastSnapshot: EstimateRecord[] | null = null;
let lastRows: UsageRow[] = [];
const rowsFor = (snap: EstimateRecord[]) => {
  if (snap !== lastSnapshot) { lastSnapshot = snap; lastRows = toRows(snap); }
  return lastRows;
};

export const itemUsageReport: ReportDef<UsageRow> = {
  id: "item-usage",
  category: "clients_jobs",
  name: "Item usage report",
  description: "Which items and parts were used on which jobs — drives restocking; callbacks tracked via the Callback item.",
  icon: "inventory_2",
  useRows: () => rowsFor(useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot)),
  rowKey: (r) => r.key,
  dateField: (r) => r.date,
  defaultDatePreset: "this_year",
  searchText: (r) => `${r.itemName} ${r.job} ${r.jobTitle} ${r.clientName}`,
  amountField: (r) => r.amount,
  quickFilters: [
    {
      key: "kind", label: "Items", default: "all",
      options: [
        { value: "all", label: "All items" },
        { value: "callback", label: "Callback only" },
      ],
      match: (r, v) => (v === "callback" ? r.isCallback : true),
    },
    {
      key: "linked", label: "Job link", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "linked", label: "On a job" },
        { value: "unlinked", label: "No job" },
      ],
      match: (r, v) => (v === "linked" ? r.job !== "—" : r.job === "—"),
    },
  ],
  statCards: [
    { key: "lines", label: "Item lines", icon: "inventory_2", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${new Set(r.map((x) => x.itemName)).size} distinct items` },
    { key: "qty", label: "Units used", icon: "tag", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => String(r.reduce((a, x) => a + x.quantity, 0)) },
    { key: "value", label: "Usage value", icon: "payments", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(r.reduce((a, x) => a + x.amount, 0)) },
    { key: "callbacks", label: "Callbacks", icon: "replay", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => String(r.filter((x) => x.isCallback).length),
      filter: (r) => r.isCallback },
  ],
  columns: [
    { key: "item", label: "Item", render: (r) => <span style={{ fontWeight: 600 }}>{r.itemName}</span> },
    { key: "qty", label: "Qty", align: "right", render: (r) => r.quantity },
    { key: "unitPrice", label: "Unit price", align: "right", render: (r) => money(r.unitPrice) },
    { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
    { key: "job", label: "Job", render: (r) => r.job === "—" ? "—" : `${r.job}${r.jobTitle ? ` · ${r.jobTitle}` : ""}` },
    { key: "client", label: "Client", render: (r) => r.clientName },
    { key: "date", label: "Date", render: (r) => r.date },
  ],
};
