import { useState } from "react";

// RPT-2 — per-report access, grouped by category. Shared by Settings (role /
// permissions config) and the Invite-user form so the granular "Report access"
// list is identical in both places. Mirrors the report catalog on the dashboard
// Reports tab (14 reports).
export const reportAccessCatalog: Array<{ category: string; icon: string; reports: string[] }> = [
  {
    category: "Financial / Business",
    icon: "account_balance",
    reports: [
      "Revenue Report",
      "Profit & Loss Statement",
      "Invoice Summary (Accounts Receivable)",
      "Expense Report",
      "Sales Tax Report",
      "Payments Report",
    ],
  },
  {
    category: "Estimates",
    icon: "description",
    reports: ["Estimates Report", "Estimate Conversion Report", "Revenue by Technician"],
  },
  {
    category: "Jobs",
    icon: "work",
    reports: ["Jobs Report", "Job Costing Summary"],
  },
  {
    category: "Clients / Team / Items",
    icon: "groups",
    reports: ["Client Report", "Team Report", "Items Report (Items Usage Report)"],
  },
];

export const allReportNames = reportAccessCatalog.flatMap((c) => c.reports);

// Default grant: every report on.
export const defaultReportAccess = (): Record<string, boolean> =>
  Object.fromEntries(allReportNames.map((n) => [n, true]));

// Controlled panel: `value` is a { reportName: enabled } map; `onChange` gets the
// next map. Expand/collapse of categories is purely visual and kept internal.
export function ReportAccessPanel({
  value,
  onChange,
}: {
  value: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(reportAccessCatalog.map((c) => c.category)),
  );
  const toggleCat = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  const toggleReport = (name: string) => onChange({ ...value, [name]: !value[name] });
  const setCategoryReports = (reports: string[], on: boolean) => {
    const next = { ...value };
    reports.forEach((r) => { next[r] = on; });
    onChange(next);
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-[#E5E7EB]">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Report access</span>
          <span className="text-[12px] leading-4 text-[#6B7280]">
            Choose which reports this role can open. {Object.values(value).filter(Boolean).length} of {allReportNames.length} enabled.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(Object.fromEntries(allReportNames.map((n) => [n, true]))); }}
            className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[13px] text-[#1A2332] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(Object.fromEntries(allReportNames.map((n) => [n, false]))); }}
            className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[13px] text-[#1A2332] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#E5E7EB]">
        {reportAccessCatalog.map((group) => {
          const selectedCount = group.reports.filter((r) => value[r]).length;
          const allOn = selectedCount === group.reports.length;
          const someOn = selectedCount > 0 && !allOn;
          const isExpanded = expanded.has(group.category);
          return (
            <div key={group.category}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleCat(group.category); }}
                  className="flex flex-1 items-center gap-2.5 text-left"
                >
                  <span className="material-icons text-[#6B7280] transition-transform" style={{ fontSize: "20px", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}>expand_more</span>
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>{group.icon}</span>
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{group.category}</span>
                  <span className="text-[12px] text-[#6B7280]">{selectedCount}/{group.reports.length}</span>
                </button>
                <label className="flex items-center gap-2 text-[12px] text-[#546478] cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => { if (el) el.indeterminate = someOn; }}
                    onChange={() => setCategoryReports(group.reports, !allOn)}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#4A6FA5] accent-[#4A6FA5] cursor-pointer"
                  />
                  Select category
                </label>
              </div>

              {isExpanded && (
                <div className="pb-2">
                  {group.reports.map((report) => (
                    <label
                      key={report}
                      className="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-[#F9FAFB] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(value[report])}
                        onChange={() => toggleReport(report)}
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#4A6FA5] accent-[#4A6FA5] cursor-pointer"
                      />
                      <span className="text-[13px] text-[#374151]">{report}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
