import * as React from "react";

export interface DetailTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

interface DetailTabsProps<K extends string = string> {
  tabs: DetailTab<K>[];
  activeTab: K;
  onChange: (key: K) => void;
  /** Optional trailing slot rendered to the right (e.g. settings gear). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Unified detail-page tab bar — blue pill for the active tab, plain text
 * for inactive tabs. Used by every detail page (Client / Job / Estimate /
 * Invoice / Item / Payment / Expense) so they render identically.
 */
export function DetailTabs<K extends string = string>({
  tabs,
  activeTab,
  onChange,
  trailing,
  className,
}: DetailTabsProps<K>) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="shrink-0 whitespace-nowrap transition-colors rounded-lg"
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "#4A6FA5" : "transparent",
                color: isActive ? "#FFFFFF" : "#374151",
              }}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className="ml-1"
                  style={{
                    fontWeight: 400,
                    color: isActive ? "rgba(255,255,255,0.85)" : "#9CA3AF",
                  }}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {trailing}
    </div>
  );
}
