import { useEffect, useRef, useState } from "react";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  /** Currently selected values. */
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  /** Shown in the trigger when nothing is selected (e.g. "All"). */
  placeholder?: string;
  /** Disables the control (greyed out). */
  disabled?: boolean;
};

/**
 * Multi-select dropdown matching the Figma "multiple-select-example":
 * - Trigger: full-width 44px field; shows the selected labels comma-joined,
 *   or the placeholder when empty; chevron flips up when open; blue border when open.
 * - Menu: white, 1px border #E5E7EB, md shadow, 8px radius, 2px padding (same as QuickFilterSelect).
 * - Items: toggle on click (menu stays open); selected = #F0F4FB background + checkmark on the right.
 * - Closes on outside click or Escape.
 */
export function MultiSelect({ values, onChange, options, placeholder = "All", disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  // Selected labels in the option order, comma-joined.
  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  const triggerText = selectedLabels.length ? selectedLabels.join(", ") : placeholder;

  return (
    <div ref={ref} className="relative">
      {/* Trigger — matches the slide-over field style (44px, 8px radius). */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-11 px-3 flex items-center justify-between gap-2 border rounded-lg text-[14px] bg-white text-left transition-colors focus:outline-none disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF] disabled:cursor-not-allowed ${
          open ? "border-[#4A6FA5]" : "border-[#E5E7EB]"
        } ${selectedLabels.length ? "text-[#1A2332]" : "text-[#374151]"}`}
      >
        <span className="truncate">{triggerText}</span>
        <span
          className="material-icons flex-shrink-0 text-[#546478]"
          style={{ fontSize: "18px", transition: "transform 120ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {/* Menu */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-lg"
          style={{
            padding: 2,
            boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.10), 0px 2px 4px -2px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt) => {
            const active = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center justify-between px-2 rounded-md transition-colors"
                style={{
                  height: 32,
                  minHeight: 32,
                  paddingTop: 5.5,
                  paddingBottom: 5.5,
                  paddingLeft: 8,
                  paddingRight: 8,
                  backgroundColor: active ? "#F0F4FB" : "transparent",
                  fontFamily: "Geist, sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "#1A2332",
                  lineHeight: "20px",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F5F7FA";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = active ? "#F0F4FB" : "transparent";
                }}
              >
                <span>{opt.label}</span>
                {active && (
                  <span className="material-icons" style={{ fontSize: "16px", color: "#4A6FA5" }}>
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
