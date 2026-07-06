import { REPORT_CATEGORIES, type ReportCategory } from "../reports/types";
import { reportsByCategory } from "../reports/registry";

// Reports Marek listed but that are intentionally deferred (no backing module
// yet) — shown as disabled "coming soon" cards so the roadmap item is visible
// rather than looking forgotten. (Sales tax = TBD pending a tax module.)
const PLANNED_REPORTS: Partial<Record<ReportCategory, { name: string; description: string; icon: string }[]>> = {
  financial: [
    { name: "Sales tax report", description: "Taxable sales and tax collected vs. owed — coming with the tax module.", icon: "receipt_long" },
  ],
};

// Reports landing — reports grouped under the three categories (Marek call #21),
// each a short card. Lives inside the Home "Reports" tab (not a separate
// section); selecting a card opens that report inline via onOpen. No standalone
// "scheduled reports" list anymore.
export function ReportsLanding({ onOpen }: { onOpen: (reportId: string) => void }) {
  return (
      <div className="space-y-8">
        {REPORT_CATEGORIES.map((cat) => {
          const reports = reportsByCategory(cat.key);
          const planned = PLANNED_REPORTS[cat.key] ?? [];
          return (
            <section key={cat.key}>
              <div className="mb-3">
                <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{cat.label}</h2>
                <p className="text-[13px] text-[#8899AA]">{cat.description}</p>
              </div>
              {reports.length === 0 && planned.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D8DCE6] bg-white px-4 py-6 text-[13px] text-[#9CA3AF]">
                  Coming soon.
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpen(r.id)}
                      className="group flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 text-left transition-all hover:border-[#C5D5EC] hover:shadow-sm"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF0F8]">
                        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>{r.icon}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{r.name}</span>
                          <span className="material-icons text-[#C5CEDD] transition-transform group-hover:translate-x-0.5" style={{ fontSize: "18px" }}>arrow_forward</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-[1.5] text-[#6B7280]">{r.description}</span>
                      </span>
                    </button>
                  ))}
                  {planned.map((p) => (
                    <div
                      key={p.name}
                      aria-disabled
                      title="Coming soon"
                      className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-dashed border-[#D8DCE6] bg-[#FAFBFC] p-4 text-left opacity-80"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5]">
                        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>{p.icon}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[15px] text-[#6B7280]" style={{ fontWeight: 600 }}>{p.name}</span>
                          <span className="rounded-full bg-[#EEF1F5] px-2 py-0.5 text-[11px] text-[#8899AA]" style={{ fontWeight: 600 }}>Soon</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-[1.5] text-[#9CA3AF]">{p.description}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
  );
}
