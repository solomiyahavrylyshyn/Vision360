import * as React from "react";
import { useEffect, useRef, useState } from "react";

export type QuickFilterOption = {
  value: string;
  label: string;
};

type QuickFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: QuickFilterOption[];
  /** Prefix shown in the trigger before the selected label, e.g. "Date:" */
  prefix?: string;
};

/**
 * Custom dropdown that matches the Figma quick-filter menu spec:
 * - Trigger: pill-shaped button showing "{prefix} {label}" with a chevron
 * - Menu: white, 1px border #E5E7EB, md shadow, 8px radius, 2px padding
 * - Items: 32px tall, 5.5px/8px padding, 6px radius
 * - Active item: #F0F4FB background + checkmark on the right
 * - Font: 14px Geist regular, #1A2332
 */
export function QuickFilterSelect({
  value,
  onChange,
  options,
  prefix,
}: QuickFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const isActive = value !== options[0]?.value;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-8 pl-3 pr-2.5 flex items-center gap-1.5 border rounded-lg text-[13px] transition-colors ${
          isActive
            ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
            : "border-[#E5E7EB] text-[#546478] bg-white hover:border-[#C5CEDD]"
        }`}
        style={{ fontWeight: 500 }}
      >
        {prefix && (
          <span style={{ fontWeight: 500 }}>{prefix}</span>
        )}
        <span>{selected?.label}</span>
        <span
          className="material-icons"
          style={{ fontSize: "16px", transition: "transform 120ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 bg-white border border-[#E5E7EB] rounded-lg"
          style={{
            minWidth: 136,
            padding: 2,
            boxShadow:
              "0px 4px 6px -1px rgba(0,0,0,0.10), 0px 2px 4px -2px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
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
                  if (!active)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#F5F7FA";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    active ? "#F0F4FB" : "transparent";
                }}
              >
                <span>{opt.label}</span>
                {active && (
                  <span
                    className="material-icons"
                    style={{ fontSize: "16px", color: "#4A6FA5" }}
                  >
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
