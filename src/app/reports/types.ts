import type { ReactNode } from "react";
import type { DatePreset } from "../utils/reportDates";

// A report = the module's list with pre-set filters. Each report is expressed
// as a declarative ReportDef; the shared <ReportView> renders the standard
// chrome (search, quick filters, filter chips, clickable stat cards, table,
// Preview/Print/Share/Schedule) from it. (Marek call #21.)

export type ReportCategory = "financial" | "clients_jobs" | "team";

export interface StatCardDef<T = Record<string, unknown>> {
  key: string;
  label: string;
  value: (rows: T[]) => string;         // formatted display, e.g. "$12,340"
  sublabel?: (rows: T[]) => string;
  icon: string;
  accent: string;                        // icon / value color
  bg: string;                            // icon chip background
  filter?: (row: T) => boolean;          // clicking narrows the table to these rows
}

export interface QuickFilterDef<T = Record<string, unknown>> {
  key: string;
  label: string;                         // "Status"
  default: string;                       // "all"
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean; // applied only when value !== default
}

export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "right";
  defaultHidden?: boolean;
  render: (row: T) => ReactNode;
}

export interface ReportDef<T = Record<string, unknown>> {
  id: string;
  category: ReportCategory;
  name: string;
  description: string;
  icon: string;
  useRows: () => T[];                     // hook reading the module store
  rowKey: (row: T) => string | number;
  dateField: (row: T) => string | undefined; // field the date filter applies to
  defaultDatePreset: DatePreset;
  searchText: (row: T) => string;         // concatenated searchable fields
  baseFilter?: (row: T) => boolean;        // always applied (e.g. AR aging = unpaid only)
  quickFilters: QuickFilterDef<T>[];      // up to 3
  statCards: StatCardDef<T>[];
  columns: ColumnDef<T>[];
  amountField?: (row: T) => number;       // enables the amount-range advanced filter
}

export const REPORT_CATEGORIES: { key: ReportCategory; label: string; description: string }[] = [
  { key: "financial", label: "Financial / Business", description: "Money in and out — sales, receivables, expenses and payments." },
  { key: "clients_jobs", label: "Clients / Jobs / Estimates", description: "Who you serve and the work you do for them." },
  { key: "team", label: "Team Operations", description: "Team performance and operations reports." },
];
