import type { ReportCategory, ReportDef } from "./types";
import { salesReport } from "./configs/sales";
import { arAgingReport } from "./configs/arAging";
import { expensesReport } from "./configs/expenses";
import { paymentsReport } from "./configs/payments";
import { salesTaxReport } from "./configs/salesTax";
import { clientsReport } from "./configs/clients";
import { jobsReport } from "./configs/jobs";
import { estimatesReport } from "./configs/estimates";
import { itemUsageReport } from "./configs/itemUsage";
import { jobProfitabilityReport } from "./configs/jobProfitability";
import { teamSalesReport } from "./configs/teamSales";
import { teamConversionReport } from "./configs/teamConversion";

// Single source of truth for the Reports module — the landing page and the
// /reports/:reportId route both read from here. Array order = display order
// within each category. The roster is EXACTLY the PRD v2.0 MVP set
// (FR-12.7–12.17): P&L is Pro (FR-12.18) and deliberately absent.
export const REPORTS: ReportDef<any>[] = [
  // Financial Business (FR-12.7–12.11)
  salesReport,
  arAgingReport,
  expensesReport,
  paymentsReport,
  salesTaxReport,
  // Clients, Jobs & Estimates (FR-12.12–12.16)
  clientsReport,
  jobsReport,
  itemUsageReport,
  jobProfitabilityReport,
  estimatesReport,
  // Team Operations (FR-12.17)
  teamSalesReport,
  teamConversionReport,
];

export function getReportById(id: string): ReportDef<any> | undefined {
  return REPORTS.find((r) => r.id === id);
}

export function reportsByCategory(cat: ReportCategory): ReportDef<any>[] {
  return REPORTS.filter((r) => r.category === cat);
}
