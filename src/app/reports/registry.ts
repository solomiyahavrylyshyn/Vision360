import type { ReportCategory, ReportDef } from "./types";
import { salesReport } from "./configs/sales";
import { arAgingReport } from "./configs/arAging";
import { expensesReport } from "./configs/expenses";
import { paymentsReport } from "./configs/payments";
import { clientsReport } from "./configs/clients";
import { jobsReport } from "./configs/jobs";
import { estimatesReport } from "./configs/estimates";
import { clientProfitabilityReport } from "./configs/clientProfitability";

// Single source of truth for the Reports module — the landing page and the
// /reports/:reportId route both read from here. Array order = display order
// within each category (Marek call #21 grouping).
export const REPORTS: ReportDef<any>[] = [
  // Financial / Business
  salesReport,
  arAgingReport,
  expensesReport,
  paymentsReport,
  // Clients / Jobs / Estimates
  clientsReport,
  jobsReport,
  estimatesReport,
  clientProfitabilityReport,
];

export function getReportById(id: string): ReportDef<any> | undefined {
  return REPORTS.find((r) => r.id === id);
}

export function reportsByCategory(cat: ReportCategory): ReportDef<any>[] {
  return REPORTS.filter((r) => r.category === cat);
}
