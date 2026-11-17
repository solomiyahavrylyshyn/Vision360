// A report's History (under the report) and its Activity tab — task 9349.
// Same table and activity styles as invoices and jobs:
//   • History: each Generate and download, newest first — Date, Who, Action,
//     Period, Filters, and Open, which shows the report again with the same
//     period and filters on today's data (and records nothing);
//   • Activity: the report's schedules (Edit / Stop), then every send — shared
//     by hand or by a schedule — with whom it reached and the period.
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { PaginationFooter } from "../components/ui/pagination-footer";
import type { ReportDef } from "./types";
import {
  reportHistoryStore, describeQuery, periodLabel, runTime, scheduleWhen, scheduleNext, namesLine,
  type ReportRun, type ReportScheduleRec, type RunKind,
} from "../stores/reportHistoryStore";
import { DATE_PRESETS } from "../utils/reportDates";

const KIND: Record<RunKind, { label: string; icon: string; color: string; bg: string }> = {
  Generated:  { label: "Generated", icon: "summarize",       color: "#4A6FA5", bg: "#EBF0F8" },
  ExportPdf:  { label: "PDF",       icon: "picture_as_pdf",  color: "#DC2626", bg: "#FEE2E2" },
  ExportXlsx: { label: "Excel",     icon: "table_view",      color: "#16A34A", bg: "#DCFCE7" },
  Shared:     { label: "Shared",    icon: "send",            color: "#4A6FA5", bg: "#EBF0F8" },
  Scheduled:  { label: "Scheduled", icon: "event_repeat",    color: "#0D9488", bg: "#CCFBF1" },
};

const presetLabel = (run: ReportRun) =>
  run.query.preset === "custom" ? null : DATE_PRESETS.find((p) => p.value === run.query.preset)?.label ?? null;

const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Card({ title, sub, count, children }: { title: string; sub?: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <h2 className="flex items-center gap-2 text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>
          {title}
          {count !== undefined && <span className="rounded-full bg-[#F1F3F7] px-2 py-0.5 text-[12px] text-[#6B7280]" style={{ fontWeight: 600 }}>{count}</span>}
        </h2>
        {sub && <p className="mt-0.5 text-[12px] text-[#8899AA]">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F3F7]">
        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 22 }}>{icon}</span>
      </span>
      <div className="mt-2.5 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</div>
      <div className="mt-0.5 text-[13px] text-[#8899AA]">{sub}</div>
    </div>
  );
}

function FilterChips({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-[#9CA3AF]">No filters</span>;
  const shown = items.slice(0, 2);
  return (
    <span className="flex flex-wrap items-center gap-1" title={items.join(" · ")}>
      {shown.map((f) => (
        <span key={f} className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[12px] text-[#374151] whitespace-nowrap">{f}</span>
      ))}
      {items.length > shown.length && <span className="text-[12px] text-[#6B7280]">+{items.length - shown.length}</span>}
    </span>
  );
}

// ── History ──────────────────────────────────────────────────────────────────
export function ReportHistoryCard({ def, onOpen }: { def: ReportDef<any>; onOpen: (run: ReportRun) => void }) {
  useSyncExternalStore(reportHistoryStore.subscribe, reportHistoryStore.getSnapshot);
  const runs = reportHistoryStore.history(def.id);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const safePage = Math.min(page, Math.max(1, Math.ceil(runs.length / perPage)));
  const pageRows = runs.slice((safePage - 1) * perPage, safePage * perPage);
  const th = "whitespace-nowrap px-4 py-2.5 text-left text-[12px] text-[#6B7280]";

  return (
    <Card title="History" count={runs.length} sub="Each time this report was generated or downloaded. Open shows it again with the same period and filters, on today's data.">
      {runs.length === 0 ? (
        <Empty icon="history" title="No reports generated yet" sub="Generated reports and downloads appear here" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC]">
                  <th className={th} style={{ fontWeight: 600 }}>Date</th>
                  <th className={th} style={{ fontWeight: 600 }}>Who</th>
                  <th className={th} style={{ fontWeight: 600 }}>Action</th>
                  <th className={th} style={{ fontWeight: 600 }}>Period</th>
                  <th className={th} style={{ fontWeight: 600 }}>Filters</th>
                  <th className="w-[90px] px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const k = KIND[r.kind];
                  const preset = presetLabel(r);
                  return (
                    <tr key={r.id} className="border-b border-[#EEF1F5] last:border-0 hover:bg-[#F9FAFB]">
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#1A2332]">{runTime(r.at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#1A2332]">
                        <span className="inline-flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF0F8] text-[10px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>{initials(r.by ?? "—")}</span>
                          {r.by ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] whitespace-nowrap" style={{ color: k.color, backgroundColor: k.bg, fontWeight: 600 }}>
                          <span className="material-icons" style={{ fontSize: 14 }}>{k.icon}</span>{k.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#1A2332]">
                        {periodLabel(r.query)}
                        {preset && <div className="text-[12px] text-[#8899AA]">{preset}</div>}
                      </td>
                      <td className="px-4 py-3 text-[13px]"><FilterChips items={describeQuery(def, r.query)} /></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onOpen(r)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Open</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationFooter page={safePage} perPage={perPage} total={runs.length} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} />
        </>
      )}
    </Card>
  );
}

// ── Activity tab ─────────────────────────────────────────────────────────────
export function ReportActivityTab({ def, onEditSchedule, onNewSchedule }: {
  def: ReportDef<any>; onEditSchedule: (s: ReportScheduleRec) => void; onNewSchedule: () => void;
}) {
  useSyncExternalStore(reportHistoryStore.subscribe, reportHistoryStore.getSnapshot);
  const schedules = reportHistoryStore.schedules(def.id);
  const sends = reportHistoryStore.sends(def.id);
  const [shown, setShown] = useState(5);
  const [stopping, setStopping] = useState<ReportScheduleRec | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Schedules" count={schedules.length}>
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center pb-8 text-center">
            <Empty icon="event_repeat" title="No schedules yet" sub="Use Schedule to send this report on its own" />
            <button onClick={onNewSchedule} className="-mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>Schedule
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[#EEF1F5]">
            {schedules.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="material-icons flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ fontSize: 18, color: KIND.Scheduled.color, backgroundColor: KIND.Scheduled.bg }}>event_repeat</span>
                <div className="min-w-[220px] flex-1">
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{scheduleWhen(s)}</div>
                  <div className="text-[13px] text-[#6B7280]">
                    To {namesLine(s.recipients)} · next {scheduleNext(s)} · set up by {s.createdBy}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => onEditSchedule(s)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Edit</button>
                  <button onClick={() => setStopping(s)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]" style={{ fontWeight: 500 }}>Stop</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Sends" count={sends.length} sub="Every time this report was shared by hand or sent by a schedule.">
        {sends.length === 0 ? (
          <Empty icon="send" title="No sends yet" sub="Shared and scheduled sends appear here" />
        ) : (
          <div className="divide-y divide-[#F1F3F7] px-4">
            {sends.slice(0, shown).map((r) => {
              const k = KIND[r.kind];
              const sched = r.scheduleId ? schedules.find((s) => s.id === r.scheduleId) : undefined;
              const title = r.kind === "Scheduled"
                ? `Scheduled send${sched ? ` · ${scheduleWhen(sched)}` : ""}`
                : `Shared by ${r.by ?? "someone"}`;
              const filters = describeQuery(def, r.query);
              return (
                <div key={r.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="material-icons flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ fontSize: 18, color: k.color, backgroundColor: k.bg }}>{k.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</div>
                      <div className="mt-0.5 text-[13px] text-[#6B7280]">
                        To {(r.recipients ?? []).join(", ") || "—"} · {periodLabel(r.query)}{filters.length ? ` · ${filters.join(" · ")}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-[13px] text-[#6B7280]">{runTime(r.at)}</div>
                </div>
              );
            })}
            {sends.length > shown && (
              <div className="py-3 text-center">
                <button onClick={() => setShown((n) => n + 5)} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 600 }}>Load more</button>
              </div>
            )}
          </div>
        )}
      </Card>

      {stopping && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 p-4" onClick={() => setStopping(null)}>
          <div className="w-[400px] max-w-full rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] text-[#1A2332]" style={{ fontWeight: 600 }}>Stop this schedule?</h3>
            <p className="mt-1.5 text-[13px] text-[#6B7280]">{scheduleWhen(stopping)} to {namesLine(stopping.recipients)}. No more reports will be sent; past sends stay in Activity.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setStopping(null)} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
              <button onClick={() => { reportHistoryStore.stopSchedule(stopping.id); setStopping(null); toast.success("Schedule stopped", { description: "No more reports will be sent." }); }}
                className="h-9 rounded-lg bg-[#DC2626] px-4 text-[13px] text-white hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Stop schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
