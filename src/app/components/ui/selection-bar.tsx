import * as React from "react";

export type SelectionBarAction = {
  label: string;
  icon?: string;
  onClick: () => void;
  destructive?: boolean;
};

type SelectionBarProps = {
  count: number;
  onDeselect: () => void;
  actions?: SelectionBarAction[];
  /** Label for the dismiss button (default "Cancel"). */
  cancelLabel?: string;
};

/**
 * Bulk-selection toolbar shown above the table when one or more rows are
 * selected. Visual spec mirrors the Figma "Clients - bulk" macro:
 * - 60px tall, white background, sits as the toolbar row inside the
 *   bordered table card
 * - "{N} selected" on the left in primary-accent color
 * - Action buttons on the right (white surface with focus-ring shadow),
 *   then a 1px vertical divider, then the dismiss "Cancel" button
 */
export function SelectionBar({
  count,
  onDeselect,
  actions = [],
  cancelLabel = "Cancel",
}: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 h-[60px] bg-white border-b border-[#E5E7EB]">
      <span
        className="text-[14px] text-[#4A6FA5]"
        style={{ fontWeight: 600 }}
      >
        {count} selected
      </span>

      <span className="text-[#9CA3AF] text-[14px] select-none">·</span>

      <div className="flex items-center gap-2 flex-1">
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={a.onClick}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors"
            style={{ fontWeight: 500 }}
          >
            {a.icon && (
              <span
                className="material-icons"
                style={{ fontSize: "15px" }}
              >
                {a.icon}
              </span>
            )}
            {a.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[#E5E7EB]" />

      <button
        type="button"
        onClick={onDeselect}
        className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[14px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors"
        style={{ fontWeight: 500 }}
      >
        {cancelLabel}
      </button>
    </div>
  );
}
