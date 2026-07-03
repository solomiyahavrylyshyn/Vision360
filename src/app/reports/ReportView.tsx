import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { PaginationFooter } from "../components/ui/pagination-footer";
import { ReportDatePicker } from "../components/ui/report-date-picker";
import { rangeForPreset, inRange, formatRangeLabel, type DatePreset } from "../utils/reportDates";
import { getReportById } from "./registry";
import type { ReportDef } from "./types";
import { ReportPreviewModal, ShareReportModal, ScheduleReportModal } from "./report-actions";

type AnyDef = ReportDef<Record<string, unknown>>;

export function ReportView() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const def = reportId ? getReportById(reportId) : undefined;
  if (!def) {
    return (
      <div className="px-7 py-10 bg-[#F5F7FA] min-h-full">
        <button onClick={() => navigate("/reports")} className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>← Back to Reports</button>
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white py-16 text-center text-[14px] text-[#8899AA]">Report not found.</div>
      </div>
    );
  }
  return <ReportPage key={def.id} def={def as AnyDef} />;
}

function ReportPage({ def }: { def: AnyDef }) {
  const navigate = useNavigate();
  const rows = def.useRows();

  const [preset, setPreset] = useState<DatePreset>(def.defaultDatePreset);
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [search, setSearch] = useState("");
  const [qf, setQf] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.quickFilters.map((f) => [f.key, f.default])));
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [amt, setAmt] = useState({ min: "", max: "" });
  const [advOpen, setAdvOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() =>
    new Set(def.columns.filter((c) => !c.defaultHidden).map((c) => c.key)));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [modal, setModal] = useState<null | "preview" | "print" | "share" | "schedule">(null);

  const range = useMemo(() => rangeForPreset(preset, custom), [preset, custom]);
  const rangeLabel = useMemo(() => formatRangeLabel(range), [range]);

  // Rows filtered by date + search + quick filters + amount range — the base
  // set the stat cards are computed over (per the selected period).
  const baseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = amt.min === "" ? -Infinity : Number(amt.min);
    const max = amt.max === "" ? Infinity : Number(amt.max);
    return rows.filter((r) => {
      if (def.baseFilter && !def.baseFilter(r)) return false;
      if (!inRange(def.dateField(r), range)) return false;
      if (q && !def.searchText(r).toLowerCase().includes(q)) return false;
      for (const f of def.quickFilters) {
        const v = qf[f.key];
        if (v && v !== f.default && !f.match(r, v)) return false;
      }
      if (def.amountField) {
        const a = def.amountField(r);
        if (a < min || a > max) return false;
      }
      return true;
    });
  }, [rows, range, search, qf, amt, def]);

  const activeCardDef = def.statCards.find((c) => c.key === activeCard && c.filter);
  const tableRows = useMemo(
    () => (activeCardDef?.filter ? baseRows.filter(activeCardDef.filter) : baseRows),
    [baseRows, activeCardDef]);

  const total = tableRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / perPage)));
  const pageRows = tableRows.slice((safePage - 1) * perPage, safePage * perPage);
  const cols = def.columns.filter((c) => visibleCols.has(c.key));

  // Active-filter chips (Housecall Pro style) — show WHICH filters are on, removable.
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  for (const f of def.quickFilters) {
    const v = qf[f.key];
    if (v && v !== f.default) {
      const opt = f.options.find((o) => o.value === v);
      chips.push({ key: f.key, label: `${f.label}: ${opt?.label ?? v}`, onRemove: () => { setQf((s) => ({ ...s, [f.key]: f.default })); setPage(1); } });
    }
  }
  if (amt.min !== "" || amt.max !== "") {
    chips.push({ key: "amt", label: `Amount: ${amt.min || "0"}–${amt.max || "∞"}`, onRemove: () => { setAmt({ min: "", max: "" }); setPage(1); } });
  }
  if (activeCardDef) chips.push({ key: "card", label: activeCardDef.label, onRemove: () => setActiveCard(null) });

  const qfClass = (active: boolean) => `h-9 pl-3 pr-8 border rounded-lg text-[13px] bg-white cursor-pointer outline-none transition-colors ${active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"}`;
  const actionBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#546478] hover:bg-[#F5F7FA] transition-colors";

  return (
    <div className="px-7 py-5 bg-[#F5F7FA] min-h-full flex flex-col">
      {/* Header: back + title/description + report actions */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => navigate("/reports")} className="mb-1 inline-flex items-center gap-1 text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 600 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>arrow_back</span>Reports
          </button>
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>{def.name}</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">{def.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className={actionBtn} onClick={() => setModal("preview")}><span className="material-icons" style={{ fontSize: "16px" }}>visibility</span>Preview</button>
          <button className={actionBtn} onClick={() => setModal("print")}><span className="material-icons" style={{ fontSize: "16px" }}>print</span>Print</button>
          <button className={actionBtn} onClick={() => setModal("share")}><span className="material-icons" style={{ fontSize: "16px" }}>share</span>Share</button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4A6FA5] px-3 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }} onClick={() => setModal("schedule")}>
            <span className="material-icons" style={{ fontSize: "16px" }}>schedule</span>Schedule
          </button>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-visible">
        {/* Toolbar: date + search + quick filters + advanced ; right: select cols + export */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] px-4 py-3">
          <ReportDatePicker preset={preset} onPreset={(p) => { setPreset(p); setPage(1); }} custom={custom} onCustom={setCustom} />
          <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…"
              className="h-9 w-[200px] rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] outline-none focus:border-[#4A6FA5]" />
          </div>
          {def.quickFilters.slice(0, 3).map((f) => (
            <select key={f.key} value={qf[f.key]} onChange={(e) => { setQf((s) => ({ ...s, [f.key]: e.target.value })); setPage(1); }} className={qfClass(qf[f.key] !== f.default)} aria-label={f.label}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.value === f.default ? `${f.label}: ${o.label}` : o.label}</option>)}
            </select>
          ))}
          {def.amountField && (
            <div className="relative">
              <button onClick={() => setAdvOpen((v) => !v)} className={`h-9 px-3 border rounded-lg text-[13px] inline-flex items-center gap-1.5 transition-colors ${advOpen || amt.min || amt.max ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA] bg-white"}`} style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "16px" }}>filter_alt</span>Advanced
              </button>
              {advOpen && (
                <div className="absolute left-0 top-11 z-20 w-[260px] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
                  <div className="text-[12px] uppercase tracking-wide text-[#8899AA] mb-2" style={{ fontWeight: 600 }}>Amount range</div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={amt.min} onChange={(e) => { setAmt((a) => ({ ...a, min: e.target.value })); setPage(1); }} placeholder="Min" className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2 text-[13px] outline-none focus:border-[#4A6FA5]" />
                    <span className="text-[#9CA3AF]">–</span>
                    <input type="number" value={amt.max} onChange={(e) => { setAmt((a) => ({ ...a, max: e.target.value })); setPage(1); }} placeholder="Max" className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2 text-[13px] outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setColsOpen((v) => !v)} className={actionBtn}><span className="material-icons" style={{ fontSize: "16px" }}>view_column</span>Columns</button>
              {colsOpen && (
                <div className="absolute right-0 top-11 z-20 w-[220px] rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg max-h-[300px] overflow-y-auto">
                  {def.columns.map((c) => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#F5F7FA] text-[13px] text-[#1A2332]">
                      <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => setVisibleCols((s) => { const n = new Set(s); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n; })} className="h-4 w-4 accent-[#4A6FA5]" />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button className={actionBtn} onClick={() => toast.success(`Exported ${total} row${total === 1 ? "" : "s"} to Excel.`)}>
              <span className="material-icons" style={{ fontSize: "16px" }}>file_download</span>Export to Excel
            </button>
          </div>
        </div>

        {/* Active-filter chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F5] px-4 py-2.5">
            <span className="text-[12px] text-[#8899AA]" style={{ fontWeight: 600 }}>Filters:</span>
            {chips.map((c) => (
              <span key={c.key} className="inline-flex items-center gap-1 rounded-full border border-[#C5D5EC] bg-[#EEF3FA] py-1 pl-2.5 pr-1 text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                {c.label}
                <button onClick={c.onRemove} aria-label={`Remove ${c.label}`} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#D8E4F5]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
                </button>
              </span>
            ))}
            <button onClick={() => { setQf(Object.fromEntries(def.quickFilters.map((f) => [f.key, f.default]))); setAmt({ min: "", max: "" }); setActiveCard(null); setPage(1); }} className="text-[12px] text-[#8899AA] hover:text-[#546478] underline">Clear all</button>
          </div>
        )}

        {/* Summary stat cards — values per period; click to filter the table */}
        {def.statCards.length > 0 && (
          <div className="grid gap-3 border-b border-[#EEF1F5] p-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(190px, 1fr))` }}>
            {def.statCards.map((c) => {
              const on = activeCard === c.key;
              const clickable = !!c.filter;
              return (
                <button
                  key={c.key}
                  disabled={!clickable}
                  onClick={() => clickable && setActiveCard(on ? null : c.key)}
                  className={`rounded-xl border p-3 text-left transition-all ${on ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/20" : "border-[#E5E7EB]"} ${clickable ? "cursor-pointer hover:border-[#C5D5EC] hover:shadow-sm" : "cursor-default"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: c.bg }}>
                      <span className="material-icons" style={{ fontSize: "18px", color: c.accent }}>{c.icon}</span>
                    </span>
                    {clickable && <span className="material-icons text-[#C5CEDD]" style={{ fontSize: "16px" }}>{on ? "filter_alt" : "chevron_right"}</span>}
                  </div>
                  <div className="mt-2 text-[20px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{c.value(baseRows)}</div>
                  <div className="mt-0.5 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>{c.label}</div>
                  {c.sublabel && <div className="mt-0.5 text-[11px] text-[#9CA3AF]">{c.sublabel(baseRows)}</div>}
                </button>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC]">
                {cols.map((c) => (
                  <th key={c.key} className={`whitespace-nowrap px-4 py-2.5 text-[12px] text-[#6B7280] ${c.align === "right" ? "text-right" : "text-left"}`} style={{ fontWeight: 600 }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={String(def.rowKey(r))} className="border-b border-[#EEF1F5] hover:bg-[#F9FAFB]">
                  {cols.map((c) => (
                    <td key={c.key} className={`px-4 py-2.5 text-[13px] text-[#1A2332] ${c.align === "right" ? "text-right tabular-nums" : "text-left"}`}>{c.render(r)}</td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={cols.length} className="px-4 py-14 text-center text-[13px] text-[#8899AA]">No records match this selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter page={safePage} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
      </div>

      {(modal === "preview" || modal === "print") && (
        <ReportPreviewModal def={def} rows={tableRows} dateLabel={rangeLabel} autoPrint={modal === "print"} onClose={() => setModal(null)} />
      )}
      {modal === "share" && <ShareReportModal reportName={def.name} onClose={() => setModal(null)} />}
      {modal === "schedule" && <ScheduleReportModal reportName={def.name} onClose={() => setModal(null)} />}
    </div>
  );
}
