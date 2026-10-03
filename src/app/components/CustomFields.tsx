import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { customFieldsStore, isFieldOn, type CfEntity, type CfField } from "../stores/customFieldsStore";
import { Switch } from "./ui/switch";

// Custom fields on forms and details pages (behaviour spec "Vision360 Custom
// Fields"). Values live on the record as { "0": …, "1": … } — one key per slot.
//
//   CustomFieldInputs   the form section: one input per named slot. Never required.
//   CustomFieldValues   read-only label/value pairs for a details page.
//   CustomFieldChips    the same, as items in a details-page header meta row.

export type CfValues = Record<string, string>;

export function useEntityFields(entity: CfEntity): CfField[] {
  const all = useSyncExternalStore(customFieldsStore.subscribe, customFieldsStore.getFields);
  return all[entity];
}

const fmtDate = (v: string) => {
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** How a stored value reads on a details page; `hint` flags a value the field no longer fits. */
export function formatCustomValue(f: CfField, v: string | undefined): { text: string | null; hint?: string } {
  if (f.type === "checkbox") return { text: v === "true" ? "Yes" : "No" };
  const raw = String(v ?? "").trim();
  if (!raw) return { text: null };
  if (f.type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? { text: n.toLocaleString("en-US") } : { text: raw, hint: "Doesn't match the field type" };
  }
  if (f.type === "date") {
    const d = fmtDate(raw);
    return d ? { text: d } : { text: raw, hint: "Doesn't match the field type" };
  }
  if (f.type === "dropdown" && !f.options.includes(raw)) return { text: raw, hint: "Not in the list anymore" };
  return { text: raw };
}

const inputCls =
  "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";

/** One custom field's control, typed by the field: text / number / date input,
 *  a styled select for dropdowns, a Yes/No switch for checkboxes. All share the
 *  36px row so a checkbox lines up with the inputs next to it. */
export function CustomFieldControl({ id, field, value, onChange }: { id: string; field: CfField; value: string; onChange: (v: string) => void }) {
  if (field.type === "checkbox") {
    const on = value === "true";
    return (
      <label htmlFor={id} className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-[#E5E7EB] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB]">
        <Switch id={id} checked={on} onCheckedChange={(c) => onChange(c ? "true" : "false")} />
        <span className={`text-[14px] ${on ? "text-[#1A2332]" : "text-[#6B7280]"}`}>{on ? "Yes" : "No"}</span>
      </label>
    );
  }
  if (field.type === "dropdown") {
    const stale = value && !field.options.includes(value);
    return (
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} cursor-pointer appearance-none pr-9 ${value ? "" : "text-[#9CA3AF]"}`}
        >
          <option value="">{field.options.length ? "Select…" : "No options yet"}</option>
          {field.options.map((o) => <option key={o} value={o} className="text-[#1A2332]">{o}</option>)}
          {stale && <option value={value} className="text-[#1A2332]">{value} (not in the list anymore)</option>}
        </select>
        <span className="material-icons pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "20px" }}>expand_more</span>
      </div>
    );
  }
  return (
    <input
      id={id}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      maxLength={field.type === "text" ? 120 : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.type === "text" ? "—" : field.type === "number" ? "0" : undefined}
      className={inputCls}
    />
  );
}

export function CustomFieldInputs({
  entity, values, onChange, idPrefix, columns = 2, emptyHint = true,
}: {
  entity: CfEntity;
  values: CfValues | undefined;
  onChange: (next: CfValues) => void;
  idPrefix?: string;
  /** 2 on wide forms, 1 in a narrow side panel. */
  columns?: 1 | 2;
  /** Show "No custom fields yet · Set up in Settings" when none are named. */
  emptyHint?: boolean;
}) {
  const navigate = useNavigate();
  const fields = useEntityFields(entity);
  const on = fields.map((f, i) => ({ f, i })).filter(({ f }) => isFieldOn(f));
  const set = (i: number, v: string) => onChange({ ...(values ?? {}), [String(i)]: v });

  if (on.length === 0) {
    if (!emptyHint) return null;
    return (
      <p className="text-[13px] text-[#8899AA]">
        No custom fields yet ·{" "}
        <button type="button" onClick={() => navigate("/settings?section=general")} className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 600 }}>
          Set up in Settings
        </button>
      </p>
    );
  }

  return (
    <div className={columns === 2 ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
      {on.map(({ f, i }) => {
        const id = `${idPrefix ?? entity}-cf-${i}`;
        return (
          <div key={i} className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={id} className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>{f.label}</label>
            <CustomFieldControl id={id} field={f} value={values?.[String(i)] ?? ""} onChange={(v) => set(i, v)} />
          </div>
        );
      })}
    </div>
  );
}

export function CustomFieldValues({
  entity, values, labelClassName = "text-[12px] text-[#6B7280]", valueClassName = "text-[14px] text-[#1A2332]", columns = 1,
}: {
  entity: CfEntity;
  values: CfValues | undefined;
  labelClassName?: string;
  valueClassName?: string;
  columns?: 1 | 2;
}) {
  const fields = useEntityFields(entity);
  const on = fields.map((f, i) => ({ f, i })).filter(({ f }) => isFieldOn(f));
  if (on.length === 0) return null;
  return (
    <div className={columns === 2 ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
      {on.map(({ f, i }) => {
        const { text, hint } = formatCustomValue(f, values?.[String(i)]);
        return (
          <div key={i} className="min-w-0">
            <div className={labelClassName}>{f.label}</div>
            <div className={valueClassName} style={{ fontWeight: 500 }}>
              {text ?? <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>—</span>}
            </div>
            {hint && <div className="text-[11px] text-[#B45309]">{hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Custom fields as "Label: value" items in a details-page header meta row,
 *  each preceded by the row's thin divider. Renders nothing when no field is on. */
export function CustomFieldChips({ entity, values }: { entity: CfEntity; values: CfValues | undefined }) {
  const fields = useEntityFields(entity);
  const on = fields.map((f, i) => ({ f, i })).filter(({ f }) => isFieldOn(f));
  return (
    <>
      {on.map(({ f, i }) => {
        const { text, hint } = formatCustomValue(f, values?.[String(i)]);
        return (
          <span key={i} className="contents">
            <div className="w-px h-4 bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5 px-3 text-[13px]" title={hint}>
              <span className="material-icons text-[#6B7280]" style={{ fontSize: "14px" }}>tune</span>
              <span className="text-[#6B7280]">{f.label}:</span>
              <span className={text ? "text-[#374151]" : "text-[#9CA3AF]"}>{text ?? "—"}</span>
            </div>
          </span>
        );
      })}
    </>
  );
}
