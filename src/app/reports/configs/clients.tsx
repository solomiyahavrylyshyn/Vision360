import { useSyncExternalStore } from "react";
import { clientsStore, type ClientRecord } from "../../stores/clientsStore";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: ClientRecord[], pick: (c: ClientRecord) => number) => rows.reduce((a, c) => a + pick(c), 0);
const pastDueOf = (c: ClientRecord) => c.pastDueBalance || c.pastDue || 0;

const STATUS_STYLE: Record<string, { c: string; bg: string }> = {
  Active: { c: "#16A34A", bg: "#DCFCE7" },
  Prospect: { c: "#4A6FA5", bg: "#EBF0F8" },
  Inactive: { c: "#9CA3AF", bg: "#F3F4F6" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS_STYLE[s] ?? { c: "#546478", bg: "#F3F4F6" };
  return <span className="inline-block rounded-full px-2 py-0.5 text-[12px]" style={{ color: st.c, backgroundColor: st.bg, fontWeight: 600 }}>{s}</span>;
};

// Client report. Source = Clients list, dated on when each client was created
// (customerSince). Merged/archived records are excluded. Cards: total clients,
// active, prospects, and past-due balance owed. (Marek call #21.)
export const clientsReport: ReportDef<ClientRecord> = {
  id: "clients",
  category: "clients_jobs",
  name: "Client report",
  description: "Your clients for the period — counts by status and balances owed, from your Clients list.",
  icon: "groups",
  useRows: () => useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot),
  rowKey: (c) => c.id,
  dateField: (c) => c.customerSince,
  defaultDatePreset: "this_year",
  searchText: (c) => `${c.name} ${c.email}`,
  baseFilter: (c) => !c.mergedIntoId && !c.archivedAt,
  amountField: (c) => c.totalBilled,
  quickFilters: [
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Prospect", label: "Prospect" },
        { value: "Inactive", label: "Inactive" },
      ],
      match: (c, v) => c.status === v,
    },
    {
      key: "balance", label: "Balance", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "with", label: "With balance" },
        { value: "without", label: "No balance" },
      ],
      match: (c, v) => (v === "with" ? c.openBalance > 0 : c.openBalance === 0),
    },
  ],
  statCards: [
    { key: "total", label: "Total clients", icon: "groups", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.length), sublabel: (r) => `${money(sum(r, (c) => c.totalBilled))} billed` },
    { key: "active", label: "Active", icon: "check_circle", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => String(r.filter((c) => c.status === "Active").length),
      sublabel: (r) => `${r.filter((c) => c.status === "Active").length} clients`,
      filter: (c) => c.status === "Active" },
    { key: "prospects", label: "Prospects", icon: "person_add", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => String(r.filter((c) => c.status === "Prospect").length),
      sublabel: (r) => `${r.filter((c) => c.status === "Prospect").length} clients`,
      filter: (c) => c.status === "Prospect" },
    { key: "pastDue", label: "Past due", icon: "warning", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => money(sum(r, pastDueOf)),
      sublabel: (r) => `${r.filter((c) => pastDueOf(c) > 0).length} clients`,
      filter: (c) => pastDueOf(c) > 0 },
  ],
  columns: [
    { key: "name", label: "Name", render: (c) => <span style={{ fontWeight: 600 }}>{c.name}</span> },
    { key: "status", label: "Status", render: (c) => <StatusBadge s={c.status} /> },
    { key: "totalBilled", label: "Total billed", align: "right", render: (c) => money(c.totalBilled) },
    { key: "balance", label: "Balance", align: "right", render: (c) => money(c.openBalance) },
    { key: "pastDue", label: "Past due", align: "right", render: (c) => <span style={{ color: pastDueOf(c) > 0 ? "#DC2626" : "#546478" }}>{money(pastDueOf(c))}</span> },
    { key: "email", label: "Email", render: (c) => c.email || "—" },
    { key: "created", label: "Date created", render: (c) => c.customerSince },
  ],
};
