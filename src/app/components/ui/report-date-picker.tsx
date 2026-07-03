import { DATE_PRESETS, type DatePreset } from "../../utils/reportDates";

// Unified date picker for every report (Marek call #21 — one shared component,
// role model = the Estimates picker). Controlled: parent owns preset + custom
// range. When "Custom range" is chosen, two date inputs appear inline.
export function ReportDatePicker({
  preset,
  onPreset,
  custom,
  onCustom,
  defaultPreset = "this_month",
}: {
  preset: DatePreset;
  onPreset: (p: DatePreset) => void;
  custom: { from: string; to: string };
  onCustom: (c: { from: string; to: string }) => void;
  defaultPreset?: DatePreset;
}) {
  const active = preset !== defaultPreset;
  const selectCls = `h-9 pl-3 pr-8 border rounded-lg text-[13px] bg-white cursor-pointer outline-none transition-colors ${
    active ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] text-[#546478] hover:border-[#C5CEDD]"
  }`;
  const dateCls = "h-9 px-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1A2332] bg-white outline-none focus:border-[#4A6FA5]";

  return (
    <div className="flex items-center gap-2">
      <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>calendar_today</span>
      <select value={preset} onChange={(e) => onPreset(e.target.value as DatePreset)} className={selectCls} aria-label="Date range">
        {DATE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.value === defaultPreset ? `Date: ${p.label}` : p.label}</option>
        ))}
      </select>
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <input type="date" value={custom.from} onChange={(e) => onCustom({ ...custom, from: e.target.value })} className={dateCls} aria-label="From date" />
          <span className="text-[13px] text-[#9CA3AF]">–</span>
          <input type="date" value={custom.to} onChange={(e) => onCustom({ ...custom, to: e.target.value })} className={dateCls} aria-label="To date" />
        </div>
      )}
    </div>
  );
}
