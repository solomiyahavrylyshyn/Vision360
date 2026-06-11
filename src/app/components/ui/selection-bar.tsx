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
  /** Render the dismiss control as an X icon — clears the selection in ONE
   * click (the header minus-checkbox takes two: select all, then deselect). */
  dismissAsIcon?: boolean;
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
  dismissAsIcon = false,
}: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-[#E5E7EB]">
      <span
        className="flex-1 text-[14px] leading-[20px] text-[#4A6FA5]"
        style={{ fontFamily: "Geist", fontWeight: 600 }}
      >
        {count} selected
      </span>

      <div className="flex items-center gap-3">
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={a.onClick}
            className="inline-flex items-center justify-center gap-2 min-h-9 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[14px] leading-[20px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            style={{ fontFamily: "Geist", fontWeight: 500 }}
          >
            {a.icon && (
              <span
                className="material-icons"
                style={{ fontSize: "16px" }}
              >
                {a.icon}
              </span>
            )}
            {a.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[#E5E7EB]" />

      {dismissAsIcon ? (
        <button
          type="button"
          onClick={onDeselect}
          aria-label="Clear selection"
          title="Clear selection"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#1A2332] hover:bg-[#F9FAFB] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onDeselect}
          className="inline-flex items-center justify-center min-h-9 px-4 py-2 rounded-lg text-[14px] leading-[20px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors"
          style={{ fontFamily: "Geist", fontWeight: 500 }}
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
}
