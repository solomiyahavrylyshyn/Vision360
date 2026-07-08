import { useSyncExternalStore } from "react";
import { expenseCategoryColors } from "../../pages/Expenses";
import { expensesStore, type Expense } from "../../stores/expensesStore";
import type { ReportDef } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sum = (rows: Expense[], pick: (e: Expense) => number) => rows.reduce((a, e) => a + pick(e), 0);

// Category chip styled to match the Expenses list (same color map, sales-style pill).
const CategoryBadge = ({ c }: { c: string }) => {
  const color = expenseCategoryColors[c] ?? "#546478";
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[12px]"
      style={{ color, backgroundColor: "#F3F4F6", fontWeight: 600 }}
    >
      {c}
    </span>
  );
};

// Expenses report. Source = the shared expensesStore (same rows as the list).
// Job costing view: totals for the period, split by job linkage / receipts.
// Seed data lives in Apr 2026 (one Mar 31 row), so default preset is "this_year"
// to avoid an empty table on open (REPORT_TODAY month = March 2026). (Marek call #21.)
export const expensesReport: ReportDef<Expense> = {
  id: "expenses",
  category: "financial",
  name: "Expenses report",
  description: "All expenses for the period — totals by job linkage and receipts, from your Expenses list.",
  icon: "payments",
  useRows: () => useSyncExternalStore(expensesStore.subscribe, expensesStore.getSnapshot),
  rowKey: (e) => e.id,
  dateField: (e) => e.date,
  defaultDatePreset: "this_year",
  searchText: (e) => `${e.category} ${e.merchant} ${e.notes ?? ""}`,
  amountField: (e) => e.amount,
  quickFilters: [
    {
      key: "category", label: "Category", default: "all",
      options: [
        { value: "all", label: "All categories" },
        { value: "Materials", label: "Materials" },
        { value: "Fuel", label: "Fuel" },
        { value: "Tools", label: "Tools" },
        { value: "Software", label: "Software" },
        { value: "Meals", label: "Meals" },
        { value: "Travel", label: "Travel" },
      ],
      match: (e, v) => e.category === v,
    },
    {
      key: "receipts", label: "Receipts", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "with", label: "With receipts" },
        { value: "without", label: "Without receipts" },
      ],
      match: (e, v) => (v === "with" ? e.receipts > 0 : e.receipts === 0),
    },
  ],
  statCards: [
    { key: "total", label: "Total expenses", icon: "payments", accent: "#DC2626", bg: "#FEE2E2",
      value: (r) => money(sum(r, (e) => e.amount)),
      sublabel: (r) => `${r.length} expense${r.length === 1 ? "" : "s"}` },
    { key: "linked", label: "Linked to job", icon: "link", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(sum(r.filter((e) => !!e.jobId), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => !!e.jobId).length} expenses`,
      filter: (e) => !!e.jobId },
    { key: "unlinked", label: "Not linked", icon: "link_off", accent: "#8899AA", bg: "#F3F4F6",
      value: (r) => money(sum(r.filter((e) => !e.jobId), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => !e.jobId).length} expenses`,
      filter: (e) => !e.jobId },
    { key: "receipts", label: "With receipts", icon: "attach_file", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(sum(r.filter((e) => e.receipts > 0), (e) => e.amount)),
      sublabel: (r) => `${r.filter((e) => e.receipts > 0).length} expenses`,
      filter: (e) => e.receipts > 0 },
  ],
  columns: [
    { key: "date", label: "Date", render: (e) => e.date },
    { key: "category", label: "Category", render: (e) => <CategoryBadge c={e.category} /> },
    { key: "merchant", label: "Vendor", render: (e) => e.merchant },
    { key: "amount", label: "Amount", align: "right", render: (e) => money(e.amount) },
    { key: "jobId", label: "Job #", render: (e) => e.jobId || "—" },
    { key: "notes", label: "Notes", render: (e) => e.notes || "—" },
  ],
};
