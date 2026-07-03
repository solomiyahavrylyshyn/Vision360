import type { ReportCategory, ReportDef } from "./types";
import { salesReport } from "./configs/sales";

// Single source of truth for the Reports module — the landing page and the
// /reports/:reportId route both read from here. Add a report by dropping its
// config into ./configs and registering it below.
export const REPORTS: ReportDef<any>[] = [
  salesReport,
];

export function getReportById(id: string): ReportDef<any> | undefined {
  return REPORTS.find((r) => r.id === id);
}

export function reportsByCategory(cat: ReportCategory): ReportDef<any>[] {
  return REPORTS.filter((r) => r.category === cat);
}
