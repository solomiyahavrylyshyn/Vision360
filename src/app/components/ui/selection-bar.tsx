import * as React from "react";

type SelectionBarProps = {
  count: number;
  onDeselect: () => void;
  onInactivate?: () => void;
};

export function SelectionBar({ count, onDeselect, onInactivate }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center px-4 py-2.5 bg-[#EBF0F8] border-b border-[#C8D5E8]">
      <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>
        {count} selected
      </span>
      <div className="w-px h-4 bg-[#C8D5E8] mx-3" />
      <button
        onClick={onDeselect}
        className="text-[12px] text-[#4A6FA5] hover:underline"
        style={{ fontWeight: 500 }}
      >
        Deselect
      </button>
      {onInactivate && (
        <>
          <div className="w-px h-4 bg-[#C8D5E8] mx-3" />
          <button
            onClick={onInactivate}
            className="text-[12px] text-[#DC2626] flex items-center gap-1 hover:underline"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "14px" }}>block</span>
            Inactivate
          </button>
        </>
      )}
      <span className="text-[12px] text-[#8899AA] ml-3">(use ⋮ menu above for more actions)</span>
    </div>
  );
}
