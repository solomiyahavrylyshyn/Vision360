import { useNavigate } from "react-router";
import { REPORT_CATEGORIES } from "../reports/types";
import { reportsByCategory } from "../reports/registry";

// Reports landing — reports grouped under the three categories (Marek call #21),
// each a short card. A report opens the module's list pre-filtered for that
// report (/reports/:id). No standalone "scheduled reports" list anymore.
export function Reports() {
  const navigate = useNavigate();
  return (
    <div className="px-7 py-6 bg-[#F5F7FA] min-h-full">
      <div className="mb-6">
        <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>Reports</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">Pre-filtered views of your data — preview, print, share or schedule any report.</p>
      </div>

      <div className="space-y-8">
        {REPORT_CATEGORIES.map((cat) => {
          const reports = reportsByCategory(cat.key);
          return (
            <section key={cat.key}>
              <div className="mb-3">
                <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{cat.label}</h2>
                <p className="text-[13px] text-[#8899AA]">{cat.description}</p>
              </div>
              {reports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D8DCE6] bg-white px-4 py-6 text-[13px] text-[#9CA3AF]">
                  Coming soon.
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/reports/${r.id}`)}
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
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
