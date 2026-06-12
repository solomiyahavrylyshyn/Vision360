import type { ReactNode } from "react";
import { cn } from "./utils";

export const advancedInputClass =
  "w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]";

export const advancedSelectClass =
  "w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]";

export function AdvancedFilterPanel({
  children,
  className,
  onClose,
  onClear,
  onApply,
  title = "Advanced Filters",
}: {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  onClear?: () => void;
  onApply?: () => void;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={cn("relative bg-white w-[340px] h-full shadow-2xl flex flex-col overflow-hidden", className)}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
          <button type="button" onClick={onClose} className="text-[#546478] hover:text-[#1A2332]">
            <span className="material-icons" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
        {(onClear || onApply) && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
            <button
              type="button"
              onClick={onClear}
              className="flex-1 h-10 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors"
              style={{ fontWeight: 500 }}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-lg text-[13px] text-white transition-colors"
              style={{ fontWeight: 500 }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdvancedFilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function AdvancedFilterActions({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-[#E5E7EB] pt-5 flex items-center gap-2">
      {children}
    </div>
  );
}
