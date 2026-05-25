import * as React from "react";
import { ColumnSettingsIcon } from "./column-settings-icon";

export interface DetailTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

interface DetailTabsProps<K extends string = string> {
  tabs: DetailTab<K>[];
  activeTab: K;
  onChange: (key: K) => void;
  /** Rendered inside the scrollable tabs row, right after the last tab (e.g. settings icon). */
  tabSuffix?: React.ReactNode;
  /** Rendered outside the scrollable tabs row, pushed to the far right (e.g. Create + kebab). */
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
  tabSuffix,
  trailing,
  className,
}: DetailTabsProps<K>) {
  return (
    <div className={`flex items-center ${className ?? ""}`}>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
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
        {tabSuffix}
      </div>
      {trailing && (
        <div className="shrink-0 flex items-center gap-1.5 pl-2">
          {trailing}
        </div>
      )}
    </div>
  );
}

export function TabSettingsButton({
  onClick,
  title = "Customize tabs",
}: {
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#9CA3AF] hover:text-[#1A2332] transition-colors shrink-0"
    >
      <ColumnSettingsIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
