import type { ReactNode } from "react";
import { cn } from "./utils";

export const advancedInputClass =
  "h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#4A6FA5]";

export const advancedSelectClass =
  "h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 pr-8 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#4A6FA5]";

export function AdvancedFilterPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {children}
      </div>
    </div>
  );
}

export function AdvancedFilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-[11px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function AdvancedFilterActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      {children}
    </div>
  );
}
