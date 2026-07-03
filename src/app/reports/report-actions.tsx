import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { clientsStore } from "../stores/clientsStore";
import type { ReportDef } from "./types";

// Staff pool for Share / Schedule recipients (prototype). Real app would read
// the team directory.
const STAFF = [
  { name: "You (Owner)", email: "owner@company.com" },
  { name: "Peter Novak", email: "peter.novak@company.com" },
  { name: "Travis Brown", email: "travis.brown@company.com" },
  { name: "Maria Garcia", email: "maria.garcia@company.com" },
];

function ModalShell({ title, onClose, children, footer, width = "w-[520px]" }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className={`${width} max-w-full max-h-[88vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4 shrink-0">
          <h2 className="text-[17px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]">
            <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4 shrink-0">{footer}</div>
      </div>
    </div>
  );
}

// ── Preview: clean, print-ready report template (also what goes to print/email) ──
export function ReportPreviewModal<T>({ def, rows, dateLabel, onClose, autoPrint = false }: {
  def: ReportDef<T>; rows: T[]; dateLabel: string; onClose: () => void; autoPrint?: boolean;
}) {
  const cards = def.statCards.map((c) => ({ label: c.label, value: c.value(rows) }));
  const print = () => window.print();
  // "Print report" opens this same template and fires the browser print dialog.
  useEffect(() => { if (autoPrint) { const t = setTimeout(() => window.print(), 250); return () => clearTimeout(t); } }, [autoPrint]);
  return (
    <ModalShell
      title={`Preview — ${def.name}`}
      onClose={onClose}
      width="w-[900px]"
      footer={<>
        <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Close</button>
        <button onClick={print} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>print</span>Print
        </button>
      </>}
    >
      {/* print scope: hide everything except the report area when printing */}
      <style>{`@media print{body *{visibility:hidden!important}#report-print-area,#report-print-area *{visibility:visible!important}#report-print-area{position:absolute!important;left:0;top:0;width:100%;padding:24px;margin:0}}`}</style>
      <div id="report-print-area" className="text-[#1A2332]">
        <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>VISION360</div>
            <h1 className="mt-1 text-[22px]" style={{ fontWeight: 700 }}>{def.name}</h1>
            <div className="mt-0.5 text-[13px] text-[#6B7280]">{dateLabel}</div>
          </div>
          <div className="text-right text-[12px] text-[#8899AA]">
            <div>Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            <div>{rows.length} record{rows.length === 1 ? "" : "s"}</div>
          </div>
        </div>
        {cards.length > 0 && (
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0,1fr))` }}>
            {cards.map((c) => (
              <div key={c.label} className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 600 }}>{c.label}</div>
                <div className="mt-0.5 text-[17px] text-[#1A2332]" style={{ fontWeight: 700 }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
        <table className="mt-5 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[#D8DCE6]">
              {def.columns.map((col) => (
                <th key={col.key} className={`py-2 pr-3 text-[#546478] ${col.align === "right" ? "text-right" : "text-left"}`} style={{ fontWeight: 600 }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((r) => (
              <tr key={String(def.rowKey(r))} className="border-b border-[#EEF1F5]">
                {def.columns.map((col) => (
                  <td key={col.key} className={`py-1.5 pr-3 align-top ${col.align === "right" ? "text-right" : "text-left"}`}>{col.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-8 text-center text-[13px] text-[#8899AA]">No records for this selection.</div>}
      </div>
    </ModalShell>
  );
}

// ── Share: pick a person (from the directory / clients) → send ──
export function ShareReportModal({ reportName, onClose }: { reportName: string; onClose: () => void }) {
  const clients = clientsStore.getSnapshot();
  const people = useMemo(() => {
    const fromClients = clients
      .filter((c) => c.email)
      .map((c) => ({ name: c.name, email: c.email }));
    const seen = new Set<string>();
    return [...STAFF, ...fromClients].filter((p) => (seen.has(p.email) ? false : (seen.add(p.email), true)));
  }, [clients]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string>("");
  const filtered = people.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const send = () => { toast.success(`"${reportName}" sent to ${picked}.`); onClose(); };
  return (
    <ModalShell
      title="Share report"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
        <button onClick={send} disabled={!picked} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85] disabled:opacity-40" style={{ fontWeight: 600 }}>Send</button>
      </>}
    >
      <label className="block text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Send to</label>
      <div className="relative mt-1.5">
        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people by name or email…"
          className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] outline-none focus:border-[#4A6FA5]" />
      </div>
      <div className="mt-2 max-h-[280px] overflow-y-auto rounded-lg border border-[#EEF1F5]">
        {filtered.map((p) => (
          <button key={p.email} onClick={() => setPicked(p.email)}
            className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors ${picked === p.email ? "bg-[#EBF0F8]" : "hover:bg-[#F9FAFB]"}`}>
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{p.name}</span>
              <span className="block truncate text-[12px] text-[#8899AA]">{p.email}</span>
            </span>
            {picked === p.email && <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>check_circle</span>}
          </button>
        ))}
        {filtered.length === 0 && <div className="px-3 py-6 text-center text-[13px] text-[#8899AA]">No matches.</div>}
      </div>
    </ModalShell>
  );
}

// ── Schedule: frequency, send time, recipients + next-run indicator ──
export function ScheduleReportModal({ reportName, onClose }: { reportName: string; onClose: () => void }) {
  const [freq, setFreq] = useState("weekly");
  const [time, setTime] = useState("21:00");
  const [recipients, setRecipients] = useState<string[]>([STAFF[0].email]);
  const toggle = (email: string) => setRecipients((r) => (r.includes(email) ? r.filter((e) => e !== email) : [...r, email]));

  const timeLabel = (() => {
    const [h, m] = time.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
  })();
  const nextRun = freq === "daily" ? `tomorrow at ${timeLabel}`
    : freq === "weekly" ? `next Monday at ${timeLabel}`
    : `on the 1st at ${timeLabel}`;

  const save = () => { toast.success(`"${reportName}" scheduled ${freq}. First report will be created ${nextRun}.`); onClose(); };
  const field = "h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] outline-none focus:border-[#4A6FA5]";
  return (
    <ModalShell
      title="Schedule report"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
        <button onClick={save} disabled={recipients.length === 0} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85] disabled:opacity-40" style={{ fontWeight: 600 }}>Save schedule</button>
      </>}
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Frequency</span>
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className={field}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Send time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
        </label>
      </div>
      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Recipients</span>
        <div className="rounded-lg border border-[#EEF1F5]">
          {STAFF.map((p) => (
            <label key={p.email} className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-[#F9FAFB]">
              <input type="checkbox" checked={recipients.includes(p.email)} onChange={() => toggle(p.email)} className="h-4 w-4 accent-[#4A6FA5]" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{p.name}</span>
                <span className="block truncate text-[12px] text-[#8899AA]">{p.email}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#D8E4F2] bg-[#EBF2FC] px-3 py-2.5 text-[13px] text-[#1A2332]">
        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>schedule</span>
        First report will be created <strong style={{ fontWeight: 700 }}>{nextRun}</strong>.
      </div>
    </ModalShell>
  );
}
