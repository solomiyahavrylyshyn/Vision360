// Series dialogs for a recurring job (Figma 5493:31429; tasks 9117 / 9236 / 9237):
// See all visits, Change number of visits / end date, Cancel series. Used by the
// job page and by the job drawer on the board.

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { jobsStore } from "../stores/jobsStore";
import { activeVisits, cancelSeries, changeSeriesVisits, minVisits, seriesRuleText, seriesVisits, visitsUntil } from "../utils/jobSeries";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_COLOR: Record<string, string> = {
  Completed: "#16A34A", "In Progress": "#D97706", Paused: "#9333EA", Scheduled: "#2563EB", Unscheduled: "#6B7280", Cancelled: "#DC2626",
};
const fmtDay = (iso: string) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Not scheduled";

function Shell({ title, sub, width = 480, onClose, children, footer }: { title: string; sub?: string; width?: number; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-h-[90vh] max-w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl flex flex-col" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0">
            <h3 className="text-[18px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>{title}</h3>
            {sub && <p className="mt-0.5 text-[13px] text-[#6B7280]">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-[#F3F4F6]"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>close</span></button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 pt-3 pb-4">{footer}</div>}
      </div>
    </div>
  );
}

const btn = "h-9 rounded-lg px-4 text-[14px]";
const useJobs = () => useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);

export function SeriesVisitsModal({ seriesId, currentId, onOpen, onClose }: { seriesId: string; currentId?: number; onOpen: (id: number) => void; onClose: () => void }) {
  useJobs();
  const visits = seriesVisits(seriesId);
  const active = visits.filter((v) => v.status !== "Cancelled");
  const first = visits[0];
  if (!first) return null;
  const done = active.filter((v) => v.status === "Completed").length;
  return (
    <Shell title={`All visits · ${first.title.replace(/\s*\(\d+\/\d+\)$/, "")}`} sub={`${seriesRuleText(first.series.rule, first.series.total)} · ${first.client}`} width={760} onClose={onClose}
      footer={<div className="flex w-full items-center justify-between text-[12px] text-[#6B7280]"><span>{done} completed · {active.length - done} to go · Click a row to open the job</span><span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total {money(active.reduce((s, v) => s + (v.totalPrice || 0), 0))}</span></div>}>
      <table className="w-full text-[13px]">
        <thead><tr className="border-y border-[#E5E7EB] bg-[#F9FAFB] text-left text-[12px] text-[#546478]"><th className="px-5 py-2" style={{ fontWeight: 500 }}>Visit</th><th className="px-3 py-2" style={{ fontWeight: 500 }}>Job</th><th className="px-3 py-2" style={{ fontWeight: 500 }}>Date</th><th className="px-3 py-2" style={{ fontWeight: 500 }}>Technician</th><th className="px-3 py-2" style={{ fontWeight: 500 }}>Status</th><th className="px-5 py-2 text-right" style={{ fontWeight: 500 }}>Amount</th></tr></thead>
        <tbody>
          {visits.map((v) => {
            const cur = v.id === currentId;
            const c = STATUS_COLOR[v.status] ?? "#6B7280";
            return (
              <tr key={v.id} onClick={() => onOpen(v.id)} className={`cursor-pointer border-b border-[#F1F3F7] last:border-0 hover:bg-[#F5F7FA] ${cur ? "bg-[#EEF3FA]" : ""} ${v.status === "Cancelled" ? "opacity-60" : ""}`}>
                <td className="px-5 py-2.5 text-[#1A2332]" style={{ fontWeight: cur ? 600 : 400 }}>{v.series.index} of {v.status === "Cancelled" ? "—" : v.series.total}</td>
                <td className="px-3 py-2.5 text-[#4A6FA5]" style={{ fontWeight: 500 }}>{v.jobNumber}</td>
                <td className="px-3 py-2.5 text-[#1A2332]">{fmtDay(v.startDate)}</td>
                <td className="px-3 py-2.5 text-[#1A2332]">{v.assignedTo || "—"}</td>
                <td className="px-3 py-2.5"><span className="rounded-lg px-2 py-0.5 text-[12px]" style={{ fontWeight: 500, color: c, backgroundColor: `${c}1F` }}>{v.status}</span></td>
                <td className="px-5 py-2.5 text-right text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>{money(v.totalPrice || 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Shell>
  );
}

export function ChangeVisitsModal({ seriesId, onClose }: { seriesId: string; onClose: () => void }) {
  useJobs();
  const active = activeVisits(seriesId);
  const first = active[0];
  const [mode, setMode] = useState<"count" | "date">(first?.series.rule.endMode === "date" ? "date" : "count");
  const [count, setCount] = useState(String(first?.series.total ?? 1));
  const [date, setDate] = useState(first?.series.rule.endDate ?? "");
  if (!first) return null;
  const now = first.series.total;
  const start = new Date((first.createdAt || "").slice(0, 10) + "T12:00:00");
  const n = mode === "count" ? Math.floor(Number(count) || 0) : (date ? visitsUntil(first.series.rule, date, isNaN(start.getTime()) ? new Date() : start) : 0);
  const min = minVisits(seriesId);
  const done = active.filter((v) => v.status === "Completed").length;
  const err = n < 1 ? "Enter at least 1 visit." : n < min ? `Visit ${min} is completed — the plan can't end before it.` : null;
  const hint = err ? null
    : n < now ? `Visits ${n + 1}–${now} will be cancelled. Completed visits are never changed.`
    : n > now ? `${n - now} new visit${n - now === 1 ? "" : "s"} will be added, copied from visit 1.`
    : "No change.";
  const save = () => {
    if (err || n === now && (mode === first.series.rule.endMode)) { onClose(); return; }
    const rule = mode === "date" ? { ...first.series.rule, endMode: "date" as const, endDate: date, count: n } : { ...first.series.rule, endMode: "count" as const, count: n, endDate: undefined };
    changeSeriesVisits(seriesId, n, rule);
    toast.success(n < now ? `Plan shortened to ${n} visits` : n > now ? `Plan extended to ${n} visits` : "Plan updated");
    onClose();
  };
  const field = "h-9 rounded-lg border border-[#E5E7EB] px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]";
  return (
    <Shell title="Change number of visits / end date" sub={`${first.title.replace(/\s*\(\d+\/\d+\)$/, "")} · ${done} of ${now} visits completed`} onClose={onClose}
      footer={<><button onClick={onClose} className={`${btn} border border-[#E5E7EB] bg-white text-[#1A2332] hover:bg-[#F5F7FA]`} style={{ fontWeight: 500 }}>Cancel</button><button disabled={!!err} onClick={save} className={`${btn} bg-[#4A6FA5] text-white hover:bg-[#3d5a85] disabled:opacity-50`} style={{ fontWeight: 500 }}>Save</button></>}>
      <div className="flex flex-col gap-3 px-5 py-2">
        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Ends</div>
        <label className="flex items-center gap-2.5 text-[14px] text-[#1A2332]">
          <input type="radio" checked={mode === "count"} onChange={() => setMode("count")} className="accent-[#4A6FA5]" />After
          <input type="number" min={1} value={count} disabled={mode !== "count"} onChange={(e) => setCount(e.target.value)} className={`${field} w-20 disabled:opacity-50`} />
          <span className="text-[#546478]">visits</span>
        </label>
        <label className="flex items-center gap-2.5 text-[14px] text-[#1A2332]">
          <input type="radio" checked={mode === "date"} onChange={() => setMode("date")} className="accent-[#4A6FA5]" />On
          <input type="date" value={date} disabled={mode !== "date"} onChange={(e) => setDate(e.target.value)} className={`${field} w-44 disabled:opacity-50`} />
          {mode === "date" && date && !err && <span className="text-[12px] text-[#6B7280]">{n} visits</span>}
        </label>
        {(err || hint) && (
          <div className={`rounded-lg px-3 py-2.5 text-[13px] ${err || n < now ? "bg-[#FEF2F2] text-[#B91C1C]" : n > now ? "bg-[#EEF3FA] text-[#3B5B8A]" : "bg-[#F5F7FA] text-[#6B7280]"}`}>{err ?? hint}</div>
        )}
      </div>
    </Shell>
  );
}

export function CancelSeriesDialog({ seriesId, onClose }: { seriesId: string; onClose: () => void }) {
  useJobs();
  const visits = seriesVisits(seriesId);
  const toCancel = visits.filter((v) => v.status !== "Completed" && v.status !== "Cancelled");
  const done = visits.filter((v) => v.status === "Completed");
  const confirm = () => { cancelSeries(seriesId); toast.success(`Series cancelled — ${toCancel.length} visit${toCancel.length === 1 ? "" : "s"} cancelled`); onClose(); };
  return (
    <Shell title="Cancel the whole series?" sub="These visits will be cancelled. Completed visits stay as they are." onClose={onClose}
      footer={<><button onClick={onClose} className={`${btn} border border-[#E5E7EB] bg-white text-[#1A2332] hover:bg-[#F5F7FA]`} style={{ fontWeight: 500 }}>Keep series</button><button disabled={!toCancel.length} onClick={confirm} className={`${btn} bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50`} style={{ fontWeight: 500 }}>Cancel series</button></>}>
      <div className="px-5 py-2">
        {toCancel.length === 0 ? <p className="text-[13px] text-[#6B7280]">Nothing left to cancel — every visit is completed or already cancelled.</p> : (
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            {toCancel.map((v) => {
              const live = v.status === "In Progress" || v.status === "Paused";
              return (
                <div key={v.id} className={`flex items-center gap-3 border-t border-[#F1F3F7] px-3 py-2 text-[13px] first:border-t-0 ${live ? "bg-[#FFF7ED]" : ""}`}>
                  <span className="w-16 text-[#1A2332]" style={{ fontWeight: 500 }}>{v.series.index} of {v.series.total}</span>
                  <span className="flex-1 text-[#546478]">{fmtDay(v.startDate)}</span>
                  <span className={`text-[12px] ${live ? "text-[#C2410C]" : "text-[#6B7280]"}`} style={{ fontWeight: 500 }}>{live ? `${v.status} · this visit is in progress` : v.status}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2.5 text-[12px] text-[#6B7280]">{done.length ? `Visit${done.length === 1 ? "" : "s"} ${done.map((d) => d.series.index).join(", ")} ${done.length === 1 ? "is" : "are"} completed and stay${done.length === 1 ? "s" : ""} as ${done.length === 1 ? "it is" : "they are"}. ` : ""}Nothing is deleted: cancelled visits stay in the history as Cancelled.</p>
      </div>
    </Shell>
  );
}
