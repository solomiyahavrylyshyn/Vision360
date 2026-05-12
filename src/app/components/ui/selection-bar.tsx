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
};

export function SelectionBar({ count, onDeselect, actions = [] }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center px-4 py-2 bg-[#EBF0F8] border-b border-[#C8D5E8]">
      <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>
        {count} selected
      </span>

      {actions.length > 0 && <div className="w-px h-4 bg-[#C8D5E8] mx-3" />}

      <div className="flex items-center gap-1">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] transition-colors ${
              a.destructive
                ? "text-[#DC2626] hover:bg-[#FEE2E2]"
                : "text-[#1A2332] hover:bg-white"
            }`}
            style={{ fontWeight: 500 }}
          >
            {a.icon && (
              <span className="material-icons" style={{ fontSize: "14px" }}>
                {a.icon}
              </span>
            )}
            {a.label}
          </button>
        ))}
      </div>

      <button
        onClick={onDeselect}
        className="ml-auto text-[12px] text-[#4A6FA5] hover:underline"
        style={{ fontWeight: 500 }}
      >
        Deselect
      </button>
    </div>
  );
}
